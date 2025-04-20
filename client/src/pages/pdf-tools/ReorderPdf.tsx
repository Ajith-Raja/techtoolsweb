import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, MoveVertical, ArrowUp, ArrowDown, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';

interface PageItem {
  id: string;
  pageNumber: number;
  originalPosition: number;
}

export default function ReorderPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pageCount, setPageCount] = useState<number>(0);
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
      // Generate random page count between 3 and 10
      const simulatedPageCount = Math.floor(Math.random() * 8) + 3;
      setPageCount(simulatedPageCount);
      
      // Initialize pages array with all pages not selected
      const pagesArray: PageItem[] = [];
      for (let i = 1; i <= simulatedPageCount; i++) {
        pagesArray.push({ 
          id: `page-${i}`, 
          pageNumber: i,
          originalPosition: i
        });
      }
      setPages(pagesArray);
      setLoading(false);
    }, 1500);
  };

  const resetForm = () => {
    setFile(null);
    setPages([]);
    setPageCount(0);
    setProgress(0);
    setCompleted(false);
  };

  const movePage = (pageId: string, direction: 'up' | 'down') => {
    const pageIndex = pages.findIndex(page => page.id === pageId);
    
    if (
      (direction === 'up' && pageIndex === 0) || 
      (direction === 'down' && pageIndex === pages.length - 1)
    ) {
      return;
    }
    
    const newPages = [...pages];
    const newIndex = direction === 'up' ? pageIndex - 1 : pageIndex + 1;
    
    // Swap positions
    const temp = newPages[pageIndex];
    newPages[pageIndex] = newPages[newIndex];
    newPages[newIndex] = temp;
    
    // Update page numbers to match new order
    for (let i = 0; i < newPages.length; i++) {
      newPages[i].pageNumber = i + 1;
    }
    
    setPages(newPages);
  };

  const handleReorder = () => {
    if (!file || pages.length === 0) return;
    
    // Check if any page has been moved
    const hasMoved = pages.some(page => page.pageNumber !== page.originalPosition);
    
    if (!hasMoved) {
      toast({
        title: "No changes made",
        description: "The page order hasn't been changed",
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
          title: 'Pages Reordered Successfully',
          description: 'Your PDF with reordered pages is ready to download.',
        });
      }
    }, 300);
  };

  const hasChanges = () => {
    return pages.some(page => page.pageNumber !== page.originalPosition);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Reorder PDF Pages
            </CardTitle>
            <CardDescription>
              Change the order of pages in your PDF document
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
                    <File className="h-8 w-8 mb-4 animate-pulse text-primary" />
                    <p className="text-center text-muted-foreground">
                      Loading document pages...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-2">Drag pages to reorder</h3>
                      <p className="text-xs text-muted-foreground">
                        Use the up and down buttons to change the order of pages in your document
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {pages.map((page) => (
                        <div 
                          key={page.id} 
                          className={`p-4 rounded-lg flex items-center justify-between ${
                            page.pageNumber !== page.originalPosition
                              ? 'bg-primary/10 border border-primary'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center rounded-full mr-3">
                              {page.pageNumber}
                            </div>
                            <div>
                              <p className="font-medium">
                                Page {page.originalPosition}
                              </p>
                              {page.pageNumber !== page.originalPosition && (
                                <p className="text-xs text-primary">
                                  Moved from position {page.originalPosition} to {page.pageNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => movePage(page.id, 'up')}
                              disabled={processing || completed || page.pageNumber === 1}
                              className="h-8 w-8"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => movePage(page.id, 'down')}
                              disabled={processing || completed || page.pageNumber === pages.length}
                              className="h-8 w-8"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
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
                onClick={handleReorder}
                disabled={processing || !hasChanges()}
              >
                {processing ? (
                  <>
                    <MoveVertical className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <MoveVertical className="mr-2 h-4 w-4" />
                    Apply Reordering
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
                Download Reordered PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}