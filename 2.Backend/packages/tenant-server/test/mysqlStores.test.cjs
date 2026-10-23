const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {createMysqlRuntimeStore} = require('../src/mysqlStores');
test('persistent store hashes opaque keys, partitions app/kind and uses UoW for every mutation', async () => {
  const key = crypto.randomBytes(32).toString('base64url'), calls = [];let transactions = 0;
  const store = createMysqlRuntimeStore({appKey: 'hots', kind: 'session', query: async (sql, params) => {calls.push({sql, params});return [];}, unitOfWork: {run: async fn => {transactions++;return fn({execute: async (sql, params) => {calls.push({sql, params});return [[]];}});}}});
  await store.put(key, {expires_at: Date.now()+60000});await store.get(key);await store.delete(key);await store.consume(key);
  assert.equal(transactions, 3);assert(!JSON.stringify(calls).includes(key));
  assert(calls.every(c => c.params[0] === 'hots' && c.params[1] === 'session'));
  assert(calls.some(c => /FOR UPDATE$/.test(c.sql)));assert(calls.every(c => !/^DELETE|REPLACE/.test(c.sql)));
});
test('expired payload cannot be returned and invalid keys never reach persistence', async () => {
  let calls = 0;
  const store = createMysqlRuntimeStore({appKey: 'hots', kind: 'login', clock: () => 1000, query: async () => {calls++;return [{payload: {expires_at: 999}}];}, unitOfWork: {run: async () => {throw Error('must not mutate');}}});
  assert.equal(await store.get('a'.repeat(43)), null);
  await assert.rejects(store.get('forged'));await assert.rejects(store.put('a'.repeat(43), {expires_at: 999}));assert.equal(calls, 1);
});
