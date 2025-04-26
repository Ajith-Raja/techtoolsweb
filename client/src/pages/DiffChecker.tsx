import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, GitCompare, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DiffLine {
  type: 'unchanged' | 'addition' | 'deletion';
  originalIndex: number;
  modifiedIndex: number;
  originalContent: string;
  modifiedContent: string;
}

export default function DiffChecker() {
  const [originalText, setOriginalText] = useState<string>("");
  const [modifiedText, setModifiedText] = useState<string>("");
  const [diffResult, setDiffResult] = useState<React.ReactNode>(null);
  const [diffData, setDiffData] = useState<DiffLine[]>([]);
  const [mergedText, setMergedText] = useState<string>("");
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
    
    const diffLines: DiffLine[] = [];
    const result: React.ReactNode[] = [];
    let i = 0;

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
        
        diffLines.push({
          type: 'unchanged',
          originalIndex,
          modifiedIndex,
          originalContent: originalLines[originalIndex],
          modifiedContent: modifiedLines[modifiedIndex]
        });
        
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
        
        diffLines.push({
          type: 'deletion',
          originalIndex,
          modifiedIndex: -1,
          originalContent: originalLines[originalIndex],
          modifiedContent: ''
        });
        
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
        
        diffLines.push({
          type: 'addition',
          originalIndex: -1,
          modifiedIndex,
          originalContent: '',
          modifiedContent: modifiedLines[modifiedIndex]
        });
        
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
    setDiffData(diffLines);
    setDiffResult(<div className="overflow-auto font-mono text-sm">{result}</div>);
    
    // Initialize merged text with original text
    const initializeMergedText = () => {
      setMergedText(originalText);
    };
    
    initializeMergedText();
    setActiveTab("diff");
  };
  
  // Function to apply a line from either the left or right side
  const applyChange = (lineIndex: number, side: 'left' | 'right') => {
    const line = diffData[lineIndex];
    
    // If the line is unchanged, do nothing
    if (line.type === 'unchanged') return;
    
    // Create arrays of lines for easier manipulation
    const mergedLines = mergedText.split('\n');
    const originalLines = originalText.split('\n');
    const modifiedLines = modifiedText.split('\n');
    
    // Get all lines before the current diffLine in the merged text
    const prevLines: DiffLine[] = diffData.slice(0, lineIndex).filter(
      l => l.type === 'unchanged' || 
           (l.type === 'deletion' && side === 'left') || 
           (l.type === 'addition' && side === 'right')
    );
    
    let lastIndex = -1;
    if (prevLines.length > 0) {
      const lastLine = prevLines[prevLines.length - 1];
      lastIndex = side === 'left' ? lastLine.originalIndex : lastLine.modifiedIndex;
    }
    
    // Determine the correct insertion index in the merged text
    let insertIndex = lastIndex + 1;
    if (insertIndex >= mergedLines.length) {
      insertIndex = mergedLines.length;
    }
    
    // Get the content to insert based on the requested side
    const contentToInsert = side === 'left' ? line.originalContent : line.modifiedContent;
    
    // Handle different types of changes
    if (line.type === 'deletion' && side === 'left') {
      // Keep line from left (original) side
      // It's already in the merged text, so no action needed
      toast({
        title: "Change Applied",
        description: "Kept original line"
      });
    } else if (line.type === 'addition' && side === 'right') {
      // Add line from right (modified) side to merged text
      mergedLines.splice(insertIndex, 0, contentToInsert);
      setMergedText(mergedLines.join('\n'));
      toast({
        title: "Change Applied",
        description: "Added new line from modified text"
      });
    } else if (line.type === 'deletion' && side === 'right') {
      // Remove line from merged text
      mergedLines.splice(insertIndex, 1);
      setMergedText(mergedLines.join('\n'));
      toast({
        title: "Change Applied",
        description: "Removed line from original text"
      });
    } else if (line.type === 'addition' && side === 'left') {
      // Ignore the added line from the right side
      toast({
        title: "Change Ignored",
        description: "Ignored new line from modified text"
      });
    }
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

  // Clear all data
  const clearAll = () => {
    setOriginalText("");
    setModifiedText("");
    setDiffResult(null);
    setDiffData([]);
    setMergedText("");
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

  // Function to copy merged text to clipboard
  const copyMergedText = async () => {
    try {
      await navigator.clipboard.writeText(mergedText);
      toast({
        title: "Copied!",
        description: "Merged text copied to clipboard"
      });
    } catch (err) {
      console.error("Failed to copy merged text: ", err);
    }
  };
  
  // Render the diff with merge buttons
  const renderDiffWithMergeOptions = () => {
    if (!diffData.length) return null;
    
    return diffData.map((line, index) => {
      if (line.type === 'unchanged') {
        return (
          <div key={`unchanged-${index}`} className="flex">
            <div className="w-1/2 py-1 px-2 bg-gray-50 border-r flex">
              <span className="w-8 text-gray-500 inline-block text-right mr-3">{line.originalIndex + 1}</span>
              {line.originalContent}
            </div>
            <div className="w-1/2 py-1 px-2 bg-gray-50 flex">
              <span className="w-8 text-gray-500 inline-block text-right mr-3">{line.modifiedIndex + 1}</span>
              {line.modifiedContent}
            </div>
          </div>
        );
      } else if (line.type === 'deletion') {
        return (
          <div key={`deletion-${index}`} className="flex relative group">
            <div className="w-1/2 py-1 px-2 bg-red-900/10 text-red-900 border-r border-red-200 flex shadow-sm">
              <span className="w-8 text-red-700 inline-block text-right mr-3">{line.originalIndex + 1}</span>
              {line.originalContent}
              <div className="absolute inset-y-0 left-1/2 -ml-12 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-6 w-6 rounded-full bg-white shadow-lg hover:bg-green-50"
                  onClick={() => applyChange(index, 'left')}
                  title="Keep this line"
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
              </div>
            </div>
            <div className="w-1/2 py-1 px-2 flex items-center">
              <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 px-2 bg-white shadow hover:bg-red-50"
                  onClick={() => applyChange(index, 'right')}
                >
                  <span className="text-xs text-red-600">Delete Line</span>
                </Button>
              </div>
            </div>
          </div>
        );
      } else { // addition
        return (
          <div key={`addition-${index}`} className="flex relative group">
            <div className="w-1/2 py-1 px-2 border-r flex items-center">
              <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 px-2 bg-white shadow hover:bg-red-50"
                  onClick={() => applyChange(index, 'left')}
                >
                  <span className="text-xs text-red-600">Ignore Line</span>
                </Button>
              </div>
            </div>
            <div className="w-1/2 py-1 px-2 bg-green-900/10 text-green-900 border-green-200 flex shadow-sm">
              <span className="w-8 text-green-700 inline-block text-right mr-3">{line.modifiedIndex + 1}</span>
              {line.modifiedContent}
              <div className="absolute inset-y-0 left-1/2 ml-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-6 w-6 rounded-full bg-white shadow-lg hover:bg-green-50"
                  onClick={() => applyChange(index, 'right')}
                  title="Add this line"
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
              </div>
            </div>
          </div>
        );
      }
    });
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
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-md">
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
              <TabsTrigger 
                value="merged" 
                disabled={!diffResult}
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                Merged Result
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
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("merged")}
                        className="bg-white shadow-sm hover:bg-gray-50"
                      >
                        View Merged Result
                      </Button>
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
                  </div>
                  
                  <div className="bg-primary/5 p-3 rounded-md mb-2 text-sm">
                    <p><strong>Merge instructions:</strong> Hover over any changed line to see merge options. 
                      Click <Check className="inline h-3 w-3 text-green-600" /> to keep or add a line, or use the "Delete/Ignore" button to remove or skip it.</p>
                  </div>
                  
                  <div className="max-h-[600px] overflow-auto rounded-lg shadow-md border">
                    <div className="flex border-b bg-slate-100 sticky top-0 z-10">
                      <div className="w-1/2 py-2 px-4 font-medium border-r">Original</div>
                      <div className="w-1/2 py-2 px-4 font-medium">Modified</div>
                    </div>
                    <div className="overflow-auto font-mono text-sm">
                      {renderDiffWithMergeOptions()}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="merged" className="pt-4 space-y-4">
              {mergedText && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-medium text-lg">Merged Result</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyMergedText}
                      className="flex items-center bg-white shadow-sm hover:bg-gray-50"
                    >
                      Copy Merged Text
                      <Copy className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    className="min-h-[400px] font-mono text-sm w-full"
                    value={mergedText}
                    onChange={(e) => setMergedText(e.target.value)}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}