import React, { useEffect, useMemo, useRef, useState } from "react";
import { diffArrays, diffChars, diffWordsWithSpace } from "diff";
import { ArrowLeftRight, Copy, Download, FileUp, GitCompare, RotateCcw, Share2, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DiffMode = "line" | "word" | "char";
type ViewMode = "side-by-side" | "unified";

type CompareOptions = {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  ignoreLineEndings: boolean;
  showOnlyDifferences: boolean;
};

type LineType = "unchanged" | "added" | "removed" | "changed";

type LineToken = {
  type: "unchanged" | "added" | "removed";
  text: string;
};

type SideRow = {
  type: LineType;
  left?: LineToken;
  right?: LineToken;
};

type UnifiedRow = {
  key: string;
  prefix: " " | "+" | "-";
  type: "unchanged" | "added" | "removed";
  text: string;
  leftLine?: number;
  rightLine?: number;
};

type InlineToken = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

const sampleLeft = `Travel Plan v1\nDestination: Kyoto\nDuration: 5 days\nBudget: 1200 USD\nHotel: Sakura Inn\nNotes: Visit temples and local markets.`;

const sampleRight = `Travel Plan v2\nDestination: Kyoto, Japan\nDuration: 6 days\nBudget: 1450 USD\nHotel: Sakura Riverside Inn\nNotes: Visit temples, local markets, and Arashiyama.`;

const tokenizeLines = (left: string, right: string, options: CompareOptions): LineToken[] => {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");

  const chunks = diffArrays(leftLines, rightLines, {
    comparator: (a, b) => {
      if (options.ignoreCase) {
        return a.toLowerCase() === b.toLowerCase();
      }
      return a === b;
    },
  });

  const tokens: LineToken[] = [];

  chunks.forEach((chunk) => {
    if (!chunk.value || chunk.value.length === 0) return;

    const type: LineToken["type"] = chunk.added ? "added" : chunk.removed ? "removed" : "unchanged";
    chunk.value.forEach((line) => {
      tokens.push({ type, text: line });
    });
  });

  return tokens;
};

const alignSideBySide = (tokens: LineToken[]): SideRow[] => {
  const rows: SideRow[] = [];
  let i = 0;

  while (i < tokens.length) {
    const current = tokens[i];

    if (current.type === "unchanged") {
      rows.push({ type: "unchanged", left: current, right: current });
      i += 1;
      continue;
    }

    if (current.type === "removed") {
      const removedRun: LineToken[] = [];
      while (i < tokens.length && tokens[i].type === "removed") {
        removedRun.push(tokens[i]);
        i += 1;
      }

      const addedRun: LineToken[] = [];
      const start = i;
      while (i < tokens.length && tokens[i].type === "added") {
        addedRun.push(tokens[i]);
        i += 1;
      }

      if (addedRun.length > 0) {
        const maxRows = Math.max(removedRun.length, addedRun.length);
        for (let idx = 0; idx < maxRows; idx += 1) {
          rows.push({
            type: "changed",
            left: removedRun[idx],
            right: addedRun[idx],
          });
        }
      } else {
        removedRun.forEach((line) => {
          rows.push({ type: "removed", left: line });
        });
      }

      if (addedRun.length === 0) {
        i = start;
      }

      continue;
    }

    if (current.type === "added") {
      rows.push({ type: "added", right: current });
      i += 1;
      continue;
    }
  }

  return rows;
};

const toUnifiedRows = (rows: SideRow[], showOnlyDifferences: boolean): UnifiedRow[] => {
  const unified: UnifiedRow[] = [];
  let leftLine = 1;
  let rightLine = 1;

  rows.forEach((row, index) => {
    if (row.type === "unchanged") {
      if (!showOnlyDifferences && row.left) {
        unified.push({
          key: `u-${index}-same`,
          prefix: " ",
          type: "unchanged",
          text: row.left.text,
          leftLine,
          rightLine,
        });
      }
      leftLine += 1;
      rightLine += 1;
      return;
    }

    if ((row.type === "removed" || row.type === "changed") && row.left) {
      unified.push({
        key: `u-${index}-left`,
        prefix: "-",
        type: "removed",
        text: row.left.text,
        leftLine,
      });
      leftLine += 1;
    }

    if ((row.type === "added" || row.type === "changed") && row.right) {
      unified.push({
        key: `u-${index}-right`,
        prefix: "+",
        type: "added",
        text: row.right.text,
        rightLine,
      });
      rightLine += 1;
    }
  });

  return unified;
};

const normalizeText = (value: string, options: CompareOptions): string => {
  let normalized = value;

  if (options.ignoreLineEndings) {
    normalized = normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  if (options.ignoreWhitespace) {
    normalized = normalized
      .split("\n")
      .map((line) => line.trim().replace(/\s+/g, " "))
      .join("\n");
  }

  return normalized;
};

const buildInlineDiff = (left: string, right: string, mode: DiffMode, options: CompareOptions): InlineToken[] => {
  if (mode === "char") {
    return diffChars(left, right, { ignoreCase: options.ignoreCase }) as InlineToken[];
  }

  return diffWordsWithSpace(left, right, { ignoreCase: options.ignoreCase }) as InlineToken[];
};

const buildUnifiedTextExport = (rows: UnifiedRow[]): string => {
  return rows.map((row) => `${row.prefix}${row.text}`).join("\n");
};

const computeSimilarity = (left: string, right: string, options: CompareOptions): number => {
  const charTokens = diffChars(left, right, { ignoreCase: options.ignoreCase }) as InlineToken[];
  const unchangedChars = charTokens.filter((t) => !t.added && !t.removed).reduce((acc, t) => acc + t.value.length, 0);
  const base = Math.max(left.length, right.length);

  if (base === 0) {
    return 100;
  }

  return Math.round((unchangedChars / base) * 100);
};

const readFileText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsText(file);
  });
};

