import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DiffChecker() {
  const [originalText, setOriginalText] = useState<string>("");
  const [modifiedText, setModifiedText] = useState<string>("");
  const [diffResult, setDiffResult] = useState<React.ReactNode>(null);
  const [stats, setStats] = useState<{
    additions: number;
    deletions: number;
    unchanged: number;
  }>({ additions: 0, deletions: 0, unchanged: 0 });
  const [activeTab, setActiveTab] = useState<string>("input");
  const [copied, setCopied] = useState<boolean>(false);

  // Calculate the diff between two pieces of text
  const calculateDiff = () => {
    if (!originalText && !modifiedText) {
      return;
    }

    // Split both texts into lines
    const originalLines = originalText.split("\n");
    const modifiedLines = modifiedText.split("\n");

    // Simple diff algorithm
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;
    
    const result: React.ReactNode[] = [];
    let i = 0;
    let j = 0;

    // Find longest common subsequence of lines
    const lcs = longestCommonSubsequence(originalLines, modifiedLines);
    
    let originalIndex = 0;
    let modifiedIndex = 0;
    let lcsIndex = 0;

    while (originalIndex < originalLines.length || modifiedIndex < modifiedLines.length) {
      // Current line is in both texts
      if (lcsIndex < lcs.length && 
          originalIndex < originalLines.length && 
          modifiedIndex < modifiedLines.length && 
          originalLines[originalIndex] === lcs[lcsIndex] &&
          modifiedLines[modifiedIndex] === lcs[lcsIndex]) {
        result.push(
          <div key={`unchanged-${i++}`} className="flex">
            <div className="w-1/2 py-1 px-2 bg-gray-50 border-r flex">
              <span className="w-8 text-gray-500 inline-block text-right mr-3">{originalIndex + 1}</span>
              {originalLines[originalIndex]}
            </div>
            <div className="w-1/2 py-1 px-2 bg-gray-50 flex">
              <span className="w-8 text-gray-500 inline-block text-right mr-3">{modifiedIndex + 1}</span>
              {modifiedLines[modifiedIndex]}
            </div>
          </div>
        );
        unchanged++;
        originalIndex++;
        modifiedIndex++;
        lcsIndex++;
      }
      // Line was deleted from original
      else if (originalIndex < originalLines.length && 
              (lcsIndex >= lcs.length || originalLines[originalIndex] !== lcs[lcsIndex])) {
        result.push(
          <div key={`deletion-${i++}`} className="flex">
            <div className="w-1/2 py-1 px-2 bg-red-900/10 text-red-900 border-r border-red-200 flex shadow-sm">
              <span className="w-8 text-red-700 inline-block text-right mr-3">{originalIndex + 1}</span>
              {originalLines[originalIndex]}
            </div>
            <div className="w-1/2 py-1 px-2"></div>
          </div>
        );
        deletions++;
        originalIndex++;
      }
      // Line was added in modified
      else if (modifiedIndex < modifiedLines.length && 
              (lcsIndex >= lcs.length || modifiedLines[modifiedIndex] !== lcs[lcsIndex])) {
        result.push(
          <div key={`addition-${i++}`} className="flex">
            <div className="w-1/2 py-1 px-2 border-r"></div>
            <div className="w-1/2 py-1 px-2 bg-green-900/10 text-green-900 border-green-200 flex shadow-sm">
              <span className="w-8 text-green-700 inline-block text-right mr-3">{modifiedIndex + 1}</span>
              {modifiedLines[modifiedIndex]}
            </div>
          </div>
        );
        additions++;
        modifiedIndex++;
      }
    }

    setStats({ additions, deletions, unchanged });
    setDiffResult(<div className="overflow-auto font-mono text-sm">{result}</div>);
    setActiveTab("diff");
  };

  // Longest common subsequence algorithm to find common lines
  const longestCommonSubsequence = (arr1: string[], arr2: string[]): string[] => {
    const lengths: number[][] = Array(arr1.length + 1)
      .fill(0)
      .map(() => Array(arr2.length + 1).fill(0));

    // Fill the lengths array
    for (let i = 0; i <= arr1.length; i++) {
      for (let j = 0; j <= arr2.length; j++) {
        if (i === 0 || j === 0) {
          lengths[i][j] = 0;
        } else if (arr1[i - 1] === arr2[j - 1]) {
          lengths[i][j] = lengths[i - 1][j - 1] + 1;
        } else {
          lengths[i][j] = Math.max(lengths[i - 1][j], lengths[i][j - 1]);
        }
      }
    }

    // Backtrack to find the LCS
    const result: string[] = [];
    let i = arr1.length;
    let j = arr2.length;

    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        result.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (lengths[i - 1][j] >= lengths[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return result;
  };

  const handleOriginalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOriginalText(e.target.value);
  };

  const handleModifiedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setModifiedText(e.target.value);
  };

  const copyResults = async () => {
    try {
      // Create a text representation of the diff
      const originalLines = originalText.split("\n");
      const modifiedLines = modifiedText.split("\n");
      
      let diffText = "===== DIFF RESULT =====\n\n";
      diffText += `ORIGINAL (${originalLines.length} lines):\n${originalText}\n\n`;
      diffText += `MODIFIED (${modifiedLines.length} lines):\n${modifiedText}\n\n`;
      diffText += `SUMMARY:\n- ${stats.additions} additions\n- ${stats.deletions} deletions\n- ${stats.unchanged} unchanged lines\n`;
      
      await navigator.clipboard.writeText(diffText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Clear both textareas
  const clearAll = () => {
    setOriginalText("");
    setModifiedText("");
    setDiffResult(null);
    setStats({ additions: 0, deletions: 0, unchanged: 0 });
    setActiveTab("input");
  };

  // Example texts for demonstration
  const loadExample = () => {
    setOriginalText(
`This is a sample text.
It has several lines.
Some lines will be modified.
Others will be left unchanged.
And some lines will be deleted.`
    );
    
    setModifiedText(
`This is a sample text.
It has several lines.
Some lines have been modified with new content.
Others will be left unchanged.
And we have added some brand new lines.
These lines weren't in the original text.`
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="border-none shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center text-primary">
              <GitCompare className="mr-2 h-6 w-6" />
              Diff Checker
            </CardTitle>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadExample}
                className="bg-white/80 hover:bg-white shadow-sm"
              >
                Load Example
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                className="bg-white/80 hover:bg-white shadow-sm"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-md">
              <TabsTrigger value="input" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-md">
                Input
              </TabsTrigger>
              <TabsTrigger 
                value="diff" 
                disabled={!diffResult}
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                Diff Result
              </TabsTrigger>
            </TabsList>
            <TabsContent value="input" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-medium">Original Text</div>
                  <Textarea
                    placeholder="Paste your original text here..."
                    className="min-h-[400px] font-mono text-sm"
                    value={originalText}
                    onChange={handleOriginalChange}
                  />
                </div>
                <div className="space-y-2">
                  <div className="font-medium">Modified Text</div>
                  <Textarea
                    placeholder="Paste your modified text here..."
                    className="min-h-[400px] font-mono text-sm"
                    value={modifiedText}
                    onChange={handleModifiedChange}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={calculateDiff}
                  className="w-full max-w-md bg-primary hover:bg-primary/90 shadow-md"
                  disabled={!originalText && !modifiedText}
                >
                  <GitCompare className="mr-2 h-4 w-4" />
                  Compare Texts
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="diff" className="pt-4 space-y-4">
              {diffResult && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="bg-green-900/10 text-green-900 border-green-200 hover:bg-green-900/20 shadow-sm">
                        {stats.additions} Additions
                      </Badge>
                      <Badge variant="outline" className="bg-red-900/10 text-red-900 border-red-200 hover:bg-red-900/20 shadow-sm">
                        {stats.deletions} Deletions
                      </Badge>
                      <Badge variant="outline" className="bg-gray-100 shadow-sm">
                        {stats.unchanged} Unchanged
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyResults}
                      className="flex items-center bg-white shadow-sm hover:bg-gray-50"
                      disabled={copied}
                    >
                      {copied ? "Copied!" : "Copy Results"}
                      <Copy className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-[600px] overflow-auto rounded-lg shadow-md border">
                    <div className="flex border-b bg-slate-100 sticky top-0 z-10">
                      <div className="w-1/2 py-2 px-4 font-medium border-r">Original</div>
                      <div className="w-1/2 py-2 px-4 font-medium">Modified</div>
                    </div>
                    {diffResult}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}