import { Button } from '@/components/ui/button';
import type { Workspace } from '../cineva-shared/model';
import { allocationFingerprint, isBookingCurrent, roleLabels, validateBooking, type BookingJob } from './booking';

export function BookingConfirmation({ workspace, jobId, onConfirm, busy = false }: {
  workspace: Workspace; jobId: string; onConfirm: (id: string, fingerprint: string) => void; busy?: boolean;
}) {
  const job = workspace.jobs.find(row => row.id === jobId) as BookingJob | undefined;
  if (!job) return null;
  let reason = '';
  try { validateBooking(workspace, jobId); } catch (error) { reason = (error as Error).message; }
  const current = isBookingCurrent(job), confirmed = current && !reason;
  return <section className="space-y-2 rounded-md border border-border p-3" aria-label="Konfirmasi booking">
    <h3 className="font-semibold">Konfirmasi booking resource</h3>
    <p className="text-sm">{job.scheduledAt.replace('T', ' ')} WIB · {job.durationHours} jam</p>
    <p className="text-sm">Kebutuhan spesialis: {job.requiredRoles?.length ? job.requiredRoles.map(role => roleLabels[role] ?? role).join(', ') : 'Tidak ditentukan'}</p>
    <p className="text-sm">Resource: {job.resourceIds.map(id => workspace.resources.find(resource => resource.id === id)?.name ?? id).join(', ') || 'Belum dialokasikan'}</p>
    <p role="status">{confirmed ? `Booking dikonfirmasi oleh ${job.booking?.confirmedBy}.` : job.booking ? 'Konfirmasi tidak berlaku. Periksa perubahan jadwal dan resource.' : 'Alokasi belum menjadi booking terkonfirmasi.'}</p>
    {reason && <p className="text-sm text-destructive">{reason}</p>}
    <Button type="button" disabled={busy || confirmed || Boolean(reason)} onClick={() => onConfirm(job.id, allocationFingerprint(job))}>Konfirmasi booking</Button>
    <p className="text-xs text-muted-foreground">Perubahan jadwal, durasi atau resource memerlukan konfirmasi ulang. Simulasi lokal, tanpa notifikasi eksternal.</p>
  </section>;
}
