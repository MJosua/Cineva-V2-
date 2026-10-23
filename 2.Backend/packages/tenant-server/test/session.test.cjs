const test = require('node:test');
const assert = require('node:assert/strict');
const {createAppSessionManager} = require('../src/session');
function fixture() {
 const rows = new Map();let active = true, now = 10;const headers = {};
 const manager = createAppSessionManager({origin: 'https://cineva.com', ttlMs: 1000, clock: () => now, resolveUser: async user_id => ({user_id, active}), store: {get: async id => rows.get(id), put: async (id, row) => rows.set(id, row), delete: async id => rows.delete(id)}});
 const res = {getHeader: name => headers[name], setHeader: (name, value) => {headers[name] = value;}};
 const request = () => ({headers: {origin: 'https://cineva.com', cookie: headers['Set-Cookie'].map(c => c.split(';')[0]).join('; '), 'x-csrf-token': headers['Set-Cookie'][1].split(';')[0].split('=')[1]}});
 return {manager, res, headers, request, suspend: () => {active = false;}, expire: () => {now = 2000;}};
}
test('BFF session uses HttpOnly Secure host cookie without exposing token to browser JS', async () => {const f = fixture();await f.manager.issue(f.res, '7');assert.match(f.headers['Set-Cookie'][0], /__Host-cineva_session=.*HttpOnly/);assert.match(f.headers['Set-Cookie'][0], /Secure/);assert(!f.headers['Set-Cookie'][1].includes('HttpOnly'));assert.equal((await f.manager.resolveIdentity(f.request())).user_id, '7');});
test('BFF mutations require exact origin and CSRF even with valid cookie', async () => {
 const f = fixture();await f.manager.issue(f.res, '7');await f.manager.assertMutation(f.request());
 for (const patch of [{origin: 'https://other.test'}, {'x-csrf-token': 'bad'}, {'x-csrf-token': 'é'.repeat(43)}]) await assert.rejects(f.manager.assertMutation({headers: {...f.request().headers, ...patch}}), {status: 403});
});
test('BFF revalidates user suspension and expiry', async () => {const f = fixture();await f.manager.issue(f.res, '7');f.suspend();await assert.rejects(f.manager.resolveIdentity(f.request()), {code: 'ACCOUNT_INACTIVE'});const g = fixture();await g.manager.issue(g.res, '7');g.expire();await assert.rejects(g.manager.resolveIdentity(g.request()), {code: 'SESSION_EXPIRED'});});
test('app logout revokes server session and rejects old cookie', async () => {const f = fixture();await f.manager.issue(f.res, '7');const old = f.request();await f.manager.revoke(old, f.res);await assert.rejects(f.manager.resolveIdentity(old), {code: 'SESSION_EXPIRED'});assert.match(f.headers['Set-Cookie'][2], /Max-Age=0/);});
test('duplicate/tossed session cookie is rejected', async () => {const f = fixture();await f.manager.issue(f.res, '7');const req = f.request();req.headers.cookie += '; '+req.headers.cookie.split(';')[0];await assert.rejects(f.manager.resolveIdentity(req), {status: 401});});
