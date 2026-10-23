import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {connectHots} from './hotsConnection.mjs';
const root = path.resolve(import.meta.dirname, '../../..'), require = createRequire(import.meta.url);
const {createUnitOfWork} = require('../../../2.Backend/packages/tenant-server/src/transaction');
const {createProgramRegistry} = require('../../../2.Backend/packages/tenant-server/src/registry');
const {createMysqlRuntimeStore} = require('../../../2.Backend/packages/tenant-server/src/mysqlStores');
const {createMysqlTicketReads} = require('../../../2.Backend/packages/tenant-server/src/mysqlTickets');
const {createMysqlCompanyScopes} = require('../../../2.Backend/packages/tenant-server/src/mysqlCompanyScopes');
const {createPersistentTenantRuntime}=require('../../../2.Backend/Integrated-API/app/modules/tenant-platform/persistentRuntime');
const result = {database: 'hots', checks: [], committedTestRows: 0, rollbackVerified: false};
const conn = await connectHots(), ids = Array.from({length: 4}, () => crypto.randomUUID());
const check = (name, condition) => {assert(condition, name);result.checks.push(name);};
let transactionOpen = false;
const rollbackSentinel = new Error('ROLLBACK_TEST_COMPLETE');
try {
  const [companies] = await conn.query('SELECT company_id FROM m_company WHERE is_active=1 AND company_id > 0 ORDER BY company_id LIMIT 2');
  assert.equal(companies.length, 2);const [a,b] = companies.map(c => c.company_id);
  const [[catalog]] = await conn.execute('SELECT client_id FROM m_company_program_list WHERE program_id=103');assert.equal(catalog.client_id, 'hots-web');
  const [triggers] = await conn.query("SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE() AND EVENT_OBJECT_TABLE IN ('t_ticket','t_tenant_runtime_store','t_tenant_ticket_owner')");assert.equal(triggers.length, 0);
  const query = async (sql, params) => (await conn.execute(sql, params))[0];
  const grants = JSON.parse(await fs.readFile(path.join(root,'3.Knowledge/reports/tenant_foundation_2026_10_21/pilot-grants.json'),'utf8'));
  const scopes = createMysqlCompanyScopes({query,programs:{hots:{program_id:103},overseas:{program_id:grants.overseas_program_id}}});
  for(const key of ['hots','overseas']) {
    const rows=await scopes.list('1150',key);check(`Kevin ${key} explicit subtree is exactly Indofood/IndoUSA/IndoCanada/IndoVietnam`,JSON.stringify(rows.map(r=>r.company_id))==='[1,2,3,4]' && rows.every(r=>r.permissions.includes('resources.read') && !r.permissions.includes('resources.write')));
  }
  check('Yosua global admin role alone does not create implicit new grants', (await scopes.list('1004','hots')).length===0);
  const uow = createUnitOfWork({logger: {warn: () => {}}, adapter: {acquire: async () => ({raw: conn, begin: async () => {await conn.beginTransaction();transactionOpen=true;}, commit: async () => {throw Error('TEST_MUST_ROLLBACK');}, rollback: async () => {await conn.rollback();transactionOpen=false;}, release: () => {}})}});
  let opaqueKey;
  await assert.rejects(uow.run(async connection => {
    const localUow = {run: fn => fn(connection)}; // All operations participate in the enclosing real UoW, forced rollback.
    const store = (appKey, kind) => createMysqlRuntimeStore({appKey, kind, query, unitOfWork: localUow});
    opaqueKey = crypto.randomBytes(32).toString('base64url');
    await store('hots', 'login').put(opaqueKey, {expires_at: Date.now()+60000, nonce: 'rollback-test'});
    check('stored login visible only to matching app/kind', (await store('hots', 'login').get(opaqueKey)).nonce === 'rollback-test' && await store('cineva','login').get(opaqueKey) === null && await store('hots','session').get(opaqueKey) === null);
    check('login consumed once under row lock', !!await store('hots','login').consume(opaqueKey) && await store('hots','login').consume(opaqueKey) === null);
    await assert.rejects(store('hots','login').put(opaqueKey, {expires_at: Date.now()+60000}), {code: 'ER_DUP_ENTRY'});
    check('consumed login cannot be resurrected', await store('hots','login').get(opaqueKey) === null);
    const sessionKey = crypto.randomBytes(32).toString('base64url');await store('hots','session').put(sessionKey, {expires_at: Date.now()+60000});await store('hots','session').delete(sessionKey);
    check('session revoke is soft with retained row', await store('hots','session').get(sessionKey) === null);
    for (let i=0;i<ids.length;i++) await connection.execute('INSERT INTO t_ticket (ticket_id, company_id, title, root_ticket_id) VALUES (?, ?, ?, ?)', [ids[i], i===1 ? b : a, 'SaaS rollback-only test', ids[i].replaceAll('-','')]);
    await connection.execute('INSERT INTO t_tenant_ticket_owner (ticket_id, program_id, company_id) VALUES (?,103,?), (?,103,?), (?,103,?)', [ids[0],a,ids[1],b,ids[2],b]); // third intentionally mismatched, fourth deliberately unowned.
    const registry = createProgramRegistry({schema_version:1,programs:[{tenant_key:'hots',enabled:true,program_id:103,permission_module:'hots',origin:'https://www.indofoodinternational.com',workspace_path:'/hots/platform/workspaces'}]});
    const tickets = createMysqlTicketReads({query,registry});
    check('own-company ticket readable', (await tickets.get({tenant_key:'hots',company_id:a},ids[0])).ticket_id===ids[0]);
    for (const id of [ids[1],ids[2],ids[3]]) await assert.rejects(tickets.get({tenant_key:'hots',company_id:a},id), {code:'TICKET_NOT_FOUND'});
    await assert.rejects(tickets.get({tenant_key:'hots',company_id:b},ids[2]), {code:'TICKET_NOT_FOUND'});
    check('cross-company, mismatched and unmapped tickets denied', true);
    const list = await tickets.list({tenant_key:'hots',company_id:a});
    check('COUNT and page use same company scope', list.total===1 && list.rows.length===1 && list.rows[0].ticket_id===ids[0]);
    await assert.rejects(tickets.list({tenant_key:'hots',company_id:a},{limit:1000}), {code:'INVALID_PAGINATION'});
    check('unbounded page rejected', true);
    const runtime=createPersistentTenantRuntime({registry:require('../../../2.Backend/Integrated-API/app/modules/tenant-platform/programs.pilot.json'),tenantKey:'hots',query,unitOfWork:localUow,ticketPilot:true,
      oidcConfig:{issuer:'https://synthetic-idp.invalid',authorization_endpoint:'https://synthetic-idp.invalid/auth',token_endpoint:'https://synthetic-idp.invalid/token',client_id:'synthetic',client_secret:'synthetic-not-a-deployment-secret',redirect_uri:'https://www.indofoodinternational.com/api/tenant/v1/sso/callback'},
      verifyIdToken:()=>{throw Error('not invoked in persistent-session test');},identityService:{resolveOrRegister:()=>{throw Error('not invoked');}},resolveUser:async id=>{const rows=await query('SELECT user_id,active FROM user WHERE user_id=? LIMIT 1',[Number(id)]);return rows[0]?{user_id:String(rows[0].user_id),active:rows[0].active===1}:null;}});
    const headers={},res={getHeader:key=>headers[key],setHeader:(key,v)=>{headers[key]=v;}};
    await runtime.sessions.issue(res,'1150');
    const req={headers:{cookie:headers['Set-Cookie'].map(c=>c.split(';')[0]).join('; '),origin:'https://www.indofoodinternational.com'}};
    const boot=await runtime.engine.bootstrap(req);check('real session store + Kevin hierarchy bootstrap',JSON.stringify(boot.companies.map(c=>c.company_id))==='[1,2,3,4]');
    const selected=await runtime.engine.select(req,a),context=await runtime.engine.authorize(req,selected.context_id,'resources.read');
    check('real session/context/membership pipeline reads own ticket',(await runtime.tickets.get(context,ids[0])).ticket_id===ids[0]);
    await assert.rejects(runtime.tickets.get(context,ids[1]),{code:'TICKET_NOT_FOUND'});
    req.headers['x-csrf-token']=headers['Set-Cookie'][1].split(';')[0].split('=')[1];await runtime.sessions.revoke(req,res);
    await assert.rejects(runtime.engine.bootstrap(req),{code:'SESSION_EXPIRED'});check('persistent logout invalidates prior identity',true);
    throw rollbackSentinel;
  }), error => error === rollbackSentinel);
  const [[ticketsLeft]] = await conn.execute('SELECT COUNT(*) AS n FROM t_ticket WHERE ticket_id IN (?,?,?,?)', ids);
  const [[storeLeft]] = await conn.execute('SELECT COUNT(*) AS n FROM t_tenant_runtime_store WHERE key_hash=?', [crypto.createHash('sha256').update(opaqueKey).digest('hex')]);
  check('transaction rollback removed all inserted test tickets and login state', Number(ticketsLeft.n)===0 && Number(storeLeft.n)===0);
  result.rollbackVerified=true;result.success=true;
} catch (error) {
  result.success=false;result.error=error.code || 'LIVE_PILOT_ASSERTION_FAILED';process.exitCode=1;
} finally {
  if(transactionOpen)await conn.rollback();await conn.end();
  await fs.writeFile(path.join(root,'3.Knowledge/reports/tenant_foundation_2026_10_21/live-pilot.json'),JSON.stringify(result,null,2));
  process.stdout.write(`[TENANT-PILOT][${result.success?'INFO':'ERROR'}] : ${result.checks.length} checks; success=${result.success}; rollback=${result.rollbackVerified}\n`);
}
