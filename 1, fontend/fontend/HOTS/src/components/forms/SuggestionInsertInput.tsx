import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';

export const SuggestionInsertInput = ({
  suggestions = [],
  placeholder,
  value = '',              // 🧩 changed from defaultValue → value
  readOnly = false,
  onChange = () => { },
  onEnter = () => { },
  onBlur = () => { },
  required
}) => {
  const [innerValue, setInnerValue] = useState(value); // 🧠 internal mirror for typing
  const [visible, setVisible] = useState(false);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [index, setIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 🧩 Sync internal input when parent value changes
  useEffect(() => {
    setInnerValue(value ?? '');
  }, [value]);

  // Normalize suggestions into flat array but keep original objects
  const normalized = React.useMemo(() => {
    return suggestions.flatMap(s => (Array.isArray(s) ? s : [s])).filter(Boolean);
  }, [suggestions]);

  useEffect(() => {
    if (!innerValue) {
      setFiltered(normalized);
    } else {
      const v = String(innerValue).toLowerCase();
      setFiltered(
        normalized.filter(s => {
          const text = typeof s === 'string'
            ? s
            : (s.item_name ?? s.label ?? s.name ?? JSON.stringify(s));
          return String(text).toLowerCase().includes(v);
        })
      );
    }
    setIndex(-1);
  }, [innerValue, normalized]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setVisible(false);
        setIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const applySelection = (s: any) => {
    const display = typeof s === 'string'
      ? s
      : (s.item_name ?? s.label ?? s.name ?? JSON.stringify(s));

    setInnerValue(display);
    onChange(display, s);
    onEnter(display, s);
    setVisible(false);
    setIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setVisible(true);
      setIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (index >= 0 && index < filtered.length) {
        e.preventDefault();
        applySelection(filtered[index]);
      } else {
        // commit typed value
        onEnter(innerValue, null);
        setVisible(false);
      }
    } else if (e.key === 'Escape') {
      setVisible(false);
      setIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={innerValue}                    // 🧩 bound to internal mirror
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => {
          const val = e.target.value;
          setInnerValue(val);
          onChange(val, null);
          setVisible(true);
        }}
        onFocus={() => setVisible(true)}
        onBlur={() => {
          onBlur(innerValue);
        }}
        onKeyDown={handleKeyDown}
        className="w-full border p-2 rounded"
        required={required}
      />

      {visible && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border rounded shadow max-h-60 overflow-auto">
          {filtered.map((s, i) => {
            const text = typeof s === 'string'
              ? s
              : (s.item_name ?? s.label ?? s.name ?? JSON.stringify(s));
            return (
              <li
                key={`${text}-${i}`}
                onMouseDown={(ev) => {
                  ev.preventDefault(); // prevent blur
                  applySelection(s);
                }}
                className={`p-2 cursor-pointer ${i === index ? 'bg-blue-100' : ''}`}
              >
                {text}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
