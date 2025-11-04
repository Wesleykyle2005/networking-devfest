"use client";

import * as React from "react";
import PhoneInputWithCountry from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import "react-phone-number-input/style.css";

import { Input } from "@/components/ui/input";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string | undefined) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <PhoneInputWithCountry
        flags={flags}
        defaultCountry="NI"
        value={value as any}
        onChange={onChange as any}
        inputComponent={Input}
        international
        withCountryCallingCode
        countryCallingCodeEditable={false}
        className="flex"
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
