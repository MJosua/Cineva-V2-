import test from 'node:test';
import assert from 'node:assert/strict';
import { selectFlavour, setFlavourQty, removeFlavour, flavourEditability, capacityOf, emptyFlavour, defaultContainerRules } from '../src/index.js';

// carton 399 mm cube = 0.064 CBM; 158 mm = 0.00402; 258 mm = 0.01717; 245 mm = 0.01489
const cube = (n, code, cont40hc) => ({ product_code: code, ctn_height: n, ctn_length: n, ctn_width: n, cont20: Math.floor(cont40hc / 2), cont40: cont40hc, cont40hc });
const catalog = {
  1: cube(399, 1, 1000), 2: cube(399, 2, 1100), 3: cube(158, 3, 3000),
  4: cube(399, 4, 1000), // same load as 1
  5: cube(258, 5, 3840), 6: cube(245, 6, 4182),
};
const ctx = (over = {}) => ({ containerSize: '4', catalog, companyId: 118, rules: defaultContainerRules, specialConditions: [], ...over });
const blank = (n = 2) => Array.from({ length: n }, emptyFlavour);
const qtys = (fl) => fl.map((f) => f.qty);

test('flavour I is the full container capacity; with nothing after it the qty is locked', () => {
  const fl = selectFlavour(blank(), 0, 1, ctx());
  assert.equal(fl[0].qty, 1000);
  assert.equal(capacityOf(catalog[1], '4'), 1000);
  assert.deepEqual(flavourEditability(fl), [false, false]);
});

test('choosing flavour II: I stays full, II starts at 0; I opens, II is computed (two rows)', () => {
  let fl = selectFlavour(blank(), 0, 1, ctx());
  fl = selectFlavour(fl, 1, 2, ctx());
  assert.deepEqual(qtys(fl), [1000, 0]);
  assert.deepEqual(flavourEditability(fl), [true, false]);
});

test('editing I computes II from the remaining CBM, rounded down to 10', () => {
  let fl = selectFlavour(selectFlavour(blank(), 0, 1, ctx()), 1, 2, ctx());
  fl = setFlavourQty(fl, 0, 400, ctx());
  // 400 x 0.064 = 25.6 CBM; (66 - 25.6) / 0.064 = 631.25 -> 631 -> 630
  assert.deepEqual(qtys(fl), [400, 630]);
});

test('three rows: I and II open, III always computed from what is left', () => {
  let fl = selectFlavour(selectFlavour(selectFlavour(blank(3), 0, 1, ctx()), 1, 2, ctx()), 2, 3, ctx());
  assert.deepEqual(qtys(fl), [1000, 0, 0]); // choosing III resets I to full and the others to 0
  fl = setFlavourQty(fl, 0, 400, ctx());
  assert.deepEqual(qtys(fl), [400, 630, 10]); // 25.6 + 40.32 = 65.92; 0.08 left / 0.00402 = 19 -> 10
  assert.deepEqual(flavourEditability(fl), [true, true, false]);
});

test('editing II is clamped to the remaining CBM and recomputes III', () => {
  let fl = selectFlavour(selectFlavour(selectFlavour(blank(3), 0, 1, ctx()), 1, 2, ctx()), 2, 3, ctx());
  fl = setFlavourQty(fl, 0, 400, ctx());
  fl = setFlavourQty(fl, 1, 9999, ctx());
  assert.equal(fl[1].qty, 630);
  fl = setFlavourQty(fl, 1, 300, ctx());
  // 25.6 + 19.2 = 44.8; 21.2 left / 0.00402 = 5273 -> 5270
  assert.deepEqual(qtys(fl), [400, 300, 5270]);
});

test('Custom Mode opens every value (flavour III too) and stores what was typed', () => {
  const fl = [{ sku: '1', qty: 1000 }, { sku: '2', qty: 0 }, { sku: '3', qty: 0 }];
  assert.deepEqual(flavourEditability(fl, { custom: true }), [true, true, true]);
  const out = setFlavourQty(fl, 2, 99999, ctx(), { custom: true });
  assert.deepEqual(qtys(out), [1000, 0, 99999]);
  assert.deepEqual(flavourEditability([{ sku: '1', qty: 1 }, emptyFlavour(), emptyFlavour()], { custom: true }), [true, false, false]);
});

test('same-load flavours (CBM limit 100): II = capacity - I', () => {
  let fl = selectFlavour(selectFlavour(blank(), 0, 1, ctx()), 1, 4, ctx());
  fl = setFlavourQty(fl, 0, 300, ctx());
  assert.deepEqual(qtys(fl), [300, 700]);
  fl = setFlavourQty(fl, 1, 900, ctx()); // clamp to 1000 - 300
  assert.equal(fl[1].qty, 700);
});

test('company 195 mixed 40HC pair 3840 + 4182: total capped at 3920', () => {
  const c = ctx({ companyId: 195 });
  let fl = selectFlavour(selectFlavour(blank(), 0, 5, c), 1, 6, c);
  assert.deepEqual(qtys(fl), [3840, 0]);
  fl = setFlavourQty(fl, 0, 3000, c);
  assert.deepEqual(qtys(fl), [3000, 920]);
});

test('company 116 dry + soup: total capped at 3800, also for the computed flavour II', () => {
  const c = ctx({ companyId: 116 });
  let fl = selectFlavour(selectFlavour(blank(), 0, 5, c), 1, 6, c);
  fl = setFlavourQty(fl, 0, 2000, c);
  assert.equal(fl[0].qty + fl[1].qty <= 3800, true);
  assert.equal(fl[1].qty, 1800);
  assert.equal(setFlavourQty(fl, 0, 5000, c)[0].qty, 3800); // I itself is capped
});

test('condition 25 ratio mix: II follows the ratio of I to its capacity', () => {
  const c = ctx({ companyId: 116, specialConditions: [{ id: '25', value: '' }] });
  let fl = selectFlavour(selectFlavour(blank(), 0, 5, c), 1, 6, c);
  fl = setFlavourQty(fl, 0, 1920, c); // half of 3840 -> half of 4182
  assert.deepEqual(qtys(fl), [1920, 2091]);
});

test('red close button (flavour III+): I back to full, II to 0, row removed', () => {
  let fl = selectFlavour(selectFlavour(selectFlavour(blank(3), 0, 1, ctx()), 1, 2, ctx()), 2, 3, ctx());
  fl = setFlavourQty(fl, 0, 400, ctx());
  const out = removeFlavour(fl, 2, ctx());
  assert.equal(out.length, 2);
  assert.deepEqual(qtys(out), [1000, 0]);
});

test('clearing flavour II (empty choice) restores I to full; clearing I empties all', () => {
  let fl = selectFlavour(selectFlavour(blank(), 0, 1, ctx()), 1, 2, ctx());
  fl = setFlavourQty(fl, 0, 400, ctx());
  const clearedII = selectFlavour(fl, 1, '', ctx());
  assert.deepEqual(clearedII.map((f) => f.sku), ['1', '']);
  assert.equal(clearedII[0].qty, 1000);
  const clearedI = selectFlavour(fl, 0, '', ctx());
  assert.deepEqual(clearedI.map((f) => f.sku), ['', '']);
});
