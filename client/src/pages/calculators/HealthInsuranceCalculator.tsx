import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HeartPulse, Calculator, ExternalLink } from "lucide-react";

type CityTier = "tier1" | "tier2" | "tier3";

/** Base annual premium (₹) for ₹5L sum insured — individual, no PED */
const BASE_PREMIUM: Record<CityTier, Record<string, number>> = {
  tier1: { "18-25": 5200, "26-35": 6800, "36-45": 9800, "46-55": 15200, "56-65": 24500 },
  tier2: { "18-25": 4200, "26-35": 5600, "36-45": 8200, "46-55": 12800, "56-65": 20500 },
  tier3: { "18-25": 3500, "26-35": 4800, "36-45": 7000, "46-55": 10800, "56-65": 17200 },
};

const FAMILY_MULTIPLIER: Record<number, number> = {
  1: 1,
  2: 1.75,
  3: 2.35,
  4: 2.85,
  5: 3.3,
};

const SUM_INSURED_BY_TIER: Record<CityTier, Record<number, number>> = {
  tier1: { 1: 1000000, 2: 1500000, 3: 2000000, 4: 2500000, 5: 3000000 },
  tier2: { 1: 500000, 2: 1000000, 3: 1500000, 4: 2000000, 5: 2500000 },
  tier3: { 1: 300000, 2: 500000, 3: 1000000, 4: 1500000, 5: 2000000 },
};

function getAgeBand(age: number): string {
  if (age <= 25) return "18-25";
  if (age <= 35) return "26-35";
  if (age <= 45) return "36-45";
  if (age <= 55) return "46-55";
  return "56-65";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const AFFILIATE_LINKS = [
  { name: "Compare on PolicyBazaar", url: "https://www.policybazaar.com/health-insurance/" },
  { name: "Get quotes on InsuranceDekho", url: "https://www.insurancedekho.com/health-insurance" },
];

interface Result {
  premiumLow: number;
  premiumHigh: number;
  recommendedSumInsured: number;
  ageBand: string;
}

export default function HealthInsuranceCalculator() {
  const [age, setAge] = useState(34);
  const [cityTier, setCityTier] = useState<CityTier>("tier1");
  const [familySize, setFamilySize] = useState(3);
  const [hasPreExisting, setHasPreExisting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const calculate = () => {
    const ageBand = getAgeBand(age);
    const base = BASE_PREMIUM[cityTier][ageBand];
    const familyMult = FAMILY_MULTIPLIER[Math.min(familySize, 5)] ?? 3.3;
    const pedLoading = hasPreExisting ? 1.25 : 1;

    const adjustedBase = base * familyMult * pedLoading;
    const premiumLow = Math.round(adjustedBase * 0.92);
    const premiumHigh = Math.round(adjustedBase * 1.18);

    const recommendedSumInsured =
      SUM_INSURED_BY_TIER[cityTier][Math.min(familySize, 5)] ?? SUM_INSURED_BY_TIER[cityTier][5];

    setResult({ premiumLow, premiumHigh, recommendedSumInsured, ageBand });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <HeartPulse className="h-8 w-8 mr-2 text-primary" />
          Health Insurance Premium Estimator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Estimate your health insurance premium band and recommended sum insured based on age, city
          tier, family size, and pre-existing conditions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>Premium lookup uses age bands × city tier × family size.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Age (oldest member for family floater)</Label>
                <span className="text-sm font-medium">{age} years</span>
              </div>
              <Slider min={18} max={65} step={1} value={[age]} onValueChange={(v) => setAge(v[0])} />
              <Input type="number" min={18} max={65} value={age} onChange={(e) => setAge(Number(e.target.value))} />
            </div>

            <div className="space-y-2">
              <Label>City Tier</Label>
              <Select value={cityTier} onValueChange={(v) => setCityTier(v as CityTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier1">Tier 1 — Metro (Mumbai, Delhi, Bangalore, etc.)</SelectItem>
                  <SelectItem value="tier2">Tier 2 — Large cities</SelectItem>
                  <SelectItem value="tier3">Tier 3 — Smaller cities & towns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Family Size (members covered)</Label>
                <span className="text-sm font-medium">{familySize}</span>
              </div>
              <Slider min={1} max={5} step={1} value={[familySize]} onValueChange={(v) => setFamilySize(v[0])} />
              <Input
                type="number"
                min={1}
                max={8}
                value={familySize}
                onChange={(e) => setFamilySize(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Pre-existing conditions</Label>
                <p className="text-xs text-muted-foreground">Adds ~25% loading to estimated premium</p>
              </div>
              <Switch checked={hasPreExisting} onCheckedChange={setHasPreExisting} />
            </div>

            <Button onClick={calculate} className="w-full" size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Estimate Premium
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Premium Estimate</CardTitle>
            <CardDescription>Indicative annual premium and recommended cover</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!result ? (
              <div className="p-6 text-center text-muted-foreground">
                Fill in your details and click Estimate Premium.
              </div>
            ) : (
              <>
                <div className="bg-primary/5 p-6 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Estimated Annual Premium</div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(result.premiumLow)} – {formatCurrency(result.premiumHigh)}
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Recommended Sum Insured</div>
                  <div className="text-2xl font-semibold">{formatCurrency(result.recommendedSumInsured)}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on city tier and family size for adequate hospitalisation cover in India.
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age band</span>
                    <span>{result.ageBand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City tier</span>
                    <span>{cityTier === "tier1" ? "Metro" : cityTier === "tier2" ? "Tier 2" : "Tier 3"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Family members</span>
                    <span>{familySize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pre-existing loading</span>
                    <span>{hasPreExisting ? "Yes (+25%)" : "No"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Compare & buy health insurance</p>
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
