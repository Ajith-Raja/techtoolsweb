import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertCircle, 
  Send, 
  RefreshCw, 
  Trash2, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Code, 
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface WebhookRequest {
  id: string;
  url: string;
  method: string;
  payload: string;
  headers: Record<string, string>;
  timestamp: Date;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
    time: number;
  };
  error?: string;
}

interface HeaderField {
  key: string;
  value: string;
}

// Template data for predefined webhook payloads
const webhookTemplates = {
  stripe: {
    payload: `{
  "id": "evt_1LvGtvHVfJKdgj3n4GDX4D2L",
  "object": "event",
  "api_version": "2022-08-01",
  "created": ${Math.floor(Date.now() / 1000)},
  "data": {
    "object": {
      "id": "pi_3LvGtaHVfJKdgj3n04AcOUJN",
      "object": "payment_intent",
      "amount": 2000,
      "amount_received": 2000,
      "currency": "usd",
      "customer": "cus_MaPQl6yyR1L7Ip",
      "payment_method": "pm_1LvGtrHVfJKdgj3noIZdNdHa",
      "payment_method_types": ["card"],
      "status": "succeeded"
    }
  },
  "type": "payment_intent.succeeded"
}`,
    headers: [
      { key: "Content-Type", value: "application/json" },
      { key: "Stripe-Signature", value: "t=" + Math.floor(Date.now() / 1000) + ",v1=mock_signature" }
    ]
  },
  github: {
    payload: `{
  "ref": "refs/heads/main",
  "before": "6113728f27ae8caed81dac354e7acba48c0caee2",
  "after": "56b60f5045af3d45d2cde5aec8a94861df8cb67c",
  "repository": {
    "id": 123456789,
    "name": "example-repo",
    "full_name": "username/example-repo",
    "owner": {
      "name": "username",
      "email": "user@example.com"
    },
    "html_url": "https://github.com/username/example-repo"
  },
  "pusher": {
    "name": "username",
    "email": "user@example.com"
  },
  "commits": [
    {
      "id": "56b60f5045af3d45d2cde5aec8a94861df8cb67c",
      "message": "Update README.md",
      "timestamp": "${new Date().toISOString()}",
      "author": {
        "name": "User Name",
        "email": "user@example.com"
      }
    }
  ]
}`,
    headers: [
      { key: "Content-Type", value: "application/json" },
      { key: "X-Github-Event", value: "push" },
      { key: "X-Github-Delivery", value: "72d3162e-cc78-11e3-81ab-4c9367dc0958" }
    ]
  },
  slack: {
    payload: `{
  "token": "XXYYZZ",
  "team_id": "T061EG9R6",
  "api_app_id": "A0MDYCDME",
  "event": {
    "type": "message",
    "channel": "C024BE91L",
    "user": "U2147483697",
    "text": "Hello world",
    "ts": "${Date.now() / 1000}"
  },
  "type": "event_callback",
  "event_time": ${Math.floor(Date.now() / 1000)},
  "authed_users": ["U2147483697"]
}`,
    headers: [
      { key: "Content-Type", value: "application/json" },
      { key: "X-Slack-Signature", value: "v0=mock_signature" },
      { key: "X-Slack-Request-Timestamp", value: String(Math.floor(Date.now() / 1000)) }
    ]
  }
};

