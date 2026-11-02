import test from 'node:test';
import assert from 'node:assert/strict';
import { cancellationDeciders, contentApprovalGate, creatorPaymentGate, defaultCancellationPolicy, estimateKolBudget, evaluateProjectCancellation, normalizeMetric, resolveKolTier } from './policies.ts';

test('Brand cancellation forfeits the deposit; crew pays 15% of total fee plus replacement cost and needs a replacement', () => {
  const brand = evaluateProjectCancellation({ party: 'brand', deposit: 2_500_000 });
  assert.deepEqual([brand.depositForfeited, brand.penalty, brand.requiresReplacement], [2_500_000, null, false]);
  const crew = evaluateProjectCancellation({ party: 'crew', amounts: { totalFee: 2_000_000 }, extraCharges: { productReplacement: 0 } });
  assert.deepEqual([crew.penalty?.amount, crew.requiresReplacement, crew.total, crew.penalty?.payee], [300_000, true, 300_000, undefined]);
  assert.throws(() => evaluateProjectCancellation({ party: 'crew', amounts: { totalFee: 1 } }), /productReplacement/);
});
test('Cancellation reasons follow the client: no penalty without commitment or with a valid reason, half refund on force majeure', () => {
  const crew = (reason: string) => evaluateProjectCancellation({ party: 'crew', amounts: { totalFee: 2_000_000 }, extraCharges: { productReplacement: 0 }, reason });
  for (const reason of ['not_committed', 'valid_reason', 'force_majeure']) assert.deepEqual([crew(reason).penalty, crew(reason).requiresReplacement], [null, true]);
  const storm = evaluateProjectCancellation({ party: 'brand', deposit: 3_000_000, amounts: { amountPaid: 6_000_000 }, reason: 'force_majeure' });
  assert.deepEqual([storm.depositForfeited, storm.refund?.amount, storm.refund?.percent], [0, 3_000_000, 50]);
  assert.throws(() => evaluateProjectCancellation({ party: 'brand', deposit: 1, amounts: { amountPaid: 1 }, reason: 'valid_reason' }), /Unknown cancellation reason/);
  assert.equal(cancellationDeciders.campaign.decider, 'PIC Campaign');
  assert.equal(cancellationDeciders.production.decider, 'Account Manager Produksi');
});
test('The 15% penalty is a parameter, so another policy can replace it without code changes', () => {
  const policy = { ...defaultCancellationPolicy, version: 'X', parties: { crew: { penaltyPercent: 20, penaltyBasis: 'totalFee' } } };
  assert.equal(evaluateProjectCancellation({ party: 'crew', amounts: { totalFee: 1_000_000 } }, policy).penalty?.amount, 200_000);
});
test('Content approval needs the client and the Cineva owner; payment needs post, insight and completed obligations', () => {
  assert.deepEqual(contentApprovalGate(['client']).missing, ['owner']);
  assert.equal(contentApprovalGate(['owner', 'client']).open, true);
  assert.deepEqual(creatorPaymentGate({ post_live: true, insight_submitted: false, obligations_complete: true }).missing, ['insight_submitted']);
  assert.equal(creatorPaymentGate(['post_live', 'insight_submitted', 'obligations_complete']).open, true);
});
test('KOL budget is an opening estimate: Makro has no upper bound so the range stays open, sheet labels map to tiers', () => {
  assert.equal(resolveKolTier('Lower Micro'), 'mikro');
  assert.equal(resolveKolTier(' NANO '), 'nano');
  assert.throws(() => resolveKolTier('Mega'), /tidak dikenal/);
  assert.deepEqual(estimateKolBudget([{ tier: 'nano', count: 2 }, { tier: 'Upper Micro', count: 1 }]), { min: 1_300_000, max: null, openEnded: true, version: 'CLIENT-2026-11-02-opening', negotiable: true });
  const closed = { version: 'T', aliases: {}, tiers: { nano: { min: 100, max: 200 } } };
  assert.deepEqual(estimateKolBudget([{ tier: 'nano', count: 3 }], closed), { min: 300, max: 600, openEnded: false, version: 'T', negotiable: true });
  assert.throws(() => estimateKolBudget([{ tier: 'nano', count: -1 }]), /non-negatif/);
});
test('Metric normalization handles comma decimals, percent signs and K/M, and flags impossible values', () => {
  const percent = { kind: 'percent' as const }, count = { kind: 'count' as const };
  assert.deepEqual(normalizeMetric('19,19%', percent), { value: 19.19, status: 'normalized' });
  assert.deepEqual(normalizeMetric(6.62, percent), { value: 6.62, status: 'ok' });
  assert.deepEqual(normalizeMetric('140,87%', percent), { value: 140.87, status: 'out_of_range' });
  assert.deepEqual(normalizeMetric('98311', percent), { value: 98311, status: 'out_of_range' });
  assert.deepEqual(normalizeMetric('1.234', count), { value: 1234, status: 'normalized' });
  assert.deepEqual(normalizeMetric('1.234,5', count), { value: 1234.5, status: 'normalized' });
  assert.deepEqual(normalizeMetric('12K', count), { value: 12000, status: 'normalized' });
  assert.deepEqual(normalizeMetric('2,5M', count), { value: 2_500_000, status: 'normalized' });
  assert.deepEqual(normalizeMetric('1.234', percent), { value: 1.234, status: 'normalized' });
  assert.deepEqual(normalizeMetric('', count), { value: null, status: 'empty' });
  for (const bad of ['abc', '1,2,3', '12%', 'K']) assert.equal(normalizeMetric(bad, count).status, 'invalid', bad);
  assert.equal(normalizeMetric('5K', percent).status, 'invalid');
  assert.equal(normalizeMetric('150%', { kind: 'percent', bounds: { min: 0, max: 200 } }).status, 'normalized');
});

test('Batch J: brand gets both options, proof is mandatory, settlement within 7 days, duplicates by username/WhatsApp', async () => {
  const { brandCancellationOptions, assertCancellationProof, cancellationSettlementDue, findDuplicateRegistrations } = await import('./policies.ts');
  const options = brandCancellationOptions({ deposit: 3_000_000, totalDeal: 10_000_000 });
  assert.deepEqual([options.forfeitDeposit.total, options.penalty15.total, options.penalty15.depositForfeited], [3_000_000, 1_500_000, 0]);
  assert.throws(() => assertCancellationProof('Sakit', undefined), /Lampiran/);
  assert.throws(() => assertCancellationProof(' ', { kind: 'text', text: 'x' }), /Alasan/);
  assert.equal(assertCancellationProof(' Sakit ', { kind: 'jpeg', fileName: 'surat.jpg', sizeBytes: 10 }).reason, 'Sakit');
  assert.equal(cancellationSettlementDue('2026-11-28'), '2026-12-05');
  const dup = findDuplicateRegistrations([
    { id: 'a', name: 'Rina', whatsapp: '0812-3456-7890', accounts: [{ platform: 'IG', username: '@Rina.x' }] },
    { id: 'b', name: 'Rina S', whatsapp: '+62 812 3456 7890' },
    { id: 'c', name: 'Budi', accounts: [{ platform: 'ig', username: 'rina.x' }] },
    { id: 'd', name: 'rina' },
  ]);
  assert.deepEqual(dup.map(m => [m.ids.join(''), m.by.join(','), m.confirmed]), [['ab', 'whatsapp', true], ['ac', 'username', true], ['ad', 'name', false]]);
});
