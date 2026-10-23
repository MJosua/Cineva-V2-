/**
 * @hots/table-engine — column text filter
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 399–500 (split 2026-10-06).
 */

import React, { useState } from 'react';
import { Input } from '@hots/ui-kit';
import { CornerDownLeft, Filter, X } from 'lucide-react';
import { cn } from '@hots/ui-kit';

export function ColumnFilterInput({
  columnKey,
  label,
  onAddTag,
}: {
  columnKey: string;
  label: string;
  onAddTag: (tag: { key: string; label: string; operator: 'include' | 'exclude'; value: string }) => void;
}) {
  const [localText, setLocalText] = useState('');
  const [localExclude, setLocalExclude] = useState(false);

  const commitFilter = () => {
    const trimmed = localText.trim();
    if (!trimmed) return;
    onAddTag({
      key: columnKey,
      label,
      operator: localExclude ? 'exclude' : 'include',
      value: trimmed,
    });
    setLocalText('');
  };

  const toggleExclude = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalExclude(!localExclude);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalText('');
  };

  return (
    <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title={localExclude ? 'Mode: Exclude / Filter Out (Click to switch to Include)' : 'Mode: Include / Contains (Click to switch to Exclude)'}
        aria-label={localExclude ? 'Exclude mode active' : 'Include mode active'}
        onClick={toggleExclude}
        className={cn(
          "h-7 px-1.5 text-[11px] font-bold rounded-l border border-r-0 transition-colors flex items-center justify-center shrink-0 select-none",
          localExclude 
            ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100" 
            : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
        )}
      >
        {localExclude ? '≠ Out' : '= In'}
      </button>
      <div className="relative flex-1">
        <Input
          value={localText}
          onChange={(event) => setLocalText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitFilter();
            }
          }}
          placeholder={localExclude ? "Exclude & Enter..." : "Filter & Enter..."}
          aria-label={`Filter ${label}`}
          className={cn(
            "h-7 rounded-l-none text-xs font-normal pr-12",
            localExclude ? "bg-rose-50/40 border-rose-300 focus-visible:ring-rose-400 placeholder:text-rose-400" : "bg-white"
          )}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {localText ? (
            <>
              <button
                type="button"
                title="Press Enter or click to add filter tag"
                aria-label={`Add ${label} filter`}
                className={cn(
                  "rounded p-0.5 transition-colors",
                  localExclude
                    ? "text-rose-600 hover:bg-rose-100"
                    : "text-blue-600 hover:bg-blue-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  commitFilter();
                }}
              >
                <CornerDownLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Clear ${label} filter`}
                className="rounded p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
