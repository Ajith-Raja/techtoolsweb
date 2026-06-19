"""
Content Gap Analyzer API

This module provides a FastAPI server for analyzing content gaps between websites.
It identifies keyword gaps, content opportunities, and provides recommendations for content strategy.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import random
import logging
from pydantic import BaseModel, validator, Field
import uvicorn
import os
from typing import List, Dict, Optional, Any
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Content Gap Analyzer API", description="API for analyzing content gaps between websites")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Models
class CompetitorPosition(BaseModel):
    domain: str
    position: int

class KeywordOpportunity(BaseModel):
    keyword: str
    competitors: List[CompetitorPosition]
    searchVolume: int
    keywordDifficulty: int
    trafficPotential: str
    cpc: float
    contentSuggestion: str

class ContentGapRequest(BaseModel):
    yourDomain: str
    competitorDomains: List[str]
    language: str = "en"
    location: str = "us"
    niche: str = "general"
    
    @validator('yourDomain', 'competitorDomains')
    def validate_domains(cls, v):
        if isinstance(v, str):
            if not v.startswith(('http://', 'https://')):
                return 'https://' + v
            return v
        elif isinstance(v, list):
            return [domain if domain.startswith(('http://', 'https://')) else 'https://' + domain for domain in v]
        return v

class CategoryItem(BaseModel):
    name: str
    category: str
    count: int
    keywordCount: int

class AnalysisInfo(BaseModel):
    totalMissingKeywords: int
    lowDifficultyOpportunities: int
    highTrafficOpportunities: int
    topCategories: List[CategoryItem]
    recommendedActions: List[Dict[str, str]]

class ContentGapResponse(BaseModel):
    # Core fields (matching TypeScript)
    yourDomain: str
    competitorDomains: List[str]
    dateAnalyzed: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    premium: bool = False
    
    # Keywords (will be returned as both keywords and keywordGaps)
    keywords: List[KeywordOpportunity]
    
    # Analysis info structured the same as TypeScript
    analysis: AnalysisInfo
    
    # Content opportunities
    contentOpportunities: List[Dict[str, Any]]
    
    # Original Python fields kept for backward compatibility
    competitors: List[str]
    keywordGaps: List[KeywordOpportunity]
    topicGaps: List[str]
    lowDifficultyOpportunities: int
    highTrafficOpportunities: int
    recommendedActions: List[Dict[str, str]]

# Store the last analysis result
last_analysis_result = None

@app.post("/api/content-gap-analyzer", response_model=ContentGapResponse)
async def analyze_content_gap(request: ContentGapRequest, is_premium: bool = False):
    """Analyze content gaps between your domain and competitors.
    
    Premium users can analyze more competitors and get more detailed results.
    """
    global last_analysis_result
    
    try:
        # Extract domains
        your_domain = urlparse(request.yourDomain).netloc or request.yourDomain.split('/')[0]
        
        # For non-premium users, restrict to 1 competitor
        competitor_domains = request.competitorDomains
        if not is_premium and len(competitor_domains) > 1:
            competitor_domains = competitor_domains[:1]
            
        competitors = [urlparse(domain).netloc or domain.split('/')[0] for domain in competitor_domains]
        
        # In a production environment, you would call a real API for keyword research
        # For now, we'll generate realistic data
        
        # Generate keyword gaps
        keyword_pool = [
            "seo tools", "keyword research", "backlink checker", "website audit",
            "content optimization", "rank tracker", "seo analytics", "meta tag generator",
            "structured data", "schema markup", "site speed test", "mobile friendly",
            "competitor analysis", "content gap", "keyword gap", "keyword density",
            "plagiarism check", "readability score", "domain authority", "on page seo",
            "technical seo", "local seo", "voice search optimization", "featured snippets",
            "serp analysis", "keyword difficulty", "content planning", "topic cluster",
            "internal linking", "anchor text", "keyword research tool", "seo dashboard",
            "traffic analyzer", "conversion optimization", "bounce rate analysis"
        ]
        
        # Number of keywords for different user types
        total_keywords = 25 if is_premium else 10
        
        keyword_gaps = []
        for i in range(total_keywords):
            keyword = keyword_pool[i % len(keyword_pool)]
            search_volume = random.randint(1000, 20000)
            keyword_difficulty = random.randint(5, 75)
            cpc = round(random.uniform(0.5, 5.0), 2)
            traffic_potential = "High" if keyword_difficulty < 30 else "Medium" if keyword_difficulty < 60 else "Low"
            
            # Generate competitor rankings
            competitors_ranking = []
            for competitor in competitors:
                if random.random() > 0.3:  # 70% chance of competitor ranking for this keyword
                    competitors_ranking.append(CompetitorPosition(
                        domain=competitor,
                        position=random.randint(1, 10)
                    ))
            
            # Generate content suggestion
            content_suggestion = ""
            if keyword.find("seo") >= 0:
                content_suggestion = f"Create a comprehensive guide on {keyword} with step-by-step instructions"
            elif keyword.find("research") >= 0:
                content_suggestion = f"Build a tool or checklist for effective {keyword}"
            elif keyword.find("check") >= 0:
                content_suggestion = f"Develop a case study showing {keyword} in action"
            else:
                content_suggestion = f"Write a thorough guide explaining {keyword} with examples"
            
            # For non-premium users, hide some data
            if not is_premium:
                search_volume = 0
                keyword_difficulty = 0
                traffic_potential = "Login to view"
                content_suggestion = "Premium feature"
            
            keyword_gaps.append(KeywordOpportunity(
                keyword=keyword,
                competitors=competitors_ranking,
                searchVolume=search_volume,
                keywordDifficulty=keyword_difficulty,
                trafficPotential=traffic_potential,
                cpc=cpc,
                contentSuggestion=content_suggestion
            ))
        
        # Generate topic gaps
        topic_pool = [
            "SEO Best Practices", "Content Marketing Strategy", "Technical SEO Audit",
            "Link Building Guide", "Mobile Optimization", "Voice Search Optimization",
            "Featured Snippets Guide", "Local SEO Checklist", "Schema Markup Implementation",
            "Page Speed Optimization", "Core Web Vitals", "Content Gap Analysis",
            "Keyword Research Methodology", "Competitor Analysis Framework"
        ]
        
        topic_count = 8 if is_premium else 3
        topic_gaps = random.sample(topic_pool, topic_count)
        
        # Generate content opportunities
        opportunity_types = ["blog", "guide", "tool", "calculator", "checklist", "case study", "comparison", "tutorial"]
        content_opportunities = []
        
        opportunity_count = 10 if is_premium else 4
        for i in range(opportunity_count):
            opportunity_type = opportunity_types[i % len(opportunity_types)]
            keyword = keyword_pool[random.randint(0, len(keyword_pool)-1)]
            
            title = ""
            if opportunity_type == "blog":
                title = f"The Ultimate Guide to {keyword.title()}"
            elif opportunity_type == "guide":
                title = f"Step-by-Step {keyword.title()} Guide for Beginners"
            elif opportunity_type == "tool":
                title = f"Interactive {keyword.title()} Tool"
            elif opportunity_type == "calculator":
                title = f"{keyword.title()} Calculator"
            elif opportunity_type == "checklist":
                title = f"Complete {keyword.title()} Checklist"
            elif opportunity_type == "case study":
                title = f"How Company X Improved Their {keyword.title()} by 200%"
            elif opportunity_type == "comparison":
                title = f"Top 10 {keyword.title()} Tools Compared"
            elif opportunity_type == "tutorial":
                title = f"How to Master {keyword.title()} in 5 Steps"
            
            difficulty = random.choice(["Easy", "Medium", "Hard"])
            potential_traffic = random.randint(500, 5000) if is_premium else 0
            
            content_opportunities.append({
                "type": opportunity_type,
                "title": title,
                "difficulty": difficulty,
                "potentialTraffic": potential_traffic if is_premium else "Premium feature",
                "keywordFocus": keyword
            })
        
        # Calculate metrics
        low_difficulty_opportunities = sum(1 for k in keyword_gaps if isinstance(k.keywordDifficulty, int) and k.keywordDifficulty < 30)
        high_traffic_opportunities = sum(1 for k in keyword_gaps if k.trafficPotential == "High")
        
        # For non-premium users, hide these metrics
        if not is_premium:
            low_difficulty_opportunities = 0
            high_traffic_opportunities = 0
        
        # Generate recommended actions
        action_templates = [
            {
                "action": "Create long-form content on {topic}",
                "priority": "High",
                "difficulty": "Medium"
            },
            {
                "action": "Develop interactive tools for {topic}",
                "priority": "Medium",
                "difficulty": "High"
            },
            {
                "action": "Write step-by-step guides for {topic}",
                "priority": "High",
                "difficulty": "Low"
            },
            {
                "action": "Create comparison posts for {topic}",
                "priority": "Medium",
                "difficulty": "Medium"
            },
            {
                "action": "Develop a comprehensive resource hub for {topic}",
                "priority": "High",
                "difficulty": "High"
            }
        ]
        
        recommended_actions = []
        action_count = 5 if is_premium else 2
        for i in range(action_count):
            template = action_templates[i % len(action_templates)]
            topic = topic_gaps[i % len(topic_gaps)]
            
            action = {
                "action": template["action"].format(topic=topic),
                "priority": template["priority"],
                "difficulty": template["difficulty"]
            }
            
            recommended_actions.append(action)
        
        # Create category items from topic gaps
        top_categories = []
        for topic in topic_gaps:
            top_categories.append(CategoryItem(
                name=topic,
                category=topic,
                count=random.randint(3, 10),
                keywordCount=random.randint(3, 10)
            ))
        
        # Build the analysis info structure
        analysis_info = AnalysisInfo(
            totalMissingKeywords=len(keyword_gaps),
            lowDifficultyOpportunities=low_difficulty_opportunities,
            highTrafficOpportunities=high_traffic_opportunities,
            topCategories=top_categories,
            recommendedActions=recommended_actions
        )
        
        # Create response with both old and new structure
        result = ContentGapResponse(
            # New TypeScript-compatible fields
            yourDomain=your_domain,
            competitorDomains=competitors,
            keywords=keyword_gaps,
            analysis=analysis_info,
            contentOpportunities=content_opportunities,
            dateAnalyzed=datetime.utcnow().isoformat(),
            premium=is_premium,
            
            # Original Python fields for backward compatibility
            competitors=competitors,
            keywordGaps=keyword_gaps,
            topicGaps=topic_gaps,
            lowDifficultyOpportunities=low_difficulty_opportunities,
            highTrafficOpportunities=high_traffic_opportunities,
            recommendedActions=recommended_actions
        )
        
        # Store the result for later retrieval
        last_analysis_result = result
        
        return result
    except Exception as e:
        logger.error(f"Error in content gap analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/content-gap-analyzer/last")
async def get_last_content_gap_analysis():
    """Get the last content gap analysis result."""
    global last_analysis_result
    if not last_analysis_result:
        raise HTTPException(status_code=404, detail="No content gap analysis available. Please analyze a domain first.")
    return last_analysis_result

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

def run_api_server():
    """Run the FastAPI server"""
    port = int(os.environ.get("CONTENT_GAP_API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    run_api_server()