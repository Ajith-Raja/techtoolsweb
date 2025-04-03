import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyIcon, Code, Type, EyeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Web safe fonts list
const WEB_SAFE_FONTS = [
  "Arial",
  "Verdana",
  "Helvetica",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Brush Script MT",
  "Impact",
  "Palatino",
  "Lucida Sans",
  "Segoe UI",
  "Calibri"
];

// Unit options for font size
const SIZE_UNITS = ["px", "em", "rem", "%"];

export default function FontGenerator() {
  const { toast } = useToast();
  
  // State for form inputs
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(16);
  const [sizeUnit, setSizeUnit] = useState("px");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [previewText, setPreviewText] = useState("The quick brown fox jumps over the lazy dog.");
  const [activeTab, setActiveTab] = useState("preview");
  
  // Generate CSS based on form inputs
  const generateCSS = useMemo(() => {
    const css = [
      `font-family: ${fontFamily}, sans-serif;`,
      `font-size: ${fontSize}${sizeUnit};`,
    ];
    
    if (bold) css.push('font-weight: bold;');
    if (italic) css.push('font-style: italic;');
    if (underline) css.push('text-decoration: underline;');
    
    return css.join('\n');
  }, [fontFamily, fontSize, sizeUnit, bold, italic, underline]);
  
  // Generate inline style object for preview
  const previewStyle = useMemo(() => {
    return {
      fontFamily: `${fontFamily}, sans-serif`,
      fontSize: `${fontSize}${sizeUnit}`,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      textDecoration: underline ? 'underline' : 'none',
    };
  }, [fontFamily, fontSize, sizeUnit, bold, italic, underline]);
  
  // Handle copy CSS to clipboard
  const handleCopyCSS = () => {
    navigator.clipboard.writeText(generateCSS);
    toast({
      title: "Copied!",
      description: "CSS has been copied to clipboard",
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Web Safe Font Generator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create and preview web-safe font styles for your website. Generate CSS code that works across all browsers.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Font Options Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Type className="mr-2 h-5 w-5" />
              Font Options
            </CardTitle>
            <CardDescription>
              Select your font family, size and styling options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Family */}
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue placeholder="Select font family" />
                </SelectTrigger>
                <SelectContent>
                  {WEB_SAFE_FONTS.map((font) => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Font Size */}
            <div className="space-y-2">
              <Label>Font Size</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Slider
                    value={[fontSize]}
                    min={8}
                    max={sizeUnit === "px" ? 72 : sizeUnit === "%" ? 300 : 6}
                    step={sizeUnit === "px" ? 1 : 0.1}
                    onValueChange={(value) => setFontSize(value[0])}
                  />
                </div>
                <div className="w-16">
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseFloat(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="w-20">
                  <Select value={sizeUnit} onValueChange={setSizeUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Font Styles */}
            <div className="space-y-2">
              <Label>Font Style</Label>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bold" 
                    checked={bold} 
                    onCheckedChange={(checked) => setBold(!!checked)}
                  />
                  <label 
                    htmlFor="bold" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    style={{ fontWeight: 'bold' }}
                  >
                    Bold
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="italic" 
                    checked={italic} 
                    onCheckedChange={(checked) => setItalic(!!checked)}
                  />
                  <label 
                    htmlFor="italic" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    style={{ fontStyle: 'italic' }}
                  >
                    Italic
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="underline" 
                    checked={underline} 
                    onCheckedChange={(checked) => setUnderline(!!checked)}
                  />
                  <label 
                    htmlFor="underline" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    style={{ textDecoration: 'underline' }}
                  >
                    Underline
                  </label>
                </div>
              </div>
            </div>
            
            {/* Preview Text */}
            <div className="space-y-2">
              <Label htmlFor="preview-text">Preview Text</Label>
              <Textarea
                id="preview-text"
                placeholder="Enter text to preview"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Preview and Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <EyeIcon className="mr-2 h-5 w-5" />
              Font Preview & Code
            </CardTitle>
            <CardDescription>
              Preview your font and get the CSS code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="preview" className="flex items-center">
                  <EyeIcon className="mr-2 h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center">
                  <Code className="mr-2 h-4 w-4" />
                  CSS Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview">
                <div className="p-6 bg-muted rounded-md">
                  <p
                    className="min-h-[100px] break-words"
                    style={previewStyle}
                  >
                    {previewText || "The quick brown fox jumps over the lazy dog."}
                  </p>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Current Font Settings</h3>
                  <ul className="space-y-1">
                    <li className="text-sm flex">
                      <span className="font-medium w-32">Font Family:</span> 
                      <span>{fontFamily}</span>
                    </li>
                    <li className="text-sm flex">
                      <span className="font-medium w-32">Font Size:</span> 
                      <span>{fontSize}{sizeUnit}</span>
                    </li>
                    <li className="text-sm flex">
                      <span className="font-medium w-32">Font Weight:</span> 
                      <span>{bold ? 'Bold' : 'Normal'}</span>
                    </li>
                    <li className="text-sm flex">
                      <span className="font-medium w-32">Font Style:</span> 
                      <span>{italic ? 'Italic' : 'Normal'}</span>
                    </li>
                    <li className="text-sm flex">
                      <span className="font-medium w-32">Text Decoration:</span> 
                      <span>{underline ? 'Underline' : 'None'}</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="code">
                <div className="space-y-6">
                  <div className="relative">
                    <div className="p-4 bg-muted rounded-md font-mono text-sm overflow-x-auto">
                      <pre className="whitespace-pre">{generateCSS}</pre>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="absolute top-2 right-2"
                      onClick={handleCopyCSS}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Usage Instructions</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="font-mono bg-muted px-1 rounded">1.</span>
                        <span>Copy the CSS code above</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-mono bg-muted px-1 rounded">2.</span>
                        <span>Add it to your CSS file or inline style</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-mono bg-muted px-1 rounded">3.</span>
                        <span>Apply the style to your HTML elements</span>
                      </li>
                    </ol>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">HTML Example</h3>
                    <pre className="whitespace-pre-wrap text-xs">
{`<style>
  .my-font {
${generateCSS.split('\n').map(line => `    ${line}`).join('\n')}
  }
</style>

<p class="my-font">Your text here</p>`}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}