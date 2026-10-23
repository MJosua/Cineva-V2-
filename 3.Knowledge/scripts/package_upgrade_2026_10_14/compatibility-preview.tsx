import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { UnifiedFormStructureBuilder, type DynamicFormItem } from '@hots/dynamic-form';
import { HotsCoreProvider } from '@hots/app-core';
import { useTriggerFunctionList } from '../../../1.Frontend/HOTS/src/hooks/useTriggerFunction';
import type { TriggerFunctionFilter } from '@hots/engine-client';
import { cinevaHttp } from '../../../1.Frontend/HOTS/src/platform/clients';
import { DataTableReportPro } from '../../../1.Frontend/HOTS/src/components/report/DataTableReport';
import { UnifiedFormStructureEditor } from '../../../1.Frontend/HOTS/src/components/forms/UnifiedFormStructureEditor';
import { SelectionGroupingPreview } from '../table_refactor_2026_10_18/SelectionGroupingPreview';

// All data is synthetic. The E2E runner intercepts API traffic and denies external requests.
const initial: DynamicFormItem[] = [
  {id:'dummy-caption',type:'field',data:{type:'text',name:'caption',label:'Dummy caption',custom_metadata:{keep:true}}},
  {id:'dummy-legacy',type:'field',data:{type:'legacy-dummy',name:'legacy',label:'Dummy legacy',custom_metadata:{keep:'legacy'},rules:[{dummy:true}]}},
  {id:'dummy-container',type:'section',data:{title:'Dummy section',fields:[],domain_metadata:{keep:true}}},
];
const dummyRows=Array.from({length:22},(_,i)=>({ticket:'dummy-42',detail:String(i+1),name:`Dummy talent ${i+1}`,status:i%2?'closed':'open',Remarks:`Draft ${i+1}`}));
const columns=[{header:'Talent',accessor:'name',sortable:true},{header:'Status',accessor:'status',filterable:true},{header:'Remarks',accessor:'Remarks',editable:true}];
function Preview(){
 const [items,setItems]=useState(initial),[policy,setPolicy]=useState('text'),[custom,setCustom]=useState(false);
 const [filter,setFilter]=useState<TriggerFunctionFilter>({category:'dummy',type:'sql'});
 const {functions,categories,loading}=useTriggerFunctionList(filter);
 const [data,setData]=useState(dummyRows),[external,setExternal]=useState(false);
 const [hostItems,setHostItems]=useState<any[]>([{id:'host-caption',type:'field',data:{name:'host_caption',label:'Host caption',type:'text',custom_metadata:{keep:true}}}]);
 const allowedFieldTypes=policy==='all'?undefined:policy==='empty'?[]:[policy];
 return <HotsCoreProvider appKey="cineva-dummy-compatibility" config={{baseUrl:location.origin}} http={cinevaHttp}><main style={{padding:24}}>
  <h1>Cineva component compatibility — dummy data only</h1>
  <section data-testid="trigger"><h2>Trigger hook</h2>
   <button onClick={()=>setFilter({category:'dummy',type:'sql'})}>Legacy alias</button>
   <button onClick={()=>setFilter({category:'dummy',type:'sql',function_type:'handler',search:'dummy handler',is_active:false})}>Canonical filter</button>
   <pre data-testid="trigger-state">{JSON.stringify({loading,functions,categories})}</pre>
  </section>
  <section data-testid="builder"><h2>Shared builder</h2>
   {['text','number','empty','all'].map(value=><button key={value} onClick={()=>setPolicy(value)}>Policy {value}</button>)}
   <button onClick={()=>setCustom(value=>!value)}>Toggle custom inspector</button>
   <button onClick={()=>sessionStorage.setItem('dummy-form',JSON.stringify(items))}>Save dummy draft</button>
   <button onClick={()=>setItems(JSON.parse(sessionStorage.getItem('dummy-form')||'[]'))}>Reload dummy draft</button>
   <UnifiedFormStructureBuilder items={items} onUpdate={setItems} allowedFieldTypes={allowedFieldTypes} renderPreview={()=>null}
    renderFieldEditor={custom?props=><div data-testid="custom-policy">{JSON.stringify(props.allowedFieldTypes)}</div>:undefined}/>
   <pre data-testid="form-state">{JSON.stringify(items)}</pre>
  </section>
  <section data-testid="host-builder"><h2>Cineva host builder</h2><UnifiedFormStructureEditor items={hostItems} onUpdate={setHostItems}/><pre data-testid="host-state">{JSON.stringify(hostItems)}</pre></section>
  <section data-testid="report"><h2>Report adapter</h2><button onClick={()=>setExternal(value=>!value)}>Toggle parent search</button>
   <DataTableReportPro title="Dummy report" data={data} setData={setData} columns={columns} searchKeys={['name','Remarks']} ticketKey="ticket" detailKey="detail" externalSearch={external?'Dummy talent 21':undefined}/>
   <pre data-testid="report-state">{JSON.stringify(data)}</pre>
  </section>
 <SelectionGroupingPreview/>
 </main></HotsCoreProvider>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
