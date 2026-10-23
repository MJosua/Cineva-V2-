export interface ExcelField { label: string; cell: string; value: string | number | boolean | null; formula: string | null; numberFormat: string; cellType: string }
export interface ExcelAccount { id: string; name: string; sourceFile: string; sheet: string; sourceRow: number; sha256: string; sections: { title: string; fields: ExcelField[]; note?: string }[] }
export interface LiveExcel { accounts: ExcelAccount[]; readAt: string; mode: string }
export async function readLiveExcel(signal: AbortSignal): Promise<LiveExcel> {
  const response = await fetch('/hots/reference-excel/accounts', { signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error('Pembaca Excel lokal tidak tersedia. Jalankan bridge Excel lalu muat ulang.');
  const result: LiveExcel = await response.json();
  if (!Array.isArray(result.accounts) || !result.accounts.length) throw new Error('Data Excel kosong atau format tidak sesuai.');
  return result;
}
