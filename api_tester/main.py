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

class HttpMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    OPTIONS = "OPTIONS"
    HEAD = "HEAD"

class BodyType(str, Enum):
    NONE = "none"
    RAW = "raw"
    FORM_DATA = "form-data"
    URLENCODED = "x-www-form-urlencoded"
    BINARY = "binary"

class RawBodyFormat(str, Enum):
    JSON = "json"
    XML = "xml"
    HTML = "html"
    TEXT = "text"

class ApiRequest(BaseModel):
    method: HttpMethod
    url: str
    headers: Optional[Dict[str, str]] = {}
    query_params: Optional[Dict[str, str]] = {}
    body_type: BodyType = BodyType.NONE
    raw_body_format: Optional[RawBodyFormat] = None
    body: Optional[Any] = None
    form_data: Optional[Dict[str, str]] = {}
    auth: Optional[Dict[str, str]] = {}

class ApiResponse(BaseModel):
    request_id: str
    request: ApiRequest
    status_code: int
    headers: Dict[str, str]
    body: Any
    cookies: Dict[str, str]
    time_taken: float  # in milliseconds
    size: int  # response size in bytes
    timestamp: datetime

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

@app.post("/api/execute", response_model=ApiResponse)
async def execute_request(request: ApiRequest):
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    # Replace environment variables if they exist
    # This would be implemented to handle {{variable}} format
    
    # Build URL with query parameters
    url = request.url
    if request.query_params:
        # Append query params to URL
        if "?" not in url:
            url += "?"
        else:
            if not url.endswith("&") and not url.endswith("?"):
                url += "&"
        
        query_parts = []
        for key, value in request.query_params.items():
            if value:  # Only add if value is not empty
                query_parts.append(f"{key}={value}")
        
        url += "&".join(query_parts)
    
    # Prepare request
    headers = request.headers or {}
    
    # Handle authentication
    if request.auth:
        auth_type = request.auth.get("type")
        if auth_type == "basic":
            # Implement basic auth
            pass
        elif auth_type == "bearer":
            headers["Authorization"] = f"Bearer {request.auth.get('token', '')}"
        elif auth_type == "api_key":
            key_name = request.auth.get("key_name", "")
            key_value = request.auth.get("key_value", "")
            if request.auth.get("in") == "header":
                headers[key_name] = key_value
            else:  # in query
                if "?" not in url:
                    url += f"?{key_name}={key_value}"
                else:
                    url += f"&{key_name}={key_value}"
    
    # Execute the request
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            # Handle different body types
            data = None
            files = None
            json_data = None
            
            if request.body_type == BodyType.RAW and request.body:
                if request.raw_body_format == RawBodyFormat.JSON:
                    try:
                        json_data = request.body
                    except:
                        json_data = request.body  # Already in correct format
                else:
                    # Handle other raw formats (TEXT, XML, HTML)
                    data = request.body
            
            elif request.body_type == BodyType.FORM_DATA and request.form_data:
                # In a real implementation, this would handle file uploads too
                data = request.form_data
            
            elif request.body_type == BodyType.URLENCODED and request.form_data:
                data = request.form_data
            
            # Make the request
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                data=data,
                files=files,
                json=json_data,
                timeout=30.0  # 30 second timeout
            )
            
            # Calculate time taken
            time_taken = (time.time() - start_time) * 1000  # convert to ms
            
            # Convert headers to dict (httpx returns a Headers object)
            response_headers = dict(response.headers.items())
            
            # Get response size
            response_size = len(response.content)
            
            # Try to parse response body based on content type
            try:
                if "application/json" in response.headers.get("content-type", "").lower():
                    response_body = response.json()
                else:
                    response_body = response.text
            except:
                response_body = response.text
            
            # Get cookies
            cookies = dict(response.cookies)
            
            # Store in history
            api_response = ApiResponse(
                request_id=request_id,
                request=request,
                status_code=response.status_code,
                headers=response_headers,
                body=response_body,
                cookies=cookies,
                time_taken=time_taken,
                size=response_size,
                timestamp=datetime.now()
            )
            
            db.requests_history.append(api_response)
            
            return api_response
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/history", response_model=List[ApiResponse])
async def get_history():
    return db.requests_history

