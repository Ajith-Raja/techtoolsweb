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

  const generateNextDates = (cron: string) => {
    // This is a placeholder - a real implementation would use a library
    // to calculate actual next execution times
    const now = new Date();
    const dates: string[] = [];
    
    for (let i = 0; i < 5; i++) {
      const nextDate = new Date(now);
      nextDate.setMinutes(now.getMinutes() + i + 1);
      dates.push(nextDate.toLocaleString());
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

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The Cron Expression Generator is currently under development. The current implementation is basic - a more advanced version with timezone support and more precise calculations will be available soon.
        </AlertDescription>
      </Alert>
    </div>
  );
}