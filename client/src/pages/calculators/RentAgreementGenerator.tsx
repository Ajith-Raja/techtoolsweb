import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, ShieldCheck, Landmark, PenTool } from "lucide-react";
import jsPDF from "jspdf";

export default function RentAgreementGenerator() {
  const [ownerName, setOwnerName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [durationMonths, setDurationMonths] = useState("11");
  const [startDate, setStartDate] = useState("");
  const [agreementPlace, setAgreementPlace] = useState("");

  const generatePDF = () => {
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
      } else if (align === "justify") {
        const splitText = doc.splitTextToSize(text, contentWidth);
        splitText.forEach((line: string) => {
          doc.text(line, margin, y);
          y += spacing;
        });
      } else {
        const splitText = doc.splitTextToSize(text, contentWidth);
        splitText.forEach((line: string) => {
          doc.text(line, margin, y);
          y += spacing;
        });
      }
    };

    // Header
    addText("RENT AGREEMENT", 18, "bold", "center", 12);
    y += 4;

    const introText = `This Rent Agreement is made and executed at ${agreementPlace || "[City/Place]"} on this day of ${startDate || "[Date]"} by and between:`;
    addText(introText, 11, "normal", "left", 6);
    y += 2;

    const ownerText = `LANDLORD / OWNER: ${ownerName || "[Owner Name]"}, residing at ${ownerAddress || "[Owner Address]"}, hereinafter referred to as the "FIRST PARTY" (which expression shall mean and include their heirs, successors, legal representatives, and assigns).`;
    addText(ownerText, 11, "normal", "left", 6);
    y += 4;

    addText("AND", 11, "bold", "center", 6);
    y += 4;

    const tenantText = `TENANT: ${tenantName || "[Tenant Name]"}, residing at ${tenantAddress || "[Tenant Address]"}, hereinafter referred to as the "SECOND PARTY" (which expression shall mean and include their heirs, successors, legal representatives, and assigns).`;
    addText(tenantText, 11, "normal", "left", 6);
    y += 6;

    const propertyText = `WHEREAS the First Party is the lawful owner of the property situated at ${propertyAddress || "[Property Address]"} (hereinafter referred to as the "Demised Premises") and has agreed to let out the same to the Second Party for residential purposes.`;
    addText(propertyText, 11, "normal", "left", 6);
    y += 6;

    addText("NOW THIS AGREEMENT WITNESSETH AS UNDER:", 11, "bold", "left", 8);

    const term1 = `1. DURATION: The tenancy is granted for a fixed period of ${durationMonths} months starting from ${startDate || "[Start Date]"}.`;
    addText(term1, 11, "normal", "left", 6);

    const term2 = `2. RENT: The Tenant agrees to pay a monthly rent of Rs. ${monthlyRent || "[Rent Amount]"} (Rupees) on or before the 5th day of every calendar month.`;
    addText(term2, 11, "normal", "left", 6);

    const term3 = `3. SECURITY DEPOSIT: The Tenant has deposited a sum of Rs. ${securityDeposit || "[Deposit Amount]"} (Rupees) as an interest-free security deposit. This deposit is refundable at the time of vacating the premises after adjusting any dues.`;
    addText(term3, 11, "normal", "left", 6);

    const term4 = `4. UTILITIES & MAINTENANCE: The Tenant shall pay all charges for electricity, water, and internet consumed on the premises. Minor maintenance and repairs shall be borne by the Tenant.`;
    addText(term4, 11, "normal", "left", 6);

    const term5 = `5. USAGE: The Demised Premises shall be used solely for residential purposes and the Tenant shall not sublet or assign any part of the premises to any third party.`;
    addText(term5, 11, "normal", "left", 8);

    y += 10;
    addText("IN WITNESS WHEREOF, the parties hereto have signed this agreement on the day, month, and year first mentioned above.", 11, "italic", "left", 12);
    
    y += 15;
    
    // Signatures
    doc.setFont("helvetica", "bold");
    doc.text("FIRST PARTY (OWNER)", margin, y);
    doc.text("SECOND PARTY (TENANT)", pageWidth - margin - 50, y);
    
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.text("Signature: __________________", margin, y);
    doc.text("Signature: __________________", pageWidth - margin - 50, y);

    doc.save("Rent_Agreement.pdf");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <FileText className="h-8 w-8 mr-2 text-primary" />
          Rent Agreement Generator
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Generate a standard, legally structured residential rent agreement instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Details</CardTitle>
              <CardDescription>Fill out the landlord, tenant, rent and property details to populate the template.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner / Landlord Name</Label>
                  <Input 
                    id="ownerName" 
                    placeholder="Enter Owner's Full Name" 
                    value={ownerName} 
                    onChange={(e) => setOwnerName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Tenant Name</Label>
                  <Input 
                    id="tenantName" 
                    placeholder="Enter Tenant's Full Name" 
                    value={tenantName} 
                    onChange={(e) => setTenantName(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerAddress">Owner's Permanent Address</Label>
                <Input 
                  id="ownerAddress" 
                  placeholder="Full permanent residential address of the owner" 
                  value={ownerAddress} 
                  onChange={(e) => setOwnerAddress(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantAddress">Tenant's Permanent Address</Label>
                <Input 
                  id="tenantAddress" 
                  placeholder="Full permanent residential address of the tenant" 
                  value={tenantAddress} 
                  onChange={(e) => setTenantAddress(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyAddress">Rented Property Address</Label>
                <Textarea 
                  id="propertyAddress" 
                  placeholder="Complete address of the flat/house being rented" 
                  value={propertyAddress} 
                  onChange={(e) => setPropertyAddress(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent (Rs.)</Label>
                  <Input 
                    id="monthlyRent" 
                    type="number" 
                    placeholder="e.g. 15000" 
                    value={monthlyRent} 
                    onChange={(e) => setMonthlyRent(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityDeposit">Security Deposit (Rs.)</Label>
                  <Input 
                    id="securityDeposit" 
                    type="number" 
                    placeholder="e.g. 30000" 
                    value={securityDeposit} 
                    onChange={(e) => setSecurityDeposit(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMonths">Duration (Months)</Label>
                  <Input 
                    id="durationMonths" 
                    type="number" 
                    value={durationMonths} 
                    onChange={(e) => setDurationMonths(e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Agreement Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agreementPlace">Agreement Place / City</Label>
                  <Input 
                    id="agreementPlace" 
                    placeholder="e.g. New Delhi" 
                    value={agreementPlace} 
                    onChange={(e) => setAgreementPlace(e.target.value)} 
                  />
                </div>
              </div>

              <Button onClick={generatePDF} className="w-full mt-4 flex items-center justify-center">
                <Download className="mr-2 h-4 w-4" />
                Generate & Download PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Make it Legally Valid!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                In India, a rent agreement must be printed on **Stamp Paper** and **Notarized** to be fully admissible in a court of law.
              </p>
              <div className="p-3 bg-white dark:bg-black rounded-lg border space-y-2 shadow-sm">
                <div className="font-semibold flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-primary" />
                  e-Stamp Paper & Notary Partner
                </div>
                <p className="text-xs text-muted-foreground">
                  Get official stamp paper printed and delivered to your doorstep, or notarized digitally via our legal tech partner.
                </p>
                <a 
                  href="https://www.estamppaper.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block mt-2"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Order Stamp Paper Online
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-md flex items-center gap-2">
                <PenTool className="h-4 w-4 text-primary" />
                Signature Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>1. Both Landlord and Tenant must sign on each page of this agreement.</p>
              <p>2. At least two witnesses should sign and provide their full addresses on the final signature page.</p>
              <p>3. Keep photocopies of government IDs (Aadhaar/PAN) of both parties attached.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
