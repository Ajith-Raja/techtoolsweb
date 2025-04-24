import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftRight, Ruler, RefreshCcw, Weight, Thermometer, Clock } from "lucide-react";

// Unit conversion types
type UnitCategory = 'length' | 'weight' | 'temperature' | 'time' | 'area' | 'volume';

type UnitConversion = {
  category: UnitCategory;
  units: {
    [key: string]: {
      name: string;
      toBase: (value: number) => number;
      fromBase: (value: number) => number;
    };
  };
};

export default function UnitConverter() {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');
  const [currentCategory, setCurrentCategory] = useState<UnitCategory>('length');
  const [convertedValue, setConvertedValue] = useState<number | null>(null);
  
  // Unit conversion definitions
  const unitConversions: Record<UnitCategory, UnitConversion> = {
    length: {
      category: 'length',
      units: {
        nm: {
          name: 'Nanometer (nm)',
          toBase: (v) => v * 1e-9,
          fromBase: (v) => v * 1e9,
        },
        um: {
          name: 'Micrometer (μm)',
          toBase: (v) => v * 1e-6,
          fromBase: (v) => v * 1e6,
        },
        mm: {
          name: 'Millimeter (mm)',
          toBase: (v) => v * 0.001,
          fromBase: (v) => v * 1000,
        },
        cm: {
          name: 'Centimeter (cm)',
          toBase: (v) => v * 0.01,
          fromBase: (v) => v * 100,
        },
        m: {
          name: 'Meter (m)',
          toBase: (v) => v,
          fromBase: (v) => v,
        },
        km: {
          name: 'Kilometer (km)',
          toBase: (v) => v * 1000,
          fromBase: (v) => v * 0.001,
        },
        in: {
          name: 'Inch (in)',
          toBase: (v) => v * 0.0254,
          fromBase: (v) => v / 0.0254,
        },
        ft: {
          name: 'Foot (ft)',
          toBase: (v) => v * 0.3048,
          fromBase: (v) => v / 0.3048,
        },
        yd: {
          name: 'Yard (yd)',
          toBase: (v) => v * 0.9144,
          fromBase: (v) => v / 0.9144,
        },
        mi: {
          name: 'Mile (mi)',
          toBase: (v) => v * 1609.344,
          fromBase: (v) => v / 1609.344,
        },
        nmi: {
          name: 'Nautical mile (nmi)',
          toBase: (v) => v * 1852,
          fromBase: (v) => v / 1852,
        },
      },
    },
    weight: {
      category: 'weight',
      units: {
        mg: {
          name: 'Milligram (mg)',
          toBase: (v) => v * 0.001,
          fromBase: (v) => v * 1000,
        },
        g: {
          name: 'Gram (g)',
          toBase: (v) => v,
          fromBase: (v) => v,
        },
        kg: {
          name: 'Kilogram (kg)',
          toBase: (v) => v * 1000,
          fromBase: (v) => v * 0.001,
        },
        t: {
          name: 'Metric ton (t)',
          toBase: (v) => v * 1000000,
          fromBase: (v) => v * 0.000001,
        },
        oz: {
          name: 'Ounce (oz)',
          toBase: (v) => v * 28.3495,
          fromBase: (v) => v / 28.3495,
        },
        lb: {
          name: 'Pound (lb)',
          toBase: (v) => v * 453.592,
          fromBase: (v) => v / 453.592,
        },
        st: {
          name: 'Stone (st)',
          toBase: (v) => v * 6350.29,
          fromBase: (v) => v / 6350.29,
        },
      },
    },
    temperature: {
      category: 'temperature',
      units: {
        c: {
          name: 'Celsius (°C)',
          toBase: (v) => v,
          fromBase: (v) => v,
        },
        f: {
          name: 'Fahrenheit (°F)',
          toBase: (v) => (v - 32) * (5/9),
          fromBase: (v) => v * (9/5) + 32,
        },
        k: {
          name: 'Kelvin (K)',
          toBase: (v) => v - 273.15,
          fromBase: (v) => v + 273.15,
        },
      },
    },
    time: {
      category: 'time',
      units: {
        ms: {
          name: 'Millisecond (ms)',
          toBase: (v) => v * 0.001,
          fromBase: (v) => v * 1000,
        },
        s: {
          name: 'Second (s)',
          toBase: (v) => v,
          fromBase: (v) => v,
        },
        min: {
          name: 'Minute (min)',
          toBase: (v) => v * 60,
          fromBase: (v) => v / 60,
        },
        h: {
          name: 'Hour (h)',
          toBase: (v) => v * 3600,
          fromBase: (v) => v / 3600,
        },
        day: {
          name: 'Day',
          toBase: (v) => v * 86400,
          fromBase: (v) => v / 86400,
        },
        week: {
          name: 'Week',
          toBase: (v) => v * 604800,
          fromBase: (v) => v / 604800,
        },
        month: {
          name: 'Month (30 days)',
          toBase: (v) => v * 2592000,
          fromBase: (v) => v / 2592000,
        },
        year: {
          name: 'Year (365 days)',
          toBase: (v) => v * 31536000,
          fromBase: (v) => v / 31536000,
        },
      },
    },
    area: {
      category: 'area',
      units: {
        sqmm: {
          name: 'Square millimeter (mm²)',
          toBase: (v) => v * 0.000001,
          fromBase: (v) => v * 1000000,
        },
        sqcm: {
          name: 'Square centimeter (cm²)',
          toBase: (v) => v * 0.0001,
          fromBase: (v) => v * 10000,
        },
        sqm: {
          name: 'Square meter (m²)',
          toBase: (v) => v,
          fromBase: (v) => v,
        },
        sqkm: {
          name: 'Square kilometer (km²)',
          toBase: (v) => v * 1000000,
          fromBase: (v) => v * 0.000001,
        },
        ha: {
          name: 'Hectare (ha)',
          toBase: (v) => v * 10000,
          fromBase: (v) => v * 0.0001,
        },
        sqin: {
          name: 'Square inch (in²)',
          toBase: (v) => v * 0.00064516,
          fromBase: (v) => v / 0.00064516,
        },
        sqft: {
          name: 'Square foot (ft²)',
          toBase: (v) => v * 0.092903,
          fromBase: (v) => v / 0.092903,
        },
        acre: {
          name: 'Acre',
          toBase: (v) => v * 4046.86,
          fromBase: (v) => v / 4046.86,
        },
      },
    },
    volume: {
      category: 'volume',
      units: {
        ml: {
          name: 'Milliliter (ml)',
          toBase: (v) => v * 0.001,
          fromBase: (v) => v * 1000,
        },
        l: {
          name: 'Liter (L)',
          toBase: (v) => v,
          fromBase: (v) => v,
        },
        cbm: {
          name: 'Cubic meter (m³)',
          toBase: (v) => v * 1000,
          fromBase: (v) => v * 0.001,
        },
        floz: {
          name: 'Fluid ounce (fl oz)',
          toBase: (v) => v * 0.0295735,
          fromBase: (v) => v / 0.0295735,
        },
        cup: {
          name: 'Cup',
          toBase: (v) => v * 0.24,
          fromBase: (v) => v / 0.24,
        },
        pt: {
          name: 'Pint (pt)',
          toBase: (v) => v * 0.473176,
          fromBase: (v) => v / 0.473176,
        },
        qt: {
          name: 'Quart (qt)',
          toBase: (v) => v * 0.946353,
          fromBase: (v) => v / 0.946353,
        },
        gal: {
          name: 'Gallon (gal)',
          toBase: (v) => v * 3.78541,
          fromBase: (v) => v / 3.78541,
        },
      },
    },
  };

  // Get category icon
  const getCategoryIcon = (category: UnitCategory) => {
    switch (category) {
      case 'length':
        return <Ruler className="h-4 w-4" />;
      case 'weight':
        return <Weight className="h-4 w-4" />;
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'time':
        return <Clock className="h-4 w-4" />;
      case 'area':
        return <div className="h-4 w-4 flex items-center justify-center">A²</div>;
      case 'volume':
        return <div className="h-4 w-4 flex items-center justify-center">V³</div>;
      default:
        return <ArrowLeftRight className="h-4 w-4" />;
    }
  };

  // Handle category change
  const handleCategoryChange = (category: UnitCategory) => {
    setCurrentCategory(category);
    
    // Set default units for the category
    const unitKeys = Object.keys(unitConversions[category].units);
    if (unitKeys.length >= 2) {
      setFromUnit(unitKeys[0]);
      setToUnit(unitKeys[1]);
    }
    
    // Reset converted value
    setConvertedValue(null);
  };

  // Swap units
  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    
    // If we already have a conversion, recalculate
    if (convertedValue !== null) {
      convertUnits();
    }
  };

  // Convert units
  const convertUnits = () => {
    const conversion = unitConversions[currentCategory];
    const fromUnitObj = conversion.units[fromUnit];
    const toUnitObj = conversion.units[toUnit];
    
    if (fromUnitObj && toUnitObj) {
      // Convert to base unit, then to target unit
      const baseValue = fromUnitObj.toBase(value);
      const result = toUnitObj.fromBase(baseValue);
      setConvertedValue(result);
    }
  };

  // Format the result with appropriate precision
  const formatResult = (value: number): string => {
    // Handle very small or very large numbers
    if (Math.abs(value) < 0.000001 || Math.abs(value) > 1000000) {
      return value.toExponential(6);
    }
    
    // For normal numbers, format with appropriate precision
    if (Math.abs(value) < 0.01) {
      return value.toFixed(6);
    } else if (Math.abs(value) < 1) {
      return value.toFixed(4);
    } else if (Math.abs(value) < 10) {
      return value.toFixed(3);
    } else if (Math.abs(value) < 100) {
      return value.toFixed(2);
    } else {
      return value.toFixed(1);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <ArrowLeftRight className="h-8 w-8 mr-2 text-primary" />
          Unit Converter
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Convert between different units of measurement including length, weight, temperature, and more.
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Unit Conversion</CardTitle>
          <CardDescription>
            Select a category and units to convert between
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs 
            defaultValue="length" 
            value={currentCategory}
            onValueChange={(value) => handleCategoryChange(value as UnitCategory)}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
              <TabsTrigger value="length" className="flex items-center">
                {getCategoryIcon('length')}
                <span className="ml-2 hidden sm:inline">Length</span>
              </TabsTrigger>
              <TabsTrigger value="weight" className="flex items-center">
                {getCategoryIcon('weight')}
                <span className="ml-2 hidden sm:inline">Weight</span>
              </TabsTrigger>
              <TabsTrigger value="temperature" className="flex items-center">
                {getCategoryIcon('temperature')}
                <span className="ml-2 hidden sm:inline">Temperature</span>
              </TabsTrigger>
              <TabsTrigger value="time" className="flex items-center">
                {getCategoryIcon('time')}
                <span className="ml-2 hidden sm:inline">Time</span>
              </TabsTrigger>
              <TabsTrigger value="area" className="flex items-center">
                {getCategoryIcon('area')}
                <span className="ml-2 hidden sm:inline">Area</span>
              </TabsTrigger>
              <TabsTrigger value="volume" className="flex items-center">
                {getCategoryIcon('volume')}
                <span className="ml-2 hidden sm:inline">Volume</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Tab Content for all categories */}
            {Object.keys(unitConversions).map((category) => (
              <TabsContent key={category} value={category} className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                  {/* Value Input */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="text-lg"
                    />
                  </div>
                  
                  {/* From Unit */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="from-unit">From</Label>
                    <Select
                      value={fromUnit}
                      onValueChange={setFromUnit}
                    >
                      <SelectTrigger id="from-unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(unitConversions[category as UnitCategory].units).map(([key, unit]) => (
                          <SelectItem key={key} value={key}>
                            {unit.name}
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
                      onClick={swapUnits}
                      className="mt-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      <span className="sr-only">Swap units</span>
                    </Button>
                  </div>
                  
                  {/* To Unit */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="to-unit">To</Label>
                    <Select
                      value={toUnit}
                      onValueChange={setToUnit}
                    >
                      <SelectTrigger id="to-unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(unitConversions[category as UnitCategory].units).map(([key, unit]) => (
                          <SelectItem key={key} value={key}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={convertUnits} 
                  className="w-full mt-6"
                >
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Convert
                </Button>

                {/* Result Section */}
                {convertedValue !== null && (
                  <div className="mt-8 pt-6 border-t">
                    <div className="bg-primary/5 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold mb-3">
                        {formatResult(value)} {unitConversions[currentCategory].units[fromUnit].name.split(' ')[0]} = {formatResult(convertedValue)} {unitConversions[currentCategory].units[toUnit].name.split(' ')[0]}
                      </div>
                    </div>
                    
                    {/* Formula explanation */}
                    <div className="mt-4 text-sm text-muted-foreground">
                      <div className="font-medium">Conversion Details:</div>
                      {currentCategory === 'temperature' ? (
                        <p className="mt-1">
                          {fromUnit === 'c' && toUnit === 'f' ? (
                            <>Celsius to Fahrenheit: (°C × 9/5) + 32 = °F</>
                          ) : fromUnit === 'f' && toUnit === 'c' ? (
                            <>Fahrenheit to Celsius: (°F − 32) × 5/9 = °C</>
                          ) : fromUnit === 'c' && toUnit === 'k' ? (
                            <>Celsius to Kelvin: °C + 273.15 = K</>
                          ) : fromUnit === 'k' && toUnit === 'c' ? (
                            <>Kelvin to Celsius: K − 273.15 = °C</>
                          ) : fromUnit === 'f' && toUnit === 'k' ? (
                            <>Fahrenheit to Kelvin: (°F − 32) × 5/9 + 273.15 = K</>
                          ) : fromUnit === 'k' && toUnit === 'f' ? (
                            <>Kelvin to Fahrenheit: (K − 273.15) × 9/5 + 32 = °F</>
                          ) : (
                            <>No conversion needed for the same unit.</>
                          )}
                        </p>
                      ) : (
                        <p className="mt-1">
                          1 {unitConversions[currentCategory].units[fromUnit].name.split(' ')[0]} = {formatResult(unitConversions[currentCategory].units[toUnit].fromBase(unitConversions[currentCategory].units[fromUnit].toBase(1)))} {unitConversions[currentCategory].units[toUnit].name.split(' ')[0]}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}