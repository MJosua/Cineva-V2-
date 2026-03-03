import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast"; // assuming your toast hook is here
import { cn } from "@/lib/utils"; // optional utility for conditional classNames

interface NumberFieldProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readonly?: boolean;
  maxValue?: number;
  rounding?: number | false;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  placeholder,
  readonly,
  maxValue,
  rounding,
}) => {
  const [display, setDisplay] = useState(formatNumber(value));
  const [isInvalid, setIsInvalid] = useState(false);
  const { toast } = useToast();

  function formatNumber(num: string | number | null | undefined) {
    if (num === null || num === undefined || num === "") return "";
    const numStr = typeof num === "number" ? num.toString() : num;
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const handleNumberChange = (inputValue: string) => {
    const raw = inputValue.replace(/,/g, ""); // remove commas before parsing
    let numVal = Number(raw);

    if (!isNaN(numVal)) {
      if (maxValue !== undefined && numVal > maxValue) {
        numVal = maxValue;
      }

      if (rounding) {
        numVal = Math.max(rounding, Math.round(numVal / rounding) * rounding);
      }

      onChange(numVal.toString()); // pass numeric value upward
      return formatNumber(numVal);
    }

    onChange("");
    return "";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = handleNumberChange(e.target.value);
    setDisplay(formatted);

    // Validation: show toast + mark red if ≤ 0
    const rawNum = Number(e.target.value.replace(/,/g, ""));
    if (rawNum <= 0 || isNaN(rawNum)) {
      setIsInvalid(true);
      toast({
        title: "Invalid value",
        description: "Value must be greater than 0.",
        variant: "destructive",
      });
    } else {
      setIsInvalid(false);
    }
  };

  useEffect(() => {
    setDisplay(formatNumber(value));
  }, [value]);

  return (
    <Input
      type="text"
      value={display}
      onChange={(e) => setDisplay(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      readOnly={readonly}
      className={cn(isInvalid && "border-red-500 text-red-600")}
    />
  );
};
