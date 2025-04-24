import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, DollarSign, Percent, TrendingUp, ArrowLeftRight, PiggyBank, BarChart3, Receipt } from "lucide-react";
import { Link } from "wouter";

interface CalculatorCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function CalculatorsHome() {
  const calculatorCards: CalculatorCard[] = [
    {
      title: "Percentage Calculator",
      description: "Calculate discounts, tips, percentage increases and decreases",
      icon: <Percent className="h-8 w-8 text-primary" />,
      href: "/calculators/percentage",
    },
    {
      title: "EMI Calculator",
      description: "Calculate monthly loan installments based on principal, interest rate and tenure",
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      href: "/calculators/emi",
    },
    {
      title: "GST Calculator",
      description: "Calculate GST amount and final price for goods and services",
      icon: <Calculator className="h-8 w-8 text-primary" />,
      href: "/calculators/gst",
    },

    {
      title: "Unit Converter",
      description: "Convert between different units of measurement",
      icon: <ArrowLeftRight className="h-8 w-8 text-primary" />,
      href: "/calculators/unit-converter",
    },
    {
      title: "SIP Calculator",
      description: "Calculate returns on systematic investment plans",
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      href: "/calculators/sip",
    },
    {
      title: "Retirement Planning Calculator",
      description: "Plan your retirement savings and estimate future value",
      icon: <PiggyBank className="h-8 w-8 text-primary" />,
      href: "/calculators/retirement",
    },
    {
      title: "Investment Calculator",
      description: "Calculate future value of lump sum investments",
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      href: "/calculators/investment",
    },
    {
      title: "Income Tax Calculator",
      description: "Estimate your income tax liability based on income and deductions",
      icon: <Receipt className="h-8 w-8 text-primary" />,
      href: "/calculators/income-tax",
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Financial Calculators</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A collection of useful calculators to help with financial planning, conversions, and everyday calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculatorCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">{card.icon}</div>
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <span className="text-xs text-primary font-medium">Use Calculator →</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}