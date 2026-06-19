import type { SeoAnalysisResult } from '@shared/schema';
import * as cheerio from 'cheerio';
import { IncomingMessage } from 'http';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

// Helper functions for SEO analysis
function calculateReadabilityScore(text: string): number {
  // Simple implementation of Flesch Reading Ease
  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  
  if (sentences === 0 || words === 0) return 50; // Default value
  
  const avgWordsPerSentence = words / sentences;
  // Simplified formula
  const score = 206.835 - (1.015 * avgWordsPerSentence);
  
  // Ensure the score is within 0-100 range
  return Math.max(0, Math.min(100, score));
}

function getPageSize(html: string): string {
  const sizeInKb = Math.round((html.length / 1024) * 10) / 10;
  return `${sizeInKb} KB`;
}

function estimateLoadTime(pageSize: number): string {
  // Rough estimation based on page size
  const sizeInMb = pageSize / 1024 / 1024;
  // Assuming average connection speed of 5Mbps
  const timeInSeconds = Math.round((sizeInMb / 5) * 8 * 10) / 10;
  return `${timeInSeconds} seconds`;
}

function getSeverity(issue: string): 'high' | 'medium' | 'low' {
  // Determine severity based on common SEO issues
  if (
    issue.includes('missing meta') || 
    issue.includes('no SSL') || 
    issue.includes('slow page') ||
    issue.includes('multiple H1')
  ) {
    return 'high';
  }
  
  if (
    issue.includes('optimized') ||
    issue.includes('keyword density') ||
    issue.includes('missing alt')
  ) {
    return 'medium';
  }
  
  return 'low';
}

