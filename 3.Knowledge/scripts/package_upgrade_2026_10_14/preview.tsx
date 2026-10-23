import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@hots/ui-kit';
import { HotsCoreProvider } from '@hots/app-core';
import { UnifiedFormStructureEditor } from '../../../1.Frontend/HOTS/src/components/forms/UnifiedFormStructureEditor';
import { DataTableReportPro } from '../../../1.Frontend/HOTS/src/components/report/DataTableReport';
import { cinevaHttp } from '../../../1.Frontend/HOTS/src/platform/clients';

// Fixture-only adapter. No request from this preview can reach a backend/database.
let rejectNext = false;
cinevaHttp.defaults.adapter = async config => {
  if (rejectNext) { rejectNext = false; throw new Error('Fixture rejected this save'); }
  return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
};
const original: any[] = [
  { id: 'caption', type: 'field', order: 0, data: { name: 'caption', label: 'Caption', type: 'text', required: true, custom_metadata: { preserve: true } } },
  { id: 'content', type: 'section', order: 1, data: { title: 'Talent', fields: [{ name: 'instagram', label: 'Instagram', type: 'text' }], campaign_scope: 'cineva' } },
];
const rows = Array.from({ length: 22 }, (_, index) => ({ ticket: '42', detail: String(index + 1), name: `Talent ${index + 1}`, status: index % 2 ? 'closed' : 'open', Remarks: `Draft ${index + 1}`, Color: index === 0 ? '#fff59d' : '' }));
const columns: any[] = [
  { header: 'Talent', accessor: 'name', sortable: true, filterable: true },
  { header: 'Status', accessor: 'status', filterable: true },
  { header: 'Remarks', accessor: 'Remarks', editable: true },
  { header: 'Color', accessor: 'Color' },
];
function Preview() {
  const [tab, setTab] = useState('builder'), [items, setItems] = useState(original), [data, setData] = useState(rows), [parentSearch, setParentSearch] = useState(false);
  const preserved = items.some(i => i.id === 'caption' && i.data.custom_metadata?.preserve);
  return <HotsCoreProvider appKey="cineva-fixture" config={{ baseUrl: location.origin }} http={cinevaHttp}><main className="max-w-7xl mx-auto p-6 space-y-5">
    <header><h1 className="text-2xl font-bold">Cineva reusable components</h1><p className="text-sm text-muted-foreground">Local integration fixture. All save requests are mocked.</p></header>
    <nav className="flex flex-wrap gap-2"><Button variant={tab === 'builder' ? 'default' : 'outline'} onClick={() => setTab('builder')}>Form builder</Button><Button variant={tab === 'report' ? 'default' : 'outline'} onClick={() => setTab('report')}>Report table</Button></nav>
    {tab === 'builder' ? <><Card><CardHeader><CardTitle>Draft lifecycle</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3 items-center"><Button onClick={() => sessionStorage.setItem('cineva-preview-draft', JSON.stringify(items))}>Save draft locally</Button><Button variant="outline" onClick={() => { const value = sessionStorage.getItem('cineva-preview-draft'); if (value) setItems(JSON.parse(value)); }}>Reload draft</Button><span>{preserved ? 'Custom metadata preserved' : 'Metadata missing'}</span><span>{items.length} elements</span></CardContent></Card><UnifiedFormStructureEditor items={items} onUpdate={setItems} /></>
      : <><Button variant="outline" onClick={() => { rejectNext = true; }}>Fail next save</Button><Button variant="outline" onClick={() => setParentSearch(value => !value)}>{parentSearch ? 'Disable parent search' : 'Use parent search: Talent 21'}</Button><DataTableReportPro title="Talent report" data={data} setData={setData} columns={columns} searchKeys={['name','Remarks']} ticketKey="ticket" detailKey="detail" externalSearch={parentSearch ? 'Talent 21' : undefined} /><p className="text-sm">First row: {data[0].Remarks}. Second row: {data[1].Remarks}.</p></>}
  </main></HotsCoreProvider>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
