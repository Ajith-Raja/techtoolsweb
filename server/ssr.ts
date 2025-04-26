import { Request } from "express";
import * as cheerio from 'cheerio';

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
  canonicalUrl: string;
}

const defaultMetadata: PageMetadata = {
  title: "SEO Analyzer - Free SEO Analysis and Optimization Tools",
  description: "Get comprehensive SEO analysis, detailed insights, and actionable recommendations to improve your website ranking and visibility in search engines.",
  keywords: "seo analyzer, seo analysis, website analysis, seo tools, seo audit, search engine optimization",
  ogTitle: "SEO Analyzer - Free SEO Analysis Tools",
  ogDescription: "Powerful SEO analysis tools to improve your website's search engine ranking and visibility.",
  ogImage: "/og-image.jpg", // Default OG image
  ogUrl: "",
  ogType: "website",
  twitterCard: "summary_large_image",
  canonicalUrl: ""
};

/**
 * Get metadata for a specific page
 */
export function getPageMetadata(path: string, req: Request): PageMetadata {
  const host = req.get('host') || '';
  const protocol = req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;
  const fullUrl = `${baseUrl}${path}`;
  
  // Extract the page name from the path
  const pageName = path.split('/')[1] || '';
  
  const metadata = { ...defaultMetadata };
  
  // Set basic URL metadata
  metadata.ogUrl = fullUrl;
  metadata.canonicalUrl = fullUrl;
  
  // Tool-specific titles and descriptions
  const pageTitles: Record<string, string> = {
    "": "SEO Analyzer - Free SEO Analysis and Optimization Tools",
    "domain-age-checker": "Domain Age Checker - Find the Age of Any Website | SEO Analyzer",
    "domain-authority-checker": "Domain & Page Authority Checker - SEO Metrics | SEO Analyzer",
    "plagiarism-checker": "Plagiarism Checker - Check Text for Duplicate Content | SEO Analyzer",
    "schema-generator": "Schema Markup Generator - Structured Data for SEO | SEO Analyzer",
    "readability-checker": "Readability Score Checker - Optimize Content for Your Audience | SEO Analyzer",
    "keyword-density-checker": "Keyword Density Checker - Optimize Your SEO Keywords | SEO Analyzer",
    "font-generator": "Web Safe Font Generator - Create Custom Font Styles | SEO Analyzer",
    "image-compressor": "Image Compressor - Optimize Images for Web Performance | SEO Analyzer",
    "transliterate": "Google Transliterate - Type in English & Get Text in Multiple Languages | SEO Analyzer",
    "pre-launch-audit": "Pre-Launch SEO Audit Tool - Comprehensive Site Health Check | SEO Analyzer",
    "content-gap-analyzer": "Content Gap Analyzer - Find Keyword Opportunities | SEO Analyzer",
    "diff-checker": "Diff Checker - Compare Text and Find Differences | SEO Analyzer",
    "regex-tester": "Regex Tester - Test Regular Expressions with Live Results | SEO Analyzer",
    "api-tester": "API Tester - Test APIs with Advanced Request Configuration | SEO Analyzer",
    "youtube-downloader": "YouTube Video Downloader - Download Videos in Various Qualities | SEO Analyzer",
    "qr-code-generator": "QR Code Generator - Create Custom QR Codes for Any Purpose | SEO Analyzer",
    "about": "About SEO Analyzer - Our Story and Mission",
    "features": "SEO Tools and Features - Comprehensive SEO Suite",
    "calculators": "SEO & Web Calculators - Useful Tools for Marketers | SEO Analyzer",
    "pdf-tools": "PDF Tools - Edit, Convert, Merge PDF Files | SEO Analyzer",
    "results": "SEO Analysis Results - Detailed Website Insights",
    "login": "Login to SEO Analyzer - Access Premium Features",
    "signup": "Sign Up for SEO Analyzer - Get Started with SEO Tools",
  };
  
  const pageDescriptions: Record<string, string> = {
    "": "Get comprehensive SEO analysis, detailed insights, and actionable recommendations to improve your website ranking and visibility in search engines.",
    "domain-age-checker": "Check any domain age, creation date, expiry, and registration details with our free Domain Age Checker tool. Important SEO metrics at your fingertips.",
    "domain-authority-checker": "Check your website Domain and Page Authority scores. Understand your SEO ranking potential and compare with competitors using our free tool.",
    "plagiarism-checker": "Check your content for plagiarism and duplicate content. Our free tool analyzes your text against billions of web pages to ensure originality.",
    "schema-generator": "Generate schema markup and structured data for your website to enhance rich snippets in search results and improve SEO visibility.",
    "readability-checker": "Analyze the readability of your content to ensure it's appropriate for your target audience. Get Flesch Reading Ease, grade level scores, and content statistics.",
    "keyword-density-checker": "Analyze the keyword density in your content. Optimize your keyword usage for better SEO performance and avoid keyword stuffing penalties.",
    "font-generator": "Create custom web-safe font styles for your website. Preview fonts with different sizes, weights, and styles, then generate the CSS code you need.",
    "image-compressor": "Optimize your images for better web performance. Reduce file size while maintaining quality to improve page load speed and SEO rankings.",
    "transliterate": "Type in English and get text in Hindi, Tamil, or Bengali with our real-time transliteration tool. Perfect for multilingual content creation.",
    "pre-launch-audit": "Scan your entire website for SEO issues before launch. Identify and fix problems with meta tags, content, load speed, and more for better search rankings.",
    "content-gap-analyzer": "Find keyword opportunities your competitors are ranking for but you're missing. Improve your content strategy with our gap analysis tool.",
    "diff-checker": "Compare two text documents and find differences with our intuitive diff checker tool. Perfect for comparing code, content versions, or any text.",
    "regex-tester": "Test regular expressions with our interactive regex tester. See live matches, get explanations, and test your patterns in multiple languages.",
    "api-tester": "Test APIs with our advanced request builder. Create, save, and share API requests with custom headers, auth, and body content.",
    "youtube-downloader": "Download YouTube videos in various qualities. Our YouTube downloader tool is fast, free, and works with all modern browsers.",
    "qr-code-generator": "Create custom QR codes for websites, text, vCards, WiFi networks, and more. Our QR code generator offers multiple styling options.",
    "about": "Learn about SEO Analyzer, our mission to make SEO accessible for everyone, and how our tools can help improve your website performance.",
    "features": "Explore all the features and tools offered by SEO Analyzer. From basic SEO analysis to advanced technical SEO optimization.",
    "calculators": "Access our collection of specialized calculators for SEO professionals, web developers, and digital marketers.",
    "pdf-tools": "Comprehensive PDF tools to edit, convert, merge, split, extract content, and more. All your PDF needs in one place.",
    "results": "Review detailed SEO analysis for your website. Get insights on meta tags, headers, content quality, and technical SEO with actionable recommendations.",
    "login": "Login to your SEO Analyzer account to access premium features, saved analysis history, and personalized recommendations.",
    "signup": "Create a free SEO Analyzer account to unlock premium features, save your analysis history, and get personalized recommendations.",
  };
  
  const pageKeywords: Record<string, string> = {
    "": "seo analyzer, seo analysis, website analysis, seo tools, seo audit, search engine optimization",
    "domain-age-checker": "domain age, website age, domain creation date, domain registration, when was domain created, domain expiry date",
    "domain-authority-checker": "domain authority, page authority, website authority, domain rating, seo metrics, backlink analysis",
    "plagiarism-checker": "plagiarism checker, duplicate content, content originality, plagiarism detector, copy content check, unique content",
    "schema-generator": "schema markup, structured data, json-ld, schema.org, rich snippets, microdata generator",
    "readability-checker": "readability score, reading level, flesch reading ease, grade level, readability test, content analysis",
    "keyword-density-checker": "keyword density, keyword frequency, keyword analysis, seo keyword tool, keyword optimization, keyword usage",
    "font-generator": "font generator, web fonts, custom fonts, font styling, css fonts, typography tool",
    "image-compressor": "image compression, image optimizer, reduce image size, compress jpg, compress png, web image optimization",
    "transliterate": "transliteration, google transliterate, english to hindi, english to tamil, english to bengali, typing tool",
    "pre-launch-audit": "pre-launch seo, website audit, seo checklist, site audit, technical seo, launch preparation",
    "content-gap-analyzer": "content gap, keyword opportunities, competitor keywords, seo content strategy, keyword research, content optimization",
    "diff-checker": "diff checker, text comparison, compare documents, find differences, code diff, text diff",
    "regex-tester": "regex tester, regular expressions, regex pattern, regex validator, regex tool, regex testing",
    "api-tester": "api tester, api testing, rest client, http client, postman alternative, api requests",
    "youtube-downloader": "youtube downloader, download youtube videos, youtube to mp4, save youtube video, youtube converter",
    "qr-code-generator": "qr code generator, create qr code, custom qr codes, qr code maker, vcard qr code, wifi qr code",
  };
  
  if (pageName && pageTitles[pageName]) {
    metadata.title = pageTitles[pageName];
    metadata.ogTitle = pageTitles[pageName];
  }
  
  if (pageName && pageDescriptions[pageName]) {
    metadata.description = pageDescriptions[pageName];
    metadata.ogDescription = pageDescriptions[pageName];
  }
  
  if (pageName && pageKeywords[pageName]) {
    metadata.keywords = pageKeywords[pageName];
  }
  
  // Set OG image based on tool category
  const seoTools = ["domain-age-checker", "domain-authority-checker", "plagiarism-checker", 
                     "schema-generator", "readability-checker", "keyword-density-checker",
                     "pre-launch-audit", "content-gap-analyzer"];
  
  const utilityTools = ["font-generator", "image-compressor", "transliterate", "diff-checker", 
                         "regex-tester", "api-tester", "youtube-downloader", "qr-code-generator"];
  
  const documentTools = ["pdf-tools"];
  
  if (seoTools.includes(pageName)) {
    metadata.ogImage = "/og-images/seo-tools.jpg";
  } else if (utilityTools.includes(pageName)) {
    metadata.ogImage = "/og-images/utility-tools.jpg";
  } else if (documentTools.includes(pageName)) {
    metadata.ogImage = "/og-images/document-tools.jpg";
  } else if (pageName === "calculators") {
    metadata.ogImage = "/og-images/calculators.jpg";
  }
  
  return metadata;
}

