import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, FileUp, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { checkTaskStatus, getDownloadUrl, PdfProgress, usePdfProgress, wordToPdf } from '@/lib/pdfService';

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const socket = usePdfProgress(taskId, (progressData: PdfProgress) => {
    if (progressData.status === 'processing') {
      setProgress(progressData.progress);
      return;
    }

    if (progressData.status === 'success' || progressData.status === 'completed') {
      setProgress(100);
      setProcessing(false);
      setCompleted(true);

      if (taskId) {
        checkTaskStatus(taskId)
          .then(result => {
            if (result.download_url) {
              setDownloadUrl(result.download_url);
            } else {
              setDownloadUrl(getDownloadUrl(taskId));
            }
          })
          .catch(() => setDownloadUrl(taskId ? getDownloadUrl(taskId) : null));
      }

      toast({
        title: 'Conversion Completed',
        description: 'Your Word document has been converted to PDF.',
      });
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      setError(progressData.error || 'An error occurred during conversion');
      toast({
        title: 'Conversion Failed',
        description: progressData.error || 'An error occurred during conversion',
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [socket]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      const validExtensions = ['.docx'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a Word document (.docx).',
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
      setTaskId(null);
      setDownloadUrl(null);
      setError(null);
    }
  };

  const resetForm = () => {
    if (socket) {
      socket.close(1000, 'Resetting form');
    }
    setFile(null);
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
  };

  const handleConversion = async () => {
    if (!file) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const newTaskId = await wordToPdf(file);
      setTaskId(newTaskId);
    } catch (err) {
      setProcessing(false);
      setError((err as Error).message);
      toast({
        title: 'Conversion Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!completed) {
      toast({
        title: 'Download unavailable',
        description: 'Please complete the conversion before downloading.',
        variant: 'destructive',
      });
      return;
    }

    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return;
    }

    if (taskId) {
      window.open(getDownloadUrl(taskId), '_blank');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Word to PDF Converter
            </CardTitle>
            <CardDescription>
              Convert Word documents to PDF format with high-quality preservation
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!file ? (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Input
                  type="file"
                  accept=".doc,.docx,.rtf,.odt"
                  id="word-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Label
                  htmlFor="word-upload"
                  className="block cursor-pointer text-center"
                >
                  <FileUp className="h-8 w-8 mb-4 mx-auto text-muted-foreground" />
                  <span className="font-medium text-primary block mb-1">
                    Click to upload a Word document (.docx)
                  </span>
                  <span className="text-sm text-muted-foreground">
                    or drag and drop here
                  </span>
                  <span className="block mt-2 text-xs text-muted-foreground">
                    Supports .docx files only (max 15MB)
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
                    size="sm"
                    onClick={resetForm}
                    disabled={processing}
                  >
                    Change
                  </Button>
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
                    <Settings2 className="mr-2 h-4 w-4" />
                    Convert to PDF
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
                Download PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}