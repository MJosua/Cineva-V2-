import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HotsForm } from './HotsForm';
import { createJob, validateDraft, type Job, type JobDraft, type ProjectType } from './model';
import { useWorkspace } from './WorkspaceContext';
import { invalidateBooking } from '../cineva-hq/booking';
export function JobEditor({ open, onClose, job, draft }: {
    open: boolean;
    onClose: () => void;
    job?: Job;
    draft?: Partial<JobDraft>;
}) {
    const { data, mutate, error } = useWorkspace();
    const [problem, setProblem] = useState('');
    if (!data)
        return null;
    const initial = job ?? { title: '', brief: '', clientId: '', type: 'Content Shoot', platform: 'Instagram', scheduledAt: '2026-10-19T14:00', durationHours: 2, fee: 0, barter: 0, ...draft };
    const schema = { title: 'Job', fields: [
            { name: 'title', label: 'Judul', type: 'text', required: true }, { name: 'clientId', label: 'Client', type: 'select', required: true, options: data.clients.map(c => ({ value: c.id, label: c.name })) },
            { name: 'type', label: 'Jenis project', type: 'select', required: true, options: ['Campaign', 'Production', 'Content Shoot'] },
            { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Instagram', 'TikTok', 'YouTube', 'Multi-platform'] },
            { name: 'scheduledAt', label: 'Jadwal (WIB)', type: 'datetime', required: true }, { name: 'durationHours', label: 'Durasi (jam)', type: 'number', required: true, minnumber: 1, maxnumber: 24 },
            { name: 'fee', label: 'Fee cash (Rp)', type: 'number', required: true, minnumber: 0 }, { name: 'barter', label: 'Nilai barter (Rp)', type: 'number', required: true, minnumber: 0 },
            { name: 'brief', label: 'Brief / scope of work', type: 'textarea' },
        ] };
    return <Dialog open={open} onOpenChange={value => { if (!value)
        onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{job ? 'Edit project / job' : 'Tambah project / job'}</DialogTitle><DialogDescription>Data dummy. Jadwal menggunakan Asia/Jakarta; tidak membuat ticket backend.</DialogDescription></DialogHeader>
 {(problem || error) && <p role="alert" className="text-sm text-destructive">{error || problem}</p>}
 <HotsForm schema={schema} initialValues={{ title: initial.title, brief: initial.brief, clientId: initial.clientId, type: initial.type, platform: initial.platform, scheduledAt: initial.scheduledAt, durationHours: initial.durationHours, fee: initial.fee, barter: initial.barter }} submitLabel={job ? 'Simpan perubahan' : 'Buat job dummy'} onSubmit={async (values) => {
            setProblem('');
            const next: JobDraft = { title: String(values.title), brief: String(values.brief ?? ''), clientId: String(values.clientId), type: String(values.type) as ProjectType, platform: String(values.platform), scheduledAt: String(values.scheduledAt), durationHours: Number(values.durationHours), fee: Number(values.fee), barter: Number(values.barter), resourceIds: job?.resourceIds ?? draft?.resourceIds ?? [] };
            const ok = await mutate(current => {
                if (job) {
                    validateDraft(next, current, job.id);
                    if (next.fee < job.paid)
                        throw new Error('Fee tidak boleh lebih kecil dari pembayaran yang sudah diterima.');
                    return { ...current, jobs: current.jobs.map(row => row.id === job.id ? invalidateBooking({ ...row, ...next, serviceWorkflow: row.type === next.type ? row.serviceWorkflow : undefined, booking: row.type === next.type ? row.booking : undefined }) : row) };
                }
                return { ...current, jobs: [...current.jobs, createJob(next, current, crypto.randomUUID())] };
            });
            if (ok)
                onClose();
            else
                setProblem('Belum tersimpan. Periksa pesan validasi pada workspace.');
        }}/></DialogContent></Dialog>;
}
