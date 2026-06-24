import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Unlock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { checkTaskStatus, getDownloadUrl, PdfProgress, removePassword, usePdfProgress } from '@/lib/pdfService';

export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
            setDownloadUrl(getDownloadUrl(completedTaskId));
          });
      }

      toast({
        title: 'PDF Unlocked Successfully',
        description: 'Your unlocked PDF is ready to download.',
      });
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      setError(progressData.error || 'An error occurred while unlocking the PDF');
      toast({
        title: 'Unlock Failed',
        description: progressData.error || 'An error occurred while unlocking the PDF',
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

  const resetForm = () => {
    setFile(null);
    setPassword("");
    setShowPassword(false);
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
  };

  const handleUnlock = async () => {
    if (!file) return;
    
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter the password to unlock your PDF",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const newTaskId = await removePassword(file, password);
      setTaskId(newTaskId);
    } catch (err) {
      setProcessing(false);
      const message = (err as Error).message || 'Failed to unlock PDF';
      setError(message);
      toast({
        title: 'Unlock Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!completed) {
      toast({
        title: 'Download unavailable',
        description: 'Please unlock the PDF before downloading.',
        variant: 'destructive',
      });
      return;
    }

    const url = downloadUrl || (taskId ? getDownloadUrl(taskId) : '');
    if (!url) {
      toast({
        title: 'Download unavailable',
        description: 'The unlocked PDF is not ready yet.',
        variant: 'destructive',
      });
      return;
    }

    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Unlock PDF
            </CardTitle>
            <CardDescription>
              Remove password protection from your PDF document
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">PDF Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter the password for this PDF"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={processing || completed}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">How does this work?</h3>
                  <p className="text-sm text-muted-foreground">
                    This tool removes password protection from PDF files. You'll need to provide the 
                    current password for the PDF. The tool will create a new copy of your PDF without 
                    any password restrictions.
                  </p>
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
                onClick={handleUnlock}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Unlock className="mr-2 h-4 w-4 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock PDF
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
                Download Unlocked PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}