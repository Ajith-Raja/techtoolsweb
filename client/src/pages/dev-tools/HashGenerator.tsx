import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clipboard, Upload, AlertCircle, Copy, RefreshCw, Check, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function HashGenerator() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<string>("sha256");
  const [hashResult, setHashResult] = useState<string>("");
  const [encoding, setEncoding] = useState<string>("hex");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("text");

  const copyToClipboard = () => {
    if (!hashResult) return;
    
    navigator.clipboard.writeText(hashResult)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Hash copied to clipboard",
        });
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Error: " + err,
          variant: "destructive",
        });
      });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const fileContent = event.target.result as string;
        setText(fileContent);
      }
    };
    
    reader.readAsText(file);
  };

  const generateHash = async () => {
    if (!text) {
      toast({
        title: "Input required",
        description: activeTab === "text" ? "Please enter text to hash" : "Please upload a file to hash",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let result = "";
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      // Map algorithm names to Web Crypto API names
      let cryptoAlgo = algorithm;
      if (algorithm === "md5") {
        // Web Crypto API doesn't support MD5, so we'd need to use a custom implementation
        // For simplicity, let's just show a message
        toast({
          title: "MD5 not supported",
          description: "The Web Crypto API doesn't support MD5. Please select another algorithm.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      } else if (algorithm === "sha1") {
        cryptoAlgo = "SHA-1";
      } else if (algorithm === "sha256") {
        cryptoAlgo = "SHA-256";
      } else if (algorithm === "sha512") {
        cryptoAlgo = "SHA-512";
      }
      
      const buffer = await crypto.subtle.digest(cryptoAlgo, data);
      
      if (encoding === "hex") {
        result = Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
          
        if (uppercase) {
          result = result.toUpperCase();
        }
      } else if (encoding === "base64") {
        result = btoa(Array.from(new Uint8Array(buffer))
          .map(b => String.fromCharCode(b))
          .join(''));
      }
      
      setHashResult(result);
      toast({
        title: "Hash generated",
        description: `${algorithm.toUpperCase()} hash created successfully`,
      });
    } catch (error) {
      console.error("Hash generation error:", error);
      toast({
        title: "Error generating hash",
        description: "An error occurred while generating the hash",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setText("");
    setHashResult("");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Hash Generator</h1>
      <p className="text-gray-600 mb-8">
        Generate cryptographic hashes from text or files using various algorithms. Useful for data verification, checksums, and security applications.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Input Data</CardTitle>
          <CardDescription>
            Enter text or upload a file to hash
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="text">Text Input</TabsTrigger>
              <TabsTrigger value="file">File Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <div className="space-y-4">
                <Textarea 
                  placeholder="Enter text to hash"
                  className="min-h-[100px]"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="file">
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="file-upload">File</Label>
                  <Input 
                    id="file-upload" 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    File contents will be used to generate the hash. The file is processed entirely in your browser.
                  </p>
                  {fileName && (
                    <p className="text-sm font-medium mt-2">
                      Selected file: {fileName}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-4">
            <div>
              <Label className="text-base">Hashing Algorithm</Label>
              <RadioGroup 
                defaultValue="sha256" 
                className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2"
                value={algorithm}
                onValueChange={setAlgorithm}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="md5" id="md5" />
                  <Label htmlFor="md5">MD5</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sha1" id="sha1" />
                  <Label htmlFor="sha1">SHA-1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sha256" id="sha256" />
                  <Label htmlFor="sha256">SHA-256</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sha512" id="sha512" />
                  <Label htmlFor="sha512">SHA-512</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base">Output Format</Label>
              <RadioGroup 
                defaultValue="hex" 
                className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2"
                value={encoding}
                onValueChange={setEncoding}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hex" id="hex" />
                  <Label htmlFor="hex">Hexadecimal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="base64" id="base64" />
                  <Label htmlFor="base64">Base64</Label>
                </div>
              </RadioGroup>
            </div>

            {encoding === "hex" && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="uppercase" 
                  checked={uppercase}
                  onCheckedChange={(checked) => setUppercase(!!checked)}
                />
                <Label htmlFor="uppercase">Uppercase hexadecimal output</Label>
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={generateHash} 
                disabled={isLoading || !text} 
                className="mt-2 flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Generate Hash
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={clearForm}
                disabled={isLoading || (!text && !fileName)}
                className="mt-2"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
        
        {hashResult && (
          <CardFooter className="flex-col items-start space-y-2 border-t pt-6">
            <div className="w-full">
              <Label htmlFor="hash-result" className="text-base mb-2 block">Hash Result</Label>
              <div className="relative">
                <Textarea
                  id="hash-result"
                  className="font-mono pr-10"
                  readOnly
                  value={hashResult}
                  rows={3}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Check className="mr-1 h-4 w-4 text-green-500" />
              This is a one-way hash and cannot be reversed to obtain the original input.
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}