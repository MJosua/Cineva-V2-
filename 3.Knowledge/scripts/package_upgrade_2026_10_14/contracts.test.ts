import assert from 'node:assert/strict';
import test from 'node:test';
import { toSharedFormItems, fromSharedFormItems, updateFormData, createSharedPreviewSchema } from '../../../1.Frontend/HOTS/src/components/forms/shared/formAdapter';
import { prepareReportRows, buildReportUpdate, persistReportUpdate, updateMatchingReportRows } from '../../../1.Frontend/HOTS/src/components/report/reportAdapter';
import { createCinevaHttpClient } from '../../../1.Frontend/HOTS/src/platform/httpFactory';
import { createLegacyWorkflowApi } from '../../../1.Frontend/HOTS/src/platform/workflowAdapter';
import { createWorkflowClient, createTriggerClient, createPrefsClient } from '../../../1.Frontend/packages/engine-client/src/index';

const fields: any[] = [
  { id:'s1', type:'section', order:0, data:{ title:'Talent', custom_scope:{company:3}, fields:[{name:'ig',label:'IG',type:'text',rules:[{when:'x'}],autoSaveId:{enabled:true,idProperty:'user_id'}},{name:'tt',label:'TikTok',type:'text'}] } },
  { id:'r1', type:'rowgroup', order:1, data:{title:'Visits',rowGroup:[{id:'1',firstValue:'A'}],structure:{firstColumn:{name:'store',label:'Store'},combinedMapping:'first_second'},maxRows:10} },
  { id:'x1',type:'specialfunc',order:2,data:{title:'Diagram',element_type:'diagram',diagram_data:{nodes:[{id:'n1'}]},uiCondition:'approved'} },
];
test('Builder roundtrip retains item identity and unknown EAV/domain settings',()=>{
  const shared=toSharedFormItems(fields);const back=fromSharedFormItems(shared);assert.deepEqual(back,fields);
  (shared[0].data as any).title='Changed';assert.equal(fields[0].data.title,'Talent');
});
test('Section field edit changes only the selected field and retains siblings/metadata',()=>{
  const next=updateFormData(fields,'s1',{label:'Instagram'},0);assert.equal((next[0].data as any).fields[0].label,'Instagram');
  assert.equal((next[0].data as any).fields[1].label,'TikTok');assert.deepEqual((next[0].data as any).fields[0].autoSaveId,fields[0].data.fields[0].autoSaveId);
  assert.deepEqual(next[1],fields[1]);assert.equal(fields[0].data.fields[0].label,'IG');
});
test('Preview normalization cannot mutate persisted form items',()=>{
  const before=JSON.stringify(fields),schema=createSharedPreviewSchema(fields);assert.ok(schema.items?.length);assert.equal(JSON.stringify(fields),before);
});
const options:any={search:'',searchKeys:['name'],exactFilters:{},tags:[],sortKey:null,sortDirection:null};
test('Legacy exact filters do not match substrings and preserve multi-select OR',()=>{
  const rows=[{name:'A',status:'open'},{name:'B',status:'opened'},{name:'C',status:'closed'}];
  assert.deepEqual(prepareReportRows(rows,{...options,exactFilters:{status:['open','closed']}}).map(r=>r.name),['A','C']);
});
test('Search/sort runs across all rows before a page is sliced',()=>{
  const rows=Array.from({length:25},(_,i)=>({name:'Talent '+(25-i),rank:String(25-i)}));
  const sorted=prepareReportRows(rows,{...options,sortKey:'rank',sortDirection:'asc'});assert.equal(sorted.length,25);assert.equal(sorted[0].rank,'1');assert.equal(sorted.slice(10,20)[0].rank,'11');
  assert.equal(rows[0].rank,'25');assert.equal(prepareReportRows(rows,{...options,search:'Talent 25'}).length,1);
});
test('Shared include/exclude tags combine OR per field and AND across fields',()=>{
  const rows=[{name:'Ann',status:'ready'},{name:'Ben',status:'ready'},{name:'Ann',status:'blocked'}];
  const tags:any=[{key:'name',operator:'include',value:'ann'},{key:'name',operator:'include',value:'ben'},{key:'status',operator:'exclude',value:'blocked'}];
  assert.equal(prepareReportRows(rows,{...options,tags}).length,2);
});
test('Report save keeps legacy and custom endpoint payload contracts',()=>{
  assert.deepEqual(buildReportUpdate('42','9','Remarks','Done','#fff',false),{ticket_id:'42',detail_id:'9',lbl_col:'Remarks',cstm_col:'Done',color_code:'#fff',visible_to:'admin'});
  assert.deepEqual(buildReportUpdate('42','null','Remarks','Done',undefined,true),{ticket_id:'42',field_name:'Remarks',value:'Done',service_id:null,detail_id:null});
});
test('Report updates isolate detail rows that share a ticket ID',()=>{
  const rows=[{ticket:'42',detail:'9',Remarks:'A'},{ticket:'42',detail:'10',Remarks:'B'}];
  const changed=updateMatchingReportRows(rows,'ticket','detail','42','9','Remarks','Done');assert.equal(changed[0].Remarks,'Done');assert.equal(changed[1].Remarks,'B');assert.equal(rows[0].Remarks,'A');
});
const mockTransport=(http:any,body:any={success:true})=>{const calls:any[]=[];http.defaults.adapter=async(config:any)=>{calls.push(config);return {data:body,status:200,statusText:'OK',headers:{},config};};return calls;};
test('Report business rejection on HTTP 200 cannot become a successful cell save',async()=>{
  const http=createCinevaHttpClient(()=>'http://localhost:9911',()=>null);mockTransport(http,{success:false,message:'Field is locked'});
  await assert.rejects(persistReportUpdate(http,'/report/upsert',{value:'Forbidden'}),/Field is locked/);
});
test('Injected transport resolves new URL/token on each request and never sends a null Bearer',async()=>{
  let base='http://localhost:9911',token:string|null='one';const http=createCinevaHttpClient(()=>base,()=>token),calls=mockTransport(http);
  await http.get('/one');base='http://localhost:9912';token='two';await http.get('/two');token=null;await http.get('/three');
  assert.equal(calls[0].baseURL,'http://localhost:9911');assert.equal(calls[1].headers.get('Authorization'),'Bearer two');assert.equal(calls[2].headers.get('Authorization'),undefined);
});
test('App transport rejects third-party credential destinations before the adapter executes',async()=>{
  const http=createCinevaHttpClient(()=>'http://localhost:9911',()=>'secret'),calls=mockTransport(http);
  await assert.rejects(http.get('http://localhost:9912/steal'),/another origin/);assert.equal(calls.length,0);
});
test('Workflow adapter preserves response.data and cleans optional service_id',async()=>{
  const http=createCinevaHttpClient(()=>'http://localhost:9911',()=>null),calls=mockTransport(http,{levels:[{workflow_id:4}]});
  const api=createLegacyWorkflowApi(createWorkflowClient(http));assert.deepEqual((await api.getWorkflow(19)).data,{levels:[{workflow_id:4}]});
  await api.getParams(4);await api.deleteWorkflow(4,19);assert.deepEqual(calls[1].params,{});assert.deepEqual(calls[2].params,{service_id:19});
});
test('Engine client errors keep status/message and do not return false success',async()=>{
  const http=createCinevaHttpClient(()=>'http://localhost:9911',()=>null);mockTransport(http,{success:false,message:'Rejected'});
  await assert.rejects(createLegacyWorkflowApi(createWorkflowClient(http)).addWorkflow({}),e=>(e as any).message==='Rejected'&&(e as any).ok===false);
});
test('Trigger list/execution preserve Cineva query and payload contracts',async()=>{
  const http=createCinevaHttpClient(()=>'http://localhost:9911',()=>null),calls=mockTransport(http,{success:true,data:[]}),trigger=createTriggerClient(http);
  await trigger.list({category:'talent',function_type:'sql',is_active:'true'});await trigger.execute('get_summary',{ticketId:'42'});
  assert.deepEqual(calls[0].params,{category:'talent',function_type:'sql',is_active:'true'});assert.deepEqual(JSON.parse(calls[1].data),{params:{ticketId:'42'}});
});

