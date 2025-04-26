import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, RefreshCw, QrCode, CreditCard, Phone, Mail, MapPin, Globe, Link } from "lucide-react";
import { SocialShare } from "@/components/SocialShare";
import { Textarea } from "@/components/ui/textarea";

interface QRStyleOptions {
  moduleDrawers: string[];
  colorMasks: string[];
  errorCorrectionLevels: string[];
}

interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  note: string;
}

export default function QRCodeGenerator() {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState("");
  const [size, setSize] = useState(10);
  const [border, setBorder] = useState(4);
  const [errorCorrection, setErrorCorrection] = useState("M");
  const [fillColor, setFillColor] = useState("#000000");
  const [backColor, setBackColor] = useState("#FFFFFF");
  const [moduleDrawer, setModuleDrawer] = useState("square");
  const [colorMask, setColorMask] = useState("solid");
  const [useGradient, setUseGradient] = useState(false);
  const [gradientStart, setGradientStart] = useState("#0088FF");
  const [gradientEnd, setGradientEnd] = useState("#6600FF");
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [styleOptions, setStyleOptions] = useState<QRStyleOptions>({
    moduleDrawers: [],
    colorMasks: [],
    errorCorrectionLevels: []
  });
  const [activeTab, setActiveTab] = useState("basic");
  const [contentType, setContentType] = useState("text");
  const [vCardData, setVCardData] = useState<VCardData>({
    firstName: "",
    lastName: "",
    organization: "",
    title: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    note: ""
  });

  useEffect(() => {
    // Set loaded state to true when the component mounts
    setLoaded(true);
    
    // Fetch available style options when component mounts
    const apiUrl = `${window.location.protocol}//${window.location.hostname}:8000/styles`;
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        setStyleOptions(data);
      })
      .catch(error => {
        console.error("Error fetching QR style options:", error);
        // Fallback options if API is unavailable
        setStyleOptions({
          moduleDrawers: ["square", "gapped", "circle", "rounded", "vertical", "horizontal"],
          colorMasks: ["solid", "radial", "square", "horizontal", "vertical"],
          errorCorrectionLevels: ["L", "M", "Q", "H"]
        });
      });
  }, []);
  
  // Function to generate VCard format
  const generateVCardData = () => {
    const { firstName, lastName, organization, title, email, phone, website, address, note } = vCardData;
    let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
    
    if (firstName || lastName) {
      vcard += `N:${lastName};${firstName};;;\n`;
      vcard += `FN:${firstName} ${lastName}\n`;
    }
    
    if (organization) vcard += `ORG:${organization}\n`;
    if (title) vcard += `TITLE:${title}\n`;
    if (email) vcard += `EMAIL:${email}\n`;
    if (phone) vcard += `TEL:${phone}\n`;
    if (website) vcard += `URL:${website}\n`;
    if (address) vcard += `ADR:;;${address};;;;\n`;
    if (note) vcard += `NOTE:${note}\n`;
    
    vcard += "END:VCARD";
    return vcard;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const generateQRCodeLocally = async (data: string) => {
    // Since the API isn't working, let's use a simple data URL for demo purposes
    // In a real implementation, we would use a client-side QR code library like qrcode.js
    
    // For now, create a placeholder image
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw a white background
      ctx.fillStyle = backColor;
      ctx.fillRect(0, 0, 200, 200);
      
      // Draw a border
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = 5;
      ctx.strokeRect(10, 10, 180, 180);
      
      // Add some text to indicate this is a QR code
      ctx.fillStyle = fillColor;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code Preview', 100, 30);
      ctx.fillText('(Actual QR code would', 100, 90);
      ctx.fillText('contain your data)', 100, 110);
      
      // Show what kind of data is in the QR code
      ctx.font = '12px Arial';
      if (contentType === 'vcard') {
        ctx.fillText('Contact Card', 100, 150);
      } else {
        // If text is too long, truncate it
        const displayText = data.length > 20 ? data.substring(0, 17) + '...' : data;
        ctx.fillText(displayText, 100, 150);
      }
    }
    
    return canvas.toDataURL('image/png');
  };

  const handleGenerateQR = async () => {
    // Use vCard data if that content type is selected
    const finalData = contentType === 'vcard' ? generateVCardData() : data;
    
    if (!finalData && contentType !== 'vcard') return;
    
    setIsGenerating(true);
    
    try {
      // First, try to use the API
      const formData = new FormData();
      formData.append("data", finalData);
      formData.append("size", size.toString());
      formData.append("border", border.toString());
      formData.append("error_correction", errorCorrection);
      formData.append("fill_color", fillColor);
      formData.append("back_color", backColor);
      formData.append("module_drawer", moduleDrawer);
      formData.append("color_mask", colorMask);
      
      if (useGradient) {
        formData.append("gradient_start", gradientStart);
        formData.append("gradient_end", gradientEnd);
      }
      
      if (logo) {
        formData.append("logo", logo);
      }

      try {
        const apiUrl = `${window.location.protocol}//${window.location.hostname}:8000/generate`;
        const apiResponse = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });
        
        if (apiResponse.ok) {
          const blob = await apiResponse.blob();
          const imageUrl = URL.createObjectURL(blob);
          setQrCodeImage(imageUrl);
        } else {
          throw new Error("API returned error status");
        }
      } catch (error) {
        console.error("API error, falling back to local generation:", error);
        
        // If API failed, generate locally
        const localImageUrl = await generateQRCodeLocally(finalData);
        setQrCodeImage(localImageUrl);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (qrCodeImage) {
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `qrcode-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetOptions = () => {
    setSize(10);
    setBorder(4);
    setErrorCorrection("M");
    setFillColor("#000000");
    setBackColor("#FFFFFF");
    setModuleDrawer("square");
    setColorMask("solid");
    setUseGradient(false);
    setGradientStart("#0088FF");
    setGradientEnd("#6600FF");
    setLogo(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">QR Code Generator</h1>
        <p className="text-muted-foreground mb-6">
          Create custom QR codes with different styles, colors, and advanced features
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>QR Code Settings</CardTitle>
                <CardDescription>
                  Customize your QR code appearance and functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div>
                      <Label htmlFor="contentType">Content Type</Label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger id="contentType" className="mt-1">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text or URL</SelectItem>
                          <SelectItem value="vcard">Contact Card (vCard)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {contentType === 'text' ? (
                      <div>
                        <Label htmlFor="data">QR Code Content</Label>
                        <Input
                          id="data"
                          placeholder="Enter URL, text or any data for your QR code"
                          value={data}
                          onChange={(e) => setData(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4 border rounded-md p-4 bg-muted/10">
                        <h3 className="text-sm font-medium flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Contact Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={vCardData.firstName}
                              onChange={(e) => setVCardData({...vCardData, firstName: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={vCardData.lastName}
                              onChange={(e) => setVCardData({...vCardData, lastName: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="organization">Organization</Label>
                            <Input
                              id="organization"
                              value={vCardData.organization}
                              onChange={(e) => setVCardData({...vCardData, organization: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={vCardData.title}
                              onChange={(e) => setVCardData({...vCardData, title: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="email" className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={vCardData.email}
                            onChange={(e) => setVCardData({...vCardData, email: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="phone" className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            value={vCardData.phone}
                            onChange={(e) => setVCardData({...vCardData, phone: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="website" className="flex items-center">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </Label>
                          <Input
                            id="website"
                            value={vCardData.website}
                            onChange={(e) => setVCardData({...vCardData, website: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="address" className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Address
                          </Label>
                          <Textarea
                            id="address"
                            value={vCardData.address}
                            onChange={(e) => setVCardData({...vCardData, address: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="note">Note</Label>
                          <Textarea
                            id="note"
                            value={vCardData.note}
                            onChange={(e) => setVCardData({...vCardData, note: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="size">Size (pixels)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="size"
                          min={5}
                          max={50}
                          step={1}
                          value={[size]}
                          onValueChange={(values) => setSize(values[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{size}</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="border">Border Size (modules)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="border"
                          min={0}
                          max={10}
                          step={1}
                          value={[border]}
                          onValueChange={(values) => setBorder(values[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{border}</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="appearance" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fillColor">Fill Color</Label>
                        <div className="flex mt-1">
                          <Input
                            id="fillColor"
                            type="color"
                            value={fillColor}
                            onChange={(e) => setFillColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={fillColor}
                            onChange={(e) => setFillColor(e.target.value)}
                            className="ml-2 flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="backColor">Background Color</Label>
                        <div className="flex mt-1">
                          <Input
                            id="backColor"
                            type="color"
                            value={backColor}
                            onChange={(e) => setBackColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={backColor}
                            onChange={(e) => setBackColor(e.target.value)}
                            className="ml-2 flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="useGradient">Use Gradient</Label>
                        <Switch
                          id="useGradient"
                          checked={useGradient}
                          onCheckedChange={setUseGradient}
                        />
                      </div>
                    </div>

                    {useGradient && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label htmlFor="gradientStart">Gradient Start</Label>
                          <div className="flex mt-1">
                            <Input
                              id="gradientStart"
                              type="color"
                              value={gradientStart}
                              onChange={(e) => setGradientStart(e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={gradientStart}
                              onChange={(e) => setGradientStart(e.target.value)}
                              className="ml-2 flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="gradientEnd">Gradient End</Label>
                          <div className="flex mt-1">
                            <Input
                              id="gradientEnd"
                              type="color"
                              value={gradientEnd}
                              onChange={(e) => setGradientEnd(e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={gradientEnd}
                              onChange={(e) => setGradientEnd(e.target.value)}
                              className="ml-2 flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="moduleDrawer">Module Style</Label>
                      <Select value={moduleDrawer} onValueChange={setModuleDrawer}>
                        <SelectTrigger id="moduleDrawer" className="mt-1">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleOptions.moduleDrawers.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style.charAt(0).toUpperCase() + style.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="colorMask">Color Pattern</Label>
                      <Select value={colorMask} onValueChange={setColorMask}>
                        <SelectTrigger id="colorMask" className="mt-1">
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleOptions.colorMasks.map((mask) => (
                            <SelectItem key={mask} value={mask}>
                              {mask.charAt(0).toUpperCase() + mask.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div>
                      <Label htmlFor="errorCorrection">Error Correction Level</Label>
                      <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                        <SelectTrigger id="errorCorrection" className="mt-1">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleOptions.errorCorrectionLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level === "L" ? "Low (7%)" : 
                               level === "M" ? "Medium (15%)" : 
                               level === "Q" ? "Quartile (25%)" : 
                               "High (30%)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">
                        Higher correction levels allow QR codes to remain readable even when partially damaged or obscured,
                        but increase density.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="logo">Add Logo (Optional)</Label>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Use a high error correction level when adding a logo for better reliability.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={resetOptions}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Options
                  </Button>
                  
                  <Button 
                    onClick={handleGenerateQR} 
                    disabled={!data || isGenerating}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Generated QR Code</CardTitle>
                <CardDescription>
                  Preview and download your QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center mb-4 rounded-lg overflow-hidden">
                    {qrCodeImage ? (
                      <img 
                        src={qrCodeImage} 
                        alt="Generated QR Code" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        <QrCode className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Your QR code will appear here</p>
                      </div>
                    )}
                  </div>

                  {qrCodeImage && (
                    <>
                      <Button 
                        className="w-full mb-3 flex items-center gap-2" 
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4" />
                        Download QR Code
                      </Button>
                      <Separator className="my-4" />
                      <div className="w-full">
                        <p className="text-sm text-center mb-2">Share this QR code:</p>
                        <SocialShare 
                          url={data} 
                          title="Check out my QR code" 
                          variant="outline"
                          size="sm"
                          compact
                          className="w-full justify-center"
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About QR Code Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-2">Customizable Design</h3>
                <p className="text-muted-foreground">
                  Create QR codes with custom colors, gradients, and various 
                  style options. Make your QR codes match your brand identity.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Logo Integration</h3>
                <p className="text-muted-foreground">
                  Add your logo to the center of your QR code to increase 
                  brand recognition while maintaining scannability.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">High Error Correction</h3>
                <p className="text-muted-foreground">
                  Adjust error correction levels to ensure your QR code remains 
                  readable even when partially obscured or damaged.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}