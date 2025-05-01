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
  Code,
  FileCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function XmlToJsonConverter() {
  const { toast } = useToast();
  const [xmlData, setXmlData] = useState<string>("");
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [ignoreAttributes, setIgnoreAttributes] = useState<boolean>(false);
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
      setXmlData(content);
    };
    
    reader.readAsText(file);
  };
  
  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setXmlData(event.target.value);
  };
  
  const formatXml = () => {
    if (!xmlData.trim()) {
      toast({
        title: "Error",
        description: "Please provide XML data to format",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, "text/xml");
      
      // Check for parsing errors
      const parsererror = xmlDoc.getElementsByTagName("parsererror");
      if (parsererror.length > 0) {
        toast({
          title: "XML Parsing Error",
          description: "The XML is not well-formed",
          variant: "destructive",
        });
        return;
      }
      
      // Convert to string with proper formatting
      const serializer = new XMLSerializer();
      const formatted = formatXmlString(serializer.serializeToString(xmlDoc));
      
      setXmlData(formatted);
      
      toast({
        title: "XML Formatted",
        description: "XML has been properly formatted",
      });
    } catch (error) {
      toast({
        title: "Formatting Error",
        description: error instanceof Error ? error.message : "Failed to format XML",
        variant: "destructive",
      });
    }
  };
  
  // Function to format XML with indentation
  const formatXmlString = (xml: string): string => {
    let formatted = '';
    let indent = '';
    const tab = '  '; // 2 spaces for indentation
    
    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) {
        // If this is a closing tag, decrease indentation
        indent = indent.substring(tab.length);
      }
      
      formatted += indent + '<' + node + '>\n';
      
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?")) {
        // If this is an opening tag and not a self-closing tag, increase indentation
        indent += tab;
      }
    });
    
    // Fix the starting and ending brackets
    return formatted.substring(1, formatted.length - 2);
  };
  
  const convertXmlToJson = () => {
    if (!xmlData.trim()) {
      toast({
        title: "Error",
        description: "Please provide XML data to convert",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, "text/xml");
      
      // Check for parsing errors
      const parsererror = xmlDoc.getElementsByTagName("parsererror");
      if (parsererror.length > 0) {
        toast({
          title: "XML Parsing Error",
          description: "The XML is not well-formed",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Convert XML to JSON object
      const json = xmlToJson(xmlDoc, ignoreAttributes, isCompact);
      
      // Convert to string with optional pretty-printing
      const jsonString = isPrettyPrint 
        ? JSON.stringify(json, null, 2) 
        : JSON.stringify(json);
      
      setJsonOutput(jsonString);
      
      toast({
        title: "Conversion Success",
        description: "XML has been converted to JSON",
      });
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Failed to convert XML to JSON",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };
  
  // Function to convert XML to JSON
  const xmlToJson = (
    xml: Document | Element, 
    ignoreAttributes: boolean, 
    isCompact: boolean
  ): any => {
    // Create the return object
    let obj: any = {};
    
    // Element node
    if (xml.nodeType === 1) {
      // Add attributes if not ignored
      // Type assertion to Element since we've verified nodeType === 1
      const elem = xml as Element;
      if (!ignoreAttributes && elem.attributes && elem.attributes.length > 0) {
        obj["@attributes"] = {};
        for (let i = 0; i < elem.attributes.length; i++) {
          const attr = elem.attributes.item(i);
          if (attr) {
            obj["@attributes"][attr.nodeName] = attr.nodeValue;
          }
        }
      }
    } 
    // Text node
    else if (xml.nodeType === 3) {
      const text = xml.nodeValue?.trim();
      if (text) return text;
      return null;
    }
    
    // Process children
    if (xml.hasChildNodes()) {
      const childrenByTagName: { [key: string]: Element[] } = {};
      
      // Group children by their tag name
      for (let i = 0; i < xml.childNodes.length; i++) {
        const item = xml.childNodes.item(i);
        
        // Skip text nodes that are just whitespace
        if (item.nodeType === 3 && !item.nodeValue?.trim()) continue;
        
        // Process child node
        const nodeName = item.nodeName;
        
        if (nodeName === "#text") {
          // Handle text content
          const content = item.nodeValue?.trim();
          if (content) {
            obj["#text"] = content;
          }
        } else {
          // Group elements by tag name
          if (!childrenByTagName[nodeName]) {
            childrenByTagName[nodeName] = [];
          }
          childrenByTagName[nodeName].push(item as Element);
        }
      }
      
      // Process each group of children
      for (const tagName in childrenByTagName) {
        const children = childrenByTagName[tagName];
        
        if (children.length === 1) {
          // Only one child of this type
          const childContent = xmlToJson(children[0], ignoreAttributes, isCompact);
          
          if (isCompact && 
              typeof childContent === 'object' && 
              !Array.isArray(childContent) && 
              childContent !== null && 
              Object.keys(childContent).length === 0) {
            // Empty object, replace with empty string for compact mode
            obj[tagName] = "";
          } else if (isCompact && 
                    typeof childContent === 'object' && 
                    !Array.isArray(childContent) && 
                    childContent !== null && 
                    Object.keys(childContent).length === 1 && 
                    childContent["#text"]) {
            // Just text content in compact mode
            obj[tagName] = childContent["#text"];
          } else {
            // Regular content
            obj[tagName] = childContent;
          }
        } else {
          // Multiple children of this type, create an array
          obj[tagName] = children.map(child => {
            const childContent = xmlToJson(child, ignoreAttributes, isCompact);
            
            if (isCompact && 
                typeof childContent === 'object' && 
                !Array.isArray(childContent) && 
                childContent !== null && 
                Object.keys(childContent).length === 1 && 
                childContent["#text"]) {
              // Just text content in compact mode
              return childContent["#text"];
            }
            
            return childContent;
          });
        }
      }
    }
    
    return obj;
  };
  
  const copyToClipboard = () => {
    if (!jsonOutput) {
      toast({
        title: "Nothing to copy",
        description: "Convert XML to JSON first",
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
        description: "Convert XML to JSON first",
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
      jsonFileName = fileName.replace(/\.xml$/i, ".json");
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
    setXmlData("");
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
    const sampleXml = 
`<?xml version="1.0" encoding="UTF-8" ?>
<root>
  <users>
    <user id="1">
      <name>John Doe</name>
      <email>john@example.com</email>
      <roles>
        <role>admin</role>
        <role>editor</role>
      </roles>
      <active>true</active>
    </user>
    <user id="2">
      <name>Jane Smith</name>
      <email>jane@example.com</email>
      <roles>
        <role>user</role>
      </roles>
      <active>true</active>
    </user>
  </users>
  <settings>
    <darkMode>false</darkMode>
    <notification enabled="true">
      <email>true</email>
      <push>false</push>
    </notification>
  </settings>
</root>`;
    
    setXmlData(sampleXml);
    
    toast({
      title: "Sample data loaded",
      description: "Sample XML data has been added to the input area",
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">XML to JSON Converter</h1>
      <p className="text-gray-600 mb-8">
        Convert XML data to JSON format. Upload an XML file or paste your XML content directly.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Input XML Data</CardTitle>
            <CardDescription>
              Upload a file or paste your XML content
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
                  Paste XML
                </TabsTrigger>
                <TabsTrigger value="sample">
                  <FilePlus className="h-4 w-4 mr-2" />
                  Sample
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="xml-file">Upload XML File</Label>
                    <Input
                      id="xml-file"
                      type="file"
                      accept=".xml,application/xml,text/xml"
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
                    <Label htmlFor="xml-content">Paste XML Content</Label>
                    <Textarea
                      id="xml-content"
                      placeholder="Paste your XML data here..."
                      value={xmlData}
                      onChange={handleTextareaChange}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  <Button variant="outline" onClick={formatXml} disabled={!xmlData}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Format XML
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="sample">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Click the button below to load a sample XML dataset for testing.
                  </p>
                  <Button onClick={generateSample}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Load Sample Data
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ignore-attributes" 
                  checked={ignoreAttributes}
                  onCheckedChange={(checked) => setIgnoreAttributes(!!checked)}
                />
                <Label htmlFor="ignore-attributes" className="cursor-pointer">
                  Ignore XML attributes
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="compact-mode" 
                  checked={isCompact}
                  onCheckedChange={(checked) => setIsCompact(!!checked)}
                />
                <Label htmlFor="compact-mode" className="cursor-pointer">
                  Compact mode (simplify output structure)
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
            <Button onClick={convertXmlToJson} disabled={isProcessing || !xmlData}>
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
          <CardTitle>About XML to JSON Conversion</CardTitle>
          <CardDescription>
            Understanding the conversion process and options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How it Works</h3>
            <p className="text-muted-foreground">
              This tool converts XML (eXtensible Markup Language) data into JSON (JavaScript Object Notation) format.
              XML is a markup language with hierarchical structure used for storing and transporting data.
              JSON provides a more lightweight and easier-to-parse format for web applications.
            </p>
            
            <h3 className="text-lg font-medium">Conversion Options</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong>Ignore XML Attributes:</strong> When enabled, XML attributes like <code>&lt;tag attribute="value"&gt;</code> will be ignored in the output.
              </li>
              <li>
                <strong>Compact Mode:</strong> Creates a more concise JSON structure. Elements with simple text content will be represented as key-value pairs instead of nested objects.
              </li>
              <li>
                <strong>Pretty Print:</strong> Formats the JSON output with indentation and line breaks for better readability.
              </li>
            </ul>
            
            <h3 className="text-lg font-medium">Tips for Use</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong>Well-formed XML:</strong> Ensure your XML is properly formed with matching tags and valid syntax.
              </li>
              <li>
                <strong>Special Characters:</strong> Special characters in XML will be preserved in the JSON output.
              </li>
              <li>
                <strong>Large Files:</strong> For very large XML files (greater than 5MB), consider using a more specialized tool or server-side processing.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}