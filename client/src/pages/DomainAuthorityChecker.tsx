import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
// import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Link2, Hash, Shield, AlertCircle, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthorityInfo {
  domain: string;
  domainAuthority: number;
  pageAuthority: number;
  spamScore: number;
  linkingDomains: number;
  totalBacklinks: number;
  topKeywords: string[];
}

export default function DomainAuthorityChecker() {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const mutation = useMutation({
    mutationFn: async (domainUrl: string) => {
      const response = await fetch("/api/domain-authority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domainUrl })
      });
      if (!response.ok) {
        throw new Error("Failed to fetch domain authority data");
      }
      const data = await response.json();
      return data as AuthorityInfo;
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Ensure URL has a protocol
    let formattedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      formattedUrl = "https://" + url;
    }
    
    mutation.mutate(formattedUrl);
    setSubmitted(true);
  };
  
  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 font-semibold";
    if (score >= 40) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
  };
  
  const getSpamScoreColor = (score: number) => {
    if (score <= 1) return "text-green-600 font-semibold";
    if (score <= 3) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3">Domain Authority Checker</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Check your website's Domain Authority (DA) and Page Authority (PA) scores to understand your SEO ranking potential and compare with competitors.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Check Domain & Page Authority
          </CardTitle>
          <CardDescription>
            Enter a domain name below to analyze its authority metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="e.g. example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 rounded-lg border-primary/30 focus:border-primary"
              required
            />
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="min-w-[140px]"
            >
              {mutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </span>
              ) : (
                "Check Authority"
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
                  Error Checking Domain Authority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>We couldn't retrieve authority data for this domain. Please check the URL and try again.</p>
                <p className="text-sm mt-2 text-muted-foreground">
                  Make sure you've entered a valid domain name without any path or query parameters.
                </p>
              </CardContent>
            </Card>
          ) : mutation.isSuccess && mutation.data ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Authority Results for {mutation.data.domain}
                </CardTitle>
                <CardDescription>
                  Analysis completed on {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col items-center justify-center bg-primary/5 p-6 rounded-lg">
                    <span className="text-lg font-medium text-muted-foreground">Domain Authority</span>
                    <span className={`text-5xl mt-2 ${getScoreColor(mutation.data.domainAuthority)}`}>
                      {mutation.data.domainAuthority}
                    </span>
                    <span className="text-sm mt-2 text-muted-foreground">/100</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-primary/5 p-6 rounded-lg">
                    <span className="text-lg font-medium text-muted-foreground">Page Authority</span>
                    <span className={`text-5xl mt-2 ${getScoreColor(mutation.data.pageAuthority)}`}>
                      {mutation.data.pageAuthority}
                    </span>
                    <span className="text-sm mt-2 text-muted-foreground">/100</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-primary/5 p-6 rounded-lg">
                    <span className="text-lg font-medium text-muted-foreground">Spam Score</span>
                    <span className={`text-5xl mt-2 ${getSpamScoreColor(mutation.data.spamScore)}`}>
                      {mutation.data.spamScore}
                    </span>
                    <span className="text-sm mt-2 text-muted-foreground">/17</span>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Metric</TableHead>
                      <TableHead className="w-2/3">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium flex items-center">
                        <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        Linking Domains
                      </TableCell>
                      <TableCell>
                        {mutation.data.linkingDomains.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium flex items-center">
                        <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                        Total Backlinks
                      </TableCell>
                      <TableCell>
                        {mutation.data.totalBacklinks.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium flex items-center">
                        <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                        Top Keywords
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {mutation.data.topKeywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium flex items-center text-blue-800 dark:text-blue-400 mb-2">
                    <Shield className="mr-2 h-4 w-4" />
                    What do these metrics mean?
                  </h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm">
                    <li><span className="font-medium">Domain Authority (DA)</span> - Predicts how well a website will rank on search engines on a scale of 1-100</li>
                    <li><span className="font-medium">Page Authority (PA)</span> - Predicts how well a specific page will rank on search engines on a scale of 1-100</li>
                    <li><span className="font-medium">Spam Score</span> - Indicates the likelihood of a page being penalized by search engines (lower is better)</li>
                    <li><span className="font-medium">Linking Domains</span> - The number of unique domains linking to this website</li>
                    <li><span className="font-medium">Total Backlinks</span> - The total number of links pointing to this website</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
      
      <div className="mt-12 text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Why Domain Authority Matters</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Higher Domain Authority correlates with better search engine rankings and increased organic traffic.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Competitive Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Compare your site with competitors to identify strengths and opportunities for improvement.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Link Building Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Guide your outreach efforts by targeting sites with higher Domain Authority for quality backlinks.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}