/**
 * @hots/calc-kit — approval threshold rule (e.g. PAR EXCOM: required when total USD > 2000)
 * Head: src/index.js
 * Decision 2026-10-06 (3.Knowledge/domains/data-database/dw_design_par_stt.md D1): strictly greater than
 * 2000 USD → EXCOM required; exactly 2000.00 → not required.
 * Replaces the literal `> 2000` in Integrated-API par-document service (not modified) with a config-driven,
 * shared rule usable by UI, backend, Document Engine and warehouse.
 *
 * Rates convention (same as warehouse dim_currency_rate / i2i mst_curr_rate): `rates[CUR]` = units of CUR per 1 USD
 * (e.g. { IDR: 16250 }). USD needs no rate.
 */

export const PAR_EXCOM_RULE = Object.freeze({ id: 'PAR_EXCOM', thresholdUsd: 2000, operator: '>', role: 'EXCOM' });

const OPERATORS = {
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
};

function toNumber(value, label) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value.trim());
  throw new Error(`${label} must be a plain number (no thousand separators): ${JSON.stringify(value)}`);
}

/**
 * Converts an amount to USD.
 * @returns {{ amountUsd: number, rateUsed: number }}
 */
export function convertToUsd(amount, currency, rates = {}) {
  const value = toNumber(amount, 'amount');
  const cur = String(currency || '').trim().toUpperCase();
  if (!cur) throw new Error('currency is required');
  if (cur === 'USD') return { amountUsd: value, rateUsed: 1 };
  const rate = rates[cur];
  if (rate === undefined || rate === null) throw new Error(`No USD rate for ${cur}; refusing to guess (no default rate)`);
  const r = toNumber(rate, `rate ${cur}`);
  if (r <= 0) throw new Error(`Invalid USD rate for ${cur}: ${r}`);
  return { amountUsd: value / r, rateUsed: r };
}

/**
 * @param {{ amount: number|string, currency: string, rates?: Record<string, number>, rule?: { id, thresholdUsd, operator, role } }} input
 * @returns {{ ruleId, role, required: boolean, amountUsd: number, threshold: number, operator: string, rateUsed: number, reason: string }}
 */
export function evaluateApprovalThreshold({ amount, currency, rates = {}, rule = PAR_EXCOM_RULE }) {
  const compare = OPERATORS[rule.operator];
  if (!compare) throw new Error(`Unsupported operator ${rule.operator}; use '>' or '>='`);
  const threshold = toNumber(rule.thresholdUsd, 'thresholdUsd');
  const { amountUsd, rateUsed } = convertToUsd(amount, currency, rates);
  // Compare at full precision; round only for the human-readable reason.
  const required = compare(amountUsd, threshold);
  const shown = amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    ruleId: rule.id,
    role: rule.role,
    required,
    amountUsd,
    threshold,
    operator: rule.operator,
    rateUsed,
    reason: `Total USD ${shown} ${required ? '' : 'not '}${rule.operator} ${threshold.toLocaleString('en-US')} → ${rule.role} ${required ? 'required' : 'not required'}`,
  };
}