const TextareaWithLineNumbers = ({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder: string }) => {
  const lines = value.split("\n").length;
  const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-slate-950 h-80">
      <div 
        ref={lineNumbersRef}
        className="bg-muted px-3 py-2 text-right text-xs text-muted-foreground font-mono select-none border-r overflow-y-hidden overflow-x-hidden"
        style={{ lineHeight: "1.5", width: "50px", flexShrink: 0 }}
      >
        {lineNumbers.map((num) => (
          <div key={num} style={{ height: "1.5em", lineHeight: "1.5em" }}>
            {num}
          </div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="flex-1 p-3 font-mono text-sm resize-none focus:outline-none bg-white dark:bg-slate-950 text-foreground border-none"
        style={{ lineHeight: "1.5", overflowY: "scroll", overflowX: "auto" }}
        spellCheck="false"
      />
    </div>
  );
};

export default function DiffChecker() {
  const { toast } = useToast();

  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [mode, setMode] = useState<DiffMode>("line");
  const [view, setView] = useState<ViewMode>("side-by-side");
  const [showResults, setShowResults] = useState(false);
  const [options, setOptions] = useState<CompareOptions>({
    ignoreCase: false,
    ignoreWhitespace: false,
    ignoreLineEndings: true,
    showOnlyDifferences: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const left = params.get("left");
    const right = params.get("right");
    const modeParam = params.get("mode") as DiffMode | null;
    const viewParam = params.get("view") as ViewMode | null;

    if (left) setLeftText(left);
    if (right) setRightText(right);
    if (modeParam === "line" || modeParam === "word" || modeParam === "char") {
      setMode(modeParam);
    }
    if (viewParam === "side-by-side" || viewParam === "unified") {
      setView(viewParam);
    }
  }, []);

  const normalizedLeft = useMemo(() => normalizeText(leftText, options), [leftText, options]);
  const normalizedRight = useMemo(() => normalizeText(rightText, options), [rightText, options]);

  const lineRows = useMemo(() => {
    const tokens = tokenizeLines(normalizedLeft, normalizedRight, options);
    return alignSideBySide(tokens);
  }, [normalizedLeft, normalizedRight, options]);

  const filteredLineRows = useMemo(() => {
    if (!options.showOnlyDifferences) {
      return lineRows;
    }
    return lineRows.filter((row) => row.type !== "unchanged");
  }, [lineRows, options.showOnlyDifferences]);

  const unifiedRows = useMemo(() => {
    return toUnifiedRows(lineRows, options.showOnlyDifferences);
  }, [lineRows, options.showOnlyDifferences]);

  const inlineTokens = useMemo(() => {
    return buildInlineDiff(normalizedLeft, normalizedRight, mode, options);
  }, [normalizedLeft, normalizedRight, mode, options]);

  const filteredInlineTokens = useMemo(() => {
    if (!options.showOnlyDifferences) {
      return inlineTokens;
    }
    return inlineTokens.filter((token) => token.added || token.removed);
  }, [inlineTokens, options.showOnlyDifferences]);

  const stats = useMemo(() => {
    const added = lineRows.filter((row) => row.type === "added").length;
    const removed = lineRows.filter((row) => row.type === "removed").length;
    const changed = lineRows.filter((row) => row.type === "changed").length;
    const unchanged = lineRows.filter((row) => row.type === "unchanged").length;
    const similarity = computeSimilarity(normalizedLeft, normalizedRight, options);

    return { added, removed, changed, unchanged, similarity };
  }, [lineRows, normalizedLeft, normalizedRight, options]);

  const handleFileLoad = async (side: "left" | "right", file: File | null) => {
    if (!file) return;

    try {
      const content = await readFileText(file);
      if (side === "left") {
        setLeftText(content);
      } else {
        setRightText(content);
      }

      toast({
        title: "File loaded",
        description: `${file.name} imported into the ${side} pane.`,
      });
    } catch {
      toast({
        title: "Could not read file",
        description: "Please try a plain text file.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const params = new URLSearchParams({
      left: leftText,
      right: rightText,
      mode,
      view,
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    if (shareUrl.length > 1800) {
      toast({
        title: "Text too large for URL sharing",
        description: "Backend storage is needed for permanent share links for large documents.",
      });
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share link copied",
      description: "You can now send this URL to open the same comparison.",
    });
  };

  const handleCopyResult = async () => {
    const exportText =
      mode === "line"
        ? buildUnifiedTextExport(unifiedRows)
        : filteredInlineTokens.map((token) => token.value).join("");

    await navigator.clipboard.writeText(exportText);
    toast({
      title: "Diff copied",
      description: "Comparison output copied to clipboard.",
    });
  };

  const handleDownload = () => {
    const exportText = buildUnifiedTextExport(unifiedRows);
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "comparison.diff.txt";
    anchor.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Unified diff file downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Diff Checker</h1>
          </div>
          {showResults && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">
                <span className="text-red-600">- {stats.removed}</span>
                <span className="text-green-600 ml-2">+ {stats.added}</span>
                <span className="text-blue-600 ml-2">≈ {stats.similarity}%</span>
              </Badge>
            </div>
          )}
        </div>

        {!showResults ? (
          <>
            {/* Input textareas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Original text</h2>
                <TextareaWithLineNumbers
                  value={leftText}
                  onChange={(e) => setLeftText(e.target.value)}
                  placeholder="Paste original text here..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => leftFileRef.current?.click()}
                  className="w-full"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Open file
                </Button>
                <Input
                  ref={leftFileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileLoad("left", e.target.files?.[0] ?? null)}
                  accept=".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.tsx,.py,.java,.go,.rs"
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Changed text</h2>
                <TextareaWithLineNumbers
                  value={rightText}
                  onChange={(e) => setRightText(e.target.value)}
                  placeholder="Paste changed text here..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rightFileRef.current?.click()}
                  className="w-full"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Open file
                </Button>
                <Input
                  ref={rightFileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileLoad("right", e.target.files?.[0] ?? null)}
                  accept=".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.tsx,.py,.java,.go,.rs"
                />
              </div>
            </div>

            {/* Find difference button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={() => setShowResults(true)}
                size="lg"
                className="px-12 py-6 text-base"
              >
                Find difference
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Results header */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-lg border p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowResults(false)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLeftText(rightText);
                      setRightText(leftText);
                      setShowResults(false);
                    }}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Swap
                  </Button>
                  <div className="h-6 border-l border-border" />
                  <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="side-by-side" className="text-xs">
                        Side by side
                      </TabsTrigger>
                      <TabsTrigger value="unified" className="text-xs">
                        Unified
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResult}
                    className="text-xs"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-xs"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-xs"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Comparison results - Different styling */}
            <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-700 overflow-hidden">
              {view === "side-by-side" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-slate-700">
                  {/* Left side */}
                  <div>
                    <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 sticky top-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50"></span>
                        <h3 className="text-sm font-semibold text-slate-200">Removals</h3>
                        <span className="ml-auto text-xs text-slate-400">{filteredLineRows.filter(r => r.type === "removed" || r.type === "changed").length} lines</span>
                      </div>
                    </div>
                    <ScrollArea className="h-[500px]">
                      <div className="font-mono text-sm text-slate-100">
                        {filteredLineRows.map((row, index) => (
                          <div
                            key={`left-${index}`}
                            className={cn(
                              "flex border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors",
                              row.type === "added" && "hidden",
                              row.type === "removed" && "bg-red-950/40",
                              row.type === "changed" && "bg-red-950/40",
                            )}
                          >
                            <div className="w-12 px-3 py-2 bg-slate-800/50 text-right text-xs text-slate-500 select-none shrink-0 border-r border-slate-700/50">
                              {index + 1}
                            </div>
                            <div className="flex-1 px-3 py-2 break-words whitespace-pre-wrap text-slate-100">
                              {row.left?.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right side */}
                  <div>
                    <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 sticky top-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50"></span>
                        <h3 className="text-sm font-semibold text-slate-200">Additions</h3>
                        <span className="ml-auto text-xs text-slate-400">{filteredLineRows.filter(r => r.type === "added" || r.type === "changed").length} lines</span>
                      </div>
                    </div>
                    <ScrollArea className="h-[500px]">
                      <div className="font-mono text-sm text-slate-100">
                        {filteredLineRows.map((row, index) => (
                          <div
                            key={`right-${index}`}
                            className={cn(
                              "flex border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors",
                              row.type === "removed" && "hidden",
                              row.type === "added" && "bg-green-950/40",
                              row.type === "changed" && "bg-green-950/40",
                            )}
                          >
                            <div className="w-12 px-3 py-2 bg-slate-800/50 text-right text-xs text-slate-500 select-none shrink-0 border-r border-slate-700/50">
                              {index + 1}
                            </div>
                            <div className="flex-1 px-3 py-2 break-words whitespace-pre-wrap text-slate-100">
                              {row.right?.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 sticky top-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-200">Unified Diff</h3>
                      <span className="ml-auto text-xs text-slate-400">{unifiedRows.length} changes</span>
                    </div>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="font-mono text-sm text-slate-100">
                      {unifiedRows.map((row) => (
                        <div
                          key={row.key}
                          className={cn(
                            "flex border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors px-4 py-2",
                            row.type === "added" && "bg-green-950/40 text-green-200",
                            row.type === "removed" && "bg-red-950/40 text-red-200",
                          )}
                        >
                          <div className="w-8 shrink-0 text-right mr-3 font-semibold">
                            {row.prefix}
                          </div>
                          <div className="flex-1 break-words whitespace-pre-wrap">{row.text}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
