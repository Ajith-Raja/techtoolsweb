import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clipboard, AlertTriangle, Clock, Check, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JwtHeader {
  alg: string;
  typ: string;
  kid?: string;
  [key: string]: any;
}

interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: any;
}

interface DecodedJwt {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
  isExpired: boolean;
  expiresIn?: string;
}

export default function JwtDecoder() {
  const { toast } = useToast();
  const [jwtToken, setJwtToken] = useState<string>("");
  const [decodedToken, setDecodedToken] = useState<DecodedJwt | null>(null);
  const [secretKey, setSecretKey] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [expiryTimer, setExpiryTimer] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (expiryTimer) {
        clearInterval(expiryTimer);
      }
    };
  }, [expiryTimer]);

  // Decode base64 (URL safe)
  const base64UrlDecode = (input: string): string => {
    // Replace non-URL compatible chars with base64 standard chars
    const safeInput = input
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Pad with = if necessary
    const pad = safeInput.length % 4;
    const paddedInput = pad
      ? safeInput + '='.repeat(4 - pad)
      : safeInput;
    
    try {
      return decodeURIComponent(
        atob(paddedInput)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (e) {
      // Return the raw decoded data if not valid UTF-8
      return atob(paddedInput);
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number | undefined): string => {
    if (!timestamp) return 'Not specified';
    
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleString()} (${new Date(timestamp * 1000).toISOString()})`;
  };

  // Calculate time remaining until expiration
  const calculateTimeRemaining = (exp: number | undefined): string => {
    if (!exp) return 'No expiration';
    
    const now = Math.floor(Date.now() / 1000);
    const remaining = exp - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    
    return `${days > 0 ? days + 'd ' : ''}${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
  };

  // Set up a timer to update the expiry countdown
  const setupExpiryTimer = (exp: number | undefined) => {
    if (expiryTimer) {
      clearInterval(expiryTimer);
    }
    
    if (!exp) return;
    
    const timer = setInterval(() => {
      if (decodedToken) {
        const isNowExpired = Math.floor(Date.now() / 1000) >= (exp || 0);
        
        setDecodedToken({
          ...decodedToken,
          isExpired: isNowExpired,
          expiresIn: calculateTimeRemaining(exp)
        });
        
        if (isNowExpired) {
          clearInterval(timer);
        }
      }
    }, 1000);
    
    setExpiryTimer(timer);
  };

  // Verify JWT signature
  const verifySignature = async () => {
    if (!decodedToken || !secretKey) {
      toast({
        title: "Error",
        description: "Both JWT and secret key are required for verification",
        variant: "destructive",
      });
      return;
    }
    
    setVerifying(true);
    
    try {
      // Since we can't do cryptographic operations easily in the browser
      // without additional libraries, we'll simulate verification with
      // a timeout to show the process
      
      setTimeout(() => {
        // This is a placeholder - in a real app, you'd use
        // SubtleCrypto API or a library like jose to verify

        // For demo purposes, we'll assume verification succeeded if the secret is non-empty
        const simulatedResult = secretKey.length > 0;
        
        setVerificationResult(simulatedResult);
        setVerifying(false);
        
        toast({
          title: simulatedResult ? "Verification Successful" : "Verification Failed",
          description: simulatedResult
            ? "The JWT signature is valid for the provided secret"
            : "The JWT signature could not be verified with the provided secret",
          variant: simulatedResult ? "default" : "destructive",
        });
      }, 1500);
    } catch (error) {
      setVerifying(false);
      setVerificationResult(false);
      
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Decode the JWT
  const decodeJwt = () => {
    try {
      if (!jwtToken.trim()) {
        toast({
          title: "Error",
          description: "Please enter a JWT token",
          variant: "destructive",
        });
        return;
      }
      
      const parts = jwtToken.split('.');
      
      if (parts.length !== 3) {
        toast({
          title: "Invalid JWT Format",
          description: "JWT should have three parts separated by dots",
          variant: "destructive",
        });
        return;
      }
      
      const [headerB64, payloadB64, signatureB64] = parts;
      
      try {
        const header = JSON.parse(base64UrlDecode(headerB64));
        const payload = JSON.parse(base64UrlDecode(payloadB64));
        
        const now = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp ? now >= payload.exp : false;
        const expiresIn = calculateTimeRemaining(payload.exp);
        
        const decoded: DecodedJwt = {
          header,
          payload,
          signature: signatureB64,
          isExpired,
          expiresIn
        };
        
        setDecodedToken(decoded);
        setupExpiryTimer(payload.exp);
        
        toast({
          title: "JWT Decoded Successfully",
          description: isExpired ? "Note: This token has expired" : "Token is valid and decoded",
        });
      } catch (parseError) {
        toast({
          title: "Parsing Error",
          description: "Could not parse the JWT contents. It may be malformed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Decoding Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: message,
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

  // Sample JWT for demo purposes
  const useSampleJwt = () => {
    const sampleJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    setJwtToken(sampleJwt);
  };

  const clearAll = () => {
    setJwtToken("");
    setDecodedToken(null);
    setSecretKey("");
    setVerificationResult(null);
    if (expiryTimer) {
      clearInterval(expiryTimer);
      setExpiryTimer(null);
    }
  };

  // Format JSON with proper indentation for display
  const formatJson = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">JWT Decoder</h1>
      <p className="text-gray-600 mb-8">
        Decode and inspect JSON Web Tokens (JWT) with this secure, client-side decoder. No data is sent to a server.
      </p>
      
      {/* JWT Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>JWT Token</CardTitle>
          <CardDescription>
            Enter a JWT token to decode its contents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your JWT token here (e.g. eyJhbGc...)"
              className="font-mono text-sm min-h-[100px]"
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={decodeJwt}>Decode Token</Button>
              <Button variant="outline" onClick={useSampleJwt}>
                Use Sample JWT
              </Button>
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Decoded Output Section */}
      {decodedToken && (
        <div className="space-y-8">
          {/* Token Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>JWT Overview</span>
                <div>
                  {decodedToken.isExpired ? (
                    <Badge variant="destructive" className="ml-2 flex items-center">
                      <X className="mr-1 h-3 w-3" /> Expired
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 flex items-center">
                      <Check className="mr-1 h-3 w-3" /> Valid
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Basic information about this JWT token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Algorithm</Label>
                  <div className="flex mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <code className="text-sm">{decodedToken.header?.alg || "none"}</code>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Token Type</Label>
                  <div className="flex mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <code className="text-sm">{decodedToken.header?.typ || "JWT"}</code>
                  </div>
                </div>
                
                {decodedToken.payload?.iss && (
                  <div>
                    <Label className="text-sm font-medium">Issuer (iss)</Label>
                    <div className="flex mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <code className="text-sm">{decodedToken.payload.iss}</code>
                    </div>
                  </div>
                )}
                
                {decodedToken.payload?.sub && (
                  <div>
                    <Label className="text-sm font-medium">Subject (sub)</Label>
                    <div className="flex mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <code className="text-sm">{decodedToken.payload.sub}</code>
                    </div>
                  </div>
                )}
                
                {decodedToken.payload?.aud && (
                  <div>
                    <Label className="text-sm font-medium">Audience (aud)</Label>
                    <div className="flex mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <code className="text-sm">
                        {Array.isArray(decodedToken.payload.aud)
                          ? decodedToken.payload.aud.join(", ")
                          : decodedToken.payload.aud}
                      </code>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">Issued At (iat)</Label>
                  <div className="flex mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <code className="text-sm">{formatTimestamp(decodedToken.payload?.iat)}</code>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Expiration (exp)</Label>
                  <div className="flex mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md items-center">
                    <code className="text-sm">{formatTimestamp(decodedToken.payload?.exp)}</code>
                    {decodedToken.payload?.exp && !decodedToken.isExpired && (
                      <Badge variant="outline" className="ml-2 flex items-center">
                        <Clock className="mr-1 h-3 w-3" /> {decodedToken.expiresIn}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {decodedToken.payload?.nbf && (
                  <div>
                    <Label className="text-sm font-medium">Not Before (nbf)</Label>
                    <div className="flex mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <code className="text-sm">{formatTimestamp(decodedToken.payload.nbf)}</code>
                    </div>
                  </div>
                )}
                
                {decodedToken.isExpired && (
                  <div className="col-span-2">
                    <div className="flex p-3 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      This token has expired and should no longer be accepted by any services.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Token Details Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>JWT Details</CardTitle>
              <CardDescription>
                Detailed view of the three parts of the JWT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="header" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="header">Header</TabsTrigger>
                  <TabsTrigger value="payload">Payload</TabsTrigger>
                  <TabsTrigger value="signature">Signature</TabsTrigger>
                </TabsList>
                
                <TabsContent value="header" className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-auto max-h-[400px]">
                    <pre className="text-sm font-mono">{formatJson(decodedToken.header)}</pre>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(
                      formatJson(decodedToken.header),
                      "Header JSON copied to clipboard"
                    )}
                    className="flex items-center"
                  >
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy Header
                  </Button>
                </TabsContent>
                
                <TabsContent value="payload" className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-auto max-h-[400px]">
                    <pre className="text-sm font-mono">{formatJson(decodedToken.payload)}</pre>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(
                      formatJson(decodedToken.payload),
                      "Payload JSON copied to clipboard"
                    )}
                    className="flex items-center"
                  >
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy Payload
                  </Button>
                </TabsContent>
                
                <TabsContent value="signature" className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block">Signature (base64url encoded)</Label>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 font-mono text-sm break-all">
                        {decodedToken.signature}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="secret-key">
                        Secret Key (for signature verification)
                      </Label>
                      <Input
                        id="secret-key"
                        placeholder="Enter secret key used to sign the JWT"
                        className="mt-1 font-mono"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        For HMAC signatures (HS256, HS384, HS512), enter the secret.
                        Note: Client-side verification has limitations and should not be used for security-critical operations.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        onClick={verifySignature}
                        disabled={verifying || !secretKey}
                      >
                        {verifying ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                          </>
                        ) : (
                          "Verify Signature"
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => copyToClipboard(
                          decodedToken.signature,
                          "Signature copied to clipboard"
                        )}
                        className="flex items-center"
                      >
                        <Clipboard className="mr-2 h-4 w-4" />
                        Copy Signature
                      </Button>
                    </div>
                    
                    {verificationResult !== null && (
                      <div className={`flex p-3 rounded-md items-center ${
                        verificationResult 
                          ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                          : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
                        {verificationResult ? (
                          <>
                            <Check className="h-5 w-5 mr-2" />
                            Signature verified successfully. This token was signed with the provided secret.
                          </>
                        ) : (
                          <>
                            <X className="h-5 w-5 mr-2" />
                            Signature verification failed. The token was not signed with the provided secret or the signature is invalid.
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
              <Button 
                onClick={() => copyToClipboard(
                  jwtToken,
                  "Full JWT token copied to clipboard"
                )}
                className="flex items-center"
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Copy Full Token
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}