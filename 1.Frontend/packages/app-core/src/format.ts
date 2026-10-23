/**
 * format.ts — shared display formatters.
 * API dates are ISO 8601 UTC; display in the user's zone (default Asia/Jakarta).
 * Money is always { amount, currency }.
 */

export const DEFAULT_LOCALE = 'id-ID';
export const DEFAULT_TIME_ZONE = 'Asia/Jakarta';

export interface Money {
  amount: number | string;
  currency: string;
}

export function formatMoney(value: Money, locale = DEFAULT_LOCALE): string {
  const amount = typeof value.amount === 'string' ? Number(value.amount) : value.amount;
  if (!Number.isFinite(amount)) return '-';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: value.currency }).format(amount);
}

export function formatNumber(value: number | string | null | undefined, locale = DEFAULT_LOCALE, digits = 0): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n === null || n === undefined || !Number.isFinite(n)) return '-';
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function formatDate(
  value: string | number | Date | null | undefined,
  opts: { locale?: string; timeZone?: string; withTime?: boolean } = {},
): string {
  if (value === null || value === undefined || value === '') return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const { locale = DEFAULT_LOCALE, timeZone = DEFAULT_TIME_ZONE, withTime = false } = opts;
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(d);
}

/** Date → ISO 8601 UTC string for the API. */
export function toApiDate(value: Date): string {
  return value.toISOString();
}

/**
 * CBM for display: floors to 1 decimal so the UI never shows more than is loaded.
 * Same rule as E-Order `formatCBMForDisplay` (utils/cbmCalculator.js, 2026-10-06).
 */
export function floorCbm(value: number | string | null | undefined, decimals = 1): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n === null || n === undefined || !Number.isFinite(n)) return 0;
  const factor = 10 ** decimals;
  return Math.floor(n * factor) / factor;
}

/** "12.3 CBM" with locale separators. */
export function formatCbm(value: number | string | null | undefined, locale = DEFAULT_LOCALE, decimals = 1): string {
  return `${formatNumber(floorCbm(value, decimals), locale, decimals)} CBM`;
}
