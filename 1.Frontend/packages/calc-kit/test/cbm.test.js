// Ported from 3.Knowledge/test_eorder_same_load_cbm_rule.mjs (+ extra cases), run: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCBM, resolveSkuType, resolveMaxQty, resolveMixedContainerLimit, hasSpecificCBMRule,
  calculateFlavourCBM, calculateContainerCBM, formatCBMForDisplay, defaultContainerRules,
} from '../src/index.js';

const resolve = (flavours, extra = {}) => resolveCBM({ flavours, companyId: 1, rules: defaultContainerRules, specialConditions: [], ...extra });

test('same-load bypass (original E-Order test)', () => {
  assert.equal(resolve([{ cont40hc: 7440 }, { cont40hc: 7440 }]), 100);
  assert.equal(resolve([{ cont40hc: '7440' }, { cont40hc: 7440 }]), 100);
  assert.equal(resolve([{ cont40hc: 7440 }, { cont40hc: 7440 }, { cont40hc: 4650 }]), 66);
});

test('special condition 23 mixing-load limit wins', () => {
  const sc = [{ id: 23, value: JSON.stringify({ loadA: 4545, loadB: 4708, limit: 63.31461 }) }];
  assert.equal(resolve([{ cont40hc: 4545 }, { cont40hc: 4708 }], { specialConditions: sc }), 63.31461);
});

test('rules are a parameter (any program can pass its own)', () => {
  const rules = { default: { cbm: 58 }, companies: {} };
  assert.equal(resolveCBM({ flavours: [{ cont40hc: 1 }, { cont40hc: 2 }], companyId: 9, rules }), 58);
});

test('sku type, qty cap, mixed pair (company 116 / 195 defaults)', () => {
  assert.equal(resolveSkuType({ cont40hc: 4200 }), 'soup');
  assert.equal(resolveSkuType({ cont40hc: 3800 }), 'dry');
  assert.equal(resolveMaxQty({ flavours: [{ cont40hc: 3800 }, { cont40hc: 4200 }], companyId: 116, rules: defaultContainerRules }), 3800);
  const mixed = resolveMixedContainerLimit({ flavours: [{ cont40hc: 4182 }, { cont40hc: 3840 }], companyId: 195, rules: defaultContainerRules });
  assert.equal(mixed.maxTotal, 3920);
  assert.equal(hasSpecificCBMRule({ flavours: [{}, {}], companyId: 1, rules: defaultContainerRules, specialConditions: [{ id: '25' }] }), true);
});

test('cbm volume math (+1 cm carton tolerance, floor for display)', () => {
  const details = { ctn_height: 299, ctn_length: 399, ctn_width: 499 }; // → 300*400*500 = 0.06 m3
  assert.equal(calculateFlavourCBM({ qty: 10, sku: 'A' }, details), 0.6);
  assert.equal(calculateFlavourCBM({ qty: 10, sku: '-1' }, details), 0);
  assert.equal(calculateContainerCBM({ Flavour: [{ sku: 'A', qty: 1000 }, { sku: 'B', qty: 5 }] }, { A: details, B: details }), 60.3);
  assert.equal(formatCBMForDisplay(65.99), 65.9);
});
