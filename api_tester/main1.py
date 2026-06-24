from concurrent.futures import ThreadPoolExecutor
from contentgap import ContentGapAnalyzer
from pageauthority import calculate_page_authority
from fastapi import FastAPI, HTTPException, Request, Depends, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, List, Optional, Any, Union
import httpx
import json
import time
from datetime import datetime
import uuid
from enum import Enum
import os
import whois
import socket
from readabilitychecker import analyze_readability
from helper import get_text_from_url
from keyword_density_checker import keyword_density
from seoanalysis import analyze_seo
import logging
from pydantic import BaseModel, HttpUrl, validator
from yt_dlp import YoutubeDL
import re
from qr_code_api import get_styles, generate_qr_code
from image_to_svg_api import convert_image_to_svg
from sitemap_visualizer_api import analyze_sitemap
from instagram_downloader_api import (
    InstagramDownloadRequest,
    get_instagram_media_info,
    download_instagram_media,
)
from plagarism import check_plagiarism_using_text
from prelaunchaudit import crawlSite

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="API Testing Tool", description="A FastAPI backend for a Postman-like API testing tool")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include the share service router
try:
    from share_service import router as share_router
    app.include_router(share_router, prefix="/api", tags=["sharing"])
    print("API sharing endpoints enabled")
except ImportError as e:
    print(f"Warning: API sharing endpoints not available: {e}")

# In-memory storage (would be replaced with database in production)
class InMemoryDB:
    def __init__(self):
        self.requests_history = []
        self.collections = {}
        self.environments = {}

db = InMemoryDB()

class SavedRequest(BaseModel):
    id: str
    name: str
    request: ApiRequest

class Collection(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    requests: List[SavedRequest] = []

class Environment(BaseModel):
    id: str
    name: str
    variables: Dict[str, str] = {}

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

class AuditIssue(BaseModel):
    severity: str  # high, medium, low
    category: str  # seo, performance, accessibility, best-practices, security
    issue: str
    description: str
    impact: str
    recommendation: str

class AuditCategoryScore(BaseModel):
    category: str
    score: int
    pass_count: int
    fail_count: int
    warning_count: int
    issues: List[AuditIssue]

class PreLaunchAuditResponse(BaseModel):
    url: str
    overall_score: int
    categories: List[AuditCategoryScore]
    critical_issues: List[AuditIssue]
    recommendations: List[Dict[str, str]]
    audit_timestamp: str

class PreLaunchAuditRequest(BaseModel):
    url: str
    
    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

@app.get("/")
async def root():
    return {"message": "API Testing Tool API is running"}

@app.get("/s/{share_id}")
async def redirect_to_shared_request(share_id: str, request: Request):
    """
    Redirect to the API Tester UI with the shared request ID
    """
    # Get the base URL from the request
    base_url = str(request.base_url)
    if base_url.endswith("/"):
        base_url = base_url[:-1]  # Remove trailing slash
    
    # Frontend URL with the shared ID
    frontend_url = f"{base_url}/api-tester?share={share_id}"
    
    # Redirect to the frontend
    return RedirectResponse(url=frontend_url)

def fetch_whois(domain):
    return whois.whois(domain)

def calculate_age(created_date):
    current_date = datetime.now()
    delta = current_date - created_date
    
    years = delta.days // 365
    months = (delta.days % 365) // 30
    days = (delta.days % 365) % 30
    
    return f"{years} Years {months} Months {days} Days"


@app.post("/api/domain-age")
async def get_domainage(request: Request):
    
    body = await request.body()
    body = json.loads(body)
    domain_data = []
    domains = body["domains"]
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(fetch_whois, domains))
    for w in results:
        updated_date = w["updated_date"]
        if isinstance(updated_date, list):
            updated_date = updated_date[0]
        dname = w["domain_name"]
        if isinstance(dname, list):
            dname = dname[0]
        ip_address = socket.gethostbyname(dname)
            
        cdate = w["creation_date"]
        if isinstance(cdate, list):
            cdate = cdate[0]
        edate = w["expiration_date"]
        if isinstance(edate, list):
            edate = edate[0]
        nameservers = w["name_servers"]
        if len(nameservers) >= 2:
            nameservers = ", ".join(nameservers[:2])
        elif len(nameservers) > 0:
            nameservers = nameservers[0]
        else:
            nameservers = "No nameservers found"
        domain_info = {
            "domain": dname.lower(),
            "createdDate": cdate.strftime("%Y-%m-%d %H:%M:%S"),
            "expiryDate": edate.strftime("%Y-%m-%d %H:%M:%S"),
            "lastUpdated": updated_date.strftime("%Y-%m-%d %H:%M:%S"),
            "age": calculate_age(cdate),
            "registrar": w["registrar"],
            "ipAddress": ip_address,
            "nameServers": nameservers
        }
        domain_data.append(domain_info)

    return domain_data

