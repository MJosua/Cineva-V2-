/**
 * @hots/import-kit — file recognition ("tanda pengenal")
 * Head: src/index.js
 * Design: 3.Knowledge/domains/shared-platform/13_distributor_profiles_and_integration.md §3
 *
 * fingerprint: {
 *   file_name: ["*By WH*.xlsx"],                 glob(s), case-insensitive
 *   sheets_all: ["STT 2026", "OS 2026"],         all must exist
 *   sheets_any: ["Dashboard HCM"],               at least one
 *   header_tokens: [{ sheet: "DB", rows: "1:3", contains: ["Customer Code", "#PO"] }],
 *   min_score: 0.8
 * }
 */

const norm = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

function globToRegex(glob) {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${esc}$`, 'i');
}

/**
 * @param file  { name: string, sheets: { [sheetName]: any[][] } }
 * @returns { score 0..1, checks: [{ check, ok }] }
 */
export function scoreFingerprint(file, fp = {}) {
  const checks = [];
  const sheetNames = Object.keys(file.sheets || {});
  if (fp.file_name?.length) checks.push({ check: 'file_name', ok: fp.file_name.some((g) => globToRegex(g).test(file.name || '')) });
  if (fp.sheets_all?.length) checks.push({ check: 'sheets_all', ok: fp.sheets_all.every((s) => sheetNames.includes(s)) });
  if (fp.sheets_any?.length) checks.push({ check: 'sheets_any', ok: fp.sheets_any.some((s) => sheetNames.includes(s)) });
  for (const ht of fp.header_tokens || []) {
    const rows = file.sheets?.[ht.sheet] || [];
    const [from, to] = String(ht.rows || '1:10').split(':').map(Number);
    const cells = rows.slice(from - 1, to).flat().map(norm);
    checks.push({ check: `header_tokens:${ht.sheet}`, ok: (ht.contains || []).every((t) => cells.some((c) => c.includes(norm(t)))) });
  }
  const score = checks.length ? checks.filter((c) => c.ok).length / checks.length : 0;
  return { score, checks };
}

/**
 * Picks the best template for a file.
 * @returns { status: 'MATCHED'|'AMBIGUOUS'|'UNKNOWN', best, candidates: [{ template_code, score }] }
 */
export function recognize(file, templates = []) {
  const candidates = templates
    .map((t) => ({ template_code: t.template_code, score: scoreFingerprint(file, t.fingerprint).score, min: t.fingerprint?.min_score ?? 0.8 }))
    .sort((a, b) => b.score - a.score);
  const passing = candidates.filter((c) => c.score >= c.min);
  if (passing.length === 1 || (passing.length > 1 && passing[0].score > passing[1].score)) {
    return { status: 'MATCHED', best: passing[0].template_code, candidates: candidates.slice(0, 3) };
  }
  if (passing.length > 1) return { status: 'AMBIGUOUS', best: null, candidates: passing.slice(0, 3) };
  return { status: 'UNKNOWN', best: null, candidates: candidates.slice(0, 3) };
}
