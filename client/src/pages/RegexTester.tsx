import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Copy, Share2, Check, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
// Base components
import 'prismjs/components/prism-core';
// Essential language components 
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-markup-templating';
// Additional dependencies
import 'prismjs/components/prism-bash';

type Language = 'javascript' | 'python' | 'java' | 'csharp' | 'php' | 'ruby' | 'go' | 'rust';

type ColorTheme = 'default' | 'dark' | 'funky' | 'okaidia' | 'twilight' | 'coy' | 'solarizedlight' | 'tomorrow';

type MatchItem = {
  text: string;
  index: number;
  length: number;
}

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const colorThemes: Record<ColorTheme, string> = {
  default: '#f5f5f5',
  dark: '#282c34',
  funky: '#306998',
  okaidia: '#272822',
  twilight: '#141414',
  coy: '#fdfdfd',
  solarizedlight: '#fdf6e3',
  tomorrow: '#2d2d2d'
};

// Language-specific code examples
const regexExamples: Record<Language, { pattern: string, flags: string, test: string }> = {
  javascript: {
    pattern: '\\b\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}\\b',
    flags: 'g',
    test: 'Contact us at support@example.com or feedback@company.co.uk for more information.'
  },
  python: {
    pattern: '\\b\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}\\b',
    flags: 'g',
    test: 'Send questions to info@python.org or support@django.co.uk for assistance.'
  },
  java: {
    pattern: '\\b\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}\\b',
    flags: 'g',
    test: 'For Java support, email java-help@oracle.com or support@spring.io.'
  },
  csharp: {
    pattern: '\\b\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}\\b',
    flags: 'g',
    test: 'Contact the C# team at csharp@microsoft.com or dotnet@support.com.'
  },
  php: {
    pattern: '\\b\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}\\b',
    flags: 'g',
    test: 'For PHP issues, reach out to support@php.net or info@laravel.com.'
  },
  ruby: {
    pattern: '\\b\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}\\b',
    flags: 'g',
    test: 'Ruby developers can email team@ruby-lang.org or help@rails.com.'
  },
  go: {
    pattern: '\\b\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}\\b',
    flags: 'g',
    test: 'Go programmers contact golang@google.com or community@golang.org.'
  },
  rust: {
    pattern: '\\b\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}\\b',
    flags: 'g',
    test: 'Rust questions? Email team@rust-lang.org or help@crates.io.'
  }
};

// Generate code snippets for different languages
const generateCodeSnippet = (language: Language, pattern: string, flags: string): string => {
  switch (language) {
    case 'javascript':
      return `const regex = /${pattern}/${flags};
const text = 'your text here';
const matches = text.match(regex);
console.log(matches);`;
    case 'python':
      return `import re

pattern = r'${pattern}'
text = 'your text here'
matches = re.findall(pattern, text${flags.includes('i') ? ', re.IGNORECASE' : ''})
print(matches)`;
    case 'java':
      return `import java.util.regex.*;

public class RegexExample {
    public static void main(String[] args) {
        String text = "your text here";
        String pattern = "${pattern}";
        
        Pattern r = Pattern.compile(pattern${flags.includes('i') ? ', Pattern.CASE_INSENSITIVE' : ''});
        Matcher m = r.matcher(text);
        
        while (m.find()) {
            System.out.println(m.group());
        }
    }
}`;
    case 'csharp':
      return `using System;
using System.Text.RegularExpressions;

class Program {
    static void Main() {
        string text = "your text here";
        string pattern = @"${pattern}";
        
        RegexOptions options = ${flags.includes('i') ? 'RegexOptions.IgnoreCase' : 'RegexOptions.None'};
        foreach (Match match in Regex.Matches(text, pattern, options)) {
            Console.WriteLine(match.Value);
        }
    }
}`;
    case 'php':
      return `<?php
$text = "your text here";
$pattern = "/${pattern}/${flags}";

preg_match_all($pattern, $text, $matches);
print_r($matches[0]);
?>`;
    case 'ruby':
      return `text = "your text here"
pattern = /${pattern}/${flags.includes('i') ? 'i' : ''}

matches = text.scan(pattern)
puts matches`;
    case 'go':
      return `package main

import (
    "fmt"
    "regexp"
)

func main() {
    text := "your text here"
    pattern := \`${pattern}\`
    
    r := regexp.MustCompile(${flags.includes('i') ? '(?i)' : ''}pattern)
    matches := r.FindAllString(text, -1)
    
    fmt.Println(matches)
}`;
    case 'rust':
      return `use regex::Regex;

fn main() {
    let text = "your text here";
    let re = Regex::new(r"${flags.includes('i') ? "(?i)" : ""}${pattern}").unwrap();
    
    for cap in re.captures_iter(text) {
        println!("{}", &cap[0]);
    }
}`;
    default:
      return '';
  }
};

