import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Info, Tag, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { checkTaskStatus, editMetadata, getDownloadUrl, getPdfMetadata, PdfMetadataFields, PdfProgress, usePdfProgress } from '@/lib/pdfService';

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

const defaultMetadata: PdfMetadata = {
  title: '',
  author: '',
  subject: '',
  keywords: '',
  creator: '',
  producer: '',
};

export default function EditMetadata() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata>(defaultMetadata);
  const [originalMetadata, setOriginalMetadata] = useState<PdfMetadata | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
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
            if (completedTaskId) {
              setDownloadUrl(getDownloadUrl(completedTaskId));
            }
          });
      }

      toast({
        title: 'Metadata Updated Successfully',
        description: 'Your PDF with updated metadata is ready to download.',
      });
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      setError(progressData.error || 'An error occurred while updating metadata');
      toast({
        title: 'Metadata Update Failed',
        description: progressData.error || 'An error occurred while updating metadata',
        variant: 'destructive',
      });
    }
  });

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setProgress(0);
    setCompleted(false);
    setLoading(true);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);

    try {
      const loadedMetadata = await getPdfMetadata(selectedFile);
      setMetadata(loadedMetadata);
      setOriginalMetadata(loadedMetadata);
    } catch (error) {
      const fallbackMetadata = {
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        author: '',
        subject: '',
        keywords: '',
        creator: '',
        producer: '',
      };

      setMetadata(fallbackMetadata);
      setOriginalMetadata(fallbackMetadata);
      toast({
        title: 'Metadata read warning',
        description: error instanceof Error ? error.message : 'Could not read existing metadata, using file name defaults.',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setMetadata(defaultMetadata);
    setOriginalMetadata(null);
    setProgress(0);
    setCompleted(false);
    setLoading(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!file) return;
    
    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const newTaskId = await editMetadata(file, metadata);
      setTaskId(newTaskId);
    } catch (error) {
      setProcessing(false);
      const message = error instanceof Error ? error.message : 'Failed to update metadata';
      setError(message);
      toast({
        title: 'Metadata Update Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const hasChanges = () => {
    if (!originalMetadata) return false;
    
    return (
      metadata.title !== originalMetadata.title ||
      metadata.author !== originalMetadata.author ||
      metadata.subject !== originalMetadata.subject ||
      metadata.keywords !== originalMetadata.keywords ||
      metadata.creator !== originalMetadata.creator ||
      metadata.producer !== originalMetadata.producer
    );
  };

  const handleDownload = () => {
    if (!completed) {
      toast({
        title: 'Download unavailable',
        description: 'Please update metadata before downloading.',
        variant: 'destructive',
      });
      return;
    }

    const url = downloadUrl || (taskId ? getDownloadUrl(taskId) : '');
    if (!url) {
      toast({
        title: 'Download unavailable',
        description: 'The updated PDF is not ready yet.',
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
              Edit PDF Metadata
            </CardTitle>
            <CardDescription>
              View and update document properties like title, author, subject, and keywords
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <PdfFileUpload 
              onFileSelect={handleFileSelect}
              currentFile={file}
              onFileRemove={resetForm}
              disabled={processing || loading}
            />
            
            {file && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Info className="h-8 w-8 mb-4 animate-pulse text-primary" />
                    <p className="text-center text-muted-foreground">
                      Reading document metadata...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={metadata.title}
                        onChange={handleInputChange}
                        disabled={processing || completed}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        name="author"
                        value={metadata.author}
                        onChange={handleInputChange}
                        disabled={processing || completed}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={metadata.subject}
                        onChange={handleInputChange}
                        disabled={processing || completed}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Keywords</Label>
                      <Textarea
                        id="keywords"
                        name="keywords"
                        placeholder="Separate keywords with commas"
                        value={metadata.keywords}
                        onChange={handleInputChange}
                        className="resize-none"
                        rows={3}
                        disabled={processing || completed}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="creator">Creator</Label>
                        <Input
                          id="creator"
                          name="creator"
                          value={metadata.creator}
                          onChange={handleInputChange}
                          disabled={processing || completed}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="producer">Producer</Label>
                        <Input
                          id="producer"
                          name="producer"
                          value={metadata.producer}
                          onChange={handleInputChange}
                          disabled={processing || completed}
                        />
                      </div>
                    </div>
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

                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-end">
            {file && !loading && !completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={handleUpdate}
                disabled={processing || !hasChanges()}
              >
                {processing ? (
                  <>
                    <Tag className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update Metadata
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