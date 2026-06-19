"""
Domain Authority API

This module provides a FastAPI server for checking domain authority metrics.
It includes endpoints for checking domain authority, spam score, backlinks, and more.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import random
import logging
from pydantic import BaseModel, validator
import uvicorn
import os
from typing import List, Dict, Optional, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Domain Authority API", description="API for checking domain authority metrics")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Models
class DomainAuthorityRequest(BaseModel):
    url: str
    
    @validator('url')
    def validate_url(cls, v):
        # Make sure the URL has a scheme
        if not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

class BacklinkInfo(BaseModel):
    url: str
    domain: str
    anchor_text: str
    page_authority: int
    
class DomainAuthorityResponse(BaseModel):
    domain: str
    domain_authority: int
    page_authority: int
    spam_score: int
    linking_domains: int
    total_backlinks: int
    top_keywords: List[str]
    top_backlinks: List[BacklinkInfo]

# Store the last analysis result
last_analysis_result = None

@app.post("/api/domain-authority", response_model=DomainAuthorityResponse)
async def check_domain_authority(request: DomainAuthorityRequest):
    """Check domain authority metrics for a URL."""
    global last_analysis_result
    try:
        # Extract domain from URL
        parsed_url = urlparse(request.url)
        domain = parsed_url.netloc
        
        if domain == "":
            domain = request.url.split("/")[0]
        
        # In a production environment, you would call a real API like Moz, Ahrefs, etc.
        # For this demo, we'll generate realistic data
        
        # Generate domain authority (0-100)
        domain_authority = random.randint(10, 90)
        
        # Generate page authority (usually slightly different from DA)
        page_authority = max(1, min(100, domain_authority + random.randint(-10, 10)))
        
        # Generate spam score (0-17, lower is better)
        spam_score = random.randint(1, 5)
        
        # Generate linking domains count
        linking_domains = random.randint(50, 5000)
        
        # Generate total backlinks (always more than linking domains)
        total_backlinks = linking_domains * random.randint(2, 15)
        
        # Generate top keywords
        keyword_pool = [
            "seo tools", "domain authority", "backlink checker", "website analysis",
            "seo ranking", "keyword research", "seo metrics", "website authority",
            "search ranking", "seo score", "domain rating", "backlink profile",
            "seo checker", "website optimization", "keyword tracking"
        ]
        top_keywords = random.sample(keyword_pool, min(5, len(keyword_pool)))
        
        # Generate sample backlinks
        backlink_domains = [
            "example.com", "blog.example.net", "news.example.org", 
            "seo-blog.com", "webmaster-tools.net", "digitalmarketing.org"
        ]
        
        anchor_texts = [
            "check website authority", "domain authority tool", "seo metrics",
            "website ranking", "backlink checker", "domain score", "authority checker"
        ]
        
        top_backlinks = []
        for i in range(5):
            backlink_domain = random.choice(backlink_domains)
            top_backlinks.append(BacklinkInfo(
                url=f"https://{backlink_domain}/page-{i}",
                domain=backlink_domain,
                anchor_text=random.choice(anchor_texts),
                page_authority=random.randint(10, 70)
            ))
        
        # Create the response
        result = DomainAuthorityResponse(
            domain=domain,
            domain_authority=domain_authority,
            page_authority=page_authority,
            spam_score=spam_score,
            linking_domains=linking_domains,
            total_backlinks=total_backlinks,
            top_keywords=top_keywords,
            top_backlinks=top_backlinks
        )
        
        # Store the result for later retrieval
        last_analysis_result = result
        
        return result
    except Exception as e:
        logger.error(f"Error in domain authority check: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/domain-authority/last")
async def get_last_domain_analysis():
    """Get the last domain authority analysis result."""
    global last_analysis_result
    if not last_analysis_result:
        raise HTTPException(status_code=404, detail="No domain authority analysis available. Please analyze a domain first.")
    return last_analysis_result

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

def run_api_server():
    """Run the FastAPI server"""
    port = int(os.environ.get("DOMAIN_AUTHORITY_API_PORT", 8103))
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    run_api_server()