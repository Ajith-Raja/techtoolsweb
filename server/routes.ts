import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeSite } from "./seo-analyzer";
import { analyzeSiteSchema } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}