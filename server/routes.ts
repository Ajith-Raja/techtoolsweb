import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { analyzeSite } from "./seo-analyzer";
import { analyzeReadability } from "./readability-analyzer";
import { analyzeKeywordDensity } from "./keyword-analyzer";
import { checkPlagiarism, plagiarismCheckSchema } from "./plagiarism-checker";
import { analyzeSiteSchema } from "@shared/schema";
import { z } from "zod";
import * as cheerio from 'cheerio';
import { setupAuth } from "./auth";
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Create the HTTP server to use for both Express and WebSockets
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url } = analyzeSiteSchema.parse(req.body);
      const result = await analyzeSite(url);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        res.status(500).json({ message });
      }
    }
  });

  // Add a GET endpoint to retrieve the last analysis result
  app.get("/api/lastAnalysis", (_req, res) => {
    // Return enhanced mock data for testing
    res.json({
      score: 75,
      metaTags: {
        title: "Example Website - Your Digital Marketing Partner",
        description: "Professional digital marketing services including SEO, PPC, and content marketing. Get a free consultation today!",
        keywords: "digital marketing, SEO, PPC, content marketing",
        robots: "index, follow",
        viewport: "width=device-width, initial-scale=1",
        ogTags: {
          title: "Example Website - Digital Marketing Experts",
          description: "Transform your online presence with our expert digital marketing services",
          image: "https://example.com/og-image.jpg"
        },
        hasTitle: true,
        hasDescription: true,
        titleLength: 45,
        descriptionLength: 98,
        isOptimized: false
      },
      headers: {
        h1Count: 1,
        h2Count: 3,
        h3Count: 5,
        hasH1: true,
        headerStructure: "Properly nested, but multiple H1 tags found",
        isHierarchyCorrect: false
      },
      contentAnalysis: {
        wordCount: 850,
        hasEnoughContent: true,
        paragraphCount: 12,
        averageSentenceLength: 18,
        readabilityScore: 65,
        keywordDensity: {
          "marketing": 2.5,
          "digital": 1.8,
          "services": 1.2
        },
        contentQuality: {
          hasImages: true,
          hasLinks: true,
          internalLinksCount: 8,
          externalLinksCount: 3
        }
      },
      technicalSeo: {
        mobileResponsive: true,
        hasSSL: true,
        hasSitemap: false,
        hasRobotsTxt: true,
        loadTime: "2.5 seconds",
        pageSize: "1.8 MB",
        imagesOptimized: false
      },
      recommendations: [
        {
          issue: "Meta Title Length",
          severity: "high",
          impact: "Directly affects click-through rates from search results",
          solution: "Shorten title to 50-60 characters while maintaining keywords"
        },
        {
          issue: "Multiple H1 Tags",
          severity: "medium",
          impact: "Confuses search engines about main topic",
          solution: "Keep only one H1 tag that clearly describes the page content"
        },
        {
          issue: "Missing Sitemap",
          severity: "medium",
          impact: "Harder for search engines to discover all pages",
          solution: "Generate and submit an XML sitemap to search engines"
        },
        {
          issue: "Large Page Size",
          severity: "high",
          impact: "Slower loading times affect user experience and rankings",
          solution: "Optimize images and minify CSS/JS files"
        },
        {
          issue: "Keyword Optimization",
          severity: "medium",
          impact: "Could improve rankings for target keywords",
          solution: "Optimize keyword placement in title, headers, and first paragraph"
        }
      ]
    });
  });

  // API endpoint for domain authority checking
  app.post("/api/domain-authority", (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // This would be replaced with a real API call in production
      // For now, we return mock data
      res.json({
        domain: url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        domainAuthority: 45,
        pageAuthority: 38,
        spamScore: 1,
        linkingDomains: 210,
        totalBacklinks: 1845,
        topKeywords: ["seo tools", "domain analysis", "seo checker"]
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check domain authority" });
    }
  });
  
  // API endpoint for readability checking
  app.post("/api/readability", async (req, res) => {
    try {
      const { type, value } = req.body;
      if (!type || !value || typeof type !== 'string' || typeof value !== 'string') {
        return res.status(400).json({ message: "Type and value are required" });
      }
      
      if (type !== 'url' && type !== 'content') {
        return res.status(400).json({ message: "Type must be 'url' or 'content'" });
      }
      
      try {
        const result = await analyzeReadability(type, value);
        res.json(result);
      } catch (analysisError) {
        console.error('Error analyzing readability:', analysisError);
        res.status(422).json({ 
          message: analysisError instanceof Error 
            ? analysisError.message 
            : "Failed to analyze readability" 
        });
      }
    } catch (error) {
      console.error('Error in readability endpoint:', error);
      res.status(500).json({ message: "Server error analyzing readability" });
    }
  });
  
  // API endpoint for keyword density analysis
  app.post("/api/keyword-density", async (req, res) => {
    try {
      const { type, value, keywords } = req.body;
      
      if (!type || !value || typeof type !== 'string' || typeof value !== 'string') {
        return res.status(400).json({ message: "Type and value are required" });
      }
      
      if (type !== 'url' && type !== 'content') {
        return res.status(400).json({ message: "Type must be 'url' or 'content'" });
      }
      
      if (!Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ message: "Keywords array is required" });
      }
      
      try {
        const result = await analyzeKeywordDensity(type, value, keywords);
        res.json(result);
      } catch (analysisError) {
        console.error('Error analyzing keyword density:', analysisError);
        res.status(422).json({ 
          message: analysisError instanceof Error 
            ? analysisError.message 
            : "Failed to analyze keyword density" 
        });
      }
    } catch (error) {
      console.error('Error in keyword density endpoint:', error);
      res.status(500).json({ message: "Server error analyzing keyword density" });
    }
  });
  
  // API endpoint for plagiarism checking
  app.post("/api/plagiarism-check", async (req, res) => {
    try {
      // Validate input using the schema
      const input = plagiarismCheckSchema.parse(req.body);
      
      try {
        const result = await checkPlagiarism(input);
        res.json(result);
      } catch (analysisError) {
        console.error('Error checking plagiarism:', analysisError);
        res.status(422).json({ 
          message: analysisError instanceof Error 
            ? analysisError.message 
            : "Failed to check plagiarism" 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error in plagiarism check endpoint:', error);
        res.status(500).json({ 
          message: error instanceof Error 
            ? error.message 
            : "Server error checking plagiarism" 
        });
      }
    }
  });
  
  // API endpoint for content gap analyzer (premium feature with limited free access)
  app.post("/api/content-gap-analyzer", async (req, res) => {
    // Validate authentication for full results
    const isPremium = req.isAuthenticated();
    const restrictedResults = !isPremium;

    try {
      const { yourDomain, competitorDomains, language, location, niche } = req.body;
      
      // Basic validation
      if (!yourDomain || typeof yourDomain !== 'string') {
        return res.status(400).json({ message: "Your domain is required" });
      }
      
      if (!competitorDomains || !Array.isArray(competitorDomains) || competitorDomains.length === 0) {
        return res.status(400).json({ message: "At least one competitor domain is required" });
      }
      
      // Restrict non-premium users to 1 competitor
      if (restrictedResults && competitorDomains.length > 1) {
        return res.status(403).json({ 
          message: "Free users can only analyze 1 competitor. Please upgrade for up to 3 competitors."
        });
      }
      
      // In a real implementation, this would call a keyword research API
      // For now, we'll return realistic mock data
      const domains = {
        yourDomain: yourDomain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        competitors: competitorDomains.map(domain => 
          domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
        )
      };
      
      // Create a deterministic but realistic set of results
      const totalKeywords = restrictedResults ? 10 : 25;
      const keywordPool = [
        "seo tools", "keyword research", "backlink checker", "website audit",
        "content optimization", "rank tracker", "seo analytics", "meta tag generator",
        "structured data", "schema markup", "site speed test", "mobile friendly",
        "competitor analysis", "content gap", "keyword gap", "keyword density",
        "plagiarism check", "readability score", "domain authority", "on page seo",
        "technical seo", "local seo", "voice search optimization", "featured snippets",
        "serp analysis", "keyword difficulty", "content planning", "topic cluster",
        "internal linking", "anchor text", "keyword research tool", "seo dashboard",
        "traffic analyzer", "conversion optimization", "bounce rate analysis"
      ];
      
      // Generate keywords based on competitor domains for realism
      const keywords = Array(totalKeywords).fill(0).map((_, i) => {
        const keyword = keywordPool[i % keywordPool.length];
        const searchVolume = Math.floor(Math.random() * 20000) + 1000;
        const keywordDifficulty = Math.floor(Math.random() * 70) + 5;
        const cpc = (Math.random() * 4 + 0.5).toFixed(2);
        const trafficPotential = keywordDifficulty < 30 ? 'High' : 
                                keywordDifficulty < 60 ? 'Medium' : 'Low';
        
        // Determine which competitors rank for this keyword
        const competitorsRanking = domains.competitors.filter(() => Math.random() > 0.3)
          .map(domain => ({
            domain,
            position: Math.floor(Math.random() * 10) + 1
          }));
          
        // Generate a content suggestion based on the keyword
        let contentSuggestion = "";
        if (keyword.includes("seo")) {
          contentSuggestion = `Create a comprehensive guide on ${keyword} with step-by-step instructions`;
        } else if (keyword.includes("research")) {
          contentSuggestion = `Build a tool or checklist for effective ${keyword}`;
        } else if (keyword.includes("check")) {
          contentSuggestion = `Develop a case study showing ${keyword} in action`;
        } else {
          contentSuggestion = `Write a thorough guide explaining ${keyword} with examples`;
        }
        
        // For restricted results, hide some of the valuable data
        return {
          keyword,
          competitors: competitorsRanking,
          searchVolume: restrictedResults ? 0 : searchVolume,
          keywordDifficulty: restrictedResults ? 0 : keywordDifficulty,
          trafficPotential: restrictedResults ? "Login to view" : trafficPotential,
          cpc: restrictedResults ? 0 : Number(cpc),
          contentSuggestion: restrictedResults ? "Premium feature" : contentSuggestion
        };
      });
      
      // Calculate analysis metrics
      const lowDifficultyOpportunities = restrictedResults ? "Login to view" : 
        keywords.filter(k => typeof k.keywordDifficulty === 'number' && k.keywordDifficulty < 30).length;
      
      const highTrafficOpportunities = restrictedResults ? "Login to view" : 
        keywords.filter(k => k.trafficPotential === 'High').length;
      
      // Create categories from keywords for analysis
      const categories = [
        {category: "On-page SEO", keywordCount: Math.floor(Math.random() * 10) + 3},
        {category: "Technical SEO", keywordCount: Math.floor(Math.random() * 8) + 2},
        {category: "Content Marketing", keywordCount: Math.floor(Math.random() * 12) + 5},
        {category: "Performance", keywordCount: Math.floor(Math.random() * 6) + 2}
      ];
      
      res.json({
        yourDomain: domains.yourDomain,
        competitorDomains: domains.competitors,
        analysis: {
          totalMissingKeywords: keywords.length,
          lowDifficultyOpportunities,
          highTrafficOpportunities,
          topCategories: restrictedResults ? [{category: "Login for full analysis", keywordCount: 0}] : categories
        },
        keywords: keywords,
        dateAnalyzed: new Date().toISOString(),
        premium: isPremium
      });
    } catch (error) {
      console.error('Error in content gap analyzer endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error during content gap analysis" 
      });
    }
  });
  
  // API endpoint for pre-launch audit (premium feature)
  app.post("/api/pre-launch-audit", async (req, res) => {
    // Validate authentication for access
    const isPremium = req.isAuthenticated();
    if (!isPremium) {
      return res.status(403).json({
        message: "Pre-launch audit is a premium feature. Please login to access."
      });
    }
    
    try {
      const { url, options } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // This would perform a comprehensive crawl in production
      // For now, return mock data
      res.json({
        url: url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        dateScanned: new Date().toISOString(),
        overallScore: 78,
        summary: {
          pagesScanned: 24,
          totalIssues: 47,
          criticalIssues: 8,
          moderateIssues: 15,
          minorIssues: 24,
          seoScore: 76,
          performanceScore: 82,
          accessibilityScore: 68,
          bestPracticesScore: 85
        },
        categories: [
          {
            name: "Meta Information",
            score: 72,
            issues: [
              {
                severity: "high",
                issue: "Missing meta descriptions",
                affectedPages: 6,
                impact: "Reduces click-through rates from search results",
                recommendation: "Add unique, descriptive meta descriptions to all pages"
              },
              {
                severity: "medium",
                issue: "Duplicate title tags",
                affectedPages: 4,
                impact: "Confuses search engines about which page to rank",
                recommendation: "Create unique title tags for each page"
              }
            ]
          },
          {
            name: "Content Quality",
            score: 84,
            issues: [
              {
                severity: "medium",
                issue: "Thin content pages",
                affectedPages: 3,
                impact: "Low-value pages may not rank well",
                recommendation: "Expand content to at least 300-500 words or consolidate pages"
              },
              {
                severity: "low",
                issue: "Low keyword relevance",
                affectedPages: 8,
                impact: "Pages may not rank for target keywords",
                recommendation: "Improve content by including relevant keywords naturally"
              }
            ]
          },
          {
            name: "Technical SEO",
            score: 68,
            issues: [
              {
                severity: "high",
                issue: "Slow page load times",
                affectedPages: 5,
                impact: "Poor user experience and lower rankings",
                recommendation: "Optimize images, minimize JS/CSS, leverage browser caching"
              },
              {
                severity: "high",
                issue: "Mobile usability issues",
                affectedPages: 7,
                impact: "Poor mobile experience affects rankings in mobile-first indexing",
                recommendation: "Fix tap targets, viewport configuration, and content sizing"
              },
              {
                severity: "medium",
                issue: "Broken internal links",
                affectedPages: 12,
                impact: "Disrupts user experience and link equity flow",
                recommendation: "Fix or redirect all broken links"
              }
            ]
          }
        ],
        affectedPages: [
          {
            url: `https://${url.replace(/^https?:\/\//, "").replace(/\/$/, "")}/about`,
            issues: 4,
            topIssue: "Missing meta description",
            severity: "high"
          },
          {
            url: `https://${url.replace(/^https?:\/\//, "").replace(/\/$/, "")}/services`,
            issues: 6,
            topIssue: "Slow page load time",
            severity: "high"
          },
          {
            url: `https://${url.replace(/^https?:\/\//, "").replace(/\/$/, "")}/blog`,
            issues: 3,
            topIssue: "Duplicate title tags",
            severity: "medium"
          }
        ]
      });
    } catch (error) {
      console.error('Error in pre-launch audit endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error during pre-launch audit" 
      });
    }
  });
  
  // Simple middleware for basic metadata
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Just pass through to the next middleware
    next();
  });

  return httpServer;
}