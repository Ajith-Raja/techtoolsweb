import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Scale, ShieldAlert, PenTool } from "lucide-react";
import jsPDF from "jspdf";

export default function LegalNoticeGenerator() {
  const [noticeType, setNoticeType] = useState("demand_notice");
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [disputeDate, setDisputeDate] = useState("");
  const [demandAmount, setDemandAmount] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [replyDeadlineDays, setReplyDeadlineDays] = useState("15");

  const generateNoticePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let y = 30;

    const addText = (text: string, fontSize = 11, fontStyle = "normal", align: "left" | "center" | "justify" = "left", spacing = 6) => {
      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);
      
      if (align === "center") {
        doc.text(text, pageWidth / 2, y, { align: "center" });
        y += spacing;
      } else {
        const splitText = doc.splitTextToSize(text, contentWidth);
        splitText.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += spacing;
        });
      }
    };

    // Title
    const titleMap: Record<string, string> = {
      demand_notice: "LEGAL DEMAND NOTICE",
      cheque_bounce: "LEGAL NOTICE UNDER SECTION 138 OF NEGOTIABLE INSTRUMENTS ACT",
      property_dispute: "LEGAL NOTICE FOR PROPERTY DISPUTE & EVICTION",
    };

    addText(titleMap[noticeType] || "LEGAL NOTICE", 14, "bold", "center", 12);
    y += 4;

    addText(`Date: ${new Date().toLocaleDateString()}`, 10, "normal", "left", 6);
    y += 2;

    addText("TO,", 11, "bold", "left", 6);
    addText(`${recipientName || "[Recipient Name]"}`, 11, "bold", "left", 5);
    addText(`${recipientAddress || "[Recipient Address]"}`, 11, "normal", "left", 8);

    addText("FROM,", 11, "bold", "left", 6);
    addText(`${senderName || "[Sender Name]"}`, 11, "bold", "left", 5);
    addText(`${senderAddress || "[Sender Address]"}`, 11, "normal", "left", 10);

    addText("SUBJECT: Legal notice concerning outstanding dispute.", 11, "bold", "left", 8);

    addText("Sir/Madam,", 11, "normal", "left", 6);

    const introText = `Under instructions from my client, ${senderName || "[Sender Name]"}, I hereby serve you with this legal notice due to the following occurrences and breaches:`;
    addText(introText, 11, "normal", "left", 6);

    // Context dependent body
    let bodyText = "";
    if (noticeType === "cheque_bounce") {
      bodyText = `1. You issued a cheque bearing number ____________ dated ${disputeDate || "[Cheque Date]"} for an amount of Rs. ${demandAmount || "[Amount]"} drawn on __________________ Bank in favor of my client towards the discharge of your legally enforceable liability.
2. The said cheque was presented by my client for encashment, but it was returned unpaid by the bank with the memo/reason 'Funds Insufficient' or similar bank endorsement.`;
    } else if (noticeType === "demand_notice") {
      bodyText = `1. You entered into an agreement/transaction where you are liable to pay a sum of Rs. ${demandAmount || "[Amount]"} to my client for services rendered / goods supplied.
2. Despite repeated requests and reminders on/around ${disputeDate || "[Date]"}, you have failed and neglected to clear the outstanding balance of Rs. ${demandAmount || "[Amount]"} due to my client.`;
    } else {
      bodyText = `1. You are occupying/leasing the property situated at the demised premises belonging to my client.
2. A dispute has arisen on/around ${disputeDate || "[Date]"} regarding the terms of lease, maintenance, unauthorized alterations, or non-payment of rent, specifically described as: "${disputeDetails || "Non-payment of dues / breach of agreement"}".`;
    }

    addText(bodyText, 11, "normal", "left", 6);
    y += 2;

    const detailsText = `Additional Details: ${disputeDetails || "[Insert any details here]"}`;
    addText(detailsText, 11, "normal", "left", 6);
    y += 2;

    const demandText = `THEREFORE, you are hereby called upon to pay the sum of Rs. ${demandAmount || "[Amount]"} / resolve the dispute to the satisfaction of my client within a period of ${replyDeadlineDays} days from the receipt of this legal notice. Failing this, we shall be constrained to initiate legal proceedings against you in a court of competent jurisdiction.`;
    addText(demandText, 11, "bold", "left", 8);

    y += 10;
    addText("Yours sincerely,", 11, "normal", "left", 12);
    y += 10;
    addText("________________________", 11, "normal", "left", 5);
    addText("Advocate / Authorized Signatory", 11, "bold", "left", 5);

    doc.save("Legal_Notice.pdf");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Scale className="h-8 w-8 mr-2 text-primary" />
          Legal Notice Draft Generator
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Draft a formal legal notice (cheque bounce, demand notice, property eviction) and download as a formatted PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notice Configuration</CardTitle>
              <CardDescription>Fill out sender, recipient, and dispute details below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noticeType">Notice Type</Label>
                <Select value={noticeType} onValueChange={setNoticeType}>
                  <SelectTrigger id="noticeType">
                    <SelectValue placeholder="Select Notice Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demand_notice">Payment Demand Notice</SelectItem>
                    <SelectItem value="cheque_bounce">Cheque Bounce (Sec. 138 NI Act)</SelectItem>
                    <SelectItem value="property_dispute">Property eviction / dispute notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender / Client Name</Label>
                  <Input id="senderName" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input id="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Full Name" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderAddress">Sender's Address</Label>
                  <Input id="senderAddress" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder="Full Address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientAddress">Recipient's Address</Label>
                  <Input id="recipientAddress" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="Full Address" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disputeDate">Dispute / Transaction Date</Label>
                  <Input id="disputeDate" type="date" value={disputeDate} onChange={(e) => setDisputeDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demandAmount">Amount in Dispute (Rs.)</Label>
                  <Input id="demandAmount" type="number" value={demandAmount} onChange={(e) => setDemandAmount(e.target.value)} placeholder="e.g. 50000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyDeadlineDays">Reply Deadline (Days)</Label>
                  <Input id="replyDeadlineDays" type="number" value={replyDeadlineDays} onChange={(e) => setReplyDeadlineDays(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disputeDetails">Facts & Details of Dispute</Label>
                <Textarea 
                  id="disputeDetails" 
                  value={disputeDetails} 
                  onChange={(e) => setDisputeDetails(e.target.value)} 
                  placeholder="Provide brief details regarding cheque numbers, invoices, or agreement clauses breached." 
                />
              </div>

              <Button onClick={generateNoticePDF} className="w-full mt-4 flex items-center justify-center">
                <Download className="mr-2 h-4 w-4" />
                Generate & Download Notice PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Expert Legal Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                While a notice draft serves as a starting point, it should ideally be printed on an advocate's letterhead and signed by a practicing lawyer to carry legal force.
              </p>
              <div className="p-3 bg-white dark:bg-black rounded-lg border space-y-2 shadow-sm">
                <div className="font-semibold flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-primary" />
                  Talk to a Lawyer Online
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect with a specialized attorney to review your notice, issue it on their letterhead, or send it via registered post.
                </p>
                <a 
                  href="https://www.lawrato.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block mt-2"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Consult an Advocate
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
