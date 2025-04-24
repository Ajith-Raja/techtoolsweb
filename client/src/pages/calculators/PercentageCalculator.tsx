import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Percent, Calculator, ArrowRight } from "lucide-react";

// Define calculation types for the different percentage calculations
type DiscountCalculation = {
  originalPrice: number;
  discountPercent: number;
  discount?: number;
  finalPrice?: number;
};

type TipCalculation = {
  billAmount: number;
  tipPercent: number;
  tipAmount?: number;
  totalAmount?: number;
};

type PercentageChangeCalculation = {
  originalValue: number;
  percentChange: number;
  newValue?: number;
  change?: number;
};

export default function PercentageCalculator() {
  // State for different calculation types
  const [discountValues, setDiscountValues] = useState<DiscountCalculation>({
    originalPrice: 0,
    discountPercent: 0,
  });

  const [tipValues, setTipValues] = useState<TipCalculation>({
    billAmount: 0,
    tipPercent: 15, // Default tip percentage
  });

  const [increaseValues, setIncreaseValues] = useState<PercentageChangeCalculation>({
    originalValue: 0,
    percentChange: 0, 
  });

  const [decreaseValues, setDecreaseValues] = useState<PercentageChangeCalculation>({
    originalValue: 0,
    percentChange: 0,
  });

  // Calculate discount
  const calculateDiscount = () => {
    const { originalPrice, discountPercent } = discountValues;
    const discount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discount;
    
    setDiscountValues({
      ...discountValues,
      discount,
      finalPrice,
    });
  };

  // Calculate tip
  const calculateTip = () => {
    const { billAmount, tipPercent } = tipValues;
    const tipAmount = (billAmount * tipPercent) / 100;
    const totalAmount = billAmount + tipAmount;
    
    setTipValues({
      ...tipValues,
      tipAmount,
      totalAmount,
    });
  };

  // Calculate percentage increase
  const calculateIncrease = () => {
    const { originalValue, percentChange } = increaseValues;
    const change = (originalValue * percentChange) / 100;
    const newValue = originalValue + change;
    
    setIncreaseValues({
      ...increaseValues,
      change,
      newValue,
    });
  };

  // Calculate percentage decrease
  const calculateDecrease = () => {
    const { originalValue, percentChange } = decreaseValues;
    const change = (originalValue * percentChange) / 100;
    const newValue = originalValue - change;
    
    setDecreaseValues({
      ...decreaseValues,
      change,
      newValue,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Percent className="h-8 w-8 mr-2 text-primary" />
          Percentage Calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Calculate discounts, tips, percentage increases, and decreases with ease.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Percentage Calculations</CardTitle>
          <CardDescription>
            Select the type of percentage calculation you need
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="discount" className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
              <TabsTrigger value="discount">Discount</TabsTrigger>
              <TabsTrigger value="tip">Tip</TabsTrigger>
              <TabsTrigger value="increase">Increase</TabsTrigger>
              <TabsTrigger value="decrease">Decrease</TabsTrigger>
            </TabsList>
            
            {/* Discount Calculator */}
            <TabsContent value="discount" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="original-price">Original Price</Label>
                  <Input
                    id="original-price"
                    type="number"
                    min={0}
                    placeholder="100.00"
                    value={discountValues.originalPrice || ""}
                    onChange={(e) => 
                      setDiscountValues({
                        ...discountValues,
                        originalPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount-percent">Discount Percentage (%)</Label>
                  <Input
                    id="discount-percent"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="20"
                    value={discountValues.discountPercent || ""}
                    onChange={(e) => 
                      setDiscountValues({
                        ...discountValues,
                        discountPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              
              <Button onClick={calculateDiscount} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Discount
              </Button>
              
              {discountValues.discount !== undefined && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-4">Discount Calculation Result</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Discount Amount</p>
                      <p className="text-2xl font-semibold">
                        ${discountValues.discount.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Final Price</p>
                      <p className="text-2xl font-semibold">
                        ${discountValues.finalPrice?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm">
                    <p>
                      <span className="text-muted-foreground">Calculation:</span>{" "}
                      ${discountValues.originalPrice.toFixed(2)} − (${discountValues.originalPrice.toFixed(2)} × {discountValues.discountPercent}%) = ${discountValues.finalPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Tip Calculator */}
            <TabsContent value="tip" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bill-amount">Bill Amount</Label>
                  <Input
                    id="bill-amount"
                    type="number"
                    min={0}
                    placeholder="50.00"
                    value={tipValues.billAmount || ""}
                    onChange={(e) => 
                      setTipValues({
                        ...tipValues,
                        billAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tip-percent">Tip Percentage (%)</Label>
                  <Input
                    id="tip-percent"
                    type="number"
                    min={0}
                    placeholder="15"
                    value={tipValues.tipPercent || ""}
                    onChange={(e) => 
                      setTipValues({
                        ...tipValues,
                        tipPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              
              <Button onClick={calculateTip} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Tip
              </Button>
              
              {tipValues.tipAmount !== undefined && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-4">Tip Calculation Result</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Tip Amount</p>
                      <p className="text-2xl font-semibold">
                        ${tipValues.tipAmount.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-semibold">
                        ${tipValues.totalAmount?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm">
                    <p>
                      <span className="text-muted-foreground">Calculation:</span>{" "}
                      ${tipValues.billAmount.toFixed(2)} + (${tipValues.billAmount.toFixed(2)} × {tipValues.tipPercent}%) = ${tipValues.totalAmount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Percentage Increase */}
            <TabsContent value="increase" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="original-value-increase">Original Value</Label>
                  <Input
                    id="original-value-increase"
                    type="number"
                    min={0}
                    placeholder="100"
                    value={increaseValues.originalValue || ""}
                    onChange={(e) => 
                      setIncreaseValues({
                        ...increaseValues,
                        originalValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="increase-percent">Increase Percentage (%)</Label>
                  <Input
                    id="increase-percent"
                    type="number"
                    min={0}
                    placeholder="25"
                    value={increaseValues.percentChange || ""}
                    onChange={(e) => 
                      setIncreaseValues({
                        ...increaseValues,
                        percentChange: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              
              <Button onClick={calculateIncrease} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Increase
              </Button>
              
              {increaseValues.newValue !== undefined && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-4">Percentage Increase Result</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Amount Increased</p>
                      <p className="text-2xl font-semibold">
                        {increaseValues.change?.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">New Value</p>
                      <p className="text-2xl font-semibold">
                        {increaseValues.newValue?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm">
                    <p>
                      <span className="text-muted-foreground">Calculation:</span>{" "}
                      {increaseValues.originalValue.toFixed(2)} + ({increaseValues.originalValue.toFixed(2)} × {increaseValues.percentChange}%) = {increaseValues.newValue?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Percentage Decrease */}
            <TabsContent value="decrease" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="original-value-decrease">Original Value</Label>
                  <Input
                    id="original-value-decrease"
                    type="number"
                    min={0}
                    placeholder="100"
                    value={decreaseValues.originalValue || ""}
                    onChange={(e) => 
                      setDecreaseValues({
                        ...decreaseValues,
                        originalValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="decrease-percent">Decrease Percentage (%)</Label>
                  <Input
                    id="decrease-percent"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="20"
                    value={decreaseValues.percentChange || ""}
                    onChange={(e) => 
                      setDecreaseValues({
                        ...decreaseValues,
                        percentChange: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              
              <Button onClick={calculateDecrease} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Decrease
              </Button>
              
              {decreaseValues.newValue !== undefined && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-4">Percentage Decrease Result</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Amount Decreased</p>
                      <p className="text-2xl font-semibold">
                        {decreaseValues.change?.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">New Value</p>
                      <p className="text-2xl font-semibold">
                        {decreaseValues.newValue?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm">
                    <p>
                      <span className="text-muted-foreground">Calculation:</span>{" "}
                      {decreaseValues.originalValue.toFixed(2)} − ({decreaseValues.originalValue.toFixed(2)} × {decreaseValues.percentChange}%) = {decreaseValues.newValue?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}