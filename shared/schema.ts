import { pgTable, text, serial, integer, boolean, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
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
  plan: text("plan").default("free"),
  createdAt: text("created_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const analysisTypeEnum = pgEnum('analysis_type', [
  'seo_analysis', 
  'plagiarism_check', 
  'content_gap', 
  'readability', 
  'keyword_density',
  'domain_authority',
  'pre_launch_audit'
]);

export const userAnalysisHistory = pgTable("user_analysis_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  analysisType: analysisTypeEnum("analysis_type").notNull(),
  targetUrl: text("target_url").notNull(),
  resultData: jsonb("result_data").notNull(),
  favorite: boolean("favorite").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
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

export const contentGapAnalyzerSchema = z.object({
  yourDomain: z.string().url("Please enter a valid URL"),
  competitorDomains: z.array(z.string().url("Please enter a valid URL")).min(1, "Add at least one competitor").max(3, "Maximum 3 competitors allowed"),
  language: z.string().optional(),
  location: z.string().optional(),
  niche: z.string().optional()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AnalyzeSiteInput = z.infer<typeof analyzeSiteSchema>;
export type ContentGapAnalyzerInput = z.infer<typeof contentGapAnalyzerSchema>;
export type SeoResult = typeof seoResults.$inferSelect;

export type ContentGapKeyword = {
  keyword: string;
  competitors: Array<{
    domain: string;
    position: number;
  }>;
  searchVolume: number;
  keywordDifficulty: number;
  trafficPotential: 'Low' | 'Medium' | 'High';
  cpc: number;
  contentSuggestion: string;
};

export type ContentGapAnalysisResult = {
  yourDomain: string;
  competitorDomains: string[];
  analysis: {
    totalMissingKeywords: number;
    lowDifficultyOpportunities: number;
    highTrafficOpportunities: number;
    topCategories: Array<{
      category: string;
      keywordCount: number;
    }>;
  };
  keywords: ContentGapKeyword[];
  dateAnalyzed: string;
  premium: boolean;
};

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