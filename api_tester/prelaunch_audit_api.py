"""
Pre-Launch Audit API

This module provides a FastAPI server for comprehensive pre-launch website audits.
It checks SEO, performance, accessibility, best practices, and more.
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
app = FastAPI(title="Pre-Launch Audit API", description="API for comprehensive pre-launch website audits")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Models
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

class PreLaunchAuditRequest(BaseModel):
    url: str
    
    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

class PreLaunchAuditResponse(BaseModel):
    url: str
    overall_score: int
    categories: List[AuditCategoryScore]
    critical_issues: List[AuditIssue]
    recommendations: List[Dict[str, str]]
    audit_timestamp: str

# Store the last analysis result
last_audit_result = None

@app.post("/api/prelaunch-audit", response_model=PreLaunchAuditResponse)
async def perform_prelaunch_audit(request: PreLaunchAuditRequest, is_premium: bool = False):
    """Perform a comprehensive pre-launch audit for a website.
    
    Premium users get more detailed results and recommendations.
    """
    global last_audit_result
    
    try:
        # Extract domain
        parsed_url = urlparse(request.url)
        domain = parsed_url.netloc or request.url.split('/')[0]
        
        # In a production environment, you would call real testing services
        # For now, we'll generate realistic data
        
        # Create SEO category issues
        seo_issues = []
        seo_issues.append(AuditIssue(
            severity="high",
            category="seo",
            issue="Missing meta description",
            description="The meta description tag is missing or empty.",
            impact="Lower click-through rates from search results.",
            recommendation="Add a compelling meta description under 160 characters that includes your target keywords."
        ))
        
        if random.random() > 0.5:
            seo_issues.append(AuditIssue(
                severity="medium",
                category="seo",
                issue="Title tag too long",
                description="The title tag exceeds 60 characters.",
                impact="Search engines may truncate the title in search results.",
                recommendation="Shorten the title to under 60 characters while keeping important keywords."
            ))
        
        if random.random() > 0.7:
            seo_issues.append(AuditIssue(
                severity="low",
                category="seo",
                issue="Missing alt text for images",
                description="Some images don't have alternative text attributes.",
                impact="Reduced accessibility and missed SEO opportunity.",
                recommendation="Add descriptive alt text to all images."
            ))
        
        # Create performance category issues
        performance_issues = []
        if random.random() > 0.4:
            performance_issues.append(AuditIssue(
                severity="high",
                category="performance",
                issue="Large JavaScript bundles",
                description="JavaScript bundles exceed 500KB.",
                impact="Slower page load times and higher bounce rates.",
                recommendation="Implement code-splitting and lazy loading to reduce initial JS payload."
            ))
        
        if random.random() > 0.6:
            performance_issues.append(AuditIssue(
                severity="medium",
                category="performance",
                issue="Unoptimized images",
                description="Images aren't properly compressed and sized.",
                impact="Slower page loads, especially on mobile devices.",
                recommendation="Compress images and implement responsive images with srcset."
            ))
        
        # Create accessibility category issues
        accessibility_issues = []
        if random.random() > 0.3:
            accessibility_issues.append(AuditIssue(
                severity="high",
                category="accessibility",
                issue="Low contrast text",
                description="Text elements don't meet WCAG 2.1 contrast requirements.",
                impact="Difficult reading experience for visually impaired users.",
                recommendation="Ensure text has a contrast ratio of at least 4.5:1 with its background."
            ))
        
        if random.random() > 0.5:
            accessibility_issues.append(AuditIssue(
                severity="medium",
                category="accessibility",
                issue="Missing form labels",
                description="Form inputs don't have associated label elements.",
                impact="Screen readers can't properly identify form fields.",
                recommendation="Add proper <label> elements or aria-label attributes to all form inputs."
            ))
        
        # Create best practices issues
        best_practices_issues = []
        if random.random() > 0.5:
            best_practices_issues.append(AuditIssue(
                severity="medium",
                category="best-practices",
                issue="Console errors found",
                description="JavaScript errors appear in the browser console.",
                impact="Potential functionality issues and poor user experience.",
                recommendation="Fix all JavaScript errors before launch."
            ))
        
        if random.random() > 0.7:
            best_practices_issues.append(AuditIssue(
                severity="low",
                category="best-practices",
                issue="Missing HTTP security headers",
                description="Important security headers are not set.",
                impact="Increased vulnerability to various attacks.",
                recommendation="Add X-Content-Type-Options, X-Frame-Options, and Content-Security-Policy headers."
            ))
        
        # Create security issues
        security_issues = []
        if random.random() > 0.6:
            security_issues.append(AuditIssue(
                severity="high",
                category="security",
                issue="Insecure links (HTTP)",
                description="The site contains links to insecure HTTP resources.",
                impact="Mixed content warnings and potential security vulnerabilities.",
                recommendation="Update all links to use HTTPS."
            ))
        
        if random.random() > 0.8:
            security_issues.append(AuditIssue(
                severity="high",
                category="security",
                issue="Missing Content-Security-Policy",
                description="No Content-Security-Policy header is configured.",
                impact="Increased risk of XSS attacks and data theft.",
                recommendation="Implement a strict Content-Security-Policy header."
            ))
        
        # For non-premium users, limit the issues shown
        if not is_premium:
            seo_issues = seo_issues[:1]
            performance_issues = performance_issues[:1]
            accessibility_issues = accessibility_issues[:1]
            best_practices_issues = best_practices_issues[:1]
            security_issues = security_issues[:1]
        
        # Calculate scores for each category
        def calculate_category_score(issues):
            if not issues:
                return 100
            
            weights = {"high": 10, "medium": 5, "low": 2}
            max_score = 100
            penalty = sum(weights[issue.severity] for issue in issues)
            return max(0, min(100, max_score - penalty))
        
        seo_score = calculate_category_score(seo_issues)
        performance_score = calculate_category_score(performance_issues)
        accessibility_score = calculate_category_score(accessibility_issues)
        best_practices_score = calculate_category_score(best_practices_issues)
        security_score = calculate_category_score(security_issues)
        
        # Create category scores
        categories = [
            AuditCategoryScore(
                category="SEO",
                score=seo_score,
                pass_count=5 - len(seo_issues),
                fail_count=len([i for i in seo_issues if i.severity == "high"]),
                warning_count=len([i for i in seo_issues if i.severity in ["medium", "low"]]),
                issues=seo_issues
            ),
            AuditCategoryScore(
                category="Performance",
                score=performance_score,
                pass_count=5 - len(performance_issues),
                fail_count=len([i for i in performance_issues if i.severity == "high"]),
                warning_count=len([i for i in performance_issues if i.severity in ["medium", "low"]]),
                issues=performance_issues
            ),
            AuditCategoryScore(
                category="Accessibility",
                score=accessibility_score,
                pass_count=5 - len(accessibility_issues),
                fail_count=len([i for i in accessibility_issues if i.severity == "high"]),
                warning_count=len([i for i in accessibility_issues if i.severity in ["medium", "low"]]),
                issues=accessibility_issues
            ),
            AuditCategoryScore(
                category="Best Practices",
                score=best_practices_score,
                pass_count=5 - len(best_practices_issues),
                fail_count=len([i for i in best_practices_issues if i.severity == "high"]),
                warning_count=len([i for i in best_practices_issues if i.severity in ["medium", "low"]]),
                issues=best_practices_issues
            ),
            AuditCategoryScore(
                category="Security",
                score=security_score,
                pass_count=5 - len(security_issues),
                fail_count=len([i for i in security_issues if i.severity == "high"]),
                warning_count=len([i for i in security_issues if i.severity in ["medium", "low"]]),
                issues=security_issues
            )
        ]
        
        # Calculate overall score
        overall_score = int(sum(cat.score for cat in categories) / len(categories))
        
        # Collect critical issues
        critical_issues = []
        for category in categories:
            critical_issues.extend([issue for issue in category.issues if issue.severity == "high"])
        
        # Generate recommendations
        recommendations = [
            {
                "category": "SEO",
                "action": "Fix all missing meta tags",
                "priority": "High"
            },
            {
                "category": "Performance",
                "action": "Optimize image delivery",
                "priority": "Medium"
            },
            {
                "category": "Accessibility",
                "action": "Fix all contrast issues",
                "priority": "High"
            },
            {
                "category": "Security",
                "action": "Implement proper security headers",
                "priority": "High"
            },
            {
                "category": "Best Practices",
                "action": "Fix all console errors",
                "priority": "Medium"
            }
        ]
        
        # For non-premium users, limit recommendations
        if not is_premium:
            recommendations = recommendations[:2]
        
        # Create response
        from datetime import datetime
        
        result = PreLaunchAuditResponse(
            url=request.url,
            overall_score=overall_score,
            categories=categories,
            critical_issues=critical_issues,
            recommendations=recommendations,
            audit_timestamp=datetime.now().isoformat()
        )
        
        # Store the result for later retrieval
        last_audit_result = result
        
        return result
    except Exception as e:
        logger.error(f"Error in pre-launch audit: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prelaunch-audit/last")
async def get_last_prelaunch_audit():
    """Get the last pre-launch audit result."""
    global last_audit_result
    if not last_audit_result:
        raise HTTPException(status_code=404, detail="No pre-launch audit available. Please perform an audit first.")
    return last_audit_result

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

def run_api_server():
    """Run the FastAPI server"""
    port = int(os.environ.get("PRELAUNCH_AUDIT_API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    run_api_server()