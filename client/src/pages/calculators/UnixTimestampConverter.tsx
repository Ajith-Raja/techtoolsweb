import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ClockIcon, ArrowRightLeft, Copy, RotateCw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function UnixTimestampConverter() {
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [inputTimestamp, setInputTimestamp] = useState<string>("");
  const [timestampError, setTimestampError] = useState<string>("");
  const [convertedDate, setConvertedDate] = useState<string>("");
  const [dateInput, setDateInput] = useState<string>("");
  const [timeInput, setTimeInput] = useState<string>("");
  const [outputTimestamp, setOutputTimestamp] = useState<string>("");
  const [useMilliseconds, setUseMilliseconds] = useState<boolean>(false);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Update current timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      if (useMilliseconds) {
        setCurrentTimestamp(Date.now());
      } else {
        setCurrentTimestamp(Math.floor(Date.now() / 1000));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [useMilliseconds]);

  // Initialize date and time inputs with current values
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setDateInput(`${year}-${month}-${day}`);
    setTimeInput(`${hours}:${minutes}`);
  }, []);

  // Convert timestamp to date
  useEffect(() => {
    if (!inputTimestamp) {
      setConvertedDate("");
      setTimestampError("");
      return;
    }

    try {
      const timestamp = parseInt(inputTimestamp, 10);
      if (isNaN(timestamp)) {
        setTimestampError("Please enter a valid number");
        setConvertedDate("");
        return;
      }

      // Determine if input is in seconds or milliseconds
      let date;
      if (useMilliseconds) {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp * 1000);
      }

      // Check if date is valid
      if (date.toString() === "Invalid Date") {
        setTimestampError("Invalid timestamp");
        setConvertedDate("");
        return;
      }

      setTimestampError("");
      
      // Format the date
      const formattedDate = date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
      
      setConvertedDate(formattedDate);
    } catch (error) {
      setTimestampError("Error converting timestamp");
      setConvertedDate("");
    }
  }, [inputTimestamp, useMilliseconds, refreshCounter]);

  // Convert date and time to timestamp
  useEffect(() => {
    if (!dateInput || !timeInput) {
      setOutputTimestamp("");
      return;
    }

    try {
      const dateTimeString = `${dateInput}T${timeInput}:00`;
      const date = new Date(dateTimeString);
      
      if (date.toString() === "Invalid Date") {
        setOutputTimestamp("Invalid date/time");
        return;
      }
      
      if (useMilliseconds) {
        setOutputTimestamp(date.getTime().toString());
      } else {
        setOutputTimestamp(Math.floor(date.getTime() / 1000).toString());
      }
    } catch (error) {
      setOutputTimestamp("Error converting date");
    }
  }, [dateInput, timeInput, useMilliseconds]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshTimestamp = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Unix Timestamp Converter</h1>
      
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Unix Timestamp</CardTitle>
            <CardDescription>
              The current time expressed as a Unix timestamp ({useMilliseconds ? "milliseconds" : "seconds"})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-muted p-4 rounded-lg flex-grow">
                <p className="text-2xl font-mono text-center">{currentTimestamp}</p>
              </div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(currentTimestamp.toString())}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="mt-4">
              <RadioGroup 
                defaultValue={useMilliseconds ? "ms" : "s"}
                onValueChange={(value) => setUseMilliseconds(value === "ms")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="s" id="s" />
                  <Label htmlFor="s">Seconds</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ms" id="ms" />
                  <Label htmlFor="ms">Milliseconds</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="timestamp-to-date">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timestamp-to-date">Timestamp to Date</TabsTrigger>
          <TabsTrigger value="date-to-timestamp">Date to Timestamp</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timestamp-to-date">
          <Card>
            <CardHeader>
              <CardTitle>Convert Timestamp to Human-Readable Date</CardTitle>
              <CardDescription>
                Enter a Unix timestamp to convert it to a human-readable date and time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="timestamp">
                    Timestamp ({useMilliseconds ? "milliseconds" : "seconds"})
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <ClockIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="timestamp"
                        type="text"
                        placeholder={useMilliseconds ? "e.g., 1625097600000" : "e.g., 1625097600"}
                        value={inputTimestamp}
                        onChange={(e) => setInputTimestamp(e.target.value)}
                        className={cn("pl-10", timestampError && "border-red-500")}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={refreshTimestamp}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {timestampError && (
                    <p className="text-red-500 text-sm mt-1">{timestampError}</p>
                  )}
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Result:</h3>
                  <p className="text-lg">
                    {convertedDate || "Enter a timestamp to convert"}
                  </p>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">What is a Unix Timestamp?</h3>
                  <p className="text-sm text-muted-foreground">
                    A Unix timestamp represents the number of {useMilliseconds ? "milliseconds" : "seconds"} that have elapsed since January 1, 1970, at 00:00:00 UTC (the Unix Epoch). It's widely used in programming for date and time calculations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="date-to-timestamp">
          <Card>
            <CardHeader>
              <CardTitle>Convert Date to Timestamp</CardTitle>
              <CardDescription>
                Select a date and time to convert to a Unix timestamp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="time"
                        type="time"
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">Result:</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(outputTimestamp)}
                            className="h-6 w-6"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-lg font-mono">
                    {outputTimestamp || "Select a date and time to convert"}
                  </p>
                </div>
                
                <div className="mt-4">
                  <RadioGroup 
                    defaultValue={useMilliseconds ? "ms" : "s"}
                    onValueChange={(value) => setUseMilliseconds(value === "ms")}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="s" id="s-output" />
                      <Label htmlFor="s-output">Seconds</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ms" id="ms-output" />
                      <Label htmlFor="ms-output">Milliseconds</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}