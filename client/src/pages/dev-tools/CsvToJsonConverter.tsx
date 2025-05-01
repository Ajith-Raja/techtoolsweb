import { useState, useRef, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileUp, 
  ClipboardCopy, 
  Download, 
  FileText, 
  FilePlus, 
  Table,
  Code,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

interface CsvRow {
  [key: string]: string | number | boolean | null;
}

export default function CsvToJsonConverter() {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<string>("");
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [isPrettyPrint, setIsPrettyPrint] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
    };
    
    reader.readAsText(file);
  };
  
  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setCsvData(event.target.value);
  };
  
  const convertCsvToJson = () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Please provide CSV data to convert",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const results = Papa.parse<CsvRow>(csvData, {
        header: hasHeaders,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      
      if (results.errors && results.errors.length > 0) {
        toast({
          title: "Parsing Error",
          description: results.errors[0].message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      const outputJson = isPrettyPrint
        ? JSON.stringify(results.data, null, 2)
        : JSON.stringify(results.data);
      
      setJsonOutput(outputJson);
      
      toast({
        title: "Conversion Success",
        description: `Converted ${results.data.length} rows of CSV data to JSON`,
      });
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Failed to convert CSV to JSON",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };
  
  const copyToClipboard = () => {
    if (!jsonOutput) {
      toast({
        title: "Nothing to copy",
        description: "Convert CSV to JSON first",
        variant: "destructive",
      });
      return;
    }
    
    navigator.clipboard.writeText(jsonOutput).then(
      () => {
        toast({
          title: "Copied!",
          description: "JSON copied to clipboard",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: err.message,
          variant: "destructive",
        });
      }
    );
  };
  
  const downloadJson = () => {
    if (!jsonOutput) {
      toast({
        title: "Nothing to download",
        description: "Convert CSV to JSON first",
        variant: "destructive",
      });
      return;
    }
    
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    // Generate file name based on original file name or default
    let jsonFileName = "converted.json";
    if (fileName) {
      jsonFileName = fileName.replace(/\.csv$/i, ".json");
    }
    
    a.href = url;
    a.download = jsonFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: `JSON saved as ${jsonFileName}`,
    });
  };
  
  const clearAll = () => {
    setCsvData("");
    setJsonOutput("");
    setFileName("");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast({
      title: "Cleared",
      description: "All input and output cleared",
    });
  };

  const generateSample = () => {
    const sampleCsv = 
`id,name,email,age,active
1,John Doe,john@example.com,32,true
2,Jane Smith,jane@example.com,28,true
3,Mike Brown,mike@example.com,45,false
4,Sara Wilson,sara@example.com,36,true`;
    
    setCsvData(sampleCsv);
    
    toast({
      title: "Sample data loaded",
      description: "Sample CSV data has been added to the input area",
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">CSV to JSON Converter</h1>
      <p className="text-gray-600 mb-8">
        Convert CSV data to JSON format. Upload a CSV file or paste your CSV content directly.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Input CSV Data</CardTitle>
            <CardDescription>
              Upload a file or paste your CSV content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="upload">
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="paste">
                  <FileText className="h-4 w-4 mr-2" />
                  Paste CSV
                </TabsTrigger>
                <TabsTrigger value="sample">
                  <FilePlus className="h-4 w-4 mr-2" />
                  Sample
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="csv-file">Upload CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv,text/csv"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                  </div>
                  
                  {fileName && (
                    <div className="text-sm text-muted-foreground">
                      <p>File: {fileName}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="paste">
                <div className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="csv-content">Paste CSV Content</Label>
                    <Textarea
                      id="csv-content"
                      placeholder="Paste your CSV data here..."
                      value={csvData}
                      onChange={handleTextareaChange}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sample">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Click the button below to load a sample CSV dataset for testing.
                  </p>
                  <Button onClick={generateSample}>
                    <Table className="h-4 w-4 mr-2" />
                    Load Sample Data
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has-headers" 
                  checked={hasHeaders}
                  onCheckedChange={(checked) => setHasHeaders(!!checked)}
                />
                <Label htmlFor="has-headers" className="cursor-pointer">
                  First row contains column headers
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="pretty-print" 
                  checked={isPrettyPrint}
                  onCheckedChange={(checked) => setIsPrettyPrint(!!checked)}
                />
                <Label htmlFor="pretty-print" className="cursor-pointer">
                  Pretty print JSON (indentation and line breaks)
                </Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button onClick={convertCsvToJson} disabled={isProcessing || !csvData}>
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Code className="h-4 w-4 mr-2" />
                  Convert to JSON
                </>
              )}
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Output JSON</CardTitle>
            <CardDescription>
              Converted JSON result
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="json-output">JSON Output</Label>
                <Textarea
                  id="json-output"
                  placeholder="JSON output will appear here..."
                  value={jsonOutput}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button 
              variant="secondary" 
              onClick={copyToClipboard}
              disabled={!jsonOutput}
            >
              <ClipboardCopy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button 
              variant="secondary" 
              onClick={downloadJson}
              disabled={!jsonOutput}
            >
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About CSV to JSON Conversion</CardTitle>
          <CardDescription>
            Understanding the conversion process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How it Works</h3>
            <p className="text-muted-foreground">
              This tool converts CSV (Comma-Separated Values) data into JSON (JavaScript Object Notation) format.
              CSV is a simple tabular format where each line is a row and values are separated by commas.
              JSON is a structured data format that's easy to parse and use in applications.
            </p>
            
            <h3 className="text-lg font-medium">Tips for Better Results</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong>Headers:</strong> Toggle the "First row contains column headers" option based on your data.
                If enabled, the first row will be used as property names in the resulting JSON objects.
              </li>
              <li>
                <strong>Quotes:</strong> For CSV values containing commas, ensure they are properly quoted in the source data.
              </li>
              <li>
                <strong>Data Types:</strong> The converter attempts to automatically detect numbers and booleans.
              </li>
              <li>
                <strong>Large Files:</strong> For very large CSV files (>10MB), consider splitting them or using a more specialized tool.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}