// Program scenarios: HOTS (inventory, POSM), Form, Event, E-Order — run: node --test test/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const kit = require('../src');
const { createMemoryDb, memoryIdempotency, memoryOutbox, memoryStockStore, memoryFormRepo, memoryCouponRepo, memoryOrderRepo } = kit.memory;

const quiet = { warn() {}, error() {} };
function setup(seed, register) {
  const db = createMemoryDb(seed);
  const engine = kit.createTransactionEngine({ adapter: db.adapter, idempotency: memoryIdempotency(), outbox: memoryOutbox(), logger: quiet });
  const ledger = kit.createStockLedger({ store: memoryStockStore() });
  register(engine, ledger);
  return { db, engine };
}
const settle = (promises) => Promise.allSettled(promises);

// ---------------------------------------------------------------- HOTS inventory
test('HOTS inventory: receive / transfer / adjust keep balances + movement log', async () => {
  const { db, engine } = setup({ items: { 1: { id: 1, label: 'Laptop', stocks: { 10: 2 } } } }, (e, ledger) => e.registerType(kit.createInventoryMovementType({ ledger })));
  await engine.run('hots.inventory', { operation: 'receive', user_id: 7, items: [{ id: 1, quantity: 3, location_id: 10 }] });
  await engine.run('hots.inventory', { operation: 'transfer', user_id: 7, items: [{ id: 1, quantity: 4, from_location_id: 10, to_location_id: 20 }] });
  await engine.run('hots.inventory', { operation: 'adjust', user_id: 7, items: [{ id: 1, quantity: 9, location_id: 20 }] });
  assert.deepEqual(db.get('items', 1).stocks, { 10: 1, 20: 9 });
  assert.deepEqual(db.table('movements').map((m) => m.operation), ['receive', 'transfer_out', 'transfer_in', 'adjust']);
});

test('HOTS inventory: two concurrent issues of the last unit → exactly one wins (race condition)', async () => {
  const { db, engine } = setup({ items: { 1: { id: 1, label: 'Banner', stocks: { 10: 1 } } } }, (e, ledger) => e.registerType(kit.createInventoryMovementType({ ledger })));
  const req = { operation: 'issue', user_id: 1, items: [{ id: 1, quantity: 1, location_id: 10 }] };
  const results = await settle([engine.run('hots.inventory', req), engine.run('hots.inventory', req)]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.find((r) => r.status === 'rejected').reason.code, kit.TX_ERRORS.INSUFFICIENT_STOCK);
  assert.equal(db.get('items', 1).stocks[10], 0);
});

test('HOTS inventory: service 19 (IT asset) may backorder, others are hard-blocked — parameter, not code', async () => {
  const { db, engine } = setup({ items: { 5: { id: 5, label: 'Monitor', stocks: { 1: 0 } } } }, (e, ledger) => e.registerType(kit.createInventoryMovementType({ ledger, allowNegativeServiceIds: [19] })));
  await assert.rejects(engine.run('hots.inventory', { operation: 'issue', user_id: 1, service_id: 14, items: [{ id: 5, quantity: 1, location_id: 1 }] }), { code: kit.TX_ERRORS.INSUFFICIENT_STOCK });
  await engine.run('hots.inventory', { operation: 'issue', user_id: 1, service_id: 19, items: [{ id: 5, quantity: 2, location_id: 1 }] });
  assert.equal(db.get('items', 5).stocks[1], -2);
});

test('HOTS inventory: one bad line rolls back the whole movement (no partial stock change)', async () => {
  const { db, engine } = setup({ items: { 1: { id: 1, label: 'A', stocks: { 1: 5 } } } }, (e, ledger) => e.registerType(kit.createInventoryMovementType({ ledger })));
  await assert.rejects(engine.run('hots.inventory', { operation: 'issue', user_id: 1, items: [{ id: 1, quantity: 2, location_id: 1 }, { id: 99, quantity: 1, location_id: 1 }] }), { code: kit.TX_ERRORS.NOT_FOUND });
  assert.equal(db.get('items', 1).stocks[1], 5);
  assert.equal(db.table('movements').length, 0);
});

