import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Transliterate() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [typingPosition, setTypingPosition] = useState(0);

  // Define transliteration maps
  const getTransliterationMap = (lang: string): Record<string, string> => {
    // Hindi transliteration map
    if (lang === 'hi') {
      return {
        'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ',
        'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
        'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
        'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ', 'na': 'ञ',
        't': 'ट', 'th1': 'ठ', 'd': 'ड', 'dh1': 'ढ', 'nr': 'ण',
        'th2': 'त', 'thh': 'थ', 'dh2': 'द', 'dhh': 'ध', 'n': 'न',
        'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
        'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'sh': 'श',
        'ss': 'ष', 's': 'स', 'h': 'ह',
        'namaste': 'नमस्ते', 'hindi': 'हिंदी'
      };
    }
    // Tamil transliteration map
    else if (lang === 'ta') {
      return {
        'a': 'அ', 'aa': 'ஆ', 'i': 'இ', 'ee': 'ஈ', 'u': 'உ', 'oo': 'ஊ',
        'e': 'எ', 'ae': 'ஏ', 'ai': 'ஐ', 'o': 'ஒ', 'oa': 'ஓ', 'au': 'ஔ',
        'k': 'க்', 'ng': 'ங்', 'ch': 'ச்', 'nj': 'ஞ்', 'd': 'ட்',
        'nz': 'ண்', 'th': 'த்', 'nh': 'ந்', 'p': 'ப்', 'm': 'ம்',
        'y': 'ய்', 'r': 'ர்', 'l': 'ல்', 'v': 'வ்', 'zh': 'ழ்',
        'll': 'ள்', 'rr': 'ற்', 'n': 'ன்', 'j': 'ஜ்', 'sh': 'ஷ்',
        's': 'ஸ்', 'h': 'ஹ்', 'ka': 'க', 'vanakkam': 'வணக்கம்'
      };
    }
    // Bengali transliteration map
    else if (lang === 'bn') {
      return {
        'a': 'অ', 'aa': 'আ', 'i': 'ই', 'ee': 'ঈ', 'u': 'উ', 'oo': 'ঊ',
        'ri': 'ঋ', 'e': 'এ', 'ai': 'ঐ', 'o': 'ও', 'au': 'ঔ',
        'k': 'ক', 'kh': 'খ', 'g': 'গ', 'gh': 'ঘ', 'ng': 'ঙ',
        'ch': 'চ', 'chh': 'ছ', 'j': 'জ', 'jh': 'ঝ', 'ny': 'ঞ',
        'tt': 'ট', 'tth': 'ঠ', 'dd': 'ড', 'ddh': 'ঢ', 'nn': 'ণ',
        'ta': 'ত', 'tha': 'থ', 'da': 'দ', 'dha': 'ধ', 'n': 'ন',
        'p': 'প', 'ph': 'ফ', 'b': 'ব', 'bh': 'ভ', 'm': 'ম',
        'y': 'য', 'r': 'র', 'l': 'ল', 'sh': 'শ', 'ss': 'ষ',
        's': 'স', 'h': 'হ', 'nomoskar': 'নমস্কার'
      };
    }
    // Default to Hindi
    return {
      'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ',
      'namaste': 'नमस्ते', 'hindi': 'हिंदी'
    };
  };

  // Mock transliteration function (in a real app, you would connect to a proper API)
  const transliterate = (text: string, lang: string) => {
    // Get the appropriate transliteration map
    const map = getTransliterationMap(lang);

    // Generate mock suggestions based on the input
    const words = text.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();

    // Return suggestions for the current word being typed
    return Object.keys(map).filter(key => key.startsWith(lastWord)).map(key => map[key]);
  };

  // Handle user input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    
    // Get the last word being typed
    const words = newText.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    setCurrentWord(lastWord);
    
    // Generate transliteration suggestions
    if (lastWord) {
      const newSuggestions = transliterate(newText, selectedLanguage);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    const words = inputText.split(' ');
    words[words.length - 1] = suggestion;
    const newText = words.join(' ') + ' ';
    setInputText(newText);
    setSuggestions([]);
    setCurrentWord('');
  };

  // Handle language change
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    setSuggestions([]);
  };

  // Clear text
  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setSuggestions([]);
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
    // In a real app, you might want to show a toast notification here
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Google Transliterate</CardTitle>
          <CardDescription>
            Type in English and get text in your selected language. Start typing to see suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Label htmlFor="language">Language:</Label>
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                  <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                  <SelectItem value="bn">Bengali (বাংলা)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="typing">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="typing">Typing Area</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="typing" className="space-y-4">
                <Textarea
                  placeholder="Start typing in English..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="min-h-[200px] text-lg"
                />
                
                {suggestions.length > 0 && (
                  <div className="bg-gray-100 rounded-md p-2 flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <Button 
                        key={index} 
                        variant="outline"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="text-lg"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="bg-gray-50 rounded-md p-4 min-h-[200px] text-lg">
                  {inputText || <span className="text-gray-400">Your transliterated text will appear here...</span>}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button variant="outline" onClick={handleClear}>Clear</Button>
          </div>
          <div>
            <Button onClick={handleCopy}>Copy to Clipboard</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}