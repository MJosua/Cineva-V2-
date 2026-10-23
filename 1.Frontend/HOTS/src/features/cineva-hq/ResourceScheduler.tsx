import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { validateDraft } from '../cineva-shared/model';
import { useWorkspace } from '../cineva-shared/WorkspaceContext';
import { confirmBooking, invalidateBooking, roleLabels } from './booking';
import { BookingConfirmation } from './BookingConfirmation';

/** Allocation remains independent from explicit booking confirmation. */
export function ResourceScheduler({ actorId = 'hq-1' }: { actorId?: string }) {
  const { data, mutate, busy, clearError } = useWorkspace();
  const [jobId, setJobId] = useState(''), [date, setDate] = useState('2026-10-19T10:00'), [ids, setIds] = useState<string[]>([]);
  if (!data) return null;
  const job = data.jobs.find(row => row.id === jobId);
  const dirty = Boolean(job && (job.scheduledAt !== date || JSON.stringify([...job.resourceIds].sort()) !== JSON.stringify([...ids].sort())));
  return <Card><CardHeader><CardTitle>Alokasi crew & gear</CardTitle></CardHeader><CardContent className="space-y-4">
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault();
      await mutate(current => {
        const selected = current.jobs.find(row => row.id === jobId);
        if (!selected) throw new Error('Pilih project terlebih dahulu.');
        const next = invalidateBooking({ ...selected, scheduledAt: date, resourceIds: ids });
        validateDraft(next, current, jobId);
        return { ...current, jobs: current.jobs.map(row => row.id === jobId ? next : row) };
      });
    }}>
      <label className="block space-y-2 text-sm">Project<select aria-label="Project untuk alokasi" required value={jobId} onChange={event => {
        clearError(); setJobId(event.target.value); const selected = data.jobs.find(row => row.id === event.target.value);
        if (selected) { setDate(selected.scheduledAt); setIds(selected.resourceIds); }
      }} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Pilih project...</option>{data.jobs.filter(row => !row.archived).map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label>
      <label className="block space-y-2 text-sm">Mulai (WIB)<Input aria-label="Mulai alokasi" type="datetime-local" required value={date} onChange={event => setDate(event.target.value)}/></label>
      <div className="grid gap-3 sm:grid-cols-2">{data.resources.map(resource => {
        let available = Boolean(job), problem = '';
        if (job) try { validateDraft({ ...job, scheduledAt: date, resourceIds: [resource.id] }, data, job.id); }
        catch (failure) { available = false; problem = (failure as Error).message; }
        return <label key={resource.id} className="flex flex-wrap items-center gap-2 text-sm">
          <Checkbox disabled={!job || busy} checked={ids.includes(resource.id)} onCheckedChange={checked => setIds(old => checked ? [...old, resource.id] : old.filter(id => id !== resource.id))}/>
          <span>{resource.name}</span><span className="text-xs text-muted-foreground">{resource.role ? `${roleLabels[resource.role]} · ` : ''}{!job ? 'Pilih project' : available ? 'Tersedia' : 'Bentrok / jadwal tidak valid'}</span>
          {problem && <span className="sr-only">{problem}</span>}
        </label>;
      })}</div>
      <p className="text-xs text-muted-foreground">Ketersediaan mengikuti jadwal dan durasi project. Alokasi yang bentrok ditolak; penyimpanan alokasi belum mengonfirmasi booking.</p>
      <Button disabled={busy}>Simpan alokasi</Button>
    </form>
    {dirty && <p role="status" className="text-sm text-muted-foreground">Ada perubahan alokasi yang belum disimpan. Simpan sebelum mengonfirmasi booking.</p>}
    {job && <BookingConfirmation workspace={data} jobId={job.id} busy={busy || dirty} onConfirm={(id, fingerprint) => { void mutate(current => confirmBooking(current, id, actorId, fingerprint)); }}/>}
  </CardContent></Card>;
}
