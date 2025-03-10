import { useLocation } from "wouter";
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
  Binary
} from "lucide-react";
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

export default function Results() {
  const [location, setLocation] = useLocation();
  const result = location.state?.result as SeoAnalysisResult;

  if (!result) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Analyze Another URL
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>SEO Analysis Results</CardTitle>
            <CardDescription>
              Review your website's SEO performance and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScoreIndicator score={result.score} />

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meta Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Title Tag</span>
                    <StatusIcon condition={result.metaTags.hasTitle} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Meta Description</span>
                    <StatusIcon condition={result.metaTags.hasDescription} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Headers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>H1 Heading</span>
                    <StatusIcon condition={result.headers.hasH1} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Header Structure</span>
                    <div className="text-sm text-muted-foreground">
                      H1: {result.headers.h1Count}, H2: {result.headers.h2Count}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Word Count</span>
                    <span className="text-sm text-muted-foreground">
                      {result.contentAnalysis.wordCount} words
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Content Length</span>
                    <StatusIcon condition={result.contentAnalysis.hasEnoughContent} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
