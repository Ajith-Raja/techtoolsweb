import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { Loader2, FileUp, Globe, LinkIcon, ExternalLink, ChevronRight, FolderTree, MonitorSmartphone, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SitemapNode {
  url: string;
  label: string;
  children: SitemapNode[];
  level: number;
  type: 'page' | 'image' | 'video' | 'file';
}

export default function SitemapVisualizer() {
  const { toast } = useToast();
  const [url, setUrl] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [visualizationMode, setVisualizationMode] = useState<string>("tree");
  const [inputMethod, setInputMethod] = useState<string>("url");
  const [sitemapData, setSitemapData] = useState<SitemapNode | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [maxDepth, setMaxDepth] = useState<string>("3");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !sitemapData) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Function to check if a point is inside a node
    const isPointInNode = (nodeX: number, nodeY: number) => {
      const radius = visualizationMode === "radial" ? 15 : 75;
      const height = visualizationMode === "radial" ? 30 : 30;

      if (visualizationMode === "radial") {
        return Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2)) <= radius;
      } else {
        return x >= nodeX && x <= nodeX + 150 && y >= nodeY && y <= nodeY + height;
      }
    };

    // Recursive function to find clicked node
    const findClickedNode = (node: SitemapNode, nodeX: number, nodeY: number): string | null => {
      if (isPointInNode(nodeX, nodeY)) {
        return node.url;
      }

      if (expandedNodes.has(node.url)) {
        for (const child of node.children) {
          let childX, childY;
          if (visualizationMode === "radial") {
            // Calculate child position based on radial layout
            const angle = Math.atan2(nodeY - canvasSize.height / 2, nodeX - canvasSize.width / 2);
            const radius = Math.sqrt(Math.pow(nodeX - canvasSize.width / 2, 2) + Math.pow(nodeY - canvasSize.height / 2, 2)) - 50;
            childX = canvasSize.width / 2 + radius * Math.cos(angle);
            childY = canvasSize.height / 2 + radius * Math.sin(angle);
          } else {
            // Calculate child position based on tree layout
            childX = nodeX - 150;
            childY = nodeY + 60;
          }

          const result = findClickedNode(child, childX, childY);
          if (result) return result;
        }
      }
      return null;
    };

    const clickedNodeUrl = findClickedNode(sitemapData, visualizationMode === "radial" ? canvasSize.width / 2 : canvasSize.width / 2 - 75, visualizationMode === "radial" ? canvasSize.height / 2 : 50);

    if (clickedNodeUrl) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(clickedNodeUrl)) {
          newSet.delete(clickedNodeUrl);
        } else {
          newSet.add(clickedNodeUrl);
        }
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (sitemapData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (visualizationMode === "tree") {
          drawTreeVisualization(ctx, sitemapData);
        } else {
          drawRadialVisualization(ctx, sitemapData);
        }
      }
    }
  }, [sitemapData, visualizationMode, canvasSize, expandedNodes]);

  const drawTreeVisualization = (ctx: CanvasRenderingContext2D, data: SitemapNode) => {
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';

    const nodeHeight = 30;
    const levelWidth = 200;
    const topMargin = 50;

    function drawNode(node: SitemapNode, x: number, y: number, width: number) {
      // Draw the node
      ctx.fillStyle = getNodeColor(node.type);
      ctx.strokeStyle = '#666';
      roundRect(ctx, x, y, 150, nodeHeight, 5, true, true);

      // Draw the text
      ctx.fillStyle = 'white';
      ctx.fillText(node.label.substring(0, 20) + (node.label.length > 20 ? '...' : ''), x + 10, y + 20);

      // Draw children
      if (node.children.length > 0 && expandedNodes.has(node.url)) {
        const childrenWidth = width / node.children.length;

        for (let i = 0; i < node.children.length; i++) {
          const childX = x - width/2 + childrenWidth/2 + i * childrenWidth;
          const childY = y + nodeHeight + 30;

          // Draw connection line
          ctx.strokeStyle = '#999';
          ctx.beginPath();
          ctx.moveTo(x + 75, y + nodeHeight);
          ctx.lineTo(childX + 75, childY);
          ctx.stroke();

          // Draw child node
          drawNode(node.children[i], childX, childY, childrenWidth);
        }
      }
    }

    // Start drawing from the root
    drawNode(data, canvasSize.width / 2 - 75, topMargin, canvasSize.width - 100);
  };

  const drawRadialVisualization = (ctx: CanvasRenderingContext2D, data: SitemapNode) => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 50;

    function drawNode(node: SitemapNode, x: number, y: number, angle: number, radius: number, angleWidth: number) {
      // Draw node
      ctx.fillStyle = getNodeColor(node.type);
      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw text (simplified)
      ctx.fillStyle = 'black';
      ctx.font = '10px Arial';
      const textX = x + 20 * Math.cos(angle);
      const textY = y + 20 * Math.sin(angle);
      const shortLabel = node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label;
      ctx.fillText(shortLabel, textX, textY);

      // Draw children
      if (node.children.length > 0 && expandedNodes.has(node.url)) {
        const childAngleWidth = angleWidth / node.children.length;
        const childRadius = radius - 50;

        if (childRadius > 30) {  // Only draw if we have space
          for (let i = 0; i < node.children.length; i++) {
            const childAngle = angle - angleWidth/2 + childAngleWidth/2 + i * childAngleWidth;
            const childX = centerX + childRadius * Math.cos(childAngle);
            const childY = centerY + childRadius * Math.sin(childAngle);

            // Draw connection
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(childX, childY);
            ctx.stroke();

            // Draw child node
            drawNode(node.children[i], childX, childY, childAngle, childRadius, childAngleWidth);
          }
        }
      }
    }

    // Start from the center
    drawNode(data, centerX, centerY, 0, maxRadius, Math.PI * 2);
  };

  // Helper function for drawing rounded rectangles
  function roundRect(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number, 
    fill: boolean, 
    stroke: boolean
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fill) {
      ctx.fill();
    }

    if (stroke) {
      ctx.stroke();
    }
  }

  // Get color based on node type
  function getNodeColor(type: string): string {
    switch(type) {
      case 'page': return '#3b82f6';
      case 'image': return '#10b981';
      case 'video': return '#ef4444';
      case 'file': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  const parseXmlSitemap = (xml: string): SitemapNode => {
    // This is a simplified parser that wouldn't work for all sitemaps
    // For a real implementation, use a proper XML parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");

    // Create a root node
    const rootNode: SitemapNode = {
      url: url || "Root",
      label: url ? new URL(url).hostname : "Root",
      children: [],
      level: 0,
      type: 'page'
    };

    // Find all URLs in the sitemap
    const urlElements = xmlDoc.getElementsByTagName("url");
    for (let i = 0; i < Math.min(urlElements.length, 50); i++) {
      const urlElement = urlElements[i];
      const locationElement = urlElement.getElementsByTagName("loc")[0];

      if (locationElement && locationElement.textContent) {
        try {
          const fullUrl = locationElement.textContent;
          const urlObj = new URL(fullUrl);
          const path = urlObj.pathname;
          const segments = path.split('/').filter(Boolean);

          // Determine node type
          let type: 'page' | 'image' | 'video' | 'file' = 'page';
          if (fullUrl.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
            type = 'image';
          } else if (fullUrl.match(/\.(mp4|webm|avi|mov)$/i)) {
            type = 'video';
          } else if (fullUrl.match(/\.(pdf|doc|docx|xls|xlsx|zip|rar)$/i)) {
            type = 'file';
          }

          // Add node to tree
          let currentLevel = rootNode;

          for (let j = 0; j < Math.min(segments.length, parseInt(maxDepth)); j++) {
            const segment = segments[j];
            const segmentPath = '/' + segments.slice(0, j + 1).join('/');
            const segmentUrl = urlObj.origin + segmentPath;

            // Check if this path segment already exists in children
            let existingNode = currentLevel.children.find(child => child.url === segmentUrl);

            if (!existingNode) {
              // Create new node
              existingNode = {
                url: segmentUrl,
                label: segment,
                children: [],
                level: j + 1,
                type: j === segments.length - 1 ? type : 'page'
              };
              currentLevel.children.push(existingNode);
            }

            currentLevel = existingNode;
          }
        } catch (error) {
          console.error("Error parsing URL:", error);
        }
      }
    }

    return rootNode;
  };

  const generateRandomSitemap = (): SitemapNode => {
    const domain = url || "example.com";

    const makeNode = (label: string, level: number, prefix: string): SitemapNode => {
      return {
        url: `https://${domain}${prefix}/${label}`,
        label: label,
        children: [],
        level: level,
        type: Math.random() > 0.8 ? 
              (Math.random() > 0.5 ? 'image' : 'file') : 
              'page'
      };
    };

    // Create root
    const root: SitemapNode = {
      url: `https://${domain}`,
      label: domain,
      children: [],
      level: 0,
      type: 'page'
    };

    // Level 1 pages
    const mainSections = ['about', 'products', 'services', 'blog', 'contact'];

    for (const section of mainSections) {
      const sectionNode = makeNode(section, 1, '');
      root.children.push(sectionNode);

      // Level 2 pages (random number of children)
      const childCount = Math.floor(Math.random() * 5) + 1;
      for (let i = 1; i <= childCount; i++) {
        let childLabel: string;

        switch(section) {
          case 'about':
            childLabel = ['team', 'history', 'mission', 'careers', 'faq'][i % 5];
            break;
          case 'products':
            childLabel = `product-${i}`;
            break;
          case 'services':
            childLabel = `service-${i}`;
            break;
          case 'blog':
            childLabel = `post-${i}`;
            break;
          default:
            childLabel = `page-${i}`;
        }

        const childNode = makeNode(childLabel, 2, `/${section}`);
        sectionNode.children.push(childNode);

        // Level 3 (only for some sections and with fewer children)
        if (section === 'products' || section === 'blog') {
          const grandchildCount = Math.floor(Math.random() * 3) + 1;
          for (let j = 1; j <= grandchildCount; j++) {
            const grandchildLabel = section === 'products' ? 
                                    `variant-${j}` : 
                                    `comment-${j}`;
            const grandchildNode = makeNode(grandchildLabel, 3, `/${section}/${childLabel}`);
            childNode.children.push(grandchildNode);
          }
        }
      }
    }

    return root;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMethod === "url" && !url) {
      toast({
        title: "URL required",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
      return;
    }

    if (inputMethod === "text" && !textInput) {
      toast({
        title: "XML sitemap required",
        description: "Please paste an XML sitemap",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/sitemap/analyze?' + new URLSearchParams({
        url: inputMethod === "url" ? url : textInput,
        max_depth: maxDepth
      }), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to analyze sitemap');
      }

      const data = await response.json();
      setSitemapData(data);

      toast({
        title: "Sitemap generated",
        description: "Sitemap visualization has been generated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error generating sitemap",
        description: error instanceof Error ? error.message : "Could not process the sitemap data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "sitemap-visualization.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Visualization downloaded",
      description: "Your sitemap visualization has been saved as a PNG image",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Sitemap Visualizer</h1>
      <p className="text-gray-600 mb-8">
        Generate a visual representation of a website's structure. This tool creates an interactive visualization from an XML sitemap or by crawling a site.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Configure Visualization</CardTitle>
          <CardDescription>
            Enter a website URL or paste an XML sitemap to generate a visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={inputMethod} onValueChange={setInputMethod} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="url" className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                URL Input
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center">
                <FileUp className="mr-2 h-4 w-4" />
                XML Sitemap
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="website-url">Website URL</Label>
                  <div className="flex mt-1.5">
                    <Input
                      id="website-url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Enter the root URL of the website you want to visualize
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="text">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="xml-sitemap">XML Sitemap</Label>
                  <Textarea 
                    id="xml-sitemap"
                    placeholder="Paste XML sitemap content here"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="mt-1.5 font-mono text-xs h-[150px]"
                  />
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Paste the XML content of the sitemap (usually found at /sitemap.xml)
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 border-t pt-6">
            <h3 className="text-base font-medium mb-3">Visualization Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visualization-mode">Visualization Type</Label>
                <Select 
                  value={visualizationMode}
                  onValueChange={setVisualizationMode}
                >
                  <SelectTrigger id="visualization-mode">
                    <SelectValue placeholder="Select visualization mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tree">Tree Layout</SelectItem>
                    <SelectItem value="radial">Radial Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max-depth">Maximum Depth</Label>
                <Select 
                  value={maxDepth}
                  onValueChange={setMaxDepth}
                >
                  <SelectTrigger id="max-depth">
                    <SelectValue placeholder="Select maximum depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 levels</SelectItem>
                    <SelectItem value="3">3 levels</SelectItem>
                    <SelectItem value="4">4 levels</SelectItem>
                    <SelectItem value="5">5 levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isLoading || (inputMethod === "url" && !url) || (inputMethod === "text" && !textInput)}
                className="w-full md:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FolderTree className="mr-2 h-4 w-4" />
                    Generate Visualization
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {sitemapData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sitemap Visualization</span>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            </CardTitle>
            <CardDescription>
              {visualizationMode === "tree" ? "Hierarchical tree visualization" : "Radial visualization"} of site structure
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto pb-0">
            <div className="flex justify-center min-h-[500px]">
              <canvas 
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="border rounded-md"
                onClick={handleCanvasClick}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-6">
            <div className="flex items-center text-sm space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></div>
                <span>Page</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#10b981] mr-2"></div>
                <span>Image</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#ef4444] mr-2"></div>
                <span>Video</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b] mr-2"></div>
                <span>File</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSitemapData(null)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}