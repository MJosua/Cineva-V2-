/**
 * @hots/import-kit — value transforms (pure, composable, named in templates)
 * Head: src/index.js
 * Template syntax: "transform": ["trim", "number", "null_if_before:1901-01-01", "pcs_from_ctn:40"]
 * Lessons built in: Excel blank dates appear as 1899-12-29 / 1900-01-xx (IndoVietnam workbooks),
 * numbers may arrive as text with thousand separators.
 */

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

/** Excel serial / Date / ISO string → "YYYY-MM-DD" (UTC) or null. */
export function toIsoDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // xlsx (cellDates) Date objects are local midnight, but SheetJS lands a few seconds early in some time zones
    // (Asia/Jakarta: 23:59:48 of the previous day, historical LMT offset). Snap values within 2 minutes before
    // midnight to the next day, then take the local calendar date. Fixed 2026-10-06: dates were one day early.
    const t = value.getHours() === 23 && value.getMinutes() >= 58 ? new Date(value.getTime() + 2 * 60 * 1000) : value;
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(EXCEL_EPOCH_MS + Math.round(value) * 86400000).toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  return null;
}

/** Number from number / "1,234.5" / " 12 " ; null for blanks; NaN-safe. */
export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const s = String(value).replace(/[\s,]/g, '');
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const BUILT_INS = {
  trim: (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v),
  upper: (v) => (typeof v === 'string' ? v.toUpperCase() : v),
  lower: (v) => (typeof v === 'string' ? v.toLowerCase() : v),
  string: (v) => (v === null || v === undefined ? null : String(v).trim()),
  number: (v) => toNumber(v),
  int: (v) => {
    const n = toNumber(v);
    return n === null ? null : Math.trunc(n);
  },
  excel_date: (v) => toIsoDate(v),
  /** null_if_before:1901-01-01 — Excel's empty-date artefacts */
  null_if_before: (v, arg) => (v && String(v) < arg ? null : v),
  null_if: (v, arg) => (String(v ?? '') === arg ? null : v),
  default: (v, arg) => (v === null || v === undefined || v === '' ? arg : v),
  /** pcs_from_ctn:40 — cartons → pieces */
  pcs_from_ctn: (v, arg) => {
    const n = toNumber(v);
    return n === null ? null : n * Number(arg);
  },
  /** ctn_from_pcs:40 — pieces → cartons (kept fractional) */
  ctn_from_pcs: (v, arg) => {
    const n = toNumber(v);
    return n === null ? null : n / Number(arg);
  },
  round: (v, arg) => {
    const n = toNumber(v);
    if (n === null) return null;
    const f = 10 ** Number(arg || 0);
    return Math.round(n * f) / f;
  },
  /** regex_extract:^(\d+)-([A-Z]+)-(\d{4})$:2 — capture group (default 1) */
  regex_extract: (v, arg) => {
    if (v === null || v === undefined) return null;
    const lastColon = arg.lastIndexOf(':');
    const hasGroup = lastColon > 0 && /^\d+$/.test(arg.slice(lastColon + 1));
    const pattern = hasGroup ? arg.slice(0, lastColon) : arg;
    const group = hasGroup ? Number(arg.slice(lastColon + 1)) : 1;
    const m = String(v).match(new RegExp(pattern));
    return m ? m[group] ?? null : null;
  },
};

/** "name:arg" → [name, arg] (arg may contain ':' for regex) */
function splitStep(step) {
  const i = step.indexOf(':');
  return i < 0 ? [step, undefined] : [step.slice(0, i), step.slice(i + 1)];
}

/**
 * Applies a transform chain. Unknown names throw (templates are validated before use).
 * @param value  raw cell value
 * @param steps  string[] e.g. ["trim", "number"]
 * @param extra  optional custom transforms { name: (v, arg) => v }
 */
export function applyTransforms(value, steps = [], extra = {}) {
  let v = value;
  for (const step of steps) {
    const [name, arg] = splitStep(step);
    const fn = extra[name] || BUILT_INS[name];
    if (!fn) throw new Error(`Unknown transform "${name}"`);
    v = fn(v, arg);
  }
  return v;
}

export const TRANSFORM_NAMES = Object.freeze(Object.keys(BUILT_INS));
