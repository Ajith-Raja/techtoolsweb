import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Book,
  Clock,
  FileText,
  Link,
  BarChart,
  ListChecks,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  textDetails: {
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    readingTime: string;
  };
}

export default function ReadabilityChecker() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState("content");
  const [submitted, setSubmitted] = useState(false);
  
  const mutation = useMutation({
    mutationFn: async ({ type, value }: { type: string; value: string }) => {
      const response = await fetch("/api/readability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type, 
          value 
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch readability scores");
      }
      
      const data = await response.json();
      return data as ReadabilityScore;
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "url" && !url) return;
    if (activeTab === "content" && !content) return;
    
    // Ensure URL has a protocol if URL tab is active
    if (activeTab === "url") {
      let formattedUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        formattedUrl = "https://" + url;
      }
      mutation.mutate({ type: "url", value: formattedUrl });
    } else {
      mutation.mutate({ type: "content", value: content });
    }
    
    setSubmitted(true);
  };
  
  const getFleschReadingEaseLabel = (score: number) => {
    if (score >= 90) return { label: "Very Easy", color: "text-green-600" };
    if (score >= 80) return { label: "Easy", color: "text-green-500" };
    if (score >= 70) return { label: "Fairly Easy", color: "text-green-400" };
    if (score >= 60) return { label: "Standard", color: "text-blue-500" };
    if (score >= 50) return { label: "Fairly Difficult", color: "text-yellow-500" };
    if (score >= 30) return { label: "Difficult", color: "text-orange-500" };
    return { label: "Very Difficult", color: "text-red-600" };
  };
  
  const getProgressColor = (score: number, isInverse = false) => {
    if (!isInverse) {
      if (score >= 80) return "bg-green-500";
      if (score >= 60) return "bg-blue-500";
      if (score >= 40) return "bg-yellow-500";
      if (score >= 20) return "bg-orange-500";
      return "bg-red-500";
    } else {
      // For metrics where lower is better (grade levels)
      if (score <= 6) return "bg-green-500";
      if (score <= 9) return "bg-blue-500";
      if (score <= 12) return "bg-yellow-500";
      if (score <= 15) return "bg-orange-500";
      return "bg-red-500";
    }
  };
  
  const getWordCount = () => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  };
  
  const getSentenceCount = () => {
    if (!content) return 0;
    // Simple approximation of sentence count by counting sentence ending punctuation
    return (content.match(/[.!?]+(\s|$)/g) || []).length || 1;
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3">Readability Score Checker</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Analyze the readability of your content to ensure it's appropriate for your target audience. A good readability score helps improve engagement and comprehension.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Book className="mr-2 h-5 w-5 text-primary" />
            Check Content Readability
          </CardTitle>
          <CardDescription>
            Enter your content or a URL to analyze its readability metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs 
              defaultValue="content" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mb-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center">
                  <Link className="mr-2 h-4 w-4" />
                  URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="content">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste your content here to analyze readability..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      <span>{getWordCount()} words</span>
                    </div>
                    <div className="flex items-center">
                      <ListChecks className="mr-1 h-4 w-4" />
                      <span>{getSentenceCount()} sentences</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="url">
                <Input
                  type="text"
                  placeholder="e.g. example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                />
              </TabsContent>
            </Tabs>
            
            <Button 
              type="submit" 
              disabled={mutation.isPending || (activeTab === "url" && !url) || (activeTab === "content" && !content)}
              className="w-full mt-4"
            >
              {mutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Check Readability"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {submitted && (
        <div className="mt-8">
          {mutation.isPending ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-8 w-48" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-64 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : mutation.isError ? (
            <Card className="border-red-300 bg-red-50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Error Analyzing Readability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>We couldn't analyze the readability for {activeTab === "url" ? "this URL" : "your content"}. Please check and try again.</p>
                {activeTab === "url" && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    Make sure you've entered a valid URL with content that can be analyzed.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : mutation.isSuccess && mutation.data ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="mr-2 h-5 w-5 text-primary" />
                    Readability Scores
                  </CardTitle>
                  <CardDescription>
                    Analysis completed on {new Date().toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Flesch Reading Ease</div>
                          <Badge 
                            variant="outline" 
                            className={getFleschReadingEaseLabel(mutation.data.fleschReading.score).color}
                          >
                            {getFleschReadingEaseLabel(mutation.data.fleschReading.score).label}
                          </Badge>
                        </div>
                        <Progress 
                          value={mutation.data.fleschReading.score} 
                          max={100} 
                          className={`h-2 ${getProgressColor(mutation.data.fleschReading.score)}`} 
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          Score: {mutation.data.fleschReading.score.toFixed(1)}/100 (Higher is easier to read)
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Flesch-Kincaid Grade Level</div>
                          <Badge variant="outline">{mutation.data.fleschKincaid.grade}</Badge>
                        </div>
                        <Progress 
                          value={Math.min(mutation.data.fleschKincaid.score, 18)} 
                          max={18} 
                          className={`h-2 ${getProgressColor(mutation.data.fleschKincaid.score, true)}`} 
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          Score: {mutation.data.fleschKincaid.score.toFixed(1)} (U.S. grade level needed to understand)
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Gunning Fog Index</div>
                          <Badge variant="outline">{mutation.data.gunningFog.level}</Badge>
                        </div>
                        <Progress 
                          value={Math.min(mutation.data.gunningFog.score, 18)} 
                          max={18} 
                          className={`h-2 ${getProgressColor(mutation.data.gunningFog.score, true)}`} 
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          Score: {mutation.data.gunningFog.score.toFixed(1)} (Years of formal education needed)
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">SMOG Index</div>
                          <Badge variant="outline">{mutation.data.smog.level}</Badge>
                        </div>
                        <Progress 
                          value={Math.min(mutation.data.smog.score, 18)} 
                          max={18} 
                          className={`h-2 ${getProgressColor(mutation.data.smog.score, true)}`} 
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          Score: {mutation.data.smog.score.toFixed(1)} (Years of education needed for comprehension)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" />
                    Text Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-primary/5 p-4 rounded-lg text-center">
                      <div className="text-muted-foreground text-sm mb-1">Word Count</div>
                      <div className="text-2xl font-bold">{mutation.data.textDetails.wordCount.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-lg text-center">
                      <div className="text-muted-foreground text-sm mb-1">Sentence Count</div>
                      <div className="text-2xl font-bold">{mutation.data.textDetails.sentenceCount.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-lg text-center">
                      <div className="text-muted-foreground text-sm mb-1">Syllable Count</div>
                      <div className="text-2xl font-bold">{mutation.data.textDetails.syllableCount.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-lg text-center">
                      <div className="text-muted-foreground text-sm mb-1 flex items-center justify-center">
                        <Clock className="mr-1 h-3 w-3" /> Reading Time
                      </div>
                      <div className="text-2xl font-bold">{mutation.data.textDetails.readingTime}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}
      
      <div className="mt-12 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Understanding Readability Scores</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Readability formulas help you gauge how easy or difficult your content is to read for different audiences.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flesch Reading Ease Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                Scores between 0-100, with higher scores indicating easier-to-read text:
              </p>
              <ul className="space-y-1 text-sm">
                <li><span className="text-green-600 font-medium">90-100:</span> Very easy to read, understood by 5th graders</li>
                <li><span className="text-green-500 font-medium">80-89:</span> Easy to read, conversational English</li>
                <li><span className="text-blue-500 font-medium">70-79:</span> Fairly easy to read</li>
                <li><span className="text-blue-400 font-medium">60-69:</span> Plain English, easily understood by 13-15 year olds</li>
                <li><span className="text-yellow-500 font-medium">50-59:</span> Fairly difficult to read</li>
                <li><span className="text-orange-500 font-medium">30-49:</span> Difficult to read, best understood by college students</li>
                <li><span className="text-red-600 font-medium">0-29:</span> Very difficult to read, best understood by university graduates</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grade Level Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                These scores indicate the US grade level education typically needed to understand the text:
              </p>
              <ul className="space-y-1 text-sm">
                <li><span className="font-medium">Flesch-Kincaid Grade Level:</span> Estimates the US school grade level needed</li>
                <li><span className="font-medium">Gunning Fog Index:</span> Estimates years of formal education needed</li>
                <li><span className="font-medium">SMOG Index:</span> Measures years of education needed for complete comprehension</li>
              </ul>
              <div className="mt-3 p-3 bg-primary/5 rounded-md">
                <p className="text-xs">
                  <span className="font-medium">Tip:</span> For general audience content, aim for a grade level of 7-9, which is readable by most adults.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}