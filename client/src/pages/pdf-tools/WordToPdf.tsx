import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, FileUp, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [preserveLinks, setPreserveLinks] = useState<boolean>(true);
  const [embedFonts, setEmbedFonts] = useState<boolean>(true);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      const validExtensions = ['.doc', '.docx', '.rtf', '.odt'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a Word document (.doc, .docx, .rtf, or .odt).',
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
    }
  };

  const resetForm = () => {
    setFile(null);
    setProgress(0);
    setCompleted(false);
  };

  const handleConversion = () => {
    if (!file) return;
    
    setProcessing(true);
    
    // Simulate conversion progress
    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal += 5;
      setProgress(progressVal);
      
      if (progressVal >= 100) {
        clearInterval(interval);
        setProcessing(false);
        setCompleted(true);
        toast({
          title: 'Conversion Completed',
          description: 'Your Word document has been converted to PDF.',
        });
      }
    }, 300);
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
                    Click to upload a Word document
                  </span>
                  <span className="text-sm text-muted-foreground">
                    or drag and drop here
                  </span>
                  <span className="block mt-2 text-xs text-muted-foreground">
                    Supports .doc, .docx, .rtf, and .odt files (max 15MB)
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
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Conversion Options</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="preserve-links">Preserve hyperlinks</Label>
                        <p className="text-xs text-muted-foreground">
                          Keep clickable links in the PDF document
                        </p>
                      </div>
                      <Switch
                        id="preserve-links"
                        checked={preserveLinks}
                        onCheckedChange={setPreserveLinks}
                        disabled={processing || completed}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="embed-fonts">Embed fonts</Label>
                        <p className="text-xs text-muted-foreground">
                          Include fonts within the PDF file
                        </p>
                      </div>
                      <Switch
                        id="embed-fonts"
                        checked={embedFonts}
                        onCheckedChange={setEmbedFonts}
                        disabled={processing || completed}
                      />
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