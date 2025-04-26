import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Delete, ChevronDown, ChevronUp, Copy, Save, PlayCircle, Clock, Share2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';

// Define types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
type BodyType = 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary';
type RawBodyFormat = 'json' | 'xml' | 'html' | 'text';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

interface ApiRequestParams {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  bodyType: BodyType;
  rawBodyFormat?: RawBodyFormat;
  body?: string;
  formData?: KeyValuePair[];
  auth: {
    type: 'none' | 'basic' | 'bearer' | 'api_key';
    username?: string;
    password?: string;
    token?: string;
    key_name?: string;
    key_value?: string;
    in?: 'header' | 'query';
  };
}

interface ApiResponseData {
  request_id: string;
  request: any;
  status_code: number;
  headers: Record<string, string>;
  body: any;
  cookies: Record<string, string>;
  time_taken: number;
  size: number;
  timestamp: string;
}

// Initial request state
const initialRequest: ApiRequestParams = {
  method: 'GET',
  url: '',
  headers: [],
  queryParams: [],
  bodyType: 'none',
  auth: {
    type: 'none'
  }
};

// Generate random ID for key-value pairs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Format JSON with indentation
const formatJson = (json: string) => {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
};

export default function ApiTester() {
  // Request state
  const [request, setRequest] = useState<ApiRequestParams>(initialRequest);
  
  // Response state
  const [response, setResponse] = useState<ApiResponseData | null>(null);
  const [responseTab, setResponseTab] = useState('body');
  
  // History state
  const [history, setHistory] = useState<ApiResponseData[]>([]);
  
  // UI state
  const [showHeaders, setShowHeaders] = useState(false);
  const [showQueryParams, setShowQueryParams] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  
  // Parse search params
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const shareId = searchParams.get('share');
  
  // Refs for editor
  const bodyEditorRef = useRef<HTMLTextAreaElement>(null);
  
  // Function to fetch a shared request
  const fetchSharedRequest = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Use our Node.js proxy endpoint
      const response = await fetch(`/api/shared/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load shared request');
      }
      
      const data = await response.json();
      
      if (data && data.request_data) {
        // Convert the API format back to the component format
        const apiRequest = data.request_data;
        
        // Initialize the request
        const newRequest: ApiRequestParams = {
          method: apiRequest.method || 'GET',
          url: apiRequest.url || '',
          headers: [],
          queryParams: [],
          bodyType: apiRequest.body_type || 'none',
          rawBodyFormat: apiRequest.raw_body_format,
          body: typeof apiRequest.body === 'object' 
            ? JSON.stringify(apiRequest.body, null, 2) 
            : apiRequest.body,
          auth: apiRequest.auth || { type: 'none' }
        };
        
        // Add headers
        if (apiRequest.headers) {
          newRequest.headers = Object.entries(apiRequest.headers).map(([key, value]) => ({
            id: generateId(),
            key,
            value: value as string,
            enabled: true
          }));
        }
        
        // Add query params
        if (apiRequest.query_params) {
          newRequest.queryParams = Object.entries(apiRequest.query_params).map(([key, value]) => ({
            id: generateId(),
            key,
            value: value as string,
            enabled: true
          }));
        }
        
        // Add form data if needed
        if ((apiRequest.body_type === 'form-data' || apiRequest.body_type === 'x-www-form-urlencoded') 
            && apiRequest.form_data) {
          newRequest.formData = Object.entries(apiRequest.form_data).map(([key, value]) => ({
            id: generateId(),
            key,
            value: value as string,
            enabled: true
          }));
        }
        
        setRequest(newRequest);
        
        toast({
          title: "Shared Request Loaded",
          description: "The shared API request has been loaded successfully."
        });
      }
    } catch (error) {
      console.error('Failed to load shared request:', error);
      toast({
        title: "Error Loading Shared Request",
        description: error instanceof Error ? error.message : "The shared request could not be loaded or has expired.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle method change
  const handleMethodChange = (value: HttpMethod) => {
    setRequest(prev => ({ ...prev, method: value }));
  };

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequest(prev => ({ ...prev, url: e.target.value }));
  };

  // Handle adding key-value pair
  const addKeyValuePair = (type: 'headers' | 'queryParams' | 'formData') => {
    setRequest(prev => {
      const newPair: KeyValuePair = { id: generateId(), key: '', value: '', enabled: true };
      return {
        ...prev,
        [type]: [...(prev[type] || []), newPair]
      };
    });
  };

  // Handle removing key-value pair
  const removeKeyValuePair = (type: 'headers' | 'queryParams' | 'formData', id: string) => {
    setRequest(prev => ({
      ...prev,
      [type]: prev[type]?.filter(pair => pair.id !== id) || []
    }));
  };

  // Handle updating key-value pair
  const updateKeyValuePair = (
    type: 'headers' | 'queryParams' | 'formData',
    id: string,
    field: 'key' | 'value' | 'description' | 'enabled',
    value: string | boolean
  ) => {
    setRequest(prev => ({
      ...prev,
      [type]: prev[type]?.map(pair => 
        pair.id === id ? { ...pair, [field]: value } : pair
      ) || []
    }));
  };

  // Handle body type change
  const handleBodyTypeChange = (value: BodyType) => {
    setRequest(prev => ({ ...prev, bodyType: value }));
  };

  // Handle raw body format change
  const handleRawFormatChange = (value: RawBodyFormat) => {
    setRequest(prev => ({ ...prev, rawBodyFormat: value }));
  };

  // Handle body content change
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRequest(prev => ({ ...prev, body: e.target.value }));
  };

  // Handle auth type change
  const handleAuthTypeChange = (value: 'none' | 'basic' | 'bearer' | 'api_key') => {
    setRequest(prev => ({
      ...prev,
      auth: { ...prev.auth, type: value }
    }));
  };

  // Handle auth field change
  const handleAuthFieldChange = (field: string, value: string) => {
    setRequest(prev => ({
      ...prev,
      auth: { ...prev.auth, [field]: value }
    }));
  };

  // Transform request for API
  const transformRequestForApi = () => {
    // Create a copy of the request
    const apiRequest: any = {
      method: request.method,
      url: request.url,
      headers: {},
      query_params: {},
      body_type: request.bodyType,
    };
    
    // Add enabled headers
    request.headers
      .filter(h => h.enabled && h.key)
      .forEach(h => {
        apiRequest.headers[h.key] = h.value;
      });
    
    // Add enabled query params
    request.queryParams
      .filter(q => q.enabled && q.key)
      .forEach(q => {
        apiRequest.query_params[q.key] = q.value;
      });
    
    // Add body based on type
    if (request.bodyType === 'raw' && request.body) {
      apiRequest.raw_body_format = request.rawBodyFormat;
      
      // Try to parse JSON if that's the format
      if (request.rawBodyFormat === 'json') {
        try {
          apiRequest.body = JSON.parse(request.body);
        } catch {
          apiRequest.body = request.body;
        }
      } else {
        apiRequest.body = request.body;
      }
    } else if (request.bodyType === 'form-data' && request.formData) {
      apiRequest.form_data = {};
      request.formData
        .filter(f => f.enabled && f.key)
        .forEach(f => {
          apiRequest.form_data[f.key] = f.value;
        });
    } else if (request.bodyType === 'x-www-form-urlencoded' && request.formData) {
      apiRequest.form_data = {};
      request.formData
        .filter(f => f.enabled && f.key)
        .forEach(f => {
          apiRequest.form_data[f.key] = f.value;
        });
    }
    
    // Add auth if not 'none'
    if (request.auth && request.auth.type !== 'none') {
      apiRequest.auth = { ...request.auth };
    }
    
    return apiRequest;
  };

  // Execute request
  const executeRequest = async () => {
    if (!request.url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to make a request",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const apiRequestData = transformRequestForApi();
      
      try {
        // Use our Node.js proxy endpoint to connect to the FastAPI server
        const result = await apiRequest("POST", "/api/execute-request", apiRequestData);
        const responseData = await result.json() as ApiResponseData;
        
        setResponse(responseData);
        setHistory(prev => [responseData, ...prev]);
      } catch (error) {
        console.error('API Server Error:', error);
        toast({
          title: "API Server Not Running",
          description: "The API server is not running. Please start it by running 'python start_api_server.py' in a terminal.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Request failed:', error);
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy response to clipboard
  const copyResponseToClipboard = () => {
    if (!response) return;
    
    let textToCopy = '';
    
    if (responseTab === 'body') {
      if (typeof response.body === 'object') {
        textToCopy = JSON.stringify(response.body, null, 2);
      } else {
        textToCopy = String(response.body);
      }
    } else if (responseTab === 'headers') {
      textToCopy = Object.entries(response.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    } else if (responseTab === 'cookies') {
      textToCopy = Object.entries(response.cookies)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }
    
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard",
      description: `Response ${responseTab} copied to clipboard`
    });
  };
  
  // Share request
  const shareRequest = async () => {
    try {
      setIsSharing(true);
      setShareUrl(null);
      
      const apiRequestData = transformRequestForApi();
      
      // Send the request to our Node.js proxy endpoint
      const response = await fetch('/api/share-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_data: apiRequestData })
      });
      
      if (!response.ok) {
        throw new Error('Failed to share request');
      }
      
      const data = await response.json();
      
      // Generate the shareable URL
      const baseUrl = window.location.origin;
      const shareableUrl = `${baseUrl}/api-tester?share=${data.share_id}`;
      
      setShareUrl(shareableUrl);
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share Failed",
        description: error instanceof Error ? error.message : "Failed to create shareable link",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  // Copy share URL to clipboard
  const copyShareUrl = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl);
    setShareUrlCopied(true);
    
    toast({
      title: "Copied to clipboard",
      description: "Shareable link copied to clipboard"
    });
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setShareUrlCopied(false);
    }, 2000);
  };

  // Render different form input based on auth type
  const renderAuthForm = () => {
    if (!request.auth) return null;
    
    switch(request.auth.type) {
      case 'basic':
        return (
          <div className="space-y-3 mt-3">
            <div>
              <Label htmlFor="auth-username">Username</Label>
              <Input 
                id="auth-username"
                value={request.auth.username || ''}
                onChange={(e) => handleAuthFieldChange('username', e.target.value)}
                placeholder="Username"
              />
            </div>
            <div>
              <Label htmlFor="auth-password">Password</Label>
              <Input 
                id="auth-password"
                type="password"
                value={request.auth.password || ''}
                onChange={(e) => handleAuthFieldChange('password', e.target.value)}
                placeholder="Password"
              />
            </div>
          </div>
        );
      
      case 'bearer':
        return (
          <div className="mt-3">
            <Label htmlFor="auth-token">Token</Label>
            <Input 
              id="auth-token"
              value={request.auth.token || ''}
              onChange={(e) => handleAuthFieldChange('token', e.target.value)}
              placeholder="Bearer Token"
            />
          </div>
        );
      
      case 'api_key':
        return (
          <div className="space-y-3 mt-3">
            <div>
              <Label htmlFor="auth-key-name">Key Name</Label>
              <Input 
                id="auth-key-name"
                value={request.auth.key_name || ''}
                onChange={(e) => handleAuthFieldChange('key_name', e.target.value)}
                placeholder="API Key Name (e.g. X-API-KEY)"
              />
            </div>
            <div>
              <Label htmlFor="auth-key-value">Key Value</Label>
              <Input 
                id="auth-key-value"
                value={request.auth.key_value || ''}
                onChange={(e) => handleAuthFieldChange('key_value', e.target.value)}
                placeholder="API Key Value"
              />
            </div>
            <div>
              <Label htmlFor="auth-key-in">Add to</Label>
              <Select 
                value={request.auth.in || 'header'}
                onValueChange={(value: 'header' | 'query') => handleAuthFieldChange('in', value)}
              >
                <SelectTrigger id="auth-key-in">
                  <SelectValue placeholder="Where to add the key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="query">Query Parameter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render body input based on body type
  const renderBodyInput = () => {
    switch(request.bodyType) {
      case 'none':
        return (
          <div className="p-4 text-center text-muted-foreground bg-muted/20 rounded-md">
            This request does not have a body
          </div>
        );
      
      case 'raw':
        return (
          <div className="space-y-3">
            <div>
              <Select
                value={request.rawBodyFormat || 'json'}
                onValueChange={(value: RawBodyFormat) => handleRawFormatChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              ref={bodyEditorRef}
              value={request.body || ''}
              onChange={handleBodyChange}
              placeholder={request.rawBodyFormat === 'json' ? '{\n  "key": "value"\n}' : 'Enter raw body content'}
              className="font-mono min-h-[200px]"
            />
          </div>
        );
      
      case 'form-data':
      case 'x-www-form-urlencoded':
        return (
          <div className="space-y-3">
            {request.formData && request.formData.map((pair) => (
              <div key={pair.id} className="flex items-start space-x-2">
                <Input
                  value={pair.key}
                  onChange={(e) => updateKeyValuePair('formData', pair.id, 'key', e.target.value)}
                  placeholder="Key"
                  className="w-1/3"
                />
                <Input
                  value={pair.value}
                  onChange={(e) => updateKeyValuePair('formData', pair.id, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyValuePair('formData', pair.id)}
                >
                  <Delete className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addKeyValuePair('formData')}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Parameter
            </Button>
          </div>
        );
      
      case 'binary':
        return (
          <div className="p-4 text-center text-muted-foreground bg-muted/20 rounded-md">
            Binary file upload - not implemented in this demo
          </div>
        );
      
      default:
        return null;
    }
  };

  // Helper function to detect content type
  const detectContentType = (): 'json' | 'html' | 'text' => {
    if (!response) return 'text';
    
    // Check Content-Type header (case-insensitive)
    const contentTypeHeader = Object.keys(response.headers).find(
      key => key.toLowerCase() === 'content-type'
    );
    
    if (contentTypeHeader) {
      const contentType = response.headers[contentTypeHeader].toLowerCase();
      if (contentType.includes('application/json')) return 'json';
      if (contentType.includes('text/html') || contentType.includes('application/html')) return 'html';
    }
    
    // Try to detect based on content
    if (typeof response.body === 'object') return 'json';
    
    if (typeof response.body === 'string') {
      // Check if it looks like HTML
      if (response.body.trim().startsWith('<') && response.body.includes('</')) return 'html';
      
      // Check if it looks like JSON
      try {
        JSON.parse(response.body);
        return 'json';
      } catch {
        // Not JSON
      }
    }
    
    return 'text';
  };
  
  // Load shared request if share ID is present
  useEffect(() => {
    if (shareId) {
      fetchSharedRequest(shareId);
    }
  }, [shareId]);

  // Apply Prism highlighting when response or tab changes
  useEffect(() => {
    if (response && responseTab === 'body') {
      // Use a small timeout to ensure the DOM has been updated
      const timeoutId = setTimeout(() => {
        Prism.highlightAll();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [response, responseTab]);
  
  // Function to render content with syntax highlighting
  const renderHighlightedContent = () => {
    if (!response) return null;
    
    const contentType = detectContentType();
    let content = '';
    
    if (typeof response.body === 'object') {
      content = JSON.stringify(response.body, null, 2);
    } else {
      content = String(response.body);
    }
    
    // Apply appropriate class based on content type
    const languageClass = 
      contentType === 'json' ? 'language-json' : 
      contentType === 'html' ? 'language-markup' : 
      'language-text';
    
    return (
      <pre className={`${languageClass} font-mono text-sm whitespace-pre-wrap break-words`}>
        <code className={languageClass}>
          {content}
        </code>
      </pre>
    );
  };

  // Render response based on tab
  const renderResponseView = () => {
    if (!response) return (
      <div className="p-4 text-center text-muted-foreground">
        Response will appear here after sending a request
      </div>
    );
    
    const statusColor = response.status_code < 300 ? 'text-green-500' : 
                         response.status_code < 400 ? 'text-yellow-500' : 'text-red-500';
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`font-bold ${statusColor}`}>{response.status_code}</span>
            <span className="text-muted-foreground">{response.time_taken.toFixed(0)} ms</span>
            <span className="text-muted-foreground">{(response.size / 1024).toFixed(2)} KB</span>
          </div>
          <Button variant="ghost" size="sm" onClick={copyResponseToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
        
        <Tabs value={responseTab} onValueChange={setResponseTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="body" className="min-h-[300px]">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {renderHighlightedContent()}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="headers">
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="py-1 border-b last:border-b-0">
                    <div className="font-semibold">{key}</div>
                    <div className="text-sm text-muted-foreground break-words">{value}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="cookies">
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4">
                {Object.keys(response.cookies).length > 0 ? (
                  Object.entries(response.cookies).map(([key, value]) => (
                    <div key={key} className="py-1 border-b last:border-b-0">
                      <div className="font-semibold">{key}</div>
                      <div className="text-sm text-muted-foreground break-words">{value}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground my-4">
                    No cookies found in response
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Render history items
  const renderHistoryItems = () => {
    if (history.length === 0) {
      return (
        <div className="text-center text-muted-foreground my-8">
          Request history will appear here
        </div>
      );
    }
    
    return history.map((item) => {
      const statusColor = item.status_code < 300 ? 'text-green-500' : 
                          item.status_code < 400 ? 'text-yellow-500' : 'text-red-500';
      
      return (
        <div 
          key={item.request_id} 
          className="border rounded-md p-3 mb-2 cursor-pointer hover:bg-accent"
          onClick={() => setResponse(item)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary mr-2">
                {item.request.method}
              </span>
              <span className="text-sm truncate max-w-[250px]">{item.request.url}</span>
            </div>
            <span className={`font-semibold ${statusColor}`}>{item.status_code}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 mr-1" />
            <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
            <span className="mx-2">•</span>
            <span>{item.time_taken.toFixed(0)} ms</span>
          </div>
        </div>
      );
    });
  };

  // Initialize form data when body type changes
  useEffect(() => {
    if ((request.bodyType === 'form-data' || request.bodyType === 'x-www-form-urlencoded') 
        && (!request.formData || request.formData.length === 0)) {
      setRequest(prev => ({
        ...prev,
        formData: [{ id: generateId(), key: '', value: '', enabled: true }]
      }));
    }
  }, [request.bodyType]);

  // Initialize raw body format when body type changes to raw
  useEffect(() => {
    if (request.bodyType === 'raw' && !request.rawBodyFormat) {
      setRequest(prev => ({
        ...prev,
        rawBodyFormat: 'json'
      }));
    }
  }, [request.bodyType, request.rawBodyFormat]);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            API Testing Tool
          </CardTitle>
          <CardDescription>
            Test APIs with different methods, headers, and body formats.
          </CardDescription>
          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> To use this feature, you need to start the FastAPI server by running <code className="bg-yellow-100 dark:bg-yellow-800/40 px-1 rounded">python start_api_server.py</code> in your terminal.
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request URL Bar */}
              <div className="flex space-x-2">
                <Select value={request.method} onValueChange={handleMethodChange}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1 relative">
                  <Input
                    value={request.url}
                    onChange={handleUrlChange}
                    placeholder="Enter request URL"
                    className="w-full"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={executeRequest} 
                    disabled={isLoading || !request.url}
                    className="min-w-[100px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={shareRequest}
                    disabled={isSharing || !request.url}
                    variant="outline"
                  >
                    {isSharing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Share URL display */}
              {shareUrl && (
                <div className="my-3 p-3 border rounded-md bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Shareable Link</h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={copyShareUrl}
                      className="h-8 px-2"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {shareUrlCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-background p-2 rounded border text-sm font-mono break-all">
                    {shareUrl}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This link will expire in 15 days. Anyone with this link can view and run this request.
                  </p>
                </div>
              )}
              
              {/* Request Configuration Tabs */}
              <Tabs defaultValue="params" className="w-full">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="params">Params</TabsTrigger>
                  <TabsTrigger value="auth">Authorization</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                </TabsList>
                
                {/* Query Params Tab */}
                <TabsContent value="params" className="space-y-4">
                  <div className="space-y-3">
                    {request.queryParams.map((param) => (
                      <div key={param.id} className="flex items-start space-x-2">
                        <Input
                          value={param.key}
                          onChange={(e) => updateKeyValuePair('queryParams', param.id, 'key', e.target.value)}
                          placeholder="Key"
                          className="w-1/3"
                        />
                        <Input
                          value={param.value}
                          onChange={(e) => updateKeyValuePair('queryParams', param.id, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeKeyValuePair('queryParams', param.id)}
                        >
                          <Delete className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addKeyValuePair('queryParams')}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Parameter
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Auth Tab */}
                <TabsContent value="auth" className="space-y-4">
                  <Select 
                    value={request.auth?.type || 'none'} 
                    onValueChange={(value: 'none' | 'basic' | 'bearer' | 'api_key') => handleAuthTypeChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auth Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Auth</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {renderAuthForm()}
                </TabsContent>
                
                {/* Headers Tab */}
                <TabsContent value="headers" className="space-y-4">
                  <div className="space-y-3">
                    {request.headers.map((header) => (
                      <div key={header.id} className="flex items-start space-x-2">
                        <Input
                          value={header.key}
                          onChange={(e) => updateKeyValuePair('headers', header.id, 'key', e.target.value)}
                          placeholder="Header Name"
                          className="w-1/3"
                        />
                        <Input
                          value={header.value}
                          onChange={(e) => updateKeyValuePair('headers', header.id, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeKeyValuePair('headers', header.id)}
                        >
                          <Delete className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addKeyValuePair('headers')}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Header
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Body Tab */}
                <TabsContent value="body" className="space-y-4">
                  <div>
                    <Label>Body Type</Label>
                    <Select
                      value={request.bodyType}
                      onValueChange={(value: BodyType) => handleBodyTypeChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Body Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="raw">Raw</SelectItem>
                        <SelectItem value="form-data">Form Data</SelectItem>
                        <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
                        <SelectItem value="binary">Binary File</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {renderBodyInput()}
                </TabsContent>
              </Tabs>
              
              {/* Response Section */}
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-semibold">Response</h3>
                {renderResponseView()}
              </div>
            </div>
            
            {/* History Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Request History</h3>
              <ScrollArea className="h-[700px] rounded-md border p-4">
                {renderHistoryItems()}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}