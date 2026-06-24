import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Image, ScanSearch, FileOutput } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractImages, getDownloadUrl, PdfProgress, usePdfProgress } from '@/lib/pdfService';

interface ExtractedImage {
  id: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  thumbnail: string; // base64 data URL
}

export default function ExtractImages() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [imageType, setImageType] = useState<'png' | 'jpeg'>('png');
  const [minSize, setMinSize] = useState<number>(50); // min size in pixels
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [archiveBlob, setArchiveBlob] = useState<Blob | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { toast } = useToast();

  const getMimeTypeFromFileName = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.png')) {
      return 'image/png';
    }
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    return 'application/octet-stream';
  };

  const socket = usePdfProgress(taskId, async (progressData: PdfProgress) => {
    setProgress(progressData.progress);
    setDebugInfo(JSON.stringify({
      status: progressData.status,
      progress: progressData.progress,
      task_id: progressData.task_id,
      error: progressData.error
    }, null, 2));

    if (progressData.status === 'processing') {
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      toast({
        title: 'Extraction Failed',
        description: progressData.error || 'An error occurred during image extraction.',
        variant: 'destructive',
      });
      return;
    }

    if (progressData.status === 'success' || progressData.status === 'completed') {
      try {
        const activeTaskId = progressData.task_id || taskId;
        if (!activeTaskId) {
          throw new Error('Missing extraction task details');
        }

        const response = await fetch(getDownloadUrl(activeTaskId));
        if (!response.ok) {
          throw new Error(`Failed to download extracted images: ${response.statusText}`);
        }

        // Handle ZIP file extraction using JSZip
        const buffer = await response.arrayBuffer();
        setArchiveBlob(new Blob([buffer], { type: 'application/zip' }));
        const images: ExtractedImage[] = [];

        try {
          const zip = new JSZip();
          const zipFile = await zip.loadAsync(buffer);
          let imageId = 0;
          
          setDebugInfo((prev) => prev + `\n\nZIP entries: ${Object.keys(zipFile.files).join(', ')}`);

          for (const [fileName, file] of Object.entries(zipFile.files)) {
            if (!file.dir && /\.(jpg|jpeg|png)$/i.test(fileName)) {
              const rawBlob = await file.async('blob');
              const imageBlob = rawBlob.type
                ? rawBlob
                : new Blob([rawBlob], { type: getMimeTypeFromFileName(fileName) });
              const reader = new FileReader();
              const thumbnail = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(imageBlob);
              });

              images.push({
                id: `img-${imageId++}`,
                fileName,
                mimeType: imageBlob.type || 'image/jpeg',
                blob: imageBlob,
                thumbnail,
              });
            }
          }

          if (images.length === 0) {
            const zipEntries = Object.keys(zipFile.files).map(f => `${f} (dir: ${zipFile.files[f].dir})`).join(', ');
            toast({
              title: 'No images found',
              description: `No valid images in ZIP. Entries: ${zipEntries || 'none'}`,
            });
          } else {
            toast({
              title: 'Images Extracted Successfully',
              description: `Found ${images.length} image(s) in your PDF.`,
            });
          }
        } catch (zipError) {
          console.error('ZIP parsing failed:', zipError);
          setDebugInfo((prev) => prev + `\n\nZIP Error: ${(zipError as Error).message}`);
          toast({
            title: 'Extraction Failed',
            description: `Failed to parse extracted images: ${(zipError as Error).message}`,
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }

        setExtractedImages(images);
        setProcessing(false);
        setCompleted(true);
        setProgress(100);
      } catch (error) {
        setProcessing(false);
        setDebugInfo((prev) => prev + `\n\nError: ${(error as Error).message}`);
        toast({
          title: 'Extraction Failed',
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    }
  });

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [socket]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setExtractedImages([]);
    setArchiveBlob(null);
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
  };

  const resetForm = () => {
    if (socket) {
      socket.close(1000, 'Resetting form');
    }
    setFile(null);
    setExtractedImages([]);
    setArchiveBlob(null);
    setProgress(0);
    setCompleted(false);
    setProcessing(false);
    setTaskId(null);
  };

  const handleExtraction = async () => {
    if (!file) return;
    
    setProcessing(true);
    setProgress(0);
    setCompleted(false);
    setExtractedImages([]);
    setArchiveBlob(null);
    setDebugInfo(`Starting extraction with min_size=${minSize}px`);

    try {
      const newTaskId = await extractImages(file, minSize, imageType);
      setTaskId(newTaskId);
      setDebugInfo((prev) => prev + `\nTask ID: ${newTaskId}`);
    } catch (error) {
      setProcessing(false);
      setDebugInfo((prev) => prev + `\nExtraction error: ${(error as Error).message}`);
      toast({
        title: 'Extraction Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleDownloadImage = (img: ExtractedImage) => {
    downloadBlob(img.blob, img.fileName);
  };

  const handleDownloadAll = async () => {
    if (archiveBlob) {
      const baseName = (file?.name || 'extracted-images').replace(/\.pdf$/i, '');
      downloadBlob(archiveBlob, `${baseName}-${imageType}-images.zip`);
      toast({
        title: 'Download started',
        description: 'ZIP download started successfully.',
      });
      return;
    }

    if (taskId) {
      window.open(getDownloadUrl(taskId), '_blank');
      return;
    }

    if (extractedImages.length === 0) {
      toast({
        title: 'Nothing to download',
        description: 'No extracted images are available yet.',
        variant: 'destructive'
      });
      return;
    }

    for (const img of extractedImages) {
      await new Promise(resolve => setTimeout(resolve, 200));
      handleDownloadImage(img);
    }

    toast({
      title: 'Downloads started',
      description: `Started ${extractedImages.length} image download(s).`,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Extract Images from PDF
            </CardTitle>
            <CardDescription>
              Extract and save all images embedded within your PDF document
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!completed ? (
              <>
                <PdfFileUpload 
                  onFileSelect={handleFileSelect}
                  currentFile={file}
                  onFileRemove={resetForm}
                  disabled={processing}
                />
                
                {file && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Extraction Options</Label>

                      <div className="space-y-2">
                        <Label htmlFor="image-type">Output Image Type</Label>
                        <Select
                          value={imageType}
                          onValueChange={(value) => setImageType(value as 'png' | 'jpeg')}
                          disabled={processing}
                        >
                          <SelectTrigger id="image-type">
                            <SelectValue placeholder="Select image type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG</SelectItem>
                            <SelectItem value="jpeg">JPEG</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Extract all PDF images and convert them to the selected format.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="min-size">Minimum Image Size (pixels)</Label>
                          <span className="text-sm">{minSize}px</span>
                        </div>
                        <Input
                          id="min-size"
                          type="range"
                          min="10"
                          max="500"
                          value={minSize}
                          onChange={(e) => setMinSize(parseInt(e.target.value))}
                          disabled={processing}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Filters images by smallest dimension. Lower values = more images.
                        </p>
                      </div>
                    </div>
                    
                    {processing && (
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
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Extracted Images ({extractedImages.length})</h3>
                  <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download All
                  </Button>
                </div>
                
                {extractedImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {extractedImages.map((img) => (
                      <div key={img.id} className="border rounded-md overflow-hidden flex flex-col bg-muted">
                        <div className="aspect-square relative bg-background flex items-center justify-center overflow-hidden">
                          <img 
                            src={img.thumbnail} 
                            alt={img.fileName}
                            className="object-contain max-w-full max-h-full"
                          />
                        </div>
                        <div className="p-2 space-y-1 flex-1 flex flex-col">
                          <p className="font-medium text-xs truncate">{img.fileName}</p>
                          <p className="text-xs text-muted-foreground flex-1">{img.mimeType}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-auto rounded-none"
                          onClick={() => handleDownloadImage(img)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-md">
                    <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No images found in the document</p>
                  </div>
                )}
              </div>
            )}
            
            {debugInfo && (
              <div className="mt-4 p-3 bg-muted rounded-md border">
                <p className="text-xs font-semibold mb-2">Debug Info:</p>
                <pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground">{debugInfo}</pre>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-end">
            {file && !completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={handleExtraction}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <ScanSearch className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Extract Images
                  </>
                )}
              </Button>
            )}
            
            {completed && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={resetForm}
              >
                <FileOutput className="mr-2 h-4 w-4" />
                Extract From Another PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}