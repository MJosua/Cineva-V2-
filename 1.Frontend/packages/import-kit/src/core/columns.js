/**
 * @hots/import-kit — column helpers (Excel letters ↔ 0-based index, ranges)
 * Head: src/index.js
 */

/** "A" → 0, "Z" → 25, "AA" → 26, "BB" → 53 */
export function colIndex(letters) {
  const s = String(letters).trim().toUpperCase();
  if (!/^[A-Z]{1,3}$/.test(s)) throw new Error(`Invalid column letters: ${letters}`);
  let n = 0;
  for (const ch of s) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** 0 → "A", 53 → "BB" */
export function colLetters(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** "C:BB" → [2, 3, …, 53] */
export function colRange(range) {
  const [from, to] = String(range).split(':');
  const a = colIndex(from);
  const b = colIndex(to ?? from);
  if (b < a) throw new Error(`Invalid column range: ${range}`);
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

/**
 * Resolves a column reference: a header name ("SKU Name", "PO"), letters ("B"), "col:B" (letters only),
 * or a 0-based number. Header names win over letters, so a header literally called "PO" is not column PO.
 */
export function resolveColumn(ref, headerRow = []) {
  if (typeof ref === 'number') return ref;
  const s = String(ref).trim();
  if (/^col:[A-Z]{1,3}$/i.test(s)) return colIndex(s.slice(4));
  const norm = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const idx = headerRow.findIndex((h) => norm(h) === norm(s));
  if (idx >= 0) return idx;
  if (/^[A-Z]{1,3}$/.test(s)) return colIndex(s);
  return -1; // caller reports it
}
