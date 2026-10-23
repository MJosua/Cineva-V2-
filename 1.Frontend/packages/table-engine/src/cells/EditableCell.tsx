/**
 * @hots/table-engine — inline editable cell
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 164–216 (split 2026-10-06).
 */

import { useEffect, useRef, useState } from 'react';
import { Input } from '@hots/ui-kit';
import { Save } from 'lucide-react';

import type { ReusableColumn } from '../types';

export function EditableCell<T extends Record<string, any>>({
  row,
  column,
  current,
  onSave,
}: {
  row: T;
  column: ReusableColumn<T>;
  current: unknown;
  onSave: (row: T, field: string, value: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState(String(current ?? ''));
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const skipBlurSave = useRef(false);

  useEffect(() => {
    setValue(String(current ?? ''));
    setFailed(false);
  }, [current]);

  const save = async () => {
    if (value === String(current ?? '')) return;
    setPending(true);
    setFailed(false);
    try {
      await onSave(row, column.onSaveField || String(column.key), value);
    } catch (_error) {
      setValue(String(current ?? ''));
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <Input
      value={value}
      disabled={pending}
      aria-invalid={failed}
      title={failed ? 'Save failed. The previous value was restored.' : undefined}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        if (skipBlurSave.current) { skipBlurSave.current = false; return; }
        void save();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          event.preventDefault();
          skipBlurSave.current = true;
          setValue(String(current ?? ''));
          event.currentTarget.blur();
        }
      }}
      className="h-8 min-w-20 bg-white aria-[invalid=true]:border-red-500"
    />
  );
}
