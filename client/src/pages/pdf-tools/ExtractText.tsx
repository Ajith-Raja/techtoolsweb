import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Copy, Check, FileOutput, ScanSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfFileUpload } from '@/components/PdfFileUpload';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export default function ExtractText() {
  const [file, setFile] = useState<File | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<string>("all");
  const [pageRange, setPageRange] = useState<string>("");
  const [preserveFormatting, setPreserveFormatting] = useState<boolean>(true);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProgress(0);
    setCompleted(false);
    setExtractedText("");
  };

  const resetForm = () => {
    setFile(null);
    setExtractedText("");
    setProgress(0);
    setCompleted(false);
  };

  const handleExtraction = () => {
    if (!file) return;
    
    if (extractionMethod === "range" && !pageRange.trim()) {
      toast({
        title: "Page range required",
        description: "Please specify the page range for extraction",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    
    // Simulate processing
    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal += 5;
      setProgress(progressVal);
      
      if (progressVal >= 100) {
        clearInterval(interval);
        setProcessing(false);
        setCompleted(true);
        
        // Generate placeholder extracted text
        const fileName = file.name.replace('.pdf', '');
        let simulatedText = '';
        
        if (includeHeaders) {
          simulatedText += `Document: ${fileName}\n`;
          simulatedText += `Extraction Date: ${new Date().toLocaleDateString()}\n`;
          simulatedText += `Total Pages: ${Math.floor(Math.random() * 10) + 5}\n\n`;
        }
        
        simulatedText += `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n`;
        
        if (preserveFormatting) {
          simulatedText += `Section 1: Introduction\n\n`;
          simulatedText += `• First important point about ${fileName}\n`;
          simulatedText += `• Second key consideration for users\n`;
          simulatedText += `• Third notable feature of this document\n\n`;
          simulatedText += `Section 2: Analysis\n\n`;
          simulatedText += `The analysis shows that the implementation of proper procedures results in a 25% increase in efficiency. Further studies indicated that...\n\n`;
        } else {
          simulatedText += `Section 1: Introduction First important point about ${fileName} Second key consideration for users Third notable feature of this document Section 2: Analysis The analysis shows that the implementation of proper procedures results in a 25% increase in efficiency. Further studies indicated that...`;
        }
        
        setExtractedText(simulatedText);
        
        toast({
          title: 'Text Extracted Successfully',
          description: 'The text content has been extracted from your PDF.',
        });
      }
    }, 300);
  };

  const handleCopyText = () => {
    if (!extractedText) return;
    
    navigator.clipboard.writeText(extractedText).then(() => {
      setCopied(true);
      toast({
        title: 'Text Copied',
        description: 'The extracted text has been copied to your clipboard.',
      });
      
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadText = () => {
    if (!extractedText || !file) return;
    
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace('.pdf', '')}-extracted-text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Text Downloaded',
      description: 'The extracted text has been downloaded as a TXT file.',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              Extract Text from PDF
            </CardTitle>
            <CardDescription>
              Convert your PDF document to plain text and extract its content
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!completed ? (
              <>
                <PdfFileUpload 
                  onFileSelect={handleFileSelect}
                  currentFile={file}
                  onFileRemove={resetForm}
                  disabled={processing}
                />
                
                {file && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Extraction Options</Label>
                      <RadioGroup 
                        value={extractionMethod} 
                        onValueChange={setExtractionMethod}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="all-pages" />
                          <Label htmlFor="all-pages" className="cursor-pointer">Extract from all pages</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="range" id="page-range" />
                          <Label htmlFor="page-range" className="cursor-pointer">Extract from specific pages</Label>
                        </div>
                      </RadioGroup>
                      
                      {extractionMethod === "range" && (
                        <div className="ml-6 mt-2">
                          <Input 
                            placeholder="e.g. 1-3, 5, 7-9"
                            value={pageRange}
                            onChange={(e) => setPageRange(e.target.value)}
                            disabled={processing}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter page numbers or ranges separated by commas
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Format Options</Label>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="preserve-formatting" 
                            checked={preserveFormatting}
                            onCheckedChange={(checked) => setPreserveFormatting(!!checked)}
                            disabled={processing}
                          />
                          <Label htmlFor="preserve-formatting" className="cursor-pointer">Preserve paragraph formatting</Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                          Maintains line breaks and paragraph structure
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-headers" 
                          checked={includeHeaders}
                          onCheckedChange={(checked) => setIncludeHeaders(!!checked)}
                          disabled={processing}
                        />
                        <Label htmlFor="include-headers" className="cursor-pointer">Include document metadata as headers</Label>
                      </div>
                    </div>
                    
                    {processing && (
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
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Extracted Text</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyText}
                      className="h-8 px-3"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadText}
                      className="h-8 px-3"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Save as TXT
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <Textarea
                    value={extractedText}
                    readOnly
                    className="min-h-[300px] font-mono text-sm resize-y"
                  />
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-end">
            {file && !completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={handleExtraction}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <ScanSearch className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Extract Text
                  </>
                )}
              </Button>
            )}
            
            {completed && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={resetForm}
              >
                <FileOutput className="mr-2 h-4 w-4" />
                Extract From Another PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}