
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">About Us</h1>
      <Card>
        <CardContent className="prose dark:prose-invert pt-6">
          <p>
            We provide comprehensive SEO analysis and tools to help improve your website's visibility
            and performance in search engines.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
