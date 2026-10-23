import { validateDraft, type Job, type Resource, type Workspace } from '../cineva-shared/model';

export type SpecialistRole = 'photographer' | 'videographer';
export interface BookingRecord { fingerprint: string; confirmedAt: string; confirmedBy: string }
export type BookingJob = Job & { requiredRoles?: SpecialistRole[]; booking?: BookingRecord };
export type BookingResource = Resource & { role?: SpecialistRole };
export const roleLabels: Record<SpecialistRole, string> = { photographer: 'Fotografer', videographer: 'Videografer' };

/** Schedule and allocation snapshot, not a DB identifier or security token. */
export function allocationFingerprint(job: BookingJob): string {
  return JSON.stringify([job.scheduledAt, job.durationHours, [...job.resourceIds].sort(), [...(job.requiredRoles ?? [])].sort()]);
}
export function isBookingCurrent(job: BookingJob): boolean {
  return Boolean(job.booking && job.booking.fingerprint === allocationFingerprint(job));
}
export function invalidateBooking<T extends BookingJob>(job: T): T {
  return job.booking && !isBookingCurrent(job) ? { ...job, booking: undefined } : job;
}
export function validateBooking(workspace: Workspace, jobId: string): BookingJob {
  if (workspace.product !== 'hq') throw new Error('Booking resource hanya tersedia di HQ.');
  const job = workspace.jobs.find(row => row.id === jobId) as BookingJob | undefined;
  if (!job || job.archived || job.status === 'done') throw new Error('Pilih project aktif untuk booking.');
  validateDraft(job, workspace, job.id);
  if (!job.resourceIds.length) throw new Error('Alokasikan crew dan resource sebelum konfirmasi booking.');
  if (new Set(job.resourceIds).size !== job.resourceIds.length) throw new Error('Resource yang sama tidak boleh dialokasikan dua kali.');
  const resources = workspace.resources as BookingResource[];
  for (const role of job.requiredRoles ?? []) {
    if (!Object.prototype.hasOwnProperty.call(roleLabels, role)) throw new Error('Kebutuhan spesialis tidak valid.');
    if (!resources.some(resource => job.resourceIds.includes(resource.id) && resource.kind === 'crew' && resource.role === role))
      throw new Error(`Alokasikan ${roleLabels[role]} yang tersedia sebelum konfirmasi booking.`);
  }
  return job;
}
export function confirmBooking(workspace: Workspace, jobId: string, actorId: string,
  expectedFingerprint: string, at = new Date().toISOString()): Workspace {
  const job = validateBooking(workspace, jobId);
  if (!actorId.trim() || !Number.isFinite(Date.parse(at))) throw new Error('Agen dan waktu konfirmasi wajib valid.');
  if (allocationFingerprint(job) !== expectedFingerprint) throw new Error('Jadwal atau resource berubah. Periksa alokasi terbaru sebelum konfirmasi.');
  if (isBookingCurrent(job)) return workspace;
  const confirmed: BookingJob = { ...job, booking: { fingerprint: expectedFingerprint, confirmedAt: at, confirmedBy: actorId } };
  return { ...workspace, jobs: workspace.jobs.map(row => row.id === jobId ? confirmed : row) };
}
