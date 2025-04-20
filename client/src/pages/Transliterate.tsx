import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Languages } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SocialShare } from '@/components/SocialShare';

/**
 * Enhanced implementation of an Indic transliteration tool using Google Input Tools API
 * The suggestions appear directly in the textarea
 */
export default function Transliterate() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('ta');
  const [isLoading, setIsLoading] = useState(false);
  const [lastWord, setLastWord] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Language options
  const languageOptions = [
    { id: 'hi', name: 'Hindi', nativeName: 'हिंदी', code: 'hi-t-i0-und' },
    { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-t-i0-und' },
    { id: 'bn', name: 'Bengali', nativeName: 'বাংলা', code: 'bn-t-i0-und' },
    { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', code: 'te-t-i0-und' },
    { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-t-i0-und' },
    { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn-t-i0-und' },
    { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu-t-i0-und' },
    { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa-t-i0-und' },
  ];

  // Get language code for API call
  const getLanguageCode = (langId: string) => {
    const lang = languageOptions.find(l => l.id === langId);
    return lang ? lang.code : 'ta-t-i0-und'; // Default to Tamil if not found
  };

  // Function to fetch suggestions from Google Input Tools API
  const fetchSuggestions = useCallback(async (word: string, lang: string) => {
    if (!word.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use Google Input Tools API
      const langCode = getLanguageCode(lang);
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=${langCode}&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Google Input Tools API returns a specific format
      // The suggestions are usually in data[1][0][1]
      if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
        setSuggestions(data[1][0][1]);
        
        // Auto-replace the word with the first suggestion if available
        if (data[1][0][1].length > 0 && textareaRef.current) {
          const firstSuggestion = data[1][0][1][0];
          // Split text by words
          const words = text.split(/\s/);
          // Replace the last word with the selected suggestion
          words[words.length - 1] = firstSuggestion;
          const newText = words.join(' ');
          setText(newText);
          
          // Position cursor at the end
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = newText.length;
              textareaRef.current.selectionEnd = newText.length;
              textareaRef.current.focus();
            }
          }, 0);
        }
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching transliteration suggestions:', error);
      toast({
        title: "Error fetching suggestions",
        description: "Could not get transliteration suggestions. Please try again.",
        variant: "destructive"
      });
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Check if space was just pressed (last character is space)
    if (newText.endsWith(' ') && newText.length > 1) {
      // Get the word before the space
      const words = newText.split(/\s/);
      const word = words[words.length - 2].trim(); // get second to last word (before the space)
      
      if (word) {
        setLastWord(word);
        fetchSuggestions(word, language);
      }
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
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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
          <CardTitle className="text-2xl flex items-center">
            <Languages className="mr-2 h-6 w-6" />
            Google Transliteration Tool
          </CardTitle>
          <CardDescription>
            Type in English and it will automatically convert to your chosen language. The suggestions appear directly in the text area as you type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <Label htmlFor="language" className="mr-2">Target Language:</Label>
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
              
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span className="text-sm text-muted-foreground">
                  {isLoading ? "Transliterating..." : "Type a word and press space"}
                </span>
              </div>
            </div>

            <div className="relative">
              {isLoading && (
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="transliterateTextarea" className="text-sm text-muted-foreground">
                  Type in English to transliterate to {languageOptions.find(l => l.id === language)?.name} ({languageOptions.find(l => l.id === language)?.nativeName})
                </Label>
                <Textarea
                  ref={textareaRef}
                  placeholder="Start typing in English (press Space for transliteration suggestions)..."
                  value={text}
                  onChange={handleTextChange}
                  className="min-h-[250px] text-lg font-medium"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Type in English and press space to see transliterated text
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear Text
            </Button>
            <Button onClick={handleCopy}>
              Copy to Clipboard
            </Button>
          </div>
          <div>
            <SocialShare 
              title="Check out this transliteration tool!" 
              description="I used this awesome transliteration tool that lets you type in multiple Indian languages."
              compact
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}