@app.post("/api/collections", response_model=Collection)
async def create_collection(collection: Collection):
    if not collection.id:
        collection.id = str(uuid.uuid4())
    db.collections[collection.id] = collection
    return collection

@app.get("/api/collections", response_model=List[Collection])
async def get_collections():
    return list(db.collections.values())

@app.get("/api/collections/{collection_id}", response_model=Collection)
async def get_collection(collection_id: str):
    if collection_id not in db.collections:
        raise HTTPException(status_code=404, detail="Collection not found")
    return db.collections[collection_id]

@app.post("/api/collections/{collection_id}/requests", response_model=SavedRequest)
async def add_request_to_collection(collection_id: str, request: SavedRequest):
    if collection_id not in db.collections:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if not request.id:
        request.id = str(uuid.uuid4())
    
    db.collections[collection_id].requests.append(request)
    return request

@app.post("/api/environments", response_model=Environment)
async def create_environment(environment: Environment):
    if not environment.id:
        environment.id = str(uuid.uuid4())
    db.environments[environment.id] = environment
    return environment

@app.get("/api/environments", response_model=List[Environment])
async def get_environments():
    return list(db.environments.values())

@app.get("/api/environments/{environment_id}", response_model=Environment)
async def get_environment(environment_id: str):
    if environment_id not in db.environments:
        raise HTTPException(status_code=404, detail="Environment not found")
    return db.environments[environment_id]

@app.put("/api/environments/{environment_id}", response_model=Environment)
async def update_environment(environment_id: str, environment: Environment):
    if environment_id not in db.environments:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    environment.id = environment_id
    db.environments[environment_id] = environment
    return environment

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

@app.post("/youtube/info")
async def showThumbnail(request: Request):
    try:
        body = await request.body()
        body = json.loads(body)

        ydl_opts = {
            'format': 'best',  # Download the best quality available
            'outtmpl': 'test.mp4',  # Save file with the video title as the filename
        }
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(body["url"], download=False)
            #print(info.get('formats', []))
            #print(info.get('formats', []))

            def safe_format(format_entry):
                print(format_entry.get('acodec'))
                return {
                    key: value for key, value in {
                        'format_id': format_entry.get('format_id'),
                        'ext': format_entry.get('ext'),
                        'resolution': format_entry.get('resolution'),
                        'fps': format_entry.get('fps'),
                        'filesize': format_entry.get('filesize'),
                        'format_note': format_entry.get('format_note'),
                        'height': format_entry.get('height'),
                        'width': format_entry.get('width'),
                        'url': format_entry.get('url'),
                        'acodec': format_entry.get('acodec'),
                        'vcodec': format_entry.get('vcodec'),
                    }.items() if value is not None
                }
            video_info = {
                'id': info.get('id'),
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
                'formats': [safe_format(f) for f in info.get('formats', []) if f.get('acodec') not in ['none', None]],
                'upload_date': info.get('upload_date'),
                'uploader': info.get('uploader'),
                'view_count': info.get('view_count'),
            }

    except Exception as e: 
        print(e)
    return video_info

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


@app.post("/svg-convert")
async def convert_image_to_svg_main(
    image_file: UploadFile = File(...),
    threshold: int = Form(128, description="Threshold (0-255)"),
    simplify: float = Form(2.0, description="Simplification level (0-10)"),
    smoothing: int = Form(5, description="Smoothing level (0-10)"),
    edge_detection: bool = Form(False, description="Apply edge detection"),
    fill_color: str = Form("black", description="SVG fill color"),
):
    return await convert_image_to_svg(image_file=image_file, threshold=threshold, simplify=simplify,
                                      smoothing=smoothing, edge_detection=edge_detection, fill_color=fill_color)

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