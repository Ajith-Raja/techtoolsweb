import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, FileOutput, Trash2, LayoutList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface PageItem {
  pageNumber: number;
  selected: boolean;
}

export default function RemovePages() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pageCount, setPageCount] = useState<number>(0);
  const [customRange, setCustomRange] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProgress(0);
    setCompleted(false);
    setLoading(true);
    
    // Simulate getting page count from PDF
    setTimeout(() => {
      // Generate random page count between 5 and 20
      const simulatedPageCount = Math.floor(Math.random() * 16) + 5;
      setPageCount(simulatedPageCount);
      
      // Initialize pages array with all pages not selected
      const pagesArray: PageItem[] = [];
      for (let i = 1; i <= simulatedPageCount; i++) {
        pagesArray.push({ pageNumber: i, selected: false });
      }
      setPages(pagesArray);
      setLoading(false);
    }, 1500);
  };

  const resetForm = () => {
    setFile(null);
    setPages([]);
    setPageCount(0);
    setCustomRange("");
    setProgress(0);
    setCompleted(false);
  };

  const togglePage = (pageNumber: number) => {
    setPages(pages.map(page => 
      page.pageNumber === pageNumber 
        ? { ...page, selected: !page.selected } 
        : page
    ));
  };

  const handleRemove = () => {
    if (!file) return;
    
    const selectedPages = pages.filter(page => page.selected);
    if (selectedPages.length === 0) {
      toast({
        title: "No pages selected",
        description: "Please select at least one page to remove",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedPages.length === pageCount) {
      toast({
        title: "All pages selected",
        description: "You cannot remove all pages from the PDF",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    
    // Simulate processing
    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal += 5;
      setProgress(progressVal);
      
      if (progressVal >= 100) {
        clearInterval(interval);
        setProcessing(false);
        setCompleted(true);
        toast({
          title: 'Pages Removed Successfully',
          description: `Removed ${selectedPages.length} pages from your PDF.`,
        });
      }
    }, 300);
  };

  const handleCustomRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomRange(e.target.value);
  };

  const applyCustomRange = () => {
    if (!customRange.trim()) return;
    
    try {
      // Reset all pages to not selected
      const resetPages = pages.map(page => ({ ...page, selected: false }));
      
      // Process range parts (e.g. "1-3, 5, 7-9")
      const rangeParts = customRange.split(',').map(part => part.trim());
      
      for (const part of rangeParts) {
        if (part.includes('-')) {
          // Range (e.g. "1-3")
          const [start, end] = part.split('-').map(Number);
          
          if (isNaN(start) || isNaN(end) || start < 1 || end > pageCount || start > end) {
            throw new Error(`Invalid range: ${part}`);
          }
          
          for (let i = start; i <= end; i++) {
            const pageIndex = resetPages.findIndex(p => p.pageNumber === i);
            if (pageIndex !== -1) {
              resetPages[pageIndex].selected = true;
            }
          }
        } else {
          // Single page (e.g. "5")
          const pageNum = Number(part);
          
          if (isNaN(pageNum) || pageNum < 1 || pageNum > pageCount) {
            throw new Error(`Invalid page number: ${part}`);
          }
          
          const pageIndex = resetPages.findIndex(p => p.pageNumber === pageNum);
          if (pageIndex !== -1) {
            resetPages[pageIndex].selected = true;
          }
        }
      }
      
      setPages(resetPages);
    } catch (error) {
      toast({
        title: "Invalid page range",
        description: error instanceof Error ? error.message : "Please check your input format",
        variant: "destructive"
      });
    }
  };

  const getSelectedCount = () => {
    return pages.filter(page => page.selected).length;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Remove Pages from PDF
            </CardTitle>
            <CardDescription>
              Delete specific pages from your PDF document
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <PdfFileUpload 
              onFileSelect={handleFileSelect}
              currentFile={file}
              onFileRemove={resetForm}
              disabled={processing || loading}
            />
            
            {file && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <LayoutList className="h-8 w-8 mb-4 animate-pulse text-primary" />
                    <p className="text-center text-muted-foreground">
                      Analyzing document pages...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Select pages to remove</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {getSelectedCount()} of {pageCount} selected
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="e.g. 1-3, 5, 7-9"
                            value={customRange}
                            onChange={handleCustomRangeChange}
                            disabled={processing || completed}
                          />
                          <Button 
                            variant="outline" 
                            onClick={applyCustomRange}
                            disabled={processing || completed || !customRange.trim()}
                          >
                            Apply
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter page numbers or ranges separated by commas to select pages
                        </p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-5 gap-px bg-border">
                        {pages.map((page) => (
                          <div 
                            key={page.pageNumber}
                            className={`flex flex-col items-center justify-center p-2 cursor-pointer transition-colors ${
                              page.selected 
                                ? 'bg-primary/10 border border-primary' 
                                : 'bg-background hover:bg-muted/50'
                            }`}
                            onClick={() => togglePage(page.pageNumber)}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <Checkbox 
                                checked={page.selected}
                                onCheckedChange={() => togglePage(page.pageNumber)}
                                disabled={processing || completed}
                                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {page.pageNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {(processing || completed) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-end">
            {file && !loading && !completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={handleRemove}
                disabled={processing || getSelectedCount() === 0 || getSelectedCount() === pageCount}
              >
                {processing ? (
                  <>
                    <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove {getSelectedCount()} Pages
                  </>
                )}
              </Button>
            )}
            
            {completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Modified PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}