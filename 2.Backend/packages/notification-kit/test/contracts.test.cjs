const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createSSEWriter, createSSEHub, createNotificationEngine, scopeKey, eventFrame } = require('../src');
class Response extends EventEmitter {
  constructor(block = false) { super(); this.frames = []; this.block = block; }
  write(frame) { this.frames.push(frame); return !this.block; }
  destroy() { this.destroyed = true; this.emit('close'); }
}
function fixture({ fail = false, transport = { send: () => ({ accepted: 0, failed: 0 }) } } = {}) {
  let rows = [], counter = 0;
  const same = (row, scope) => scopeKey(row.scope) === scopeKey(scope);
  const repository = {
    async transaction(work) {
      const next = structuredClone(rows);
      const result = await work({
        insert: row => { next.push(row); },
        markRead: (scope, id) => { const row = next.find(row => same(row, scope) && row.id === id); if (row) row.isRead = true; return !!row; },
        markAllRead: scope => { next.filter(row => same(row, scope)).forEach(row => row.isRead = true); },
      });
      if (fail) throw new Error('Dummy transaction rollback');
      rows = next; return result;
    },
    list: async (scope, { limit, offset }) => rows.filter(row => same(row, scope)).slice(offset, offset + limit),
    unreadCount: async scope => rows.filter(row => same(row, scope) && !row.isRead).length,
  };
  const engine = createNotificationEngine({ repository, transport, authorize: (context, scope) => context.tenantId === scope.tenantId && context.userId === scope.userId, id: () => `dummy-${++counter}`, clock: () => 100, format: input => ({ title: input.title, message: 'Dummy message' }) });
  return { engine, rows: () => rows };
}
const a = { tenantId: 'A', userId: 'same-user' }, b = { tenantId: 'B', userId: 'same-user' };
test('Explicit tuple scopes distinguish tenants and reject missing identities', () => {
  assert.notEqual(scopeKey(a), scopeKey(b)); assert.notEqual(scopeKey({ tenantId: 'a/b', userId: 'c' }), scopeKey({ tenantId: 'a', userId: 'b/c' }));
  assert.throws(() => scopeKey({ userId: 'u' }));
});
test('SSE framing preserves JSON text and rejects newline event injection', () => {
  assert.equal(eventFrame('new_comment', { text: 'a\nb' }), 'event: new_comment\ndata: {"text":"a\\nb"}\n\n');
  assert.throws(() => eventFrame('bad\nevent', {})); assert.throws(() => eventFrame('event', undefined));
});
test('Backpressure accepts first frame once and flushes later frames in order after drain', () => {
  const writer = createSSEWriter(), res = new Response(true);
  assert.equal(writer.write(res, 'event', 1), true); writer.write(res, 'event', 2); writer.write(res, 'event', 3);
  assert.equal(res.frames.length, 1); assert.equal(res.destroyed, undefined);
  res.block = false; res.emit('drain'); assert.equal(res.frames.length, 3);
  assert.deepEqual(res.frames.map(f => JSON.parse(f.split('data: ')[1])), [1, 2, 3]);
  writer.dispose(res); assert.equal(res.listenerCount('drain'), 0);
});
test('Bounded slow-consumer queues close only on overflow and clean listeners', () => {
  const errors = [], writer = createSSEWriter({ maxQueuedFrames: 1, onError: e => errors.push(e.message) }), res = new Response(true);
  writer.write(res, 'event', 1); writer.write(res, 'event', 2); assert.equal(writer.write(res, 'event', 3), false);
  assert.equal(res.destroyed, true); assert.equal(errors.length, 1); assert.equal(res.listenerCount('drain'), 0);
});
test('Hub fans out to tabs only inside the exact scope and disconnect is isolated', () => {
  const hub = createSSEHub(), first = new Response(), second = new Response(), foreign = new Response();
  const disconnect = hub.connect(a, first); hub.connect(a, second); hub.connect(b, foreign);
  assert.deepEqual(hub.send(a, 'event', {}), { accepted: 2, failed: 0 }); assert.equal(foreign.frames.length, 0);
  disconnect(); assert.deepEqual(hub.send(a, 'event', {}), { accepted: 1, failed: 0 });
  second.destroy(); foreign.destroy(); assert.deepEqual(hub.stats(), { scopes: 0, connections: 0 });
});
test('Publish persists for offline users; lists/counts/read are scoped and detached', async () => {
  const { engine, rows } = fixture(); const input = { type: 'new_comment', title: 'Dummy', data: { value: 1 } };
  const receipt = await engine.publish(a, a, input); input.data.value = 9; receipt.notification.data.value = 8;
  assert.equal(rows()[0].data.value, 1); assert.equal(await engine.unreadCount(a, a), 1);
  assert.deepEqual(await engine.list(b, b), []); assert.equal(await engine.markRead(b, b, rows()[0].id), false);
  assert.equal(await engine.markRead(a, a, rows()[0].id), true); assert.equal(await engine.unreadCount(a, a), 0);
});
test('Authorization and invalid paging/content reject before writes', async () => {
  const { engine, rows } = fixture(); await assert.rejects(engine.publish(a, b, { type: 'event', title: 'Dummy' }), /denied/);
  await assert.rejects(engine.list(a, a, { limit: 0 })); await assert.rejects(engine.publish(a, a, { type: 'bad\n', title: 'Dummy' })); assert.equal(rows().length, 0);
});
test('Rollback prevents both persistence and realtime publication', async () => {
  let sends = 0; const { engine, rows } = fixture({ fail: true, transport: { send: () => sends++ } });
  await assert.rejects(engine.publish(a, a, { type: 'event', title: 'Dummy' }), /rollback/);
  assert.equal(rows().length, 0); assert.equal(sends, 0);
});
test('Delivery failure remains explicit after commit and does not erase the inbox', async () => {
  const { engine, rows } = fixture({ transport: { send: () => { throw new Error('Dummy disconnected'); } } });
  const result = await engine.publish(a, a, { type: 'event', title: 'Dummy' }); assert.equal(result.delivery.failed, true); assert.equal(rows().length, 1);
  await engine.markAllRead(a, a); assert.equal(await engine.unreadCount(a, a), 0);
});
test('Hub rejects shared-response registration across scopes and removes errored connections', () => {
  const hub = createSSEHub(), res = new Response(); hub.connect(a, res);
  assert.throws(() => hub.connect(b, res), /already registered/); res.emit('error', new Error('Dummy socket failure'));
  assert.equal(hub.stats().connections, 0);
});
test('Throwing writes fail without retries and closed responses are never written', () => {
  const errors = [], writer = createSSEWriter({ onError: error => errors.push(error.message) }), res = new Response();
  res.write = () => { throw new Error('Dummy broken pipe'); };
  assert.equal(writer.write(res, 'event', {}), false); assert.equal(writer.write(res, 'event', {}), false); assert.equal(errors.length, 1);
  const closed = new Response(); closed.writableEnded = true; assert.equal(writer.write(closed, 'event', {}), false); assert.equal(closed.frames.length, 0);
});
test('Unserializable notification data is rejected before transaction commit', async () => {
  const { engine, rows } = fixture(); await assert.rejects(engine.publish(a, a, { type: 'event', title: 'Dummy', data: 1n })); assert.equal(rows().length, 0);
});
module.exports = { fixture, Response };