// ---------------------------------------------------------------- HOTS POSM
test('HOTS POSM: approval trigger re-run never deducts twice (idempotent per ticket)', async () => {
  const { db, engine } = setup({ items: { 3: { id: 3, label: 'Wobbler', stocks: { DEFAULT: 10 } } } }, (e, ledger) =>
    e.registerType(kit.createPosmIssueType({ ledger, resolveItemIds: async (_c, skus) => new Map(skus.map((s) => [s, 3])) })),
  );
  const input = { ticket_id: 'T-260001', user_id: 9, items: [{ sku: 'WOB-01', qty: 4 }] };
  const first = await engine.run('hots.posm_issue', input);
  const again = await engine.run('hots.posm_issue', input);
  assert.equal(first.replayed, false);
  assert.equal(again.replayed, true);
  assert.deepEqual(again.result, first.result);
  assert.equal(db.get('items', 3).stocks.DEFAULT, 6);
  assert.equal(db.table('outbox').filter((e) => e.event_type === 'posm_stock_deducted').length, 1);
});

test('HOTS POSM: not enough stock → hard block (old trigger silently clamped to 0)', async () => {
  const { db, engine } = setup({ items: { 3: { id: 3, label: 'Wobbler', stocks: { DEFAULT: 2 } } } }, (e, ledger) => e.registerType(kit.createPosmIssueType({ ledger })));
  await assert.rejects(engine.run('hots.posm_issue', { ticket_id: 'T-2', user_id: 1, items: [{ id: 3, qty: 5 }] }), { code: kit.TX_ERRORS.INSUFFICIENT_STOCK });
  assert.equal(db.get('items', 3).stocks.DEFAULT, 2);
});

// ---------------------------------------------------------------- Form
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const formSeed = (settings, extra = {}) => ({ forms: { survey: { form_id: 1, service_id: 300, slug: 'survey', status: 'published', access_mode: 'public', schema_version: 2, settings_json: settings, ...extra } } });

test('Form: quota 2 with 3 simultaneous submissions → exactly 2 accepted (race condition)', async () => {
  const { db, engine } = setup(formSeed({ max_responses: 2 }), (e) => e.registerType(kit.createFormSubmissionType({ repo: memoryFormRepo() })));
  const results = await settle([1, 2, 3].map((n) => engine.run('form.submit', { slug: 'survey', submission_id: uuid(n), values: { q1: n } })));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 2);
  assert.equal(results.find((r) => r.status === 'rejected').reason.code, kit.TX_ERRORS.RULE_VIOLATION);
  assert.equal(db.table('responses').length, 2);
});

test('Form: double click with the same submission id → same response, stored once', async () => {
  const { db, engine } = setup(formSeed({}), (e) => e.registerType(kit.createFormSubmissionType({ repo: memoryFormRepo() })));
  const input = { slug: 'survey', submission_id: uuid(7), values: { q1: 'yes' } };
  const [a, b] = await Promise.all([engine.run('form.submit', input), engine.run('form.submit', input)]);
  assert.equal(a.result.response_id, b.result.response_id);
  assert.equal(db.table('responses').length, 1);
});

test('Form: closed form / login-required form are rejected by rule', async () => {
  const closed = setup(formSeed({}, { status: 'closed' }), (e) => e.registerType(kit.createFormSubmissionType({ repo: memoryFormRepo() })));
  await assert.rejects(closed.engine.run('form.submit', { slug: 'survey', submission_id: uuid(1), values: {} }), { code: kit.TX_ERRORS.RULE_VIOLATION });
  const auth = setup(formSeed({ one_response_per_user: true }, { access_mode: 'authenticated' }), (e) => e.registerType(kit.createFormSubmissionType({ repo: memoryFormRepo() })));
  await assert.rejects(auth.engine.run('form.submit', { slug: 'survey', submission_id: uuid(2), values: {} }), { code: kit.TX_ERRORS.RULE_VIOLATION });
  await auth.engine.run('form.submit', { slug: 'survey', submission_id: uuid(3), values: {}, user_id: 4 });
  await assert.rejects(auth.engine.run('form.submit', { slug: 'survey', submission_id: uuid(4), values: {}, user_id: 4 }), { code: kit.TX_ERRORS.CONFLICT });
});

// ---------------------------------------------------------------- Event
const couponSeed = { coupons: { 11: { id: 11, public_hash: 'h-abc', coupon_code: 'IND-001', status: 0, form_id: 2, event_id: 5, expires_at: '2099-01-01' }, 12: { id: 12, public_hash: 'h-old', status: 0, expires_at: '2000-01-01' } } };

