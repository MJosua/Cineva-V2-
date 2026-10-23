/**
 * export.ts — Excel export helpers (based on HOTS/src/lib/excelUtils.ts).
 * `xlsx` is lazy-loaded so apps that never export don't pay for it.
 */

/** Writes rows to an .xlsx file. `fileName` may include or omit the extension. */
export async function exportRowsToXlsx(rows: Record<string, unknown>[], fileName: string, sheetName = 'Sheet1'): Promise<void> {
  if (!rows || rows.length === 0) {
    console.warn('[table-engine] No data provided for Excel export');
    return;
  }
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

/** Same behavior as HOTS `exportToExcel`: appends `_YYYY-MM-DD` to the file name. */
export function exportToExcel(rows: Record<string, unknown>[], fileName: string, sheetName = 'Sheet1'): Promise<void> {
  return exportRowsToXlsx(rows, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`, sheetName);
}
