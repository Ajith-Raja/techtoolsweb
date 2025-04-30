import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowRightLeft, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Timezone {
  name: string;
  offset: string;
  location: string;
}

const timezones: Timezone[] = [
  { name: "UTC", offset: "+00:00", location: "Coordinated Universal Time" },
  { name: "EST", offset: "-05:00", location: "Eastern Standard Time (North America)" },
  { name: "EDT", offset: "-04:00", location: "Eastern Daylight Time (North America)" },
  { name: "CST", offset: "-06:00", location: "Central Standard Time (North America)" },
  { name: "CDT", offset: "-05:00", location: "Central Daylight Time (North America)" },
  { name: "MST", offset: "-07:00", location: "Mountain Standard Time (North America)" },
  { name: "MDT", offset: "-06:00", location: "Mountain Daylight Time (North America)" },
  { name: "PST", offset: "-08:00", location: "Pacific Standard Time (North America)" },
  { name: "PDT", offset: "-07:00", location: "Pacific Daylight Time (North America)" },
  { name: "GMT", offset: "+00:00", location: "Greenwich Mean Time (UK)" },
  { name: "BST", offset: "+01:00", location: "British Summer Time (UK)" },
  { name: "IST", offset: "+05:30", location: "Indian Standard Time" },
  { name: "JST", offset: "+09:00", location: "Japan Standard Time" },
  { name: "AEST", offset: "+10:00", location: "Australian Eastern Standard Time" },
  { name: "AEDT", offset: "+11:00", location: "Australian Eastern Daylight Time" },
  { name: "AWST", offset: "+08:00", location: "Australian Western Standard Time" },
  { name: "CET", offset: "+01:00", location: "Central European Time" },
  { name: "CEST", offset: "+02:00", location: "Central European Summer Time" },
  { name: "EET", offset: "+02:00", location: "Eastern European Time" },
  { name: "EEST", offset: "+03:00", location: "Eastern European Summer Time" },
  { name: "HKT", offset: "+08:00", location: "Hong Kong Time" },
  { name: "SGT", offset: "+08:00", location: "Singapore Time" },
  { name: "BRT", offset: "-03:00", location: "Brasilia Time (Brazil)" },
];

