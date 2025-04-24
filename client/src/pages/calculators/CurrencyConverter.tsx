import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ArrowRight, RefreshCcw, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const { toast } = useToast();

  // Common currencies
  const currencies: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
    { code: "MXN", name: "Mexican Peso", symbol: "$" },
  ];

  // Sample conversion rates (in a real app, these would come from an API)
  const conversionRates: Record<string, Record<string, number>> = {
    USD: {
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.77,
      AUD: 1.52,
      CAD: 1.36,
      CHF: 0.89,
      CNY: 7.24,
      INR: 83.12,
      SGD: 1.35,
      AED: 3.67,
      HKD: 7.82,
      MXN: 16.75,
      USD: 1,
    },
    EUR: {
      USD: 1.09,
      GBP: 0.86,
      JPY: 163.03,
      AUD: 1.65,
      CAD: 1.48,
      CHF: 0.97,
      CNY: 7.89,
      INR: 90.5,
      SGD: 1.46,
      AED: 4.00,
      HKD: 8.52,
      MXN: 18.25,
      EUR: 1,
    },
    GBP: {
      USD: 1.27,
      EUR: 1.16,
      JPY: 189.31,
      AUD: 1.92,
      CAD: 1.72,
      CHF: 1.13,
      CNY: 9.18,
      INR: 105.23,
      SGD: 1.70,
      AED: 4.66,
      HKD: 9.91,
      MXN: 21.21,
      GBP: 1,
    },
    // Add more conversion rates as needed
  };

  // Calculate default rates
  useEffect(() => {
    // In a real app, this would fetch the latest rates from an API
    setLastUpdated(new Date().toLocaleString());
    convertCurrency();
  }, []);

  // Swap currencies
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    
    // If we already have a conversion, swap the result too
    if (convertedAmount !== null && conversionRate !== null) {
      setAmount(convertedAmount);
      setConvertedAmount(amount);
      setConversionRate(1 / conversionRate);
    }
  };

  // Convert currency
  const convertCurrency = () => {
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      try {
        // Get the rate from our static data
        // In a real app, this would use an API
        let rate: number;
        
        if (fromCurrency === toCurrency) {
          rate = 1;
        } else if (conversionRates[fromCurrency] && conversionRates[fromCurrency][toCurrency]) {
          rate = conversionRates[fromCurrency][toCurrency];
        } else if (conversionRates[toCurrency] && conversionRates[toCurrency][fromCurrency]) {
          // If we don't have the direct rate, use the inverse
          rate = 1 / conversionRates[toCurrency][fromCurrency];
        } else {
          // If we don't have either direct rate, use USD as a bridge
          const fromToUSD = fromCurrency === "USD" ? 1 : conversionRates["USD"][fromCurrency] ? 1 / conversionRates["USD"][fromCurrency] : 1;
          const usdToTo = toCurrency === "USD" ? 1 : conversionRates["USD"][toCurrency] || 1;
          rate = fromToUSD * usdToTo;
        }
        
        setConversionRate(rate);
        setConvertedAmount(amount * rate);
        setLastUpdated(new Date().toLocaleString());
        setLoading(false);
      } catch (error) {
        toast({
          title: "Conversion Error",
          description: "Unable to convert currencies. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    }, 800); // Simulate network delay
  };

  // Get currency symbol
  const getCurrencySymbol = (code: string): string => {
    const currency = currencies.find(c => c.code === code);
    return currency ? currency.symbol : code;
  };

  // Format currency
  const formatCurrency = (value: number, currencyCode: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <DollarSign className="h-8 w-8 mr-2 text-primary" />
          Currency Converter
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Convert between different currencies using the latest exchange rates.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Currency Conversion</CardTitle>
          <CardDescription>
            Enter an amount and select currencies to convert
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Amount Input */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            {/* From Currency */}
            <div className="space-y-2">
              <Label htmlFor="from-currency">From</Label>
              <Select
                value={fromCurrency}
                onValueChange={setFromCurrency}
              >
                <SelectTrigger id="from-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={swapCurrencies}
                className="mt-2"
              >
                <RefreshCcw className="h-4 w-4" />
                <span className="sr-only">Swap currencies</span>
              </Button>
            </div>
            
            {/* To Currency */}
            <div className="space-y-2">
              <Label htmlFor="to-currency">To</Label>
              <Select
                value={toCurrency}
                onValueChange={setToCurrency}
              >
                <SelectTrigger id="to-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={convertCurrency} 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert
              </>
            )}
          </Button>

          {/* Result Section */}
          {convertedAmount !== null && conversionRate !== null && (
            <div className="mt-8 pt-6 border-t">
              <div className="bg-primary/5 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold mb-3">
                  {formatCurrency(amount, fromCurrency)} = {formatCurrency(convertedAmount, toCurrency)}
                </div>
                <div className="text-sm text-muted-foreground">
                  1 {fromCurrency} = {conversionRate.toFixed(4)} {toCurrency}
                </div>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground text-right">
                Last updated: {lastUpdated}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}