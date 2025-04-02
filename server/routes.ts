import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { analyzeSite } from "./seo-analyzer";
import { analyzeReadability } from "./readability-analyzer";
import { analyzeKeywordDensity } from "./keyword-analyzer";
import { analyzeSiteSchema } from "@shared/schema";
import { z } from "zod";
import * as cheerio from 'cheerio';

export async function registerRoutes(app: Express): Promise<Server> {
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
  
  // We'll comment out the server-side rendering for now since it may be conflicting with Vite
  // Server-side rendering for blog posts and SEO-critical pages
  /*app.get("/:page", (req: Request, res: Response, next) => {
    // Skip server-side rendering for API routes and static assets
    const { page } = req.params;
    if (page.startsWith('api') || page.endsWith('.js') || page.endsWith('.css') || page.endsWith('.ico')) {
      return next();
    }
    
    // Get the index.html content
    try {
      // We need to read the index.html file to modify it
      import('fs').then(fs => {
        fs.readFile('./client/index.html', 'utf8', (err, data) => {
          if (err) {
            console.error('Error reading index.html:', err);
            return next();
          }
          
          // Use cheerio to manipulate the HTML
          const $ = cheerio.load(data);
          const pageTitle = getPageTitle(page);
          const pageDescription = getPageDescription(page);
          
          // Update meta tags for SEO
          $('title').text(pageTitle);
          $('meta[name="description"]').attr('content', pageDescription);
          
          // Add Open Graph tags
          if (!$('meta[property="og:title"]').length) {
            $('head').append(`<meta property="og:title" content="${pageTitle}" />`);
          } else {
            $('meta[property="og:title"]').attr('content', pageTitle);
          }
          
          if (!$('meta[property="og:description"]').length) {
            $('head').append(`<meta property="og:description" content="${pageDescription}" />`);
          } else {
            $('meta[property="og:description"]').attr('content', pageDescription);
          }
          
          if (!$('meta[property="og:type"]').length) {
            $('head').append(`<meta property="og:type" content="website" />`);
          }
          
          // Update canonical URL
          const canonicalUrl = `https://${req.get('host')}/${page}`;
          if (!$('link[rel="canonical"]').length) {
            $('head').append(`<link rel="canonical" href="${canonicalUrl}" />`);
          } else {
            $('link[rel="canonical"]').attr('href', canonicalUrl);
          }
          
          // Add structured data for SEO (if blog post or tool page)
          if (isToolPage(page)) {
            const structuredData = getStructuredData(page, req.get('host') || '');
            $('head').append(`<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`);
          }
          
          // Send the modified HTML
          res.send($.html());
        });
      }).catch(err => {
        console.error('Error importing fs module:', err);
        next();
      });
    } catch (error) {
      console.error('Error in server-side rendering:', error);
      next();
    }
  });*/

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
      "about": "Learn about SEO Analyzer, our mission to make SEO accessible for everyone, and how our tools can help improve your website performance.",
      "features": "Explore all the features and tools offered by SEO Analyzer. From basic SEO analysis to advanced technical SEO optimization.",
      "results": "Review detailed SEO analysis for your website. Get insights on meta tags, headers, content quality, and technical SEO with actionable recommendations."
    };
    
    return pageDescriptions[page] || "Free SEO tools to analyze and optimize your website for better search engine rankings and visibility.";
  }
  
  function isToolPage(page: string): boolean {
    const toolPages = ["domain-age", "domain-authority", "plagiarism", "schema", "readability", "keyword-density", ""];
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