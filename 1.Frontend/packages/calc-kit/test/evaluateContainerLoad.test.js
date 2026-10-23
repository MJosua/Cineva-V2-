import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateContainerLoad, palletPlan, remainderPallets, palletQty, defaultContainerRules } from '../src/index.js';

// carton 399 mm cube -> 400^3 / 1e9 = 0.064 CBM; 66 CBM fits 1031 cartons
const big = { product_code: 1, ctn_height: 399, ctn_length: 399, ctn_width: 399, cont20: 500, cont40: 1000, cont40hc: 1100 };
// small cartons (0.008 CBM) with the loads used by the company rules
const dry = { product_code: 2, ctn_height: 199, ctn_length: 199, ctn_width: 199, cont20: 1500, cont40: 3000, cont40hc: 3840 };
const soup = { product_code: 3, ctn_height: 199, ctn_length: 199, ctn_width: 199, cont20: 1500, cont40: 3000, cont40hc: 4182 };
const catalog = { 1: big, 2: dry, 3: soup };
const base = { containerSize: '4', catalog, companyId: 118, rules: defaultContainerRules };

// a second carton type with a different container load, so the CBM limit is the check (mixed load)
const big2 = { product_code: 4, ctn_height: 399, ctn_length: 399, ctn_width: 399, cont20: 400, cont40: 900, cont40hc: 1000 };
const cbmCatalog = { ...catalog, 4: big2 };

test('one flavour: the container load is the limit, CBM is not checked', () => {
  const full = evaluateContainerLoad({ ...base, flavours: [{ sku: 1, qty: 1100 }] });   // 1100 x 0.064 = 70 CBM > 66, but it is a full container
  assert.equal(full.ok, true);
  assert.equal(full.basis, 'qty');
  assert.equal(full.cbm_limit, null);
  assert.equal(full.per_flavour[0].max_qty, 1100);
  const over = evaluateContainerLoad({ ...base, flavours: [{ sku: 1, qty: 1101 }] });
  assert.equal(over.ok, false);
  assert.deepEqual(over.messages.map((m) => [m.code, m.limit]), [['qty_cap_exceeded', 1100]]);
});

test('same container load in two flavours: A + B = container load, no CBM warning', () => {
  const twin = { ...big, product_code: 5 };
  const ok = evaluateContainerLoad({ ...base, catalog: { ...catalog, 5: twin }, flavours: [{ sku: 1, qty: 600 }, { sku: 5, qty: 500 }] });
  assert.equal(ok.ok, true);
  assert.equal(ok.per_flavour[0].max_qty, 600);
  const over = evaluateContainerLoad({ ...base, catalog: { ...catalog, 5: twin }, flavours: [{ sku: 1, qty: 600 }, { sku: 5, qty: 501 }] });
  assert.equal(over.ok, false);
  assert.equal(over.messages[0].code, 'qty_cap_exceeded');
});

test('different container loads: CBM limit applies (under it is ok)', () => {
  const r = evaluateContainerLoad({ ...base, catalog: cbmCatalog, flavours: [{ sku: 1, qty: 500 }, { sku: 4, qty: 500 }] });   // 64 CBM
  assert.equal(r.ok, true);
  assert.equal(r.basis, 'cbm');
  assert.equal(r.cbm_limit, 66);
  assert.ok(Math.abs(r.cbm_used - 64) < 1e-6);
});

test('different container loads over the CBM limit is an error with used and limit', () => {
  const r = evaluateContainerLoad({ ...base, catalog: cbmCatalog, flavours: [{ sku: 1, qty: 600 }, { sku: 4, qty: 500 }] });   // 70.4 CBM
  assert.equal(r.ok, false);
  const m = r.messages.find((x) => x.code === 'cbm_exceeded');
  assert.equal(m.limit, 66);
  assert.ok(m.used > 66);
});

test('Custom Mode releases the container-load rules but still reports CBM', () => {
  const r = evaluateContainerLoad({ ...base, custom: true, flavours: [{ sku: 1, qty: 1100 }] });
  assert.equal(r.ok, true);
  assert.equal(r.released, true);
  assert.equal(r.cbm_limit, null);
  assert.ok(r.cbm_used > 66);
});

