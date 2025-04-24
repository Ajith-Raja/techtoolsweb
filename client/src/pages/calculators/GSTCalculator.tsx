import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calculator, Receipt, ArrowRight } from "lucide-react";

type CalculationType = "exclusive" | "inclusive";

export default function GSTCalculator() {
  const [amount, setAmount] = useState<number>(1000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [calculationType, setCalculationType] = useState<CalculationType>("exclusive");
  
  // Results
  const [gstAmount, setGstAmount] = useState<number | null>(null);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const [baseAmount, setBaseAmount] = useState<number | null>(null);

  // Common GST rates in India
  const commonGSTRates = [3, 5, 12, 18, 28];

  // Calculate GST
  const calculateGST = () => {
    if (calculationType === "exclusive") {
      // GST Exclusive calculation (GST is added to the amount)
      const gst = (amount * gstRate) / 100;
      const final = amount + gst;
      
      setGstAmount(gst);
      setFinalAmount(final);
      setBaseAmount(amount);
    } else {
      // GST Inclusive calculation (GST is included in the amount)
      const divisor = 100 + gstRate;
      const base = (amount * 100) / divisor;
      const gst = amount - base;
      
      setGstAmount(gst);
      setFinalAmount(amount);
      setBaseAmount(base);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Receipt className="h-8 w-8 mr-2 text-primary" />
          GST Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Calculate GST amount and final price for goods and services with different tax rates.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>GST Calculation</CardTitle>
          <CardDescription>
            Enter amount and GST rate to calculate tax amount and final price
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calculation Type */}
          <div className="space-y-3">
            <Label>Calculation Type</Label>
            <RadioGroup
              value={calculationType}
              onValueChange={(value) => setCalculationType(value as CalculationType)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exclusive" id="exclusive" />
                <Label htmlFor="exclusive" className="font-normal cursor-pointer">
                  GST Exclusive (Add GST to amount)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inclusive" id="inclusive" />
                <Label htmlFor="inclusive" className="font-normal cursor-pointer">
                  GST Inclusive (Extract GST from amount)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="amount">
              {calculationType === "exclusive" ? "Base Amount (without GST)" : "Final Amount (with GST)"}
            </Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-lg"
            />
          </div>

          {/* GST Rate */}
          <div className="space-y-3">
            <Label htmlFor="gst-rate">GST Rate (%)</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {commonGSTRates.map((rate) => (
                <Button
                  key={rate}
                  type="button"
                  variant={gstRate === rate ? "default" : "outline"}
                  onClick={() => setGstRate(rate)}
                  className="px-3 py-1 h-auto"
                >
                  {rate}%
                </Button>
              ))}
            </div>
            <Input
              id="gst-rate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
            />
          </div>

          <Button 
            onClick={calculateGST} 
            className="w-full"
            size="lg"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Calculate GST
          </Button>

          {/* Results Section */}
          {gstAmount !== null && finalAmount !== null && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-medium mb-4">GST Calculation Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/5 p-4 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Base Amount</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(baseAmount || 0)}
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">GST Amount ({gstRate}%)</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(gstAmount)}
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Final Amount</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(finalAmount)}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-sm">
                <div className="flex items-center mb-2">
                  <div className="bg-primary/10 p-2 rounded-md mr-3">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  {calculationType === "exclusive" ? (
                    <span>
                      Base amount <strong>{formatCurrency(baseAmount || 0)}</strong> + GST {gstRate}% 
                      <strong> ({formatCurrency(gstAmount)})</strong> = Final amount <strong>{formatCurrency(finalAmount)}</strong>
                    </span>
                  ) : (
                    <span>
                      Final amount <strong>{formatCurrency(finalAmount)}</strong> includes base amount 
                      <strong> ({formatCurrency(baseAmount || 0)})</strong> and GST {gstRate}% 
                      <strong> ({formatCurrency(gstAmount)})</strong>
                    </span>
                  )}
                </div>
                
                <div className="px-9">
                  <p className="text-muted-foreground">
                    {calculationType === "exclusive" 
                      ? `Formula: GST = Base × (Rate/100), Final = Base + GST`
                      : `Formula: Base = Final × [100/(100+Rate)], GST = Final - Base`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}