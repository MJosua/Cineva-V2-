// Kernel behaviour + MySQL SQL shape — run: node --test test/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../src');
const { createMemoryDb, memoryIdempotency, memoryOutbox } = kit.memory;
const quiet = { warn() {}, error() {} };

test('deadlock is retried, then succeeds', async () => {
  const db = createMemoryDb();
  const engine = kit.createTransactionEngine({ adapter: db.adapter, logger: quiet });
  let calls = 0;
  engine.registerType({
    name: 'flaky',
    async execute(conn) {
      calls += 1;
      await conn.mem.write('t', 'x', { calls });
      if (calls === 1) throw Object.assign(new Error('Deadlock found'), { code: 'ER_LOCK_DEADLOCK' });
      return { result: calls };
    },
  });
  const out = await engine.run('flaky', {});
  assert.equal(out.result, 2);
  assert.equal(db.get('t', 'x').calls, 2);
});

test('afterCommit failure is logged, not fatal; unknown type is a typed error', async () => {
  const db = createMemoryDb();
  const warnings = [];
  const engine = kit.createTransactionEngine({ adapter: db.adapter, logger: { warn: (m) => warnings.push(m) } });
  engine.registerType({ name: 'ok', execute: async () => ({ result: 1 }), afterCommit: async () => { throw new Error('mailer down'); } });
  assert.equal((await engine.run('ok')).result, 1);
  assert.match(warnings[0], /mailer down/);
  await assert.rejects(engine.run('nope'), { code: kit.TX_ERRORS.UNKNOWN_TYPE });
});

test('events are only published when the transaction commits', async () => {
  const db = createMemoryDb();
  const engine = kit.createTransactionEngine({ adapter: db.adapter, idempotency: memoryIdempotency(), outbox: memoryOutbox(), logger: quiet });
  engine.registerType({ name: 'boom', execute: async () => { throw new Error('fail'); } });
  engine.registerType({ name: 'fine', execute: async () => ({ result: 'ok', events: [{ event_type: 'x_done', ref_id: 1 }] }) });
  await assert.rejects(engine.run('boom'));
  await engine.run('fine');
  assert.deepEqual(db.table('outbox').map((e) => e.event_type), ['x_done']);
});

// ---- SQL shape of the MySQL implementations (fake connection records statements)
function recorder(responses = []) {
  const calls = [];
  return {
    calls,
    query: async (sql, params) => {
      calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      return responses.shift() || [{ affectedRows: 1, insertId: 1 }];
    },
  };
}

test('named lock: GET_LOCK busy → TX_BUSY; released after work', async () => {
  const busyConn = recorder([[[{ acquired: 0 }]]]);
  await assert.rejects(kit.withNamedLock(busyConn, 'seq', async () => 1), { code: kit.TX_ERRORS.BUSY });
  const conn = recorder([[[{ acquired: 1 }]], [[{ max_seq: 41 }]], [[]]]);
  const seq = await kit.nextSequence(conn, {
    lockName: 'hots_par_document_sequence',
    currentMax: async (c) => (await c.query('SELECT MAX(sequence_no) AS max_seq FROM x'))[0][0].max_seq,
    format: (n) => `${String(n).padStart(4, '0')}/10/2026`,
  });
  assert.equal(seq.value, '0042/10/2026');
  assert.equal(conn.calls.at(-1).sql, 'SELECT RELEASE_LOCK(?)');
});

test('HOTS resource store SQL: locks in id order FOR UPDATE, migrates current_stock, writes log', async () => {
  const conn = recorder([[[{ id: 3, resource_label: 'W', attributes: JSON.stringify({ current_stock: 7, min_stock: 2 }) }]]]);
  const store = kit.createHotsResourceStore();
  const items = await store.lockItems(conn, ['3']);
  assert.match(conn.calls[0].sql, /FROM hots\.resource_m_data WHERE id IN \(\?\) ORDER BY id FOR UPDATE$/);
  assert.deepEqual(items.get('3').stocks, { DEFAULT: 7 });
  await store.saveItem(conn, items.get('3'));
  assert.deepEqual(JSON.parse(conn.calls[1].params[0]), { min_stock: 2, stocks: { DEFAULT: 7 }, total_stock: 7 });
  await store.appendMovements(conn, [{ transaction_id: 't', item_id: 3, location_id: 'DEFAULT', operation: 'issue', quantity: 1, snapshot: 6, user_id: 1, notes: null }]);
  assert.match(conn.calls[2].sql, /^INSERT INTO hots\.resource_t_log/);
  assert.equal(conn.calls[2].params[0][0][2], null); // 'DEFAULT' → NULL location (INT column)
});

test('outbox SQL targets trigger_outbox, duplicate key → reported, not thrown', async () => {
  const dup = Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' });
  const conn = { calls: 0, query: async () => { conn.calls += 1; if (conn.calls === 2) throw dup; return [{ insertId: 5 }]; } };
  const saved = await kit.createOutbox().publish(conn, [{ event_type: 'a', ticket_id: 1 }, { event_type: 'a', ticket_id: 1 }]);
  assert.deepEqual(saved.map((s) => s.duplicate), [false, true]);
  assert.throws(() => kit.createOutbox({ table: 'x; DROP TABLE y' }), /Invalid SQL identifier/);
});