test('missing capacity data is skipped with a warning, never blocks', () => {
  const noCap = { ...big, product_code: 9, cont40hc: 0 };
  const r = evaluateContainerLoad({ ...base, catalog: { ...catalog, 9: noCap }, flavours: [{ sku: 9, qty: 5000 }] });
  assert.equal(r.ok, true);
  assert.equal(r.skipped, true);
  assert.deepEqual(r.messages.map((m) => m.code), ['no_capacity_data']);
});

test('unknown SKU is an error', () => {
  const r = evaluateContainerLoad({ ...base, flavours: [{ sku: 77, qty: 10 }] });
  assert.equal(r.ok, false);
  assert.equal(r.messages[0].code, 'unknown_sku');
});

test('company 116 dry+soup quantity cap 3800', () => {
  const ok = evaluateContainerLoad({ ...base, companyId: 116, flavours: [{ sku: 2, qty: 1900 }, { sku: 3, qty: 1900 }] });
  assert.equal(ok.ok, true);
  const bad = evaluateContainerLoad({ ...base, companyId: 116, flavours: [{ sku: 2, qty: 1900 }, { sku: 3, qty: 1901 }] });
  assert.equal(bad.ok, false);
  assert.equal(bad.messages.find((m) => m.code === 'qty_cap_exceeded').limit, 3800);
});

test('company 195 mixed 40HC pair 3840 + 4182 caps the total at 3920', () => {
  const ok = evaluateContainerLoad({ ...base, companyId: 195, flavours: [{ sku: 2, qty: 1960 }, { sku: 3, qty: 1960 }] });
  assert.equal(ok.ok, true);
  const bad = evaluateContainerLoad({ ...base, companyId: 195, flavours: [{ sku: 2, qty: 1960 }, { sku: 3, qty: 1961 }] });
  assert.equal(bad.ok, false);
  assert.equal(bad.messages.find((m) => m.code === 'mixed_limit_exceeded').limit, 3920);
});

test('special condition 23 forces the CBM limit for the pair of loads', () => {
  const a = { ...big, product_code: 4, cont40hc: 4545 };
  const b = { ...big, product_code: 5, cont40hc: 4708 };
  const specialConditions = [{ id: '23', value: '{"loadA":4545,"loadB":4708,"limit":63.31461}' }];
  // 995 cartons x 0.064 = 63.68 CBM: above the rule's 63.31461 but below the default 66
  const flavours = [{ sku: 4, qty: 500 }, { sku: 5, qty: 495 }];
  const withRule = evaluateContainerLoad({ ...base, catalog: { 4: a, 5: b }, specialConditions, flavours });
  assert.equal(withRule.cbm_limit, 63.31461);
  assert.equal(withRule.ok, false);
  const withoutRule = evaluateContainerLoad({ ...base, catalog: { 4: a, 5: b }, flavours });
  assert.equal(withoutRule.cbm_limit, 66);
  assert.equal(withoutRule.ok, true);
});

test('same-load flavours bypass the CBM limit (E-Order same-load rule)', () => {
  const a = { ...big, product_code: 6, cont40hc: 4000 };
  const b = { ...big, product_code: 7, cont40hc: 4000 };
  const r = evaluateContainerLoad({ ...base, catalog: { 6: a, 7: b }, flavours: [{ sku: 6, qty: 1000 }, { sku: 7, qty: 1000 }] });
  assert.equal(r.ok, true);
  assert.equal(r.basis, 'qty');
});

test('palletPlan: total must be filled exactly, last flavour is the remainder', () => {
  assert.equal(palletPlan({ total: 20, pallets: [12, 8] }).ok, true);
  const missing = palletPlan({ total: 20, pallets: [12, 7] });
  assert.equal(missing.ok, false);
  assert.equal(missing.remaining, 1);
  assert.equal(missing.reason, 'pallets_missing');
  assert.equal(palletPlan({ total: 20, pallets: [12, 9] }).reason, 'pallets_exceeded');
  assert.equal(remainderPallets({ total: 20, pallets: [12, ''] }), 8);
  assert.equal(remainderPallets({ total: 20, pallets: [21, ''] }), null);
});

test('palletPlan: unknown total (20 FT) is skipped; qty = pallets x qty_per_pallet', () => {
  assert.equal(palletPlan({ total: null, pallets: [5] }).skipped, true);
  assert.equal(palletPlan({ total: 20, pallets: [1.5, 18.5] }).reason, 'invalid_pallet_count');
  assert.equal(palletQty(20, 144), 2880);
  assert.equal(palletQty(5, null), null);
});
