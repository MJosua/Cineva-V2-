const test = require('node:test');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const req = createRequire(path.join(root, '2.Backend/Integrated-API/package.json'));
const express = req('express');
const {createTenantRouter} = require('../../../2.Backend/Integrated-API/app/modules/tenant-platform/routes');
const {createTenantEngine} = require('../../../2.Backend/packages/tenant-server');
async function withServer(runtime, action) {
 const app = express();app.use(express.json());app.use('/api/tenant/v1', createTenantRouter({Router: express.Router, runtime}));
 const server = app.listen(0, '127.0.0.1');await new Promise(resolve => server.once('listening', resolve));
 try {await action(`http://127.0.0.1:${server.address().port}/api/tenant/v1`);} finally {await new Promise(resolve => server.close(resolve));}
}
test('unconfigured platform fails closed with no-store response', async () => {await withServer(null, async base => {const res = await fetch(base+'/bootstrap');assert.equal(res.status, 503);assert.equal(res.headers.get('cache-control'), 'no-store');assert.equal((await res.json()).error.code, 'TENANT_PLATFORM_NOT_CONFIGURED');});});

test('ticket HTTP endpoints require verified context and return ownership envelope', async () => {
 const {TenantError}=require('../../../2.Backend/packages/tenant-server');
 const contexts=new Map(), member={user_id:'7',tenant_key:'hots',company_id:1,company_name:'Company A',active:true,version:'1',permissions:['resources.read']};
 const engine=createTenantEngine({resolveIdentity:async()=>({user_id:'7',session_id:'s',active:true}),resolveTenant:()=> 'hots',memberships:{list:async()=>[member],get:async(_u,_t,id)=>id===1?member:null},contextStore:{put:async(k,v)=>contexts.set(k,v),get:async k=>contexts.get(k)}});
 const tickets=engine.repository({get:async(c,id)=>{if(id!=='own')throw new TenantError('TICKET_NOT_FOUND',404);return {...c,ticket_id:id};},list:async c=>({rows:[{...c,ticket_id:'own'}],total:1})});
 await withServer({engine,tickets},async base=>{
  assert.equal((await fetch(base+'/tickets')).status,403);
  const selected=await engine.select({},1),headers={'X-Workspace-Context':selected.context_id};
  const result=await(await fetch(base+'/tickets?company_id=2',{headers})).json();assert.equal(result.data.context.company_id,1);assert.equal(result.data.rows[0].company_id,1);
  assert.equal((await fetch(base+'/tickets/foreign',{headers})).status,404);
  assert.equal((await fetch(base+'/tickets/own',{headers})).status,200);
 });
});

test('SSO login binding cookie and return path use registered program',async()=>{
 let returned;
 await withServer({program:{tenant_key:'hots',workspace_path:'/hots/platform/workspaces'},oidc:{begin:async(_binding,path)=>{returned=path;return 'https://synthetic-idp.invalid/auth';}}},async base=>{
  const response=await fetch(base+'/sso/start',{redirect:'manual'});assert.equal(response.status,303);assert.match(response.headers.get('set-cookie'),/^__Host-hots_login=/);assert.equal(returned,'/hots/platform/workspaces');
 });
});
test('HTTP bootstrap context and branding enforce session scope and CSRF', async () => {
 const contexts = new Map();let active = true;
 const member = {user_id: '7', tenant_key: 'cineva', company_id: 1, company_name: 'Synthetic Company', active: true, version: '1', permissions: ['brand.read']};
 const engine = createTenantEngine({resolveIdentity: async req => req.headers.authorization === 'test-session' ? {user_id: '7', session_id: 'one', active: true} : null, resolveTenant: async () => 'cineva', memberships: {list: async () => [member], get: async (_u, _t, id) => active && id === 1 ? member : null}, contextStore: {put: async (id, row) => contexts.set(id, row), get: async id => contexts.get(id)}, branding: {get: async c => ({schema_version: 1, revision: 1, tenant_key: 'cineva', company_id: c.company_id, brand: {display_name: 'Synthetic Brand', logo_asset_id: null}, tokens: {primary: '37 62% 31%'}})}});
 await withServer({engine, assertMutation: async req => {if (req.headers['x-csrf-token'] !== 'test-only') {const {TenantError} = require('../../../2.Backend/packages/tenant-server');throw new TenantError('INVALID_CSRF');}}}, async base => {
  assert.equal((await fetch(base+'/bootstrap')).status, 401);
  const headers = {Authorization: 'test-session', 'Content-Type': 'application/json'};
  const bootstrap = await (await fetch(base+'/bootstrap', {headers})).json();assert.equal(bootstrap.data.companies.length, 1);
  assert.equal((await fetch(base+'/context', {method: 'POST', headers, body: JSON.stringify({company_id: 1})})).status, 403);
  headers['X-CSRF-Token'] = 'test-only';
  assert.equal((await fetch(base+'/context', {method: 'POST', headers, body: JSON.stringify({company_id: 2})})).status, 403);
  const selected = await (await fetch(base+'/context', {method: 'POST', headers, body: JSON.stringify({company_id: 1, tenant_key: 'overseas'})})).json();
  headers['X-Workspace-Context'] = selected.data.context_id;
  const brand = await (await fetch(base+'/brand', {headers})).json();assert.equal(brand.data.context.tenant_key, 'cineva');assert.equal(brand.data.brand.brand.display_name, 'Synthetic Brand');
  active = false;assert.equal((await fetch(base+'/brand', {headers})).status, 403);
 });
});
