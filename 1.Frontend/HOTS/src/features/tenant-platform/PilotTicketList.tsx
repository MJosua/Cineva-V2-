import {useEffect, useState} from 'react';
import {useTenantClient, useActiveWorkspace} from '@hots/tenant-client';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
type Ticket = {ticket_id: string; title: string | null; status_id: number | null};

/** Scoped client cancels old reads; render also binds state to exact context ID. */
export function PilotTicketList() {
 const client = useTenantClient(), workspace = useActiveWorkspace();
 const id = workspace?.context.tenant_key === 'hots' ? workspace.context_id : null;
 const [result, setResult] = useState<{id: string; rows: Ticket[]; total: number; error?: string} | null>(null);
 useEffect(() => {
  let active = true;
  if (id) client.request('/tickets').then(data => {
   if (active) setResult({id, rows: data.rows, total: data.total});
  }).catch(() => {
   if (active) setResult({id, rows: [], total: 0, error: 'Ticket belum tersedia untuk akses perusahaan ini.'});
  });
  return () => {active = false;};
 }, [client, id]);
 if (!id) return null;
 const current = result?.id === id ? result : null;
 return <Card><CardHeader><CardTitle>Ticket perusahaan</CardTitle></CardHeader><CardContent>
  {!current && <p role="status">Memuat ticket…</p>}
  {current?.error && <p role="alert">{current.error}</p>}
  {current && !current.error && <>
   <p>{current.total} ticket tersedia. Menampilkan hingga 25 ticket.</p>
   {current.rows.length === 0 && <p>Belum ada ticket yang tersedia.</p>}
   <ul className="divide-y">{current.rows.map(ticket => <li key={ticket.ticket_id} className="py-3"><p className="font-medium">{ticket.title || 'Tanpa judul'}</p><p className="text-sm text-muted-foreground">{ticket.ticket_id}</p></li>)}</ul>
  </>}
 </CardContent></Card>;
}
