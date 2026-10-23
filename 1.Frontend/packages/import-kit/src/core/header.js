/**
 * @hots/import-kit — header row detection
 * Head: src/index.js
 * Template: "header": { "row": 3 }  (1-based, fixed)  or  { "detect": { "contains": ["SKU Name", "#PO"], "maxScan": 15 } }
 */

const norm = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * @returns {{ index: number, row: any[] }}  0-based index of the header row
 */
export function findHeaderRow(rows, header = {}) {
  if (Number.isInteger(header.row)) {
    const index = header.row - 1;
    if (!rows[index]) throw new Error(`Header row ${header.row} does not exist`);
    return { index, row: rows[index] };
  }
  const detect = header.detect || {};
  const tokens = (detect.contains || []).map(norm);
  const maxScan = Math.min(detect.maxScan || 20, rows.length);
  let best = { index: -1, score: -1 };
  for (let i = 0; i < maxScan; i += 1) {
    const cells = (rows[i] || []).map(norm);
    const tokenHits = tokens.filter((t) => cells.some((c) => c === t || c.includes(t))).length;
    const textCells = cells.filter((c) => c && Number.isNaN(Number(c))).length;
    const score = tokens.length ? tokenHits * 1000 + textCells : textCells;
    if (score > best.score) best = { index: i, score };
  }
  if (best.index < 0 || (tokens.length && best.score < tokens.length * 1000)) {
    throw new Error(`Header row not found (looking for: ${tokens.join(', ') || 'text cells'})`);
  }
  return { index: best.index, row: rows[best.index] };
}
