import { useState } from 'react';
import { CalendarDays, ArrowUpRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { money, jobDate, paymentLabel, statusLabels, type Job } from './model';
import { useWorkspace } from './WorkspaceContext';
import { JobEditor } from './JobEditor';
export function JobCards({ onSelect, archived = false, onlyDate, compact = false }: {
    onSelect: (job: Job) => void;
    archived?: boolean;
    onlyDate?: string;
    compact?: boolean;
}) {
    const { data } = useWorkspace();
    const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [create, setCreate] = useState(false);
    if (!data)
        return null;
    const rows = data.jobs.filter(j => j.archived === archived && (!onlyDate || j.scheduledAt.startsWith(onlyDate)) && (status === 'all' || j.status === status) && `${j.title} ${j.brief} ${data.clients.find(c => c.id === j.clientId)?.name}`.toLowerCase().includes(search.toLowerCase()));
    return <section className="space-y-4" aria-label="Daftar project dan kolaborasi"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{archived ? 'Arsip selesai' : data.product === 'hq' ? 'Daftar project' : 'Kolaborasi kamu'} <span className="text-muted-foreground">{rows.length}</span></h2>{!archived && <Button onClick={() => setCreate(true)}><Plus className="mr-2 h-4 w-4"/>Tambah job</Button>}</div>
 <Input aria-label="Cari project atau brand" placeholder="Cari brand, project atau brief..." value={search} onChange={e => setSearch(e.target.value)}/>
 <Tabs value={status} onValueChange={setStatus}><TabsList className="flex h-auto flex-wrap justify-start"><TabsTrigger value="all">Semua</TabsTrigger>{Object.entries(statusLabels).map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}</TabsList></Tabs>
 <div className={`grid gap-4 ${compact ? '' : 'xl:grid-cols-2'}`}>{rows.map(job => <Card key={job.id} data-testid="job-card" data-cineva-surface="job"><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{data.clients.find(c => c.id === job.clientId)?.name}</p><h3 className="mt-1 break-words text-lg font-semibold">{job.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.brief}</p></div><Badge variant="secondary" className="shrink-0">{job.type}</Badge></div><div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4"/>{jobDate(job.scheduledAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB<span>· {job.platform}</span></div><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{money(job.fee)}</p>{job.barter > 0 && <p className="text-xs text-muted-foreground">Barter {money(job.barter)}</p>}</div><div className="flex gap-2"><Badge variant="outline">{statusLabels[job.status]}</Badge><Badge variant="secondary">{paymentLabel(job)}</Badge></div></div><Button variant="outline" className="w-full" onClick={() => onSelect(job)}>Buka detail<ArrowUpRight className="ml-2 h-4 w-4"/></Button></CardContent></Card>)}</div>
 {!rows.length && <Card><CardContent className="p-8 text-center text-muted-foreground">Tidak ada job yang cocok. Ubah pencarian atau tambah job dummy.</CardContent></Card>}
 {create && <JobEditor open onClose={() => setCreate(false)}/>}
 </section>;
}
