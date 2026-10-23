/**
 * @hots/import-kit — row rules (JSON DSL, no eval)
 * Head: src/index.js
 *
 * Rule:  { "when": { "field": "week", "op": ">", "value": "$cutoffWeek" }, "then": { "set": { "is_forecast": true } } }
 *        { "when": { "field": "qty_pcs", "op": "<", "value": 0 }, "then": { "warning": "NEGATIVE_QTY" } }
 *        { "when": { "field": "sku_name", "op": "in", "value": ["", "TOTAL"] }, "then": { "skip": true } }
 *        { "when": { "all": [ … ] } } / { "any": [ … ] }
 * Values starting with "$" are read from the run context (e.g. "$cutoffWeek").
 */

const OPS = {
  '=': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>': (a, b) => a !== null && a > b,
  '>=': (a, b) => a !== null && a >= b,
  '<': (a, b) => a !== null && a < b,
  '<=': (a, b) => a !== null && a <= b,
  in: (a, b) => Array.isArray(b) && b.includes(a ?? ''),
  not_in: (a, b) => Array.isArray(b) && !b.includes(a ?? ''),
  empty: (a) => a === null || a === undefined || a === '',
  not_empty: (a) => !(a === null || a === undefined || a === ''),
  matches: (a, b) => a !== null && a !== undefined && new RegExp(b).test(String(a)),
  is_number: (a) => typeof a === 'number' && Number.isFinite(a),
};

export const RULE_OPERATORS = Object.freeze(Object.keys(OPS));

function resolve(value, context) {
  if (typeof value === 'string' && value.startsWith('$')) return context[value.slice(1)];
  return value;
}

export function evaluateCondition(cond, data, context = {}) {
  if (!cond) return true;
  if (cond.all) return cond.all.every((c) => evaluateCondition(c, data, context));
  if (cond.any) return cond.any.some((c) => evaluateCondition(c, data, context));
  const fn = OPS[cond.op];
  if (!fn) throw new Error(`Unknown rule operator "${cond.op}"`);
  return fn(data[cond.field], resolve(cond.value, context));
}

/**
 * Applies rules in order to one mapped row.
 * @returns {{ data, skip: boolean, warnings: string[], errors: string[] }}
 */
export function applyRules(rules = [], data, context = {}) {
  const out = { data: { ...data }, skip: false, warnings: [], errors: [] };
  for (const rule of rules) {
    if (!evaluateCondition(rule.when, out.data, context)) continue;
    const t = rule.then || {};
    if (t.set) for (const [k, v] of Object.entries(t.set)) out.data[k] = resolve(v, context);
    if (t.warning) out.warnings.push(t.warning);
    if (t.error) out.errors.push(t.error);
    if (t.skip) out.skip = true;
  }
  return out;
}
