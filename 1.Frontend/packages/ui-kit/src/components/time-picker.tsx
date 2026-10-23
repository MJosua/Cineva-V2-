import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value = "00:00",
  onChange,
  disabled,
  className,
  placeholder = "Select time"
}) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value && typeof value === 'string' && value.includes(":")) {
      const [h, m] = value.split(":").map(Number);
      if (!isNaN(h)) setHours(h);
      if (!isNaN(m)) setMinutes(m);
    }
  }, [value]);

  const triggerChange = (h: number, m: number) => {
    const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (onChange) onChange(formatted);
  };

  const adjust = (type: "h" | "m", delta: number) => {
    if (disabled) return;
    if (type === "h") {
      const newH = (hours + delta + 24) % 24;
      setHours(newH);
      triggerChange(newH, minutes);
    } else {
      let newM = minutes + delta;
      let newH = hours;
      if (newM >= 60) {
        newM = 0;
        newH = (newH + 1) % 24;
      } else if (newM < 0) {
        newM = 55;
        newH = (newH - 1 + 24) % 24;
      }
      setHours(newH);
      setMinutes(newM);
      triggerChange(newH, newM);
    }
  };

  const displayValue = value || "00:00";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <Clock className="mr-2 h-4 w-4 opacity-50" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-white shadow-xl border rounded-lg z-[100]" align="start">
        <div className="flex items-center justify-center space-x-4">
          {/* Hours Column */}
          <div className="flex flex-col items-center">
            <button 
              type="button" 
              onClick={() => adjust("h", 1)} 
              className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-600"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <span className="text-2xl font-bold tabular-nums w-10 text-center">
              {String(hours).padStart(2, "0")}
            </span>
            <button 
              type="button" 
              onClick={() => adjust("h", -1)} 
              className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-600"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          <span className="text-2xl font-bold text-gray-300">:</span>

          {/* Minutes Column */}
          <div className="flex flex-col items-center">
            <button 
              type="button" 
              onClick={() => adjust("m", 5)} 
              className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-600"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <span className="text-2xl font-bold tabular-nums w-10 text-center">
              {String(minutes).padStart(2, "0")}
            </span>
            <button 
              type="button" 
              onClick={() => adjust("m", -5)} 
              className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-600"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t flex justify-center">
             <Button size="sm" className="w-full" onClick={() => setIsOpen(false)}>Done</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
