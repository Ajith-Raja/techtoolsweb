import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calculator, TrendingUp, DollarSign } from "lucide-react";

export default function InvestmentCalculator() {
  // State for investment amount
  const [initialInvestment, setInitialInvestment] = useState<number>(100000);
  const [additionalInvestment, setAdditionalInvestment] = useState<number>(0);
  const [additionalInvestmentFrequency, setAdditionalInvestmentFrequency] = useState<string>("yearly");
  
  // State for investment period
  const [investmentPeriod, setInvestmentPeriod] = useState<number>(10);
  const [periodUnit, setPeriodUnit] = useState<string>("years");
  
  // State for investment returns
  const [expectedReturn, setExpectedReturn] = useState<number>(8);
  const [compoundingFrequency, setCompoundingFrequency] = useState<string>("annually");
  
  // Results
  const [futureValue, setFutureValue] = useState<number | null>(null);
  const [totalInvestment, setTotalInvestment] = useState<number | null>(null);
  const [totalInterest, setTotalInterest] = useState<number | null>(null);
  const [yearlyBreakdown, setYearlyBreakdown] = useState<any[]>([]);

  // Calculate investment growth
  const calculateInvestment = () => {
    // Convert all periods to years for calculation
    let yearsTotal: number;
    switch (periodUnit) {
      case "months":
        yearsTotal = investmentPeriod / 12;
        break;
      case "years":
      default:
        yearsTotal = investmentPeriod;
        break;
    }

    // Calculate number of compounds per year
    let compoundsPerYear: number;
    switch (compoundingFrequency) {
      case "daily":
        compoundsPerYear = 365;
        break;
      case "monthly":
        compoundsPerYear = 12;
        break;
      case "quarterly":
        compoundsPerYear = 4;
        break;
      case "semi-annually":
        compoundsPerYear = 2;
        break;
      case "annually":
      default:
        compoundsPerYear = 1;
        break;
    }

    // Calculate rate per period
    const ratePerPeriod = expectedReturn / (100 * compoundsPerYear);

    // Calculate total number of compounding periods
    const totalPeriods = yearsTotal * compoundsPerYear;

    // Calculate additional contributions per compounding period
    let contributionsPerPeriod: number;
    switch (additionalInvestmentFrequency) {
      case "monthly":
        contributionsPerPeriod = additionalInvestment / compoundsPerYear;
        if (compoundingFrequency === "daily") {
          contributionsPerPeriod = additionalInvestment * 12 / 365;
        }
        break;
      case "quarterly":
        contributionsPerPeriod = additionalInvestment * 4 / compoundsPerYear;
        break;
      case "yearly":
      default:
        contributionsPerPeriod = additionalInvestment / compoundsPerYear;
        break;
    }

    // Generate yearly breakdown
    const breakdown = [];
    let currentValue = initialInvestment;
    let investedAmount = initialInvestment;
    
    // Loop through each period to calculate compound interest
    for (let period = 1; period <= totalPeriods; period++) {
      // Add contributions
      currentValue += contributionsPerPeriod;
      investedAmount += contributionsPerPeriod;
      
      // Apply compound interest
      currentValue = currentValue * (1 + ratePerPeriod);
      
      // Record yearly data
      if (period % compoundsPerYear === 0 || period === totalPeriods) {
        const year = Math.ceil(period / compoundsPerYear);
        breakdown.push({
          year,
          investedAmount,
          interestEarned: currentValue - investedAmount,
          totalValue: currentValue,
        });
      }
    }

    setFutureValue(currentValue);
    setTotalInvestment(investedAmount);
    setTotalInterest(currentValue - investedAmount);
    setYearlyBreakdown(breakdown);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <BarChart3 className="h-8 w-8 mr-2 text-primary" />
          Investment Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Calculate future value of your investments with compound interest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Investment Calculator</CardTitle>
            <CardDescription>
              Enter your investment details to calculate future value
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="amount" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="amount">Amount</TabsTrigger>
                <TabsTrigger value="period">Period</TabsTrigger>
                <TabsTrigger value="returns">Returns</TabsTrigger>
              </TabsList>
              
              <TabsContent value="amount" className="space-y-4 pt-4">
                {/* Initial Investment */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="initial-investment">Initial Investment</Label>
                    <span className="text-sm font-medium">{formatCurrency(initialInvestment)}</span>
                  </div>
                  <Slider
                    id="initial-investment"
                    min={1000}
                    max={10000000}
                    step={10000}
                    value={[initialInvestment]}
                    onValueChange={(values) => setInitialInvestment(values[0])}
                  />
                  <Input
                    type="number"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                {/* Additional Investment */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="additional-investment">Additional Investment</Label>
                    <span className="text-sm font-medium">{formatCurrency(additionalInvestment)}</span>
                  </div>
                  <Slider
                    id="additional-investment"
                    min={0}
                    max={1000000}
                    step={5000}
                    value={[additionalInvestment]}
                    onValueChange={(values) => setAdditionalInvestment(values[0])}
                  />
                  <Input
                    type="number"
                    value={additionalInvestment}
                    onChange={(e) => setAdditionalInvestment(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                {/* Additional Investment Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="additional-investment-frequency">Contribution Frequency</Label>
                  <Select
                    value={additionalInvestmentFrequency}
                    onValueChange={setAdditionalInvestmentFrequency}
                  >
                    <SelectTrigger id="additional-investment-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="period" className="space-y-4 pt-4">
                {/* Investment Period */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="investment-period">Investment Period</Label>
                    <span className="text-sm font-medium">
                      {investmentPeriod} {periodUnit}
                    </span>
                  </div>
                  <Slider
                    id="investment-period"
                    min={periodUnit === "months" ? 1 : 1}
                    max={periodUnit === "months" ? 120 : 40}
                    step={periodUnit === "months" ? 1 : 1}
                    value={[investmentPeriod]}
                    onValueChange={(values) => setInvestmentPeriod(values[0])}
                  />
                  <Input
                    type="number"
                    value={investmentPeriod}
                    onChange={(e) => setInvestmentPeriod(Number(e.target.value))}
                    min={1}
                  />
                </div>
                
                {/* Period Unit */}
                <div className="space-y-2">
                  <Label htmlFor="period-unit">Period Unit</Label>
                  <Select
                    value={periodUnit}
                    onValueChange={(value) => {
                      setPeriodUnit(value);
                      // Adjust period when switching between months and years
                      if (value === "months" && periodUnit === "years") {
                        setInvestmentPeriod(investmentPeriod * 12);
                      } else if (value === "years" && periodUnit === "months") {
                        setInvestmentPeriod(Math.max(1, Math.floor(investmentPeriod / 12)));
                      }
                    }}
                  >
                    <SelectTrigger id="period-unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="returns" className="space-y-4 pt-4">
                {/* Expected Return Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="expected-return">Expected Annual Return (%)</Label>
                    <span className="text-sm font-medium">{expectedReturn}%</span>
                  </div>
                  <Slider
                    id="expected-return"
                    min={1}
                    max={30}
                    step={0.5}
                    value={[expectedReturn]}
                    onValueChange={(values) => setExpectedReturn(values[0])}
                  />
                  <Input
                    type="number"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    min={0}
                    max={50}
                    step={0.1}
                  />
                </div>
                
                {/* Compounding Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="compounding-frequency">Compounding Frequency</Label>
                  <Select
                    value={compoundingFrequency}
                    onValueChange={setCompoundingFrequency}
                  >
                    <SelectTrigger id="compounding-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={calculateInvestment} 
              className="w-full mt-4"
              size="lg"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Investment
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div>
          {futureValue !== null && totalInvestment !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Investment Results</CardTitle>
                <CardDescription>
                  Projected value of your investment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Principal Amount</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalInvestment)}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Interest Earned</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(totalInterest || 0)}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-primary/10 p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Future Value</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(futureValue)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-4 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Year-by-Year Breakdown
                  </h3>
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="border p-2 text-left">Year</th>
                          <th className="border p-2 text-right">Principal</th>
                          <th className="border p-2 text-right">Interest</th>
                          <th className="border p-2 text-right">Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearlyBreakdown.map((data) => (
                          <tr key={data.year} className="hover:bg-muted/20">
                            <td className="border p-2 text-left">{data.year}</td>
                            <td className="border p-2 text-right">
                              {formatCurrency(data.investedAmount)}
                            </td>
                            <td className="border p-2 text-right text-primary">
                              {formatCurrency(data.interestEarned)}
                            </td>
                            <td className="border p-2 text-right font-medium">
                              {formatCurrency(data.totalValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Investment Summary */}
                <div className="p-4 rounded-lg bg-muted/30 mt-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Investment Summary
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span>Initial Investment:</span>
                      <span className="font-medium">{formatCurrency(initialInvestment)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Additional Contributions:</span>
                      <span className="font-medium">
                        {formatCurrency(additionalInvestment)} ({additionalInvestmentFrequency})
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Investment Period:</span>
                      <span className="font-medium">{investmentPeriod} {periodUnit}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Annual Return Rate:</span>
                      <span className="font-medium">{expectedReturn}%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Compounding Frequency:</span>
                      <span className="font-medium">{compoundingFrequency}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Final Investment Value:</span>
                      <span className="font-medium">{formatCurrency(futureValue || 0)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Total Interest Earned:</span>
                      <span className="font-medium text-primary">{formatCurrency(totalInterest || 0)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Return on Investment:</span>
                      <span className="font-medium">
                        {((totalInterest || 0) / totalInvestment * 100).toFixed(2)}%
                      </span>
                    </li>
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