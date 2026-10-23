/**
 * Based on E-Order/src/components/media/ExcelViewer/ExcelViewer.jsx (2026-10-06).
 * Shows the first sheet of an .xlsx/.csv as a table. Requires optional peer `xlsx` (lazy-loaded).
 * Changes: ui-kit Table instead of Chakra, no html2canvas image conversion, row limit.
 */
import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/table';
import { cn } from '../lib/utils';

export interface SheetPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

/** Parses the first sheet: drops empty rows, pads rows to the widest one. */
export async function parseFirstSheet(buffer: ArrayBuffer, maxRows = 100): Promise<SheetPreview> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const nonEmpty = raw.filter((row) => row.some((cell) => cell !== ''));
  if (nonEmpty.length === 0) return { headers: [], rows: [], totalRows: 0 };

  const width = Math.max(...nonEmpty.map((row) => row.length));
  const padded = nonEmpty.map((row) => Array.from({ length: width }, (_, i) => String(row[i] ?? '')));
  return { headers: padded[0], rows: padded.slice(1, maxRows + 1), totalRows: padded.length - 1 };
}

export interface XlsxPreviewProps {
  /** File URL (fetched with credentials) or an already-loaded ArrayBuffer. */
  source: string | ArrayBuffer;
  maxRows?: number;
  className?: string;
}

export function XlsxPreview({ source, maxRows = 100, className }: XlsxPreviewProps) {
  const [preview, setPreview] = React.useState<SheetPreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const buffer = typeof source === 'string' ? await (await fetch(source, { credentials: 'include' })).arrayBuffer() : source;
        const result = await parseFirstSheet(buffer, maxRows);
        if (!cancelled) setPreview(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to read file');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [source, maxRows]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!preview) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className={cn('overflow-auto rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {preview.headers.map((h, i) => (
              <TableHead key={i}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.rows.map((row, r) => (
            <TableRow key={r}>
              {row.map((cell, c) => (
                <TableCell key={c}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {preview.totalRows > preview.rows.length && (
        <p className="p-2 text-xs text-muted-foreground">
          Showing {preview.rows.length} of {preview.totalRows} rows
        </p>
      )}
    </div>
  );
}
