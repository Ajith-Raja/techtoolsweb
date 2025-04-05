import { load } from "cheerio";
import { z } from "zod";

// Define input schema
export const plagiarismCheckSchema = z.object({
  text: z.string().min(1, "Text is required"),
  type: z.enum(["text", "url"]),
});

export type PlagiarismCheckInput = z.infer<typeof plagiarismCheckSchema>;

// Define result structure
export interface PlagiarismResult {
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
  // For highlighted text in the results page
  highlightedText?: string;
}

// Function to extract text from a webpage
async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);
    
    // Remove script, style, and other non-content elements
    $('script, style, meta, link, noscript').remove();
    
    // Get text from body
    const text = $('body').text()
      .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
      .trim();
      
    return text;
  } catch (error) {
    console.error('Error extracting text from URL:', error);
    throw new Error('Failed to extract text from provided URL');
  }
}

// Main function to check for plagiarism
export async function checkPlagiarism(input: PlagiarismCheckInput): Promise<PlagiarismResult> {
  let textToCheck = input.text;
  
  // If input is a URL, extract text from it
  if (input.type === "url") {
    textToCheck = await extractTextFromUrl(input.text);
  }
  
  // In a real production app, we would integrate with a real plagiarism API
  // For this demo, we'll create a simplified simulation of plagiarism detection
  
  // Generate random similarity score between 15% and 40%
  const similarityScore = Math.random() * 25 + 15;
  const uniquenessPercentage = 100 - similarityScore;
  
  // Create some mock matched sources
  const mockSources = [
    {
      url: "https://example.com/article1",
      title: "Best Practices for SEO",
      snippet: textToCheck.substring(0, 100) + "...",
      matchPercentage: similarityScore * 0.6, // This source contributes to 60% of matches
    },
    {
      url: "https://example.org/research/seo-trends",
      title: "SEO Trends for 2025",
      snippet: textToCheck.substring(50, 150) + "...",
      matchPercentage: similarityScore * 0.4, // This source contributes to 40% of matches
    }
  ];
  
  // Highlight potentially plagiarized sections
  // In a real app, we would highlight actual matches
  // For this demo, we'll highlight random segments
  const words = textToCheck.split(' ');
  
  // Copy words to a new array to add highlight spans
  const highlightedWords = [...words];
  
  // Randomly highlight about 20% of words
  const numToHighlight = Math.floor(words.length * (similarityScore / 100));
  const highlightIndices = new Set<number>();
  
  while (highlightIndices.size < numToHighlight) {
    const randomIndex = Math.floor(Math.random() * words.length);
    highlightIndices.add(randomIndex);
  }
  
  // Add highlight spans to the selected words
  Array.from(highlightIndices).forEach(index => {
    if (highlightedWords[index] && highlightedWords[index].length > 3) {
      highlightedWords[index] = `<span class="text-red-500 bg-red-100">${highlightedWords[index]}</span>`;
    }
  });
  
  const highlightedText = highlightedWords.join(' ');
  
  return {
    originalText: textToCheck,
    similarityScore,
    matchedSources: mockSources,
    uniquenessPercentage,
    analyzedLength: textToCheck.length,
    highlightedText
  };
}