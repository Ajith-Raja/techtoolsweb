import { useState, useRef, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ImageIcon, 
  Upload, 
  Download, 
  Minus, 
  FilePieChart, 
  Settings, 
  RefreshCw, 
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImageCompressor() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for image and compression settings
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<Blob | null>(null);
  const [quality, setQuality] = useState(80);
  const [enableResize, setEnableResize] = useState(false);
  const [maxWidth, setMaxWidth] = useState(1200);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Handle file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an accepted image type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or WebP images only",
        variant: "destructive"
      });
      return;
    }
    
    // Store original file and create preview
    setOriginalImage(file);
    setOriginalSize(file.size);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalPreview(event.target?.result as string);
      // Reset compressed results when new image is uploaded
      setCompressedPreview(null);
      setCompressedImage(null);
      setCompressedSize(0);
    };
    reader.readAsDataURL(file);
  };
  
  // Compress the image
  const compressImage = async () => {
    if (!originalImage || !originalPreview) return;
    
    setIsCompressing(true);
    
    try {
      // Create a new image to load the file data
      const img = new Image();
      
      // Create a promise to wait for image loading
      const imageLoadPromise = new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = originalPreview;
      });
      
      await imageLoadPromise;
      
      // Calculate new dimensions if resize is enabled
      let width = img.width;
      let height = img.height;
      
      if (enableResize && width > maxWidth) {
        const aspectRatio = img.height / img.width;
        width = maxWidth;
        height = Math.round(maxWidth * aspectRatio);
      }
      
      // Create a canvas to draw and compress the image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw the image on the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get the compressed image as a blob
      const mimeType = originalImage.type;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error("Could not create blob");
          }
          
          // Store compressed image and preview
          setCompressedImage(blob);
          setCompressedSize(blob.size);
          
          const reader = new FileReader();
          reader.onload = (e) => {
            setCompressedPreview(e.target?.result as string);
            setIsCompressing(false);
          };
          reader.readAsDataURL(blob);
        },
        mimeType,
        quality / 100
      );
    } catch (error) {
      console.error('Error compressing image:', error);
      toast({
        title: "Compression failed",
        description: "There was an error compressing your image",
        variant: "destructive"
      });
      setIsCompressing(false);
    }
  };
  
  // Handle download of compressed image
  const handleDownload = () => {
    if (!compressedImage || !originalImage) return;
    
    // Create a download link and trigger it
    const downloadLink = document.createElement('a');
    const url = URL.createObjectURL(compressedImage);
    
    // Get the original filename and add "-compressed" to it
    const originalFilename = originalImage.name;
    const fileExtension = originalFilename.split('.').pop();
    const baseFilename = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
    const compressedFilename = `${baseFilename}-compressed.${fileExtension}`;
    
    downloadLink.href = url;
    downloadLink.download = compressedFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your compressed image download has started"
    });
  };
  
  // Format file size in a human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate size reduction percentage
  const calculateReduction = (): number => {
    if (originalSize === 0 || compressedSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Image Compressor
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Optimize your website images by reducing file size while maintaining quality. Compress JPG, PNG, and WebP images.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload and Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="mr-2 h-5 w-5" />
              Image Upload & Settings
            </CardTitle>
            <CardDescription>
              Upload an image and configure compression settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-md py-12 flex flex-col items-center gap-4 cursor-pointer hover:bg-muted/50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">
                    {originalImage ? 'Change image' : 'Upload image'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop<br />
                    JPG, PNG or WebP (max 10MB)
                  </p>
                  {originalImage && (
                    <Badge variant="outline" className="text-xs">
                      {originalImage.name} ({formatFileSize(originalSize)})
                    </Badge>
                  )}
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              {originalImage && (
                <div className="grid sm:grid-cols-2 gap-4 py-2">
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Change Image
                  </Button>
                  <Button 
                    onClick={compressImage}
                    disabled={isCompressing || !originalImage}
                    className="mt-2"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    {isCompressing ? 'Compressing...' : 'Compress Image'}
                  </Button>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Compression Settings */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Compression Settings
                </h3>
              </div>
              
              {/* Quality Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="quality">Quality ({quality}%)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Low</span>
                  <Slider
                    id="quality"
                    value={[quality]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={(value) => setQuality(value[0])}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">High</span>
                </div>
              </div>
              
              {/* Resize Option */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="resize"
                    checked={enableResize}
                    onCheckedChange={setEnableResize}
                  />
                  <Label htmlFor="resize">Resize if larger than</Label>
                </div>
                
                {enableResize && (
                  <div className="pl-8">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={maxWidth}
                        onChange={(e) => setMaxWidth(parseInt(e.target.value) || 0)}
                        min={100}
                        max={5000}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">px width</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FilePieChart className="mr-2 h-5 w-5" />
              Preview & Results
            </CardTitle>
            <CardDescription>
              Compare original and compressed images
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!originalPreview ? (
              <div className="text-center py-12 space-y-4">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/60" />
                <div>
                  <h3 className="text-lg font-medium">No image uploaded</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload an image to see the preview and compression results
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Tabs defaultValue="comparison">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    <TabsTrigger value="preview">Full Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comparison">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="font-medium text-sm text-center">Original</div>
                        <div className="bg-muted/50 rounded-md overflow-hidden flex items-center justify-center">
                          <img 
                            src={originalPreview} 
                            alt="Original" 
                            className="object-cover max-h-[300px] w-auto"
                          />
                        </div>
                        <div className="text-xs text-center text-muted-foreground">
                          {formatFileSize(originalSize)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="font-medium text-sm text-center">Compressed</div>
                        <div className="bg-muted/50 rounded-md overflow-hidden flex items-center justify-center">
                          {isCompressing ? (
                            <div className="p-8 text-center w-full">
                              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground/60 mb-2" />
                              <div className="text-sm text-muted-foreground">Processing image...</div>
                            </div>
                          ) : compressedPreview ? (
                            <img 
                              src={compressedPreview} 
                              alt="Compressed" 
                              className="object-cover max-h-[300px] w-auto"
                            />
                          ) : (
                            <div className="p-8 text-center w-full">
                              <Zap className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                              <div className="text-sm text-muted-foreground">
                                Click "Compress Image" to see results
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-center text-muted-foreground">
                          {compressedSize > 0 ? formatFileSize(compressedSize) : '-'}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview">
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-md overflow-hidden flex items-center justify-center p-4">
                        {isCompressing ? (
                          <div className="p-8 text-center w-full">
                            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground/60 mb-2" />
                            <div className="text-sm text-muted-foreground">Processing image...</div>
                          </div>
                        ) : compressedPreview ? (
                          <img 
                            src={compressedPreview} 
                            alt="Compressed Preview" 
                            className="object-contain max-h-[400px] w-auto"
                          />
                        ) : (
                          <img 
                            src={originalPreview} 
                            alt="Original" 
                            className="object-contain max-h-[400px] w-auto"
                          />
                        )}
                      </div>
                      
                      <div className="text-center text-sm">
                        {compressedPreview ? 'Compressed image preview' : 'Original image preview'}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {compressedPreview && (
                  <>
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-base font-medium">Compression Results</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Size Reduction</span>
                          <span className="font-medium">{calculateReduction()}%</span>
                        </div>
                        <Progress value={calculateReduction()} className="h-2" />
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Original Size</div>
                            <div className="font-medium">{formatFileSize(originalSize)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Compressed Size</div>
                            <div className="font-medium">{formatFileSize(compressedSize)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={handleDownload}
                        disabled={!compressedImage}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Compressed Image
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Image Optimization Tips */}
      {originalPreview && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Image Optimization Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <Minus className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>For web images, a quality setting of 70-80% is often sufficient and provides good file size reduction.</span>
              </li>
              <li className="flex gap-2">
                <Minus className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>Resize your images to match the maximum dimensions needed on your website. No need to upload 4000px images if they'll only display at 800px.</span>
              </li>
              <li className="flex gap-2">
                <Minus className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>WebP format usually provides better compression than JPEG and PNG while maintaining similar visual quality.</span>
              </li>
              <li className="flex gap-2">
                <Minus className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>For photographs, JPEG or WebP is recommended. For images with transparency, use PNG or WebP.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}