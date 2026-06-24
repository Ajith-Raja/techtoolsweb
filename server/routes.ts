import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { analyzeSite } from "./seo-analyzer-simplified";
import { analyzeReadability } from "./readability-analyzer";
import { analyzeKeywordDensity } from "./keyword-analyzer";
import { checkPlagiarism, plagiarismCheckSchema } from "./plagiarism-checker";
import { 
  analyzeSiteSchema, 
  domainAuthoritySchema, 
  readabilityAnalysisSchema, 
  keywordDensitySchema,
  preLaunchAuditSchema,
  contentGapAnalyzerSchema,
  youtubeInfoSchema,
  youtubeDownloadSchema,
  SeoAnalysisResult
} from "@shared/schema";
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
  
  // Store the last analysis result
  let lastAnalysisResult: SeoAnalysisResult | null = null;
  
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate input using schema
      const { url } = analyzeSiteSchema.parse(req.body);
      
      try {
        // Try to use the Python SEO Analyzer API first
        try {
          console.log('Attempting to use Python SEO API...');
          const response = await fetch('http://localhost:8100/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });
          
          if (!response.ok) {
            throw new Error(`Python API responded with status: ${response.status}`);
          }
          
          const pythonResult = await response.json();
          console.log('Successfully analyzed with Python API');
          
          // Store the result in the Node.js server as a fallback
          lastAnalysisResult = pythonResult;
          
          return res.json(pythonResult);
        } catch (pythonApiError) {
          // If Python API fails, fall back to built-in analyzer
          console.warn('Python API failed, falling back to built-in analyzer:', pythonApiError instanceof Error ? pythonApiError.message : pythonApiError);
          const builtInResult = await analyzeSite(url);
          
          // Store the result for later retrieval
          lastAnalysisResult = builtInResult;
          
          res.json(builtInResult);
        }
      } catch (analysisError) {
        // Handle specific analysis errors (like failed fetch)
        console.error('Error analyzing site:', analysisError);
        res.status(422).json({ 
          message: analysisError instanceof Error 
            ? analysisError.message 
            : "Failed to analyze site. Please check the URL and try again." 
        });
      }
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        // Handle unexpected errors
        console.error('Unexpected error in SEO analyze endpoint:', error);
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        res.status(500).json({ message });
      }
    }
  });

  // Add a GET endpoint to retrieve the last analysis result
  app.get("/api/lastAnalysis", async (_req, res) => {
    try {
      // Try to get the result from the Python API first
      try {
        console.log('Attempting to fetch last analysis from Python API...');
        const response = await fetch('http://localhost:8100/api/lastAnalysis');
        
        if (response.ok) {
          const pythonResult = await response.json();
          console.log('Successfully retrieved last analysis from Python API');
          return res.json(pythonResult);
        }
        
        // If Python API returns 404 or fails, fall back to Node.js stored result
        console.log('Python API has no results, falling back to Node.js stored result');
      } catch (pythonApiError) {
        console.warn('Error fetching from Python API:', pythonApiError instanceof Error ? pythonApiError.message : pythonApiError);
      }
      
      // Fallback to locally stored result
      if (lastAnalysisResult) {
        // Return the actual analysis result if available
        res.json(lastAnalysisResult);
      } else {
        // If no analysis has been performed yet, return a 404
        res.status(404).json({ 
          message: "No analysis data available. Please analyze a URL first." 
        });
      }
    } catch (error) {
      console.error('Error in lastAnalysis endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Server error fetching analysis data" 
      });
    }
  });

  // API endpoint for domain age checking
  app.post("/api/domain-age", (req, res) => {
    try {
      const { domains } = req.body;
      
      // Validate input
      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return res.status(400).json({ message: "Domains array is required" });
      }
      
      // Check if there are more than 5 domains
      if (domains.length > 5) {
        return res.status(400).json({ message: "Maximum 5 domains allowed" });
      }
      
      // Process each domain
      const results = domains.map(domain => {
        const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
        
        // Generate a random creation date in the past (1-10 years ago)
        const years = Math.floor(Math.random() * 9) + 1;
        const months = Math.floor(Math.random() * 12);
        const days = Math.floor(Math.random() * 28);
        
        const creationDate = new Date();
        creationDate.setFullYear(creationDate.getFullYear() - years);
        creationDate.setMonth(creationDate.getMonth() - months);
        creationDate.setDate(creationDate.getDate() - days);
        
        // Generate expiry date (usually 1-2 years in the future)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1 + Math.floor(Math.random() * 2));
        
        // Last updated (within the last year)
        const lastUpdated = new Date();
        lastUpdated.setMonth(lastUpdated.getMonth() - Math.floor(Math.random() * 12));
        
        // Format the age string
        const ageString = `${years} Years ${months} Months ${days} Days`;
        
        // Generate other domain info
        const registrars = ["GoDaddy", "Namecheap", "Google Domains", "Network Solutions", "Domain.com"];
        const registrar = registrars[Math.floor(Math.random() * registrars.length)];
        
        // Generate a random IP
        const ip1 = Math.floor(Math.random() * 255);
        const ip2 = Math.floor(Math.random() * 255);
        const ip3 = Math.floor(Math.random() * 255);
        const ip4 = Math.floor(Math.random() * 255);
        const ipAddress = `${ip1}.${ip2}.${ip3}.${ip4}`;
        
        // Generate name servers (usually 2-3)
        const nsCount = Math.floor(Math.random() * 2) + 2;
        const nameServers = Array(nsCount).fill(0).map((_, i) => `ns${i+1}.${cleanDomain}`);
        
        return {
          domain: cleanDomain,
          age: ageString,
          createdDate: creationDate.toISOString().split('T')[0],
          expiryDate: expiryDate.toISOString().split('T')[0],
          lastUpdated: lastUpdated.toISOString().split('T')[0],
          registrar: registrar,
          ipAddress: ipAddress,
          nameServers: nameServers
        };
      });
      
      res.json(results);
    } catch (error) {
      console.error('Error in domain age endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error checking domain age" 
      });
    }
  });

  // API endpoint for domain authority checking
  // Store last domain authority result
  let lastDomainAuthorityResult: any = null;
  
  app.post("/api/domain-authority", async (req, res) => {
    try {
      // Validate input using schema
      const input = domainAuthoritySchema.parse(req.body);
      const { url } = input;
      
      try {
        // Try to use the Python Domain Authority API first
        try {
          console.log('Attempting to use Python Domain Authority API...');
          const response = await fetch('http://localhost:8103/api/domain-authority', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });
          
          if (!response.ok) {
            throw new Error(`Python API responded with status: ${response.status}`);
          }
          
          const pythonResult = await response.json();
          console.log('Successfully retrieved domain authority data from Python API');
          
          // Store the result in the Node.js server as a fallback
          lastDomainAuthorityResult = pythonResult;
          
          return res.json(pythonResult);
        } catch (pythonApiError) {
          // If Python API fails, fall back to built-in implementation
          console.warn('Python API failed, falling back to built-in implementation:', 
            pythonApiError instanceof Error ? pythonApiError.message : pythonApiError);
          
          // Generate fallback data
          const domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
          const fallbackResult = {
            domain,
            domainAuthority: 45,
            pageAuthority: 38,
            spamScore: 1,
            linkingDomains: 210,
            totalBacklinks: 1845,
            topKeywords: ["seo tools", "domain analysis", "seo checker"],
            top_backlinks: [] // Add empty backlinks array for compatibility
          };
          
          // Store the result for later retrieval
          lastDomainAuthorityResult = fallbackResult;
          
          res.json(fallbackResult);
        }
      } catch (analysisError) {
        console.error('Error checking domain authority:', analysisError);
        res.status(422).json({ 
          message: analysisError instanceof Error 
            ? analysisError.message 
            : "Failed to check domain authority. Please try again." 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error in domain authority endpoint:', error);
        res.status(500).json({ 
          message: error instanceof Error 
            ? error.message 
            : "Failed to check domain authority" 
        });
      }
    }
  });
  
  // Add a GET endpoint to retrieve the last domain authority analysis
  app.get("/api/domain-authority/last", async (_req, res) => {
    try {
      // Try to get the result from the Python API first
      try {
        console.log('Attempting to fetch last domain authority from Python API...');
        const response = await fetch('http://localhost:8103/api/domain-authority/last');
        
        if (response.ok) {
          const pythonResult = await response.json();
          console.log('Successfully retrieved last domain authority from Python API');
          return res.json(pythonResult);
        }
        
        // If Python API returns 404 or fails, fall back to Node.js stored result
        console.log('Python API has no results, falling back to Node.js stored result');
      } catch (pythonApiError) {
        console.warn('Error fetching from Python API:', 
          pythonApiError instanceof Error ? pythonApiError.message : pythonApiError);
      }
      
      // Fallback to locally stored result
      if (lastDomainAuthorityResult) {
        // Return the actual analysis result if available
        res.json(lastDomainAuthorityResult);
      } else {
        // If no analysis has been performed yet, return a 404
        res.status(404).json({ 
          message: "No domain authority data available. Please check a domain first." 
        });
      }
    } catch (error) {
      console.error('Error in domain authority /last endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Server error fetching domain authority data" 
      });
    }
  });
  
  // API endpoint for readability checking
  app.post("/api/readability", async (req, res) => {
    try {
      // Validate input using the schema
      const input = readabilityAnalysisSchema.parse(req.body);
      const { type, value } = input;
      
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error in readability endpoint:', error);
        res.status(500).json({ message: "Server error analyzing readability" });
      }
    }
  });
  
  // API endpoint for keyword density analysis
  app.post("/api/keyword-density", async (req, res) => {
    try {
      // Validate input using the schema
      const input = keywordDensitySchema.parse(req.body);
      const { type, value, keywords } = input;
      
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error in keyword density endpoint:', error);
        res.status(500).json({ message: "Server error analyzing keyword density" });
      }
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
  // Store last content gap analysis result
  let lastContentGapResult: any = null;
  
  app.post("/api/content-gap-analyzer", async (req, res) => {
    // Validate authentication for full results
    const isPremium = req.isAuthenticated();
    const restrictedResults = !isPremium;

    try {
      // Validate input using schema
      const input = contentGapAnalyzerSchema.parse(req.body);
      const { yourDomain, competitorDomains, language, location, niche } = input;
      
      // Restrict non-premium users to 1 competitor
      if (restrictedResults && competitorDomains.length > 1) {
        return res.status(403).json({ 
          message: "Free users can only analyze 1 competitor. Please upgrade for up to 3 competitors."
        });
      }
      
      try {
        // Try to use the Python Content Gap Analyzer API first
        try {
          console.log('Attempting to use Python Content Gap Analyzer API...');
          const response = await fetch('http://localhost:8104/api/content-gap-analyzer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              yourDomain, 
              competitorDomains, 
              language, 
              location, 
              niche,
              is_premium: isPremium  // Pass premium status to Python API
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Python API responded with status: ${response.status}`);
          }
          
          const pythonResult = await response.json();
          console.log('Successfully retrieved content gap data from Python API');
          
          // The Python API now returns data in the expected format for the frontend
          // We'll just pass it through with minimal transformations
          
          // Declare formattedResult variable outside of conditional blocks
          let formattedResult: any;
          
          // Check if the response has the new structure (with analysis field)
          if (pythonResult.analysis) {
            console.log('Using the new API response format directly');
            // Already in the correct format, just ensure premium status is correct
            pythonResult.premium = isPremium;
            formattedResult = pythonResult;
            
            // Add competitorDomains if using the old field name only
            if (!formattedResult.competitorDomains && formattedResult.competitors) {
              formattedResult.competitorDomains = formattedResult.competitors;
            }
            
            // Add keywords if using the old field name only
            if (!formattedResult.keywords && formattedResult.keywordGaps) {
              formattedResult.keywords = formattedResult.keywordGaps;
            }
          } else {
            // Using the old API format, needs transformation
            console.log('Transforming API response to new format');
            
            // Transform Python API result to match the expected format
            formattedResult = {
              // Core fields
              yourDomain: pythonResult.yourDomain,
              competitorDomains: pythonResult.competitors,
              
              // Keep the original fields from Python API to support dual structure
              competitors: pythonResult.competitors,
              keywordGaps: pythonResult.keywordGaps,
              topicGaps: pythonResult.topicGaps,
              
              // Map to the format expected by frontend
              keywords: pythonResult.keywordGaps.map((kg: any) => ({
                keyword: kg.keyword,
                competitors: kg.competitors,
                searchVolume: kg.searchVolume,
                keywordDifficulty: kg.keywordDifficulty,
                trafficPotential: kg.trafficPotential,
                cpc: kg.cpc,
                contentSuggestion: kg.contentSuggestion
              })),
              
              analysis: {
                totalMissingKeywords: pythonResult.keywordGaps.length,
                lowDifficultyOpportunities: pythonResult.lowDifficultyOpportunities,
                highTrafficOpportunities: pythonResult.highTrafficOpportunities,
                topCategories: pythonResult.topicGaps.map((topic: string, i: number) => ({
                  category: topic, // Use 'category' to match Python API naming
                  name: topic,     // Use 'name' to match frontend naming
                  count: Math.floor(Math.random() * 10) + 3, // For visualization
                  keywordCount: Math.floor(Math.random() * 10) + 3 // Support both naming conventions
                })),
                recommendedActions: pythonResult.recommendedActions
              },
              
              contentOpportunities: pythonResult.contentOpportunities,
              recommendedActions: pythonResult.recommendedActions,
              dateAnalyzed: new Date().toISOString(),
              premium: isPremium
            };
          }
          
          // Store the result for later retrieval
          lastContentGapResult = formattedResult;
          
          return res.json(formattedResult);
        } catch (pythonApiError) {
          // If Python API fails, fall back to built-in implementation
          console.warn('Python API failed, falling back to built-in implementation:', 
            pythonApiError instanceof Error ? pythonApiError.message : pythonApiError);
            
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
        }
      } catch (analysisError) {
        console.error('Error in content gap analysis:', analysisError);
        return res.status(422).json({ 
          message: analysisError instanceof Error 
            ? analysisError.message 
            : "Failed to analyze content gaps. Please try again." 
        });
      }
      
      // If we reach this point, something is wrong with the try/catch structure
      return res.status(500).json({ 
        message: "Server error during content gap analysis - failed to complete API request" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error in content gap analyzer endpoint:', error);
        res.status(500).json({ 
          message: error instanceof Error 
            ? error.message 
            : "Server error during content gap analysis" 
        });
      }
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
      // Validate input using schema
      const input = preLaunchAuditSchema.parse(req.body);
      const { url } = input;
      
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error in pre-launch audit endpoint:', error);
        res.status(500).json({ 
          message: error instanceof Error 
            ? error.message 
            : "Server error during pre-launch audit" 
        });
      }
    }
  });
  
  // YouTube Downloader API routes
  // Get YouTube video info
  app.post("/api/youtube/info", async (req, res) => {
    try {
      // Validate input using schema
      const input = youtubeInfoSchema.parse(req.body);
      const { url } = input;
      
      try {
        // Call the Python YouTube Downloader API
        console.log('Calling YouTube Downloader API to fetch video info...');
        const response = await fetch('http://localhost:8106/api/youtube/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const videoInfo = await response.json();
        console.log('Successfully retrieved video info from API');
        
        return res.json(videoInfo);
      } catch (apiError) {
        console.error('Error fetching video info:', apiError);
        return res.status(422).json({ 
          message: apiError instanceof Error 
            ? apiError.message 
            : "Failed to fetch YouTube video info" 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error in YouTube video info endpoint:', error);
        res.status(500).json({ 
          message: error instanceof Error 
            ? error.message 
            : "Server error fetching YouTube video info" 
        });
      }
    }
  });
  
  // Start YouTube video download
  app.post("/api/youtube/download", async (req, res) => {
    try {
      // Validate input using schema
      const input = youtubeDownloadSchema.parse(req.body);
      const { url, format_id } = input;
      
      try {
        // Call the Python YouTube Downloader API
        console.log('Calling YouTube Downloader API to start download...');
        const response = await fetch('http://localhost:8106/api/youtube/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, format_id }),
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const downloadInfo = await response.json();
        console.log('Successfully started video download');
        
        return res.json(downloadInfo);
      } catch (apiError) {
        console.error('Error starting download:', apiError);
        return res.status(422).json({ 
          message: apiError instanceof Error 
            ? apiError.message 
            : "Failed to start YouTube video download" 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error in YouTube download endpoint:', error);
        res.status(500).json({ 
          message: error instanceof Error 
            ? error.message 
            : "Server error starting YouTube download" 
        });
      }
    }
  });
  
  // Check download status
  app.get("/api/youtube/download-status/:downloadId", async (req, res) => {
    try {
      const downloadId = req.params.downloadId;
      
      if (!downloadId) {
        return res.status(400).json({ message: "Download ID is required" });
      }
      
      try {
        // Call the Python YouTube Downloader API
        const response = await fetch(`http://localhost:8106/api/youtube/download-status/${downloadId}`);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const statusInfo = await response.json();
        return res.json(statusInfo);
      } catch (apiError) {
        console.error('Error checking download status:', apiError);
        return res.status(422).json({ 
          message: apiError instanceof Error 
            ? apiError.message 
            : "Failed to check download status" 
        });
      }
    } catch (error) {
      console.error('Error in download status endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error checking download status" 
      });
    }
  });
  
  // Download completed file
  app.get("/api/youtube/download-file/:downloadId", async (req, res) => {
    try {
      const downloadId = req.params.downloadId;
      
      if (!downloadId) {
        return res.status(400).json({ message: "Download ID is required" });
      }
      
      try {
        // Call the Python YouTube Downloader API
        const response = await fetch(`http://localhost:8106/api/youtube/download-file/${downloadId}`);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        // Stream the response to the client
        if (response.body) {
          // For Node.js 18+, need to convert ReadableStream to Node.js Stream
          const { Readable } = require('stream');
          const readableNodeStream = Readable.fromWeb(response.body);
          readableNodeStream.pipe(res);
        } else {
          throw new Error('Response body is null');
        }
      } catch (apiError) {
        console.error('Error downloading file:', apiError);
        return res.status(422).json({ 
          message: apiError instanceof Error 
            ? apiError.message 
            : "Failed to download file" 
        });
      }
    } catch (error) {
      console.error('Error in file download endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error downloading file" 
      });
    }
  });

  app.post("/api/pdf-chat/upload", (req, res) => {
    try {
      // Use a proxy approach to forward the multipart form data
      const proxy = require('http-proxy-middleware');
      
      const proxyMiddleware = proxy.createProxyMiddleware({
        target: 'http://localhost:8107',
        changeOrigin: true,
        onError: (err, req, res) => {
          console.error('PDF Chat proxy error:', err);
          res.status(500).json({ 
            message: "Failed to connect to PDF Chat service" 
          });
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log('PDF uploaded successfully to chat API');
        }
      });
      
      proxyMiddleware(req, res);
    } catch (error) {
      console.error('Error in PDF chat upload endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error uploading PDF" 
      });
    }
  });
  
  // Chat with PDF
  app.post("/api/pdf-chat/chat", async (req, res) => {
    try {
      const response = await fetch('http://localhost:8107/api/pdf-chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get chat response');
      }
      
      const data = await response.json();
      console.log('Chat response generated successfully');
      
      return res.json(data);
    } catch (error) {
      console.error('Error in PDF chat endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error in PDF chat" 
      });
    }
  });
  
  // Get chat history
  app.get("/api/pdf-chat/history/:documentId", async (req, res) => {
    try {
      const documentId = req.params.documentId;
      
      const response = await fetch(`http://localhost:8107/api/pdf-chat/history/${documentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get chat history');
      }
      
      const data = await response.json();
      return res.json(data);
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error getting chat history" 
      });
    }
  });
  
  // List documents
  app.get("/api/pdf-chat/documents", async (req, res) => {
    try {
      const response = await fetch('http://localhost:8107/api/pdf-chat/documents');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list documents');
      }
      
      const data = await response.json();
      return res.json(data);
    } catch (error) {
      console.error('Error listing documents:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error listing documents" 
      });
    }
  });
  
  // Delete document
  app.delete("/api/pdf-chat/document/:documentId", async (req, res) => {
    try {
      const documentId = req.params.documentId;
      
      const response = await fetch(`http://localhost:8107/api/pdf-chat/document/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete document');
      }
      
      const data = await response.json();
      return res.json(data);
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error deleting document" 
      });
    }
  });

  // Internet Speed Test API Endpoints
  
  // 1. Ping endpoint
  app.get("/api/speedtest/ping", (_req, res) => {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    res.json({ timestamp: Date.now() });
  });

  // 2. Download endpoint - streams a customizable size of dummy data
  app.get("/api/speedtest/download", (req, res) => {
    const sizeMb = Math.min(Number(req.query.size) || 15, 100); // default 15MB, max 100MB
    const byteLength = sizeMb * 1024 * 1024;
    
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Length": byteLength,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });

    const chunk = Buffer.alloc(64 * 1024); // 64KB chunk of zeros
    let bytesSent = 0;

    const writeNextChunk = () => {
      if (bytesSent >= byteLength || res.writableEnded) {
        res.end();
        return;
      }

      const remaining = byteLength - bytesSent;
      const toSend = Math.min(chunk.length, remaining);
      const payload = toSend === chunk.length ? chunk : chunk.subarray(0, toSend);
      const canContinue = res.write(payload);
      bytesSent += toSend;

      if (!canContinue) {
        res.once("drain", writeNextChunk);
        return;
      }

      setImmediate(writeNextChunk);
    };

    writeNextChunk();
  });

  // 3. Upload endpoint - receives data and measures size
  app.post("/api/speedtest/upload", (req, res) => {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    
    let bytesReceived = 0;
    req.on("data", (chunk) => {
      bytesReceived += chunk.length;
    });
    
    req.on("end", () => {
      res.json({ success: true, bytesReceived });
    });
  });


  // Simple middleware for basic metadata
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Just pass through to the next middleware
    next();
  });

  return httpServer;
}