import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Clock, Users, ArrowRight } from "lucide-react";

export default function RoiCalculator() {
  const [softwareCost, setSoftwareCost] = useState("1200");
  const [hoursSaved, setHoursSaved] = useState("4");
  const [hourlyRate, setHourlyRate] = useState("35");
  const [employees, setEmployees] = useState("5");
  const [productivityGain, setProductivityGain] = useState("10");

  const [results, setResults] = useState<{
    laborSavingsAnnual: number;
    productivityValueAnnual: number;
    totalSavingsAnnual: number;
    netSavingsAnnual: number;
    roi: number;
    paybackMonths: number;
  } | null>(null);

  const calculateROI = () => {
    const cost = parseFloat(softwareCost);
    const hrsSaved = parseFloat(hoursSaved);
    const rate = parseFloat(hourlyRate);
    const numEmployees = parseFloat(employees);
    const prodGain = parseFloat(productivityGain);

    if (isNaN(cost) || isNaN(hrsSaved) || isNaN(rate) || isNaN(numEmployees) || isNaN(prodGain)) return;

    // Calculations
    const laborSavingsAnnual = hrsSaved * 52 * rate * numEmployees;
    const productivityValueAnnual = (laborSavingsAnnual * prodGain) / 100;
    const totalSavingsAnnual = laborSavingsAnnual + productivityValueAnnual;
    const netSavingsAnnual = totalSavingsAnnual - cost;
    const roi = cost > 0 ? (netSavingsAnnual / cost) * 100 : 0;
    const paybackMonths = totalSavingsAnnual > 0 ? (cost / (totalSavingsAnnual / 12)) : 0;

    setResults({
      laborSavingsAnnual: Math.round(laborSavingsAnnual),
      productivityValueAnnual: Math.round(productivityValueAnnual),
      totalSavingsAnnual: Math.round(totalSavingsAnnual),
      netSavingsAnnual: Math.round(netSavingsAnnual),
      roi: parseFloat(roi.toFixed(1)),
      paybackMonths: parseFloat(paybackMonths.toFixed(1)),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <TrendingUp className="h-8 w-8 mr-2 text-primary" />
          Business Software ROI Calculator
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Calculate the Return on Investment (ROI) and payback period for software solutions by estimating time saved and productivity gains.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Investment & Savings Inputs</CardTitle>
              <CardDescription>Provide details about the software cost and expected operational savings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="softwareCost">Annual Software Cost ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="softwareCost" className="pl-9" type="number" value={softwareCost} onChange={(e) => setSoftwareCost(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employees">Number of Users / Employees</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="employees" className="pl-9" type="number" value={employees} onChange={(e) => setEmployees(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hoursSaved">Hours Saved / User / Week</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="hoursSaved" className="pl-9" type="number" value={hoursSaved} onChange={(e) => setHoursSaved(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Average Hourly Rate ($/hr)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="hourlyRate" className="pl-9" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productivityGain">Estimated Productivity Gain (%)</Label>
                  <Input id="productivityGain" type="number" value={productivityGain} onChange={(e) => setProductivityGain(e.target.value)} />
                </div>
              </div>

              <Button onClick={calculateROI} className="w-full mt-2">
                Calculate Software ROI
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Financial Return Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-primary/5 p-4 rounded-md text-center">
                    <p className="text-xs text-muted-foreground">Annual Benefit</p>
                    <p className="text-xl font-bold">${results.totalSavingsAnnual.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-md text-center">
                    <p className="text-xs text-muted-foreground">Net Profit</p>
                    <p className="text-xl font-bold">${results.netSavingsAnnual.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-500/10 p-4 rounded-md text-center border border-emerald-500/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Total ROI</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{results.roi}%</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-md text-center">
                    <p className="text-xs text-muted-foreground">Payback Time</p>
                    <p className="text-xl font-bold">{results.paybackMonths} Months</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direct Time/Labor Savings (Annual):</span>
                    <span className="font-semibold">${results.laborSavingsAnnual.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Productivity Efficiency Gains (Annual):</span>
                    <span className="font-semibold">${results.productivityValueAnnual.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Cost of Software:</span>
                    <span className="font-semibold text-destructive">${parseFloat(softwareCost).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-secondary/40 border">
            <CardHeader className="pb-3">
              <CardTitle className="text-md flex items-center gap-2">
                Why Software ROI Matters?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-3">
              <p>
                Investing in business software helps reduce manual errors, automate recurring task loops, and speed up employee training time.
              </p>
              <p>
                A payback period under 6 months is typically considered an **excellent** investment for business systems.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
