import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMysqlDocumentStore} from '../../../2.Backend/Integrated-API/app/modules/content-studio/store.mjs';
import {createArticleExtractor} from '../../../2.Backend/Integrated-API/app/modules/content-studio/extractor.mjs';
import {tenantContentAuthorization} from '../../../2.Backend/Integrated-API/app/modules/content-studio/runtime.mjs';
const scope={tenant_key:'cineva',kind:'company',company_id:1},logger={warn(){}};
function fakePool(){
  let rows=[],next=1;const locks=new Map(),events=[];
  return {events,rows:()=>structuredClone(rows),getConnection:async()=>{
    let snapshot,unlock;
    return {async beginTransaction(){events.push('begin');snapshot=structuredClone(rows);},async commit(){events.push('commit');rows=snapshot;},async rollback(){events.push('rollback');},release(){events.push('release');},async query(sql,params){
      if(sql.includes('GET_LOCK')){const previous=locks.get(params[0])??Promise.resolve();let release;const gate=new Promise(r=>release=r);locks.set(params[0],previous.then(()=>gate));await previous;unlock=release;events.push('lock');return [[{acquired:1}]];}
      if(sql.includes('RELEASE_LOCK')){events.push('unlock');unlock();return [[{released:1}]];}
      if(sql.startsWith('SELECT id,'))return [snapshot.filter(r=>r.entity_type===params[0]&&r.entity_id===params[1]).slice(0,2)];
      if(sql.startsWith('SELECT snapshot_data'))return [rows.filter(r=>r.entity_type===params[0]).slice(params[2],params[2]+params[1])];
      if(sql.startsWith('INSERT')){snapshot.push({id:next++,entity_type:params[0],entity_id:params[1],snapshot_data:params[6]});return [{insertId:next-1}];}
      if(sql.startsWith('UPDATE')){const row=snapshot.find(r=>r.id===params[1]);row.snapshot_data=params[0];return [{affectedRows:1}];}
      throw new Error(`Unexpected SQL: ${sql}`);
    }};
  }};
}
test('MySQL adapter holds scope lock until commit and reconstructs saved JSON after service recreation',async()=>{const pool=fakePool(),a=createMysqlDocumentStore({pool,logger});await a.transact(scope,s=>{s.revision=3;});const b=createMysqlDocumentStore({pool,logger});assert.equal((await b.read(scope)).revision,3);assert.equal(pool.rows().length,1);assert(pool.events.indexOf('commit')<pool.events.indexOf('unlock'));assert(pool.events.indexOf('unlock')<pool.events.indexOf('release'));});
test('MySQL adapter rolls back callback failure with lock and connection released',async()=>{const pool=fakePool(),store=createMysqlDocumentStore({pool,logger});await store.transact(scope,s=>s.revision=1);await assert.rejects(()=>store.transact(scope,s=>{s.revision=9;throw new Error('fail');}),/fail/);assert(pool.events.includes('rollback'));assert.equal((await store.read(scope)).revision,1);});
test('two independent MySQL adapters serialize scope snapshot creation without duplicate rows',async()=>{const pool=fakePool(),a=createMysqlDocumentStore({pool,logger}),b=createMysqlDocumentStore({pool,logger});await Promise.all([a.transact(scope,async s=>{await new Promise(r=>setImmediate(r));s.revision++;}),b.transact(scope,s=>s.revision++)]);assert.equal(pool.rows().length,1);assert.equal((await a.read(scope)).revision,2);});
test('worker scope enumeration is explicitly paginated at 100 and never accepts unbounded limit',async()=>{const store=createMysqlDocumentStore({pool:fakePool(),logger});await assert.rejects(()=>store.scopes({limit:101}),/INVALID_PAGE/);assert.deepEqual(await store.scopes({limit:50,offset:0}),[]);});
test('article extractor rejects unsupported hosts, credentials, non-HTTPS, and private DNS',async()=>{let calls=0;const extractor=createArticleExtractor({hosts:['news.example'],lookup:async()=>({address:'127.0.0.1'}),request:()=>{calls++;}});for(const url of ['http://news.example/','https://other.example/','https://u:p@news.example/'])await assert.rejects(()=>extractor.extract(url),/SOURCE_HOST_UNSUPPORTED/);await assert.rejects(()=>extractor.extract('https://news.example/article'),/SOURCE_NETWORK_FORBIDDEN/);assert.equal(calls,0);});
test('tenant authorization does not assume permissions exist on the public context DTO',async()=>{const granted=['content.read','content.write'];const authorize=tenantContentAuthorization({engine:{async authorize(_req,_id,permission){if(!granted.includes(permission))throw Object.assign(new Error('Denied'),{status:403});return {tenant_key:'cineva',company_id:1,user_id:'7'};}}});const result=await authorize({headers:{'x-workspace-context':'opaque'}},'content.write');assert.deepEqual(result.actor.permissions,['content.write','content.read']);assert.equal(result.actor.id,'7');});
