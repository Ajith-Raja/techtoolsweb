import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, AlertCircle, Check, X, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PasswordStrengthTester() {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [strength, setStrength] = useState<number>(0);
  const [entropy, setEntropy] = useState<number>(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    if (password) {
      // This is a basic strength calculation - in a real app, you would use
      // a more sophisticated algorithm like zxcvbn
      const basicStrength = Math.min(100, password.length * 10);
      setStrength(basicStrength);
      
      // Very simple entropy calculation
      const hasLowercase = /[a-z]/.test(password);
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      const charTypes = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;
      const poolSize = (hasLowercase ? 26 : 0) + (hasUppercase ? 26 : 0) + (hasNumbers ? 10 : 0) + (hasSpecial ? 33 : 0);
      
      const calculatedEntropy = password.length * Math.log2(Math.max(1, poolSize));
      setEntropy(calculatedEntropy);
      
      // Update time to crack
      setTime(formatCrackingTime(calculatedEntropy));
      
      // Generate feedback
      const newFeedback = [];
      
      if (password.length < 8) {
        newFeedback.push("Password is too short (minimum 8 characters)");
      }
      
      if (!hasLowercase) {
        newFeedback.push("Add lowercase letters");
      }
      
      if (!hasUppercase) {
        newFeedback.push("Add uppercase letters");
      }
      
      if (!hasNumbers) {
        newFeedback.push("Add numbers");
      }
      
      if (!hasSpecial) {
        newFeedback.push("Add special characters (e.g., !@#$%^&*)");
      }
      
      if (/(.)\1{2,}/.test(password)) {
        newFeedback.push("Avoid repeating characters (e.g., 'aaa')");
      }
      
      if (/^(?:123|abc|qwerty|password)/i.test(password)) {
        newFeedback.push("Avoid common patterns");
      }
      
      setFeedback(newFeedback);
    } else {
      setStrength(0);
      setEntropy(0);
      setFeedback([]);
      setTime("");
    }
  }, [password]);

  const formatCrackingTime = (bits: number): string => {
    // Rough approximation assuming 10^9 guesses per second
    const seconds = Math.pow(2, bits) / Math.pow(10, 9);
    
    if (seconds < 1) {
      return "instantaneously";
    } else if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minutes`;
    } else if (seconds < 86400) {
      return `${Math.round(seconds / 3600)} hours`;
    } else if (seconds < 31536000) {
      return `${Math.round(seconds / 86400)} days`;
    } else if (seconds < 31536000 * 100) {
      return `${Math.round(seconds / 31536000)} years`;
    } else if (seconds < 31536000 * 1000) {
      return `${Math.round(seconds / (31536000 * 100))} centuries`;
    } else {
      return "more than a millennium";
    }
  };

  const getStrengthColor = () => {
    if (strength < 30) return "bg-red-500";
    if (strength < 60) return "bg-yellow-500";
    if (strength < 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthLabel = () => {
    if (strength < 30) return "Weak";
    if (strength < 60) return "Fair";
    if (strength < 80) return "Good";
    return "Strong";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Password Strength Tester</h1>
      <p className="text-gray-600 mb-8">
        Check how strong your password is by analyzing its entropy, pattern recognition, and vulnerability to common attacks. Get recommendations to improve your password security.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Password</CardTitle>
          <CardDescription>
            Your password is analyzed entirely in your browser and is never sent to a server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="relative">
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1 flex">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a password to test"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {password && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Strength: {getStrengthLabel()}</span>
                    <span className="text-sm text-muted-foreground">{strength}%</span>
                  </div>
                  <Progress value={strength} className={getStrengthColor()} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-2" /> Entropy
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Password entropy: <span className="font-medium">{entropy.toFixed(1)} bits</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Estimated time to crack: <span className="font-medium">{time}</span>
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Improvement Suggestions</h3>
                    {feedback.length > 0 ? (
                      <ul className="space-y-2">
                        {feedback.map((item, index) => (
                          <li key={index} className="text-sm flex">
                            <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Your password meets basic security requirements</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The Password Strength Tester is currently under development. The current implementation is basic - a more advanced version using the zxcvbn algorithm will be available soon.
        </AlertDescription>
      </Alert>
    </div>
  );
}