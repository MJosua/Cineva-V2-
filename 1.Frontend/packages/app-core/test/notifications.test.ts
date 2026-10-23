import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationClient, subscribeNotificationEvents } from '../src/notifications.ts';
test('Notification client uses injected routes, decoders and encoded IDs without auth/storage defaults', async () => {
  const calls: unknown[] = [], rows = [{ id: 'dummy' }];
  const client = createNotificationClient({
    http: { get: async path => { calls.push(path); return path === '/count' ? 2 : rows; }, post: async (path, body) => { calls.push([path, body]); return true; } },
    routes: { list: '/list', unread: '/count', read: id => '/read/' + encodeURIComponent(id), readAll: '/all' },
    decode: { list: value => value as typeof rows, unread: value => value as number, acknowledge: value => { assert.equal(value, true); } },
  });
  const result = await client.list(); result[0].id = 'changed'; assert.equal(rows[0].id, 'dummy');
  assert.equal(await client.unreadCount(), 2); await client.markRead('a/b'); await client.markAllRead();
  assert.deepEqual(calls, ['/list', '/count', ['/read/a%2Fb', {}], ['/all', {}]]);
});
test('Client rejects malformed counts/lists and propagates failed writes without optimistic success', async () => {
  const client = createNotificationClient({ http: { get: async () => null, post: async () => { throw new Error('dummy failure'); } }, routes: { list: '/', unread: '/', read: id => id, readAll: '/' }, decode: { list: value => value as never[], unread: () => -1, acknowledge() {} } });
  await assert.rejects(client.list()); await assert.rejects(client.unreadCount()); await assert.rejects(client.markRead('')); await assert.rejects(client.markAllRead(), /dummy failure/);
});
test('Named SSE subscription preserves other listeners, deduplicates and cleans up', () => {
  const source = new EventTarget(), received: unknown[] = [], errors: unknown[] = [];
  let independent = 0; source.addEventListener('new_comment', () => independent++);
  const stop = subscribeNotificationEvents(source as EventSource, ['new_comment', 'new_comment'], (name, payload) => received.push([name, payload]), e => errors.push(e));
  source.dispatchEvent(new MessageEvent('new_comment', { data: '{"id":1}' }));
  source.dispatchEvent(new MessageEvent('message', { data: 'invalid' })); stop(); stop();
  source.dispatchEvent(new MessageEvent('new_comment', { data: '{"id":2}' }));
  assert.deepEqual(received, [['new_comment', { id: 1 }]]); assert.equal(independent, 2); assert.equal(errors.length, 1);
});
