import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clipboard, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HashGenerator() {
  const { toast } = useToast();
  const [text, setText] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<string>("md5");
  const [hashResult, setHashResult] = useState<string>("");
  const [encoding, setEncoding] = useState<string>("hex");

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
          <Tabs defaultValue="text" className="w-full">
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
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file-upload">File</Label>
                  <Input id="file-upload" type="file" />
                </div>
                <p className="text-sm text-muted-foreground">
                  File contents will be used to generate the hash. The file is processed entirely in your browser.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-4">
            <div>
              <Label className="text-base">Hashing Algorithm</Label>
              <RadioGroup 
                defaultValue="md5" 
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

            <Button onClick={() => {}} className="mt-2">
              Generate Hash
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The Hash Generator is currently under development and will be available soon. Check back later for this feature!
        </AlertDescription>
      </Alert>
    </div>
  );
}