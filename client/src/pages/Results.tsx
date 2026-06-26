import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Loader2,
  BarChart2,
  Globe,
  Layout,
  FileText,
  Zap,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { withMainApi } from "@/lib/apiConfig";
import type { SeoAnalysisResult } from "@shared/schema";

function ScoreIndicator({ score }: { score: number }) {
  let color = "bg-red-500";
  if (score >= 80) color = "bg-green-500";
  else if (score >= 60) color = "bg-yellow-500";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>SEO Score</span>
        <span>{score}/100</span>
      </div>
      <Progress value={score} className={color} />
    </div>
  );
}

function StatusIcon({ condition }: { condition: boolean }) {
  return condition ? (
    <CheckCircle2 className="h-5 w-5 text-green-500" />
  ) : (
    <XCircle className="h-5 w-5 text-red-500" />
  );
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  return (
    <Badge variant="outline" className={`${colors[severity]} font-medium`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: result, isLoading, isError } = useQuery<SeoAnalysisResult>({
    queryKey: [withMainApi("/api/lastAnalysis")],
    staleTime: 0,
    retry: false,
  });

  const handleDownload = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text('SEO Analysis Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Score
    doc.setFontSize(16);
    doc.text(`Overall Score: ${result.score}/100`, 20, yPos);
    yPos += 15;

    // Meta Tags
    doc.setFontSize(14);
    doc.text('Meta Tags Analysis:', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`• Title: ${result.metaTags.title || 'Not found'}`, 25, yPos);
    yPos += 7;
    doc.text(`• Description: ${result.metaTags.description || 'Not found'}`, 25, yPos);
    yPos += 15;

    // Headers
    doc.setFontSize(14);
    doc.text('Header Structure:', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`• H1 Tags: ${result.headers.h1Count}`, 25, yPos);
    yPos += 7;
    doc.text(`• H2 Tags: ${result.headers.h2Count}`, 25, yPos);
    yPos += 7;
    doc.text(`• H3 Tags: ${result.headers.h3Count}`, 25, yPos);
    yPos += 15;

    // Content Analysis
    doc.setFontSize(14);
    doc.text('Content Analysis:', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`• Word Count: ${result.contentAnalysis.wordCount}`, 25, yPos);
    yPos += 7;
    doc.text(`• Readability Score: ${result.contentAnalysis.readabilityScore}/100`, 25, yPos);
    yPos += 15;

    // Technical SEO
    doc.setFontSize(14);
    doc.text('Technical SEO:', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`• Load Time: ${result.technicalSeo.loadTime}`, 25, yPos);
    yPos += 7;
    doc.text(`• Page Size: ${result.technicalSeo.pageSize}`, 25, yPos);
    yPos += 15;

    // Recommendations
    doc.setFontSize(14);
    doc.text('Recommendations:', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    result.recommendations.forEach((rec) => {
      doc.text(`• ${rec.issue} (${rec.severity})`, 25, yPos);
      yPos += 7;
      doc.text(`  Solution: ${rec.solution}`, 25, yPos);
      yPos += 10;
    });

    // Generate the PDF
    doc.save('seo-analysis-report.pdf');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !result) {
    toast({
      title: "No analysis data",
      description: "No analysis data available. Please analyze a URL first.",
      variant: "destructive",
    });
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Analyze Another URL
          </Button>

          <Button
            onClick={handleDownload}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SEO Analysis Results</CardTitle>
            <CardDescription>
              Comprehensive analysis of your website's SEO performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScoreIndicator score={result.score} />

            <div className="grid gap-6 md:grid-cols-2">
              {/* Meta Tags Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Meta Tags</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Title</span>
                      <StatusIcon condition={result.metaTags.hasTitle} />
                    </div>
                    <p className="text-sm text-muted-foreground">{result.metaTags.title}</p>
                    <p className="text-xs text-muted-foreground">Length: {result.metaTags.titleLength} characters</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Description</span>
                      <StatusIcon condition={result.metaTags.hasDescription} />
                    </div>
                    <p className="text-sm text-muted-foreground">{result.metaTags.description}</p>
                    <p className="text-xs text-muted-foreground">Length: {result.metaTags.descriptionLength} characters</p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-medium">Other Meta Tags</span>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Keywords: {result.metaTags.keywords ? "✓" : "✗"}</div>
                      <div>Robots: {result.metaTags.robots ? "✓" : "✗"}</div>
                      <div>Viewport: {result.metaTags.viewport ? "✓" : "✗"}</div>
                      <div>OG Tags: {result.metaTags.ogTags.title ? "✓" : "✗"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Headers Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Headers Structure</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{result.headers.h1Count}</div>
                      <div className="text-sm text-muted-foreground">H1 Tags</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{result.headers.h2Count}</div>
                      <div className="text-sm text-muted-foreground">H2 Tags</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{result.headers.h3Count}</div>
                      <div className="text-sm text-muted-foreground">H3 Tags</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Hierarchy</span>
                      <StatusIcon condition={result.headers.isHierarchyCorrect} />
                    </div>
                    <p className="text-sm text-muted-foreground">{result.headers.headerStructure}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Content Analysis Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Content Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">Word Count</div>
                      <div className="text-2xl font-bold">{result.contentAnalysis.wordCount}</div>
                    </div>
                    <div>
                      <div className="font-medium">Readability</div>
                      <div className="text-2xl font-bold">{result.contentAnalysis.readabilityScore}/100</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Keyword Density</div>
                    {Object.entries(result.contentAnalysis.keywordDensity).map(([keyword, density]) => (
                      <div key={keyword} className="flex justify-between text-sm">
                        <span>{keyword}</span>
                        <span>{density}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Content Quality</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Internal Links: {result.contentAnalysis.contentQuality.internalLinksCount}</div>
                      <div>External Links: {result.contentAnalysis.contentQuality.externalLinksCount}</div>
                      <div>Has Images: {result.contentAnalysis.contentQuality.hasImages ? "✓" : "✗"}</div>
                      <div>Paragraphs: {result.contentAnalysis.paragraphCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical SEO Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Technical SEO</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">Load Time</div>
                      <div className="text-2xl font-bold">{result.technicalSeo.loadTime}</div>
                    </div>
                    <div>
                      <div className="font-medium">Page Size</div>
                      <div className="text-2xl font-bold">{result.technicalSeo.pageSize}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <StatusIcon condition={result.technicalSeo.mobileResponsive} />
                      <span>Mobile Friendly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon condition={result.technicalSeo.hasSSL} />
                      <span>SSL Secure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon condition={result.technicalSeo.hasSitemap} />
                      <span>Sitemap</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon condition={result.technicalSeo.hasRobotsTxt} />
                      <span>Robots.txt</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          {recommendation.issue}
                        </div>
                        <SeverityBadge severity={recommendation.severity} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{recommendation.impact}</p>
                      <p className="text-sm font-medium">Solution:</p>
                      <p className="text-sm text-muted-foreground">{recommendation.solution}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}