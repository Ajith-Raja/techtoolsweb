import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Plus, FileDown, BarChart, RefreshCw } from "lucide-react";
import { contentGapAnalyzerSchema, ContentGapAnalysisResult, ContentGapKeyword } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FormValues = {
  yourDomain: string;
  competitorDomains: string[];
  language: string;
  location: string;
  niche: string;
};

export default function ContentGapAnalyzer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<ContentGapAnalysisResult | null>(null);
  const [isPremium, setIsPremium] = useState(user !== null);

  // Define the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(contentGapAnalyzerSchema),
    defaultValues: {
      yourDomain: "",
      competitorDomains: [""],
      language: "",
      location: "",
      niche: ""
    }
  });

  // Define the content gap analysis mutation
  const contentGapMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Filter out empty competitor domains
      const filteredData = {
        ...data,
        competitorDomains: data.competitorDomains.filter(domain => domain.trim() !== "")
      };
      
      // Ensure URLs have http:// prefix
      const formatUrl = (url: string) => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `https://${url}`;
        }
        return url;
      };
      
      const formattedData = {
        ...filteredData,
        yourDomain: formatUrl(filteredData.yourDomain),
        competitorDomains: filteredData.competitorDomains.map(domain => formatUrl(domain))
      };
      
      const res = await apiRequest("POST", "/api/content-gap-analyzer", formattedData);
      return await res.json() as ContentGapAnalysisResult;
    },
    onSuccess: (data: ContentGapAnalysisResult) => {
      setResults(data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.analysis.totalMissingKeywords} keyword opportunities`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: FormValues) {
    contentGapMutation.mutate(data);
  }

  // Add a new competitor field
  const addCompetitor = () => {
    const currentDomains = form.getValues().competitorDomains;
    if (currentDomains.length < 3) {
      form.setValue("competitorDomains", [...currentDomains, ""]);
    } else {
      toast({
        title: "Maximum competitors reached",
        description: "You can analyze up to 3 competitors at a time",
        variant: "destructive",
      });
    }
  };

  // Remove a competitor field
  const removeCompetitor = (index: number) => {
    const currentDomains = form.getValues().competitorDomains;
    if (currentDomains.length > 1) {
      const newDomains = currentDomains.filter((_, i) => i !== index);
      form.setValue("competitorDomains", newDomains);
    }
  };

  // Define traffic potential badge color
  const getTrafficBadgeColor = (potential: string) => {
    switch (potential) {
      case 'High':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Low':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return '';
    }
  };

  // Define difficulty badge color
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'bg-green-100 text-green-800';
    if (difficulty < 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Export results to CSV
  const exportCsv = () => {
    if (!results) return;
    
    // Premium feature check
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Please sign up for a premium account to export results",
        variant: "destructive",
      });
      return;
    }
    
    const headers = [
      'Keyword',
      'Competitors',
      'Search Volume',
      'Keyword Difficulty',
      'Traffic Potential',
      'CPC',
      'Content Suggestion'
    ].join(',');
    
    const rows = results.keywords.map(keyword => [
      `"${keyword.keyword}"`,
      `"${keyword.competitors.map(c => `${c.domain} (#${c.position})`).join(', ')}"`,
      keyword.searchVolume,
      keyword.keywordDifficulty,
      keyword.trafficPotential,
      keyword.cpc.toFixed(2),
      `"${keyword.contentSuggestion}"`
    ].join(','));
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-gap-analysis-${results.yourDomain.replace(/[^a-z0-9]/gi, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Competitor Content Gap Analyzer</h1>
        <p className="text-muted-foreground">
          Discover keywords your competitors rank for, but you don't. Identify content opportunities to close the SEO gap.
        </p>
        
        {!user && (
          <Alert className="mt-4">
            <AlertTitle>Premium Feature</AlertTitle>
            <AlertDescription>
              For full access, including comparing up to 3 competitors, getting keyword volumes, and exporting data, please <a href="/auth" className="text-primary font-medium">sign in</a> or create an account.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Enter Your Domain & Competitors</CardTitle>
          <CardDescription>
            Compare your domain against up to {isPremium ? "3" : "1"} competitors to find keyword opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="yourDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="yourdomain.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Competitor Domains</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addCompetitor}
                    disabled={form.getValues().competitorDomains.length >= (isPremium ? 3 : 1)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Competitor
                  </Button>
                </div>
                
                {form.getValues().competitorDomains.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`competitorDomains.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="competitor.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.getValues().competitorDomains.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCompetitor(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {!isPremium && form.getValues().competitorDomains.length >= 1 && (
                  <p className="text-sm text-muted-foreground">
                    Premium users can add up to 3 competitors.
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="global">Global</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niche (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select niche" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tech">Technology</SelectItem>
                          <SelectItem value="health">Health & Fitness</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={contentGapMutation.isPending}
              >
                {contentGapMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : "Analyze Content Gaps"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Results Section */}
      {results && (
        <div className="mt-8 space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
              <CardDescription>
                Analyzed on {results.dateAnalyzed} • Comparing {results.yourDomain} against {results.competitorDomains.join(", ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Keyword Opportunities</span>
                  <span className="text-3xl font-bold">{results.analysis.totalMissingKeywords}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Low Difficulty Keywords</span>
                  <span className="text-3xl font-bold text-green-600">{results.analysis.lowDifficultyOpportunities}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">High Traffic Potential</span>
                  <span className="text-3xl font-bold text-blue-600">{results.analysis.highTrafficOpportunities}</span>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="font-medium mb-3">Top Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {results.analysis.topCategories.map((category, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-sm text-muted-foreground">{category.category}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={(category.keywordCount / results.analysis.totalMissingKeywords) * 100} className="h-2" />
                        <span className="text-sm font-medium">{category.keywordCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-4">
              <Button variant="outline" onClick={exportCsv} disabled={!isPremium}>
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardFooter>
          </Card>
          
          <Tabs defaultValue="all">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Keywords ({results.keywords.length})</TabsTrigger>
                <TabsTrigger value="low-difficulty">Low Difficulty ({results.analysis.lowDifficultyOpportunities})</TabsTrigger>
                <TabsTrigger value="high-traffic">High Traffic ({results.analysis.highTrafficOpportunities})</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-0">
              <KeywordTable 
                keywords={results.keywords} 
                isPremium={isPremium}
                getDifficultyColor={getDifficultyColor}
                getTrafficBadgeColor={getTrafficBadgeColor}
              />
            </TabsContent>
            
            <TabsContent value="low-difficulty" className="mt-0">
              <KeywordTable 
                keywords={results.keywords.filter(k => k.keywordDifficulty < 30)}
                isPremium={isPremium}
                getDifficultyColor={getDifficultyColor}
                getTrafficBadgeColor={getTrafficBadgeColor}
              />
            </TabsContent>
            
            <TabsContent value="high-traffic" className="mt-0">
              <KeywordTable 
                keywords={results.keywords.filter(k => k.trafficPotential === 'High')}
                isPremium={isPremium}
                getDifficultyColor={getDifficultyColor}
                getTrafficBadgeColor={getTrafficBadgeColor}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// Keyword table component
function KeywordTable({ 
  keywords, 
  isPremium,
  getDifficultyColor,
  getTrafficBadgeColor
}: { 
  keywords: ContentGapKeyword[],
  isPremium: boolean,
  getDifficultyColor: (difficulty: number) => string,
  getTrafficBadgeColor: (potential: string) => string
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead>Competitor(s) Ranking</TableHead>
            {isPremium && (
              <>
                <TableHead className="text-right">Search Volume</TableHead>
                <TableHead className="text-right">KD</TableHead>
                <TableHead>Traffic Potential</TableHead>
                <TableHead className="text-right">CPC</TableHead>
              </>
            )}
            <TableHead>Content Suggestion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isPremium ? 7 : 3} className="text-center h-24 text-muted-foreground">
                No keywords found in this category
              </TableCell>
            </TableRow>
          ) : (
            keywords.map((keyword, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{keyword.keyword}</TableCell>
                <TableCell>
                  {keyword.competitors.map((comp, i) => (
                    <div key={i} className="text-sm">
                      {comp.domain} <span className="text-muted-foreground">(#{comp.position})</span>
                    </div>
                  ))}
                </TableCell>
                {isPremium && (
                  <>
                    <TableCell className="text-right">{keyword.searchVolume.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={getDifficultyColor(keyword.keywordDifficulty)}>
                        {keyword.keywordDifficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTrafficBadgeColor(keyword.trafficPotential)}>
                        {keyword.trafficPotential}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${keyword.cpc.toFixed(2)}</TableCell>
                  </>
                )}
                <TableCell className="max-w-[250px] truncate" title={keyword.contentSuggestion}>
                  {keyword.contentSuggestion}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}