test('Event: two people redeem the same coupon at once → one redeemed, one already_redeemed', async () => {
  const { db, engine } = setup(couponSeed, (e) => e.registerType(kit.createCouponClaimType({ repo: memoryCouponRepo() })));
  const results = await settle([
    engine.run('event.coupon_claim', { code: 'h-abc', user: { email: 'a@x.id' }, answers: { size: 'L' } }),
    engine.run('event.coupon_claim', { code: 'h-abc', user: { email: 'b@x.id' } }),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.find((r) => r.status === 'rejected').reason.details.status, 'already_redeemed');
  assert.equal(db.table('submissions').length, 1);
  assert.equal(db.table('outbox').length, 1);
});

test('Event: expired coupon, lookup by coupon_code as a parameter', async () => {
  const { engine } = setup(couponSeed, (e) => {
    e.registerType(kit.createCouponClaimType({ repo: memoryCouponRepo() }));
    e.registerType(kit.createCouponClaimType({ repo: memoryCouponRepo(), name: 'event.coupon_by_code', lookupBy: 'coupon_code' }));
  });
  await assert.rejects(engine.run('event.coupon_claim', { code: 'h-old' }), (err) => err.details.status === 'expired');
  const ok = await engine.run('event.coupon_by_code', { code: 'IND-001' });
  assert.equal(ok.result.status, 'redeemed');
});

// ---------------------------------------------------------------- E-Order
const calcKitUrl = pathToFileURL(path.resolve(__dirname, '../../../../1.Frontend/packages/calc-kit/src/index.js')).href;
const order = (extra = {}) => ({
  order_id: 2610060001,
  company_id: 116,
  user_id: 77,
  header: { delv_week: 41, delv_year: 2026, po_buyer: 'PO-1', stuffing_date: '2026-10-12', port_shipment: 1, ship_to: 2 },
  lines: [
    { detail_id: 'C1', cont_size: 40, cont_qty: 1, sku1: 7440, qty1: 1000, cont40hc: 7440 },
    { detail_id: 'C2', cont_size: 40, cont_qty: 1, sku1: 7441, qty1: 900, cont40hc: 7440 },
  ],
  ...extra,
});

test('E-Order: a failing line rolls back the header too (today: header stays, deleted by setTimeout)', async () => {
  const { db, engine } = setup({}, (e) => e.registerType(kit.createOrderSubmitType({ repo: memoryOrderRepo({ failOnLine: 'C2' }) })));
  await assert.rejects(engine.run('eorder.order_submit', order()), /simulated DB failure/);
  assert.equal(db.table('orders').length, 0);
  assert.equal(db.table('order_lines').length, 0);
  assert.equal(db.table('outbox').length, 0);
});

test('E-Order: server re-checks CBM with @hots/calc-kit (same rules as the UI); double submit → one order', async () => {
  const calc = await import(calcKitUrl);
  const validateLoad = async (_conn, input) => {
    const limit = calc.resolveCBM({ flavours: input.lines, companyId: input.company_id, rules: calc.defaultContainerRules, specialConditions: [] });
    const cbm = input.lines.reduce((t, l) => t + (l.cbm || 0), 0);
    return cbm <= limit ? { ok: true } : { ok: false, reason: `CBM ${cbm} exceeds limit ${limit}`, details: { cbm, limit } };
  };
  const { db, engine } = setup({}, (e) => e.registerType(kit.createOrderSubmitType({ repo: memoryOrderRepo(), validateLoad })));

  const mixed = order({ lines: [{ detail_id: 'C1', cont40hc: 7440, cbm: 40 }, { detail_id: 'C2', cont40hc: 4650, cbm: 30 }] });
  await assert.rejects(engine.run('eorder.order_submit', mixed), (err) => err.code === kit.TX_ERRORS.RULE_VIOLATION && err.details.limit === 66);
  assert.equal(db.table('orders').length, 0);

  const sameLoad = order({ request_id: 'req-1' }); // same 40HC load → same-load bypass (limit 100)
  const [a, b] = await Promise.all([engine.run('eorder.order_submit', sameLoad), engine.run('eorder.order_submit', sameLoad)]);
  assert.equal(a.result.order_id, b.result.order_id);
  assert.equal(db.table('orders').length, 1);
  assert.equal(db.table('order_lines').length, 2);
  assert.equal(db.table('outbox').filter((e) => e.event_type === 'order_received').length, 1);
});
