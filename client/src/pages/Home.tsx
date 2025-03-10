import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { analyzeSiteSchema, type AnalyzeSiteInput, type SeoAnalysisResult } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<AnalyzeSiteInput>({
    resolver: zodResolver(analyzeSiteSchema),
    defaultValues: {
      url: "",
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: AnalyzeSiteInput) => {
      const response = await apiRequest("POST", "/api/analyze", data);
      return response.json() as Promise<SeoAnalysisResult>;
    },
    onSuccess: (data) => {
      setLocation("/results", { 
        state: { result: data } 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Check Your Website's SEO Score Instantly
        </h1>
        <p className="text-muted-foreground text-lg">
          Get detailed insights and actionable recommendations to improve your website's SEO
        </p>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit((data) => analyzeMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter your website URL (e.g., https://example.com)"
                            className="flex-1"
                            {...field}
                          />
                          <Button 
                            type="submit"
                            disabled={analyzeMutation.isPending}
                          >
                            {analyzeMutation.isPending ? (
                              <div className="animate-spin">⏳</div>
                            ) : (
                              <>
                                <Search className="mr-2 h-4 w-4" />
                                Analyze SEO
                              </>
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
