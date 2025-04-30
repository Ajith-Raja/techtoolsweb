import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgeData {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
}

export default function BirthdayCalculator() {
  const [birthdate, setBirthdate] = useState<string>("");
  const [age, setAge] = useState<AgeData | null>(null);
  const [nextBirthday, setNextBirthday] = useState<string>("");
  const [daysUntilNextBirthday, setDaysUntilNextBirthday] = useState<number>(0);
  const [zodiacSign, setZodiacSign] = useState<string>("");
  const [chineseZodiac, setChineseZodiac] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");

  // Update age every second
  useEffect(() => {
    if (!birthdate) return;
    
    const intervalId = setInterval(() => {
      calculateAge(birthdate);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [birthdate]);

  // Calculate all data when birthdate changes
  useEffect(() => {
    if (birthdate) {
      calculateAge(birthdate);
      calculateNextBirthday(birthdate);
      calculateZodiacSign(birthdate);
      calculateChineseZodiac(birthdate);
      calculateDayOfWeek(birthdate);
    }
  }, [birthdate]);

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const now = new Date();
    
    // Validate birth date
    if (isNaN(birthDate.getTime()) || birthDate > now) {
      setAge(null);
      return;
    }
    
    // Calculate years
    let years = now.getFullYear() - birthDate.getFullYear();
    
    // Check if birthday hasn't occurred yet this year
    const hasBirthdayOccurredThisYear = 
      now.getMonth() > birthDate.getMonth() || 
      (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
    
    if (!hasBirthdayOccurredThisYear) {
      years--;
    }
    
    // Clone birth date and set it to the current year
    const lastBirthday = new Date(birthDate.getTime());
    lastBirthday.setFullYear(
      hasBirthdayOccurredThisYear ? now.getFullYear() : now.getFullYear() - 1
    );
    
    // Calculate difference
    const diffMs = now.getTime() - lastBirthday.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Calculate months and days
    let months = 0;
    let days = 0;
    
    let tempDate = new Date(lastBirthday.getTime());
    while (tempDate <= now && months < 12) {
      tempDate.setMonth(tempDate.getMonth() + 1);
      if (tempDate <= now) {
        months++;
      }
    }
    
    tempDate = new Date(lastBirthday.getTime());
    tempDate.setMonth(tempDate.getMonth() + months);
    
    // Calculate days difference
    const msInDay = 24 * 60 * 60 * 1000;
    days = Math.floor((now.getTime() - tempDate.getTime()) / msInDay);
    
    // Calculate hours, minutes, and seconds remaining
    const hours = now.getHours() - birthDate.getHours();
    const minutes = now.getMinutes() - birthDate.getMinutes();
    const seconds = now.getSeconds() - birthDate.getSeconds();
    
    // Calculate total values
    const totalDays = Math.floor((now.getTime() - birthDate.getTime()) / (24 * 60 * 60 * 1000));
    const totalHours = Math.floor((now.getTime() - birthDate.getTime()) / (60 * 60 * 1000));
    const totalMinutes = Math.floor((now.getTime() - birthDate.getTime()) / (60 * 1000));
    const totalSeconds = Math.floor((now.getTime() - birthDate.getTime()) / 1000);
    
    setAge({
      years,
      months,
      days,
      hours: (hours + 24) % 24,
      minutes: (minutes + 60) % 60,
      seconds: (seconds + 60) % 60,
      totalDays,
      totalHours,
      totalMinutes,
      totalSeconds
    });
  };

  const calculateNextBirthday = (dob: string) => {
    const birthDate = new Date(dob);
    const now = new Date();
    
    // Validate birth date
    if (isNaN(birthDate.getTime()) || birthDate > now) {
      setNextBirthday("");
      setDaysUntilNextBirthday(0);
      return;
    }
    
    // Calculate next birthday
    const nextBdayThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    const nextBdayNextYear = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
    
    // Determine which one is next
    const nextBday = nextBdayThisYear > now ? nextBdayThisYear : nextBdayNextYear;
    
    // Format date
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setNextBirthday(nextBday.toLocaleDateString('en-US', options));
    
    // Calculate days until next birthday
    const msInDay = 24 * 60 * 60 * 1000;
    const daysUntil = Math.ceil((nextBday.getTime() - now.getTime()) / msInDay);
    setDaysUntilNextBirthday(daysUntil);
  };

  const calculateZodiacSign = (dob: string) => {
    const birthDate = new Date(dob);
    
    // Validate birth date
    if (isNaN(birthDate.getTime())) {
      setZodiacSign("");
      return;
    }
    
    const month = birthDate.getMonth() + 1; // JavaScript months are 0-based
    const day = birthDate.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
      setZodiacSign("Aries");
    } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
      setZodiacSign("Taurus");
    } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
      setZodiacSign("Gemini");
    } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
      setZodiacSign("Cancer");
    } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      setZodiacSign("Leo");
    } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      setZodiacSign("Virgo");
    } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
      setZodiacSign("Libra");
    } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
      setZodiacSign("Scorpio");
    } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      setZodiacSign("Sagittarius");
    } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
      setZodiacSign("Capricorn");
    } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
      setZodiacSign("Aquarius");
    } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
      setZodiacSign("Pisces");
    }
  };

  const calculateChineseZodiac = (dob: string) => {
    const birthDate = new Date(dob);
    
    // Validate birth date
    if (isNaN(birthDate.getTime())) {
      setChineseZodiac("");
      return;
    }
    
    const animals = [
      "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
      "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"
    ];
    
    const birthYear = birthDate.getFullYear();
    // Chinese zodiac runs on a 12-year cycle
    // 1900 is known to be a year of the Rat (index 0)
    const animalIndex = (birthYear - 1900) % 12;
    setChineseZodiac(animals[animalIndex >= 0 ? animalIndex : animalIndex + 12]);
  };

  const calculateDayOfWeek = (dob: string) => {
    const birthDate = new Date(dob);
    
    // Validate birth date
    if (isNaN(birthDate.getTime())) {
      setDayOfWeek("");
      return;
    }
    
    const days = [
      "Sunday", "Monday", "Tuesday", "Wednesday", 
      "Thursday", "Friday", "Saturday"
    ];
    
    setDayOfWeek(days[birthDate.getDay()]);
  };

  const formatWithCommas = (number: number): string => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Birthday Calculator</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Birthdate</CardTitle>
            <CardDescription>
              Find out your exact age, next birthday, zodiac sign, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="birthdate">Birthdate</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="pl-10"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {birthdate && age && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Your Age</CardTitle>
                <CardDescription>
                  Here's how long you've been alive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary/10 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Years</p>
                      <p className="text-4xl font-bold">{age.years}</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Months</p>
                      <p className="text-4xl font-bold">{age.months}</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Days</p>
                      <p className="text-4xl font-bold">{age.days}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Hours</p>
                      <p className="text-2xl font-semibold">{age.hours}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Minutes</p>
                      <p className="text-2xl font-semibold">{age.minutes}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Seconds</p>
                      <p className="text-2xl font-semibold">{age.seconds}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-semibold mb-2">Total:</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">{formatWithCommas(age.totalDays)}</span> days
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{formatWithCommas(age.totalHours)}</span> hours
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{formatWithCommas(age.totalMinutes)}</span> minutes
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{formatWithCommas(age.totalSeconds)}</span> seconds
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="mr-2 h-5 w-5 text-primary" />
                    Next Birthday
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-lg font-medium">{nextBirthday}</p>
                    </div>
                    
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <h3 className="font-semibold mb-2">{daysUntilNextBirthday} days to go!</h3>
                      <p className="text-sm text-muted-foreground">
                        {daysUntilNextBirthday === 0 
                          ? "Happy Birthday! 🎂" 
                          : `Your next birthday is in ${daysUntilNextBirthday} days.`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Zodiac Signs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Western Zodiac</h3>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-lg">{zodiacSign}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Chinese Zodiac</h3>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-lg">{chineseZodiac}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Day of Birth</h3>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-lg">{dayOfWeek}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}