const test = require('node:test');
const assert = require('node:assert/strict');
const {createProgramRegistry} = require('../src/registry');
const {createRegisteredTenantRuntime} = require('../../../Integrated-API/app/modules/tenant-platform/runtime');
const config = () => ({schema_version: 1, programs: [
  {tenant_key: 'cineva', enabled: true, program_id: 101, permission_module: 'cineva', origin: 'https://cineva.example', workspace_path: '/hots/platform/workspaces'},
  {tenant_key: 'overseas', enabled: true, program_id: 102, permission_module: 'overseas', origin: 'https://overseas.example', workspace_path: '/hots/platform/workspaces'},
]}); // Synthetic IDs, never written or used as deployment defaults.
test('disabled example is safe and cannot bind', () => {
  const registry = createProgramRegistry(require('../../../Integrated-API/app/modules/tenant-platform/programs.example.json'));
  assert.equal(registry.status().every(p => !p.enabled), true);
  assert.throws(() => registry.bind('cineva'), {code: 'TENANT_NOT_CONFIGURED'});
});
test('registry snapshots config and ignores request-controlled program selection', () => {
  const c = config(), bound = createProgramRegistry(c).bind('cineva'); c.programs[0].program_id = 999;
  assert.equal(bound.program.program_id, 101);
  assert.equal(bound.resolveTenant({body: {tenant_key: 'overseas'}, headers: {host: 'overseas.example', 'x-forwarded-host': 'overseas.example'}}), 'cineva');
  assert.deepEqual(Object.keys(bound.programs), ['cineva']);
});
test('ambiguous namespaces, origins and physical IDs fail at composition', () => {
  for (const key of ['program_id', 'permission_module', 'origin', 'tenant_key']) {
    const c = config(); c.programs[1][key] = c.programs[0][key]; assert.throws(() => createProgramRegistry(c));
  }
});
test('HOTS and Overseas may share a portal with distinct server-bound API mounts',()=>{
 const c=config();c.programs[1].origin=c.programs[0].origin;c.programs[1].api_base_path='/api/tenant/overseas/v1';
 const registry=createProgramRegistry(c);assert.equal(registry.bind('overseas').program.api_base_path,'/api/tenant/overseas/v1');assert.equal(registry.bind('cineva').resolveTenant({headers:{'x-tenant-key':'overseas'}}),'cineva');
 for(const path of ['//external/api','/api//tenant','/api/tenant/','/api/tenant?next=x']){const bad=config();bad.programs[0].api_base_path=path;assert.throws(()=>createProgramRegistry(bad));}
});
test('enabled programs require canonical HTTPS and safe local return path', () => {
  for (const origin of ['http://cineva.example', 'https://cineva.example/', 'https://name:secret@cineva.example', 'https://cineva.example/path']) {
    const c = config();c.programs[0].origin = origin;assert.throws(() => createProgramRegistry(c));
  }
  for (const p of ['//evil.example', '/\\evil', '/a?next=b', '/a\nb']) {
    const c = config();c.programs[0].workspace_path = p;assert.throws(() => createProgramRegistry(c));
  }
});
test('registered runtime scopes membership query to server program despite hostile body', async () => {
  const seen = [];
  const runtime = createRegisteredTenantRuntime({registry: config(), tenantKey: 'cineva',
    query: async (_sql, params) => {seen.push(params);return [];},
    resolveIdentity: async () => ({user_id: '7', session_id: 'test-session', active: true}),
    resolveTenant: () => 'overseas', programs: {cineva: {program_id: 999}},
    contextStore: {put: async () => {}, get: async () => null}, assertMutation: async () => {},
  });
  const result = await runtime.engine.bootstrap({body: {tenant_key: 'overseas', company_id: 1}});
  assert.equal(result.tenant_key, 'cineva');assert.deepEqual(result.companies, []);
  assert.deepEqual(seen, [['cineva', 7, 101]]);
});
