import test from 'node:test';
import assert from 'node:assert/strict';
import type { TalentAssignment } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/model';
import { createCampaignRepository } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/repository';
import { assertFinanceMutation, configureFinance, engagementRate, financeDate, insightReminder, payoutStatus, processPayout, readFinance,
  recordInsight, recordPayout, requestPayout, totalPaid, type InsightMetrics } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/finance';
const hq = { id: 'hq-1', product: 'hq' as const }, creator = { id: 'creator-1', product: 'creator' as const };
const metrics: InsightMetrics = { likes: 10, comments: 2, shares: 3, saves: 4, reposts: 1, views: 200 };
function fixture(): TalentAssignment {
  return { id: 'talent-dummy', batchId: 'batch-dummy', creatorId: creator.id, creatorName: 'Creator dummy', socialProfiles: [],
    deliverables: [{ id: 'post-dummy', title: 'Dummy post', platform: 'Instagram', postingRequired: true, deadline: '2026-10-10' }],
    execution: { revision: 1, product: { choice: 'unselected', fulfillment: 'pending' }, deliverables: {
      'post-dummy': { status: 'approved', drafts: [], reviews: [], posting: { url: 'https://example.test/dummy-post', postedAt: '2026-10-10' } },
    } } };
}
test('Creator cash fee, marketing and non-cash benefit remain separate from paid ledger', () => {
  let assignment = configureFinance(fixture(), hq, { feeAmount: 300000, marketingAmount: 90000, productBenefitAmount: 450000 });
  assignment = requestPayout(assignment, creator, 'request-dummy');
  assert.equal(payoutStatus(readFinance(assignment)), 'requested'); assert.equal(totalPaid(readFinance(assignment)), 0);
  assignment = processPayout(assignment, hq);
  assert.equal(payoutStatus(readFinance(assignment)), 'processing'); assert.equal(totalPaid(readFinance(assignment)), 0);
  assignment = recordPayout(assignment, hq, { id: 'payment-dummy', amount: 100000, paidAt: '2026-10-12', evidence: 'Dummy proof A' });
  assert.equal(payoutStatus(readFinance(assignment)), 'partial'); assert.equal(totalPaid(readFinance(assignment)), 100000);
  assignment = recordPayout(assignment, hq, { id: 'payment-dummy-2', amount: 200000, paidAt: '2026-10-13', evidence: 'Dummy proof B' });
  assert.equal(payoutStatus(readFinance(assignment)), 'paid'); assert.equal(readFinance(assignment).productBenefitAmount, 450000);
});
test('Payout validates owner, HQ permissions, proof, date, exact retry and remaining fee', () => {
  const configured = configureFinance(fixture(), hq, { feeAmount: 300000, marketingAmount: 0, productBenefitAmount: 0 });
  assert.throws(() => requestPayout(configured, { ...creator, id: 'creator-2' }, 'request'));
  assert.throws(() => configureFinance(configured, creator, { feeAmount: 1, marketingAmount: 0, productBenefitAmount: 0 }));
  const assignment = requestPayout(configured, creator, 'request-dummy');
  const payment = { id: 'payment', amount: 100000, paidAt: '2026-10-12', evidence: 'Dummy proof' };
  for (const invalid of [{ ...payment, amount: Infinity }, { ...payment, amount: -1 }, { ...payment, amount: 300001 }, { ...payment, evidence: ' ' }, { ...payment, paidAt: '2026-02-31' }])
    assert.throws(() => recordPayout(assignment, hq, invalid));
  assert.throws(() => recordPayout(assignment, creator, payment));
  const paid = recordPayout(assignment, hq, payment);
  assert.equal(readFinance(recordPayout(paid, hq, payment)).payments.length, 1);
  assert.throws(() => recordPayout(paid, hq, { ...payment, amount: 1 }));
  assert.throws(() => configureFinance(paid, hq, { feeAmount: 1, marketingAmount: 0, productBenefitAmount: 0 }));
  assert.equal(readFinance(assignment).payments.length, 0);
});
test('Engagement uses views percentage points and does not invent values for missing metrics', () => {
  assert.equal(engagementRate(metrics), 10);
  assert.equal(engagementRate({ ...metrics, views: 0 }), null);
  assert.equal(engagementRate({ ...metrics, views: null }), null);
  assert.equal(engagementRate({ ...metrics, shares: null }), null);
  assert.equal(engagementRate({ ...metrics, likes: NaN }), null);
});
test('Insight stores independent immutable snapshots, validates own post and rejects rewritten IDs', () => {
  const assignment = fixture(), input = { id: 'insight-dummy', deliverableId: 'post-dummy', capturedAt: '2026-10-17', metrics: { ...metrics } };
  const next = recordInsight(assignment, creator, input);
  input.metrics.likes = 999;
  assert.equal(readFinance(next).insights[0].metrics.likes, 10); assert.equal(readFinance(assignment).insights.length, 0);
  assert.throws(() => recordInsight(next, creator, input));
  assert.throws(() => recordInsight(assignment, { ...creator, id: 'creator-2' }, input));
  assert.throws(() => recordInsight(assignment, creator, { ...input, capturedAt: '2026-10-09' }));
  assert.throws(() => recordInsight({ ...assignment, execution: undefined }, creator, input));
  assert.throws(() => recordInsight(assignment, creator, { ...input, metrics: { ...metrics, views: Infinity } }));
});
test('Insight H+7 is date-stable and requires a snapshot on or after the due date', () => {
  assert.equal(financeDate('2026-02-31'), false); assert.equal(financeDate('nonsense'), false);
  assert.deepEqual(insightReminder('2026-10-10', '2026-10-16', [], 'post'), { dueAt: '2026-10-17', due: false });
  assert.equal(insightReminder('2026-10-10', '2026-10-17', [], 'post').due, true);
  assert.equal(insightReminder(undefined, '2026-10-17', [], 'post').due, false);
  const snapshots = [{ id: 'insight', deliverableId: 'post', capturedAt: '2026-10-16', metrics }];
  assert.equal(insightReminder('2026-10-10', '2026-10-17', snapshots, 'post').due, true);
  assert.equal(insightReminder('2026-10-10', '2026-10-17', [{ ...snapshots[0], capturedAt: '2026-10-17' }], 'post').due, false);
  assert.equal(insightReminder('2026-12-28', '2027-01-04', [], 'post').dueAt, '2027-01-04');
});
test('Repository mutation guard rejects financial bypass and rewritten/deleted/duplicated history', () => {
  const base = configureFinance(fixture(), hq, { feeAmount: 100000, marketingAmount: 100, productBenefitAmount: 300 });
  const requested = requestPayout(base, creator, 'request');
  assert.doesNotThrow(() => assertFinanceMutation(base, requested, creator));
  assert.throws(() => assertFinanceMutation(base, { ...base, finance: { ...readFinance(base), feeAmount: 1 } }, creator));
  assert.throws(() => assertFinanceMutation(base, requested, hq));
  const paid = recordPayout(requested, hq, { id: 'paid', amount: 100000, paidAt: '2026-10-12', evidence: 'Dummy proof' });
  assert.doesNotThrow(() => assertFinanceMutation(requested, paid, hq));
  assert.throws(() => assertFinanceMutation(paid, requested, hq));
  assert.throws(() => assertFinanceMutation(requested, paid, creator));
  assert.throws(() => assertFinanceMutation(paid, { ...paid, finance: { ...readFinance(paid), payments: [...readFinance(paid).payments, readFinance(paid).payments[0]] } }, hq));
  const insight = recordInsight(base, creator, { id: 'snap', deliverableId: 'post-dummy', capturedAt: '2026-10-17', metrics });
  assert.doesNotThrow(() => assertFinanceMutation(base, insight, creator));
  assert.throws(() => assertFinanceMutation(insight, base, hq));
});
test('Repository persists HQ amounts, Creator request and partial payout while keeping projection private', () => {
  let data: unknown;
  const repo = createCampaignRepository({ get<T>() { return structuredClone(data) as T; }, set(_key, next) { data = structuredClone(next); } });
  const campaign = repo.getCampaigns(hq)[0], assignment = campaign.assignments[0];
  const readHQ = () => repo.get(campaign.id, hq).assignments.find(item => item.id === assignment.id)!;
  repo.updateAssignment(hq, campaign.id, assignment.id, current => configureFinance(current, hq, { feeAmount: 300000, marketingAmount: 90000, productBenefitAmount: 450000 }));
  assert.equal(readFinance(readHQ()).feeAmount, 300000); assert.equal(readFinance(readHQ()).marketingAmount, 90000);
  const projected = repo.get(campaign.id, creator);
  assert.equal(projected.assignments.length, 1);
  assert.equal(Object.hasOwn(readFinance(projected.assignments[0]), 'marketingAmount'), false);
  repo.updateAssignment(creator, campaign.id, assignment.id, current => requestPayout(current, creator, 'request-integration'));
  assert.equal(totalPaid(readFinance(readHQ())), 0); assert.equal(payoutStatus(readFinance(readHQ())), 'requested');
  repo.updateAssignment(hq, campaign.id, assignment.id, current => processPayout(current, hq));
  assert.equal(totalPaid(readFinance(readHQ())), 0);
  const payment = { id: 'payment-integration', amount: 100000, paidAt: '2026-10-12', evidence: 'Dummy reference' };
  repo.updateAssignment(hq, campaign.id, assignment.id, current => recordPayout(current, hq, payment));
  assert.equal(totalPaid(readFinance(readHQ())), 100000); assert.equal(payoutStatus(readFinance(readHQ())), 'partial');
  assert.equal(readFinance(readHQ()).marketingAmount, 90000); assert.equal(readFinance(readHQ()).productBenefitAmount, 450000);
  assert.equal(Object.hasOwn(readFinance(repo.get(campaign.id, creator).assignments[0]), 'marketingAmount'), false);
  assert.throws(() => repo.updateAssignment(hq, campaign.id, assignment.id, current => ({ ...current, finance: { ...readFinance(current), payments: [] } })));
  assert.throws(() => repo.updateAssignment(creator, campaign.id, assignment.id, current => ({ ...current, finance: { ...readFinance(current), feeAmount: 999 } })));
});
