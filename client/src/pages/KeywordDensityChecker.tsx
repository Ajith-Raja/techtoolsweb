import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, BarChartHorizontal, Link, Percent, Timer, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { withMainApi } from "@/lib/apiConfig";

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

export default function KeywordDensityChecker() {
  const [activeTab, setActiveTab] = useState<string>("url");
  const [url, setUrl] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [keywordsInput, setKeywordsInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Real API mutation using tanstack/react-query
  const [data, setData] = useState<DensityAnalysisResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  
  // Real function to call the API
  const mutate = async (params: { type: string; value: string; keywords: string[] }) => {
    setIsPending(true);
    setIsError(false);
    
    try {
      const response = await fetch(withMainApi("/api/keyword-density"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: params.type,
          value: params.value,
          keywords: params.keywords
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze keyword density");
      }
      
      const resultData = await response.json();
      setData(resultData as DensityAnalysisResult);
    } catch (err) {
      console.error("Error analyzing keyword density:", err);
      setIsError(true);
      setError(err instanceof Error ? err.message : "An error occurred when analyzing keywords");
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = () => {
    setError(null);

    // Basic validation
    if (activeTab === "url" && !url) {
      setError("Please enter a valid URL");
      return;
    }

    if (activeTab === "content" && !content) {
      setError("Please enter some content to analyze");
      return;
    }

    // Process keywords input
    const keywords = keywordsInput
      .split(",")
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0);

    if (keywords.length === 0) {
      setError("Please enter at least one keyword to analyze");
      return;
    }

    // Submit for analysis
    mutate({
      type: activeTab,
      value: activeTab === "url" ? url : content,
      keywords,
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
  };

  const getKeywordColor = (density: number) => {
    if (density < 1) return "text-gray-500";
    if (density < 2) return "text-blue-500";
    if (density < 3) return "text-green-500";
    if (density < 4) return "text-yellow-500";
    return "text-red-500";
  };

  const getDensityDescription = (density: number) => {
    if (density < 0.5) return "Too low";
    if (density < 1) return "Low";
    if (density < 2.5) return "Good";
    if (density < 4) return "Strong";
    return "Over-optimized";
  };

  const getDensityBadgeVariant = (density: number) => {
    if (density < 0.5) return "outline";
    if (density < 1) return "secondary";
    if (density < 2.5) return "default";
    if (density < 4) return "secondary";
    return "destructive";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Keyword Density Checker
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Analyze the keyword density in your content to optimize SEO performance. 
          Identify overused keywords and find opportunities to improve your content.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Analyze Content</CardTitle>
          <CardDescription>
            Enter a URL or paste your content to analyze keyword density
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="url"
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="url" className="flex items-center">
                <Link className="mr-2 h-4 w-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="url" className="text-sm font-medium">
                  Website URL
                </label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Content to Analyze
                </label>
                <Textarea
                  id="content"
                  placeholder="Paste your content here..."
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <div className="mt-6 flex flex-col space-y-2">
              <label htmlFor="keywords" className="text-sm font-medium">
                Keywords to analyze (comma separated)
              </label>
              <Input
                id="keywords"
                placeholder="marketing, seo, content"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, we'll analyze common keywords in your content
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="mt-6 w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Analyzing..." : "Analyze Keywords"}
            </Button>
          </Tabs>
        </CardContent>
      </Card>

      {isPending && (
        <Card className="mb-8">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center">
              <p className="mb-4 text-center">Analyzing keyword density...</p>
              <Progress value={75} className="w-full max-w-md mx-auto" />
            </div>
          </CardContent>
        </Card>
      )}

      {data && !isPending && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Timer className="mr-2 h-5 w-5" />
                Content Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Total Words
                  </dt>
                  <dd className="text-2xl font-bold">{data.totalWords}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Reading Time
                  </dt>
                  <dd className="text-2xl font-bold">{data.readingTime}</dd>
                </div>
              </dl>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Your Keywords</h4>
                {data.keywords.map((keyword) => (
                  <div key={keyword.keyword} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">
                        {keyword.keyword}{" "}
                        <span className="text-muted-foreground">
                          ({keyword.count} occurrences)
                        </span>
                      </p>
                      <Badge variant={getDensityBadgeVariant(keyword.density)}>
                        {keyword.density.toFixed(2)}%
                      </Badge>
                    </div>
                    <Progress
                      value={Math.min(keyword.density * 20, 100)}
                      className={`h-2 ${getKeywordColor(keyword.density)}`}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {getDensityDescription(keyword.density)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                Top Keywords Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Keyword</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead className="text-right">Density</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topKeywords.map((keyword) => (
                    <TableRow key={keyword.keyword}>
                      <TableCell className="font-medium">
                        {keyword.keyword}
                      </TableCell>
                      <TableCell>{keyword.count}</TableCell>
                      <TableCell className="text-right">
                        <span className={getKeywordColor(keyword.density)}>
                          {keyword.density.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 space-y-4">
                <h4 className="flex items-center text-sm font-medium">
                  <BarChartHorizontal className="mr-2 h-4 w-4" />
                  Keyword Distribution
                </h4>
                <div className="space-y-2">
                  {data.topKeywords.slice(0,
                  5).map((keyword) => (
                    <div key={`chart-${keyword.keyword}`} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{keyword.keyword}</span>
                        <span className={getKeywordColor(keyword.density)}>
                          {keyword.density.toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                        <div
                          className={`h-full ${getKeywordColor(
                            keyword.density
                          )} bg-current`}
                          style={{
                            width: `${Math.min(keyword.density * 10, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="flex items-center text-sm font-medium mb-2">
                  <Percent className="mr-2 h-4 w-4" />
                  SEO Recommendations
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>• Ideal keyword density is between 1-2.5%</li>
                  <li>• Use keywords naturally throughout your content</li>
                  <li>• Include keywords in headers and meta tags</li>
                  <li>• Avoid keyword stuffing (over 4% density)</li>
                  <li>• Focus on readability and user experience</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}