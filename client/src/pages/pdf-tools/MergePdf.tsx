import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Plus, ArrowUp, ArrowDown, X, MoveVertical, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { mergePdfs, usePdfProgress, checkTaskStatus, getDownloadUrl, PdfProgress } from '@/lib/pdfService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FileWithId {
  id: string;
  file: File;
}

export default function MergePdf() {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    // Convert FileList to array and add id
    const newFiles = Array.from(selectedFiles)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        file
      }));
    
    if (newFiles.length === 0) {
      toast({
        title: 'Invalid files',
        description: 'Please upload PDF files only.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if any file is too large
    const tooLargeFiles = newFiles.filter(f => f.file.size > 15 * 1024 * 1024);
    if (tooLargeFiles.length > 0) {
      toast({
        title: 'Files too large',
        description: `${tooLargeFiles.length} file(s) exceed the 15MB limit.`,
        variant: 'destructive',
      });
      return;
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const moveFile = (id: string, direction: 'up' | 'down') => {
    const index = files.findIndex(f => f.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === files.length - 1)
    ) {
      return;
    }
    
    const newFiles = [...files];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFiles[index];
    newFiles[index] = newFiles[newIndex];
    newFiles[newIndex] = temp;
    setFiles(newFiles);
  };

  const handleMerge = () => {
    if (files.length < 2) {
      toast({
        title: 'Not enough files',
        description: 'Please add at least 2 PDF files to merge.',
        variant: 'destructive',
      });
      return;
    }
    
    setProcessing(true);
    
    // Simulate merge progress
    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal += 5;
      setProgress(progressVal);
      
      if (progressVal >= 100) {
        clearInterval(interval);
        setProcessing(false);
        setCompleted(true);
        toast({
          title: 'PDFs Merged Successfully',
          description: 'Your merged PDF is ready to download.',
        });
      }
    }, 300);
  };

  const resetForm = () => {
    setFiles([]);
    setProgress(0);
    setCompleted(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Merge PDF Files
            </CardTitle>
            <CardDescription>
              Combine multiple PDF documents into a single file
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {files.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Input
                  type="file"
                  accept=".pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                />
                <Label
                  htmlFor="pdf-upload"
                  className="block cursor-pointer text-center"
                >
                  <FileText className="h-8 w-8 mb-4 mx-auto text-muted-foreground" />
                  <span className="font-medium text-primary block mb-1">
                    Click to upload PDF files
                  </span>
                  <span className="text-sm text-muted-foreground">
                    or drag and drop here
                  </span>
                  <span className="block mt-2 text-xs text-muted-foreground">
                    Maximum file size: 15MB per file
                  </span>
                </Label>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {files.map((fileObj, index) => (
                    <div 
                      key={fileObj.id} 
                      className="p-4 rounded-lg bg-muted flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center rounded-full mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[180px] sm:max-w-xs">
                            {fileObj.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveFile(fileObj.id, 'up')}
                          disabled={processing || index === 0}
                          className="h-8 w-8"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveFile(fileObj.id, 'down')}
                          disabled={processing || index === files.length - 1}
                          className="h-8 w-8"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(fileObj.id)}
                          disabled={processing}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {!completed && (
                  <div className="flex justify-center">
                    <Label
                      htmlFor="add-more-pdf"
                      className="cursor-pointer inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
                    >
                      <Input
                        type="file"
                        accept=".pdf"
                        id="add-more-pdf"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                        disabled={processing}
                      />
                      <Plus className="h-4 w-4 mr-1" />
                      Add more PDF files
                    </Label>
                  </div>
                )}
                
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
            {files.length > 0 && !completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={handleMerge}
                disabled={processing || files.length < 2}
              >
                {processing ? (
                  <>
                    <MoveVertical className="mr-2 h-4 w-4 animate-spin" />
                    Merging PDFs...
                  </>
                ) : (
                  <>
                    <MoveVertical className="mr-2 h-4 w-4" />
                    Merge {files.length} PDFs
                  </>
                )}
              </Button>
            )}
            
            {completed && (
              <>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={resetForm}
                >
                  Merge Another Set
                </Button>
                <Button
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Merged PDF
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}