import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function WebhookSimulator() {
  const [url, setUrl] = useState<string>("");
  const [method, setMethod] = useState<string>("POST");
  const [template, setTemplate] = useState<string>("custom");
  const [payload, setPayload] = useState<string>(`{
  "event": "example_event",
  "timestamp": "${new Date().toISOString()}",
  "data": {
    "id": "12345",
    "status": "completed"
  }
}`);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Webhook Simulator</h1>
      <p className="text-gray-600 mb-8">
        Test your webhook endpoints by sending custom HTTP requests with JSON payloads. Log request and response details for debugging.
      </p>

      <Card className="mb-8">
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
              <Label>Payload Template</Label>
              <Tabs defaultValue="custom" onValueChange={setTemplate} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="custom">Custom JSON</TabsTrigger>
                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                  <TabsTrigger value="github">GitHub</TabsTrigger>
                  <TabsTrigger value="slack">Slack</TabsTrigger>
                </TabsList>
                
                <TabsContent value="custom">
                  <Textarea
                    placeholder="Enter your JSON payload"
                    className="min-h-[200px] font-mono text-sm"
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="stripe">
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">This template simulates a Stripe payment_intent.succeeded event.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="github">
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">This template simulates a GitHub push event.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="slack">
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">This template simulates a Slack message event.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="pt-2">
              <Button disabled={!url}>
                Send Webhook
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The Webhook Simulator is currently under development and will be available soon. Check back later for this feature!
        </AlertDescription>
      </Alert>
    </div>
  );
}