import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Stamp, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addWatermark, checkTaskStatus, getDownloadUrl, loadPdfDocument, PdfProgress, usePdfProgress } from '@/lib/pdfService';

export default function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkType, setWatermarkType] = useState<string>("text");
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [opacity, setOpacity] = useState<number>(30);
  const [position, setPosition] = useState<string>("center");
  const [rotation, setRotation] = useState<string>("diagonal");
  const [fontSize, setFontSize] = useState<string>("36");
  const [fontColor, setFontColor] = useState<string>("#FF0000");
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [watermarkPreviewUrl, setWatermarkPreviewUrl] = useState<string | null>(null);
  const [previewPageSize, setPreviewPageSize] = useState<{ width: number; height: number } | null>(null);
  const [watermarkDrawSize, setWatermarkDrawSize] = useState<{ width: number; height: number } | null>(null);
  const { toast } = useToast();

  const rotationValue = useMemo(() => {
    if (rotation === 'none') return 0;
    if (rotation === 'horizontal') return 90;
    return 45;
  }, [rotation]);

  const watermarkOpacity = opacity / 100;

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  useEffect(() => {
    let isActive = true;

    const renderWatermarkPreview = async () => {
      if (!file) {
        setWatermarkPreviewUrl(null);
        setWatermarkDrawSize(null);
        return;
      }

      const opacityValue = Math.max(0, Math.min(1, watermarkOpacity));

      try {
        if (watermarkType === 'image') {
          if (!imagePreviewUrl) {
            setWatermarkPreviewUrl(null);
            return;
          }

          const image = new Image();
          image.src = imagePreviewUrl;
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Failed to load watermark image preview'));
          });

          const pageWidth = previewPageSize?.width ?? 595;
          const drawWidth = Math.max(24, pageWidth * Math.max(0.05, Math.min(0.25, 0.25)));
          const scale = drawWidth / image.width;
          const rawWidth = Math.max(24, image.width * scale);
          const rawHeight = Math.max(24, image.height * scale);

          const rotatedCanvas = document.createElement('canvas');
          const rotatedContext = rotatedCanvas.getContext('2d');
          if (!rotatedContext) return;

          const radians = (rotationValue * Math.PI) / 180;
          const sin = Math.abs(Math.sin(radians));
          const cos = Math.abs(Math.cos(radians));
          rotatedCanvas.width = Math.ceil(rawWidth * cos + rawHeight * sin) + 4;
          rotatedCanvas.height = Math.ceil(rawWidth * sin + rawHeight * cos) + 4;

          rotatedContext.clearRect(0, 0, rotatedCanvas.width, rotatedCanvas.height);
          rotatedContext.globalAlpha = opacityValue;
          rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
          rotatedContext.rotate(radians);
          rotatedContext.drawImage(image, -rawWidth / 2, -rawHeight / 2, rawWidth, rawHeight);

          if (!isActive) return;
          setWatermarkPreviewUrl(rotatedCanvas.toDataURL('image/png'));
          setWatermarkDrawSize({ width: rawWidth, height: rawHeight });
          return;
        }

        const text = watermarkText || '';
        const fontPx = Math.max(8, parseInt(fontSize, 10));
        const scratch = document.createElement('canvas');
        const scratchContext = scratch.getContext('2d');
        if (!scratchContext) return;

        scratchContext.font = `bold ${fontPx}px Arial, sans-serif`;
        const measuredWidth = Math.max(1, Math.ceil(scratchContext.measureText(text).width));
        const textCanvas = document.createElement('canvas');
        const textContext = textCanvas.getContext('2d');
        if (!textContext) return;

        const padding = 20;
        textCanvas.width = measuredWidth + padding * 2;
        textCanvas.height = Math.ceil(fontPx * 1.6) + padding * 2;
        textContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
        textContext.font = `bold ${fontPx}px Arial, sans-serif`;
        textContext.textBaseline = 'middle';
        textContext.fillStyle = fontColor;
        textContext.globalAlpha = opacityValue;
        textContext.fillText(text, padding, textCanvas.height / 2);

        const rotatedCanvas = document.createElement('canvas');
        const rotatedContext = rotatedCanvas.getContext('2d');
        if (!rotatedContext) return;

        const radians = (rotationValue * Math.PI) / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        rotatedCanvas.width = Math.ceil(textCanvas.width * cos + textCanvas.height * sin) + 4;
        rotatedCanvas.height = Math.ceil(textCanvas.width * sin + textCanvas.height * cos) + 4;

        rotatedContext.clearRect(0, 0, rotatedCanvas.width, rotatedCanvas.height);
        rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
        rotatedContext.rotate(radians);
        rotatedContext.drawImage(textCanvas, -textCanvas.width / 2, -textCanvas.height / 2);

        if (!isActive) return;
        setWatermarkPreviewUrl(rotatedCanvas.toDataURL('image/png'));
        setWatermarkDrawSize({ width: textCanvas.width, height: textCanvas.height });
      } catch {
        if (!isActive) return;
        setWatermarkPreviewUrl(null);
        setWatermarkDrawSize(null);
      }
    };

    renderWatermarkPreview();

    return () => {
      isActive = false;
    };
  }, [file, watermarkType, watermarkText, imagePreviewUrl, opacity, rotation, fontSize, fontColor, position, rotationValue, watermarkOpacity, previewPageSize]);

  useEffect(() => {
    let isActive = true;

    const renderPreview = async () => {
      if (!file) {
        setPreviewUrl(null);
        setPreviewPageSize(null);
        setPreviewError(null);
        setPreviewLoading(false);
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const buffer = await file.arrayBuffer();
        const pdfDocument = await loadPdfDocument(buffer);
        const page = await pdfDocument.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.6, 900 / baseViewport.width);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Unable to render preview canvas');
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;

        if (!isActive) return;
        setPreviewUrl(canvas.toDataURL('image/png'));
        setPreviewPageSize({ width: baseViewport.width, height: baseViewport.height });
      } catch (previewErr) {
        if (!isActive) return;
        setPreviewUrl(null);
        setPreviewPageSize(null);
        setPreviewError(previewErr instanceof Error ? previewErr.message : 'Failed to render preview');
      } finally {
        if (isActive) setPreviewLoading(false);
      }
    };

    renderPreview();

    return () => {
      isActive = false;
    };
  }, [file]);

  usePdfProgress(taskId, (progressData: PdfProgress) => {
    setProgress(progressData.progress);

    if (progressData.status === 'processing') {
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
            if (completedTaskId) {
              setDownloadUrl(getDownloadUrl(completedTaskId));
            }
          });
      }

      toast({
        title: 'Watermark Added Successfully',
        description: 'Your watermarked PDF is ready to download.',
      });
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      setError(progressData.error || 'An error occurred while adding the watermark');
      toast({
        title: 'Watermark Failed',
        description: progressData.error || 'An error occurred while adding the watermark',
        variant: 'destructive',
      });
    }
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setImageFile(selectedFile);
    }
  };

  const resetForm = () => {
    setFile(null);
    setImageFile(null);
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
  };

  const handleWatermark = async () => {
    if (!file) return;
    
    if (watermarkType === "text" && !watermarkText.trim()) {
      toast({
        title: "Missing watermark text",
        description: "Please enter text for the watermark",
        variant: "destructive"
      });
      return;
    }
    
    if (watermarkType === "image" && !imageFile) {
      toast({
        title: "Missing watermark image",
        description: "Please upload an image for the watermark",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const newTaskId = await addWatermark(file, {
        watermarkType: watermarkType as 'text' | 'image',
        watermarkText,
        watermarkImage: imageFile,
        position: position as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile',
        opacity: watermarkOpacity,
        rotation: rotationValue,
        fontSize: parseInt(fontSize, 10),
        fontColor,
        imageScale: 0.25,
      });
      setTaskId(newTaskId);
    } catch (err) {
      setProcessing(false);
      const message = (err as Error).message || 'Failed to add watermark';
      setError(message);
      toast({
        title: 'Watermark Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleOpacityChange = (value: number[]) => {
    setOpacity(value[0]);
  };

  const handleDownload = () => {
    if (!completed) {
      toast({
        title: 'Download unavailable',
        description: 'Please apply the watermark before downloading.',
        variant: 'destructive',
      });
      return;
    }

    const url = downloadUrl || (taskId ? getDownloadUrl(taskId) : '');
    if (!url) {
      toast({
        title: 'Download unavailable',
        description: 'The watermarked PDF is not ready yet.',
        variant: 'destructive',
      });
      return;
    }

    window.open(url, '_blank');
  };

  const previewOverlayClassName = useMemo(() => {
    if (position === 'top-left') return 'left-[6%] top-[6%]';
    if (position === 'top-right') return 'right-[6%] top-[6%]';
    if (position === 'bottom-left') return 'left-[6%] bottom-[6%]';
    if (position === 'bottom-right') return 'right-[6%] bottom-[6%]';
    return 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';
  }, [position]);

  const previewWatermarkWidth = useMemo(() => {
    const pageWidth = previewPageSize?.width ?? 595;
    const drawWidth = watermarkDrawSize?.width ?? (watermarkType === 'image' ? pageWidth * 0.25 : 200);
    return `${Math.max(5, Math.min(95, (drawWidth / pageWidth) * 100))}%`;
  }, [previewPageSize, watermarkDrawSize, watermarkType]);

  const previewTileRepeat = position === 'tile';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Add Watermark to PDF
            </CardTitle>
            <CardDescription>
              Apply text or image watermarks to your PDF documents
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <PdfFileUpload 
              onFileSelect={handleFileSelect}
              currentFile={file}
              onFileRemove={resetForm}
              disabled={processing}
            />
            
            {file && (
              <div className="space-y-6">
                <div className="rounded-xl border bg-muted/20 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-medium">Live Preview</p>
                      <p className="text-xs text-muted-foreground">
                        This is the first page of the PDF with your current watermark settings applied.
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Confirm with <span className="font-medium text-foreground">Add Watermark</span> when it looks right.
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-lg border bg-background">
                    {previewLoading ? (
                      <div className="flex min-h-[420px] items-center justify-center text-sm text-muted-foreground">
                        Rendering preview...
                      </div>
                    ) : previewError ? (
                      <div className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm text-destructive">
                        {previewError}
                      </div>
                    ) : previewUrl ? (
                      <div className="relative mx-auto w-full max-w-[820px]">
                        <img
                          src={previewUrl}
                          alt="PDF preview"
                          className="block h-auto w-full"
                        />

                        {previewTileRepeat ? (
                          <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            {watermarkPreviewUrl ? Array.from({ length: 12 }).map((_, index) => (
                              <img
                                key={index}
                                src={watermarkPreviewUrl}
                                alt="Watermark preview repeat"
                                className="absolute select-none"
                                style={{
                                  width: previewWatermarkWidth,
                                  left: `${(index % 4) * 25 + 8}%`,
                                  top: `${Math.floor(index / 4) * 28 + 8}%`,
                                  opacity: 1,
                                }}
                              />
                            )) : null}
                          </div>
                        ) : (
                          <div className={`pointer-events-none absolute ${previewOverlayClassName}`}>
                            {watermarkPreviewUrl ? (
                              <img
                                src={watermarkPreviewUrl}
                                alt="Watermark preview"
                                className="select-none shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                                style={{
                                  width: previewWatermarkWidth,
                                  opacity: 1,
                                }}
                              />
                            ) : (
                              <div className="rounded-md bg-muted/80 px-3 py-2 text-xs text-muted-foreground">
                                Upload a watermark image to preview it here.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        Upload a PDF to see a live watermark preview.
                      </div>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="text" onValueChange={setWatermarkType} value={watermarkType}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="text">Text Watermark</TabsTrigger>
                    <TabsTrigger value="image">Image Watermark</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="watermark-text">Watermark Text</Label>
                      <Input
                        id="watermark-text"
                        placeholder="e.g. CONFIDENTIAL, DRAFT, etc."
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        disabled={processing || completed}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="font-size">Font Size</Label>
                        <Select 
                          value={fontSize}
                          onValueChange={setFontSize}
                          disabled={processing || completed}
                        >
                          <SelectTrigger id="font-size">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18">Small (18pt)</SelectItem>
                            <SelectItem value="36">Medium (36pt)</SelectItem>
                            <SelectItem value="72">Large (72pt)</SelectItem>
                            <SelectItem value="144">Extra Large (144pt)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="font-color">Font Color</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-md border border-input" 
                            style={{ backgroundColor: fontColor }}
                          />
                          <Input
                            id="font-color"
                            type="color"
                            value={fontColor}
                            onChange={(e) => setFontColor(e.target.value)}
                            className="w-full"
                            disabled={processing || completed}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="image" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="watermark-image">Watermark Image</Label>
                      {!imageFile ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                          <Input
                            type="file"
                            accept="image/*"
                            id="watermark-image"
                            className="hidden"
                            onChange={handleImageSelect}
                            disabled={processing || completed}
                          />
                          <Label
                            htmlFor="watermark-image"
                            className="block cursor-pointer text-center"
                          >
                            <FileImage className="h-8 w-8 mb-4 mx-auto text-muted-foreground" />
                            <span className="font-medium text-primary block mb-1">
                              Click to upload an image
                            </span>
                            <span className="text-sm text-muted-foreground">
                              or drag and drop here
                            </span>
                            <span className="block mt-2 text-xs text-muted-foreground">
                              PNG, JPG, JPEG, WebP or SVG (max 5MB)
                            </span>
                          </Label>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
                          <div className="flex items-center">
                            <FileImage className="h-8 w-8 mr-3 text-primary" />
                            <div>
                              <p className="font-medium truncate max-w-[180px] sm:max-w-xs">
                                {imageFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageFile(null)}
                            disabled={processing || completed}
                          >
                            Change
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Opacity</Label>
                      <span>{opacity}%</span>
                    </div>
                    <Slider
                      defaultValue={[30]}
                      max={100}
                      step={5}
                      value={[opacity]}
                      onValueChange={handleOpacityChange}
                      disabled={processing || completed}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select 
                        value={position}
                        onValueChange={setPosition}
                        disabled={processing || completed}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="tile">Tile (Repeat)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rotation</Label>
                      <Select 
                        value={rotation}
                        onValueChange={setRotation}
                        disabled={processing || completed}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rotation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (0°)</SelectItem>
                          <SelectItem value="diagonal">Diagonal (45°)</SelectItem>
                          <SelectItem value="horizontal">Horizontal (90°)</SelectItem>
                          <SelectItem value="custom">Custom Angle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
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
            {file && !completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={handleWatermark}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Stamp className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Stamp className="mr-2 h-4 w-4" />
                    Add Watermark
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
                Download Watermarked PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}