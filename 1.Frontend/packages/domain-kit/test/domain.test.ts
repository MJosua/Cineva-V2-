import test from 'node:test';
import assert from 'node:assert/strict';
import { createRules, assertRules, safeRead } from '../src/validation.ts';
import { validateRelations } from '../src/relations.ts';
import { validateAttribute } from '../src/attributes.ts';

test('Hotel reservations require a room in the same hotel and reject foreign IDs', () => {
  const collections = { rooms: [{ id: 'room-a', hotel: 'a', number: '101' }, { id: 'room-b', hotel: 'b', number: '101' }], reservations: [{ id: 'stay', room: '101', hotel: 'a' }] };
  const config = { collections: { rooms: {}, reservations: {} }, references: [{ from: 'reservations', field: 'room', to: 'rooms', targetField: 'number', scope: { sourceField: 'hotel', targetField: 'hotel' } }] };
  const before = JSON.stringify(collections);
  assert.deepEqual(validateRelations(collections, config), []);
  assert.equal(JSON.stringify(collections), before);
  collections.reservations[0].hotel = 'c';
  assert.equal(validateRelations(collections, config)[0].code, 'foreign_reference');
});
test('Orders reject duplicate identifiers, invalid scalar IDs, ambiguity and unknown configuration', () => {
  const config = { collections: { products: {}, orders: {} }, references: [{ from: 'orders', field: 'sku', to: 'products', targetField: 'sku' }] };
  const data = { products: [{ id: 1, sku: 'x' }, { id: 1, sku: 'x' }], orders: [{ id: 'o', sku: 'x' }] };
  assert.deepEqual(validateRelations(data, config).map(issue => issue.code), ['duplicate_id', 'ambiguous_reference']);
  assert.ok(validateRelations({ products: [{ id: {} }], orders: [] }, config).some(issue => issue.code === 'invalid_id'));
  assert.ok(validateRelations({ ...data, undeclared: [] }, config).some(issue => issue.code === 'unknown_collection'));
  assert.ok(validateRelations(data, { ...config, references: [{ from: 'orders', field: '__proto__.id', to: 'products' }] }).some(issue => issue.code === 'invalid_reference_config'));
  assert.ok(validateRelations(null as never, config).length);
  assert.ok(validateRelations(data, null as never).length);
});
test('Optional references allow absent values but reject supplied foreign values', () => {
  const config = { collections: { guests: {}, stays: {} }, references: [{ from: 'stays', field: 'guestId', to: 'guests', optional: true }] };
  assert.deepEqual(validateRelations({ guests: [], stays: [{ id: 1 }] }, config), []);
  assert.ok(validateRelations({ guests: [], stays: [{ id: 1, guestId: 'missing' }] }, config).length);
});
test('Safe paths never traverse inherited, prototype or getter properties', () => {
  let getterCalls = 0;
  const data = Object.create({ inherited: 42 }); Object.defineProperty(data, 'secret', { get: () => { getterCalls++; return 1; } });
  assert.equal(safeRead(data, 'inherited').found, false);
  assert.equal(safeRead(data, 'secret').found, false);
  assert.equal(safeRead(data, 'constructor.prototype').found, false);
  assert.equal(getterCalls, 0);
});
test('Rule pipeline accumulates business failures, fails closed on exceptions and asserts structured issues', () => {
  const validate = createRules<{ total: number; paid: number }>([
    { code: 'overpaid', path: 'paid', message: 'Paid exceeds order total.', check: value => value.paid <= value.total },
    { code: 'bad_source', message: 'Source failed.', check: () => { throw new Error(); } },
  ]);
  const issues = validate({ total: 100, paid: 101 });
  assert.deepEqual(issues.map(issue => issue.code), ['overpaid', 'bad_source']);
  assert.throws(() => assertRules(issues)); assert.doesNotThrow(() => assertRules([]));
  assert.equal(createRules([{ code: 'x', path: '__proto__.x', message: 'Bad path', check: () => true }])({})[0].code, 'invalid_rule');
});
test('Typed attributes distinguish integer money, fractions, tags and actual calendar dates', () => {
  assert.deepEqual(validateAttribute(1250, { type: 'money', min: 0 }), []);
  assert.ok(validateAttribute(12.5, { type: 'money' }).length);
  assert.ok(validateAttribute('12', { type: 'integer' }).length);
  assert.ok(validateAttribute(Infinity, { type: 'number' }).length);
  assert.deepEqual(validateAttribute(1.25, { type: 'number' }), []);
  assert.ok(validateAttribute('2026-02-31', { type: 'date' }).length);
  assert.deepEqual(validateAttribute('2028-02-29', { type: 'date' }), []);
  assert.ok(validateAttribute('closed', { type: 'tag', allowed: ['open'] }).length);
  assert.ok(validateAttribute(null, { type: 'text', required: true }).length);
  assert.deepEqual(validateAttribute('<script>plain text</script>', { type: 'text' }), []);
  assert.ok(validateAttribute(1, { type: 'integer', min: 3, max: 1 }).length);
});
test('Each rule receives an isolated document even when previous checks mutate or throw', () => {
  const data = { order: { total: 100 }, items: ['room'] };
  const rules = [
    { code: 'mutated', message: 'Mutation fails', check: (value: typeof data) => { value.order.total = 999; value.items.push('extra'); throw new Error(); } },
    { code: 'unchanged', message: 'Original expected', check: (value: typeof data) => value.order.total === 100 && value.items.length === 1 },
  ];
  const validate = createRules(rules);
  rules[0].code = 'changed_config'; rules.reverse();
  assert.deepEqual(validate(data).map(issue => issue.code), ['mutated']);
  assert.deepEqual(data, { order: { total: 100 }, items: ['room'] });
});
test('Uncloneable inputs and failing custom clone fail closed without executing checks', () => {
  let executed = false;
  const rule = { code: 'checked', message: 'Check', check: () => { executed = true; return true; } };
  assert.equal(createRules([rule])({ callback: () => true })[0].code, 'rule_clone_failed');
  assert.equal(createRules([rule], { clone: () => { throw new Error(); } })({})[0].code, 'rule_clone_failed');
  assert.equal(executed, false);
});
