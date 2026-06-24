import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Flame, Apple, Dumbbell, ShoppingCart } from "lucide-react";

export default function CalorieDeficitCalculator() {
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState("male");
  const [weight, setWeight] = useState("80");
  const [height, setHeight] = useState("175");
  const [goalWeight, setGoalWeight] = useState("72");
  const [activityLevel, setActivityLevel] = useState("1.375");

  const [results, setResults] = useState<{
    bmr: number;
    tdee: number;
    targetCalories: number;
    weeks: number;
    macros: { protein: number; carbs: number; fat: number };
  } | null>(null);

  const calculateCalorieDeficit = () => {
    const ageVal = parseFloat(age);
    const weightVal = parseFloat(weight);
    const heightVal = parseFloat(height);
    const goalVal = parseFloat(goalWeight);
    const activityVal = parseFloat(activityLevel);

    if (!ageVal || !weightVal || !heightVal || !goalVal || !activityVal) return;

    // Mifflin-St Jeor Equation
    const genderOffset = gender === "male" ? 5 : -161;
    const bmr = 10 * weightVal + 6.25 * heightVal - 5 * ageVal + genderOffset;
    const tdee = bmr * activityVal;

    // Standard 500 kcal deficit
    const deficit = 500;
    const targetCalories = Math.max(1200, tdee - deficit); // Ensure safe minimum calories

    // Total weight difference
    const weightDiff = weightVal - goalVal;
    
    // 7700 kcal per kg of body fat
    const weeks = weightDiff > 0 ? (weightDiff * 7700) / (deficit * 7) : 0;

    // Macros: 30% Protein, 40% Carbs, 30% Fat
    const proteinGrams = Math.round((targetCalories * 0.3) / 4);
    const carbsGrams = Math.round((targetCalories * 0.4) / 4);
    const fatGrams = Math.round((targetCalories * 0.3) / 9);

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      weeks: parseFloat(weeks.toFixed(1)),
      macros: {
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams,
      },
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Flame className="h-8 w-8 mr-2 text-primary" />
          Calorie Deficit & Weight Loss Calculator
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Calculate your TDEE, custom calorie deficit targets, macronutrient split, and estimated weight loss timeline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <CardDescription>Enter physical metrics and fitness parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4 pt-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age (years)</Label>
                  <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Current Weight (kg)</Label>
                  <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalWeight">Goal Weight (kg)</Label>
                  <Input id="goalWeight" type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity">Activity Level</Label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger id="activity">
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.2">Sedentary (Little or no exercise)</SelectItem>
                    <SelectItem value="1.375">Lightly Active (1-3 days/week of light exercise)</SelectItem>
                    <SelectItem value="1.55">Moderately Active (3-5 days/week of moderate exercise)</SelectItem>
                    <SelectItem value="1.725">Very Active (6-7 days/week of heavy exercise)</SelectItem>
                    <SelectItem value="1.9">Extra Active (Very physical job or athletic training)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={calculateCalorieDeficit} className="w-full mt-2">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Deficit
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Calculation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary/5 p-4 rounded-md text-center">
                    <p className="text-sm text-muted-foreground">Base BMR</p>
                    <p className="text-2xl font-bold text-foreground">{results.bmr} kcal</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-md text-center">
                    <p className="text-sm text-muted-foreground">TDEE (Maintenance)</p>
                    <p className="text-2xl font-bold text-foreground">{results.tdee} kcal</p>
                  </div>
                  <div className="bg-emerald-500/10 p-4 rounded-md text-center border border-emerald-500/20">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Weight Loss Target</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{results.targetCalories} kcal</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <span className="text-muted-foreground text-sm">Estimated Timeline to Reach Goal Weight: </span>
                  <span className="font-semibold text-lg text-foreground">{results.weeks} Weeks</span>
                  <p className="text-xs text-muted-foreground mt-1">Calculated using standard 500 kcal deficit/day (0.5 kg loss per week)</p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-1.5">
                    <Apple className="h-5 w-5 text-emerald-500" />
                    Target Macronutrient Split
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="border p-3 rounded-md">
                      <p className="font-medium text-sm">Protein (30%)</p>
                      <p className="text-xl font-bold text-primary mt-1">{results.macros.protein}g</p>
                    </div>
                    <div className="border p-3 rounded-md">
                      <p className="font-medium text-sm">Carbohydrates (40%)</p>
                      <p className="text-xl font-bold text-primary mt-1">{results.macros.carbs}g</p>
                    </div>
                    <div className="border p-3 rounded-md">
                      <p className="font-medium text-sm">Fats (30%)</p>
                      <p className="text-xl font-bold text-primary mt-1">{results.macros.fat}g</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Boost Fat Loss
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Meeting daily protein goals is critical to preserve lean muscle tissue while losing body fat in a calorie deficit.
              </p>
              <div className="p-3 bg-white dark:bg-black rounded-lg border space-y-2 shadow-sm">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Optimum Nutrition Whey Protein
                </div>
                <p className="text-xs text-muted-foreground">
                  The world's best-selling whey protein powder. Helps kickstart muscle recovery and maintains satiety.
                </p>
                <a 
                  href="https://www.amazon.com/dp/B000QSNYGI" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block mt-2"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Shop Whey Protein on Amazon
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
