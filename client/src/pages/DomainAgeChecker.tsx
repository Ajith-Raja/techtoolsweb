
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Info } from "lucide-react";
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

  const handleCheck = async () => {
    // Mock data for demonstration
    const mockResults: DomainInfo[] = [
      {
        domain: "example.com",
        age: "1 Years 5 Months 3 Days",
        createdDate: "2022-05-15",
        expiryDate: "2024-05-15",
        lastUpdated: "2023-09-01",
        registrar: "GoDaddy",
        ipAddress: "192.168.1.1",
        nameServers: ["ns1.example.com", "ns2.example.com"]
      }
    ];
    setResults(mockResults);
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
            <Button 
              className="w-full mt-4"
              onClick={handleCheck}
            >
              Check Age
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <ChevronDown className="ml-1 h-4 w-4 inline" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-2">
                              <p>Last Updated: {results[0].lastUpdated}</p>
                              <p>Registrar: {results[0].registrar}</p>
                              <p>IP Address: {results[0].ipAddress}</p>
                              <p>Name Servers: {results[0].nameServers.join(", ")}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>Domain Age</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.domain}</TableCell>
                      <TableCell>{result.age}</TableCell>
                      <TableCell>{result.createdDate}</TableCell>
                      <TableCell>{result.expiryDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
