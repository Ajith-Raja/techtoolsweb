import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calculator, PiggyBank, LineChart } from "lucide-react";
// Import any necessary components from recharts if needed
// import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function SIPCalculator() {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(5000);
  const [years, setYears] = useState<number>(10);
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [showChart, setShowChart] = useState<boolean>(false);
  
  // Results
  const [totalInvestment, setTotalInvestment] = useState<number | null>(null);
  const [estimatedReturns, setEstimatedReturns] = useState<number | null>(null);
  const [maturityValue, setMaturityValue] = useState<number | null>(null);
  const [yearlyData, setYearlyData] = useState<any[]>([]);

  // Calculate SIP returns
  const calculateSIP = () => {
    const monthlyRate = expectedReturn / (12 * 100);
    const months = years * 12;
    
    const futureValue = monthlyInvestment * 
      (Math.pow(1 + monthlyRate, months) - 1) * 
      (1 + monthlyRate) / monthlyRate;
    
    const totalInvested = monthlyInvestment * months;
    const returns = futureValue - totalInvested;
    
    setTotalInvestment(totalInvested);
    setEstimatedReturns(returns);
    setMaturityValue(futureValue);
    setShowChart(true);
    
    // Generate yearly data for chart
    const yearly = [];
    for (let y = 1; y <= years; y++) {
      const m = y * 12;
      const invested = monthlyInvestment * m;
      const fv = monthlyInvestment * 
        (Math.pow(1 + monthlyRate, m) - 1) * 
        (1 + monthlyRate) / monthlyRate;
      
      yearly.push({
        year: y,
        invested,
        returns: fv - invested,
        total: fv,
      });
    }
    setYearlyData(yearly);
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
    return `${value}%`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <PiggyBank className="h-8 w-8 mr-2 text-primary" />
          SIP Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Calculate returns on your Systematic Investment Plan (SIP) investments over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>SIP Calculator</CardTitle>
            <CardDescription>
              Enter your investment details to calculate estimated returns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly Investment */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="monthly-investment">Monthly Investment</Label>
                <span className="text-sm font-medium">
                  {formatCurrency(monthlyInvestment)}
                </span>
              </div>
              <Slider
                id="monthly-investment"
                min={500}
                max={100000}
                step={500}
                value={[monthlyInvestment]}
                onValueChange={(values) => setMonthlyInvestment(values[0])}
              />
              <Input
                type="number"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                min={500}
                step={500}
                className="mt-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹500</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            {/* Investment Period */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="years">Investment Period (Years)</Label>
                <span className="text-sm font-medium">
                  {years} {years === 1 ? 'year' : 'years'}
                </span>
              </div>
              <Slider
                id="years"
                min={1}
                max={30}
                step={1}
                value={[years]}
                onValueChange={(values) => setYears(values[0])}
              />
              <Input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                min={1}
                max={30}
                step={1}
                className="mt-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 year</span>
                <span>15 years</span>
                <span>30 years</span>
              </div>
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="expected-return">Expected Annual Return (%)</Label>
                <span className="text-sm font-medium">
                  {formatPercentage(expectedReturn)}
                </span>
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
                min={1}
                max={30}
                step={0.5}
                className="mt-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1%</span>
                <span>15%</span>
                <span>30%</span>
              </div>
            </div>

            <Button 
              onClick={calculateSIP} 
              className="w-full"
              size="lg"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Returns
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div>
          {totalInvestment !== null && maturityValue !== null && estimatedReturns !== null && (
            <Card>
              <CardHeader>
                <CardTitle>SIP Results</CardTitle>
                <CardDescription>
                  Estimated returns on your SIP investment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Invested Amount</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalInvestment)}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Est. Returns</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(estimatedReturns)}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-primary/10 p-4 rounded-md">
                    <div className="text-sm mb-1 text-muted-foreground">Total Value</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(maturityValue)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Tabs defaultValue="breakdown" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="breakdown">Yearly Breakdown</TabsTrigger>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                    </TabsList>
                    <TabsContent value="breakdown">
                      <div className="max-h-[400px] overflow-y-auto pr-2 mt-4">
                        <table className="w-full border-collapse">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="border p-2 text-left">Year</th>
                              <th className="border p-2 text-right">Invested Amount</th>
                              <th className="border p-2 text-right">Est. Returns</th>
                              <th className="border p-2 text-right">Total Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {yearlyData.map((data) => (
                              <tr key={data.year} className="hover:bg-muted/20">
                                <td className="border p-2 text-left">{data.year}</td>
                                <td className="border p-2 text-right">
                                  {formatCurrency(data.invested)}
                                </td>
                                <td className="border p-2 text-right text-primary">
                                  {formatCurrency(data.returns)}
                                </td>
                                <td className="border p-2 text-right font-medium">
                                  {formatCurrency(data.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                    <TabsContent value="summary">
                      <div className="space-y-4 pt-4">
                        <div className="p-4 rounded-lg bg-muted/30">
                          <h3 className="font-medium mb-2">Key Highlights</h3>
                          <ul className="space-y-2">
                            <li className="flex justify-between">
                              <span>Monthly Investment:</span>
                              <span className="font-medium">{formatCurrency(monthlyInvestment)}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Investment Period:</span>
                              <span className="font-medium">{years} years ({years * 12} months)</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Expected Annual Return:</span>
                              <span className="font-medium">{formatPercentage(expectedReturn)}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Total Investment:</span>
                              <span className="font-medium">{formatCurrency(totalInvestment)}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Estimated Returns:</span>
                              <span className="font-medium text-primary">{formatCurrency(estimatedReturns)}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Maturity Value:</span>
                              <span className="font-medium">{formatCurrency(maturityValue)}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Wealth Gain Ratio:</span>
                              <span className="font-medium">
                                {(maturityValue / totalInvestment).toFixed(2)}x
                              </span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-muted/30">
                          <h3 className="font-medium mb-2">About SIP Investments</h3>
                          <p className="text-sm text-muted-foreground">
                            A Systematic Investment Plan (SIP) allows you to invest a fixed amount 
                            regularly in a mutual fund scheme. SIPs help in rupee cost averaging 
                            and are an excellent way to create wealth over the long term through 
                            the power of compounding.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}