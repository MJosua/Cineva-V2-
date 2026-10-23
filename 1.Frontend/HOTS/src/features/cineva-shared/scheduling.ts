import { checkAvailability, type AvailabilityRequest, type Issue, type Reservation } from '@hots/scheduling-kit';
import type { Job, JobDraft, Workspace } from './model';

/** Vendor adapter: named crew/gear each represent one unit; HOTS kit owns interval policy. */
export function findResourceConflict(draft: JobDraft, workspace: Workspace, excludeId?: string): Job | undefined {
  const ids = [...new Set(draft.resourceIds)];
  if (!ids.length) return undefined;
  const start = new Date(draft.scheduledAt + '+07:00').getTime(), end = start + draft.durationHours * 3600000;
  const resources = ids.map(id => ({ id, capacity: 1 }));
  const requests: AvailabilityRequest[] = ids.map(resourceId => ({ resourceId, start, end, quantity: 1 }));
  const policyConflict = (issues: Issue[]) => {
    const invalid = issues.find(issue => issue.code !== 'CAPACITY_EXCEEDED');
    if (invalid) throw new Error(`Jadwal resource tidak valid: ${invalid.message}`);
    return issues.some(issue => issue.code === 'CAPACITY_EXCEEDED');
  };
  policyConflict(checkAvailability({ resources, reservations: [], requests, now: 0 }));
  // Keep legacy first-conflicting-job order (rather than generic resource/time issue order).
  return workspace.jobs.find((job, index) => {
    if (job.archived || job.id === excludeId) return false;
    const resourceIds = [...new Set(job.resourceIds)].filter(id => ids.includes(id));
    if (!resourceIds.length) return false;
    const jobStart = new Date(job.scheduledAt + '+07:00').getTime(), jobEnd = jobStart + job.durationHours * 3600000;
    // Unparseable legacy dates previously did not match overlap; do not reject unrelated drafts.
    if (!Number.isFinite(jobStart) || !Number.isFinite(jobEnd) || jobEnd <= jobStart) return false;
    const reservations: Reservation[] = resourceIds.map((resourceId, resourceIndex) => ({
      id: `${index}:${resourceIndex}`, resourceId, start: jobStart, end: jobEnd, quantity: 1, status: 'confirmed',
    }));
    return policyConflict(checkAvailability({ resources, reservations, requests, now: 0 }));
  });
}
