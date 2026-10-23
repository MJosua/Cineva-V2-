import crypto from 'node:crypto';
import transactionKit from '../../../../packages/transaction-kit/src/index.js';
import {clone,scopeKey,fail,defaultBrand} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
const {createMysqlAdapter,createTransactionEngine,withNamedLock}=transactionKit;
export const emptyState=scope=>({schema_version:1,scope:clone(scope),revision:0,brand:defaultBrand(),documents:[],accounts:[],targets:[],snapshots:[],usage:{generation:0,render:0,publish:0},reservations:{},operations:{},audit:[],settings:{defaultTemplate:'editorial',favoriteTemplates:[]}});
function check(state,scope){fail(state.schema_version===1&&scopeKey(state.scope)===scopeKey(scope),'STORE_SCOPE_MISMATCH',403);fail(Buffer.byteLength(JSON.stringify(state))<=6000000,'WORKSPACE_SIZE_LIMIT',413);}
/** Test/local adapter. Not selected by production composition. Serialized atomic copy-on-write. */
export function createMemoryStore(){
  const states=new Map();let tail=Promise.resolve();
  return {kind:'memory',async read(scope){await tail;return clone(states.get(scopeKey(scope))??emptyState(scope));},async transact(scope,work){const run=tail.then(async()=>{const key=scopeKey(scope),draft=clone(states.get(key)??emptyState(scope));check(draft,scope);const result=await work(draft);check(draft,scope);states.set(key,clone(draft));return clone(result);});tail=run.catch(()=>{});return run;},async scopes(){await tail;return [...states.values()].map(s=>clone(s.scope));}};
}
/** Existing physical t_document schema, verified 2026-10-22. No DDL or startup writes.
 * Aggregate pilot: bounded workspace JSON, composite entity index; worker pages explicit scopes.
 * Dedicated indexed due-job tables are a future scale migration, not invented here.
 */
export function createMysqlDocumentStore({pool,logger}){
  fail(pool&&logger?.warn,'MYSQL_STORE_CONFIGURATION',503);
  const adapter=createMysqlAdapter(pool),entityType='cineva_content_workspace';
  const hash=scope=>crypto.createHash('sha256').update(scopeKey(scope)).digest('hex').slice(0,48);
  async function transaction(scope,work,write){
    const outer=await adapter.acquire(),key=hash(scope);
    try{return await withNamedLock(outer,`cineva-content:${key}`,async()=>{
      // Lock is held across commit/rollback. The outer owner releases the connection last.
      const engine=createTransactionEngine({adapter:{acquire:async()=>({...outer,release(){}})},logger,maxRetries:0});
      engine.registerType({name:'content.snapshot',async execute(conn){
        const [rows]=await conn.query('SELECT id, snapshot_data FROM t_document WHERE entity_type = ? AND entity_id = ? LIMIT 2 FOR UPDATE',[entityType,key]);
        fail(rows.length<=1,'DUPLICATE_WORKSPACE_SNAPSHOT',409);
        const state=rows.length?(typeof rows[0].snapshot_data==='string'?JSON.parse(rows[0].snapshot_data):rows[0].snapshot_data):emptyState(scope);
        check(state,scope);const result=await work(state,{connection:outer.raw});
        if(write){check(state,scope);const data=JSON.stringify(state);
          if(rows.length)await conn.query('UPDATE t_document SET snapshot_data = ? WHERE id = ? AND entity_type = ? AND entity_id = ?',[data,rows[0].id,entityType,key]);
          else await conn.query('INSERT INTO t_document (entity_type, entity_id, document_source, file_name, template_name, action_origin, snapshot_data, is_virtual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',[entityType,key,'generated_virtual',`${key}.json`,'cineva_content_workspace_v1','cineva_content_studio',data,1]);
        }
        return {result};
      }});
      return (await engine.run('content.snapshot')).result;
    },{timeoutSeconds:3});}finally{outer.release();}
  }
  return {kind:'mysql',read:scope=>transaction(scope,state=>clone(state),false),transact:(scope,work)=>transaction(scope,work,true),
    async scopes({limit=50,offset=0}={}){fail(Number.isSafeInteger(limit)&&limit>0&&limit<=100&&Number.isSafeInteger(offset)&&offset>=0,'INVALID_PAGE');const conn=await adapter.acquire();try{const [rows]=await conn.query('SELECT snapshot_data FROM t_document WHERE entity_type = ? ORDER BY id LIMIT ? OFFSET ?',[entityType,limit,offset]);return rows.map(row=>(typeof row.snapshot_data==='string'?JSON.parse(row.snapshot_data):row.snapshot_data).scope);}finally{conn.release();}}};
}
