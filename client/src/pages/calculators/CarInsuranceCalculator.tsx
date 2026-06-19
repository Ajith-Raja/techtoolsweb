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
import { Car, Calculator, ExternalLink } from "lucide-react";

type EngineCategory = "upto1000" | "1000to1500" | "above1500";

/** IRDAI third-party premium (private car, 1-year policy) — indicative FY rates */
const TP_PREMIUM: Record<EngineCategory, number> = {
  upto1000: 2094,
  "1000to1500": 3416,
  above1500: 7897,
};

/** IDV depreciation % of ex-showroom price by vehicle age */
function getDepreciationRate(vehicleAgeYears: number): number {
  if (vehicleAgeYears <= 0) return 0.05;
  if (vehicleAgeYears <= 1) return 0.15;
  if (vehicleAgeYears <= 2) return 0.25;
  if (vehicleAgeYears <= 3) return 0.35;
  if (vehicleAgeYears <= 4) return 0.45;
  if (vehicleAgeYears <= 5) return 0.5;
  return 0.55;
}

/** Own damage rate % of IDV — varies by age and city */
function getOdRate(vehicleAgeYears: number, isMetro: boolean): number {
  const base = isMetro ? 3.2 : 2.8;
  const ageFactor = Math.min(vehicleAgeYears * 0.15, 0.6);
  return Math.max(base - ageFactor, 1.8);
}

/** No Claim Bonus discount on OD premium */
function getNcbDiscount(ncbYears: number): number {
  const discounts = [0, 0.2, 0.25, 0.35, 0.45, 0.5];
  return discounts[Math.min(ncbYears, 5)];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const AFFILIATE_LINKS = [
  { name: "Renew on PolicyBazaar", url: "https://www.policybazaar.com/motor-insurance/car-insurance/" },
  { name: "Compare on InsuranceDekho", url: "https://www.insurancedekho.com/car-insurance" },
];

interface Result {
  vehicleAge: number;
  idv: number;
  depreciationPct: number;
  tpPremium: number;
  odPremium: number;
  ncbDiscount: number;
  odAfterNcb: number;
  totalComprehensive: number;
  totalThirdPartyOnly: number;
}

export default function CarInsuranceCalculator() {
  const currentYear = new Date().getFullYear();
  const [exShowroomPrice, setExShowroomPrice] = useState(850000);
  const [manufacturingYear, setManufacturingYear] = useState(currentYear - 2);
  const [engineCategory, setEngineCategory] = useState<EngineCategory>("1000to1500");
  const [isMetro, setIsMetro] = useState(true);
  const [ncbYears, setNcbYears] = useState(1);
  const [result, setResult] = useState<Result | null>(null);

  const calculate = () => {
    const vehicleAge = Math.max(0, currentYear - manufacturingYear);
    const depreciationPct = getDepreciationRate(vehicleAge);
    const idv = Math.round(exShowroomPrice * (1 - depreciationPct));

    const tpPremium = TP_PREMIUM[engineCategory];
    const odRate = getOdRate(vehicleAge, isMetro);
    const odPremium = Math.round((idv * odRate) / 100);
    const ncbDiscount = getNcbDiscount(ncbYears);
    const odAfterNcb = Math.round(odPremium * (1 - ncbDiscount));

    const totalComprehensive = tpPremium + odAfterNcb;
    const totalThirdPartyOnly = tpPremium;

    setResult({
      vehicleAge,
      idv,
      depreciationPct: depreciationPct * 100,
      tpPremium,
      odPremium,
      ncbDiscount: ncbDiscount * 100,
      odAfterNcb,
      totalComprehensive,
      totalThirdPartyOnly,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Car className="h-8 w-8 mr-2 text-primary" />
          Car Insurance Premium Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Calculate IDV, third-party premium (IRDAI tariff), and own-damage premium with NCB discount
          for comprehensive cover.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>Enter ex-showroom price, year, engine size, and claim history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Ex-Showroom Price</Label>
                <span className="text-sm font-medium">{formatCurrency(exShowroomPrice)}</span>
              </div>
              <Slider
                min={200000}
                max={5000000}
                step={25000}
                value={[exShowroomPrice]}
                onValueChange={(v) => setExShowroomPrice(v[0])}
              />
              <Input
                type="number"
                min={100000}
                value={exShowroomPrice}
                onChange={(e) => setExShowroomPrice(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Manufacturing Year</Label>
              <Input
                type="number"
                min={2000}
                max={currentYear}
                value={manufacturingYear}
                onChange={(e) => setManufacturingYear(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Vehicle age: {Math.max(0, currentYear - manufacturingYear)} years
              </p>
            </div>

            <div className="space-y-2">
              <Label>Engine Capacity</Label>
              <Select value={engineCategory} onValueChange={(v) => setEngineCategory(v as EngineCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upto1000">Up to 1000 cc</SelectItem>
                  <SelectItem value="1000to1500">1000 cc – 1500 cc</SelectItem>
                  <SelectItem value="above1500">Above 1500 cc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Registration City</Label>
              <Select value={isMetro ? "metro" : "other"} onValueChange={(v) => setIsMetro(v === "metro")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metro">Metro city (higher OD rate)</SelectItem>
                  <SelectItem value="other">Non-metro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Claim-free years (NCB)</Label>
                <span className="text-sm font-medium">{ncbYears} year{ncbYears !== 1 ? "s" : ""}</span>
              </div>
              <Slider min={0} max={5} step={1} value={[ncbYears]} onValueChange={(v) => setNcbYears(v[0])} />
              <p className="text-xs text-muted-foreground">
                NCB discount: {getNcbDiscount(ncbYears) * 100}% on own-damage premium
              </p>
            </div>

            <Button onClick={calculate} className="w-full" size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Premium
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Premium Breakdown</CardTitle>
            <CardDescription>IDV calculation and TP + OD components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!result ? (
              <div className="p-6 text-center text-muted-foreground">
                Enter vehicle details and click Calculate Premium.
              </div>
            ) : (
              <>
                <div className="bg-primary/5 p-6 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Comprehensive Premium (Annual)</div>
                  <div className="text-3xl font-bold">{formatCurrency(result.totalComprehensive)}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Third-party only: {formatCurrency(result.totalThirdPartyOnly)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">IDV</div>
                    <div className="text-xl font-semibold">{formatCurrency(result.idv)}</div>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">Depreciation</div>
                    <div className="text-xl font-semibold">{result.depreciationPct.toFixed(0)}%</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle age</span>
                    <span>{result.vehicleAge} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Third-party (IRDAI tariff)</span>
                    <span>{formatCurrency(result.tpPremium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Own damage (before NCB)</span>
                    <span>{formatCurrency(result.odPremium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NCB discount</span>
                    <span>{result.ncbDiscount}%</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Own damage (after NCB)</span>
                    <span>{formatCurrency(result.odAfterNcb)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Renew or compare car insurance</p>
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
