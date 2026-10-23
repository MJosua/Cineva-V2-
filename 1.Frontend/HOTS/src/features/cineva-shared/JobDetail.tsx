import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { addPayment, money, paymentLabel, statusLabels, type JobStatus } from './model';
import { useWorkspace } from './WorkspaceContext';
import { JobEditor } from './JobEditor';
import { ServiceWorkflow } from '../cineva-services/ServiceWorkflow';
import { transitionServiceWorkflow } from '../cineva-services/workflow';
import { QuoteBreakdown } from '../cineva-services/QuoteBreakdown';
export function JobDetail({ id, onClose }: {
    id: string;
    onClose: () => void;
}) {
    const { data, busy, error, mutate } = useWorkspace(), [editing, setEditing] = useState(false), [amount, setAmount] = useState(''), [deliverable, setDeliverable] = useState('');
    const job = data?.jobs.find(row => row.id === id);
    if (!job)
        return null;
    const status = (next: JobStatus) => mutate(current => ({ ...current, jobs: current.jobs.map(row => row.id === id ? { ...row, status: next } : row) }));
    return <><Dialog open={!editing} onOpenChange={open => { if (!open && !editing)
        onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{job.title}</DialogTitle><DialogDescription>{job.ticketId} · ticket dummy · {job.type}</DialogDescription></DialogHeader><p className="text-sm text-muted-foreground">{job.brief}</p>
 <ServiceWorkflow type={job.type} state={job.serviceWorkflow} busy={busy} readOnly={job.archived} onAdvance={next => mutate(current => ({ ...current, jobs: current.jobs.map(row => row.id === id ? { ...row, serviceWorkflow: transitionServiceWorkflow(row.type, row.serviceWorkflow, next.stage) } : row) }))}/>
 {job.sourceQuote && <details className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Penawaran yang disetujui untuk project</summary><QuoteBreakdown quote={job.sourceQuote} testId={false}/></details>}
 <label className="space-y-2 text-sm font-medium">Status pekerjaan<select aria-label="Status pekerjaan" className="h-10 w-full rounded-md border border-input bg-background px-3" value={job.status} disabled={busy} onChange={e => void status(e.target.value as JobStatus)}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
 <div className="rounded-md border border-border p-4 text-sm"><p>Fee {money(job.fee)} · Barter {money(job.barter)}</p><p className="mt-2">Diterima {money(job.paid)} · Sisa {money(job.fee - job.paid)}</p><p className="mt-2 font-medium">Pembayaran: {paymentLabel(job)}</p></div>
 {job.paid < job.fee && <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); if (await mutate(current => ({ ...current, jobs: current.jobs.map(row => row.id === id ? addPayment(row, Number(amount)) : row) })))
        setAmount(''); }}><label htmlFor="payment-amount" className="text-sm font-medium">Catat pembayaran dummy (Rp)</label><div className="flex gap-2"><Input id="payment-amount" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required/><Button type="submit" disabled={busy}>Catat</Button></div></form>}
 <section className="space-y-2"><h3 className="text-sm font-semibold">Deliverables</h3><p className="text-xs text-muted-foreground">Preview konten CMS lokal; tidak mengunggah file atau mempublikasikan halaman.</p><ul className="list-inside list-disc text-sm">{job.deliverables.map((text, i) => <li key={i}>{text}</li>)}</ul><form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); const text = deliverable.trim(); if (text && await mutate(current => ({ ...current, jobs: current.jobs.map(row => row.id === id ? { ...row, deliverables: [...row.deliverables, text] } : row) })))
        setDeliverable(''); }}><Input aria-label="Catatan deliverable" value={deliverable} onChange={e => setDeliverable(e.target.value)} placeholder="Catatan deliverable dummy" maxLength={500}/><Button variant="outline" disabled={busy || !deliverable.trim()}>Tambah</Button></form></section>
 {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
 <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setEditing(true)}>Edit job</Button><Button variant="outline" disabled={busy} onClick={async () => { if (await mutate(current => ({ ...current, jobs: current.jobs.map(row => row.id === id ? { ...row, archived: !row.archived } : row) })))
        onClose(); }}>{job.archived ? 'Pulihkan dari arsip' : 'Arsipkan job'}</Button></div>
 </DialogContent></Dialog>{editing && <JobEditor open job={job} onClose={() => setEditing(false)}/>}</>;
}
