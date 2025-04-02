import * as cheerio from 'cheerio';
import { createServer, request } from 'http';
import { createServer as createHttpsServer, request as httpsRequest } from 'https';

interface KeywordResult {
  keyword: string;
  count: number;
  density: number;
}

interface DensityAnalysisResult {
  totalWords: number;
  keywords: KeywordResult[];
  topKeywords: KeywordResult[];
  readingTime: string;
}

/**
 * Extracts text content from HTML
 */
function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style, noscript, iframe, object, embed').remove();
  
  // Get text content
  const text = $('body').text();
  
  // Clean the text (remove extra spaces, line breaks, etc)
  return text
    .replace(/\s+/g, ' ')
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .trim();
}

/**
 * Calculates the frequency of keywords in a text
 */
function calculateKeywordFrequency(text: string, keywords: string[]): KeywordResult[] {
  const words = text.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  
  return keywords.map(keyword => {
    const keywordLower = keyword.toLowerCase();
    const count = words.filter(word => word === keywordLower).length;
    const density = (count / totalWords) * 100;
    
    return {
      keyword,
      count,
      density
    };
  });
}

/**
 * Extracts top keywords from text
 */
function extractTopKeywords(text: string, stopWords: string[] = []): KeywordResult[] {
  const words = text.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  
  // Remove punctuation, numbers, and short words
  const cleanWords = words.map(word => 
    word.replace(/[^\w\s]|_/g, "")
         .replace(/\d+/g, "")
  ).filter(word => 
    word.length > 3 && !stopWords.includes(word)
  );
  
  // Count frequency
  const wordCount: {[word: string]: number} = {};
  cleanWords.forEach(word => {
    if (word) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  // Convert to array and sort
  const sortedWords = Object.entries(wordCount)
    .map(([word, count]) => ({
      keyword: word,
      count,
      density: (count / totalWords) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return sortedWords;
}

/**
 * Estimates reading time in minutes based on words
 */
function calculateReadingTime(wordCount: number): string {
  const wordsPerMinute = 200;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes <= 1 ? "1 minute" : `${minutes} minutes`;
}

/**
 * Common English stop words to exclude from top keywords
 */
const STOP_WORDS = [
  "the", "and", "that", "have", "for", "not", "with", "you", "this", "but", 
  "his", "from", "they", "she", "her", "will", "has", "been", "were", "are", 
  "was", "what", "when", "why", "who", "how", "where", "which", "there", "here",
  "their", "your", "our", "its", "some", "can", "may", "them", "these", "those",
  "then", "than", "all", "more", "most", "just", "about", "into", "over", "like"
];

/**
 * Main analysis function
 */
export async function analyzeKeywordDensity(
  type: string, 
  value: string,
  keywords: string[]
): Promise<DensityAnalysisResult> {
  let textToAnalyze = '';
  
  if (type === 'url') {
    try {
      // Use node's built-in https module instead of fetch
      const isHttps = value.startsWith('https');
      const url = new URL(value);
      
      // Get HTML content from URL
      const html = await new Promise<string>((resolve, reject) => {
        const options = {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0;)'
          }
        };
        
        const req = (isHttps ? httpsRequest : request)(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(data);
          });
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        req.end();
      });
      
      textToAnalyze = extractTextFromHtml(html);
    } catch (error) {
      console.error('Error fetching URL:', error);
      throw new Error('Failed to fetch content from URL');
    }
  } else if (type === 'content') {
    textToAnalyze = value;
  } else {
    throw new Error('Invalid analysis type');
  }
  
  // Ensure we have enough text to analyze
  if (!textToAnalyze || textToAnalyze.split(/\s+/).filter(Boolean).length < 10) {
    throw new Error('Not enough content to analyze');
  }
  
  const totalWords = textToAnalyze.split(/\s+/).filter(Boolean).length;
  const keywordResults = calculateKeywordFrequency(textToAnalyze, keywords);
  const topKeywordsResults = extractTopKeywords(textToAnalyze, STOP_WORDS);
  const readingTime = calculateReadingTime(totalWords);
  
  return {
    totalWords,
    keywords: keywordResults,
    topKeywords: topKeywordsResults,
    readingTime
  };
}