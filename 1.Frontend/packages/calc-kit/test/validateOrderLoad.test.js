import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOrderLoad, skuTotals, moqOf } from '../src/index.js';

const catalog = { 1: { moq: 1920, moq20: 960 }, 2: { moq: 0, moq20: 0 } };
const card = (...f) => ({ flavours: f.map(([sku, qty]) => ({ sku, qty })) });

test('a container without Flavour I (or with qty 0) is an empty container', () => {
  const r = validateOrderLoad({ containerSize: '4', cards: [card([1, 2000]), card(['', 0]), card([2, 0])], catalog });
  assert.deepEqual(r.filter((m) => m.code === 'container_empty').map((m) => m.card), [1, 2]);
});

test('MOQ is summed per SKU over all containers (not per container)', () => {
  const cards = [card([1, 1000]), card([1, 1000])];
  assert.deepEqual(validateOrderLoad({ containerSize: '4', cards, catalog }), []); // 2000 >= 1920
  const low = validateOrderLoad({ containerSize: '4', cards: [card([1, 1000]), card([1, 900])], catalog });
  assert.equal(low[0].code, 'below_moq');
  assert.equal(low[0].used, 1900);
  assert.equal(low[0].limit, 1920);
});

test('20 FT uses moq20; SKUs without MOQ never fail', () => {
  assert.deepEqual(validateOrderLoad({ containerSize: '1', cards: [card([1, 960])], catalog }), []);
  assert.equal(validateOrderLoad({ containerSize: '1', cards: [card([1, 959])], catalog })[0].code, 'below_moq');
  assert.equal(moqOf(catalog[2], '4'), 0);
});

test('bulk repeats the card for every container', () => {
  assert.deepEqual(skuTotals({ cards: [card([1, 700])], bulk: true, count: 3 }), { 1: 2100 });
  assert.deepEqual(validateOrderLoad({ containerSize: '4', bulk: true, count: 3, cards: [card([1, 700])], catalog }), []);
  assert.equal(validateOrderLoad({ containerSize: '4', bulk: true, count: 2, cards: [card([1, 700])], catalog })[0].code, 'below_moq');
});

test('only the listed SKUs are checked for MOQ (legacy data does not block unrelated edits)', () => {
  const cards = [card([1, 100], [2, 50])];
  assert.equal(validateOrderLoad({ containerSize: '4', cards, catalog })[0].sku, '1');
  assert.deepEqual(validateOrderLoad({ containerSize: '4', cards, catalog, onlySkus: ['2'] }), []);
});

test('empty container is still reported when only some SKUs are checked', () => {
  const r = validateOrderLoad({ containerSize: '4', cards: [card(['', 0])], catalog, onlySkus: [] });
  assert.equal(r[0].code, 'container_empty');
});
