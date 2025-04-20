import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Settings2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageFormat, setImageFormat] = useState<string>('png');
  const [dpi, setDpi] = useState<string>("300");
  const [pageRange, setPageRange] = useState<string>("all");
  const [customRange, setCustomRange] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProgress(0);
    setCompleted(false);
  };

  const resetForm = () => {
    setFile(null);
    setProgress(0);
    setCompleted(false);
  };

  const handleConversion = () => {
    if (!file) return;
    
    if (pageRange === "custom" && !customRange) {
      toast({
        title: "Missing page range",
        description: "Please specify the page range",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    
    // Simulate conversion progress
    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal += 5;
      setProgress(progressVal);
      
      if (progressVal >= 100) {
        clearInterval(interval);
        setProcessing(false);
        setCompleted(true);
        toast({
          title: 'Conversion Completed',
          description: `Your PDF has been converted to ${imageFormat.toUpperCase()} images.`,
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
              PDF to Image Converter
            </CardTitle>
            <CardDescription>
              Convert PDF pages to high-quality images in various formats
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="image-format">Image Format</Label>
                    <Select 
                      value={imageFormat}
                      onValueChange={setImageFormat}
                      disabled={processing || completed}
                    >
                      <SelectTrigger id="image-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpg">JPG</SelectItem>
                        <SelectItem value="tiff">TIFF</SelectItem>
                        <SelectItem value="bmp">BMP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="image-dpi">Resolution (DPI)</Label>
                    <Select 
                      value={dpi}
                      onValueChange={setDpi}
                      disabled={processing || completed}
                    >
                      <SelectTrigger id="image-dpi">
                        <SelectValue placeholder="Select DPI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="72">72 DPI (Screen Quality)</SelectItem>
                        <SelectItem value="150">150 DPI (Medium Quality)</SelectItem>
                        <SelectItem value="300">300 DPI (Print Quality)</SelectItem>
                        <SelectItem value="600">600 DPI (High Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Page Range</Label>
                  <RadioGroup 
                    value={pageRange} 
                    onValueChange={setPageRange}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all-pages" />
                      <Label htmlFor="all-pages" className="cursor-pointer">All pages</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom-pages" />
                      <Label htmlFor="custom-pages" className="cursor-pointer">Custom range</Label>
                    </div>
                  </RadioGroup>
                  
                  {pageRange === "custom" && (
                    <div className="ml-6 mt-2">
                      <Input 
                        placeholder="e.g. 1-3, 5, 7-9"
                        value={customRange}
                        onChange={(e) => setCustomRange(e.target.value)}
                        disabled={processing || completed}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter page numbers or ranges separated by commas
                      </p>
                    </div>
                  )}
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
                onClick={handleConversion}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Settings2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Convert to Images
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
                Download Images (ZIP)
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}