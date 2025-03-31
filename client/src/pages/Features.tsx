
import { Card, CardContent } from "@/components/ui/card";

export default function Features() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Features</h1>
      <Card>
        <CardContent className="prose dark:prose-invert pt-6">
          <ul className="space-y-4">
            <li>SEO Analysis</li>
            <li>Schema Generator</li>
            <li>Domain Age Checker</li>
            <li>Plagiarism Checker</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
