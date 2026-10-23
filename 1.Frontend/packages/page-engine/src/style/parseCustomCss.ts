/**
 * Based on Event/src/utils/cssParser.js (2026-10-06), made safe for CMS-stored input.
 *
 * Accepts:
 *  1. Strict JSON:            {"background": "red"}
 *  2. CSS declarations:       background: red; padding: 10px;   (`;` inside parentheses is kept)
 *
 * Removed on purpose: the original "relaxed JS object" step used `new Function()` on stored
 * data (code execution / XSS). Values that can execute or load script are dropped.
 */

export type StyleObject = Record<string, string | number>;

const DANGEROUS_VALUE = /(javascript:|expression\s*\(|url\s*\(\s*['"]?\s*(javascript|data:text\/html))/i;
const VALID_KEY = /^-?[a-zA-Z][a-zA-Z0-9-]*$/;

function toCamel(key: string): string {
  return key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function sanitize(input: Record<string, unknown>): StyleObject {
  const out: StyleObject = {};
  for (const [rawKey, rawValue] of Object.entries(input)) {
    if (!VALID_KEY.test(rawKey)) continue;
    if (typeof rawValue !== 'string' && typeof rawValue !== 'number') continue;
    if (typeof rawValue === 'string' && DANGEROUS_VALUE.test(rawValue)) continue;
    out[toCamel(rawKey)] = rawValue;
  }
  return out;
}

function parseDeclarations(text: string): StyleObject {
  const styles: Record<string, string> = {};
  for (const decl of text.split(/;(?![^(]*\))/g)) {
    const index = decl.indexOf(':');
    if (index <= 0) continue;
    const key = decl.slice(0, index).trim();
    const value = decl.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && value) styles[key] = value;
  }
  return sanitize(styles);
}

export function parseCustomCss(customCss: unknown): StyleObject {
  if (!customCss) return {};
  if (typeof customCss === 'object') return sanitize(customCss as Record<string, unknown>);
  if (typeof customCss !== 'string') return {};

  const trimmed = customCss.trim().replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  if (!trimmed) return {};

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return sanitize(parsed as Record<string, unknown>);
  } catch {
    /* not JSON — fall through */
  }

  // Tolerate a wrapping `{ ... }` around plain declarations.
  return parseDeclarations(trimmed.replace(/^\{|\}$/g, ''));
}
