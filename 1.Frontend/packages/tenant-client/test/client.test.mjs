import test from 'node:test';
import assert from 'node:assert/strict';
import {createTenantClient} from '../src/client.mjs';
const ctx = id => ({schema_version: 1, tenant_key: 'cineva', company_id: id, user_id: '1', membership_version: 'v1'});
const deferred = () => {let resolve; return {promise: new Promise(r => {resolve = r;}), resolve: v => resolve(v)};};
test('parallel app instances do not share active company', async () => {
 const transport = async (_path, opt) => ({context: ctx(opt.body.company_id), context_id: `c${opt.body.company_id}`});
 const a = createTenantClient({transport}), b = createTenantClient({transport});await a.selectCompany(1);await b.selectCompany(2);
 assert.equal(a.snapshot().context.company_id, 1);assert.equal(b.snapshot().context.company_id, 2);
});
test('late response from company A cannot populate company B', async () => {
 const pending = deferred();let signal;
 const client = createTenantClient({transport: async (path, opt) => {if (path === '/context') return {context: ctx(opt.body.company_id), context_id: `c${opt.body.company_id}`};signal = opt.signal;return pending.promise;}});
 await client.selectCompany(1);const request = client.request('/brand', {cache: true});
 await client.selectCompany(2);assert(signal.aborted);pending.resolve({context: ctx(1), rows: ['secret-a']});
 await assert.rejects(request, {code: 'STALE_CONTEXT'});assert.equal(client.snapshot().context.company_id, 2);
});
test('out of order context selections do not restore older company', async () => {
 const a = deferred(), b = deferred();const client = createTenantClient({transport: (_, opt) => opt.body.company_id === 1 ? a.promise : b.promise});
 const first = client.selectCompany(1);const second = client.selectCompany(2);b.resolve({context: ctx(2), context_id: 'two'});await second;
 a.resolve({context: ctx(1), context_id: 'one'});await assert.rejects(first, {code: 'STALE_CONTEXT'});
});
test('switch closes SSE subscriptions and resets context even when next company denied', async () => {
 let closed = 0;const client = createTenantClient({transport: async (_, opt) => {if (opt.body.company_id === 2) throw Object.assign(new Error(), {status: 403});return {context: ctx(1), context_id: 'one'};}});
 await client.selectCompany(1);client.addSubscription(() => closed++);await assert.rejects(client.selectCompany(2));assert.equal(closed, 1);assert.equal(client.snapshot(), null);
});
test('cached reads still revalidate server membership and clear on revoke', async () => {
 let count = 0;const client = createTenantClient({transport: async (path, opt) => {if (path === '/context') return {context: ctx(1), context_id: 'one'};if (++count === 2) throw Object.assign(new Error(), {status: 403});return {context: ctx(1), value: 10};}});
 await client.selectCompany(1);await client.request('/data', {cache: true});await assert.rejects(client.request('/data', {cache: true}));assert.equal(client.snapshot(), null);
});
test('context cannot leak through absolute paths or mismatched response ownership', async () => {
 const client = createTenantClient({transport: async path => path === '/context' ? {context: ctx(1), context_id: 'one'} : {context: ctx(2)}});
 await client.selectCompany(1);await assert.rejects(client.request('//evil.test'));await assert.rejects(client.request('/data'), {code: 'RESOURCE_NOT_FOUND'});
});
test('disposed client cannot be reused', async () => {const client = createTenantClient({transport: async () => ({})});client.dispose();await assert.rejects(client.bootstrap(), {code: 'CLIENT_DISPOSED'});});
