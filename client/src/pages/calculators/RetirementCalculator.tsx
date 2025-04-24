import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, PiggyBank, Sunset, Clock } from "lucide-react";

export default function RetirementCalculator() {
  // Current financial situation
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [currentSavings, setCurrentSavings] = useState<number>(500000);
  const [annualContribution, setAnnualContribution] = useState<number>(200000);
  
  // Retirement expectations
  const [yearlyExpenses, setYearlyExpenses] = useState<number>(600000);
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(85);
  
  // Investment assumptions
  const [preRetirementReturn, setPreRetirementReturn] = useState<number>(8);
  const [postRetirementReturn, setPostRetirementReturn] = useState<number>(6);
  const [inflationRate, setInflationRate] = useState<number>(5);
  
  // Results
  const [results, setResults] = useState<{
    retirementCorpus: number;
    currentShortfall: number;
    requiredMonthlyContribution: number;
    retirementYears: number;
    totalContributions: number;
    yearlyBreakdown: Array<any>;
  } | null>(null);

  // Calculate retirement plan
  const calculateRetirement = () => {
    // Years until retirement
    const yearsToRetirement = retirementAge - currentAge;
    
    // Years in retirement
    const retirementYears = lifeExpectancy - retirementAge;
    
    // Calculate future value of expenses (factoring in inflation)
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const futureYearlyExpenses = yearlyExpenses * inflationFactor;
    
    // Calculate required retirement corpus
    // Using the formula for present value of an annuity, adjusted for inflation and returns
    const effectiveReturn = (postRetirementReturn - inflationRate) / 100;
    let retirementCorpus: number;
    
    if (Math.abs(effectiveReturn) < 0.0001) {
      // If effective return is close to zero, use simpler formula
      retirementCorpus = futureYearlyExpenses * retirementYears;
    } else {
      retirementCorpus = futureYearlyExpenses * 
        (1 - Math.pow(1 + effectiveReturn, -retirementYears)) / effectiveReturn;
    }
    
    // Calculate future value of current savings
    const futureValueOfCurrentSavings = currentSavings * 
      Math.pow(1 + preRetirementReturn / 100, yearsToRetirement);
    
    // Calculate future value of annual contributions
    const futureValueOfContributions = annualContribution * 
      (Math.pow(1 + preRetirementReturn / 100, yearsToRetirement) - 1) / 
      (preRetirementReturn / 100);
    
    // Total expected savings at retirement
    const totalRetirementSavings = futureValueOfCurrentSavings + futureValueOfContributions;
    
    // Calculate shortfall (if any)
    const shortfall = Math.max(0, retirementCorpus - totalRetirementSavings);
    
    // Calculate required monthly contribution to cover shortfall
    let requiredMonthlyContribution = 0;
    if (shortfall > 0) {
      const requiredAnnualContribution = shortfall / 
        ((Math.pow(1 + preRetirementReturn / 100, yearsToRetirement) - 1) / 
        (preRetirementReturn / 100));
      
      requiredMonthlyContribution = requiredAnnualContribution / 12;
    }
    
    // Calculate yearly breakdown
    const yearlyBreakdown = [];
    let currentCorpus = currentSavings;
    let currentExpense = yearlyExpenses;
    let totalContributions = 0;
    
    // Pre-retirement phase
    for (let year = 1; year <= yearsToRetirement; year++) {
      const yearlyInflation = Math.pow(1 + inflationRate / 100, year);
      const inflationAdjustedExpense = yearlyExpenses * yearlyInflation;
      
      // Add yearly contribution
      totalContributions += annualContribution;
      currentCorpus = currentCorpus * (1 + preRetirementReturn / 100) + annualContribution;
      
      yearlyBreakdown.push({
        year: currentAge + year,
        phase: 'pre-retirement',
        corpus: currentCorpus,
        expenses: inflationAdjustedExpense,
        contributions: annualContribution,
      });
    }
    
    // Post-retirement phase
    for (let year = 1; year <= retirementYears; year++) {
      const yearlyInflation = Math.pow(1 + inflationRate / 100, yearsToRetirement + year);
      const inflationAdjustedExpense = yearlyExpenses * yearlyInflation;
      
      // Subtract expenses, then add returns
      currentCorpus = currentCorpus - inflationAdjustedExpense;
      currentCorpus = currentCorpus * (1 + postRetirementReturn / 100);
      
      // If corpus becomes negative, break
      if (currentCorpus < 0) {
        break;
      }
      
      yearlyBreakdown.push({
        year: retirementAge + year,
        phase: 'post-retirement',
        corpus: currentCorpus,
        expenses: inflationAdjustedExpense,
        contributions: 0,
      });
    }
    
    setResults({
      retirementCorpus,
      currentShortfall: shortfall,
      requiredMonthlyContribution,
      retirementYears,
      totalContributions,
      yearlyBreakdown,
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    // If value is in lakhs or crores, format accordingly
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Sunset className="h-8 w-8 mr-2 text-primary" />
          Retirement Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Plan your retirement and estimate how much you need to save for a comfortable retired life.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Retirement Planning</CardTitle>
            <CardDescription>
              Enter your financial details to plan for retirement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="current">Current Status</TabsTrigger>
                <TabsTrigger value="retirement">Retirement</TabsTrigger>
                <TabsTrigger value="investment">Investment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="current" className="space-y-4 pt-4">
                {/* Current Age */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="current-age">Current Age</Label>
                    <span className="text-sm font-medium">{currentAge} years</span>
                  </div>
                  <Slider
                    id="current-age"
                    min={18}
                    max={70}
                    step={1}
                    value={[currentAge]}
                    onValueChange={(values) => setCurrentAge(values[0])}
                  />
                  <Input
                    type="number"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(Number(e.target.value))}
                    min={18}
                    max={70}
                  />
                </div>
                
                {/* Retirement Age */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="retirement-age">Retirement Age</Label>
                    <span className="text-sm font-medium">{retirementAge} years</span>
                  </div>
                  <Slider
                    id="retirement-age"
                    min={40}
                    max={80}
                    step={1}
                    value={[retirementAge]}
                    onValueChange={(values) => setRetirementAge(values[0])}
                  />
                  <Input
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                    min={40}
                    max={80}
                  />
                </div>
                
                {/* Current Savings */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="current-savings">Current Savings</Label>
                    <span className="text-sm font-medium">{formatCurrency(currentSavings)}</span>
                  </div>
                  <Slider
                    id="current-savings"
                    min={0}
                    max={10000000}
                    step={50000}
                    value={[currentSavings]}
                    onValueChange={(values) => setCurrentSavings(values[0])}
                  />
                  <Input
                    type="number"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                {/* Annual Contribution */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="annual-contribution">Annual Contribution</Label>
                    <span className="text-sm font-medium">{formatCurrency(annualContribution)}</span>
                  </div>
                  <Slider
                    id="annual-contribution"
                    min={0}
                    max={2000000}
                    step={10000}
                    value={[annualContribution]}
                    onValueChange={(values) => setAnnualContribution(values[0])}
                  />
                  <Input
                    type="number"
                    value={annualContribution}
                    onChange={(e) => setAnnualContribution(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="retirement" className="space-y-4 pt-4">
                {/* Yearly Expenses in Retirement */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="yearly-expenses">Yearly Expenses (Current Value)</Label>
                    <span className="text-sm font-medium">{formatCurrency(yearlyExpenses)}</span>
                  </div>
                  <Slider
                    id="yearly-expenses"
                    min={100000}
                    max={5000000}
                    step={50000}
                    value={[yearlyExpenses]}
                    onValueChange={(values) => setYearlyExpenses(values[0])}
                  />
                  <Input
                    type="number"
                    value={yearlyExpenses}
                    onChange={(e) => setYearlyExpenses(Number(e.target.value))}
                    min={100000}
                  />
                </div>
                
                {/* Life Expectancy */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="life-expectancy">Life Expectancy</Label>
                    <span className="text-sm font-medium">{lifeExpectancy} years</span>
                  </div>
                  <Slider
                    id="life-expectancy"
                    min={60}
                    max={100}
                    step={1}
                    value={[lifeExpectancy]}
                    onValueChange={(values) => setLifeExpectancy(values[0])}
                  />
                  <Input
                    type="number"
                    value={lifeExpectancy}
                    onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                    min={60}
                    max={100}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="investment" className="space-y-4 pt-4">
                {/* Pre-Retirement Return */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pre-retirement-return">Pre-Retirement Return (%)</Label>
                    <span className="text-sm font-medium">{preRetirementReturn}%</span>
                  </div>
                  <Slider
                    id="pre-retirement-return"
                    min={4}
                    max={15}
                    step={0.5}
                    value={[preRetirementReturn]}
                    onValueChange={(values) => setPreRetirementReturn(values[0])}
                  />
                  <Input
                    type="number"
                    value={preRetirementReturn}
                    onChange={(e) => setPreRetirementReturn(Number(e.target.value))}
                    min={0}
                    max={20}
                    step={0.5}
                  />
                </div>
                
                {/* Post-Retirement Return */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="post-retirement-return">Post-Retirement Return (%)</Label>
                    <span className="text-sm font-medium">{postRetirementReturn}%</span>
                  </div>
                  <Slider
                    id="post-retirement-return"
                    min={2}
                    max={10}
                    step={0.5}
                    value={[postRetirementReturn]}
                    onValueChange={(values) => setPostRetirementReturn(values[0])}
                  />
                  <Input
                    type="number"
                    value={postRetirementReturn}
                    onChange={(e) => setPostRetirementReturn(Number(e.target.value))}
                    min={0}
                    max={15}
                    step={0.5}
                  />
                </div>
                
                {/* Inflation Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="inflation-rate">Inflation Rate (%)</Label>
                    <span className="text-sm font-medium">{inflationRate}%</span>
                  </div>
                  <Slider
                    id="inflation-rate"
                    min={2}
                    max={10}
                    step={0.5}
                    value={[inflationRate]}
                    onValueChange={(values) => setInflationRate(values[0])}
                  />
                  <Input
                    type="number"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(Number(e.target.value))}
                    min={0}
                    max={15}
                    step={0.5}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={calculateRetirement} 
              className="w-full mt-4"
              size="lg"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Retirement Plan
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div>
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Retirement Analysis</CardTitle>
                <CardDescription>
                  Your personalized retirement planning analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-primary/10 p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Retirement Corpus Needed</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(results.retirementCorpus)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      For {results.retirementYears} years after retirement
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Current Shortfall</div>
                    <div className="text-2xl font-bold text-destructive">
                      {formatCurrency(results.currentShortfall)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Additional amount needed
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Time to Retirement</div>
                    <div className="text-2xl font-bold">
                      {retirementAge - currentAge} years
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Retire at age {retirementAge}
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-card border p-4">
                    <div className="text-sm mb-1 text-muted-foreground">Required Monthly Saving</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(results.requiredMonthlyContribution)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      To reach your retirement goal
                    </div>
                  </div>
                </div>
                
                {/* Yearly Breakdown */}
                <div className="mt-6">
                  <h3 className="font-medium text-lg flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Year-by-Year Projection
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto pr-2 mt-4">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="border p-2 text-left">Age</th>
                          <th className="border p-2 text-right">Corpus</th>
                          <th className="border p-2 text-right">Yearly Expenses</th>
                          <th className="border p-2 text-left">Phase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.yearlyBreakdown.map((data, index) => (
                          <tr key={index} className={`hover:bg-muted/20 ${data.phase === 'post-retirement' ? 'bg-primary/5' : ''}`}>
                            <td className="border p-2 text-left">{data.year}</td>
                            <td className="border p-2 text-right font-medium">
                              {formatCurrency(data.corpus)}
                            </td>
                            <td className="border p-2 text-right">
                              {formatCurrency(data.expenses)}
                            </td>
                            <td className="border p-2 text-left">
                              <span className={`inline-block px-2 py-1 rounded text-xs ${
                                data.phase === 'pre-retirement' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                                {data.phase === 'pre-retirement' ? 'Working' : 'Retired'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Retirement Planning Tips */}
                <div className="p-4 rounded-lg bg-muted/30 mt-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <PiggyBank className="h-4 w-4 mr-2" />
                    Retirement Planning Tips
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>Consider diversifying your investments to balance risk and returns.</li>
                    <li>Review and adjust your retirement plan periodically as your financial situation changes.</li>
                    <li>Explore tax-advantaged retirement accounts to maximize your savings.</li>
                    <li>Account for healthcare costs, which typically increase during retirement.</li>
                    <li>Plan for inflation, which can significantly impact your purchasing power over time.</li>
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