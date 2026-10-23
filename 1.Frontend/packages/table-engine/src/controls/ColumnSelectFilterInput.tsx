/**
 * @hots/table-engine — column select filter
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 332–397 (split 2026-10-06).
 */

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hots/ui-kit';
import { Filter } from 'lucide-react';
import { cn } from '@hots/ui-kit';

export function ColumnSelectFilterInput({
  columnKey,
  label,
  options,
  onAddTag,
}: {
  columnKey: string;
  label: string;
  options: Array<{ label: string; value: string }>;
  onAddTag: (tag: { key: string; label: string; operator: 'include' | 'exclude'; value: string }) => void;
}) {
  const [mode, setMode] = useState<'include' | 'exclude'>('include');

  const toggleMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMode((prev) => (prev === 'include' ? 'exclude' : 'include'));
  };

  const handleSelect = (val: string) => {
    if (!val) return;
    onAddTag({
      key: columnKey,
      label,
      operator: mode,
      value: val,
    });
  };

  return (
    <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title={mode === 'exclude' ? 'Mode: Exclude / Filter Out (Click to switch to Include)' : 'Mode: Include / Contains (Click to switch to Exclude)'}
        aria-label={mode === 'exclude' ? 'Exclude mode active' : 'Include mode active'}
        onClick={toggleMode}
        className={cn(
          "h-7 px-1.5 text-[11px] font-bold rounded-l border border-r-0 transition-colors flex items-center justify-center shrink-0 select-none",
          mode === 'exclude'
            ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
            : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
        )}
      >
        {mode === 'exclude' ? '≠ Out' : '= In'}
      </button>
      <div className="relative flex-1">
        <Select onValueChange={handleSelect} value="">
          <SelectTrigger
            className={cn(
              "h-7 rounded-l-none text-xs font-normal",
              mode === 'exclude' ? "bg-rose-50/40 border-rose-300 focus-visible:ring-rose-400" : "bg-white"
            )}
          >
            <SelectValue placeholder={`Select ${label}...`} />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
