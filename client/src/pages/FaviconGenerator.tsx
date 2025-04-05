
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "lucide-react";

interface PreviewSize {
  width: number;
  height: number;
  label: string;
}

const FAVICON_SIZES: PreviewSize[] = [
  { width: 16, height: 16, label: "16x16" },
  { width: 32, height: 32, label: "32x32" },
  { width: 48, height: 48, label: "48x48" },
  { width: 64, height: 64, label: "64x64" },
  { width: 128, height: 128, label: "128x128" },
  { width: 256, height: 256, label: "256x256" }
];

export default function FaviconGenerator() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setImageFile(file);
    generatePreviews(file);
  };

  const generatePreviews = async (file: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const previews = FAVICON_SIZES.map(size => {
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, size.width, size.height);
        return canvas.toDataURL('image/png');
      });
      setPreviews(previews);
      URL.revokeObjectURL(img.src);
    };
  };

  const generateZip = async () => {
    // This would be handled by the server
    // For now we'll just download the largest preview
    const link = document.createElement('a');
    link.href = previews[previews.length - 1];
    link.download = 'favicon-256x256.png';
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Favicon Generator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create favicons in multiple sizes from your image. Perfect for websites and web applications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>
              Upload your image (PNG, JPG, or SVG recommended)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              
              {imageFile && (
                <Button 
                  className="w-full"
                  onClick={generateZip}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All Sizes
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Preview your favicon in different sizes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="text-center">
                    <img
                      src={preview}
                      alt={`Favicon ${FAVICON_SIZES[index].label}`}
                      className="mx-auto border rounded p-2"
                      style={{ width: '64px', height: '64px' }}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {FAVICON_SIZES[index].label}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="mx-auto h-12 w-12 mb-4" />
                <p>Upload an image to preview favicons</p>
              </div>
            )}

            {previews.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">HTML Code:</p>
                <pre className="text-xs overflow-x-auto p-2 bg-background rounded">
                  {`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">`}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
