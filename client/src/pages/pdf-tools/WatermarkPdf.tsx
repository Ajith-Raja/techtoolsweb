import React, { useState } from 'react';
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
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProgress(0);
    setCompleted(false);
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
    setProgress(0);
    setCompleted(false);
  };

  const handleWatermark = () => {
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
          title: 'Watermark Added Successfully',
          description: 'Your watermarked PDF is ready to download.',
        });
      }
    }, 300);
  };

  const handleOpacityChange = (value: number[]) => {
    setOpacity(value[0]);
  };

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