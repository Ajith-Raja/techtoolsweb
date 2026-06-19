
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface DomainInfo {
  domain: string;
  age: string;
  createdDate: string;
  expiryDate: string;
  lastUpdated: string;
  registrar: string;
  ipAddress: string;
  nameServers: string[];
}

export default function DomainAgeChecker() {
  const [domains, setDomains] = useState<string>("");
  const [results, setResults] = useState<DomainInfo[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<DomainInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Process the input domains into an array
  const parseDomains = (input: string): string[] => {
    return input
      .split(/[\n,]/)  // Split by newline or comma
      .map(domain => domain.trim())
      .filter(domain => domain !== "");  // Remove empty entries
  };

  // Validate domains for API call
  const validateDomains = (domainList: string[]): { valid: boolean; message?: string } => {
    // Check if there are any domains
    if (domainList.length === 0) {
      return { valid: false, message: "Please enter at least one domain" };
    }
    
    // Check if there are more than 5 domains
    if (domainList.length > 5) {
      return { valid: false, message: "Maximum 5 domains allowed" };
    }
    
    // Validate each domain format (basic validation)
    const invalidDomains = domainList.filter(domain => {
      // Simple domain format validation (can be enhanced)
      return !/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain) && 
             !/^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/.test(domain);
    });
    
    if (invalidDomains.length > 0) {
      return { 
        valid: false, 
        message: `Invalid domain format: ${invalidDomains.join(", ")}` 
      };
    }
    
    return { valid: true };
  };

  const handleCheck = async () => {
    setError(null);
    
    // Parse and validate domains
    const domainList = parseDomains(domains);
    const validation = validateDomains(domainList);
    
    if (!validation.valid) {
      setError(validation.message || "Invalid domains");
      return;
    }
    
    try {
      setIsLoading(true);
      debugger;
      // Call the API
      const response = await apiRequest("POST", "http://localhost:8000/api/domain-age", { domains: domainList });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check domain age");
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Domain age check error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative isolate">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Domain Age Checker
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Check the age and registration details of multiple domains
          </p>
        </div>

        <Card className="mt-12">
          <CardContent className="pt-6">
            <Textarea
              placeholder="Enter Upto 5 URLs (starts with https://)"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              rows={5}
            />
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button 
              className="w-full mt-4"
              onClick={handleCheck}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Age"
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Domain Name
                    </TableHead>
                    <TableHead>Domain Age</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.domain}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-1 p-0 h-4 w-4"
                          onClick={() => setSelectedDomain(result)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>{result.age}</TableCell>
                      <TableCell>{result.createdDate}</TableCell>
                      <TableCell>{result.expiryDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Domain Details Dialog */}
              <Dialog open={!!selectedDomain} onOpenChange={(open) => !open && setSelectedDomain(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Domain Details: {selectedDomain?.domain}</DialogTitle>
                    <DialogDescription>
                      Complete registration information and technical details
                    </DialogDescription>
                  </DialogHeader>
                  {selectedDomain && (
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium">Last Updated:</div>
                        <div>{selectedDomain.lastUpdated}</div>
                        
                        <div className="font-medium">Registrar:</div>
                        <div>{selectedDomain.registrar}</div>
                        
                        <div className="font-medium">IP Address:</div>
                        <div>{selectedDomain.ipAddress}</div>
                        
                        <div className="font-medium">Name Servers:</div>
                        <div>{selectedDomain.nameServers}</div>
                        
                        <div className="font-medium">Domain Age:</div>
                        <div>{selectedDomain.age}</div>
                        
                        <div className="font-medium">Created Date:</div>
                        <div>{selectedDomain.createdDate}</div>
                        
                        <div className="font-medium">Expiry Date:</div>
                        <div>{selectedDomain.expiryDate}</div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>About Domain Age Checking</CardTitle>
            <CardDescription>
              Understanding domain age and registration details is crucial for SEO and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Domain age is an important factor that search engines consider when ranking websites. Older domains typically have more trust and authority.</p>
            
            <h3 className="text-xl font-semibold mt-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Why is domain age important?</h4>
                <p>Domain age can indicate website trustworthiness and stability.</p>
              </div>
              <div>
                <h4 className="font-medium">How often should I check domain details?</h4>
                <p>It's recommended to check domain details periodically, especially before domain expiration.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
