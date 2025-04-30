import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, CreditCard, BarChart4, ArrowUpDown, PiggyBank, Clock, Timer, Calendar, Cake } from "lucide-react";

interface CalculatorItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function CalculatorsHome() {
  const calculators: CalculatorItem[] = [
    {
      title: "Percentage Calculator",
      description: "Calculate percentages, increases, decreases, and more",
      icon: <Percent className="h-6 w-6" />,
      href: "/calculators/percentage"
    },
    {
      title: "EMI Calculator",
      description: "Calculate loan EMI, total interest, and payment schedule",
      icon: <CreditCard className="h-6 w-6" />,
      href: "/calculators/emi"
    },
    {
      title: "GST Calculator",
      description: "Calculate GST inclusive and exclusive amounts",
      icon: <BarChart4 className="h-6 w-6" />,
      href: "/calculators/gst"
    },
    {
      title: "Unit Converter",
      description: "Convert between various units of measurement",
      icon: <ArrowUpDown className="h-6 w-6" />,
      href: "/calculators/unit-converter"
    },
    {
      title: "SIP Calculator",
      description: "Calculate returns on systematic investment plans",
      icon: <PiggyBank className="h-6 w-6" />,
      href: "/calculators/sip"
    },
    {
      title: "Retirement Calculator",
      description: "Plan your retirement savings and corpus",
      icon: <PiggyBank className="h-6 w-6" />,
      href: "/calculators/retirement"
    },
    {
      title: "Investment Calculator",
      description: "Calculate investment growth and returns",
      icon: <PiggyBank className="h-6 w-6" />,
      href: "/calculators/investment"
    },
    {
      title: "Income Tax Calculator",
      description: "Calculate income tax liability based on different slabs",
      icon: <BarChart4 className="h-6 w-6" />,
      href: "/calculators/income-tax"
    },
    {
      title: "Timezone Converter",
      description: "Convert times between different timezones",
      icon: <Clock className="h-6 w-6" />,
      href: "/calculators/timezone-converter"
    },
    {
      title: "Unix Timestamp Converter",
      description: "Convert between Unix timestamps and human-readable dates",
      icon: <Timer className="h-6 w-6" />,
      href: "/calculators/unix-timestamp-converter"
    },
    {
      title: "Birthday Calculator",
      description: "Calculate exact age in years, months, days, hours, minutes and seconds",
      icon: <Cake className="h-6 w-6" />,
      href: "/calculators/birthday-calculator"
    }
  ];

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Financial & Utility Calculators</h1>
          <p className="text-muted-foreground">
            A collection of useful calculators for financial planning, unit conversion, and more.
            All calculations are performed directly in your browser with no data sent to our servers.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculators.map((calculator, index) => (
            <a 
              key={index} 
              href={calculator.href}
              className="block group"
            >
              <Card className="h-full border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardHeader className="bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {calculator.icon}
                    </div>
                    <CardTitle className="text-xl">{calculator.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardDescription className="text-sm line-clamp-2">
                    {calculator.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="text-xs text-right text-muted-foreground">
                  Click to open calculator
                </CardFooter>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}