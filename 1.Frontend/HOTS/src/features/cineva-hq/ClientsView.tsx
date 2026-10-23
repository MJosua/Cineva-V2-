import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { HotsForm } from '../cineva-shared/HotsForm';
import { useWorkspace } from '../cineva-shared/WorkspaceContext';
export function ClientsView() {
    const { data, mutate } = useWorkspace(), [open, setOpen] = useState(false), [search, setSearch] = useState(''), [error, setError] = useState('');
    if (!data)
        return null;
    return <section className="space-y-4"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-semibold">Brand & client CRM</h2><Button onClick={() => setOpen(true)}>Tambah client</Button></div><Input aria-label="Cari client" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari brand atau kontak..."/><div className="grid gap-4 md:grid-cols-2">{data.clients.filter(c => `${c.name} ${c.contact}`.toLowerCase().includes(search.toLowerCase())).map(client => <Card key={client.id}><CardContent className="space-y-2 p-5"><h3 className="font-semibold">{client.name}</h3><p className="text-sm text-muted-foreground">{client.contact} · {client.email}</p><p className="text-sm">{data.jobs.filter(j => j.clientId === client.id).length} project</p></CardContent></Card>)}</div>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Client baru</DialogTitle><DialogDescription>Kontak dummy hanya disimpan pada browser ini.</DialogDescription></DialogHeader>{error && <p role="alert" className="text-destructive">{error}</p>}<HotsForm schema={{ title: 'Client', fields: [{ name: 'name', label: 'Nama brand', type: 'text', required: true }, { name: 'contact', label: 'Kontak PIC', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }] }} submitLabel="Simpan client" onSubmit={async (values) => { setError(''); const name = String(values.name).trim(); if (data.clients.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        setError('Nama client sudah ada.');
        return;
    } if (await mutate(current => ({ ...current, clients: [...current.clients, { id: crypto.randomUUID(), name, contact: String(values.contact).trim(), email: String(values.email).trim() }] })))
        setOpen(false); }}/></DialogContent></Dialog></section>;
}
