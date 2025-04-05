import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const seoResults = pgTable("seo_results", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  score: integer("score").notNull(),
  metaTags: jsonb("meta_tags").notNull(),
  headers: jsonb("headers").notNull(),
  contentAnalysis: jsonb("content_analysis").notNull(),
  technicalSeo: jsonb("technical_seo").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: text("created_at").notNull(),
  userId: integer("user_id")
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const analyzeSiteSchema = z.object({
  url: z.string().url("Please enter a valid URL")
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AnalyzeSiteInput = z.infer<typeof analyzeSiteSchema>;
export type SeoResult = typeof seoResults.$inferSelect;

export type SeoAnalysisResult = {
  score: number;
  metaTags: {
    title: string | null;
    description: string | null;
    keywords: string | null;
    robots: string | null;
    viewport: string | null;
    ogTags: {
      title: string | null;
      description: string | null;
      image: string | null;
    };
    hasTitle: boolean;
    hasDescription: boolean;
    titleLength: number;
    descriptionLength: number;
    isOptimized: boolean;
  };
  headers: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hasH1: boolean;
    headerStructure: string;
    isHierarchyCorrect: boolean;
  };
  contentAnalysis: {
    wordCount: number;
    hasEnoughContent: boolean;
    paragraphCount: number;
    averageSentenceLength: number;
    readabilityScore: number;
    keywordDensity: {
      [key: string]: number;
    };
    contentQuality: {
      hasImages: boolean;
      hasLinks: boolean;
      internalLinksCount: number;
      externalLinksCount: number;
    };
  };
  technicalSeo: {
    mobileResponsive: boolean;
    hasSSL: boolean;
    hasSitemap: boolean;
    hasRobotsTxt: boolean;
    loadTime: string;
    pageSize: string;
    imagesOptimized: boolean;
  };
  recommendations: Array<{
    issue: string;
    severity: 'high' | 'medium' | 'low';
    impact: string;
    solution: string;
  }>;
};