// Get HTML content from URL
async function fetchHtml(url: string): Promise<string> {
  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  const parsedUrl = new URL(url);
  const protocol = parsedUrl.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0;)'
      }
    };
    
    const req = protocol.request(options, (res: IncomingMessage) => {
      let html = '';
      
      res.on('data', (chunk) => {
        html += chunk;
      });
      
      res.on('end', () => {
        resolve(html);
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

// Main function to analyze a website
export async function analyzeSite(url: string): Promise<SeoAnalysisResult> {
  try {
    // Make sure the URL is properly formatted
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    
    try {
      // Try to use Python API for more advanced analysis
      console.log('Attempting to use Python SEO API for enhanced analysis...');
      
      const pythonApiResponse = await fetch('http://localhost:8100/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (pythonApiResponse.ok) {
        const pythonResult = await pythonApiResponse.json();
        console.log('Python SEO API analysis successful');
        return pythonResult;
      } else {
        console.log('Python SEO API returned error, falling back to built-in analyzer');
        // If Python API is not available, fall back to built-in analysis
        return await performBuiltinAnalysis(url);
      }
    } catch (pythonApiError) {
      console.error('Error connecting to Python SEO API:', pythonApiError);
      console.log('Falling back to built-in SEO analyzer');
      
      // If Python API is not available, fall back to built-in analysis
      return await performBuiltinAnalysis(url);
    }
  } catch (error) {
    console.error('Error analyzing site:', error);
    throw new Error(`Failed to analyze site: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Built-in fallback analyzer function
async function performBuiltinAnalysis(url: string): Promise<SeoAnalysisResult> {
  try {
    // Fetch HTML content
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    // Extract meta information
    const metaTitle = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
    const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const metaRobots = $('meta[name="robots"]').attr('content') || '';
    const metaViewport = $('meta[name="viewport"]').attr('content') || '';
    
    const ogTitle = $('meta[property="og:title"]').attr('content') || null;
    const ogDescription = $('meta[property="og:description"]').attr('content') || null;
    const ogImage = $('meta[property="og:image"]').attr('content') || null;
    
    // Extract header structure
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    
    // Analyze hierarchy
    let isHierarchyCorrect = true;
    let headerStructure = 'Properly nested';
    
    if (h1Count === 0) {
      isHierarchyCorrect = false;
      headerStructure = 'Missing H1 tag';
    } else if (h1Count > 1) {
      isHierarchyCorrect = false;
      headerStructure = 'Multiple H1 tags found';
    }
    
    // Content analysis
    // Remove script and style elements for accurate word count
    $('script, style').remove();
    const bodyText = $('body').text();
    const cleanText = bodyText.replace(/\s+/g, ' ').trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const paragraphCount = $('p').length;
    
    // Calculate average sentence length
    const sentences = cleanText.split(/[.!?]+/).filter(Boolean);
    const averageSentenceLength = sentences.length > 0 ? 
      Math.round(words.length / sentences.length) : 0;
    
    // Calculate keyword density
    const keywordDensity: {[key: string]: number} = {};
    // Get top words (excluding common words)
    const stopWords = ['the', 'and', 'a', 'to', 'in', 'of', 'is', 'that', 'for', 'on', 'you', 'this', 'with'];
    const wordFrequency: {[key: string]: number} = {};
    
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (lowerWord.length > 3 && !stopWords.includes(lowerWord)) {
        wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
      }
    });
    
    // Get top 5 keywords
    const sortedWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    sortedWords.forEach(([word, count]) => {
      keywordDensity[word] = Number(((count / wordCount) * 100).toFixed(1));
    });
    
    // Content quality checks
    const hasImages = $('img').length > 0;
    const links = $('a');
    const hasLinks = links.length > 0;
    
    let internalLinksCount = 0;
    let externalLinksCount = 0;
    
    links.each((i, link) => {
      const href = $(link).attr('href') || '';
      if (href.startsWith('http') && !href.includes(new URL(url).hostname)) {
        externalLinksCount++;
      } else if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        internalLinksCount++;
      }
    });
    
    // Technical SEO checks
    const hasSSL = url.startsWith('https://');
    const hasSitemap = html.includes('sitemap.xml') || $('a[href*="sitemap.xml"]').length > 0;
    const hasRobotsTxt = html.includes('robots.txt') || $('a[href*="robots.txt"]').length > 0;
    
    // Check if images have alt text
    const images = $('img');
    let imagesWithoutAlt = 0;
    images.each((i, img) => {
      if (!$(img).attr('alt')) {
        imagesWithoutAlt++;
      }
    });
    const imagesOptimized = imagesWithoutAlt === 0;
    
    // Page size and load time (estimates)
    const pageSize = getPageSize(html);
    const loadTime = estimateLoadTime(html.length);
    
    // Test mobile responsiveness
    const mobileResponsive = metaViewport.includes('width=device-width') || 
      metaViewport.includes('initial-scale=1');
    
    // Generate recommendations
    const issues: Array<{
      issue: string;
      severity: 'high' | 'medium' | 'low';
      impact: string;
      solution: string;
    }> = [];
    
    if (!metaTitle || metaTitle.length < 10) {
      issues.push({
        issue: "Missing or short meta title",
        severity: 'high',
        impact: "Reduces visibility in search results",
        solution: "Add a descriptive title between 50-60 characters"
      });
    } else if (metaTitle.length > 60) {
      issues.push({
        issue: "Meta title too long",
        severity: 'medium',
        impact: "Title may be truncated in search results",
        solution: "Shorten title to 50-60 characters"
      });
    }
    
    if (!metaDescription) {
      issues.push({
        issue: "Missing meta description",
        severity: 'high',
        impact: "Reduces click-through rates from search results",
        solution: "Add a compelling meta description between 120-160 characters"
      });
    } else if (metaDescription.length < 100) {
      issues.push({
        issue: "Meta description too short",
        severity: 'medium',
        impact: "May not provide enough context for users",
        solution: "Expand description to 120-160 characters"
      });
    } else if (metaDescription.length > 160) {
      issues.push({
        issue: "Meta description too long",
        severity: 'low',
        impact: "Description may be truncated in search results",
        solution: "Shorten description to 120-160 characters"
      });
    }
    
    if (h1Count === 0) {
      issues.push({
        issue: "Missing H1 tag",
        severity: 'high',
        impact: "Search engines may not identify the main topic",
        solution: "Add a single H1 tag with your primary keyword"
      });
    } else if (h1Count > 1) {
      issues.push({
        issue: "Multiple H1 tags",
        severity: 'high',
        impact: "Confuses search engines about main topic",
        solution: "Keep only one H1 tag that clearly describes the page content"
      });
    }
    
    if (!hasSSL) {
      issues.push({
        issue: "No SSL certificate",
        severity: 'high',
        impact: "Negative impact on rankings and user trust",
        solution: "Implement HTTPS across your entire site"
      });
    }
    
    if (wordCount < 300) {
      issues.push({
        issue: "Thin content",
        severity: 'medium',
        impact: "May be seen as low value by search engines",
        solution: "Expand content to at least 500 words with valuable information"
      });
    }
    
    if (imagesWithoutAlt > 0) {
      issues.push({
        issue: "Images missing alt text",
        severity: 'medium',
        impact: "Missed opportunity for image search and accessibility",
        solution: `Add descriptive alt text to ${imagesWithoutAlt} images`
      });
    }
    
    if (!mobileResponsive) {
      issues.push({
        issue: "Not mobile-friendly",
        severity: 'high',
        impact: "Negative impact in mobile-first indexing",
        solution: "Implement responsive design with proper viewport meta tag"
      });
    }
    
    if (html.length > 100000) {
      issues.push({
        issue: "Large page size",
        severity: 'medium',
        impact: "Slower loading times affect user experience and rankings",
        solution: "Optimize HTML, minimize CSS/JS, compress images"
      });
    }
    
    if (!hasSitemap) {
      issues.push({
        issue: "Missing sitemap",
        severity: 'medium',
        impact: "Makes it harder for search engines to discover all pages",
        solution: "Generate and submit an XML sitemap"
      });
    }
    
    if (externalLinksCount === 0) {
      issues.push({
        issue: "No external links",
        severity: 'low',
        impact: "Missed opportunity for topic relevance signals",
        solution: "Add links to authoritative external resources"
      });
    }
    
    // Calculate overall score based on findings
    let scoreBase = 100;
    let deductions = 0;
    
    // Deduct for high severity issues
    deductions += issues.filter(i => i.severity === 'high').length * 10;
    // Deduct for medium severity issues
    deductions += issues.filter(i => i.severity === 'medium').length * 5;
    // Deduct for low severity issues
    deductions += issues.filter(i => i.severity === 'low').length * 2;
    
    // Calculate the final score
    const score = Math.max(0, Math.min(100, scoreBase - deductions));
    
    // Build and return the analysis result
    return {
      score,
      metaTags: {
        title: metaTitle,
        description: metaDescription,
        keywords: metaKeywords,
        robots: metaRobots,
        viewport: metaViewport,
        ogTags: {
          title: ogTitle,
          description: ogDescription,
          image: ogImage
        },
        hasTitle: Boolean(metaTitle),
        hasDescription: Boolean(metaDescription),
        titleLength: metaTitle.length,
        descriptionLength: metaDescription.length,
        isOptimized: Boolean(metaTitle) && Boolean(metaDescription) && 
          metaTitle.length >= 50 && metaTitle.length <= 60 && 
          metaDescription.length >= 120 && metaDescription.length <= 160
      },
      headers: {
        h1Count,
        h2Count,
        h3Count,
        hasH1: h1Count > 0,
        headerStructure,
        isHierarchyCorrect
      },
      contentAnalysis: {
        wordCount,
        hasEnoughContent: wordCount >= 300,
        paragraphCount,
        averageSentenceLength,
        readabilityScore: calculateReadabilityScore(cleanText),
        keywordDensity,
        contentQuality: {
          hasImages,
          hasLinks,
          internalLinksCount,
          externalLinksCount
        }
      },
      technicalSeo: {
        mobileResponsive,
        hasSSL,
        hasSitemap,
        hasRobotsTxt,
        loadTime,
        pageSize,
        imagesOptimized
      },
      recommendations: issues
    };
  } catch (error) {
    console.error('Error in built-in SEO analysis:', error);
    throw error;
  }
}