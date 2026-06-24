import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Scissors, FileOutput } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { checkTaskStatus, getDownloadUrl, PdfProgress, splitPdf, usePdfProgress } from '@/lib/pdfService';

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [splitMethod, setSplitMethod] = useState<string>("range");
  const [splitRange, setSplitRange] = useState<string>("");
  const [splitEvery, setSplitEvery] = useState<number>(1);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  usePdfProgress(taskId, (progressData: PdfProgress) => {
    if (progressData.status === 'processing') {
      setProgress(progressData.progress);
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
        title: 'PDF Split Successfully',
        description: 'Your files are ready to download.',
      });
      return;
    }

    if (progressData.status === 'error') {
      setProcessing(false);
      setError(progressData.error || 'An error occurred during splitting');
      toast({
        title: 'Split Failed',
        description: progressData.error || 'An error occurred during splitting',
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
    setProgress(0);
    setCompleted(false);
    setTaskId(null);
    setDownloadUrl(null);
    setError(null);
  };

  const handleSplit = async () => {
    if (!file) return;
    
    // Validate inputs
    if (splitMethod === "range" && !splitRange.trim()) {
      toast({
        title: "Missing page range",
        description: "Please specify the page range for splitting.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      const backendSplitMethod = splitMethod === 'interval' ? 'pages' : 'ranges';
      const pageRanges = splitMethod === 'interval'
        ? undefined
        : splitRange.trim().replace(/\s+/g, '');
      const pagesPerPdf = splitMethod === 'interval' ? splitEvery : undefined;

      const newTaskId = await splitPdf(file, backendSplitMethod, pagesPerPdf, pageRanges);
      setTaskId(newTaskId);
    } catch (err) {
      setProcessing(false);
      setError((err as Error).message);
      toast({
        title: 'Split Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!downloadUrl && !taskId) {
      toast({
        title: 'Download unavailable',
        description: 'Please split the PDF before downloading.',
        variant: 'destructive',
      });
      return;
    }

    window.open(downloadUrl || (taskId ? getDownloadUrl(taskId) : ''), '_blank');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Split PDF
            </CardTitle>
            <CardDescription>
              Divide your PDF into separate files by page range, interval, or extract specific pages
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
                <Tabs defaultValue="range" onValueChange={setSplitMethod} value={splitMethod}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="range">Page Range</TabsTrigger>
                    <TabsTrigger value="interval">Equal Parts</TabsTrigger>
                    <TabsTrigger value="extract">Extract Pages</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="range" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="page-range">Enter page ranges to split</Label>
                      <Input
                        id="page-range"
                        placeholder="e.g. 1-3, 4-8, 9-12"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        disabled={processing || completed}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate ranges with commas (e.g., 1-3, 4-8, 9-12). Each range will create a separate PDF.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="interval" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="split-every">Split every N pages</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="split-every"
                          type="number"
                          min={1}
                          max={100}
                          value={splitEvery}
                          onChange={(e) => setSplitEvery(parseInt(e.target.value) || 1)}
                          disabled={processing || completed}
                          className="w-24"
                        />
                        <span>pages</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The PDF will be split into multiple documents containing the specified number of pages each.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="extract" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="extract-pages">Pages to extract</Label>
                      <Input
                        id="extract-pages"
                        placeholder="e.g. 1, 3, 5-7, 10"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        disabled={processing || completed}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter page numbers or ranges separated by commas. All specified pages will be extracted into a single PDF.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                
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
                onClick={handleSplit}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Scissors className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="mr-2 h-4 w-4" />
                    Split PDF
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
                Download Files (ZIP)
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}