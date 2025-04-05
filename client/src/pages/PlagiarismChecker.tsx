import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Clock, FileText, Globe, Link } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PlagiarismResult {
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
  highlightedText?: string;
}

export default function PlagiarismChecker() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"text" | "url">("text");
  const [results, setResults] = useState<PlagiarismResult | null>(null);
  const { toast } = useToast();
  
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedTime = Math.ceil(wordCount / 100); // Rough estimate: 1 minute per 100 words
  
  const plagiarismMutation = useMutation({
    mutationFn: async (data: { text: string; type: "text" | "url" }) => {
      const res = await apiRequest("POST", "/api/plagiarism-check", data);
      return res.json();
    },
    onSuccess: (data: PlagiarismResult) => {
      setResults(data);
    },
    onError: (error) => {
      toast({
        title: "Error checking plagiarism",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  const isChecking = plagiarismMutation.isPending;

  const handleCheck = () => {
    // Validate input based on active tab
    if (activeTab === "text" && text.trim().length === 0) {
      toast({
        title: "Empty text",
        description: "Please enter some text to check for plagiarism.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "url" && !url.trim().startsWith("http")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    // Make API request based on active tab
    plagiarismMutation.mutate({
      text: activeTab === "text" ? text : url,
      type: activeTab
    });
  };

  const COLORS = ['#ff6b6b', '#51cf66'];
  const pieData = results ? [
    { name: 'Plagiarized', value: results.similarityScore },
    { name: 'Original', value: results.uniquenessPercentage }
  ] : [];

  return (
    <div className="relative isolate">
      {/* Background gradient */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Plagiarism Checker
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Check your text for potential plagiarism and similar content across the web
          </p>
        </div>

        <Card className="mt-12">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "text" | "url")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="text" className="flex gap-2 items-center">
                  <FileText className="h-4 w-4" />
                  Text Content
                </TabsTrigger>
                <TabsTrigger value="url" className="flex gap-2 items-center">
                  <Globe className="h-4 w-4" />
                  Website URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-4">
                <textarea
                  className="w-full min-h-[200px] p-4 rounded-lg border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Paste your text here to check for plagiarism..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                
                <div className="flex flex-wrap gap-4 items-center justify-between text-sm text-muted-foreground">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{wordCount} words</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>~{estimatedTime} min to check</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheck}
                    disabled={isChecking || wordCount === 0}
                    size="lg"
                  >
                    {isChecking ? (
                      <div className="animate-spin">⏳</div>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Check Plagiarism
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL</Label>
                  <Input
                    id="website-url"
                    placeholder="https://example.com/article-to-check"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the URL of the webpage you want to check for plagiarism
                  </p>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleCheck}
                    disabled={isChecking || !url.trim().startsWith('http')}
                    size="lg"
                  >
                    {isChecking ? (
                      <div className="animate-spin">⏳</div>
                    ) : (
                      <>
                        <Link className="mr-2 h-4 w-4" />
                        Check URL Content
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {results && (
          <>
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Plagiarism Analysis Results</CardTitle>
                <CardDescription>
                  Found potential matches in the following sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-64 w-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-2xl font-bold">{results.similarityScore.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Plagiarized Content</p>
                    </div>
                    <div className="mt-4 flex gap-4 justify-center">
                      {COLORS.map((color, index) => (
                        <div key={color} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-sm text-muted-foreground">
                            {index === 0 ? 'Plagiarized' : 'Original'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Matched Text */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Matched Content</h3>
                    {results.matchedSources.map((match, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <p className="font-medium text-yellow-800">{match.snippet}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Found in: <a href={match.url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{match.title}</a>
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            {match.matchPercentage.toFixed(1)}% match
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Highlighted Text Card */}
            {results.highlightedText && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Text with Highlighted Matches</CardTitle>
                  <CardDescription>
                    Potentially plagiarized content is highlighted in red
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-6 bg-card text-card-foreground border rounded-lg" 
                    dangerouslySetInnerHTML={{ __html: results.highlightedText }}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
