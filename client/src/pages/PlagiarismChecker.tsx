import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Clock, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function PlagiarismChecker() {
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<null | {
    matches: Array<{ text: string, source: string }>,
    plagiarismPercentage: number
  }>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedTime = Math.ceil(wordCount / 100); // Rough estimate: 1 minute per 100 words

  const handleCheck = () => {
    setIsChecking(true);
    // Mock results for now
    setTimeout(() => {
      setResults({
        plagiarismPercentage: 35,
        matches: [
          {
            text: "Lorem ipsum dolor sit amet",
            source: "https://example.com/article1"
          },
          {
            text: "consectetur adipiscing elit",
            source: "https://example.com/article2"
          }
        ]
      });
      setIsChecking(false);
    }, 2000);
  };

  const COLORS = ['#ff6b6b', '#51cf66'];
  const pieData = results ? [
    { name: 'Plagiarized', value: results.plagiarismPercentage },
    { name: 'Original', value: 100 - results.plagiarismPercentage }
  ] : [];

  return (
    <div className="relative isolate">
      {/* Background gradient */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Plagiarism Checker
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Check your text for potential plagiarism and similar content across the web
          </p>
        </div>

        <Card className="mt-12">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <textarea
                className="w-full min-h-[200px] p-4 rounded-lg border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Paste your text here to check for plagiarism..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <div className="flex flex-wrap gap-4 items-center justify-between text-sm text-muted-foreground">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{wordCount} words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>~{estimatedTime} min to check</span>
                  </div>
                </div>

                <Button 
                  onClick={handleCheck}
                  disabled={isChecking || wordCount === 0}
                  size="lg"
                >
                  {isChecking ? (
                    <div className="animate-spin">⏳</div>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Plagiarism
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Plagiarism Analysis Results</CardTitle>
              <CardDescription>
                Found potential matches in the following sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="flex flex-col items-center justify-center">
                  <div className="h-64 w-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-2xl font-bold">{results.plagiarismPercentage}%</p>
                    <p className="text-sm text-muted-foreground">Plagiarized Content</p>
                  </div>
                  <div className="mt-4 flex gap-4 justify-center">
                    {COLORS.map((color, index) => (
                      <div key={color} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm text-muted-foreground">
                          {index === 0 ? 'Plagiarized' : 'Original'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matched Text */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Matched Content</h3>
                  {results.matches.map((match, index) => (
                    <div key={index} className="space-y-2">
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="font-medium text-yellow-800">{match.text}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Found in: <a href={match.source} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{match.source}</a>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
