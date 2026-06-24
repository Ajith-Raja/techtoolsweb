
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET
from typing import Dict, Optional, Set
import asyncio

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SitemapNode:
    def __init__(self, url: str, label: str, type: str = 'page'):
        self.url = url
        self.label = label
        self.children = []
        self.type = type
        self.level = 0

def get_url_type(url: str) -> str:
    lower_url = url.lower()
    if any(ext in lower_url for ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg']):
        return 'image'
    elif any(ext in lower_url for ext in ['.mp4', '.webm', '.avi', '.mov']):
        return 'video'
    elif any(ext in lower_url for ext in ['.pdf', '.doc', '.docx', '.xls', '.xlsx']):
        return 'file'
    return 'page'


REQUEST_HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xml,text/xml;q=0.9,*/*;q=0.8'
}


def normalize_base_url(input_url: str) -> str:
    parsed = urlparse(input_url)
    if not parsed.scheme:
        input_url = f"https://{input_url}"
        parsed = urlparse(input_url)
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail='Invalid URL provided')
    return f"{parsed.scheme}://{parsed.netloc}"


def fetch_url(url: str) -> requests.Response:
    return requests.get(
        url,
        headers=REQUEST_HEADERS,
        timeout=20,
        allow_redirects=True
    )


def extract_sitemaps_from_robots(base_url: str) -> Set[str]:
    sitemap_urls: Set[str] = set()
    robots_url = urljoin(base_url, '/robots.txt')
    try:
        response = fetch_url(robots_url)
        if response.status_code == 200:
            for line in response.text.splitlines():
                if line.lower().startswith('sitemap:'):
                    sitemap_url = line.split(':', 1)[1].strip()
                    if sitemap_url:
                        sitemap_urls.add(sitemap_url)
    except requests.RequestException:
        pass
    return sitemap_urls


def candidate_sitemap_urls(input_url: str) -> list[str]:
    parsed = urlparse(input_url)
    base_url = normalize_base_url(input_url)

    candidates: list[str] = []
    if parsed.path and parsed.path != '/':
        candidates.append(input_url)

    candidates.extend([
        urljoin(base_url, '/sitemap.xml'),
        urljoin(base_url, '/sitemap_index.xml'),
        urljoin(base_url, '/wp-sitemap.xml')
    ])

    candidates.extend(sorted(extract_sitemaps_from_robots(base_url)))

    # Keep order stable while deduplicating.
    unique_candidates = list(dict.fromkeys(candidates))
    return unique_candidates


def parse_xml_urls(xml_bytes: bytes) -> list[str]:
    tree = ET.fromstring(xml_bytes)
    namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    urls = tree.findall('.//ns:loc', namespace) or tree.findall('.//loc')
    return [u.text.strip() for u in urls if u.text and u.text.strip()]


def collect_urls_from_sitemap(start_url: str, max_sitemaps: int = 30) -> list[str]:
    queue = [start_url]
    visited: Set[str] = set()
    collected_urls: list[str] = []

    while queue and len(visited) < max_sitemaps:
        sitemap_url = queue.pop(0)
        if sitemap_url in visited:
            continue

        visited.add(sitemap_url)
        try:
            response = fetch_url(sitemap_url)
        except requests.RequestException:
            continue

        if response.status_code != 200:
            continue

        try:
            loc_urls = parse_xml_urls(response.content)
        except ET.ParseError:
            continue

        for loc in loc_urls:
            loc_lower = loc.lower()
            if loc_lower.endswith('.xml') or 'sitemap' in loc_lower:
                queue.append(loc)
            else:
                collected_urls.append(loc)

    return list(dict.fromkeys(collected_urls))


def build_tree_from_urls(root_url: str, urls: list[str], max_depth: int) -> Dict:
    domain = urlparse(root_url).netloc
    root = SitemapNode(url=root_url, label=domain)

    for full_url in urls:
        parsed = urlparse(full_url)
        if parsed.netloc and parsed.netloc != domain:
            continue

        path = parsed.path
        segments = [s for s in path.split('/') if s]
        if not segments:
            continue

        current = root
        depth_segments = segments[:max_depth]

        for i, segment in enumerate(depth_segments):
            url_type = get_url_type(segment)
            node = SitemapNode(
                url=urljoin(root_url, '/'.join(depth_segments[:i + 1])),
                label=segment,
                type=url_type if i == len(depth_segments) - 1 else 'page'
            )
            node.level = i + 1

            exists = False
            for child in current.children:
                if child.label == segment:
                    current = child
                    exists = True
                    break

            if not exists:
                current.children.append(node)
                current = node

    def node_to_dict(node: SitemapNode):
        return {
            'url': node.url,
            'label': node.label,
            'type': node.type,
            'level': node.level,
            'children': [node_to_dict(child) for child in node.children]
        }

    return node_to_dict(root)

async def parse_sitemap(url: str, max_depth: int = 3) -> Dict:
    try:
        normalized_base = normalize_base_url(url)

        sitemap_candidates = await asyncio.to_thread(candidate_sitemap_urls, url)
        all_urls: list[str] = []

        for sitemap_url in sitemap_candidates:
            sitemap_urls = await asyncio.to_thread(collect_urls_from_sitemap, sitemap_url)
            if sitemap_urls:
                all_urls.extend(sitemap_urls)

        if all_urls:
            return build_tree_from_urls(normalized_base, all_urls, max_depth)

        # Fallback: parse page links from the provided URL if no sitemap could be discovered.
        response = await asyncio.to_thread(fetch_url, url)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="No sitemap found and URL is not directly accessible")

        soup = BeautifulSoup(response.content, 'html.parser')
        discovered_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.startswith('/') or href.startswith(normalized_base):
                discovered_links.append(urljoin(normalized_base, href))

        if not discovered_links:
            raise HTTPException(status_code=404, detail="No sitemap or crawlable links found")

        return build_tree_from_urls(normalized_base, discovered_links, max_depth)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sitemap/analyze")
async def analyze_sitemap(url: str, max_depth: Optional[int] = 3):
    result = await parse_sitemap(url, max_depth)
    return result

def run_api_server():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    run_api_server()
