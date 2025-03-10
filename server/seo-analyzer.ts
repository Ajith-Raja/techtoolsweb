import * as cheerio from 'cheerio';
import type { SeoAnalysisResult } from '@shared/schema';

export async function analyzeSite(url: string): Promise<SeoAnalysisResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch site: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Analyze meta tags
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content');
    
    const metaTags = {
      title: title || null,
      description: description || null,
      hasTitle: !!title,
      hasDescription: !!description,
      titleLength: title?.length || 0,
      descriptionLength: description?.length || 0
    };

    // Analyze headers
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;

    const headers = {
      h1Count,
      h2Count,
      h3Count,
      hasH1: h1Count > 0
    };

    // Analyze content
    const wordCount = $('body').text().trim().split(/\s+/).length;
    const paragraphCount = $('p').length;

    const contentAnalysis = {
      wordCount,
      hasEnoughContent: wordCount >= 300,
      paragraphCount
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (!metaTags.hasTitle) {
      recommendations.push("Add a title tag to your page");
    } else if (metaTags.titleLength < 30 || metaTags.titleLength > 60) {
      recommendations.push("Optimize title length (should be between 30-60 characters)");
    }

    if (!metaTags.hasDescription) {
      recommendations.push("Add a meta description to your page");
    } else if (metaTags.descriptionLength < 120 || metaTags.descriptionLength > 160) {
      recommendations.push("Optimize meta description length (should be between 120-160 characters)");
    }

    if (!headers.hasH1) {
      recommendations.push("Add an H1 heading to your page");
    } else if (headers.h1Count > 1) {
      recommendations.push("Use only one H1 heading per page");
    }

    if (!contentAnalysis.hasEnoughContent) {
      recommendations.push("Add more content to your page (aim for at least 300 words)");
    }

    // Calculate score
    let score = 100;

    if (!metaTags.hasTitle) score -= 15;
    if (!metaTags.hasDescription) score -= 15;
    if (!headers.hasH1) score -= 10;
    if (headers.h1Count > 1) score -= 5;
    if (!contentAnalysis.hasEnoughContent) score -= 10;
    if (metaTags.titleLength < 30 || metaTags.titleLength > 60) score -= 5;
    if (metaTags.descriptionLength < 120 || metaTags.descriptionLength > 160) score -= 5;

    return {
      score: Math.max(0, score),
      metaTags,
      headers,
      contentAnalysis,
      recommendations
    };
  } catch (error) {
    throw new Error(`Failed to analyze site: ${error.message}`);
  }
}
