// PAR EXCOM rule: required when total USD > 2000 (decision 2026-10-06) — run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateApprovalThreshold, convertToUsd, PAR_EXCOM_RULE } from '../src/index.js';

const run = (amount, currency = 'USD', rates = {}) => evaluateApprovalThreshold({ amount, currency, rates });

test('boundaries: 1999.99 no · 2000.00 no · 2000.01 yes', () => {
  assert.equal(run(1999.99).required, false);
  assert.equal(run(2000).required, false);
  assert.equal(run('2000.00').required, false);
  assert.equal(run(2000.01).required, true);
});

test('non-USD amounts are converted with units-per-USD rates, rate is reported', () => {
  const idr = run(32_500_000, 'IDR', { IDR: 16250 }); // = 2000.00 USD
  assert.equal(idr.required, false);
  assert.equal(idr.rateUsed, 16250);
  assert.equal(run(32_500_163, 'idr', { IDR: 16250 }).required, true); // ≈ 2000.01 USD
});

test('missing / invalid rate and formatted amounts are errors, never guessed', () => {
  assert.throws(() => run(100, 'EUR'), /No USD rate for EUR/);
  assert.throws(() => run(100, 'IDR', { IDR: 0 }), /Invalid USD rate/);
  assert.throws(() => run('2,500.00'), /plain number/);
  assert.throws(() => run(100, ''), /currency is required/);
});

test('rule is configuration: another threshold / operator / role works without code changes', () => {
  const cfo = evaluateApprovalThreshold({ amount: 10000, currency: 'USD', rule: { id: 'PAR_CFO_X', thresholdUsd: 10000, operator: '>=', role: 'CFO' } });
  assert.equal(cfo.required, true);
  assert.equal(cfo.role, 'CFO');
  assert.throws(() => evaluateApprovalThreshold({ amount: 1, currency: 'USD', rule: { ...PAR_EXCOM_RULE, operator: '=>' } }), /Unsupported operator/);
});

test('reason text is human readable', () => {
  assert.equal(run(2500).reason, 'Total USD 2,500.00 > 2,000 → EXCOM required');
  assert.equal(convertToUsd(5, 'USD').amountUsd, 5);
});
