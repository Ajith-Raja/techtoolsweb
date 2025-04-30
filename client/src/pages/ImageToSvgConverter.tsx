import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Check, Download, FileImage, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ImageToSvgConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [showFullPreview, setShowFullPreview] = useState<boolean>(false);
  
  // Conversion settings
  const [threshold, setThreshold] = useState<number>(128);
  const [simplify, setSimplify] = useState<number>(2.0);
  const [smoothing, setSmoothing] = useState<number>(5);
  const [edgeDetection, setEdgeDetection] = useState<boolean>(false);
  const [fillColor, setFillColor] = useState<string>("black");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is an image
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select a valid image file');
        setFile(null);
        setPreview(null);
        return;
      }
      
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size is too large. Please select an image under 5MB');
        setFile(null);
        setPreview(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
      setSvgResult(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setSvgResult(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const convertToSvg = async () => {
    if (!file) return;
    
    setIsConverting(true);
    setError(null);
    setSuccess(false);
    
    const formData = new FormData();
    formData.append('image_file', file);
    formData.append('threshold', threshold.toString());
    formData.append('simplify', simplify.toString());
    formData.append('smoothing', smoothing.toString());
    formData.append('edge_detection', edgeDetection.toString());
    formData.append('fill_color', fillColor);
    
    try {
      // Use the Replit URL if available, otherwise fallback to localhost for development
      const baseUrl = window.location.hostname.includes('replit') 
        ? `${window.location.protocol}//${window.location.hostname}`
        : 'http://localhost:8002';
        
      const response = await fetch(`${baseUrl}/convert`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to convert image to SVG');
      }
      
      const data = await response.json();
      
      // Use the svg_content directly from the response
      const svgContent = data.svg_content;
      
      setSvgResult(svgContent);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during conversion');
    } finally {
      setIsConverting(false);
    }
  };
  
  const downloadSvg = () => {
    if (!svgResult) return;
    
    const blob = new Blob([svgResult], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = file?.name.replace(/\.[^/.]+$/, '.svg') || 'converted.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleColorChange = (value: string) => {
    if (value.startsWith('#')) {
      setFillColor(value);
    } else {
      setFillColor(value);
    }
  };
  
  // Display SVG in an iframe to avoid XSS risks
  const getSvgPreview = () => {
    if (!svgResult) return null;
    
    const svg = svgResult;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    return (
      <iframe 
        src={url} 
        className="w-full h-full border-0 bg-transparent" 
        title="SVG Preview"
        onLoad={() => URL.revokeObjectURL(url)}
      />
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Image to SVG Converter</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>
              Select an image to convert to SVG
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                />
                
                {!preview ? (
                  <div className="py-4">
                    <FileImage className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Click to select or drag and drop your image here
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported formats: PNG, JPG, JPEG, GIF (Max 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-56 mx-auto"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Your image has been successfully converted to SVG!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Conversion Settings</CardTitle>
            <CardDescription>
              Adjust parameters to optimize the SVG output
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="threshold">Threshold ({threshold})</Label>
                </div>
                <Slider
                  id="threshold"
                  min={0}
                  max={255}
                  step={1}
                  value={[threshold]}
                  onValueChange={(values) => setThreshold(values[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Determines which pixels are considered black or white (0-255)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="simplify">Simplification ({simplify.toFixed(1)})</Label>
                </div>
                <Slider
                  id="simplify"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[simplify]}
                  onValueChange={(values) => setSimplify(values[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Controls how much to simplify the paths (0-10)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="smoothing">Smoothing ({smoothing})</Label>
                </div>
                <Slider
                  id="smoothing"
                  min={0}
                  max={10}
                  step={1}
                  value={[smoothing]}
                  onValueChange={(values) => setSmoothing(values[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Applies smoothing to the image before tracing (0-10)
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edge-detection"
                  checked={edgeDetection}
                  onCheckedChange={setEdgeDetection}
                />
                <Label htmlFor="edge-detection">Apply edge detection</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fill-color">Fill Color</Label>
                <div className="flex space-x-2">
                  <Select
                    value={fillColor}
                    onValueChange={handleColorChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="#3b82f6">Blue</SelectItem>
                      <SelectItem value="#ef4444">Red</SelectItem>
                      <SelectItem value="#10b981">Green</SelectItem>
                      <SelectItem value="#6366f1">Purple</SelectItem>
                      <SelectItem value="#f59e0b">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                  <div
                    className="w-10 h-10 rounded border"
                    style={{ backgroundColor: fillColor }}
                  />
                </div>
              </div>
              
              <Button 
                className="w-full" 
                disabled={!file || isConverting}
                onClick={convertToSvg}
              >
                {isConverting ? (
                  <>Converting...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Convert to SVG
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {svgResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              Your converted SVG image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">SVG Preview</TabsTrigger>
                <TabsTrigger value="code">SVG Code</TabsTrigger>
                <TabsTrigger value="compare">Compare</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview">
                <div className="bg-[url('/grid.svg')] rounded-lg flex items-center justify-center p-4">
                  <div className="relative h-64 w-full flex items-center justify-center">
                    {getSvgPreview()}
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={downloadSvg}>
                    <Download className="mr-2 h-4 w-4" />
                    Download SVG
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="code">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-xs">
                    {svgResult}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(svgResult);
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={downloadSvg}>
                    <Download className="mr-2 h-4 w-4" />
                    Download SVG
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="compare">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-center font-medium mb-2">Original Image</p>
                    <div className="bg-muted rounded-lg flex items-center justify-center p-4 h-64">
                      {preview && (
                        <img
                          src={preview}
                          alt="Original"
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-center font-medium mb-2">SVG Result</p>
                    <div className="bg-[url('/grid.svg')] rounded-lg flex items-center justify-center p-4 h-64">
                      {getSvgPreview()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={downloadSvg}>
                    <Download className="mr-2 h-4 w-4" />
                    Download SVG
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {showOriginal ? "Original Image" : "SVG Preview"}
            </DialogTitle>
            <DialogDescription>
              Full size preview
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 min-h-[300px]">
            {showOriginal && preview ? (
              <img
                src={preview}
                alt="Original"
                className="max-h-[500px] max-w-full object-contain"
              />
            ) : (
              svgResult && (
                <div className="h-[500px] w-full bg-[url('/grid.svg')]">
                  {getSvgPreview()}
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}