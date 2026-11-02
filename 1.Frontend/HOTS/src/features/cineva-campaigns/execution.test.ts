import test from 'node:test';
import assert from 'node:assert/strict';
import { assertExecutionMutation, getDeliveryExecution, readExecution, reviewDraft, submitDraft } from './execution.ts';
import type { TalentAssignment } from './model';

const hq = { id: 'hq-1', product: 'hq' as const }, creator = { id: 'creator-1', product: 'creator' as const };
const base: TalentAssignment = { id: 'a', batchId: 'b', creatorId: 'creator-1', creatorName: 'C', socialProfiles: [],
  deliverables: [{ id: 'd1', title: 'Reels', platform: 'Instagram', postingRequired: true, deadline: '2026-11-10' }] };
const submitted = () => submitDraft(base, creator, 'd1', { url: 'https://example.test/d', note: '' }, 0, '2026-11-03T09:00:00+07:00');
const review = (approvals?: string[], decision: 'approved' | 'revision_requested' = 'approved') =>
  reviewDraft(submitted(), hq, 'd1', { decision, note: decision === 'approved' ? '' : 'Perbaiki', draftVersion: 1, approvals }, 1, '2026-11-03T10:00:00+07:00');

test('QC approval needs both the client and the Cineva owner', () => {
  assert.throws(() => review(), /persetujuan client dan kesepakatan owner Cineva/);
  assert.throws(() => review(['client']), /kesepakatan owner Cineva/);
  assert.throws(() => review(['owner']), /persetujuan client/);
  const approved = review(['client', 'owner']);
  assert.equal(getDeliveryExecution(approved, 'd1').status, 'approved');
  assert.deepEqual(getDeliveryExecution(approved, 'd1').reviews[0].approvals, ['client', 'owner']);
});
test('Requesting a revision does not need approvals and stores none', () => {
  const revised = review(undefined, 'revision_requested');
  assert.equal(getDeliveryExecution(revised, 'd1').status, 'revision_requested');
  assert.equal('approvals' in getDeliveryExecution(revised, 'd1').reviews[0], false);
});
test('The repository guard replays an approval and rejects one forged without both approvals', () => {
  const previous = submitted(), approved = review(['client', 'owner']);
  assert.doesNotThrow(() => assertExecutionMutation(previous, approved, hq, []));
  const forged = structuredClone(approved);
  delete forged.execution!.deliverables.d1.reviews[0].approvals;
  assert.throws(() => assertExecutionMutation(previous, forged, hq, []), /Persetujuan belum lengkap|melewati alur/);
  assert.equal(readExecution(approved).revision, 2);
});
