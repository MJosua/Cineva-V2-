/**
 * @hots/table-engine — color picker + preset colors
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 218–330 (split 2026-10-06).
 */

import { useEffect, useState } from 'react';
import { Button } from '@hots/ui-kit';
import { Input } from '@hots/ui-kit';
import { Palette, X } from 'lucide-react';
import { cn } from '@hots/ui-kit';

export const PRESET_COLORS = [
  '#ffffff', // White
  '#f8fafc', // Slate
  '#fef08a', // Yellow pastel (SRF)
  '#bbf7d0', // Green pastel (I2I)
  '#bae6fd', // Blue pastel
  '#fed7aa', // Orange pastel
  '#fbcfe8', // Pink pastel
  '#e9d5ff', // Purple pastel
  '#fedee1', // Rose pastel
  '#dcfce7', // Emerald light
];

export function HexRoundColorPicker({
  value,
  onChange,
  onClear,
}: {
  value?: string;
  onChange: (color: string) => void;
  onClear?: () => void;
}) {
  const [customHex, setCustomHex] = useState(value || '');

  useEffect(() => {
    setCustomHex(value || '');
  }, [value]);

  const handleApplyHex = () => {
    let clean = customHex.trim();
    if (!clean) {
      onClear?.();
      return;
    }
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (/^#([0-9A-F]{3}){1,2}$/i.test(clean)) {
      onChange(clean);
    }
  };

  return (
    <div className="space-y-2 p-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRESET_COLORS.map((hex) => {
          const isSelected = value?.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              title={hex}
              onClick={() => onChange(hex)}
              style={{ backgroundColor: hex }}
              className={cn(
                "h-6 w-6 rounded-full border transition-transform hover:scale-110 shrink-0 shadow-2xs",
                isSelected ? "ring-2 ring-blue-600 ring-offset-1 border-slate-400" : "border-slate-300"
              )}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
        <label className="relative cursor-pointer shrink-0" title="Custom native color picker">
          <input
            type="color"
            value={value && value.startsWith('#') && value.length === 7 ? value : '#ffffff'}
            onChange={(e) => {
              setCustomHex(e.target.value);
              onChange(e.target.value);
            }}
            className="sr-only"
          />
          <div
            style={{ backgroundColor: value || '#ffffff' }}
            className="h-7 w-7 rounded-full border border-slate-300 shadow-2xs flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Palette className="h-3.5 w-3.5 text-slate-700 mix-blend-difference" />
          </div>
        </label>
        <Input
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApplyHex();
            }
          }}
          placeholder="#HEX (e.g. #fef08a)"
          className="h-7 text-xs font-mono bg-white flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleApplyHex}
          className="h-7 px-2 text-xs font-medium"
        >
          Set
        </Button>
        {onClear && value ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="h-7 px-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            title="Reset color"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
