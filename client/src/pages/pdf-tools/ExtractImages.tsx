import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Image, ScanSearch, FileOutput } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExtractedImage {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  sizeKb: number;
  format: string;
  thumbnail: string; // base64 data URL
}

export default function ExtractImages() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [extractionMethod, setExtractionMethod] = useState<string>("all");
  const [pageRange, setPageRange] = useState<string>("");
  const [imageFormat, setImageFormat] = useState<string>("original");
  const [minSize, setMinSize] = useState<number>(10); // min size in KB
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setExtractedImages([]);
    setProgress(0);
    setCompleted(false);
  };

  const resetForm = () => {
    setFile(null);
    setExtractedImages([]);
    setProgress(0);
    setCompleted(false);
  };

  const handleExtraction = () => {
    if (!file) return;
    
    if (extractionMethod === "range" && !pageRange.trim()) {
      toast({
        title: "Page range required",
        description: "Please specify the page range for extraction",
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
        
        // Generate placeholder extracted images
        const simulatedImages: ExtractedImage[] = [];
        const imageCount = Math.floor(Math.random() * 6) + 3; // 3-8 images
        
        for (let i = 1; i <= imageCount; i++) {
          const width = Math.floor(Math.random() * 500) + 300; // 300-800px
          const height = Math.floor(Math.random() * 400) + 200; // 200-600px
          const sizeKb = Math.floor(Math.random() * 300) + 20; // 20-320KB
          
          // Generate a random colored rectangle as a placeholder image
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Generate random color
            const r = Math.floor(Math.random() * 200);
            const g = Math.floor(Math.random() * 200);
            const b = Math.floor(Math.random() * 200);
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(0, 0, 100, 100);
            
            // Add some simple shapes
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(50, 50, 30, 0, 2 * Math.PI);
            ctx.fill();
            
            const thumbnail = canvas.toDataURL('image/png');
            
            simulatedImages.push({
              id: `img-${i}`,
              pageNumber: Math.ceil(Math.random() * 5),
              width,
              height,
              sizeKb,
              format: Math.random() > 0.5 ? 'JPEG' : 'PNG',
              thumbnail
            });
          }
        }
        
        setExtractedImages(simulatedImages);
        
        toast({
          title: 'Images Extracted Successfully',
          description: `Found ${simulatedImages.length} images in your PDF.`,
        });
      }
    }, 300);
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Page Selection</Label>
                        <RadioGroup 
                          value={extractionMethod} 
                          onValueChange={setExtractionMethod}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="all-pages" />
                            <Label htmlFor="all-pages" className="cursor-pointer">Extract from all pages</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="range" id="page-range" />
                            <Label htmlFor="page-range" className="cursor-pointer">Extract from specific pages</Label>
                          </div>
                        </RadioGroup>
                        
                        {extractionMethod === "range" && (
                          <div className="ml-6 mt-2">
                            <Input 
                              placeholder="e.g. 1-3, 5, 7-9"
                              value={pageRange}
                              onChange={(e) => setPageRange(e.target.value)}
                              disabled={processing}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter page numbers or ranges separated by commas
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Image Options</Label>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="image-format">Output Format</Label>
                            <Select 
                              value={imageFormat}
                              onValueChange={setImageFormat}
                              disabled={processing}
                            >
                              <SelectTrigger id="image-format">
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="original">Original Format</SelectItem>
                                <SelectItem value="png">Convert All to PNG</SelectItem>
                                <SelectItem value="jpg">Convert All to JPG</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="min-size">Minimum Size</Label>
                              <span className="text-sm">{minSize} KB</span>
                            </div>
                            <Input
                              id="min-size"
                              type="range"
                              min="0"
                              max="100"
                              value={minSize}
                              onChange={(e) => setMinSize(parseInt(e.target.value))}
                              disabled={processing}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              Ignore images smaller than the selected size
                            </p>
                          </div>
                        </div>
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
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download All (ZIP)
                  </Button>
                </div>
                
                {extractedImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {extractedImages.map((img) => (
                      <div key={img.id} className="border rounded-md overflow-hidden flex flex-col">
                        <div className="aspect-square relative bg-muted flex items-center justify-center">
                          <img 
                            src={img.thumbnail} 
                            alt={`Image ${img.id}`}
                            className="object-contain"
                          />
                        </div>
                        <div className="p-2 bg-muted text-xs space-y-1">
                          <p className="font-medium">Page {img.pageNumber}</p>
                          <p className="text-muted-foreground">{img.width}×{img.height}px</p>
                          <p className="text-muted-foreground">{img.format} • {img.sizeKb}KB</p>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-auto">
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