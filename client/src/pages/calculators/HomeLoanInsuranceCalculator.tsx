import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Home, Calculator, ExternalLink, TrendingDown } from "lucide-react";

/** HLPP rate % of outstanding balance per year (single-premium equivalent) */
const HLPP_RATE = 0.38;

/** Term plan rate per ₹1 lakh cover per year by age */
function getTermRatePerLakh(age: number): number {
  if (age <= 30) return 450;
  if (age <= 35) return 580;
  if (age <= 40) return 750;
  if (age <= 45) return 980;
  if (age <= 50) return 1350;
  return 1850;
}

/** Simulate reducing-balance HLPP total cost over loan tenure */
function calculateHlppTotal(loanAmount: number, tenureYears: number, annualRatePct: number): number {
  let totalPremium = 0;
  const monthlyEmi = calculateEmi(loanAmount, 8.5, tenureYears * 12);
  let outstanding = loanAmount;

  for (let year = 0; year < tenureYears; year++) {
    totalPremium += (outstanding * annualRatePct) / 100;
    for (let m = 0; m < 12; m++) {
      const interest = (outstanding * 8.5) / 12 / 100;
      const principal = monthlyEmi - interest;
      outstanding = Math.max(0, outstanding - principal);
    }
  }
  return Math.round(totalPremium);
}

function calculateEmi(principal: number, rateAnnual: number, months: number): number {
  const r = rateAnnual / 12 / 100;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const AFFILIATE_LINKS = [
  { name: "LIC Term Plans", url: "https://licindia.in/online-premium-calculator" },
  { name: "SBI Life eShield", url: "https://www.sbilife.co.in/en/individual-life-insurance/term-insurance/e-shield" },
  { name: "Compare on PolicyBazaar", url: "https://www.policybazaar.com/life-insurance/term-insurance/" },
];

interface Result {
  hlppTotal: number;
  termPlanTotal: number;
  savings: number;
  savingsPct: number;
  termAnnualPremium: number;
}

export default function HomeLoanInsuranceCalculator() {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [tenureYears, setTenureYears] = useState(20);
  const [age, setAge] = useState(32);
  const [result, setResult] = useState<Result | null>(null);

  const calculate = () => {
    const hlppTotal = calculateHlppTotal(loanAmount, tenureYears, HLPP_RATE);

    const coverInLakhs = loanAmount / 100000;
    const termRate = getTermRatePerLakh(age);
    const termAnnualPremium = Math.round(coverInLakhs * termRate);
    const termPlanTotal = termAnnualPremium * tenureYears;

    const savings = hlppTotal - termPlanTotal;
    const savingsPct = hlppTotal > 0 ? Math.round((savings / hlppTotal) * 100) : 0;

    setResult({ hlppTotal, termPlanTotal, savings, savingsPct, termAnnualPremium });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Home className="h-8 w-8 mr-2 text-primary" />
          Home Loan Insurance Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Compare Home Loan Protection Plan (HLPP) cost vs a standalone term plan on reducing balance
          vs level cover — see how much you could save.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>HLPP uses reducing balance; term plan uses level cover for full loan amount.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Home Loan Amount</Label>
                <span className="text-sm font-medium">{formatCurrency(loanAmount)}</span>
              </div>
              <Slider
                min={1000000}
                max={20000000}
                step={100000}
                value={[loanAmount]}
                onValueChange={(v) => setLoanAmount(v[0])}
              />
              <Input
                type="number"
                min={100000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Loan Tenure</Label>
                <span className="text-sm font-medium">{tenureYears} years</span>
              </div>
              <Slider min={5} max={30} step={1} value={[tenureYears]} onValueChange={(v) => setTenureYears(v[0])} />
              <Input
                type="number"
                min={1}
                max={30}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Your Age</Label>
                <span className="text-sm font-medium">{age} years</span>
              </div>
              <Slider min={21} max={55} step={1} value={[age]} onValueChange={(v) => setAge(v[0])} />
              <Input type="number" min={18} max={60} value={age} onChange={(e) => setAge(Number(e.target.value))} />
            </div>

            <Button onClick={calculate} className="w-full" size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Compare Costs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HLPP vs Term Plan</CardTitle>
            <CardDescription>Total cost over loan tenure (indicative)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!result ? (
              <div className="p-6 text-center text-muted-foreground">
                Enter loan details and click Compare Costs.
              </div>
            ) : (
              <>
                {result.savings > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        Save {formatCurrency(result.savings)} ({result.savingsPct}%)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        A standalone term plan may cost less than bank HLPP over {tenureYears} years.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">HLPP (reducing cover)</div>
                    <div className="text-xl font-semibold">{formatCurrency(result.hlppTotal)}</div>
                    <p className="text-xs text-muted-foreground mt-2">Total over {tenureYears} years</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-md border-2 border-primary/20">
                    <div className="text-sm text-muted-foreground mb-1">Term Plan (level cover)</div>
                    <div className="text-xl font-semibold text-primary">{formatCurrency(result.termPlanTotal)}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatCurrency(result.termAnnualPremium)}/year × {tenureYears} yrs
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan amount</span>
                    <span>{formatCurrency(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HLPP method</span>
                    <span>Reducing balance @ {HLPP_RATE}%/yr on outstanding</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term plan cover</span>
                    <span>Level {formatCurrency(loanAmount)} for full tenure</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  HLPP is often sold by the lender at disbursement. A separate term plan keeps cover level
                  even as the loan reduces — beneficiaries receive full sum assured. Consult a licensed advisor
                  before switching.
                </p>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Explore term plans instead of HLPP</p>
                  {AFFILIATE_LINKS.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors text-sm"
                    >
                      {link.name}
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
