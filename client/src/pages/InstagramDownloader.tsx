import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Instagram, DownloadCloud, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withMainApi } from "@/lib/apiConfig";

const instagramSchema = z.object({
  url: z
    .string()
    .url("Please enter a valid URL")
    .refine((value) => value.includes("instagram.com"), {
      message: "URL must be a valid Instagram post/reel URL",
    }),
});

type InstagramFormValues = z.infer<typeof instagramSchema>;

export default function InstagramDownloader() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);

  const form = useForm<InstagramFormValues>({
    resolver: zodResolver(instagramSchema),
    defaultValues: {
      url: "",
    },
  });

  const fetchMediaInfo = async (values: InstagramFormValues) => {
    try {
      setIsLoading(true);
      setApiResult(null);

      const response = await fetch(withMainApi("/instagram/info"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to fetch Instagram media info");
      }

      setApiResult(data);
      toast({
        title: "Placeholder API response received",
        description: "Backend stub is wired. Replace placeholder logic in api_tester.",
      });
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDownload = async () => {
    try {
      setIsDownloading(true);

      const values = form.getValues();
      const response = await fetch(withMainApi("/instagram/download"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to trigger download");
      }

      setApiResult(data);
      toast({
        title: "Download endpoint reached",
        description: "This is currently a placeholder. Implement real file download in backend.",
      });
    } catch (error) {
      toast({
        title: "Download request failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Instagram className="h-6 w-6" />
            Instagram Downloader
          </CardTitle>
          <CardDescription>
            Enter an Instagram URL and credentials. API calls are wired with backend placeholders in
            `api_tester`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Placeholder integration</AlertTitle>
            <AlertDescription>
              The UI and API endpoints are connected. Replace placeholder logic in
              `api_tester/instagram_downloader_api.py` for production behavior.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(fetchMediaInfo)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Post/Reel URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.instagram.com/reel/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch Media Info"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={triggerDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="mr-2 h-4 w-4" />
                      Download (Placeholder)
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {apiResult && (
            <div className="rounded-md border bg-muted p-4">
              <p className="mb-2 text-sm font-medium">API Response</p>
              <pre className="max-h-80 overflow-auto text-xs">{JSON.stringify(apiResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
