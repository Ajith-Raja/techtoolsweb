import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Download, Trash, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressPdf, usePdfProgress, checkTaskStatus, getDownloadUrl, PdfProgress } from '@/lib/pdfService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<number>(80);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Hook for real-time progress tracking
  usePdfProgress(taskId, (progressData: PdfProgress) => {
    if (progressData.status === 'processing') {
      setProgress(progressData.progress);
    } else if (progressData.status === 'success') {
      setProgress(100);
      setUploading(false);
      setCompleted(true);
      checkTaskStatus(taskId as string)
        .then(result => {
          if (result.download_url) {
            setDownloadUrl(result.download_url);
          }
        })
        .catch(console.error);
      
      toast({
        title: 'PDF Compressed Successfully',
        description: 'Your file is ready to download.',
      });
    } else if (progressData.status === 'error') {
      setUploading(false);
      setError(progressData.error || 'An error occurred during compression');
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file.',
          variant: 'destructive',
        });
        return;
      }
      
      if (selectedFile.size > 15 * 1024 * 1024) { // 15MB limit
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 15MB.',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
      setProgress(0);
      setCompleted(false);
      setError(null);
      setTaskId(null);
      setDownloadUrl(null);
    }
  };

  const handleCompressionChange = (value: number[]) => {
    setCompressionLevel(value[0]);
  };

  const handleCompression = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // Get quality level (100 - compression level to invert the scale)
      const quality = 100 - compressionLevel;
      
      // Call the API to compress the PDF
      const newTaskId = await compressPdf(file, quality);
      setTaskId(newTaskId);
    } catch (err) {
      setUploading(false);
      setError((err as Error).message);
      toast({
        title: 'Compression Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else if (taskId) {
      window.open(getDownloadUrl(taskId), '_blank');
    }
  };

  const resetForm = () => {
    setFile(null);
    setCompressionLevel(80);
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
  };

  const getCompressionLevelText = () => {
    if (compressionLevel < 30) return 'Low (Better Quality)';
    if (compressionLevel < 70) return 'Medium (Balanced)';
    return 'High (Smaller Size)';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Compress PDF
            </CardTitle>
            <CardDescription>
              Reduce the file size of your PDF document while maintaining quality
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!file ? (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Input
                  type="file"
                  accept=".pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Label
                  htmlFor="pdf-upload"
                  className="block cursor-pointer text-center"
                >
                  <FileText className="h-8 w-8 mb-4 mx-auto text-muted-foreground" />
                  <span className="font-medium text-primary block mb-1">
                    Click to upload a PDF file
                  </span>
                  <span className="text-sm text-muted-foreground">
                    or drag and drop here
                  </span>
                  <span className="block mt-2 text-xs text-muted-foreground">
                    Maximum file size: 15MB
                  </span>
                </Label>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 mr-3 text-primary" />
                    <div>
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetForm}
                    disabled={uploading}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Compression Level</Label>
                    <span className="text-sm text-primary font-medium">
                      {getCompressionLevelText()}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[80]}
                    max={100}
                    step={1}
                    onValueChange={handleCompressionChange}
                    disabled={uploading || completed}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Better Quality</span>
                    <span>Balanced</span>
                    <span>Smaller Size</span>
                  </div>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {(uploading || completed) && (
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
                onClick={handleCompression}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Compress PDF
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
                Download Compressed PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}