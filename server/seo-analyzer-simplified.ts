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

// Helper function to check if a URL exists
async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const protocol = url.startsWith('https:') ? https : http;
    
    return new Promise((resolve) => {
      const req = protocol.request(url, { method: 'HEAD' }, (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 400);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.end();
    });
  } catch (err) {
    return false;
  }
}

// Main function to analyze a website
export async function analyzeSite(url: string): Promise<SeoAnalysisResult> {
  try {
    // Make sure the URL is properly formatted
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    
    // Fetch HTML content
    console.log('Fetching HTML content for analysis...');
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    // Extract meta information with improved fallbacks
    const metaTitle = $('title').text() || 
      $('meta[property="og:title"]').attr('content') || 
      $('h1').first().text() || '';
    
    const metaDescription = $('meta[name="description"]').attr('content') || 
      $('meta[property="og:description"]').attr('content') || 
      $('p').first().text().substring(0, 160) || '';
    
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const metaRobots = $('meta[name="robots"]').attr('content') || '';
    const metaViewport = $('meta[name="viewport"]').attr('content') || '';
    
    // More comprehensive Open Graph tag extraction
    const ogTitle = $('meta[property="og:title"]').attr('content') || null;
    const ogDescription = $('meta[property="og:description"]').attr('content') || null;
    const ogImage = $('meta[property="og:image"]').attr('content') || null;
    
    // Enhanced header structure analysis
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    
    // Check header hierarchy for proper nesting
    let isHierarchyCorrect = true;
    let headerStructure = 'Properly nested';
    
    if (h1Count === 0) {
      isHierarchyCorrect = false;
      headerStructure = 'Missing H1 tag';
    } else if (h1Count > 1) {
      isHierarchyCorrect = false;
      headerStructure = 'Multiple H1 tags found';
    }
    
    // Improved content analysis
    // More effective script and style removal
    $('script, style, noscript, iframe, object, embed').remove();
    const bodyText = $('body').text();
    const cleanText = bodyText.replace(/\s+/g, ' ').trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    
    // More detailed paragraph analysis
    const paragraphs = $('p');
    const paragraphCount = paragraphs.length;
    
    // Improved readability analysis
    const sentences = cleanText.split(/[.!?]+/).filter(Boolean);
    const averageSentenceLength = sentences.length > 0 ? 
      Math.round(words.length / sentences.length) : 0;
    
    // Enhanced keyword analysis
    const keywordDensity: {[key: string]: number} = {};
    
    // More comprehensive stop words list
    const stopWords = [
      'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'by', 'with', 
      'about', 'as', 'from', 'of', 'is', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'if', 'then',
      'this', 'that', 'these', 'those', 'they', 'them', 'their', 'it', 'its',
      'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her'
    ];
    
    // Get word frequency excluding stop words
    const wordFrequency: {[key: string]: number} = {};
    
    words.forEach(word => {
      const lowerWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerWord.length > 3 && !stopWords.includes(lowerWord)) {
        wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
      }
    });
    
    // Extract top 10 keywords with their density
    const sortedWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedWords.forEach(([word, count]) => {
      keywordDensity[word] = Number(((count / wordCount) * 100).toFixed(1));
    });
    
    // Enhanced content quality analysis
    const hasImages = $('img').length > 0;
    const links = $('a');
    const hasLinks = links.length > 0;
    
    // Analyze internal vs external links
    let internalLinksCount = 0;
    let externalLinksCount = 0;
    const urlObj = new URL(url);
    
    links.each((i, link) => {
      const href = $(link).attr('href') || '';
      
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        // Skip empty, anchor or javascript links
        return;
      }
      
      try {
        // Handle both absolute and relative URLs
        const isAbsolute = href.startsWith('http');
        if (isAbsolute) {
          const linkUrl = new URL(href);
          if (linkUrl.hostname === urlObj.hostname) {
            internalLinksCount++;
          } else {
            externalLinksCount++;
          }
        } else {
          // Relative URL, must be internal
          internalLinksCount++;
        }
      } catch (e) {
        // If URL parsing fails, assume it's internal
        internalLinksCount++;
      }
    });
    
    // Advanced technical SEO checks
    const hasSSL = url.startsWith('https://');
    
    // Check for sitemap
    const sitemapExists = html.includes('sitemap.xml') || 
      $('a[href*="sitemap.xml"]').length > 0 ||
      await checkUrlExists(`${urlObj.origin}/sitemap.xml`);
    
    // Check for robots.txt
    const robotsTxtExists = html.includes('robots.txt') || 
      $('a[href*="robots.txt"]').length > 0 ||
      await checkUrlExists(`${urlObj.origin}/robots.txt`);
    
    // Enhanced image optimization check
    const images = $('img');
    let imagesWithoutAlt = 0;
    
    images.each((i, img) => {
      if (!$(img).attr('alt')) {
        imagesWithoutAlt++;
      }
    });
    
    const imagesOptimized = images.length === 0 || imagesWithoutAlt === 0;
    
    // Page performance metrics
    const pageSize = getPageSize(html);
    const loadTime = estimateLoadTime(html.length);
    
    // Mobile responsiveness check
    const mobileResponsive = !!metaViewport && (
      metaViewport.includes('width=device-width') || 
      metaViewport.includes('initial-scale=1')
    );
    
    // Generate comprehensive recommendations
    const issues: Array<{
      issue: string;
      severity: 'high' | 'medium' | 'low';
      impact: string;
      solution: string;
    }> = [];
    
    // Title issues
    if (!metaTitle) {
      issues.push({
        issue: "Missing page title",
        severity: 'high',
        impact: "Critical for search engines to understand page content",
        solution: "Add a descriptive title with main keywords (50-60 characters)"
      });
    } else if (metaTitle.length < 30) {
      issues.push({
        issue: "Title too short",
        severity: 'medium',
        impact: "May not effectively communicate page content to search engines",
        solution: "Expand title to 50-60 characters with main keywords"
      });
    } else if (metaTitle.length > 60) {
      issues.push({
        issue: "Title too long",
        severity: 'medium',
        impact: "Will be truncated in search results",
        solution: "Shorten title to 50-60 characters while maintaining keywords"
      });
    }
    
    // Meta description issues
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
        impact: "May not provide enough context for users in search results",
        solution: "Expand description to 120-160 characters with call to action"
      });
    } else if (metaDescription.length > 160) {
      issues.push({
        issue: "Meta description too long",
        severity: 'low',
        impact: "Will be truncated in search results",
        solution: "Shorten description to 120-160 characters"
      });
    }
    
    // Header structure issues
    if (h1Count === 0) {
      issues.push({
        issue: "Missing H1 heading",
        severity: 'high',
        impact: "Main topic of page unclear to search engines",
        solution: "Add a single H1 heading containing primary keyword"
      });
    } else if (h1Count > 1) {
      issues.push({
        issue: "Multiple H1 headings",
        severity: 'high',
        impact: "Dilutes the importance of main heading for search engines",
        solution: "Use only one H1 heading, move others to H2"
      });
    }
    
    // Content quality issues
    if (wordCount < 300) {
      issues.push({
        issue: "Thin content",
        severity: 'medium',
        impact: "May be seen as low value by search engines",
        solution: "Expand content to at least 500 words with valuable information"
      });
    }
    
    // Technical SEO issues
    if (!hasSSL) {
      issues.push({
        issue: "No SSL certificate",
        severity: 'high',
        impact: "Negative impact on rankings and user trust",
        solution: "Implement HTTPS across your entire site"
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
    
    if (!sitemapExists) {
      issues.push({
        issue: "Missing sitemap",
        severity: 'medium',
        impact: "Makes it harder for search engines to discover all pages",
        solution: "Generate and submit an XML sitemap"
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
    
    // Calculate enhanced overall score
    let scoreBase = 100;
    let deductions = 0;
    
    // Deduct for issues by severity
    deductions += issues.filter(i => i.severity === 'high').length * 10;
    deductions += issues.filter(i => i.severity === 'medium').length * 5;
    deductions += issues.filter(i => i.severity === 'low').length * 2;
    
    // Calculate the final score
    let score = Math.max(0, Math.min(100, scoreBase - deductions));
    
    // Build and return the enhanced analysis result
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
          metaTitle.length >= 40 && metaTitle.length <= 60 && 
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
        hasSitemap: sitemapExists,
        hasRobotsTxt: robotsTxtExists,
        loadTime,
        pageSize,
        imagesOptimized
      },
      recommendations: issues
    };
  } catch (error) {
    console.error('Error analyzing site:', error);
    throw new Error(`Failed to analyze site: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}