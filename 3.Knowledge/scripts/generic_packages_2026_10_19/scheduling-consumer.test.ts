import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDraft, type Job, type JobDraft, type Workspace } from '../../../1.Frontend/HOTS/src/features/cineva-shared/model.ts';
import { findResourceConflict } from '../../../1.Frontend/HOTS/src/features/cineva-shared/scheduling.ts';
function draft(overrides: Partial<JobDraft> = {}): JobDraft {
  return { title: 'Shoot dummy', brief: '', clientId: 'client', type: 'Production', platform: 'Instagram', scheduledAt: '2026-10-20T10:00', durationHours: 2, fee: 0, barter: 0, resourceIds: ['crew'], ...overrides };
}
function job(id: string, overrides: Partial<Job> = {}): Job {
  return { ...draft(), id, ticketId: `DUMMY-${id}`, paid: 0, status: 'running', archived: false, deliverables: [], ...overrides };
}
function workspace(jobs: Job[] = []): Workspace {
  return { product: 'hq', clients: [{ id: 'client', name: 'Client dummy', contact: '', email: '' }],
    resources: [{ id: 'crew', name: 'Crew dummy', kind: 'crew' }, { id: 'gear', name: 'Gear dummy', kind: 'gear' }], jobs, plan: 'starter' };
}
test('Cineva adapter preserves exact original clash message and first job ordering', () => {
  const rows = [job('first', { title: 'First title', scheduledAt: '2026-10-20T11:00' }), job('second', { title: 'Earlier overlap', scheduledAt: '2026-10-20T09:00' })];
  assert.throws(() => validateDraft(draft(), workspace(rows)), { message: 'Jadwal resource bertabrakan dengan First title.' });
  assert.equal(findResourceConflict(draft(), workspace(rows))?.id, 'first');
});
test('Cineva crew/gear allocations allow adjacent slots and reject contained overlap', () => {
  assert.doesNotThrow(() => validateDraft(draft(), workspace([job('previous', { scheduledAt: '2026-10-20T08:00' })])));
  assert.doesNotThrow(() => validateDraft(draft(), workspace([job('next', { scheduledAt: '2026-10-20T12:00' })])));
  assert.throws(() => validateDraft(draft({ resourceIds: ['crew', 'gear'] }), workspace([job('gear-busy', { resourceIds: ['gear'], scheduledAt: '2026-10-20T10:30', durationHours: 0.5 })])), /bertabrakan/);
  assert.doesNotThrow(() => validateDraft(draft(), workspace([job('different', { resourceIds: ['gear'] })])));
});
test('Archive and excluded updates release allocations; done but unarchived retains legacy occupancy', () => {
  assert.doesNotThrow(() => validateDraft(draft(), workspace([job('old', { archived: true })])));
  assert.doesNotThrow(() => validateDraft(draft(), workspace([job('editing')]), 'editing'));
  assert.throws(() => validateDraft(draft(), workspace([job('done', { status: 'done' })])), /bertabrakan/);
});
test('Repeated resource IDs and unrelated malformed legacy rows retain old draft compatibility', () => {
  assert.doesNotThrow(() => validateDraft(draft({ resourceIds: ['crew', 'crew'] }), workspace()));
  assert.throws(() => validateDraft(draft(), workspace([job('repeat', { resourceIds: ['crew', 'crew'] })])), /bertabrakan/);
  assert.doesNotThrow(() => validateDraft(draft(), workspace([job('invalid-date', { scheduledAt: 'unknown' })])));
  assert.doesNotThrow(() => validateDraft(draft({ resourceIds: [] }), workspace([job('busy')])));
});
test('Existing draft errors retain validation order before generic scheduling policy', () => {
  assert.throws(() => validateDraft(draft({ title: '' }), workspace([job('busy')])), { message: 'Judul dan client wajib diisi.' });
  assert.throws(() => validateDraft(draft({ resourceIds: ['missing'] }), workspace()), { message: 'Resource tidak ditemukan di workspace ini.' });
  assert.throws(() => validateDraft(draft({ scheduledAt: 'invalid' }), workspace()), { message: 'Platform dan jadwal wajib valid.' });
});
test('Adapter fails closed when generic policy receives malformed requested intervals', () => {
  assert.throws(() => findResourceConflict(draft({ scheduledAt: 'invalid' }), workspace()), /Jadwal resource tidak valid/);
  assert.throws(() => findResourceConflict(draft({ durationHours: Infinity }), workspace()), /Jadwal resource tidak valid/);
});
