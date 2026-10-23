import { useState } from 'react';
import { Sparkles, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '../cineva-shared/WorkspaceContext';
import { JobEditor } from '../cineva-shared/JobEditor';
import { draftFromPrompt } from '../cineva-shared/assistant';
import { demoClock, money, paymentLabel, jobDate, type Job, type JobDraft } from '../cineva-shared/model';
export function PaymentsView({ onSelect }: {
    onSelect: (job: Job) => void;
}) { const { data } = useWorkspace(); if (!data)
    return null; return <section className="space-y-4"><h2 className="text-xl font-semibold">Pembayaran cash & barter</h2><p className="text-sm text-muted-foreground">Catat penerimaan melalui detail job. Pembayaran tidak otomatis menyelesaikan workflow.</p>{data.jobs.map(job => <Card key={job.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><h3 className="font-semibold">{job.title}</h3><p className="mt-1 text-sm text-muted-foreground">Fee {money(job.fee)} · Diterima {money(job.paid)}</p><p className="text-sm">Sisa {money(job.fee - job.paid)} · Barter {money(job.barter)}</p></div><div className="flex items-center gap-3"><Badge variant="secondary">{paymentLabel(job)}</Badge><Button variant="outline" onClick={() => onSelect(job)}>Rincian pembayaran</Button></div></CardContent></Card>)}</section>; }
export function RemindersView({ onSelect }: {
    onSelect: (job: Job) => void;
}) { const { data } = useWorkspace(); if (!data)
    return null; const upcoming = data.jobs.filter(j => !j.archived && j.status !== 'done' && jobDate(j.scheduledAt) >= demoClock).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)); return <section className="space-y-4"><h2 className="text-xl font-semibold">Pengingat jadwal</h2><p className="text-sm text-muted-foreground">Referensi waktu dummy: 18 Oktober 2026, 08.00 WIB. Reminder tampil di aplikasi, tanpa email atau notifikasi eksternal.</p>{upcoming.map(job => <Card key={job.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="flex items-center gap-2 font-medium"><CalendarDays className="h-4 w-4"/>{job.title}</p><p className="mt-1 text-sm text-muted-foreground">{job.scheduledAt.replace('T', ' ')} WIB</p></div><Button variant="outline" onClick={() => onSelect(job)}>Lihat job</Button></CardContent></Card>)}{!upcoming.length && <p className="text-muted-foreground">Tidak ada jadwal mendatang.</p>}</section>; }
export function SubscriptionView() { const { data, mutate, busy } = useWorkspace(); if (!data)
    return null; return <section className="space-y-4"><h2 className="text-xl font-semibold">Paket Creator Space</h2><p className="text-sm text-muted-foreground">Simulasi entitlement frontend. Tidak ada checkout, tagihan atau kontrol akses server di tahap ini.</p><div className="grid gap-4 md:grid-cols-2">{(['starter', 'pro'] as const).map(plan => <Card key={plan}><CardHeader><CardTitle>{plan === 'pro' ? 'Creator Pro' : 'Starter'}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">{plan === 'pro' ? 'Job dummy tanpa batas Starter.' : 'Maksimal 3 job aktif (Running / Wait Pay).'}</p><Badge variant={data.plan === plan ? 'default' : 'outline'}>{data.plan === plan ? 'Paket aktif' : 'Preview paket'}</Badge><div><Button disabled={busy || data.plan === plan} variant={plan === 'pro' ? 'default' : 'outline'} onClick={() => void mutate(current => ({ ...current, plan }))}>{data.plan === plan ? 'Sedang digunakan' : `Simulasikan ${plan === 'pro' ? 'Pro' : 'Starter'}`}</Button></div></CardContent></Card>)}</div></section>; }
export function AssistantView() {
    const { data } = useWorkspace(), [prompt, setPrompt] = useState(''), [draft, setDraft] = useState<JobDraft | null>(null), [error, setError] = useState(''), [open, setOpen] = useState(false);
    if (!data)
        return null;
    return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/>Cineva Assistant</CardTitle></CardHeader><CardContent className="space-y-4"><Badge variant="secondary">Simulasi · bukan local LLM</Badge><p className="text-sm text-muted-foreground">Ubah kalimat menjadi draft terstruktur. Periksa draft sebelum membuat job dummy. “Besok” memakai 18 Oktober 2026 sebagai tanggal referensi.</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setPrompt('Shoot di Navi Cafe besok jam 10 fee 300rb')}>Contoh jadwal shoot</Button></div><form className="space-y-3" onSubmit={e => { e.preventDefault(); setError(''); setDraft(null); try {
        setDraft(draftFromPrompt(prompt, data));
    }
    catch (failure) {
        setError((failure as Error).message);
    } }}><label htmlFor="assistant-prompt" className="text-sm font-medium">Ceritakan pekerjaanmu</label><Textarea id="assistant-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Shoot di Navi Cafe besok jam 10 fee 300rb" maxLength={2000} required/><Button type="submit">Siapkan draft dummy</Button></form>{error && <p role="alert" className="text-destructive">{error}</p>}{draft && <div className="space-y-3 rounded-md border border-border p-4" aria-live="polite"><h3 className="font-semibold">Draft siap diperiksa</h3><p>{draft.title}</p><p className="text-sm">{draft.scheduledAt.replace('T', ' ')} WIB · {money(draft.fee)}</p><Button onClick={() => setOpen(true)}>Periksa & buat job</Button></div>}{open && draft && <JobEditor open draft={draft} onClose={() => setOpen(false)}/>}</CardContent></Card>;
}
