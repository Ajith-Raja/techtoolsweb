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

export type ContentGapCategory = {
  category?: string;
  name?: string;
  keywordCount?: number;
  count?: number;
};

export type ContentGapAnalysisResult = {
  // Fields common to both frontend & Python formats
  yourDomain: string;
  competitorDomains: string[];  // This maps to 'competitors' in Python API
  dateAnalyzed: string;
  premium?: boolean;

  // Analysis info
  analysis: {
    totalMissingKeywords: number;
    lowDifficultyOpportunities: number | string;
    highTrafficOpportunities: number | string;
    topCategories: ContentGapCategory[];
    recommendedActions?: Array<{
      action: string;
      priority: string;
      difficulty: string;
    }>;
  };

  // Keywords section (keywordGaps in Python API)
  keywords: ContentGapKeyword[];

  // Optional fields that may be returned from Python API
  contentOpportunities?: Array<{
    title: string;
    description: string;
    keywords?: string[];
  }>;
  
  // Additional fields specific to Python format (optional)
  // These fields support both old and new format
  competitors?: string[];  // Same as competitorDomains but used by Python API
  keywordGaps?: ContentGapKeyword[];  // Same as keywords but used by Python API
  topicGaps?: string[];  // Used to build topCategories in server mapping
  recommendedActions?: Array<{
    action: string;
    priority: string;
    difficulty: string;
  }>;
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

// Domain Authority types
export type DomainAuthorityResult = {
  domain: string;
  domainAuthority: number;
  pageAuthority: number;
  spamScore: number;
  linkingDomains: number;
  totalBacklinks: number;
  topKeywords: string[];
};

export const domainAuthoritySchema = z.object({
  url: z.string().url("Please enter a valid URL")
});

// Plagiarism Check types
export type PlagiarismResult = {
  originalText: string;
  similarityScore: number;
  matchedSources: {
    url: string;
    title: string;
    snippet: string;
    matchPercentage: number;
  }[];
  uniquenessPercentage: number;
  analyzedLength: number;
  highlightedText?: string;
};

export const plagiarismCheckSchema = z.object({
  text: z.string().min(1, "Text is required"),
  type: z.enum(["text", "url"]),
});

export type PlagiarismCheckInput = z.infer<typeof plagiarismCheckSchema>;

// Readability types
export type ReadabilityScore = {
  fleschReading: {
    score: number;
    level: string;
  };
  fleschKincaid: {
    score: number;
    grade: string;
  };
  gunningFog: {
    score: number;
    level: string;
  };
  smog: {
    score: number;
    level: string;
  };
  textDetails: {
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    readingTime: string;
  };
};

export const readabilityAnalysisSchema = z.object({
  type: z.enum(["url", "content"]),
  value: z.string().min(1, "Content or URL required")
});

// Keyword Density types
export type KeywordResult = {
  keyword: string;
  count: number;
  density: number;
};

export type DensityAnalysisResult = {
  totalWords: number;
  keywords: KeywordResult[];
  topKeywords: KeywordResult[];
  readingTime: string;
};

export const keywordDensitySchema = z.object({
  type: z.enum(["url", "content"]),
  value: z.string().min(1, "Content or URL required"),
  keywords: z.array(z.string()).min(1, "At least one keyword is required")
});

// Pre-Launch Audit types
export type AuditIssue = {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  affectedPages?: string[];
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
};

export type PageAudit = {
  url: string;
  title: string;
  metaDescription: string;
  h1Count: number;
  wordCount: number;
  statusCode: number;
  loadTime: number;
  mobileResponsive: boolean;
  issues: AuditIssue[];
};

export type AuditResult = {
  siteScore: number;
  totalPages: number;
  pagesWithIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  commonIssues: AuditIssue[];
  pageResults: PageAudit[];
  crawlDate: string;
};

export const preLaunchAuditSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  sitemapUrl: z.string().url("Please enter a valid sitemap URL").optional(),
  maxPages: z.number().min(1).max(100),
  userAgent: z.string(),
  requiresAuth: z.boolean(),
  authUsername: z.string().optional(),
  authPassword: z.string().optional()
});

// YouTube Downloader types
export type VideoFormat = {
  format_id: string;
  ext: string;
  resolution: string;
  fps: number;
  filesize: number;
  format_note: string;
  height: number;
  width: number;
  url: string;
  acodec: string;
  vcodec: string;
};

export type VideoInfo = {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;  // in seconds
  formats: VideoFormat[];
  upload_date: string;
  uploader: string;
  view_count: number;
  description?: string;
};

export const youtubeInfoSchema = z.object({
  url: z.string()
    .url("Please enter a valid URL")
    .refine(
      url => url.includes("youtube.com") || url.includes("youtu.be"),
      { message: "URL must be a valid YouTube URL" }
    )
});

export const youtubeDownloadSchema = z.object({
  url: z.string()
    .url("Please enter a valid URL")
    .refine(
      url => url.includes("youtube.com") || url.includes("youtu.be"),
      { message: "URL must be a valid YouTube URL" }
    ),
  format_id: z.string().min(1, "Format is required")
});

export type YoutubeInfoInput = z.infer<typeof youtubeInfoSchema>;
export type YoutubeDownloadInput = z.infer<typeof youtubeDownloadSchema>;