import test from 'node:test';
import assert from 'node:assert/strict';
import { changeSupport, filterSupportQueue, supportQueueCounts, type SupportInquiry } from '../../../1.Frontend/HOTS/src/features/cineva-support/assignment';
import { allocationFingerprint, confirmBooking, invalidateBooking, isBookingCurrent, type BookingJob, type BookingResource } from '../../../1.Frontend/HOTS/src/features/cineva-hq/booking';
import type { Workspace } from '../../../1.Frontend/HOTS/src/features/cineva-shared/model';
const hq = { id: 'hq-1', product: 'hq' as const }, creator = { id: 'creator-1', product: 'creator' as const };
function inquiry(): SupportInquiry {
  return { id: 'request', owner: creator.id, destination: hq.id, type: 'Production', brief: { title: 'Graduation', brand: 'Dummy' },
    status: 'submitted', quote: { revision: 1, rateVersion: 'DUMMY-1', items: [], total: 0 }, support: 'ai', messages: [] };
}
function workspace(): Workspace {
  const resources: BookingResource[] = [{ id: 'photo', name: 'Foto dummy', kind: 'crew', role: 'photographer' }, { id: 'video', name: 'Video dummy', kind: 'crew', role: 'videographer' }];
  const job: BookingJob = { id: 'job', ticketId: 'DUMMY-job', clientId: 'client', title: 'Shoot dummy', brief: '', type: 'Production', status: 'running', platform: 'Instagram',
    scheduledAt: '2026-10-22T10:00', durationHours: 2, fee: 0, paid: 0, barter: 0, archived: false, deliverables: [], resourceIds: ['photo'], requiredRoles: ['photographer'] };
  return { product: 'hq', plan: 'starter', clients: [{ id: 'client', name: 'Dummy', contact: '', email: '' }], resources, jobs: [job] };
}
test('CS queues scope workspace before searching/filtering and count waiting independently', () => {
  const waiting = changeSupport(inquiry(), creator, 'waiting', { eventId: 'handover' });
  const rows = [waiting, { ...waiting, id: 'other', destination: 'hq-2', owner: 'creator-2' }];
  assert.equal(supportQueueCounts(rows, hq).waiting, 1);
  assert.equal(filterSupportQueue(rows, hq, { search: 'GRADUATION', mode: 'waiting', agent: '' }).length, 1);
  assert.equal(filterSupportQueue(rows, hq, { search: '', mode: 'human', agent: '' }).length, 0);
});
test('CS assignment records handover, reassignment, resolve and explicit return to AI', () => {
  let row = changeSupport(inquiry(), creator, 'waiting', { eventId: 'one' });
  row = changeSupport(row, hq, 'human', { agent: 'Agent A', eventId: 'two' });
  row = changeSupport(row, hq, 'human', { agent: 'Agent B', eventId: 'three' });
  assert.equal(row.supportEvents?.at(-1)?.previousAgent, 'Agent A');
  assert.equal(filterSupportQueue([row], hq, { search: '', mode: 'all', agent: 'Agent B' }).length, 1);
  assert.throws(() => changeSupport(row, creator, 'human', { agent: 'Fake' }));
  assert.throws(() => changeSupport(row, { ...hq, id: 'hq-2' }, 'resolved'));
  row = changeSupport(row, hq, 'resolved', { eventId: 'four' });
  row = changeSupport(row, creator, 'ai', { eventId: 'five' });
  assert.equal(row.agent, undefined); assert.equal(row.supportEvents?.length, 5);
  assert.equal(changeSupport(row, creator, 'ai'), row);
});
test('Booking explicitly confirms and preserves legacy allocations without role requirements', () => {
  const data = workspace(), job = data.jobs[0];
  assert.equal(isBookingCurrent(job), false);
  const result = confirmBooking(data, job.id, 'HQ Agent', allocationFingerprint(job));
  assert.equal(isBookingCurrent(result.jobs[0]), true);
  assert.equal(confirmBooking(result, job.id, 'HQ Agent', allocationFingerprint(job)), result);
  assert.equal(isBookingCurrent(data.jobs[0]), false);
});
test('Booking rejects missing specialist, overlaps and stale schedule acknowledgement', () => {
  const data = workspace(), job = data.jobs[0] as BookingJob;
  assert.throws(() => confirmBooking({ ...data, jobs: [{ ...job, resourceIds: ['video'] }] }, job.id, 'HQ', allocationFingerprint(job)), /Fotografer/);
  assert.throws(() => confirmBooking({ ...data, jobs: [{ ...job, resourceIds: [] }] }, job.id, 'HQ', allocationFingerprint(job)), /Alokasikan/);
  const overlap = { ...job, id: 'other', title: 'Other job' };
  assert.throws(() => confirmBooking({ ...data, jobs: [job, overlap] }, job.id, 'HQ', allocationFingerprint(job)), /bertabrakan/);
  const changed = { ...job, scheduledAt: '2026-10-22T15:00' };
  assert.throws(() => confirmBooking({ ...data, jobs: [changed] }, job.id, 'HQ', allocationFingerprint(job)), /berubah/);
});
test('Reallocation invalidates confirmation; contiguous resource sessions remain available', () => {
  const data = workspace(), job = data.jobs[0] as BookingJob;
  const confirmed = confirmBooking(data, job.id, 'HQ', allocationFingerprint(job)).jobs[0] as BookingJob;
  assert.equal(invalidateBooking({ ...confirmed, durationHours: 3 }).booking, undefined);
  assert.equal(invalidateBooking(confirmed), confirmed);
  const next = { ...job, id: 'next', scheduledAt: '2026-10-22T12:00' };
  assert.equal(isBookingCurrent(confirmBooking({ ...data, jobs: [job, next] }, job.id, 'HQ', allocationFingerprint(job)).jobs[0]), true);
  assert.throws(() => confirmBooking({ ...data, product: 'creator' }, job.id, 'HQ', allocationFingerprint(job)));
});