export default function WebhookSimulator() {
  const { toast } = useToast();
  const [url, setUrl] = useState<string>("");
  const [method, setMethod] = useState<string>("POST");
  const [template, setTemplate] = useState<string>("custom");
  const [payload, setPayload] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [headerFields, setHeaderFields] = useState<HeaderField[]>([]);
  const [history, setHistory] = useState<WebhookRequest[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<WebhookRequest | null>(null);
  const [includeTimestamp, setIncludeTimestamp] = useState<boolean>(false);

  // Update payload when template changes
  useEffect(() => {
    if (template !== "custom") {
      setPayload(webhookTemplates[template as keyof typeof webhookTemplates].payload);
      setHeaderFields(webhookTemplates[template as keyof typeof webhookTemplates].headers);
    }
  }, [template]);

  // Add a new header field
  const addHeaderField = () => {
    setHeaderFields([...headerFields, { key: "", value: "" }]);
  };

  // Update a header field
  const updateHeaderField = (index: number, field: "key" | "value", value: string) => {
    const updatedHeaders = [...headerFields];
    updatedHeaders[index][field] = value;
    setHeaderFields(updatedHeaders);
  };

  // Remove a header field
  const removeHeaderField = (index: number) => {
    setHeaderFields(headerFields.filter((_, i) => i !== index));
  };

  // Convert header fields to an object
  const getHeadersObject = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    headerFields.forEach(field => {
      if (field.key && field.value) {
        headers[field.key] = field.value;
      }
    });
    return headers;
  };

  // Format and validate JSON payload
  const formatJson = () => {
    if (!payload.trim()) {
      toast({
        title: "Nothing to format",
        description: "Enter a JSON payload first",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsed = JSON.parse(payload);
      
      // Add timestamp if option is checked
      if (includeTimestamp && !parsed.timestamp) {
        parsed.timestamp = new Date().toISOString();
      }
      
      const formatted = JSON.stringify(parsed, null, 2);
      setPayload(formatted);
      
      toast({
        title: "JSON Formatted",
        description: "Your JSON payload has been formatted successfully",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON syntax",
        variant: "destructive",
      });
    }
  };

  // Send webhook request
  const sendWebhook = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a target URL for your webhook",
        variant: "destructive",
      });
      return;
    }

    const normalizedUrl = (() => {
      const raw = url.trim();
      try {
        return new URL(raw).toString();
      } catch {
        try {
          return new URL(`https://${raw}`).toString();
        } catch {
          return "";
        }
      }
    })();

    if (!normalizedUrl) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g. https://example.com/webhook)",
        variant: "destructive",
      });
      return;
    }

    let requestPayload = payload;
    try {
      if (payload.trim()) {
        const parsed = JSON.parse(payload);
        if (includeTimestamp && !parsed.timestamp) {
          parsed.timestamp = new Date().toISOString();
          requestPayload = JSON.stringify(parsed, null, 2);
          setPayload(requestPayload);
        }
      }
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON syntax",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const requestId = Date.now().toString();
    const headers = getHeadersObject();
    
    // Create new history item
    const newRequest: WebhookRequest = {
      id: requestId,
      url: normalizedUrl,
      method,
      payload: requestPayload,
      headers,
      timestamp: new Date()
    };

    try {
      const startedAt = performance.now();
      const requestOptions: RequestInit = {
        method,
        headers,
      };

      if (method !== "GET" && method !== "HEAD" && requestPayload.trim()) {
        requestOptions.body = requestPayload;
      }

      const response = await fetch(normalizedUrl, requestOptions);
      const responseText = await response.text();
      const responseTime = Math.round(performance.now() - startedAt);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      newRequest.response = {
        status: response.status,
        body: responseText,
        headers: responseHeaders,
        time: responseTime,
      };

      toast({
        title: response.ok ? "Webhook Sent" : "Request Completed With Error",
        description: `Response status: ${response.status}`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      newRequest.error = error instanceof Error ? error.message : "Network request failed";

      toast({
        title: "Request Failed",
        description: newRequest.error,
        variant: "destructive",
      });
    } finally {
      // Add request to history
      setHistory(prev => [newRequest, ...prev]);
      setSelectedHistoryItem(newRequest);
      setIsLoading(false);
    }
  };

  // Clear all history
  const clearHistory = () => {
    setHistory([]);
    setSelectedHistoryItem(null);
    
    toast({
      title: "History Cleared",
      description: "Webhook request history has been cleared",
    });
  };

  // Copy response or payload to clipboard
  const copyToClipboard = (text: string, what: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: `${what} copied to clipboard`,
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: `Error: ${err}`,
          variant: "destructive",
        });
      }
    );
  };
  
  // Export history to JSON file
  const exportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `webhook-history-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    toast({
      title: "History Exported",
      description: "Webhook history has been exported as JSON",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Webhook Simulator</h1>
      <p className="text-gray-600 mb-8">
        Test your webhook endpoints by sending custom HTTP requests with JSON payloads. Track request and response details for debugging.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Configure Webhook</CardTitle>
              <CardDescription>
                Set up your webhook details and payload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="url">Target URL</Label>
                    <Input
                      id="url"
                      placeholder="https://example.com/webhook"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">HTTP Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger id="method">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Request Headers</Label>
                    <Button variant="outline" size="sm" onClick={addHeaderField}>
                      Add Header
                    </Button>
                  </div>
                  
                  <div className="space-y-2 border rounded-md p-4">
                    {headerFields.map((field, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 items-center">
                        <Input
                          className="col-span-2"
                          placeholder="Header Name"
                          value={field.key}
                          onChange={(e) => updateHeaderField(index, "key", e.target.value)}
                        />
                        <Input
                          className="col-span-2"
                          placeholder="Value"
                          value={field.value}
                          onChange={(e) => updateHeaderField(index, "value", e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => removeHeaderField(index)}
                          disabled={index === 0 && headerFields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Payload Template</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-timestamp" 
                        checked={includeTimestamp}
                        onCheckedChange={(checked) => setIncludeTimestamp(!!checked)}
                      />
                      <Label htmlFor="include-timestamp" className="text-sm">Include timestamp</Label>
                    </div>
                  </div>
                  
                  <Tabs value={template} onValueChange={setTemplate} className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="custom">Custom JSON</TabsTrigger>
                      <TabsTrigger value="stripe">Stripe</TabsTrigger>
                      <TabsTrigger value="github">GitHub</TabsTrigger>
                      <TabsTrigger value="slack">Slack</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="custom">
                      <div className="relative">
                        <Textarea
                          placeholder="Enter your JSON payload"
                          className="min-h-[200px] font-mono text-sm"
                          value={payload}
                          onChange={(e) => setPayload(e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={formatJson}
                        >
                          <Code className="h-4 w-4 mr-1" />
                          Format
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="stripe">
                      <div className="bg-muted p-4 rounded-md mb-4">
                        <p className="text-sm text-muted-foreground mb-2">This template simulates a Stripe payment_intent.succeeded event.</p>
                      </div>
                      <Textarea
                        className="min-h-[200px] font-mono text-sm"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="github">
                      <div className="bg-muted p-4 rounded-md mb-4">
                        <p className="text-sm text-muted-foreground mb-2">This template simulates a GitHub push event.</p>
                      </div>
                      <Textarea
                        className="min-h-[200px] font-mono text-sm"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="slack">
                      <div className="bg-muted p-4 rounded-md mb-4">
                        <p className="text-sm text-muted-foreground mb-2">This template simulates a Slack message event.</p>
                      </div>
                      <Textarea
                        className="min-h-[200px] font-mono text-sm"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="pt-2">
                  <Button 
                    disabled={!url || isLoading} 
                    onClick={sendWebhook}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Webhook
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {selectedHistoryItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span>Request Details</span>
                    <Badge 
                      variant={selectedHistoryItem.response?.status && selectedHistoryItem.response.status < 400 ? "default" : "destructive"} 
                      className="ml-3"
                    >
                      {selectedHistoryItem.response?.status || "Failed"}
                    </Badge>
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(selectedHistoryItem.payload, "Request payload")}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Request
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {selectedHistoryItem.timestamp.toLocaleString()}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Request</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm font-semibold flex items-center">
                      <span className={`mr-2 px-2 py-0.5 rounded text-xs ${
                        selectedHistoryItem.method === "GET" ? "bg-blue-100 text-blue-800" :
                        selectedHistoryItem.method === "POST" ? "bg-green-100 text-green-800" :
                        selectedHistoryItem.method === "PUT" ? "bg-yellow-100 text-yellow-800" :
                        selectedHistoryItem.method === "DELETE" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {selectedHistoryItem.method}
                      </span>
                      {selectedHistoryItem.url}
                    </p>
                    
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground">Headers:</p>
                      <div className="mt-1 text-xs font-mono">
                        {Object.entries(selectedHistoryItem.headers).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-12 gap-2">
                            <span className="col-span-3 text-muted-foreground">{key}:</span>
                            <span className="col-span-9">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {selectedHistoryItem.method !== "GET" && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground">Payload:</p>
                        <pre className="mt-1 text-xs overflow-auto max-h-36 p-2 bg-background rounded">
                          {selectedHistoryItem.payload}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedHistoryItem.response && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center">
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Response
                        <span className="ml-2 text-muted-foreground text-xs">
                          ({selectedHistoryItem.response.time}ms)
                        </span>
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(selectedHistoryItem.response?.body ?? "", "Response body")}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm font-semibold flex items-center">
                        <span className={`mr-2 px-2 py-0.5 rounded text-xs ${
                          selectedHistoryItem.response.status < 300 ? "bg-green-100 text-green-800" :
                          selectedHistoryItem.response.status < 400 ? "bg-blue-100 text-blue-800" :
                          selectedHistoryItem.response.status < 500 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {selectedHistoryItem.response.status}
                        </span>
                        {selectedHistoryItem.response.status < 300 ? "Success" :
                         selectedHistoryItem.response.status < 400 ? "Redirect" :
                         selectedHistoryItem.response.status < 500 ? "Client Error" :
                         "Server Error"}
                      </p>
                      
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground">Headers:</p>
                        <div className="mt-1 text-xs font-mono">
                          {Object.entries(selectedHistoryItem.response.headers).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-12 gap-2">
                              <span className="col-span-3 text-muted-foreground">{key}:</span>
                              <span className="col-span-9">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground">Body:</p>
                        <pre className="mt-1 text-xs overflow-auto max-h-36 p-2 bg-background rounded">
                          {selectedHistoryItem.response.body || "(empty response)"}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedHistoryItem.error && (
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="mt-1 text-sm text-red-700">{selectedHistoryItem.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>History</span>
                <div className="flex space-x-2">
                  {history.length > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={exportHistory}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearHistory}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Recent webhook requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-md">
                  <p className="text-muted-foreground">No webhook history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send a webhook to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors ${
                        selectedHistoryItem?.id === item.id ? "border-primary bg-accent/40" : ""
                      }`}
                      onClick={() => setSelectedHistoryItem(item)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className={`mr-2 px-1.5 py-0.5 rounded text-xs ${
                            item.method === "GET" ? "bg-blue-100 text-blue-800" :
                            item.method === "POST" ? "bg-green-100 text-green-800" :
                            item.method === "PUT" ? "bg-yellow-100 text-yellow-800" :
                            item.method === "DELETE" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {item.method}
                          </span>
                          <span className="text-sm font-medium truncate max-w-[140px]">
                            {new URL(item.url).hostname}
                          </span>
                        </div>
                        {item.response ? (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            item.response.status < 400 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {item.response.status}
                          </span>
                        ) : item.error ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="truncate flex items-center">
                          <ArrowRight className="h-3 w-3 mr-1 inline" />
                          <span className="truncate max-w-[100px]">
                            {new URL(item.url).pathname}
                          </span>
                        </div>
                        <div>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}