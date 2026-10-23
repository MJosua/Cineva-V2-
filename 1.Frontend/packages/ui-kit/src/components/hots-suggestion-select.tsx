import * as React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuggestionItem {
    /** Primary value returned on selection */
    key: string;
    /** Secondary gray line shown below the key */
    sublabel?: string;
    /** Optional icon rendered before the key */
    icon?: React.ReactNode;
    /** Any extra data you want to carry */
    meta?: Record<string, unknown>;
}

export interface HotsSuggestionSelectProps {
    value: string;
    onChange: (val: string, item?: SuggestionItem) => void;
    items: SuggestionItem[];
    placeholder?: string;
    /** Small red asterisk label suffix when required */
    required?: boolean;
    /** Label text rendered above the field */
    label?: string;
    disabled?: boolean;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    clearable?: boolean;
    /** Max dropdown results (default 10) */
    maxResults?: number;
    id?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const HotsSuggestionSelect = React.forwardRef<
    HTMLInputElement,
    HotsSuggestionSelectProps
>(
    (
        {
            value,
            onChange,
            items,
            placeholder = "Select…",
            required = false,
            label,
            disabled = false,
            loading = false,
            emptyMessage = "No results found.",
            className,
            clearable = true,
            maxResults = 10,
            id,
        },
        ref
    ) => {
        const [isOpen, setIsOpen] = useState(false);
        const [query, setQuery] = useState(value ?? "");
        const containerRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);

        // Keep internal query in sync with external value
        useEffect(() => {
            setQuery(value ?? "");
        }, [value]);

        // Dismiss on outside click — revert query to last confirmed value
        useEffect(() => {
            const onDown = (e: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                    setIsOpen(false);
                    setQuery(value ?? "");
                }
            };
            document.addEventListener("mousedown", onDown);
            return () => document.removeEventListener("mousedown", onDown);
        }, [value]);

        // Keyboard: Escape closes
        useEffect(() => {
            const onKey = (e: KeyboardEvent) => {
                if (e.key === "Escape" && isOpen) {
                    setIsOpen(false);
                    setQuery(value ?? "");
                }
            };
            document.addEventListener("keydown", onKey);
            return () => document.removeEventListener("keydown", onKey);
        }, [isOpen, value]);

        // Filtered & capped results
        const filtered = useMemo(() => {
            const q = query.toLowerCase().trim();
            if (!q) return items.slice(0, maxResults);
            return items
                .filter(
                    (item) =>
                        item.key.toLowerCase().includes(q) ||
                        (item.sublabel ?? "").toLowerCase().includes(q)
                )
                .slice(0, maxResults);
        }, [query, items, maxResults]);

        const handleInputChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                setQuery(val);
                onChange(val, undefined);
                setIsOpen(true);
            },
            [onChange]
        );

        const handleSelect = useCallback(
            (item: SuggestionItem) => {
                setQuery(item.key);
                onChange(item.key, item);
                setIsOpen(false);
            },
            [onChange]
        );

        const handleClear = useCallback(
            (e: React.MouseEvent) => {
                e.stopPropagation();
                setQuery("");
                onChange("", undefined);
                setIsOpen(false);
                inputRef.current?.focus();
            },
            [onChange]
        );

        const isFocused = isOpen;
        const hasValue = query.length > 0;

        return (
            <div ref={containerRef} className={cn("relative w-full", className)}>

                {/* ── Label ─────────────────────────────────────────────── */}
                {label && (
                    <label
                        htmlFor={id}
                        className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                        {label}
                        {required && (
                            <span className="ml-1 text-red-500 font-bold">*</span>
                        )}
                    </label>
                )}

                {/* ── Input ─────────────────────────────────────────────── */}
                <div className="relative">
                    <input
                        id={id}
                        ref={(el) => {
                            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                            if (typeof ref === "function") ref(el);
                            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
                        }}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => setIsOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        autoComplete="off"
                        className={cn(
                            // Base geometry
                            "w-full h-10 px-3 pr-8 rounded-md text-sm",
                            // Border — thin, gray by default; vivid blue-indigo on focus
                            "border transition-all duration-150 outline-none",
                            isFocused
                                ? "border-indigo-500 ring-1 ring-indigo-400/40 bg-white"
                                : "border-slate-300 bg-white hover:border-slate-400",
                            // Text
                            "text-slate-800 placeholder:text-slate-400",
                            disabled && "opacity-50 cursor-not-allowed bg-slate-50"
                        )}
                    />

                    {/* Right icon slot */}
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                        {loading ? (
                            <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                        ) : clearable && hasValue ? (
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={handleClear}
                                className="w-4 h-4 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                aria-label="Clear"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        ) : (
                            <ChevronDown
                                onClick={() => { if (!disabled) setIsOpen(p => !p); }}
                                className={cn(
                                    "w-3.5 h-3.5 cursor-pointer transition-all duration-200",
                                    isFocused
                                        ? "rotate-180 text-indigo-500"
                                        : "text-slate-400"
                                )}
                            />
                        )}
                    </div>
                </div>

                {/* ── Dropdown ──────────────────────────────────────────── */}
                {isOpen && !disabled && (
                    <div
                        className={cn(
                            "absolute left-0 right-0 z-[9999]",
                            // Attach flush to input (no gap) — negative margin compensates border overlap
                            "-mt-px",
                            // White panel, matching border colour as input when focused
                            "bg-white border border-indigo-400/60",
                            "rounded-b-md",
                            "shadow-lg shadow-slate-200/80",
                            "max-h-[280px] overflow-y-auto",
                            // Smooth appear
                            "animate-in fade-in-0 slide-in-from-top-1 duration-100"
                        )}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                                Loading…
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-400 italic">
                                {emptyMessage}
                            </div>
                        ) : (
                            filtered.map((item, idx) => {
                                const isSelected = value === item.key;
                                return (
                                    <button
                                        key={`${item.key}-${idx}`}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()} // keep input focus
                                        onClick={() => handleSelect(item)}
                                        className={cn(
                                            "w-full text-left px-4 py-2.5",
                                            "flex items-start gap-2.5",
                                            "transition-colors duration-100",
                                            // Hover: very light gray wash
                                            "hover:bg-slate-50",
                                            // Selected: light indigo tint
                                            isSelected && "bg-indigo-50/70",
                                            // Divider between rows (except last)
                                            idx < filtered.length - 1 && "border-b border-slate-100"
                                        )}
                                    >
                                        {/* Optional icon */}
                                        {item.icon && (
                                            <span className="mt-0.5 flex-shrink-0 text-slate-400">
                                                {item.icon}
                                            </span>
                                        )}

                                        <span className="flex flex-col min-w-0">
                                            {/* Primary label — dark bold */}
                                            <span
                                                className={cn(
                                                    "text-sm font-semibold leading-snug truncate",
                                                    isSelected
                                                        ? "text-indigo-700"
                                                        : "text-slate-800"
                                                )}
                                            >
                                                {item.key}
                                            </span>

                                            {/* Sublabel — muted gray, same style as screenshot */}
                                            {item.sublabel && (
                                                <span className="text-xs text-slate-400 font-normal leading-snug mt-0.5 truncate">
                                                    {item.sublabel}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        );
    }
);

HotsSuggestionSelect.displayName = "HotsSuggestionSelect";

export default HotsSuggestionSelect;
export { HotsSuggestionSelect };