test('Trigger deprecated alias normalizes once; canonical key wins without mutating caller',async()=>{
  const http=createCinevaHttpClient(()=>'http://localhost:9911',()=>null),calls=mockTransport(http,{success:true,data:[]}),trigger=createTriggerClient(http);
  const filter = {type:'sql',category:'talent',search:'dummy',is_active:false} as const;
  await trigger.list(filter);
  await trigger.list({type:'sql',function_type:'handler',is_active:true});
  await trigger.list();
  assert.deepEqual(calls[0].params,{category:'talent',search:'dummy',function_type:'sql',is_active:'false'});
  assert.deepEqual(calls[1].params,{function_type:'handler',is_active:'true'});
  assert.deepEqual(calls[2].params,{});assert.equal(filter.type,'sql');assert.equal(filter.is_active,false);
});

test('Trigger categories unwrap structured category counts and business failures reject',async()=>{
  const http=createCinevaHttpClient(()=>'http://localhost:9911',()=>null),trigger=createTriggerClient(http);
  mockTransport(http,{success:true,data:[{category:'dummy',count:2}]});
  const categories=await trigger.categories();assert.equal(categories[0].category,'dummy');assert.equal(categories[0].count,2);
  mockTransport(http,{success:false,message:'Dummy access denied'});
  await assert.rejects(trigger.categories(),/Dummy access denied/);
});
test('Preference client preserves category/value and card settings payloads',async()=>{
  const http=createCinevaHttpClient(()=>'http://localhost:9911',()=>null),calls=mockTransport(http),prefs=createPrefsClient(http);
  await prefs.set('report','layout',{columns:['name']});await prefs.saveCardPreview(4,{visible:true});
  assert.equal(calls[0].url,'/hotsprefs/report/layout');assert.deepEqual(JSON.parse(calls[0].data),{value:{columns:['name']}});assert.deepEqual(JSON.parse(calls[1].data),{settings:{visible:true}});
});