const RegexTester: React.FC = () => {
  const { toast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);
  
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSnippetCopied, setIsSnippetCopied] = useState(false);
  const [isShareUrlCopied, setIsShareUrlCopied] = useState(false);
  
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Flags toggles
  const [globalFlag, setGlobalFlag] = useState(true);
  const [caseInsensitiveFlag, setCaseInsensitiveFlag] = useState(false);
  const [multilineFlag, setMultilineFlag] = useState(false);
  const [dotAllFlag, setDotAllFlag] = useState(false);

  // Effect for initializing example values
  useEffect(() => {
    const example = regexExamples[language];
    setPattern(example.pattern);
    setFlags(example.flags);
    setTestString(example.test);
  }, [language]);

  // Effect for updating code snippet
  useEffect(() => {
    setCodeSnippet(generateCodeSnippet(language, pattern, flags));
  }, [language, pattern, flags]);

  // Effect for highlighting code with Prism
  useEffect(() => {
    Prism.highlightAll();
  }, [codeSnippet, colorTheme]);

  // Effect for regex testing
  useEffect(() => {
    testRegex();
  }, [pattern, flags, testString]);

  // Update flags string based on individual flag toggles
  useEffect(() => {
    let newFlags = '';
    if (globalFlag) newFlags += 'g';
    if (caseInsensitiveFlag) newFlags += 'i';
    if (multilineFlag) newFlags += 'm';
    if (dotAllFlag) newFlags += 's';
    setFlags(newFlags);
  }, [globalFlag, caseInsensitiveFlag, multilineFlag, dotAllFlag]);

  // Update individual flag toggles when flags string changes
  useEffect(() => {
    setGlobalFlag(flags.includes('g'));
    setCaseInsensitiveFlag(flags.includes('i'));
    setMultilineFlag(flags.includes('m'));
    setDotAllFlag(flags.includes('s'));
  }, [flags]);

  const testRegex = () => {
    if (!pattern || !testString) {
      setMatches([]);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const newMatches: MatchItem[] = [];
      
      if (flags.includes('g')) {
        let match;
        while ((match = regex.exec(testString)) !== null) {
          newMatches.push({
            text: match[0],
            index: match.index,
            length: match[0].length
          });
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          newMatches.push({
            text: match[0],
            index: match.index,
            length: match[0].length
          });
        }
      }
      
      setMatches(newMatches);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setMatches([]);
    }
  };

  const highlightMatches = () => {
    if (!testString || matches.length === 0) return testString;
    
    // Sort matches by index (in case they're not in order)
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
    
    let result = [];
    let lastIndex = 0;
    
    for (const match of sortedMatches) {
      // Add text before the match
      if (match.index > lastIndex) {
        result.push(testString.substring(lastIndex, match.index));
      }
      
      // Add highlighted match
      result.push(
        <span 
          key={`match-${match.index}`} 
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
        >
          {match.text}
        </span>
      );
      
      lastIndex = match.index + match.length;
    }
    
    // Add remaining text
    if (lastIndex < testString.length) {
      result.push(testString.substring(lastIndex));
    }
    
    return result;
  };

  const handleCopyPattern = () => {
    navigator.clipboard.writeText(pattern);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Regex pattern copied to clipboard",
    });
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(codeSnippet);
    setIsSnippetCopied(true);
    setTimeout(() => setIsSnippetCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Code snippet copied to clipboard",
    });
  };

  const handleShareRegex = async () => {
    try {
      // Note: In a production environment, you would call your sharing API
      // For this example, we'll simulate it with a local URL
      const data = {
        pattern,
        flags,
        testString,
        language
      };
      
      // In a real implementation, this would call the sharing API
      // const response = await fetch('/api/share-regex', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });
      // const result = await response.json();
      
      // For now, we'll just create a local URL with parameters
      const params = new URLSearchParams({
        p: pattern,
        f: flags,
        t: testString,
        l: language
      });
      
      const shareUrl = `${window.location.origin}/regex-tester?${params.toString()}`;
      setShareUrl(shareUrl);
      
      toast({
        title: "Share link created!",
        description: "You can now copy the link to share this regex",
      });
    } catch (error) {
      toast({
        title: "Error creating share link",
        description: "There was a problem creating a shareable link",
        variant: "destructive"
      });
    }
  };

  const handleCopyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setIsShareUrlCopied(true);
      setTimeout(() => setIsShareUrlCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Share URL copied to clipboard",
      });
    }
  };

  // Check for URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('p') && params.has('f')) {
      setPattern(params.get('p') || '');
      setFlags(params.get('f') || '');
      if (params.has('t')) setTestString(params.get('t') || '');
      if (params.has('l')) {
        const lang = params.get('l');
        if (lang && languageOptions.some(opt => opt.value === lang)) {
          setLanguage(lang as Language);
        }
      }
    }
  }, []);

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Regex Tester</h1>
        <p className="text-lg text-muted-foreground">
          Test and debug regular expressions with syntax highlighting and code generation for multiple programming languages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Left side - input controls */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Regex Pattern</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopyPattern}
                  >
                    {isCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {isCopied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleShareRegex}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
              <CardDescription>Enter your regular expression pattern</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Regular expression pattern..."
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="global"
                    checked={globalFlag}
                    onCheckedChange={setGlobalFlag}
                  />
                  <Label htmlFor="global">Global (g)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="insensitive"
                    checked={caseInsensitiveFlag}
                    onCheckedChange={setCaseInsensitiveFlag}
                  />
                  <Label htmlFor="insensitive">Case Insensitive (i)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="multiline"
                    checked={multilineFlag}
                    onCheckedChange={setMultilineFlag}
                  />
                  <Label htmlFor="multiline">Multiline (m)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="dotall"
                    checked={dotAllFlag}
                    onCheckedChange={setDotAllFlag}
                  />
                  <Label htmlFor="dotall">Dot All (s)</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="test-string" className="block mb-2">Test String</Label>
                <Textarea
                  id="test-string"
                  placeholder="Text to test against the regex pattern..."
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  rows={6}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {shareUrl && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Share Link</CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopyShareUrl}
                  >
                    {isShareUrlCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {isShareUrlCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary p-3 rounded-md text-sm font-mono break-all">
                  {shareUrl}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right side - results and code */}
        <div className="lg:col-span-4 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Results</CardTitle>
                <Badge variant="outline">
                  {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                ref={resultRef}
                className="whitespace-pre-wrap bg-secondary p-4 rounded-md font-mono text-sm overflow-auto max-h-[300px]"
              >
                {highlightMatches()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Code Snippet</CardTitle>
                <div className="flex space-x-2">
                  <div className="w-full">
                    <Select
                      value={language}
                      onValueChange={(value) => setLanguage(value as Language)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopySnippet}
                  >
                    {isSnippetCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {isSnippetCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ backgroundColor: colorThemes[colorTheme] }} className="rounded-md overflow-hidden">
                <pre className={cn("p-4 text-sm overflow-auto max-h-[300px]")}>
                  <code className={`language-${language}`}>
                    {codeSnippet}
                  </code>
                </pre>
              </div>

              <div className="mt-4 flex items-center">
                <Label htmlFor="color-theme" className="mr-3">Color Theme:</Label>
                <div className="w-[180px]">
                  <Select
                    value={colorTheme}
                    onValueChange={(value) => setColorTheme(value as ColorTheme)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Color Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(colorThemes).map(theme => (
                        <SelectItem key={theme} value={theme}>
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reference Guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Regex Quick Reference</CardTitle>
          <CardDescription>Common regular expression patterns and syntax</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Character Classes</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-secondary px-1 rounded">.</code> - Any character except newline</li>
                <li><code className="bg-secondary px-1 rounded">\\w</code> - Word character [a-zA-Z0-9_]</li>
                <li><code className="bg-secondary px-1 rounded">\\d</code> - Digit [0-9]</li>
                <li><code className="bg-secondary px-1 rounded">\\s</code> - Whitespace character</li>
                <li><code className="bg-secondary px-1 rounded">\\W, \\D, \\S</code> - Negated versions</li>
                <li><code className="bg-secondary px-1 rounded">[abc]</code> - Any of a, b, or c</li>
                <li><code className="bg-secondary px-1 rounded">[^abc]</code> - Not a, b, or c</li>
                <li><code className="bg-secondary px-1 rounded">[a-z]</code> - Range from a to z</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Anchors & Boundaries</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-secondary px-1 rounded">^</code> - Start of line</li>
                <li><code className="bg-secondary px-1 rounded">$</code> - End of line</li>
                <li><code className="bg-secondary px-1 rounded">\\b</code> - Word boundary</li>
                <li><code className="bg-secondary px-1 rounded">\\B</code> - Not word boundary</li>
              </ul>
              <h3 className="font-semibold mt-4 mb-2">Quantifiers</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-secondary px-1 rounded">*</code> - 0 or more</li>
                <li><code className="bg-secondary px-1 rounded">+</code> - 1 or more</li>
                <li><code className="bg-secondary px-1 rounded">?</code> - 0 or 1</li>
                <li><code className="bg-secondary px-1 rounded">{'{n}'}</code> - Exactly n times</li>
                <li><code className="bg-secondary px-1 rounded">{'{n,}'}</code> - n or more times</li>
                <li><code className="bg-secondary px-1 rounded">{'{n,m}'}</code> - Between n and m times</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Groups & Alternation</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-secondary px-1 rounded">(abc)</code> - Capture group</li>
                <li><code className="bg-secondary px-1 rounded">(?:abc)</code> - Non-capture group</li>
                <li><code className="bg-secondary px-1 rounded">a|b</code> - a or b</li>
                <li><code className="bg-secondary px-1 rounded">(?&lt;name&gt;abc)</code> - Named capture group</li>
              </ul>
              <h3 className="font-semibold mt-4 mb-2">Common Patterns</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-secondary px-1 rounded">\b\w+@[a-zA-Z_]+?\.[a-zA-Z]{'{2,3}'}\b</code> - Email</li>
                <li><code className="bg-secondary px-1 rounded">^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{'{8,}'}$</code> - Password</li>
                <li><code className="bg-secondary px-1 rounded">^\d{'{3}'}-\d{'{3}'}-\d{'{4}'}$</code> - US Phone Number</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Resources */}
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Learn More About Regular Expressions</h3>
        <TooltipProvider>
          <div className="flex justify-center space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  MDN Guide <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mozilla's guide to regular expressions</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href="https://regex101.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  Regex101 <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Advanced regex testing and debugging</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href="https://regexr.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  RegExr <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Interactive regex learning tool</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default RegexTester;