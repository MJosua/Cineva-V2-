import test from 'node:test';
import assert from 'node:assert/strict';
import { assignmentPaymentGate } from './paymentGate.ts';
import type { TalentAssignment } from './model';

const base = (overrides: Partial<TalentAssignment> = {}): TalentAssignment => ({
  id: 'a', batchId: 'b', creatorId: 'c', creatorName: 'C', socialProfiles: [],
  deliverables: [{ id: 'd1', title: 'Reels', platform: 'Instagram', postingRequired: true, deadline: '2026-11-10' }],
  ...overrides,
});
const done = (): TalentAssignment => base({
  execution: { revision: 1, product: { choice: 'unselected', fulfillment: 'pending' }, deliverables: { d1: { status: 'approved', drafts: [], reviews: [], posting: { url: 'https://x.test/p', postedAt: '2026-11-09' } } } },
  finance: { feeAmount: 1, marketingAmount: 0, productBenefitAmount: 0, processing: false, payments: [], insights: [{ id: 'i', deliverableId: 'd1', capturedAt: '2026-11-16', metrics: { likes: 1, comments: 1, shares: 0, saves: 0, reposts: 0, views: 10 } }] },
});

test('Payout stays closed until post, insight and QC approval all exist', () => {
  assert.deepEqual(assignmentPaymentGate(base()).missing, ['post_live', 'insight_submitted', 'obligations_complete']);
  assert.equal(assignmentPaymentGate(done()).open, true);
});
test('Each missing requirement is reported on its own', () => {
  const noInsight = { ...done(), finance: { ...done().finance!, insights: [] } };
  assert.deepEqual(assignmentPaymentGate(noInsight).missing, ['insight_submitted']);
  const draft = done(); draft.execution!.deliverables.d1.status = 'submitted';
  assert.deepEqual(assignmentPaymentGate(draft).missing, ['obligations_complete']);
});
test('Brand-owned output is not a Creator obligation, but an assignment without deliverables never opens', () => {
  const brandOnly = base({ deliverables: [{ id: 'b1', title: 'Foto', platform: '-', postingRequired: false, deadline: '2026-11-10', outputOwner: 'brand' }] });
  assert.deepEqual(assignmentPaymentGate(brandOnly).missing, ['obligations_complete']);
  assert.equal(assignmentPaymentGate(base({ deliverables: [] })).open, false);
});
