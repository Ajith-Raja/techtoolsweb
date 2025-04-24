import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Calculator,
  DollarSign,
  Calendar,
  BarChart3,
  ArrowRight,
  Percent,
} from "lucide-react";

export default function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [loanTenure, setLoanTenure] = useState<number>(20 * 12); // Default 20 years in months
  const [emi, setEmi] = useState<number | null>(null);
  const [totalPayment, setTotalPayment] = useState<number | null>(null);
  const [totalInterest, setTotalInterest] = useState<number | null>(null);

  // Chart data for payment breakup
  const [chartData, setChartData] = useState<{
    principal: number;
    interest: number;
  } | null>(null);

  // Calculate EMI
  const calculateEMI = () => {
    // Monthly interest rate
    const monthlyRate = interestRate / 12 / 100;
    
    // EMI calculation formula: [P x R x (1+R)^N] / [(1+R)^N - 1]
    const emiValue = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTenure)) / 
                  (Math.pow(1 + monthlyRate, loanTenure) - 1);
    
    const totalPaymentValue = emiValue * loanTenure;
    const totalInterestValue = totalPaymentValue - loanAmount;
    
    setEmi(emiValue);
    setTotalPayment(totalPaymentValue);
    setTotalInterest(totalInterestValue);
    
    setChartData({
      principal: loanAmount,
      interest: totalInterestValue,
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <DollarSign className="h-8 w-8 mr-2 text-primary" />
          EMI Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Calculate your Equated Monthly Installment (EMI) for any loan amount, interest rate, and tenure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>
              Enter your loan amount, interest rate, and tenure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Loan Amount */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="loan-amount">Loan Amount</Label>
                <span className="text-sm font-medium">
                  {formatCurrency(loanAmount)}
                </span>
              </div>
              <div className="space-y-2">
                <Slider
                  id="loan-amount"
                  min={100000}
                  max={10000000}
                  step={50000}
                  value={[loanAmount]}
                  onValueChange={(values) => setLoanAmount(values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹1L</span>
                  <span>₹5M</span>
                  <span>₹1Cr</span>
                </div>
              </div>
              <Input
                id="loan-amount-input"
                type="number"
                min={10000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="mt-2"
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="interest-rate">Interest Rate (% per annum)</Label>
                <span className="text-sm font-medium">
                  {interestRate}%
                </span>
              </div>
              <div className="space-y-2">
                <Slider
                  id="interest-rate"
                  min={4}
                  max={24}
                  step={0.1}
                  value={[interestRate]}
                  onValueChange={(values) => setInterestRate(values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>4%</span>
                  <span>14%</span>
                  <span>24%</span>
                </div>
              </div>
              <Input
                id="interest-rate-input"
                type="number"
                min={1}
                max={30}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="mt-2"
              />
            </div>

            {/* Loan Tenure */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="loan-tenure">Loan Tenure (months)</Label>
                <span className="text-sm font-medium">
                  {loanTenure} months ({Math.floor(loanTenure / 12)} years {loanTenure % 12} months)
                </span>
              </div>
              <div className="space-y-2">
                <Slider
                  id="loan-tenure"
                  min={12}
                  max={360}
                  step={12}
                  value={[loanTenure]}
                  onValueChange={(values) => setLoanTenure(values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1Y</span>
                  <span>15Y</span>
                  <span>30Y</span>
                </div>
              </div>
              <Input
                id="loan-tenure-input"
                type="number"
                min={1}
                max={360}
                value={loanTenure}
                onChange={(e) => setLoanTenure(Number(e.target.value))}
                className="mt-2"
              />
            </div>

            <Button 
              onClick={calculateEMI} 
              className="w-full"
              size="lg"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate EMI
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EMI Calculation Result</CardTitle>
            <CardDescription>
              Your loan repayment details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {emi === null ? (
              <div className="p-6 text-center text-muted-foreground">
                Enter loan details and click Calculate EMI to see the results
              </div>
            ) : (
              <>
                <div className="bg-primary/5 p-6 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Monthly EMI</div>
                  <div className="text-3xl font-bold mb-1">
                    {formatCurrency(emi)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    per month
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">Principal</div>
                    <div className="text-xl font-semibold">
                      {formatCurrency(loanAmount)}
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">Total Interest</div>
                    <div className="text-xl font-semibold">
                      {formatCurrency(totalInterest || 0)}
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Total Payment</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(totalPayment || 0)}
                  </div>
                </div>

                {chartData && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-3">Payment Breakup</h3>
                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ 
                          width: `${(chartData.principal / (chartData.principal + chartData.interest)) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-primary rounded-full mr-1"></div>
                        <span>Principal ({Math.round((chartData.principal / (chartData.principal + chartData.interest)) * 100)}%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-muted rounded-full mr-1"></div>
                        <span>Interest ({Math.round((chartData.interest / (chartData.principal + chartData.interest)) * 100)}%)</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Loan Amount:</span>
                      <span>{formatCurrency(loanAmount)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <span>{interestRate}% per annum</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Loan Tenure:</span>
                      <span>{loanTenure} months ({Math.floor(loanTenure / 12)} years {loanTenure % 12} months)</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Monthly EMI:</span>
                      <span>{formatCurrency(emi)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Total Interest Payable:</span>
                      <span>{formatCurrency(totalInterest || 0)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Total Payment:</span>
                      <span>{formatCurrency(totalPayment || 0)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}