/**
 * Apply metadata to HTML content
 */
export function applyMetadata(html: string, metadata: PageMetadata): string {
  const $ = cheerio.load(html);
  
  function updateMetaTag(property: string, content: string) {
    const selector = property.startsWith('og:') || property.startsWith('twitter:')
      ? `meta[property="${property}"]`
      : `meta[name="${property}"]`;
    
    if ($(selector).length > 0) {
      $(selector).attr('content', content);
    } else {
      const attrs = property.startsWith('og:') || property.startsWith('twitter:')
        ? { property, content }
        : { name: property, content };
      
      $('head').append(`<meta ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`);
    }
  }
  
  // Update basic metadata
  $('title').text(metadata.title);
  updateMetaTag('description', metadata.description);
  updateMetaTag('keywords', metadata.keywords);
  
  // Update Open Graph metadata
  updateMetaTag('og:title', metadata.ogTitle);
  updateMetaTag('og:description', metadata.ogDescription);
  updateMetaTag('og:image', metadata.ogImage);
  updateMetaTag('og:url', metadata.ogUrl);
  updateMetaTag('og:type', metadata.ogType);
  
  // Update Twitter Card metadata
  updateMetaTag('twitter:card', metadata.twitterCard);
  updateMetaTag('twitter:title', metadata.ogTitle);
  updateMetaTag('twitter:description', metadata.ogDescription);
  updateMetaTag('twitter:image', metadata.ogImage);
  
  // Update canonical URL
  if ($('link[rel="canonical"]').length > 0) {
    $('link[rel="canonical"]').attr('href', metadata.canonicalUrl);
  } else {
    $('head').append(`<link rel="canonical" href="${metadata.canonicalUrl}" />`);
  }
  
  return $.html();
}

