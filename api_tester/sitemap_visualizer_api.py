
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional
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

async def parse_sitemap(url: str, max_depth: int = 3) -> Dict:
    try:
        response = await asyncio.to_thread(requests.get, url)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Sitemap not found")

        root = None
        try:
            # Try parsing as XML
            tree = ET.fromstring(response.content)
            namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            urls = tree.findall('.//ns:loc', namespace) or tree.findall('.//loc')
            
            # Create root node
            domain = urlparse(url).netloc
            root = SitemapNode(url=url, label=domain)
            
            for url_elem in urls:
                full_url = url_elem.text
                if full_url:
                    path = urlparse(full_url).path
                    segments = [s for s in path.split('/') if s]
                    
                    current = root
                    for i, segment in enumerate(segments[:max_depth]):
                        url_type = get_url_type(segment)
                        node = SitemapNode(
                            url=urljoin(url, '/'.join(segments[:i+1])),
                            label=segment,
                            type=url_type if i == len(segments) - 1 else 'page'
                        )
                        node.level = i + 1
                        
                        # Check if node already exists
                        exists = False
                        for child in current.children:
                            if child.label == segment:
                                current = child
                                exists = True
                                break
                        
                        if not exists:
                            current.children.append(node)
                            current = node

        except ET.ParseError:
            # If XML parsing fails, try HTML parsing
            soup = BeautifulSoup(response.content, 'html.parser')
            domain = urlparse(url).netloc
            root = SitemapNode(url=url, label=domain)
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                if href.startswith('/') or href.startswith(url):
                    full_url = urljoin(url, href)
                    path = urlparse(full_url).path
                    segments = [s for s in path.split('/') if s]
                    
                    current = root
                    for i, segment in enumerate(segments[:max_depth]):
                        url_type = get_url_type(segment)
                        node = SitemapNode(
                            url=urljoin(url, '/'.join(segments[:i+1])),
                            label=segment,
                            type=url_type if i == len(segments) - 1 else 'page'
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

        def node_to_dict(node):
            return {
                'url': node.url,
                'label': node.label,
                'type': node.type,
                'level': node.level,
                'children': [node_to_dict(child) for child in node.children]
            }

        return node_to_dict(root)

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