export default function TimezoneConverter() {
  const [sourceTimezone, setSourceTimezone] = useState<string>("UTC");
  const [targetTimezone, setTargetTimezone] = useState<string>("IST");
  const [dateTime, setDateTime] = useState<string>("");
  const [convertedDateTime, setConvertedDateTime] = useState<string>("");
  const [currentTimeSource, setCurrentTimeSource] = useState<string>("");
  const [currentTimeTarget, setCurrentTimeTarget] = useState<string>("");

  useEffect(() => {
    // Set initial date and time to now
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    
    // Start the clock
    const timer = setInterval(updateCurrentTimes, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    convertTime();
    updateCurrentTimes();
  }, [sourceTimezone, targetTimezone, dateTime]);

  const updateCurrentTimes = () => {
    const now = new Date();
    
    // Source timezone current time
    const sourceOffset = timezones.find(tz => tz.name === sourceTimezone)?.offset || "+00:00";
    const sourceTime = formatTimeWithOffset(now, sourceOffset);
    setCurrentTimeSource(sourceTime);
    
    // Target timezone current time
    const targetOffset = timezones.find(tz => tz.name === targetTimezone)?.offset || "+00:00";
    const targetTime = formatTimeWithOffset(now, targetOffset);
    setCurrentTimeTarget(targetTime);
  };

  const formatTimeWithOffset = (date: Date, offsetStr: string) => {
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    // Parse the offset string
    const match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return "";
    
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const offsetMinutes = sign * (hours * 60 + minutes);
    
    // Apply the offset
    const targetDate = new Date(utcDate.getTime() + offsetMinutes * 60000);
    
    return targetDate.toLocaleString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const convertTime = () => {
    if (!dateTime) return;
    
    // Get the offset values
    const sourceOffset = timezones.find(tz => tz.name === sourceTimezone)?.offset || "+00:00";
    const targetOffset = timezones.find(tz => tz.name === targetTimezone)?.offset || "+00:00";
    
    // Parse the input datetime
    const inputDate = new Date(dateTime);
    
    // Convert to UTC by removing the source timezone offset
    const sourceMatch = sourceOffset.match(/([+-])(\d{2}):(\d{2})/);
    if (!sourceMatch) return;
    
    const sourceSign = sourceMatch[1] === "+" ? -1 : 1; // Opposite sign to remove the offset
    const sourceHours = parseInt(sourceMatch[2], 10);
    const sourceMinutes = parseInt(sourceMatch[3], 10);
    const sourceOffsetMinutes = sourceSign * (sourceHours * 60 + sourceMinutes);
    
    // Adjust to UTC
    const utcTime = new Date(inputDate.getTime() + sourceOffsetMinutes * 60000);
    
    // Parse the target offset
    const targetMatch = targetOffset.match(/([+-])(\d{2}):(\d{2})/);
    if (!targetMatch) return;
    
    const targetSign = targetMatch[1] === "+" ? 1 : -1;
    const targetHours = parseInt(targetMatch[2], 10);
    const targetMinutes = parseInt(targetMatch[3], 10);
    const targetOffsetMinutes = targetSign * (targetHours * 60 + targetMinutes);
    
    // Convert to target timezone
    const targetTime = new Date(utcTime.getTime() + targetOffsetMinutes * 60000);
    
    // Format the result
    setConvertedDateTime(
      targetTime.toLocaleString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    );
  };

  const swapTimezones = () => {
    const temp = sourceTimezone;
    setSourceTimezone(targetTimezone);
    setTargetTimezone(temp);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Timezone Converter</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Convert Specific Time</CardTitle>
            <CardDescription>
              Convert a specific date and time between two timezones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-7 gap-4 items-center">
                <div className="col-span-3">
                  <Label htmlFor="sourceTimezone">From Timezone</Label>
                  <Select
                    value={sourceTimezone}
                    onValueChange={setSourceTimezone}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.name} value={tz.name}>
                          {tz.name} ({tz.offset}) - {tz.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-center items-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={swapTimezones} 
                    className="rounded-full"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="col-span-3">
                  <Label htmlFor="targetTimezone">To Timezone</Label>
                  <Select
                    value={targetTimezone}
                    onValueChange={setTargetTimezone}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.name} value={tz.name}>
                          {tz.name} ({tz.offset}) - {tz.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="datetime">Date & Time</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">Result:</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is the converted time in the target timezone</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-lg font-medium">
                  {convertedDateTime || "Enter a date and time to convert"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      
        <Card>
          <CardHeader>
            <CardTitle>Current Time</CardTitle>
            <CardDescription>
              View the current time in both timezones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{sourceTimezone}:</h3>
                  <span className="text-sm text-muted-foreground">
                    {timezones.find(tz => tz.name === sourceTimezone)?.offset}
                  </span>
                </div>
                <p className="text-lg font-medium">{currentTimeSource}</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{targetTimezone}:</h3>
                  <span className="text-sm text-muted-foreground">
                    {timezones.find(tz => tz.name === targetTimezone)?.offset}
                  </span>
                </div>
                <p className="text-lg font-medium">{currentTimeTarget}</p>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2">Time Difference:</h3>
                <p className="text-base">
                  {(() => {
                    const source = timezones.find(tz => tz.name === sourceTimezone);
                    const target = timezones.find(tz => tz.name === targetTimezone);
                    
                    if (!source || !target) return "Unknown";
                    
                    // Parse offsets
                    const sourceMatch = source.offset.match(/([+-])(\d{2}):(\d{2})/);
                    const targetMatch = target.offset.match(/([+-])(\d{2}):(\d{2})/);
                    
                    if (!sourceMatch || !targetMatch) return "Unknown";
                    
                    // Calculate source offset in minutes
                    const sourceSign = sourceMatch[1] === "+" ? 1 : -1;
                    const sourceHours = parseInt(sourceMatch[2], 10);
                    const sourceMinutes = parseInt(sourceMatch[3], 10);
                    const sourceOffsetMinutes = sourceSign * (sourceHours * 60 + sourceMinutes);
                    
                    // Calculate target offset in minutes
                    const targetSign = targetMatch[1] === "+" ? 1 : -1;
                    const targetHours = parseInt(targetMatch[2], 10);
                    const targetMinutes = parseInt(targetMatch[3], 10);
                    const targetOffsetMinutes = targetSign * (targetHours * 60 + targetMinutes);
                    
                    // Calculate difference in hours and minutes
                    const diffMinutes = targetOffsetMinutes - sourceOffsetMinutes;
                    const diffHours = Math.floor(Math.abs(diffMinutes) / 60);
                    const diffMins = Math.abs(diffMinutes) % 60;
                    
                    const sign = diffMinutes >= 0 ? "+" : "-";
                    
                    return `${sign}${diffHours}h ${diffMins > 0 ? `${diffMins}m` : ""}`;
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}