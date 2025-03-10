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
  recommendations: jsonb("recommendations").notNull(),
  createdAt: text("created_at").notNull()
});

export const analyzeSiteSchema = z.object({
  url: z.string().url("Please enter a valid URL")
});

export type AnalyzeSiteInput = z.infer<typeof analyzeSiteSchema>;
export type SeoResult = typeof seoResults.$inferSelect;

export type SeoAnalysisResult = {
  score: number;
  metaTags: {
    title: string | null;
    description: string | null;
    hasTitle: boolean;
    hasDescription: boolean;
    titleLength: number;
    descriptionLength: number;
  };
  headers: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hasH1: boolean;
  };
  contentAnalysis: {
    wordCount: number;
    hasEnoughContent: boolean;
    paragraphCount: number;
  };
  recommendations: string[];
};
