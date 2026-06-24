import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Lock, EyeOff, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { addPassword, checkTaskStatus, getDownloadUrl, PdfProgress, usePdfProgress } from '@/lib/pdfService';

const defaultPermissions = {
  printing: false,
  copying: false,
  editing: false,
  annotating: false,
};

export default function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<{
    printing: boolean;
    copying: boolean;
    editing: boolean;
    annotating: boolean;
  }>({
    ...defaultPermissions,
  });
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
        title: 'PDF Protected Successfully',
        description: 'Your password-protected PDF is ready to download.',
      });
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      setError(progressData.error || 'An error occurred while protecting the PDF');
      toast({
        title: 'Protection Failed',
        description: progressData.error || 'An error occurred while protecting the PDF',
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
    setConfirmPassword("");
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
    setPermissions({ ...defaultPermissions });
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleProtect = async () => {
    if (!file) return;
    
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a password to protect your PDF",
        variant: "destructive"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Please use a password with at least 6 characters",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const newTaskId = await addPassword(file, password, password, permissions);
      setTaskId(newTaskId);
    } catch (err) {
      setProcessing(false);
      const message = (err as Error).message || 'Failed to protect PDF';
      setError(message);
      toast({
        title: 'Protection Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!completed) {
      toast({
        title: 'Download unavailable',
        description: 'Please protect the PDF before downloading.',
        variant: 'destructive',
      });
      return;
    }

    const url = downloadUrl || (taskId ? getDownloadUrl(taskId) : '');
    if (!url) {
      toast({
        title: 'Download unavailable',
        description: 'The protected PDF is not ready yet.',
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
              Protect PDF
            </CardTitle>
            <CardDescription>
              Secure your PDF document with password protection and permission settings
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
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter a strong password"
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={processing || completed}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Permissions (optional)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select which actions should be allowed with the password:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="printing" 
                        checked={permissions.printing}
                        onCheckedChange={() => togglePermission('printing')}
                        disabled={processing || completed}
                      />
                      <Label htmlFor="printing" className="cursor-pointer">Allow printing</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="copying" 
                        checked={permissions.copying}
                        onCheckedChange={() => togglePermission('copying')}
                        disabled={processing || completed}
                      />
                      <Label htmlFor="copying" className="cursor-pointer">Allow copying text and images</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="editing" 
                        checked={permissions.editing}
                        onCheckedChange={() => togglePermission('editing')}
                        disabled={processing || completed}
                      />
                      <Label htmlFor="editing" className="cursor-pointer">Allow editing</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="annotating" 
                        checked={permissions.annotating}
                        onCheckedChange={() => togglePermission('annotating')}
                        disabled={processing || completed}
                      />
                      <Label htmlFor="annotating" className="cursor-pointer">Allow adding annotations</Label>
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
                onClick={handleProtect}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Lock className="mr-2 h-4 w-4 animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Protect PDF
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
                Download Protected PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}