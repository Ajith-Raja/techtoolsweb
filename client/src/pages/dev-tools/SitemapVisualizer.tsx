import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SitemapVisualizer() {
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate a delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Sitemap Visualizer</h1>
      <p className="text-gray-600 mb-8">
        Enter a website URL to generate a visual sitemap. This tool crawls the site and creates an interactive tree or radial visualization of the site structure.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Website URL</CardTitle>
          <CardDescription>
            Provide the full URL of the website you want to visualize (including https://)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full md:w-2/3"
              />
            </div>
            <div>
              <Button type="submit" disabled={!url || isLoading}>
                {isLoading ? "Processing..." : "Generate Sitemap"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The Sitemap Visualizer is currently under development and will be available soon. Check back later for this feature!
        </AlertDescription>
      </Alert>
    </div>
  );
}