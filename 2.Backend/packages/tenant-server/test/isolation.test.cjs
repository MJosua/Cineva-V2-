const test = require('node:test');
const assert = require('node:assert/strict');
const {createTenantEngine, createRegistrationService} = require('../src');
const {createUnitOfWork} = require('../src/transaction');
const {createMysqlMemberships} = require('../src/mysqlMemberships');
function fixture() {
 const contexts = new Map(), members = new Map();let now = 100;
 for (const tenant_key of ['cineva', 'overseas']) for (const company_id of [1, 2]) members.set(`${tenant_key}:${company_id}`, {user_id: '7', tenant_key, company_id, company_name: `Company ${company_id}`, version: 'v1', active: true, permissions: ['brand.read', 'resources.read', 'resources.write']});
 const engine = createTenantEngine({clock: () => now, contextTtlMs: 1000, resolveIdentity: async req => req.identity, resolveTenant: async req => req.trustedTenant,
 memberships: {list: async (_u, key) => [...members.values()].filter(m => m.tenant_key === key), get: async (_u, key, id) => members.get(`${key}:${id}`)},
 contextStore: {put: async (id, row) => contexts.set(id, row), get: async id => contexts.get(id)},
 branding: {get: async c => ({schema_version: 1, revision: 1, tenant_key: c.tenant_key, company_id: c.company_id, brand: {display_name: 'Brand', logo_asset_id: null}, tokens: {primary: '37 62% 31%'}})},
 });
 const req = {trustedTenant: 'cineva', identity: {user_id: '7', session_id: 'session-a', active: true}};
 return {engine, req, members, contexts, expire: () => {now = 2000;}};
}
test('personal active user sees no companies without invitation membership', async () => {const f = fixture();f.members.clear();assert.deepEqual((await f.engine.bootstrap(f.req)).companies, []);await assert.rejects(f.engine.select(f.req, 1), {code: 'MEMBERSHIP_REQUIRED'});});
test('missing identity and default company are rejected', async () => {const f = fixture();await assert.rejects(f.engine.bootstrap({...f.req, identity: null}), {status: 401});for (const id of [0, null, '1']) await assert.rejects(f.engine.select(f.req, id));});
test('server tenant selection ignores client supplied program/company owner', async () => {const f = fixture();const selected = await f.engine.select({...f.req, body: {tenant_key: 'overseas'}}, 1);assert.equal(selected.context.tenant_key, 'cineva');});
test('opaque context is bound to user session program and expiry', async () => {
 const f = fixture(), selected = await f.engine.select(f.req, 1);
 for (const patch of [{trustedTenant: 'overseas'}, {identity: {...f.req.identity, session_id: 'other'}}, {identity: {...f.req.identity, user_id: '8'}}]) await assert.rejects(f.engine.authorize({...f.req, ...patch}, selected.context_id, 'resources.read'));
 f.expire();await assert.rejects(f.engine.authorize(f.req, selected.context_id, 'resources.read'), {code: 'CONTEXT_EXPIRED'});
});
test('membership revoke and permission version changes invalidate prior contexts', async () => {
 const f = fixture(), {context_id} = await f.engine.select(f.req, 1), member = f.members.get('cineva:1');
 member.active = false;await assert.rejects(f.engine.authorize(f.req, context_id, 'resources.read'));
 member.active = true;member.version = 'v2';await assert.rejects(f.engine.authorize(f.req, context_id, 'resources.read'), {code: 'MEMBERSHIP_CHANGED'});
});
test('role names and global admin numbers do not confer wildcard grants', async () => {
 const f = fixture(), member = f.members.get('cineva:1');member.permissions = [];member.role_id = 4;const {context_id} = await f.engine.select(f.req, 1);
 await assert.rejects(f.engine.authorize(f.req, context_id, 'resources.write'), {code: 'PERMISSION_DENIED'});
 member.permissions = ['*'];await assert.rejects(f.engine.select(f.req, 1), {code: 'INVALID_MEMBERSHIP'});
});
test('repository refuses forged context and cross-tenant/company rows', async () => {
 const f = fixture(), selected = await f.engine.select(f.req, 1), context = await f.engine.authorize(f.req, selected.context_id, 'resources.read');
 for (const row of [{tenant_key: 'overseas', company_id: 1}, {tenant_key: 'cineva', company_id: 2}]) {const repo = f.engine.repository({get: async () => row});await assert.rejects(repo.get(context, 'same-id'), {status: 404});await assert.rejects(repo.get({...context}, 'same-id'), {code: 'UNVERIFIED_CONTEXT'});}
});
test('previously issued server context cannot bypass a later membership revoke', async () => {
 const f = fixture(), s = await f.engine.select(f.req, 1), c = await f.engine.authorize(f.req, s.context_id, 'resources.read');
 const repo = f.engine.repository({get: async () => c});f.members.get('cineva:1').active = false;
 await assert.rejects(repo.get(c, 'resource'), {code: 'MEMBERSHIP_REQUIRED'});
});
test('repository list rejects adapter returning a foreign resource', async () => {const f = fixture(), selected = await f.engine.select(f.req, 1), c = await f.engine.authorize(f.req, selected.context_id, 'resources.read');const repo = f.engine.repository({get: async () => null, list: async () => ({total: 1, rows: [{tenant_key: 'cineva', company_id: 2}]})});await assert.rejects(repo.list(c, {}), {status: 404});});
test('read-authorized context cannot write when membership lacks write permission', async () => {const f = fixture();f.members.get('cineva:1').permissions = ['resources.read'];const s = await f.engine.select(f.req, 1), c = await f.engine.authorize(f.req, s.context_id, 'resources.read');const repo = f.engine.repository({get: async () => c});await assert.rejects(repo.update(c, '1', {}, {}), {code: 'PERMISSION_DENIED'});});
test('transaction-kit rollback/release when scoped update fails', async () => {
 const f = fixture(), s = await f.engine.select(f.req, 1), c = await f.engine.authorize(f.req, s.context_id, 'resources.write'), events = [];
 const unit = createUnitOfWork({adapter: {acquire: async () => ({begin: async () => events.push('begin'), commit: async () => events.push('commit'), rollback: async () => events.push('rollback'), release: () => events.push('release')})}, logger: {warn(){}}});
 const repo = f.engine.repository({get: async () => c, getForUpdate: async () => c, update: async () => {throw new Error('sync failed');}});
 await assert.rejects(repo.update(c, '1', {title: 'x'}, unit));assert.deepEqual(events, ['begin', 'rollback', 'release']);
});
test('owner mutation denied before transaction; successful update commits', async () => {
 const f = fixture(), s = await f.engine.select(f.req, 1), c = await f.engine.authorize(f.req, s.context_id, 'resources.write');let runs = 0;
 const repo = f.engine.repository({get: async () => c, getForUpdate: async () => c, update: async () => ({...c, title: 'new'})});
 const unit = {run: async fn => {runs++;return fn({});}};await assert.rejects(repo.update(c, '1', {company_id: 2}, unit));assert.equal(runs, 0);assert.equal((await repo.update(c, '1', {title: 'new'}, unit)).title, 'new');
});
test('self registration forces active personal client; body roles/company ignored', async () => {
 let payload;
 const service = createRegistrationService({resolveRegistrationIdentity: async () => ({issuer: 'https://idp.test', subject: 'opaque-user', verified: true}), unitOfWork: {run: fn => fn({})}, users: {createPersonalClient: async (_c, input) => {payload = input;return {user_id: '7'};}}});
 const result = await service.register({role: 'admin', company_id: 1, verified: true});assert.equal(payload.account_type, 'client');assert.equal(payload.company_id, undefined);assert.deepEqual(result.companies, []);
});
test('self registration cannot trust caller verified flag', async () => {const service = createRegistrationService({resolveRegistrationIdentity: async () => null, unitOfWork: {run: () => {throw Error('must not run');}}, users: {createPersonalClient(){}}});await assert.rejects(service.register({verified: true}), {code: 'VERIFIED_IDENTITY_REQUIRED'});});
test('actual-schema membership adapter denies duplicate access instead of selecting one', async () => {
 const row = {access_id: 1, user_id: 7, company_id: 1, company_name: 'A', role_id: 4, permission_key: null};const adapter = createMysqlMemberships({programs: {cineva: {program_id: 9, permission_module: 'cineva'}}, query: async () => [row, {...row, access_id: 2}]});
 await assert.rejects(adapter.list('7', 'cineva'), {code: 'AMBIGUOUS_MEMBERSHIP'});
});
test('membership adapter does not elevate global role; hashes authority changes', async () => {
 const row = {access_id: 1, user_id: 7, company_id: 1, company_name: 'A', role_id: 4, permission_id: 1, permission_key: 'brand.read', permission_updated_at: 'a'};
 const adapter = createMysqlMemberships({programs: {cineva: {program_id: 9, permission_module: 'cineva'}}, query: async () => [row]});
 const [a] = await adapter.list('7', 'cineva');assert.deepEqual(a.permissions, ['brand.read']);row.permission_updated_at = 'b';const [b] = await adapter.list('7', 'cineva');assert.notEqual(a.version, b.version);assert.equal(await adapter.get('7', 'cineva', 2), null);
});
