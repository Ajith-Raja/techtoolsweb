import type { SeoAnalysisResult } from '@shared/schema';

export async function analyzeSite(url: string): Promise<SeoAnalysisResult> {
  // Return dummy data for testing
  return {
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
  };
}