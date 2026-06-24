import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clipboard, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CronGenerator() {
  const { toast } = useToast();
  const [minute, setMinute] = useState<string>("*");
  const [hour, setHour] = useState<string>("*");
  const [day, setDay] = useState<string>("*");
  const [month, setMonth] = useState<string>("*");
  const [weekday, setWeekday] = useState<string>("*");
  const [cronExpression, setCronExpression] = useState<string>("* * * * *");
  const [nextDates, setNextDates] = useState<string[]>([]);
  const [readableCron, setReadableCron] = useState<string>("");
  const [manualCron, setManualCron] = useState<string>("* * * * *");

  useEffect(() => {
    const newCronExpression = `${minute} ${hour} ${day} ${month} ${weekday}`;
    setCronExpression(newCronExpression);
    updateReadableCron(newCronExpression);
    generateNextDates(newCronExpression);
  }, [minute, hour, day, month, weekday]);

  const handleManualCronChange = () => {
    setCronExpression(manualCron);
    updateReadableCron(manualCron);
    generateNextDates(manualCron);

    // TODO: validate and parse the cron expression to update the individual fields
  };

  const updateReadableCron = (cron: string) => {
    // This is a simplified version - a real implementation would use a library
    const parts = cron.split(" ");
    if (parts.length !== 5) {
      setReadableCron("Invalid cron expression");
      return;
    }

    let description = "Runs";
    
    if (parts[0] === "*" && parts[1] === "*" && parts[2] === "*" && parts[3] === "*" && parts[4] === "*") {
      description = "Runs every minute";
    } else if (parts[0] === "0" && parts[1] === "*" && parts[2] === "*" && parts[3] === "*" && parts[4] === "*") {
      description = "Runs hourly at minute 0";
    } else if (parts[0] === "0" && parts[1] === "0" && parts[2] === "*" && parts[3] === "*" && parts[4] === "*") {
      description = "Runs daily at 00:00 (midnight)";
    } else if (parts[0] === "0" && parts[1] === "0" && parts[2] === "*" && parts[3] === "*" && parts[4] === "0") {
      description = "Runs weekly on Sunday at 00:00 (midnight)";
    } else if (parts[0] === "0" && parts[1] === "0" && parts[2] === "1" && parts[3] === "*" && parts[4] === "*") {
      description = "Runs monthly on the 1st at 00:00 (midnight)";
    } else if (parts[0] === "0" && parts[1] === "0" && parts[2] === "1" && parts[3] === "1" && parts[4] === "*") {
      description = "Runs yearly on January 1st at 00:00 (midnight)";
    } else {
      description = "Runs at custom schedule (see next execution dates)";
    }

    setReadableCron(description);
  };

  const parseCronField = (field: string, min: number, max: number): Set<number> | null => {
    const result = new Set<number>();

    if (field === "*") {
      for (let i = min; i <= max; i++) {
        result.add(i);
      }
      return result;
    }

    const segments = field.split(",");

    for (const segment of segments) {
      const trimmedSegment = segment.trim();
      if (!trimmedSegment) {
        return null;
      }

      const [rangePart, stepPart] = trimmedSegment.split("/");
      const step = stepPart ? Number(stepPart) : 1;

      if (!Number.isInteger(step) || step <= 0) {
        return null;
      }

      let rangeStart: number;
      let rangeEnd: number;

      if (rangePart === "*") {
        rangeStart = min;
        rangeEnd = max;
      } else if (rangePart.includes("-")) {
        const [startText, endText] = rangePart.split("-");
        rangeStart = Number(startText);
        rangeEnd = Number(endText);
      } else {
        rangeStart = Number(rangePart);
        rangeEnd = max;
      }

      if (!Number.isInteger(rangeStart) || !Number.isInteger(rangeEnd)) {
        return null;
      }

      if (rangePart !== "*" && !rangePart.includes("-") && !trimmedSegment.includes("/")) {
        if (rangeStart < min || rangeStart > max) {
          return null;
        }
        result.add(rangeStart);
        continue;
      }

      if (rangePart.includes("-") && rangeStart > rangeEnd) {
        return null;
      }

      if (rangeStart < min || rangeStart > max || rangeEnd < min || rangeEnd > max) {
        return null;
      }

      for (let value = rangeStart; value <= rangeEnd; value += step) {
        result.add(value);
      }
    }

    return result;
  };

  const isCronMatch = (date: Date, cron: string) => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return false;
    }

    const minuteSet = parseCronField(parts[0], 0, 59);
    const hourSet = parseCronField(parts[1], 0, 23);
    const daySet = parseCronField(parts[2], 1, 31);
    const monthSet = parseCronField(parts[3], 1, 12);
    const weekdaySet = parseCronField(parts[4], 0, 7);

    if (!minuteSet || !hourSet || !daySet || !monthSet || !weekdaySet) {
      return false;
    }

    const minuteMatch = minuteSet.has(date.getMinutes());
    const hourMatch = hourSet.has(date.getHours());
    const dayMatch = daySet.has(date.getDate());
    const monthMatch = monthSet.has(date.getMonth() + 1);
    const weekdayMatch = weekdaySet.has(date.getDay()) || (date.getDay() === 0 && weekdaySet.has(7));

    const dayIsWildcard = parts[2] === "*";
    const weekdayIsWildcard = parts[4] === "*";

    // Standard cron behavior: when both day-of-month and day-of-week are restricted,
    // a match in either field is accepted.
    const dayAndWeekMatch = dayIsWildcard || weekdayIsWildcard
      ? dayMatch && weekdayMatch
      : dayMatch || weekdayMatch;

    return minuteMatch && hourMatch && monthMatch && dayAndWeekMatch;
  };

  const generateNextDates = (cron: string) => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      setNextDates(["Invalid cron expression"]);
      return;
    }

    const dates: string[] = [];
    const candidate = new Date();
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1);

    const maxIterations = 60 * 24 * 366 * 5;
    let iterations = 0;

    while (dates.length < 5 && iterations < maxIterations) {
      if (isCronMatch(candidate, cron)) {
        dates.push(candidate.toLocaleString());
      }
      candidate.setMinutes(candidate.getMinutes() + 1);
      iterations++;
    }

    if (dates.length === 0) {
      setNextDates(["No upcoming execution times found for this expression"]);
      return;
    }

    setNextDates(dates);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cronExpression).then(
      () => {
        toast({
          title: "Copied!",
          description: "Cron expression copied to clipboard",
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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Cron Expression Generator</h1>
      <p className="text-gray-600 mb-8">
        Create and test cron expressions for scheduling tasks. Visualize upcoming execution times and get human-readable explanations.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cron Expression Builder</CardTitle>
          <CardDescription>
            Create a cron expression using the form or enter one manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="builder" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="builder">Visual Builder</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="builder">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minute">Minute (0-59)</Label>
                  <Select value={minute} onValueChange={setMinute}>
                    <SelectTrigger id="minute">
                      <SelectValue placeholder="Minute" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Every minute (*)</SelectItem>
                      <SelectItem value="*/5">Every 5 minutes (*/5)</SelectItem>
                      <SelectItem value="*/15">Every 15 minutes (*/15)</SelectItem>
                      <SelectItem value="*/30">Every 30 minutes (*/30)</SelectItem>
                      <SelectItem value="0">On the hour (0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hour">Hour (0-23)</Label>
                  <Select value={hour} onValueChange={setHour}>
                    <SelectTrigger id="hour">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Every hour (*)</SelectItem>
                      <SelectItem value="*/2">Every 2 hours (*/2)</SelectItem>
                      <SelectItem value="*/6">Every 6 hours (*/6)</SelectItem>
                      <SelectItem value="0">At midnight (0)</SelectItem>
                      <SelectItem value="12">At noon (12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="day">Day (1-31)</Label>
                  <Select value={day} onValueChange={setDay}>
                    <SelectTrigger id="day">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Every day (*)</SelectItem>
                      <SelectItem value="1">1st of month (1)</SelectItem>
                      <SelectItem value="15">15th of month (15)</SelectItem>
                      <SelectItem value="1,15">1st and 15th (1,15)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="month">Month (1-12)</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Every month (*)</SelectItem>
                      <SelectItem value="1">January (1)</SelectItem>
                      <SelectItem value="6">June (6)</SelectItem>
                      <SelectItem value="12">December (12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weekday">Weekday (0-6)</Label>
                  <Select value={weekday} onValueChange={setWeekday}>
                    <SelectTrigger id="weekday">
                      <SelectValue placeholder="Weekday" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Every day (*)</SelectItem>
                      <SelectItem value="0">Sunday (0)</SelectItem>
                      <SelectItem value="1">Monday (1)</SelectItem>
                      <SelectItem value="5">Friday (5)</SelectItem>
                      <SelectItem value="1-5">Mon-Fri (1-5)</SelectItem>
                      <SelectItem value="0,6">Weekends (0,6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="manual">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-cron">Cron Expression</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="manual-cron"
                      placeholder="* * * * *"
                      value={manualCron}
                      onChange={(e) => setManualCron(e.target.value)}
                    />
                    <Button onClick={handleManualCronChange}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: minute hour day month weekday
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex-col items-start space-y-4">
          <div className="w-full">
            <Label className="mb-2 block">Cron Expression</Label>
            <div className="flex gap-2">
              <Input value={cronExpression} readOnly className="font-mono" />
              <Button variant="outline" onClick={copyToClipboard} title="Copy to clipboard">
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="w-full">
            <Label className="mb-2 block">Human-Readable Description</Label>
            <p className="p-3 bg-muted rounded-md">{readableCron}</p>
          </div>
          
          <div className="w-full">
            <Label className="mb-2 block flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Next Execution Times
            </Label>
            <ul className="space-y-1">
              {nextDates.map((date, index) => (
                <li key={index} className="text-sm p-2 odd:bg-muted rounded-sm">{date}</li>
              ))}
            </ul>
          </div>
        </CardFooter>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Common Cron Examples</CardTitle>
          <CardDescription>
            Reference examples for common scheduling patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Time-Based Patterns</h3>
              <ul className="space-y-2 text-sm">
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">* * * * *</span>
                  <span className="col-span-2">Every minute</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 * * * *</span>
                  <span className="col-span-2">Every hour (at minute 0)</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 0 * * *</span>
                  <span className="col-span-2">Every day at midnight</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 12 * * *</span>
                  <span className="col-span-2">Every day at noon</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 0 * * 0</span>
                  <span className="col-span-2">Every Sunday at midnight</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 0 1 * *</span>
                  <span className="col-span-2">First day of each month</span>
                </li>
              </ul>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Interval Patterns</h3>
              <ul className="space-y-2 text-sm">
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">*/5 * * * *</span>
                  <span className="col-span-2">Every 5 minutes</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 */2 * * *</span>
                  <span className="col-span-2">Every 2 hours</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 8-17 * * *</span>
                  <span className="col-span-2">Every hour from 8 AM to 5 PM</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 0 * * 1-5</span>
                  <span className="col-span-2">Weekdays at midnight</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 0 */15 * *</span>
                  <span className="col-span-2">Every 15 days at midnight</span>
                </li>
                <li className="grid grid-cols-3 gap-2">
                  <span className="font-mono">0 0 1,15 * *</span>
                  <span className="col-span-2">1st and 15th of each month</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cron Syntax Guide</CardTitle>
          <CardDescription>
            Reference for standard cron expression syntax
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Field</th>
                    <th className="text-left p-2">Allowed Values</th>
                    <th className="text-left p-2">Special Characters</th>
                    <th className="text-left p-2">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Minute</td>
                    <td className="p-2">0-59</td>
                    <td className="p-2">* , - /</td>
                    <td className="p-2"><code>*/15</code> (every 15 minutes)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Hour</td>
                    <td className="p-2">0-23</td>
                    <td className="p-2">* , - /</td>
                    <td className="p-2"><code>8-17</code> (8 AM to 5 PM)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Day of Month</td>
                    <td className="p-2">1-31</td>
                    <td className="p-2">* , - / L W</td>
                    <td className="p-2"><code>1,15</code> (1st and 15th)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Month</td>
                    <td className="p-2">1-12</td>
                    <td className="p-2">* , - /</td>
                    <td className="p-2"><code>*/3</code> (every 3 months)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Day of Week</td>
                    <td className="p-2">0-6 (0=Sunday)</td>
                    <td className="p-2">* , - / L #</td>
                    <td className="p-2"><code>1-5</code> (Monday-Friday)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Special Characters</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>*</strong>: Any value (wildcard)</li>
                <li><strong>,</strong>: Value list separator (e.g., <code>1,15</code> means 1st and 15th)</li>
                <li><strong>-</strong>: Range of values (e.g., <code>1-5</code> means 1, 2, 3, 4, and 5)</li>
                <li><strong>/</strong>: Step values (e.g., <code>*/5</code> means every 5 units)</li>
                <li><strong>L</strong>: Last day of month or week (e.g., <code>L</code> in day of month means last day of month)</li>
                <li><strong>W</strong>: Weekday nearest to the given day (e.g., <code>15W</code> means the nearest weekday to the 15th)</li>
                <li><strong>#</strong>: Nth day of month (e.g., <code>5#3</code> means the 3rd Friday of the month)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}