/**
 * Check if a page should have preloaded data for SEO
 */
export function shouldPreloadData(path: string): boolean {
  // List of paths that should have preloaded data
  const preloadPaths = [
    '/results', // Analysis results page
    '/domain-authority-checker', // Domain authority page (for examples)
    '/readability-checker', // Readability page (for examples)
    '/keyword-density-checker', // Keyword analysis page (for examples)
  ];
  
  return preloadPaths.some(p => path.startsWith(p));
}

/**
 * Get preloaded data for a specific page
 */
export async function getPreloadedData(path: string): Promise<Record<string, any>> {
  // Path-specific data to preload
  if (path.startsWith('/results')) {
    // For results page, we'd typically load the last analysis
    return {
      analysisResult: {
        // This would normally come from a database or API call
        score: 75,
        metaTags: {
          title: "Example Website - Your Digital Marketing Partner",
          description: "Professional digital marketing services including SEO, PPC, and content marketing.",
          // other meta tag info...
        },
        headers: {
          h1Count: 1,
          h2Count: 3,
          // other header info...
        },
        // other analysis data...
      }
    };
  }
  
  if (path.startsWith('/domain-authority-checker')) {
    // Example domain info for the domain authority checker page
    return {
      exampleResults: [
        {
          domain: "example.com",
          domainAuthority: 45,
          pageAuthority: 38,
          spamScore: 1,
          linkingDomains: 210,
          totalBacklinks: 1845
        },
        // other examples...
      ]
    };
  }
  
  // Default: no preloaded data
  return {};
}

/**
 * Inject preloaded data into HTML as a script
 */
export function injectPreloadedData(html: string, data: Record<string, any>): string {
  if (Object.keys(data).length === 0) return html;
  
  const $ = cheerio.load(html);
  
  // Create a script tag to inject preloaded data
  const dataScript = `
    <script id="preloaded-data" type="application/json">
      ${JSON.stringify(data)}
    </script>
    <script>
      // Make preloaded data available to the application
      window.__PRELOADED_DATA__ = JSON.parse(
        document.getElementById('preloaded-data').textContent
      );
    </script>
  `;
  
  // Insert the script before the closing </body> tag
  $('body').append(dataScript);
  
  return $.html();
}