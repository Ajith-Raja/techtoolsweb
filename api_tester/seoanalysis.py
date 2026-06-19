"""
SEO Analyzer API

This module provides a FastAPI server with functionality to analyze websites for SEO performance.
The analysis includes meta tags, header structure, content quality, technical SEO, and more.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import re
import ssl
import socket
from urllib.parse import urlparse
import time
import os
from typing import Dict, List, Optional, Any, Union
import logging
from pydantic import BaseModel, HttpUrl, validator
import uvicorn
import urllib3
import certifi
from pagespeed import measure_page_speed_with_google

# Suppress insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="SEO Analyzer API", description="API for analyzing website SEO performance")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class AnalyzeUrlRequest(BaseModel):
    url: str

    @validator('url')
    def validate_url(cls, v):
        # Make sure the URL has a scheme
        if not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

class KeywordResult(BaseModel):
    keyword: str
    count: int
    density: float

class RecommendationItem(BaseModel):
    issue: str
    severity: str  # 'high', 'medium', 'low'
    impact: str
    solution: str

class MetaTags(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None
    robots: Optional[str] = None
    viewport: Optional[str] = None
    ogTags: Dict[str, Optional[str]]
    hasTitle: bool
    hasDescription: bool
    titleLength: int
    descriptionLength: int
    isOptimized: bool

class Headers(BaseModel):
    h1Count: int
    h2Count: int
    h3Count: int
    hasH1: bool
    headerStructure: str
    isHierarchyCorrect: bool

class ContentQuality(BaseModel):
    hasImages: bool
    hasLinks: bool
    internalLinksCount: int
    externalLinksCount: int

class ContentAnalysis(BaseModel):
    wordCount: int
    hasEnoughContent: bool
    paragraphCount: int
    averageSentenceLength: int
    readabilityScore: float
    keywordDensity: Dict[str, float]
    contentQuality: ContentQuality

class TechnicalSEO(BaseModel):
    mobileResponsive: bool
    hasSSL: bool
    hasSitemap: bool
    hasRobotsTxt: bool
    loadTime: str
    pageSize: str
    imagesOptimized: bool

class SeoAnalysisResult(BaseModel):
    score: int
    metaTags: MetaTags
    headers: Headers
    contentAnalysis: ContentAnalysis
    technicalSeo: TechnicalSEO
    recommendations: List[RecommendationItem]

# Helper functions for SEO analysis
def calculate_readability_score(text: str) -> float:
    """Calculate readability score using Flesch Reading Ease."""
    words = text.split()
    if not words:
        return 50.0  # Default value
    
    # Count sentences (based on periods, exclamation marks, question marks)
    sentence_count = len(re.findall(r'[.!?]+', text)) or 1
    word_count = len(words)
    
    # Simplified formula for Flesch Reading Ease
    avg_words_per_sentence = word_count / sentence_count
    score = 206.835 - (1.015 * avg_words_per_sentence)
    
    # Normalize score to range 0-100
    return max(0, min(100, score))

def get_page_size(html_content: str) -> str:
    """Calculate page size in KB."""
    byte_size = len(html_content.encode('utf-8'))
    kb_size = byte_size / 1024
    return f"{kb_size:.1f} KB"

def estimate_load_time(url: str) -> str:
    """Estimate load time based on page size."""
    # Assuming 5Mbps connection (conservative mobile speed)
    mbps = 5
    # Convert bytes to bits and calculate time in seconds
    #mobile, mobiless, mobilesi, fcpm, lcpm, tbtm, clsm = measure_page_speed_with_google(url, 'mobile')
    desktop, desktopss, desktopsi, fcpd, lcpd, tbtd, clsd = measure_page_speed_with_google(url, 'desktop')
    
    return f"{desktopsi}"

def check_ssl(url: str) -> bool:
    """Check if the site has SSL."""
    parse_result = urlparse(url)
    return parse_result.scheme == 'https'

def check_for_sitemap(url: str, html_content: str) -> bool:
    """Check if the site has a sitemap."""
    # Check if sitemap is mentioned in HTML
    if 'sitemap.xml' in html_content:
        return True
    
    # Try to access sitemap.xml directly
    domain = urlparse(url).netloc
    scheme = urlparse(url).scheme
    try:
        sitemap_url = f"{scheme}://{domain}/sitemap.xml"
        response = requests.get(sitemap_url, timeout=5, verify=False)
        return response.status_code == 200
    except:
        return False

def check_for_robots_txt(url: str) -> bool:
    """Check if the site has a robots.txt file."""
    domain = urlparse(url).netloc
    scheme = urlparse(url).scheme
    try:
        robots_url = f"{scheme}://{domain}/robots.txt"
        response = requests.get(robots_url, timeout=5, verify=False)
        return response.status_code == 200
    except:
        return False

def extract_keywords(text: str, stop_words: List[str], min_length: int = 4) -> Dict[str, float]:
    """Extract keyword frequency and density from text."""
    # Clean the text and split into words
    clean_text = re.sub(r'[^\w\s]', ' ', text.lower())
    words = clean_text.split()
    
    if not words:
        return {}
    
    # Remove stop words and short words
    filtered_words = [word for word in words if word not in stop_words and len(word) >= min_length]
    
    # Count frequency
    word_count = {}
    for word in filtered_words:
        if word in word_count:
            word_count[word] += 1
        else:
            word_count[word] = 1
    
    # Calculate density
    total_words = len(words)
    keyword_density = {word: (count / total_words) * 100 for word, count in word_count.items()}
    
    # Sort by frequency and get top keywords
    sorted_keywords = sorted(keyword_density.items(), key=lambda x: x[1], reverse=True)
    top_keywords = dict(sorted_keywords[:10])
    
    return top_keywords

def check_images_optimized(soup: BeautifulSoup) -> bool:
    """Check if images have alt text."""
    images = soup.find_all('img')
    if not images:
        return True  # No images to optimize
    
    images_with_alt = 0
    for img in images:
        if img.get('alt'):
            images_with_alt += 1
    
    # Return True if at least 80% of images have alt text
    return images_with_alt / len(images) >= 0.8 if images else True

def analyze_seo(url: str) -> SeoAnalysisResult:
    """Main function to analyze SEO for a website."""
    try:
        # Start time for performance measurement
        start_time = time.time()
        
        # Ensure URL has scheme
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Fetch the web page
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10, verify=False)
        response.raise_for_status()
        
        html_content = response.text
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Performance timing
        fetch_time = time.time() - start_time
        
        # Extract meta information
        title_tag = soup.find('title')
        meta_title = title_tag.text if title_tag else ""
        
        meta_description_tag = soup.find('meta', attrs={'name': 'description'})
        meta_description = meta_description_tag.get('content', '') if meta_description_tag else ""
        
        meta_keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
        meta_keywords = meta_keywords_tag.get('content', '') if meta_keywords_tag else ""
        
        meta_robots_tag = soup.find('meta', attrs={'name': 'robots'})
        meta_robots = meta_robots_tag.get('content', '') if meta_robots_tag else ""
        
        meta_viewport_tag = soup.find('meta', attrs={'name': 'viewport'})
        meta_viewport = meta_viewport_tag.get('content', '') if meta_viewport_tag else ""
        
        # Open Graph tags
        og_title_tag = soup.find('meta', attrs={'property': 'og:title'})
        og_title = og_title_tag.get('content', '') if og_title_tag else None
        
        og_description_tag = soup.find('meta', attrs={'property': 'og:description'})
        og_description = og_description_tag.get('content', '') if og_description_tag else None
        
        og_image_tag = soup.find('meta', attrs={'property': 'og:image'})
        og_image = og_image_tag.get('content', '') if og_image_tag else None
        
        # Header analysis
        h1_tags = soup.find_all('h1')
        h2_tags = soup.find_all('h2')
        h3_tags = soup.find_all('h3')
        
        h1_count = len(h1_tags)
        h2_count = len(h2_tags)
        h3_count = len(h3_tags)
        
        has_h1 = h1_count > 0
        
        # Check header hierarchy
        is_hierarchy_correct = True
        header_structure = "Properly nested"
        
        if h1_count == 0:
            is_hierarchy_correct = False
            header_structure = "Missing H1 tag"
        elif h1_count > 1:
            is_hierarchy_correct = False
            header_structure = "Multiple H1 tags found"
        
        # Content analysis
        # Remove script and style tags for accurate content analysis
        for script in soup(["script", "style"]):
            script.extract()
        
        body_text = soup.get_text()
        # Clean the text (remove extra whitespace)
        clean_text = re.sub(r'\s+', ' ', body_text).strip()
        
        words = clean_text.split()
        word_count = len(words)
        
        # Count paragraphs
        paragraph_tags = soup.find_all('p')
        paragraph_count = len(paragraph_tags)
        
        # Calculate average sentence length
        sentences = re.split(r'[.!?]+', clean_text)
        sentence_count = len([s for s in sentences if s.strip()])
        avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0
        
        # Calculate readability score
        readability_score = calculate_readability_score(clean_text)
        
        # Keyword density
        stop_words = [
            "the", "and", "a", "to", "in", "of", "it", "is", "I", "that", "had", "on",
            "for", "were", "was", "you", "with", "be", "at", "this", "have", "from",
            "or", "not", "by", "but", "what", "all", "when", "if", "their", "will",
            "can", "so", "no", "as", "an", "are", "they", "there", "has", "been",
            "who", "would", "could", "should", "do", "than", "our", "my", "we", "us"
        ]
        
        keyword_density = extract_keywords(clean_text, stop_words)
        
        # Content quality checks
        images = soup.find_all('img')
        has_images = len(images) > 0
        
        links = soup.find_all('a')
        has_links = len(links) > 0
        
        # Count internal vs external links
        domain = urlparse(url).netloc
        internal_links = 0
        external_links = 0
        
        for link in links:
            href = link.get('href', '')
            if href and not href.startswith('#') and not href.startswith('javascript:'):
                if domain in href or href.startswith('/'):
                    internal_links += 1
                elif href.startswith(('http://', 'https://')):
                    external_links += 1
        
        # Technical SEO checks
        has_ssl = check_ssl(url)
        has_sitemap = check_for_sitemap(url, html_content)
        has_robots_txt = check_for_robots_txt(url)
        
        # Check if mobile responsive
        is_mobile_responsive = meta_viewport and ('width=device-width' in meta_viewport or 'initial-scale=1' in meta_viewport)
        
        # Page size and load time
        page_size = get_page_size(html_content)
        load_time = estimate_load_time(url)
        
        # Check if images are optimized
        images_optimized = check_images_optimized(soup)
        
        # Generate recommendations
        recommendations = []
        
        # Add recommendations based on findings
        if not meta_title or len(meta_title) < 10:
            recommendations.append({
                "issue": "Missing or short meta title",
                "severity": "high",
                "impact": "Reduces visibility in search results",
                "solution": "Add a descriptive title between 50-60 characters"
            })
        elif len(meta_title) > 60:
            recommendations.append({
                "issue": "Meta title too long",
                "severity": "medium",
                "impact": "Title may be truncated in search results",
                "solution": "Shorten title to 50-60 characters"
            })
        
        if not meta_description:
            recommendations.append({
                "issue": "Missing meta description",
                "severity": "high",
                "impact": "Reduces click-through rates from search results",
                "solution": "Add a compelling meta description between 120-160 characters"
            })
        elif len(meta_description) < 100:
            recommendations.append({
                "issue": "Meta description too short",
                "severity": "medium",
                "impact": "May not provide enough context for users",
                "solution": "Expand description to 120-160 characters"
            })
        elif len(meta_description) > 160:
            recommendations.append({
                "issue": "Meta description too long",
                "severity": "low",
                "impact": "Description may be truncated in search results",
                "solution": "Shorten description to 120-160 characters"
            })
        
        if h1_count == 0:
            recommendations.append({
                "issue": "Missing H1 tag",
                "severity": "high",
                "impact": "Search engines may not identify the main topic",
                "solution": "Add a single H1 tag with your primary keyword"
            })
        elif h1_count > 1:
            recommendations.append({
                "issue": "Multiple H1 tags",
                "severity": "high",
                "impact": "Confuses search engines about main topic",
                "solution": "Keep only one H1 tag that clearly describes the page content"
            })
        
        if not has_ssl:
            recommendations.append({
                "issue": "No SSL certificate",
                "severity": "high",
                "impact": "Negative impact on rankings and user trust",
                "solution": "Implement HTTPS across your entire site"
            })
        
        if word_count < 300:
            recommendations.append({
                "issue": "Thin content",
                "severity": "medium",
                "impact": "May be seen as low value by search engines",
                "solution": "Expand content to at least 500 words with valuable information"
            })
        
        if not images_optimized:
            recommendations.append({
                "issue": "Images missing alt text",
                "severity": "medium",
                "impact": "Missed opportunity for image search and accessibility",
                "solution": "Add descriptive alt text to all images"
            })
        
        if not is_mobile_responsive:
            recommendations.append({
                "issue": "Not mobile-friendly",
                "severity": "high",
                "impact": "Negative impact in mobile-first indexing",
                "solution": "Implement responsive design with proper viewport meta tag"
            })
        
        # Check page size
        if len(html_content.encode('utf-8')) > 100000:
            recommendations.append({
                "issue": "Large page size",
                "severity": "medium",
                "impact": "Slower loading times affect user experience and rankings",
                "solution": "Optimize HTML, minimize CSS/JS, compress images"
            })
        
        if not has_sitemap:
            recommendations.append({
                "issue": "Missing sitemap",
                "severity": "medium",
                "impact": "Makes it harder for search engines to discover all pages",
                "solution": "Generate and submit an XML sitemap"
            })
        
        if external_links == 0:
            recommendations.append({
                "issue": "No external links",
                "severity": "low",
                "impact": "Missed opportunity for topic relevance signals",
                "solution": "Add links to authoritative external resources"
            })
        
        # Calculate overall score
        score_base = 100
        deductions = 0
        
        # Deduct for issues based on severity
        high_severity_issues = len([r for r in recommendations if r["severity"] == "high"])
        medium_severity_issues = len([r for r in recommendations if r["severity"] == "medium"])
        low_severity_issues = len([r for r in recommendations if r["severity"] == "low"])
        
        deductions += high_severity_issues * 10
        deductions += medium_severity_issues * 5
        deductions += low_severity_issues * 2
        
        final_score = max(0, min(100, score_base - deductions))
        
        # Build the analysis result
        result = {
            "score": final_score,
            "metaTags": {
                "title": meta_title,
                "description": meta_description,
                "keywords": meta_keywords,
                "robots": meta_robots,
                "viewport": meta_viewport,
                "ogTags": {
                    "title": og_title,
                    "description": og_description,
                    "image": og_image
                },
                "hasTitle": bool(meta_title),
                "hasDescription": bool(meta_description),
                "titleLength": len(meta_title),
                "descriptionLength": len(meta_description),
                "isOptimized": bool(meta_title) and bool(meta_description) and 
                                len(meta_title) >= 40 and len(meta_title) <= 60 and 
                                len(meta_description) >= 120 and len(meta_description) <= 160
            },
            "headers": {
                "h1Count": h1_count,
                "h2Count": h2_count,
                "h3Count": h3_count,
                "hasH1": has_h1,
                "headerStructure": header_structure,
                "isHierarchyCorrect": is_hierarchy_correct
            },
            "contentAnalysis": {
                "wordCount": word_count,
                "hasEnoughContent": word_count >= 300,
                "paragraphCount": paragraph_count,
                "averageSentenceLength": round(avg_sentence_length),
                "readabilityScore": round(readability_score, 1),
                "keywordDensity": keyword_density,
                "contentQuality": {
                    "hasImages": has_images,
                    "hasLinks": has_links,
                    "internalLinksCount": internal_links,
                    "externalLinksCount": external_links
                }
            },
            "technicalSeo": {
                "mobileResponsive": is_mobile_responsive,
                "hasSSL": has_ssl,
                "hasSitemap": has_sitemap,
                "hasRobotsTxt": has_robots_txt,
                "loadTime": load_time,
                "pageSize": page_size,
                "imagesOptimized": images_optimized
            },
            "recommendations": recommendations
        }
        
        return result
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

# Store the last analysis result
last_analysis_result = None

@app.post("/api/analyze", response_model=dict)
async def analyze_url(request: AnalyzeUrlRequest):
    """Analyze a URL for SEO performance."""
    global last_analysis_result
    try:
        result = analyze_seo(request.url)
        # Store the result for later retrieval
        last_analysis_result = result
        return result
    except Exception as e:
        logger.error(f"Error in analyze_url: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lastAnalysis")
async def get_last_analysis():
    """Get the last SEO analysis result."""
    global last_analysis_result
    print(last_analysis_result)
    if not last_analysis_result:
        raise HTTPException(status_code=404, detail="No analysis data available. Please analyze a URL first.")
    return last_analysis_result

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

def run_api_server():
    """Run the FastAPI server"""
    port = int(os.environ.get("SEO_API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    run_api_server()