import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

/**
 * A simplified implementation of an Indic transliteration tool similar to Google Transliterate
 * Based on common transliteration patterns for Hindi, Tamil, and Bengali
 */
export default function Transliterate() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('hi');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lastWord, setLastWord] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // Language options
  const languageOptions = [
    { id: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { id: 'bn', name: 'Bengali', nativeName: 'বাংলা' }
  ];

  // Transliteration maps
  const transliterationMaps: Record<string, Record<string, string>> = {
    hi: {
      'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ',
      'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
      'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
      'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ', 'ny': 'ञ',
      't': 'ट', 'th': 'ठ', 'd': 'ड', 'dh': 'ढ', 'n': 'ण',
      'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'nn': 'न',
      'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
      'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'sh': 'श',
      'ss': 'ष', 's': 'स', 'h': 'ह',
      'namaste': 'नमस्ते', 'hindi': 'हिंदी'
    },
    ta: {
      'a': 'அ', 'aa': 'ஆ', 'i': 'இ', 'ee': 'ஈ', 'u': 'உ', 'oo': 'ஊ',
      'e': 'எ', 'ae': 'ஏ', 'ai': 'ஐ', 'o': 'ஒ', 'oa': 'ஓ', 'au': 'ஔ',
      'k': 'க்', 'ng': 'ங்', 'ch': 'ச்', 'nj': 'ஞ்', 'd': 'ட்',
      'nz': 'ண்', 'th': 'த்', 'nh': 'ந்', 'p': 'ப்', 'm': 'ம்',
      'y': 'ய்', 'r': 'ர்', 'l': 'ல்', 'v': 'வ்', 'zh': 'ழ்',
      'll': 'ள்', 'rr': 'ற்', 'n': 'ன்', 'j': 'ஜ்', 'sh': 'ஷ்',
      's': 'ஸ்', 'h': 'ஹ்', 'ka': 'க', 'vanakkam': 'வணக்கம்'
    },
    bn: {
      'a': 'অ', 'aa': 'আ', 'i': 'ই', 'ee': 'ঈ', 'u': 'উ', 'oo': 'ঊ',
      'ri': 'ঋ', 'e': 'এ', 'ai': 'ঐ', 'o': 'ও', 'au': 'ঔ',
      'k': 'ক', 'kh': 'খ', 'g': 'গ', 'gh': 'ঘ', 'ng': 'ঙ',
      'ch': 'চ', 'chh': 'ছ', 'j': 'জ', 'jh': 'ঝ', 'ny': 'ঞ',
      'tt': 'ট', 'tth': 'ঠ', 'dd': 'ড', 'ddh': 'ঢ', 'nn': 'ণ',
      'ta': 'ত', 'tha': 'থ', 'da': 'দ', 'dha': 'ধ', 'n': 'ন',
      'p': 'প', 'ph': 'ফ', 'b': 'ব', 'bh': 'ভ', 'm': 'ম',
      'y': 'য', 'r': 'র', 'l': 'ল', 'sh': 'শ', 'ss': 'ষ',
      's': 'স', 'h': 'হ', 'nomoskar': 'নমস্কার'
    }
  };

  // Get suggestions based on current input
  const getSuggestions = (input: string, lang: string): string[] => {
    // Split by whitespace to get the last word
    const words = input.split(/\s/);
    const word = words[words.length - 1].toLowerCase();
    
    if (!word) return [];
    
    // Get the map for the selected language
    const langMap = transliterationMaps[lang] || {};
    
    // Find matching keys and return their values as suggestions
    return Object.entries(langMap)
      .filter(([key]) => key.startsWith(word))
      .map(([_, value]) => value);
  };

  // Update suggestions when text or language changes
  useEffect(() => {
    if (text) {
      const newSuggestions = getSuggestions(text, language);
      setSuggestions(newSuggestions);
      
      // Store the last word for replacement
      const words = text.split(/\s/);
      setLastWord(words[words.length - 1].toLowerCase());
    } else {
      setSuggestions([]);
      setLastWord('');
    }
  }, [text, language]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    const words = text.split(/\s/);
    // Replace the last word with the selected suggestion
    words[words.length - 1] = suggestion;
    setText(words.join(' ') + ' ');
    setSuggestions([]);
    
    // Focus back on the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle language change
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    setSuggestions([]);
  };

  // Clear the text
  const handleClear = () => {
    setText('');
    setSuggestions([]);
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The transliterated text has been copied to your clipboard."
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Transliterate Tool</CardTitle>
          <CardDescription>
            Type in English and get text in your selected language. Start typing to see suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Label htmlFor="language">Target Language:</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(lang => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name} ({lang.nativeName})
                    </SelectItem>
                  ))}
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
                  ref={textareaRef}
                  placeholder="Start typing in English..."
                  value={text}
                  onChange={handleTextChange}
                  className="min-h-[200px] text-lg"
                />
                
                {suggestions.length > 0 && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2 flex flex-wrap gap-2">
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
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 min-h-[200px] text-lg">
                  {text || <span className="text-gray-400">Your transliterated text will appear here...</span>}
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