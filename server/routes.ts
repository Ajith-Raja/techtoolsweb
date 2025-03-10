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
    // Return mock data for testing
    res.json({
      score: 75,
      metaTags: {
        title: "Example Website",
        description: "This is a mock description for testing the SEO analyzer",
        hasTitle: true,
        hasDescription: true,
        titleLength: 15,
        descriptionLength: 50
      },
      headers: {
        h1Count: 1,
        h2Count: 3,
        h3Count: 5,
        hasH1: true
      },
      contentAnalysis: {
        wordCount: 850,
        hasEnoughContent: true,
        paragraphCount: 12
      },
      recommendations: [
        "Add more descriptive meta title",
        "Include more relevant keywords in your content",
        "Consider adding alt text to images",
        "Improve internal linking structure",
        "Optimize page loading speed"
      ]
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}