import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, MoveVertical, ArrowUp, ArrowDown, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { checkTaskStatus, getDownloadUrl, PdfProgress, reorderPages, usePdfProgress } from '@/lib/pdfService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageItem {
  id: string;
  pageNumber: number;
  originalPosition: number;
  thumbnailDataUrl: string;
}

export default function ReorderPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pageCount, setPageCount] = useState<number>(0);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeLoadIdRef = useRef<number>(0);
  const { toast } = useToast();

  usePdfProgress(taskId, (progressData: PdfProgress) => {
    if (progressData.status === 'processing') {
      setProgress(progressData.progress);
      return;
    }

    if (progressData.status === 'success' || progressData.status === 'completed') {
      setProgress(100);
      setProcessing(false);
      setCompleted(true);

      const completedTaskId = progressData.task_id || taskId;
      if (completedTaskId) {
        checkTaskStatus(completedTaskId)
          .then(result => {
            if (result.download_url) {
              setDownloadUrl(result.download_url);
            } else {
              setDownloadUrl(getDownloadUrl(completedTaskId));
            }
          })
          .catch(() => {
            setDownloadUrl(getDownloadUrl(completedTaskId));
          });
      }

      toast({
        title: 'Pages Reordered Successfully',
        description: 'Your PDF with reordered pages is ready to download.',
      });
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      setError(progressData.error || 'An error occurred while reordering pages');
      toast({
        title: 'Reorder Failed',
        description: progressData.error || 'An error occurred while reordering pages',
        variant: 'destructive',
      });
    }
  });

  const renderPageThumbnail = async (pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<string> => {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const targetWidth = 140;
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to create canvas context for PDF preview');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleFileSelect = async (selectedFile: File) => {
    const loadId = Date.now();
    activeLoadIdRef.current = loadId;

    setFile(selectedFile);
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
    setPages([]);
    setPageCount(0);
    setLoading(true);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
      const pdfDocument = await loadingTask.promise;

      if (activeLoadIdRef.current !== loadId) {
        return;
      }

      const detectedPageCount = pdfDocument.numPages;
      setPageCount(detectedPageCount);

      const pagesArray: PageItem[] = [];
      for (let i = 1; i <= detectedPageCount; i++) {
        const thumbnailDataUrl = await renderPageThumbnail(pdfDocument, i);

        if (activeLoadIdRef.current !== loadId) {
          return;
        }

        pagesArray.push({
          id: `page-${i}`,
          pageNumber: i,
          originalPosition: i,
          thumbnailDataUrl,
        });
      }

      setPages(pagesArray);
    } catch (error) {
      setFile(null);
      setPages([]);
      setPageCount(0);
      toast({
        title: 'Failed to load PDF pages',
        description: error instanceof Error ? error.message : 'Could not render page previews.',
        variant: 'destructive',
      });
    } finally {
      if (activeLoadIdRef.current === loadId) {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    activeLoadIdRef.current = Date.now();
    setFile(null);
    setPages([]);
    setPageCount(0);
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
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

    const temp = newPages[pageIndex];
    newPages[pageIndex] = newPages[newIndex];
    newPages[newIndex] = temp;

    for (let i = 0; i < newPages.length; i++) {
      newPages[i].pageNumber = i + 1;
    }

    setPages(newPages);
  };

  const handleReorder = async () => {
    if (!file || pages.length === 0) return;

    const hasMoved = pages.some(page => page.pageNumber !== page.originalPosition);

    if (!hasMoved) {
      toast({
        title: 'No changes made',
        description: "The page order hasn't been changed",
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const pageOrder = pages.map(page => page.originalPosition).join(',');
      const newTaskId = await reorderPages(file, pageOrder);
      setTaskId(newTaskId);
    } catch (err) {
      setProcessing(false);
      setError((err as Error).message);
      toast({
        title: 'Reorder Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const hasChanges = () => {
    return pages.some(page => page.pageNumber !== page.originalPosition);
  };

  const handleDownload = () => {
    if (!downloadUrl && !taskId) {
      toast({
        title: 'Download unavailable',
        description: 'Please reorder pages before downloading.',
        variant: 'destructive',
      });
      return;
    }

    window.open(downloadUrl || (taskId ? getDownloadUrl(taskId) : ''), '_blank');
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
                      <h3 className="text-sm font-medium mb-2">Reorder pages visually</h3>
                      <p className="text-xs text-muted-foreground">
                        Use the up and down buttons to change page order.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pageCount} pages detected
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
                            <img
                              src={page.thumbnailDataUrl}
                              alt={`Page ${page.originalPosition} preview`}
                              className="h-20 w-14 rounded border border-border object-cover mr-3 bg-white"
                            />
                            <div>
                              <p className="font-medium">Page {page.originalPosition}</p>
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

                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
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
                onClick={handleDownload}
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
