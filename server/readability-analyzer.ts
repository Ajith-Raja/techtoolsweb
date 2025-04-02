import * as cheerio from 'cheerio';

interface TextDetails {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  readingTime: string;
}

interface ReadabilityScore {
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
  textDetails: TextDetails;
}

// Helper functions
const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  
  // Handle special cases
  if (word.length <= 3) return 1;
  
  // Remove non-alphanumeric characters
  word = word.replace(/[^a-z]/g, '');
  
  // Count vowel sequences as syllables
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
  let count = 0;
  let prevIsVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isVowel;
  }
  
  // Adjust for common patterns
  if (word.endsWith('e')) count--;
  if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) count++;
  if (word.endsWith('es') || word.endsWith('ed')) count--;
  
  // Ensure at least one syllable
  return Math.max(1, count);
};

const countSentences = (text: string): number => {
  // Basic sentence count based on ending punctuation
  const sentences = text.match(/[.!?]+(\s|$)/g) || [];
  return sentences.length || 1;
};

const getFleschReadingEaseLevel = (score: number): string => {
  if (score >= 90) return "Very Easy - 5th Grade";
  if (score >= 80) return "Easy - 6th Grade";
  if (score >= 70) return "Fairly Easy - 7th Grade";
  if (score >= 60) return "Standard - 8th-9th Grade";
  if (score >= 50) return "Fairly Difficult - 10th-12th Grade";
  if (score >= 30) return "Difficult - College";
  return "Very Difficult - College Graduate";
};

const getGradeLevel = (score: number): string => {
  if (score <= 1) return "Kindergarten";
  if (score <= 12) return `${Math.round(score)}th Grade`;
  if (score <= 16) return `College Year ${Math.round(score) - 12}`;
  return "Graduate Level";
};

const getComplexityLevel = (score: number): string => {
  if (score < 8) return "Very Easy";
  if (score < 10) return "Easy";
  if (score < 12) return "Fairly Easy";
  if (score < 14) return "Standard";
  if (score < 16) return "Fairly Difficult";
  if (score < 18) return "Difficult";
  return "Very Difficult";
};

const getReadingTime = (wordCount: number): string => {
  // Average reading speed: 200-250 words per minute
  const minutes = Math.ceil(wordCount / 225);
  if (minutes < 1) return "< 1 min";
  return `${minutes} min`;
};

const extractTextFromHtml = (html: string): string => {
  const $ = cheerio.load(html);
  
  // Remove script, style, and other non-content tags
  $('script, style, meta, link, noscript, iframe, object, embed, svg').remove();
  
  // Get the visible text content
  const bodyText = $('body').text();
  
  // Clean the text (remove excess whitespace)
  return bodyText.replace(/\s+/g, ' ').trim();
};

const calculateReadabilityScores = (text: string): ReadabilityScore => {
  // Remove excess whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Count text components
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentenceCount = countSentences(text);
  
  // Calculate syllables
  let syllableCount = 0;
  for (const word of words) {
    syllableCount += countSyllables(word);
  }
  
  // Calculate readability scores
  
  // Flesch Reading Ease
  // 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const fleschReadingEase = 206.835 - 
    (1.015 * (wordCount / sentenceCount)) - 
    (84.6 * (syllableCount / wordCount));
  
  // Flesch-Kincaid Grade Level
  // 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const fleschKincaidGradeLevel = 
    (0.39 * (wordCount / sentenceCount)) + 
    (11.8 * (syllableCount / wordCount)) - 
    15.59;
  
  // Gunning Fog Index
  // 0.4 * ((words/sentences) + 100 * (complex_words/words))
  // For this simple implementation, we'll estimate complex words as those with 3+ syllables
  const complexWords = words.filter(word => countSyllables(word) >= 3).length;
  const gunningFogIndex = 
    0.4 * ((wordCount / sentenceCount) + 100 * (complexWords / wordCount));
  
  // SMOG Index
  // 1.043 * sqrt(30 * (complex_words/sentences)) + 3.1291
  const smogIndex = 
    1.043 * Math.sqrt(30 * (complexWords / sentenceCount)) + 3.1291;
  
  return {
    fleschReading: {
      score: Math.max(0, Math.min(100, fleschReadingEase)),
      level: getFleschReadingEaseLevel(fleschReadingEase)
    },
    fleschKincaid: {
      score: Math.max(0, fleschKincaidGradeLevel),
      grade: getGradeLevel(fleschKincaidGradeLevel)
    },
    gunningFog: {
      score: Math.max(0, gunningFogIndex),
      level: getComplexityLevel(gunningFogIndex)
    },
    smog: {
      score: Math.max(0, smogIndex),
      level: getGradeLevel(smogIndex)
    },
    textDetails: {
      wordCount,
      sentenceCount,
      syllableCount,
      readingTime: getReadingTime(wordCount)
    }
  };
};

// Main analysis function
export async function analyzeReadability(type: string, value: string): Promise<ReadabilityScore> {
  let textToAnalyze = '';
  
  if (type === 'url') {
    try {
      // Use node's built-in https module instead of fetch
      const https = await import('https');
      const http = await import('http');
      
      // Determine which protocol to use
      const client = value.startsWith('https') ? https : http;
      
      // Get HTML content from URL
      const html = await new Promise<string>((resolve, reject) => {
        client.get(value, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(data);
          });
        }).on('error', (err) => {
          reject(err);
        });
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
  
  return calculateReadabilityScores(textToAnalyze);
}