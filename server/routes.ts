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
import { 
  getPageMetadata, 
  applyMetadata, 
  shouldPreloadData, 
  getPreloadedData, 
  injectPreloadedData 
} from "./ssr";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
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
          contentSuggestion = `Create a comprehensive guide to ${keyword}`;
        } else if (keyword.includes("keyword")) {
          contentSuggestion = `Write a tutorial on ${keyword} with step-by-step instructions`;
        } else if (keyword.includes("content")) {
          contentSuggestion = `Develop a case study showing ${keyword} success stories`;
        } else {
          contentSuggestion = `Create a comparison post about different ${keyword} approaches`;
        }
        
        return {
          keyword,
          competitors: competitorsRanking,
          searchVolume: restrictedResults ? 0 : searchVolume,
          keywordDifficulty: restrictedResults ? 0 : keywordDifficulty,
          trafficPotential: restrictedResults ? 'Unknown' : trafficPotential,
          cpc: restrictedResults ? 0 : parseFloat(cpc),
          contentSuggestion
        };
      });
      
      // Count opportunities by different metrics
      const lowDifficultyOpportunities = restrictedResults ? 0 : 
        keywords.filter(k => k.keywordDifficulty < 30).length;
        
      const highTrafficOpportunities = restrictedResults ? 0 :
        keywords.filter(k => k.trafficPotential === 'High').length;
      
      // Generate top categories based on keyword patterns
      const categories = restrictedResults ? [] : [
        { category: "SEO Tools", keywordCount: Math.floor(Math.random() * 10) + 5 },
        { category: "Content", keywordCount: Math.floor(Math.random() * 8) + 3 },
        { category: "Technical", keywordCount: Math.floor(Math.random() * 6) + 2 },
        { category: "Analytics", keywordCount: Math.floor(Math.random() * 5) + 1 }
      ];
      
      // Return the complete analysis results
      res.json({
        yourDomain: domains.yourDomain,
        competitorDomains: domains.competitors,
        analysis: {
          totalMissingKeywords: keywords.length,
          lowDifficultyOpportunities,
          highTrafficOpportunities,
          topCategories: categories
        },
        keywords,
        dateAnalyzed: new Date().toISOString(),
        premium: !restrictedResults
      });
    } catch (error) {
      console.error('Error in content gap analyzer endpoint:', error);
      res.status(500).json({ 
        message: error instanceof Error 
          ? error.message 
          : "Server error analyzing content gaps" 
      });
    }
  });

  // API endpoint for pre-launch audit (premium feature - requires authentication)
  app.post("/api/pre-launch-audit", async (req, res) => {
    // Check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required for this premium feature" });
    }
    try {
      const { url, sitemapUrl, maxPages, userAgent, authUsername, authPassword, requiresAuth } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // Validate maxPages is a positive number
      if (maxPages && (typeof maxPages !== 'number' || maxPages <= 0)) {
        return res.status(400).json({ message: "maxPages must be a positive number" });
      }
      
      // Validate authentication credentials if required
      if (requiresAuth === true) {
        if (!authUsername || !authPassword) {
          return res.status(400).json({ message: "Authentication credentials are required" });
        }
      }
      
      // Here we would implement the actual pre-launch audit logic
      // For now, we'll return a mock result
      // In a real implementation, you'd use a crawler library or similar tools
      
      // Mock the time it would take to crawl a site
      const startTime = Date.now();
      const delay = Math.min(1000, Math.max(500, maxPages * 20)); // Simulate longer delay for more pages
      
      // In a production environment, this would be replaced with actual crawling logic
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Return a mock result for now
      // In production, this would be replaced with real crawling results
      res.json({
        siteScore: Math.floor(Math.random() * 30) + 65, // Random score between 65-95
        totalPages: maxPages,
        pagesWithIssues: Math.floor(maxPages * 0.4), // 40% of pages have issues
        criticalIssues: Math.floor(maxPages * 0.1), // 10% critical issues
        warningIssues: Math.floor(maxPages * 0.2), // 20% warnings
        infoIssues: Math.floor(maxPages * 0.1), // 10% info issues
        crawlDate: new Date().toISOString(),
        commonIssues: [
          {
            type: 'error',
            title: 'Missing Meta Descriptions',
            description: 'Multiple pages are missing meta descriptions, which are essential for search engines to understand page content.',
            impact: 'high',
            recommendation: 'Add unique, descriptive meta descriptions to each page between 120-158 characters.'
          },
          {
            type: 'error',
            title: 'Slow Page Loading Speed',
            description: 'Several pages take more than 3 seconds to load, which can negatively impact user experience and search rankings.',
            impact: 'high',
            recommendation: 'Optimize images, enable browser caching, and minimize CSS/JavaScript to improve loading times.'
          },
          {
            type: 'warning',
            title: 'Multiple H1 Tags',
            description: 'Some pages have multiple H1 tags, which can confuse search engines about the main topic of the page.',
            impact: 'medium',
            recommendation: 'Ensure each page has exactly one H1 tag that clearly describes the page content.'
          },
          {
            type: 'warning',
            title: 'Low Word Count',
            description: 'Many pages have less than 300 words, which may be considered thin content by search engines.',
            impact: 'medium',
            recommendation: 'Expand content to provide more value and cover topics comprehensively.'
          },
          {
            type: 'info',
            title: 'Missing Alt Text for Images',
            description: 'Several images across the site are missing alt text, which helps with accessibility and image search.',
            impact: 'low',
            recommendation: 'Add descriptive alt text to all images that conveys their purpose or content.'
          }
        ],
        // Generate mock page results
        pageResults: Array(maxPages).fill(0).map((_, i) => ({
          url: `${url}${i === 0 ? '' : '/page-' + (i + 1)}`,
          title: i === 0 ? `Home | ${url.replace(/^https?:\/\//i, '')}` : `Page ${i + 1} | ${url.replace(/^https?:\/\//i, '')}`,
          metaDescription: i % 5 === 0 ? '' : `This is the description for ${i === 0 ? 'the homepage' : 'page ' + (i + 1)}.`,
          h1Count: i % 4 === 0 ? 2 : 1,
          wordCount: i === 0 ? 750 : 200 + (i * 30), // Home page has more content
          statusCode: i === Math.floor(maxPages * 0.08) ? 404 : 200, // One page is 404
          loadTime: i % 7 === 0 ? 3.5 : 1.2,
          mobileResponsive: i !== Math.floor(maxPages * 0.12), // One page is not mobile friendly
          issues: [
            ...(i % 5 === 0 ? [{
              type: 'error',
              title: 'Missing Meta Description',
              description: 'This page is missing a meta description.',
              impact: 'high',
              recommendation: 'Add a unique, descriptive meta description between 120-158 characters.'
            }] : []),
            ...(i % 7 === 0 ? [{
              type: 'error',
              title: 'Slow Loading Speed',
              description: 'This page takes too long to load (over 3 seconds).',
              impact: 'high',
              recommendation: 'Optimize images and minimize CSS/JavaScript.'
            }] : []),
            ...(i % 4 === 0 ? [{
              type: 'warning',
              title: 'Multiple H1 Tags',
              description: 'This page has multiple H1 tags.',
              impact: 'medium',
              recommendation: 'Ensure the page has exactly one H1 tag.'
            }] : []),
            ...(i < Math.floor(maxPages * 0.24) ? [{
              type: 'warning',
              title: 'Low Word Count',
              description: 'This page has less than 300 words of content.',
              impact: 'medium',
              recommendation: 'Add more quality content to this page.'
            }] : []),
            ...(i % 3 === 0 ? [{
              type: 'info',
              title: 'Missing Alt Text',
              description: 'Some images on this page are missing alt text.',
              impact: 'low',
              recommendation: 'Add descriptive alt text to all images.'
            }] : [])
          ].filter(Boolean)
        }))
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
  
  // Server-side rendering for all pages to improve SEO
  app.get("/:page*", async (req: Request, res: Response, next: NextFunction) => {
    // Extract the full path from the request
    const fullPath = req.originalUrl;
    
    // Skip server-side rendering for API routes and static assets
    if (
      fullPath.startsWith('/api') || 
      fullPath.endsWith('.js') || 
      fullPath.endsWith('.css') || 
      fullPath.endsWith('.ico') || 
      fullPath.endsWith('.png') || 
      fullPath.endsWith('.jpg') || 
      fullPath.endsWith('.svg') || 
      fullPath.endsWith('.woff') || 
      fullPath.endsWith('.woff2')
    ) {
      return next();
    }
    
    // Get the index.html content
    try {
      // We need to read the index.html file
      const fs = await import('fs');
      
      try {
        const data = await fs.promises.readFile('./client/index.html', 'utf8');
        
        // Get page metadata
        const metadata = getPageMetadata(fullPath, req);
        
        // Apply metadata to the HTML
        let modifiedHtml = applyMetadata(data, metadata);
        
        // If this page should have preloaded data for SEO purposes
        if (shouldPreloadData(fullPath)) {
          try {
            // Get the preloaded data
            const preloadedData = await getPreloadedData(fullPath);
            
            // Inject the preloaded data into the HTML
            modifiedHtml = injectPreloadedData(modifiedHtml, preloadedData);
          } catch (preloadError) {
            console.error('Error preloading data:', preloadError);
            // Continue without preloaded data
          }
        }
        
        // For tool pages, add structured data to help with rich snippets
        const pageName = fullPath.split('/')[1] || '';
        if (isToolPage(pageName)) {
          const $ = cheerio.load(modifiedHtml);
          const structuredData = getStructuredData(pageName, req.get('host') || '');
          $('head').append(`<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`);
          modifiedHtml = $.html();
        }
        
        // Send the modified HTML
        res.send(modifiedHtml);
      } catch (fileError) {
        console.error('Error reading index.html:', fileError);
        next();
      }
    } catch (error) {
      console.error('Error in server-side rendering:', error);
      next();
    }
  });

  // Helper functions for SSR
  function getPageTitle(page: string): string {
    const pageTitles: Record<string, string> = {
      "": "SEO Analyzer - Free SEO Analysis and Optimization Tools",
      "domain-age": "Domain Age Checker - Find the Age of Any Website | SEO Analyzer",
      "domain-authority": "Domain & Page Authority Checker - SEO Metrics | SEO Analyzer",
      "plagiarism": "Plagiarism Checker - Check Text for Duplicate Content | SEO Analyzer",
      "schema": "Schema Markup Generator - Structured Data for SEO | SEO Analyzer",
      "readability": "Readability Score Checker - Optimize Content for Your Audience | SEO Analyzer",
      "keyword-density": "Keyword Density Checker - Optimize Your SEO Keywords | SEO Analyzer",
      "font-generator": "Web Safe Font Generator - Create Custom Font Styles | SEO Analyzer",
      "image-compressor": "Image Compressor - Optimize Images for Web Performance | SEO Analyzer",
      "transliterate": "Google Transliterate - Type in English & Get Text in Multiple Languages | SEO Analyzer",
      "pre-launch-audit": "Pre-Launch SEO Audit Tool - Comprehensive Site Health Check | SEO Analyzer",
      "about": "About SEO Analyzer - Our Story and Mission",
      "features": "SEO Tools and Features - Comprehensive SEO Suite",
      "results": "SEO Analysis Results - Detailed Website Insights"
    };
    
    return pageTitles[page] || "SEO Analyzer - Free SEO Analysis Tools";
  }
  
  function getPageDescription(page: string): string {
    const pageDescriptions: Record<string, string> = {
      "": "Get comprehensive SEO analysis, detailed insights, and actionable recommendations to improve your website ranking and visibility in search engines.",
      "domain-age": "Check any domain age, creation date, expiry, and registration details with our free Domain Age Checker tool. Important SEO metrics at your fingertips.",
      "domain-authority": "Check your website Domain and Page Authority scores. Understand your SEO ranking potential and compare with competitors using our free tool.",
      "plagiarism": "Check your content for plagiarism and duplicate content. Our free tool analyzes your text against billions of web pages to ensure originality.",
      "schema": "Generate schema markup and structured data for your website to enhance rich snippets in search results and improve SEO visibility.",
      "readability": "Analyze the readability of your content to ensure it's appropriate for your target audience. Get Flesch Reading Ease, grade level scores, and content statistics.",
      "keyword-density": "Analyze the keyword density in your content. Optimize your keyword usage for better SEO performance and avoid keyword stuffing penalties.",
      "font-generator": "Create custom web-safe font styles for your website. Preview fonts with different sizes, weights, and styles, then generate the CSS code you need.",
      "image-compressor": "Optimize your images for better web performance. Reduce file size while maintaining quality to improve page load speed and SEO rankings.",
      "transliterate": "Type in English and get text in Hindi, Tamil, or Bengali with our real-time transliteration tool. Perfect for multilingual content creation.",
      "pre-launch-audit": "Scan your entire website for SEO issues before launch. Identify and fix problems with meta tags, content, load speed, and more for better search rankings.",
      "about": "Learn about SEO Analyzer, our mission to make SEO accessible for everyone, and how our tools can help improve your website performance.",
      "features": "Explore all the features and tools offered by SEO Analyzer. From basic SEO analysis to advanced technical SEO optimization.",
      "results": "Review detailed SEO analysis for your website. Get insights on meta tags, headers, content quality, and technical SEO with actionable recommendations."
    };
    
    return pageDescriptions[page] || "Free SEO tools to analyze and optimize your website for better search engine rankings and visibility.";
  }
  
  function isToolPage(page: string): boolean {
    const toolPages = ["domain-age", "domain-authority", "plagiarism", "schema", "readability", "keyword-density", "font-generator", "image-compressor", "transliterate", "pre-launch-audit", ""];
    return toolPages.includes(page);
  }
  
  function getStructuredData(page: string, host: string): object {
    // Basic structured data for tool pages (FAQPage schema)
    const baseUrl = `https://${host}`;
    
    if (page === "domain-authority") {
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Domain Authority Checker",
        "url": `${baseUrl}/domain-authority`,
        "applicationCategory": "SEO Tool",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "description": "Check your website Domain and Page Authority scores to understand SEO ranking potential.",
        "featureList": "Domain Authority score, Page Authority score, Spam score, Backlink profile analysis",
        "operatingSystem": "Any"
      };
    }
    
    if (page === "readability") {
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Readability Score Checker",
        "url": `${baseUrl}/readability`,
        "applicationCategory": "Content Tool",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "description": "Analyze the readability of your content to ensure it's appropriate for your target audience.",
        "featureList": "Flesch Reading Ease, Flesch-Kincaid Grade Level, Gunning Fog Index, SMOG Index, word count, sentence count, syllable count, reading time",
        "operatingSystem": "Any"
      };
    }
    
    if (page === "keyword-density") {
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Keyword Density Checker",
        "url": `${baseUrl}/keyword-density`,
        "applicationCategory": "SEO Tool",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "description": "Analyze the keyword density in your content. Optimize your keyword usage for better SEO performance.",
        "featureList": "Keyword frequency analysis, keyword density percentage, top keywords extraction, reading time estimation, content statistics",
        "operatingSystem": "Any"
      };
    }
    
    if (page === "font-generator") {
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Web Safe Font Generator",
        "url": `${baseUrl}/font-generator`,
        "applicationCategory": "Web Design Tool",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "description": "Create custom web-safe font styles for your website. Preview fonts with different sizes, weights, and styles, then generate the CSS code you need.",
        "featureList": "Font family selection, size adjustment, style options (bold, italic, underline), live preview, CSS code generation",
        "operatingSystem": "Any"
      };
    }
    
    if (page === "image-compressor") {
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image Compressor",
        "url": `${baseUrl}/image-compressor`,
        "applicationCategory": "Web Performance Tool",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "description": "Optimize your images for better web performance. Reduce file size while maintaining quality to improve page load speed and SEO rankings.",
        "featureList": "Image compression, quality control, resize options, before/after comparison, file size reduction statistics",
        "operatingSystem": "Any"
      };
    }
    
    if (page === "transliterate") {
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Google Transliterate Tool",
        "url": `${baseUrl}/transliterate`,
        "applicationCategory": "Language Tool",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "description": "Type in English and get text in your selected language with real-time suggestions as you type, supporting Hindi, Tamil, and Bengali scripts.",
        "featureList": "Real-time transliteration, multiple language support, suggestion system, preview mode, copy to clipboard functionality",
        "operatingSystem": "Any"
      };
    }
    
    if (page === "pre-launch-audit") {
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Pre-Launch SEO Audit Tool",
        "url": `${baseUrl}/pre-launch-audit`,
        "applicationCategory": "SEO Tool",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "description": "Comprehensive SEO audit tool to scan your entire website before launch. Identify and fix critical issues before getting indexed by search engines.",
        "featureList": "Full website crawling, meta tag analysis, content quality assessment, page load speed testing, mobile responsiveness check, issue prioritization, PDF/CSV export",
        "operatingSystem": "Any"
      };
    }
    
    // Default to FAQPage schema with common SEO questions
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is SEO and why is it important?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SEO (Search Engine Optimization) is the practice of optimizing websites to rank higher in search engine results. It is important because higher rankings lead to more visibility, traffic, and potential customers."
          }
        },
        {
          "@type": "Question",
          "name": "How can I improve my website SEO?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can improve your website SEO by optimizing meta tags, creating quality content, building quality backlinks, improving site speed, ensuring mobile-friendliness, and using proper header structure."
          }
        },
        {
          "@type": "Question",
          "name": "What are the most important SEO metrics to track?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Important SEO metrics include organic traffic, keyword rankings, backlink quality and quantity, page load speed, bounce rate, dwell time, and conversion rates."
          }
        }
      ]
    };
  }

  const httpServer = createServer(app);
  return httpServer;
}