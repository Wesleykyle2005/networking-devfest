"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchCountries } from "@/lib/cities-data";
import { cn } from "@/lib/utils";

interface LocationInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}


export function LocationInput({ value = "", onChange, placeholder }: LocationInputProps) {
  const [inputValue, setInputValue] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Search countries from static data
  React.useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      const results = searchCountries(inputValue, 10);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleSelectCountry = (country: string) => {
    setInputValue(country);
    onChange?.(country);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder || "Nicaragua"}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-60 overflow-auto p-1">
            {suggestions.map((country, index) => (
              <button
                key={`${country}-${index}`}
                type="button"
                onClick={() => handleSelectCountry(country)}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  inputValue === country && "bg-accent"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    inputValue === country ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>{country}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