@app.post("/api/readability/")
async def readability_checker(request: Request):
    body = await request.body()
    body = json.loads(body)
    if body["type"] == "url" :
        content = get_text_from_url(body['value'])
    else:
        content = body['value']
    result = analyze_readability(content)

    return result

@app.post("/api/keyword-density/")
async def keyworddensity_checker(request: Request):
    body = await request.body()
    body = json.loads(body)

    if body["type"] == "url" :
        content = get_text_from_url(body['value'])
        print(content)
    else:
        content = body['value']
    result = keyword_density(content, user_focus_keyword=body["keywords"])

    return result

@app.post("/api/domain-authority/")
async def domainauthority_checker(request: Request):
    body = await request.body()
    body = json.loads(body)

    content = calculate_page_authority(body['url'])

    return content

@app.post("/api/content-gap-analyzer/")
async def contentgap_checker(request: Request):
    body = await request.body()
    body = json.loads(body)
    analyzer = ContentGapAnalyzer()

    print(body)

    result = analyzer.analyze_content_gaps(body['yourDomain'], body['competitorDomains'])
    return result

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

@app.get("/qr-styles")
async def get_qrstyles():
   return await get_styles()


@app.post("/instagram/info")
async def instagram_info(request: InstagramDownloadRequest):
    return get_instagram_media_info(request)


@app.post("/instagram/download")
async def instagram_download(request: InstagramDownloadRequest):
    return download_instagram_media(request)

@app.post("/generate-qr")
async def generate_qr(
    data: str = Form(...),
    size: int = Form(10),
    border: int = Form(4),
    error_correction: str = Form("M"),
    fill_color: str = Form("#000000"),
    back_color: str = Form("#FFFFFF"),
    module_drawer: str = Form("square"),
    color_mask: str = Form("solid"),
    gradient_start: Optional[str] = Form(None),
    gradient_end: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
):
    return await generate_qr_code(data=data, size=size, border=border, error_correction=error_correction,
                     fill_color=fill_color, back_color=back_color, module_drawer=module_drawer,
                     color_mask=color_mask, gradient_start=gradient_start, gradient_end=gradient_end,
                     logo=logo)

@app.post("/api/sitemap/analyze")
async def analyze_sitemap_main(url: str, max_depth: Optional[int] = 3):
    return await analyze_sitemap(url, max_depth)

@app.post("/api/plagiarism-check", description="Health check endpoint")
async def plagiarism_checker(request: Request):
    body = await request.body()
    data = body.decode()
    data = json.loads(data)
    print(data["text"])
    #data = json.loads(data)
    plagiarism_results, unique, plagiarized, highlighted_content = check_plagiarism_using_text(data["text"])
    print(plagiarism_results)
    return {"originalText": data["text"], "matchedSources": plagiarism_results, "unique": unique, "plagiarized": plagiarized, "highlightedText": highlighted_content, "similarityScore": 10, "uniquenessPercentage": 90, "analyzedLength": 10}



@app.post("/api/prelaunch-audit") #, response_model=PreLaunchAuditResponse
async def perform_prelaunch_audit(request: PreLaunchAuditRequest, is_premium: bool = False):
    """Perform a comprehensive pre-launch audit for a website.
    
    Premium users get more detailed results and recommendations.
    """
    #return ""
    result = crawlSite(request.url)
    print(result)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)