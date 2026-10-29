import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createContentClient}=require('../../reports/package_promotion_2026_10_29/content.cjs');
const {createTriggerClient}=require('../../reports/package_promotion_2026_10_29/trigger.cjs');
test('content uses existing transport, context and envelope',async()=>{
 const seen=[];const client=createContentClient({request:async r=>{seen.push(r);return {status:200,data:{success:true,data:{saved:true}}};}},{context:()=> 'ctx-a'});
 assert.deepEqual(await client.command({command:'document.create'}),{saved:true});
 assert.equal(seen[0].url,'/api/content/v1/commands');assert.equal(seen[0].headers['X-Workspace-Context'],'ctx-a');assert.equal(seen[0].headers.Authorization,undefined);
});
test('late content responses reject after context switch',async()=>{
 let context='a',resolve;const client=createContentClient({request:()=>new Promise(r=>resolve=r)},{context:()=>context});
 const pending=client.read();context='b';resolve({status:200,data:{success:true,data:{company:'a'}}});await assert.rejects(pending,{code:'STALE_CONTENT_CONTEXT'});
});
test('no context or remote base path never reaches network',async()=>{
 let calls=0;const http={request:async()=>calls++};await assert.rejects(createContentClient(http,{context:()=>null}).read(),{code:'CONTENT_CONTEXT_REQUIRED'});
 assert.throws(()=>createContentClient(http,{context:()=> 'a',basePath:'https://invalid.example'}),/Invalid content API path/);assert.equal(calls,0);
});
test('existing canonical trigger filter, false boolean and category DTO survive promotion',async()=>{
 const seen=[];const client=createTriggerClient({request:async r=>{seen.push(r);return {status:200,data:{success:true,data:[{category:null,count:2}]}};}});
 await client.list({type:'legacy',function_type:'sql',is_active:false,search:'active'});
 assert.deepEqual(seen[0].params,{function_type:'sql',is_active:'false',search:'active'});
 assert.deepEqual(await client.categories(),[{category:null,count:2}]);
});
test('existing trigger execution returns complete body',async()=>{
 const body={success:true,data:[{value:3}],rowCount:1};const client=createTriggerClient({request:async()=>({status:200,data:body})});
 assert.deepEqual(await client.execute('sample',{}),body);
});
