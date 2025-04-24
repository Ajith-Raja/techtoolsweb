import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calculator, Receipt, ArrowRight, Layers, PieChart } from "lucide-react";

export default function IncomeTaxCalculator() {
  // Tax regime
  const [taxRegime, setTaxRegime] = useState<"old" | "new">("new");
  
  // Income details
  const [basicSalary, setBasicSalary] = useState<number>(600000);
  const [hra, setHra] = useState<number>(240000);
  const [otherAllowances, setOtherAllowances] = useState<number>(120000);
  const [professionalIncome, setProfessionalIncome] = useState<number>(0);
  const [capitalGains, setCapitalGains] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<number>(0);
  
  // Deductions (for old regime)
  const [section80C, setSection80C] = useState<number>(150000);
  const [section80D, setSection80D] = useState<number>(25000);
  const [hraExemption, setHraExemption] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(50000);
  
  // HRA Calculation
  const [rentPaid, setRentPaid] = useState<number>(180000);
  const [cityType, setCityType] = useState<"metro" | "non-metro">("metro");
  
  // Results
  const [results, setResults] = useState<{
    grossIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    taxLiability: number;
    effectiveTaxRate: number;
    taxBreakup: {
      label: string;
      amount: number;
      rate: string;
    }[];
  } | null>(null);

  // Calculate HRA exemption
  const calculateHraExemption = () => {
    // HRA exemption is the minimum of:
    // 1. Actual HRA received
    // 2. 50% of (Basic Salary) for metro cities, 40% for non-metro
    // 3. Rent paid - 10% of Basic Salary
    
    const basicComponent = cityType === "metro" 
      ? basicSalary * 0.5 
      : basicSalary * 0.4;
    
    const rentComponent = rentPaid - (basicSalary * 0.1);
    
    // Find the minimum of the three
    const exemption = Math.min(
      hra,
      basicComponent,
      Math.max(0, rentComponent)
    );
    
    setHraExemption(exemption);
  };

  // Calculate tax for old regime
  const calculateOldRegimeTax = (taxableAmount: number) => {
    let tax = 0;
    let remaining = taxableAmount;
    const breakup = [];
    
    // No tax up to ₹2.5 lakh
    if (remaining > 0) {
      const taxableInThisSlab = Math.min(remaining, 250000);
      breakup.push({
        label: "Up to ₹2.5 Lakh",
        amount: taxableInThisSlab,
        rate: "0%"
      });
      remaining -= taxableInThisSlab;
    }
    
    // 5% for ₹2.5 lakh to ₹5 lakh
    if (remaining > 0) {
      const taxableInThisSlab = Math.min(remaining, 250000);
      tax += taxableInThisSlab * 0.05;
      breakup.push({
        label: "₹2.5 Lakh to ₹5 Lakh",
        amount: taxableInThisSlab,
        rate: "5%"
      });
      remaining -= taxableInThisSlab;
    }
    
    // 20% for ₹5 lakh to ₹10 lakh
    if (remaining > 0) {
      const taxableInThisSlab = Math.min(remaining, 500000);
      tax += taxableInThisSlab * 0.2;
      breakup.push({
        label: "₹5 Lakh to ₹10 Lakh",
        amount: taxableInThisSlab,
        rate: "20%"
      });
      remaining -= taxableInThisSlab;
    }
    
    // 30% for above ₹10 lakh
    if (remaining > 0) {
      tax += remaining * 0.3;
      breakup.push({
        label: "Above ₹10 Lakh",
        amount: remaining,
        rate: "30%"
      });
    }
    
    // Apply rebate if applicable (for income up to ₹5 lakh)
    if (taxableAmount <= 500000) {
      tax = 0;
    }
    
    // Calculate cess (4% on tax)
    const cess = tax * 0.04;
    tax += cess;
    
    // Add health & education cess to breakup
    if (cess > 0) {
      breakup.push({
        label: "Health & Education Cess",
        amount: cess,
        rate: "4% of tax"
      });
    }
    
    return { tax, breakup };
  };

  // Calculate tax for new regime
  const calculateNewRegimeTax = (taxableAmount: number) => {
    let tax = 0;
    let remaining = taxableAmount;
    const breakup = [];
    
    // No tax up to ₹3 lakh
    if (remaining > 0) {
      const taxableInThisSlab = Math.min(remaining, 300000);
      breakup.push({
        label: "Up to ₹3 Lakh",
        amount: taxableInThisSlab,
        rate: "0%"
      });
      remaining -= taxableInThisSlab;
    }
    
    // 5% for ₹3 lakh to ₹6 lakh
    if (remaining > 0) {
      const taxableInThisSlab = Math.min(remaining, 300000);
      tax += taxableInThisSlab * 0.05;
      breakup.push({
        label: "₹3 Lakh to ₹6 Lakh",
        amount: taxableInThisSlab,
        rate: "5%"
      });
      remaining -= taxableInThisSlab;
    }
    
    // 10% for ₹6 lakh to ₹9 lakh
    if (remaining > 0) {
      const taxableInThisSlab = Math.min(remaining, 300000);
      tax += taxableInThisSlab * 0.1;
      breakup.push({
        label: "₹6 Lakh to ₹9 Lakh",
        amount: taxableInThisSlab,
        rate: "10%"
      });
      remaining -= taxableInThisSlab;
    }
    
    // 15% for ₹9 lakh to ₹12 lakh
    if (remaining > 0) {
      const taxableInThisSlab = Math.min(remaining, 300000);
      tax += taxableInThisSlab * 0.15;
      breakup.push({
        label: "₹9 Lakh to ₹12 Lakh",
        amount: taxableInThisSlab,
        rate: "15%"
      });
      remaining -= taxableInThisSlab;
    }
    
    // 20% for ₹12 lakh to ₹15 lakh
    if (remaining > 0) {
      const taxableInThisSlab = Math.min(remaining, 300000);
      tax += taxableInThisSlab * 0.2;
      breakup.push({
        label: "₹12 Lakh to ₹15 Lakh",
        amount: taxableInThisSlab,
        rate: "20%"
      });
      remaining -= taxableInThisSlab;
    }
    
    // 30% for above ₹15 lakh
    if (remaining > 0) {
      tax += remaining * 0.3;
      breakup.push({
        label: "Above ₹15 Lakh",
        amount: remaining,
        rate: "30%"
      });
    }
    
    // Apply rebate if applicable (for income up to ₹7 lakh)
    if (taxableAmount <= 700000) {
      tax = 0;
    }
    
    // Calculate cess (4% on tax)
    const cess = tax * 0.04;
    tax += cess;
    
    // Add health & education cess to breakup
    if (cess > 0) {
      breakup.push({
        label: "Health & Education Cess",
        amount: cess,
        rate: "4% of tax"
      });
    }
    
    return { tax, breakup };
  };

  // Calculate overall tax
  const calculateTax = () => {
    // Calculate HRA exemption if in old regime
    if (taxRegime === "old") {
      calculateHraExemption();
    }
    
    // Calculate gross income
    const grossIncome = basicSalary + hra + otherAllowances + professionalIncome + capitalGains + otherIncome;
    
    // Calculate deductions (only applicable in old regime)
    let totalDeductions = 0;
    if (taxRegime === "old") {
      totalDeductions = Math.min(section80C, 150000) + 
                        Math.min(section80D, 50000) + 
                        hraExemption + 
                        otherDeductions;
    } else {
      // Standard deduction of 50,000 in the new regime
      totalDeductions = 50000;
    }
    
    // Calculate taxable income
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);
    
    // Calculate tax based on regime
    const { tax, breakup } = taxRegime === "old" 
      ? calculateOldRegimeTax(taxableIncome) 
      : calculateNewRegimeTax(taxableIncome);
    
    // Calculate effective tax rate
    const effectiveTaxRate = grossIncome > 0 ? (tax / grossIncome) * 100 : 0;
    
    setResults({
      grossIncome,
      totalDeductions,
      taxableIncome,
      taxLiability: tax,
      effectiveTaxRate,
      taxBreakup: breakup,
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Receipt className="h-8 w-8 mr-2 text-primary" />
          Income Tax Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Estimate income tax liability based on your income and applicable deductions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Tax Calculator</CardTitle>
            <CardDescription>
              Enter your income details to calculate tax liability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tax Regime Selection */}
            <div className="space-y-3">
              <Label>Tax Regime</Label>
              <RadioGroup
                value={taxRegime}
                onValueChange={(value) => setTaxRegime(value as "old" | "new")}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="old" id="old-regime" />
                  <Label htmlFor="old-regime" className="font-normal cursor-pointer">
                    Old Regime (with deductions)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new-regime" />
                  <Label htmlFor="new-regime" className="font-normal cursor-pointer">
                    New Regime (lower rates, fewer deductions)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <Tabs defaultValue="income" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">Income</TabsTrigger>
                {taxRegime === "old" && (
                  <TabsTrigger value="deductions">Deductions</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="income" className="space-y-4 pt-4">
                {/* Basic Salary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="basic-salary">Basic Salary</Label>
                    <span className="text-sm font-medium">{formatCurrency(basicSalary)}</span>
                  </div>
                  <Slider
                    id="basic-salary"
                    min={0}
                    max={5000000}
                    step={10000}
                    value={[basicSalary]}
                    onValueChange={(values) => setBasicSalary(values[0])}
                  />
                  <Input
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                {/* HRA */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="hra">House Rent Allowance (HRA)</Label>
                    <span className="text-sm font-medium">{formatCurrency(hra)}</span>
                  </div>
                  <Slider
                    id="hra"
                    min={0}
                    max={1000000}
                    step={5000}
                    value={[hra]}
                    onValueChange={(values) => setHra(values[0])}
                  />
                  <Input
                    type="number"
                    value={hra}
                    onChange={(e) => setHra(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                {/* Other Allowances */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="other-allowances">Other Allowances</Label>
                    <span className="text-sm font-medium">{formatCurrency(otherAllowances)}</span>
                  </div>
                  <Slider
                    id="other-allowances"
                    min={0}
                    max={1000000}
                    step={5000}
                    value={[otherAllowances]}
                    onValueChange={(values) => setOtherAllowances(values[0])}
                  />
                  <Input
                    type="number"
                    value={otherAllowances}
                    onChange={(e) => setOtherAllowances(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                {/* Additional Income Sources */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="professional-income">Professional/Business Income</Label>
                    <span className="text-sm font-medium">{formatCurrency(professionalIncome)}</span>
                  </div>
                  <Input
                    id="professional-income"
                    type="number"
                    value={professionalIncome}
                    onChange={(e) => setProfessionalIncome(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="capital-gains">Capital Gains</Label>
                    <span className="text-sm font-medium">{formatCurrency(capitalGains)}</span>
                  </div>
                  <Input
                    id="capital-gains"
                    type="number"
                    value={capitalGains}
                    onChange={(e) => setCapitalGains(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="other-income">Other Income</Label>
                    <span className="text-sm font-medium">{formatCurrency(otherIncome)}</span>
                  </div>
                  <Input
                    id="other-income"
                    type="number"
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </TabsContent>
              
              {taxRegime === "old" && (
                <TabsContent value="deductions" className="space-y-4 pt-4">
                  {/* Section 80C */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="section-80c">Section 80C (Max ₹1.5 Lakh)</Label>
                      <span className="text-sm font-medium">{formatCurrency(section80C)}</span>
                    </div>
                    <Slider
                      id="section-80c"
                      min={0}
                      max={150000}
                      step={5000}
                      value={[section80C]}
                      onValueChange={(values) => setSection80C(values[0])}
                    />
                    <Input
                      type="number"
                      value={section80C}
                      onChange={(e) => setSection80C(Number(e.target.value))}
                      min={0}
                      max={150000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Includes PF, PPF, ELSS, Life Insurance, NSC, etc.
                    </p>
                  </div>
                  
                  {/* Section 80D */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="section-80d">Section 80D (Health Insurance)</Label>
                      <span className="text-sm font-medium">{formatCurrency(section80D)}</span>
                    </div>
                    <Slider
                      id="section-80d"
                      min={0}
                      max={50000}
                      step={1000}
                      value={[section80D]}
                      onValueChange={(values) => setSection80D(values[0])}
                    />
                    <Input
                      type="number"
                      value={section80D}
                      onChange={(e) => setSection80D(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  
                  {/* HRA Exemption Calculation */}
                  <div className="space-y-2 p-4 bg-muted/20 rounded-lg">
                    <h3 className="font-medium">HRA Exemption Calculator</h3>
                    
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="rent-paid">Annual Rent Paid</Label>
                      <Input
                        id="rent-paid"
                        type="number"
                        value={rentPaid}
                        onChange={(e) => setRentPaid(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <Label>City Type</Label>
                      <RadioGroup
                        value={cityType}
                        onValueChange={(value) => setCityType(value as "metro" | "non-metro")}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="metro" id="metro" />
                          <Label htmlFor="metro" className="font-normal cursor-pointer">
                            Metro
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="non-metro" id="non-metro" />
                          <Label htmlFor="non-metro" className="font-normal cursor-pointer">
                            Non-Metro
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Button 
                      onClick={calculateHraExemption}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Calculate HRA Exemption
                    </Button>
                    
                    {hraExemption > 0 && (
                      <div className="mt-3 p-2 bg-primary/10 rounded text-sm">
                        Calculated HRA Exemption: {formatCurrency(hraExemption)}
                      </div>
                    )}
                  </div>
                  
                  {/* Other Deductions */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="other-deductions">Other Deductions</Label>
                      <span className="text-sm font-medium">{formatCurrency(otherDeductions)}</span>
                    </div>
                    <Input
                      id="other-deductions"
                      type="number"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(Number(e.target.value))}
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Includes 80E (Education Loan), 80G (Donations), etc.
                    </p>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <Button 
              onClick={calculateTax} 
              className="w-full mt-4"
              size="lg"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Tax Liability
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div>
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Tax Calculation Results</CardTitle>
                <CardDescription>
                  {taxRegime === "old" ? "Old Regime Tax Calculation" : "New Regime Tax Calculation"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Gross Income</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(results.grossIncome)}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Total Deductions</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(results.totalDeductions)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Taxable Income</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(results.taxableIncome)}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-primary/10 p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Tax Liability</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(results.taxLiability)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Effective Rate: {formatPercentage(results.effectiveTaxRate)}
                    </div>
                  </div>
                </div>
                
                {/* Tax Breakup */}
                <div className="mt-6">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Tax Breakup
                  </h3>
                  <div className="max-h-[240px] overflow-y-auto pr-2">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="border p-2 text-left">Income Slab</th>
                          <th className="border p-2 text-right">Amount</th>
                          <th className="border p-2 text-center">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.taxBreakup.map((slab, index) => (
                          <tr key={index} className="hover:bg-muted/20">
                            <td className="border p-2 text-left">{slab.label}</td>
                            <td className="border p-2 text-right">
                              {formatCurrency(slab.amount)}
                            </td>
                            <td className="border p-2 text-center">
                              {slab.rate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Tax Saving Tips */}
                <div className="p-4 rounded-lg bg-muted/30 mt-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <PieChart className="h-4 w-4 mr-2" />
                    Tax Saving Tips
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {taxRegime === "old" ? (
                      <>
                        <li>Maximize your Section 80C investments (up to ₹1.5 lakh) through PPF, ELSS, etc.</li>
                        <li>Invest in health insurance premiums to claim deduction under Section 80D.</li>
                        <li>Consider home loan interest deduction under Section 24 if applicable.</li>
                        <li>Salary restructuring can help optimize tax liability.</li>
                      </>
                    ) : (
                      <>
                        <li>The new tax regime may be beneficial if you don't claim many deductions.</li>
                        <li>Compare your tax liability under both regimes to choose the optimal one.</li>
                        <li>Consider standard deduction of ₹50,000 available under the new regime.</li>
                      </>
                    )}
                    <li>Consult a tax professional for personalized tax planning advice.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}