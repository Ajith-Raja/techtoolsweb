import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, RotateCw, RotateCcw, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { checkTaskStatus, getDownloadUrl, loadPdfDocument, PdfProgress, rotatePages, usePdfProgress } from '@/lib/pdfService';
import * as pdfjsLib from 'pdfjs-dist';

interface PagePreview {
  pageNumber: number;
  thumbnailDataUrl: string;
  originalRotation: number;
}

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [rotationDirection, setRotationDirection] = useState<'clockwise' | 'counterclockwise'>('clockwise');
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
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
              return;
            }
            setDownloadUrl(getDownloadUrl(completedTaskId));
          })
          .catch(() => {
            setDownloadUrl(getDownloadUrl(completedTaskId));
          });
      }

      toast({
        title: 'PDF Rotation Completed',
        description: 'Your rotated PDF is ready to download.',
      });
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      toast({
        title: 'Rotation Failed',
        description: progressData.error || 'An error occurred while rotating pages.',
        variant: 'destructive',
      });
    }
  });

  const renderPageThumbnail = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number
  ): Promise<{ thumbnailDataUrl: string; originalRotation: number }> => {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const targetWidth = 220;
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to create canvas context for preview');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    return {
      thumbnailDataUrl: canvas.toDataURL('image/jpeg', 0.9),
      originalRotation: ((page.rotate || 0) % 360 + 360) % 360,
    };
  };

  const handleFileSelect = async (selectedFile: File) => {
    const loadId = Date.now();
    activeLoadIdRef.current = loadId;

    setFile(selectedFile);
    setPages([]);
    setPageRotations({});
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setLoading(true);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const pdfDocument = await loadPdfDocument(fileBuffer);

      if (activeLoadIdRef.current !== loadId) {
        return;
      }

      const previewPages: PagePreview[] = [];
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        const { thumbnailDataUrl, originalRotation } = await renderPageThumbnail(pdfDocument, pageNumber);

        if (activeLoadIdRef.current !== loadId) {
          return;
        }

        previewPages.push({
          pageNumber,
          thumbnailDataUrl,
          originalRotation,
        });
      }

      setPages(previewPages);
    } catch (error) {
      setFile(null);
      setPages([]);
      toast({
        title: 'Failed to load PDF',
        description: error instanceof Error ? error.message : 'Could not render PDF preview pages.',
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
    setPageRotations({});
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setLoading(false);
  };

  const rotatePage = (pageNumber: number) => {
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);

    const rotateStep = rotationDirection === 'clockwise' ? -90 : 90;

    setPageRotations((prev) => ({
      ...prev,
      [pageNumber]: (((prev[pageNumber] || 0) + rotateStep) % 360 + 360) % 360,
    }));
  };

  const hasRotationChanges = () => {
    return Object.values(pageRotations).some((angle) => angle !== 0);
  };

  const handleRotateAndDownload = async () => {
    if (!file) return;

    const originalRotationsMap = pages.reduce<Record<number, number>>((acc, page) => {
      acc[page.pageNumber] = page.originalRotation;
      return acc;
    }, {});

    const changedPageRotations = Object.entries(pageRotations).reduce<Record<number, number>>((acc, [page, angle]) => {
      if (angle !== 0) {
        const pageNumber = Number(page);
        const originalRotation = originalRotationsMap[pageNumber] || 0;
        acc[pageNumber] = (originalRotation + angle) % 360;
      }
      return acc;
    }, {});

    if (Object.keys(changedPageRotations).length === 0) {
      toast({
        title: 'No pages rotated',
        description: 'Click the rotate icon on one or more pages before downloading.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setTaskId(null);
    setDownloadUrl(null);

    try {
      const newTaskId = await rotatePages(file, 90, undefined, changedPageRotations);
      setTaskId(newTaskId);
    } catch (error) {
      setProcessing(false);
      toast({
        title: 'Rotation Failed',
        description: error instanceof Error ? error.message : 'Failed to rotate PDF pages.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!downloadUrl && !taskId) {
      toast({
        title: 'Download unavailable',
        description: 'Rotate pages first, then download the updated file.',
        variant: 'destructive',
      });
      return;
    }

    window.open(downloadUrl || (taskId ? getDownloadUrl(taskId) : ''), '_blank');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Rotate PDF Pages
            </CardTitle>
            <CardDescription>
              Preview every page, rotate each page with its own button, then download the rotated PDF
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
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-sm font-medium mb-2">Rotation direction</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={rotationDirection === 'clockwise' ? 'default' : 'outline'}
                      onClick={() => setRotationDirection('clockwise')}
                      disabled={processing}
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Clockwise
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={rotationDirection === 'counterclockwise' ? 'default' : 'outline'}
                      onClick={() => setRotationDirection('counterclockwise')}
                      disabled={processing}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Counterclockwise
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <File className="h-8 w-8 mb-4 animate-pulse text-primary" />
                    <p className="text-center text-muted-foreground">Loading PDF pages...</p>
                  </div>
                ) : pages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pages.map((page) => {
                      const deltaRotation = pageRotations[page.pageNumber] || 0;
                      const finalPreviewRotation = (page.originalRotation + deltaRotation) % 360;
                      return (
                        <div key={page.pageNumber} className="rounded-lg border bg-card p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Page {page.pageNumber}</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => rotatePage(page.pageNumber)}
                              disabled={processing}
                            >
                              {rotationDirection === 'clockwise' ? (
                                <RotateCw className="h-4 w-4 mr-1" />
                              ) : (
                                <RotateCcw className="h-4 w-4 mr-1" />
                              )}
                              Rotate
                            </Button>
                          </div>

                          <div className="h-[320px] flex items-center justify-center rounded-md border bg-muted/25 overflow-hidden p-2">
                            <img
                              src={page.thumbnailDataUrl}
                              alt={`Preview page ${page.pageNumber}`}
                              className="max-h-full max-w-full object-contain transition-transform duration-200"
                              style={{ transform: `rotate(${deltaRotation}deg)` }}
                            />
                          </div>

                          <p className="text-xs text-muted-foreground text-center">
                            Applied: {deltaRotation}deg | Final: {finalPreviewRotation}deg
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No pages available for preview.</p>
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
            {file && !completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={handleRotateAndDownload}
                disabled={processing || loading || !hasRotationChanges()}
              >
                {processing ? (
                  <>
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                    Rotating...
                  </>
                ) : (
                  <>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Rotate & Prepare Download
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
                Download Rotated PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}