import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Shield, Calculator, ExternalLink } from "lucide-react";

const RETIREMENT_AGE = 60;

/** Premium rate per ₹1 lakh sum assured per year (indicative, age-based) */
function getPremiumRatePerLakh(age: number): { low: number; high: number } {
  if (age <= 25) return { low: 180, high: 320 };
  if (age <= 30) return { low: 220, high: 380 };
  if (age <= 35) return { low: 280, high: 480 };
  if (age <= 40) return { low: 380, high: 620 };
  if (age <= 45) return { low: 520, high: 850 };
  if (age <= 50) return { low: 780, high: 1200 };
  if (age <= 55) return { low: 1100, high: 1800 };
  return { low: 1600, high: 2600 };
}

function roundToLakhs(amount: number, step = 500000): number {
  return Math.max(0, Math.ceil(amount / step) * step);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const AFFILIATE_LINKS = [
  { name: "Compare on PolicyBazaar", url: "https://www.policybazaar.com/life-insurance/term-insurance/" },
  { name: "HDFC Life Term Plans", url: "https://www.hdfclife.com/term-insurance-plans" },
  { name: "ICICI Prudential iProtect", url: "https://www.iciciprulife.com/term-insurance-plans/buy-term-insurance/iProtect-smart.html" },
];

interface Result {
  yearsRemaining: number;
  humanLifeValue: number;
  dependentsAddition: number;
  grossCoverNeeded: number;
  recommendedCover: number;
  premiumLow: number;
  premiumHigh: number;
}

export default function TermLifeInsuranceCalculator() {
  const [age, setAge] = useState(32);
  const [annualIncome, setAnnualIncome] = useState(1200000);
  const [dependents, setDependents] = useState(2);
  const [existingCover, setExistingCover] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const calculate = () => {
    const yearsRemaining = Math.max(RETIREMENT_AGE - age, 5);
    const humanLifeValue = annualIncome * yearsRemaining;
    const dependentsAddition = dependents * 1000000;
    const grossCoverNeeded = humanLifeValue + dependentsAddition;
    const recommendedCover = roundToLakhs(Math.max(grossCoverNeeded - existingCover, 5000000));

    const coverInLakhs = recommendedCover / 100000;
    const rates = getPremiumRatePerLakh(age);
    const premiumLow = Math.round((coverInLakhs * rates.low) / 12);
    const premiumHigh = Math.round((coverInLakhs * rates.high) / 12);

    setResult({
      yearsRemaining,
      humanLifeValue,
      dependentsAddition,
      grossCoverNeeded,
      recommendedCover,
      premiumLow,
      premiumHigh,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Shield className="h-8 w-8 mr-2 text-primary" />
          Term Life Insurance Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Estimate how much term life cover you need using the Human Life Value method — income ×
          working years remaining, adjusted for dependents and existing cover.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>All calculations run in your browser — nothing is sent to a server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Age</Label>
                <span className="text-sm font-medium">{age} years</span>
              </div>
              <Slider min={18} max={65} step={1} value={[age]} onValueChange={(v) => setAge(v[0])} />
              <Input type="number" min={18} max={65} value={age} onChange={(e) => setAge(Number(e.target.value))} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Annual Income</Label>
                <span className="text-sm font-medium">{formatCurrency(annualIncome)}</span>
              </div>
              <Slider
                min={300000}
                max={5000000}
                step={50000}
                value={[annualIncome]}
                onValueChange={(v) => setAnnualIncome(v[0])}
              />
              <Input
                type="number"
                min={100000}
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Number of Dependents</Label>
                <span className="text-sm font-medium">{dependents}</span>
              </div>
              <Slider min={0} max={6} step={1} value={[dependents]} onValueChange={(v) => setDependents(v[0])} />
              <Input
                type="number"
                min={0}
                max={10}
                value={dependents}
                onChange={(e) => setDependents(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Adds ₹10 lakh per dependent to recommended cover.</p>
            </div>

            <div className="space-y-2">
              <Label>Existing Life Cover</Label>
              <Input
                type="number"
                min={0}
                value={existingCover}
                onChange={(e) => setExistingCover(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <Button onClick={calculate} className="w-full" size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Cover Needed
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Cover</CardTitle>
            <CardDescription>Human Life Value breakdown and indicative premium range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!result ? (
              <div className="p-6 text-center text-muted-foreground">
                Enter your details and click Calculate to see results.
              </div>
            ) : (
              <>
                <div className="bg-primary/5 p-6 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Recommended Term Cover</div>
                  <div className="text-3xl font-bold">{formatCurrency(result.recommendedCover)}</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Years to retirement ({RETIREMENT_AGE})</span>
                    <span>{result.yearsRemaining} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Human Life Value (income × years)</span>
                    <span>{formatCurrency(result.humanLifeValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dependents addition</span>
                    <span>{formatCurrency(result.dependentsAddition)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross cover needed</span>
                    <span>{formatCurrency(result.grossCoverNeeded)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Less existing cover</span>
                    <span>- {formatCurrency(existingCover)}</span>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Estimated Monthly Premium</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(result.premiumLow)} – {formatCurrency(result.premiumHigh)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Indicative range for a 20–30 year term plan. Actual quotes vary by insurer, health, and lifestyle.
                  </p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Compare plans & get quotes</p>
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
