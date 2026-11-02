import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiCampaignRepository } from './apiRepository.ts';
import { planAssignmentCalls, planCampaignCalls, isoMillis, trialIdentities } from './apiMapping.ts';
import { recordPosting, reviewDraft, submitDraft } from './execution.ts';
import { configureFinance, recordInsight, recordPayout, requestPayout } from './finance.ts';
import { addRatingCriterion, recordRating } from './rating.ts';
import type { Campaign, TalentAssignment } from './model';

const baseUrl = process.env.CINEVA_TRIAL_API || 'http://127.0.0.1:4300/api/cineva/v1';
const hq = { id: 'hq-1', product: 'hq' as const }, creator = { id: 'creator-1', product: 'creator' as const }, creator2 = { id: 'creator-2', product: 'creator' as const };
const wib = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

test('mapping helpers: microseconds are trimmed and unsupported campaign edits are refused, not ignored', () => {
  assert.equal(isoMillis('2026-11-02T07:00:58.810000Z'), '2026-11-02T07:00:58.810Z');
  assert.equal(isoMillis('2026-11-02T07:00:58.5Z'), '2026-11-02T07:00:58.5Z');
  const row: Campaign = { id: 'c', ownerId: 'hq-1', title: 'T', brand: 'B', brief: 'b', objective: 'o', audience: 'a', messaging: 'm', milestones: [], batches: [{ id: 'b1', name: 'B' }], assignments: [], products: [] };
  assert.throws(() => planCampaignCalls(row, { ...row, title: 'Baru' }, trialIdentities), /belum didukung/);
  assert.throws(() => planCampaignCalls(row, { ...row, batches: [] }, trialIdentities), /batch belum didukung/);
  assert.deepEqual(planCampaignCalls(row, { ...row, batches: [...row.batches, { id: 'x', name: 'B2' }] }, trialIdentities).map(call => call.path), ['/campaigns/c/batches']);
  assert.throws(() => trialIdentities.toUserId('creator-9'), /tidak dikenal/);
  const a = { id: 'a', batchId: 'b1', creatorId: 'creator-1', creatorName: 'C', socialProfiles: [], deliverables: [] } as TalentAssignment;
  assert.deepEqual(planAssignmentCalls(a, a), []);
});

test('API repository drives the whole campaign flow against the real trial API (skipped when it is not running)', async t => {
  const probe = await fetch(`${baseUrl}/campaigns`, { headers: { 'x-test-principal': 'hq' } }).catch(() => null);
  if (!probe?.ok) return t.skip(`Trial API not reachable at ${baseUrl}`);
  const hqRepo = createApiCampaignRepository({ baseUrl }), creatorRepo = createApiCampaignRepository({ baseUrl }), otherRepo = createApiCampaignRepository({ baseUrl });
  const title = `Adapter ${Date.now()}`;
  const find = (repo: typeof hqRepo, actor: typeof hq | typeof creator) => repo.getCampaigns(actor).find(row => row.title === title);
  const ready = async (repo: typeof hqRepo, actor: typeof hq | typeof creator) => { await repo.reload(actor); return find(repo, actor); };

  // HQ creates the campaign and builds it up through reducer-style updates.
  await hqRepo.reload(hq);
  await hqRepo.create(hq, { id: 'local', ownerId: 'hq-1', title, brand: 'Brand', brief: 'Brief', objective: 'Obj', audience: 'Aud', messaging: 'Msg',
    milestones: [{ id: 'm', title: 'Draft', deadline: '2099-01-10' }], batches: [], assignments: [], products: [{ id: 'p', name: 'Produk', variant: 'V', referenceValue: 1000 }] });
  let campaign = find(hqRepo, hq)!;
  assert.ok(campaign, 'campaign created through the API');
  assert.equal(campaign.ownerId, 'hq-1');
  assert.equal(campaign.products[0].name, 'Produk');
  await hqRepo.mutate(hq, campaign.id, row => ({ ...row, batches: [...row.batches, { id: 'x', name: 'Batch 2' }] }), campaign.revision);
  await hqRepo.mutate(hq, campaign.id, row => ({ ...row, stagePlan: { templateId: 'reguler-bulanan', startDate: '2099-01-04', holidays: ['2099-01-25'], extensions: [] } }));
  campaign = find(hqRepo, hq)!;
  assert.equal(campaign.stagePlan?.holidays[0], '2099-01-25');
  assert.equal(campaign.revision, 1);
  const extension = { stageKey: 'konten', days: 2, reason: 'Sakit', proof: { kind: 'text' as const, text: 'Surat dokter' } };
  await hqRepo.mutate(hq, campaign.id, row => ({ ...row, stagePlan: { ...row.stagePlan!, extensions: [extension] } }));
  assert.equal(find(hqRepo, hq)!.stagePlan!.extensions[0].days, 2);
  await assert.rejects(hqRepo.mutate(hq, campaign.id, row => ({ ...row, stagePlan: { ...row.stagePlan!, extensions: [...row.stagePlan!.extensions, { ...extension, days: 1 }] } })), /perpanjangan|tidak valid|request_limit|1 kali/i);
  assert.throws(() => hqRepo.mutate(hq, campaign.id, row => ({ ...row, title: 'Ganti' })), /belum didukung/);

  campaign = find(hqRepo, hq)!;
  const batch = campaign.batches[0];
  await hqRepo.mutate(hq, campaign.id, row => ({ ...row, assignments: [...row.assignments, { id: 'new', batchId: batch.id, creatorId: 'creator-1', creatorName: 'Creator Satu', socialProfiles: [],
    deliverables: [{ id: 'd', title: 'Reels', platform: 'Instagram', postingRequired: true, deadline: '2099-02-01' }] }] }));
  campaign = find(hqRepo, hq)!;
  let assignment = campaign.assignments[0];
  assert.equal(assignment.creatorId, 'creator-1');
  const deliverableId = assignment.deliverables[0].id;

  // Creator view: own campaign visible, another creator sees nothing, HQ-only amounts are hidden.
  await creatorRepo.reload(creator);
  assert.ok(find(creatorRepo, creator), 'creator sees own campaign');
  await otherRepo.reload(creator2);
  assert.equal(otherRepo.getCampaigns(creator2).some(row => row.title === title), false);
  assert.equal(find(creatorRepo, creator)!.assignments[0].finance!.marketingAmount, 0);

  const revision = (row: TalentAssignment) => row.execution!.revision;
  const act = async (repo: typeof hqRepo, actor: typeof hq | typeof creator, update: (row: TalentAssignment) => TalentAssignment) => {
    const current = (await ready(repo, actor))!;
    await repo.updateAssignment(actor, current.id, current.assignments[0].id, update);
    return (await ready(repo, actor))!.assignments[0];
  };
  const mine = async () => (await ready(creatorRepo, creator))!.assignments[0];

  // Payout stays closed (frontend guard) until the whole chain is done; each step goes through the server rules too.
  assignment = await mine();
  assert.throws(() => requestPayout(assignment, creator, 'r'), /Syarat payout belum lengkap|Tidak ada sisa fee/);
  assignment = await act(hqRepo, hq, row => configureFinance(row, hq, { feeAmount: 2000000, marketingAmount: 500000, productBenefitAmount: 0 }));
  assert.equal(assignment.finance!.feeAmount, 2000000);
  assignment = await act(creatorRepo, creator, row => submitDraft(row, creator, deliverableId, { url: 'https://example.test/d1', note: 'v1' }, revision(row)));
  assert.equal(assignment.execution!.deliverables[deliverableId].status, 'submitted');
  assert.throws(() => reviewDraft(assignment, hq, deliverableId, { decision: 'approved', note: '', draftVersion: 1 }, revision(assignment)), /Persetujuan belum lengkap/);
  assignment = await act(hqRepo, hq, row => reviewDraft(row, hq, deliverableId, { decision: 'approved', note: '', draftVersion: 1, approvals: ['client', 'owner'] }, revision(row)));
  assert.deepEqual(assignment.execution!.deliverables[deliverableId].reviews[0].approvals, ['client', 'owner']);
  assignment = await act(creatorRepo, creator, row => recordPosting(row, creator, deliverableId, { url: 'https://example.test/p', postedAt: wib() }, revision(row)));
  assert.equal(assignment.execution!.deliverables[deliverableId].posting!.postedAt, wib());
  assignment = await act(creatorRepo, creator, row => recordInsight(row, creator, { id: `ins-${Date.now()}`, deliverableId, capturedAt: wib(), metrics: { likes: 10, comments: 2, shares: 0, saves: 0, reposts: 0, views: 100 } }));
  assert.equal(assignment.finance!.insights.length, 1);
  assignment = await act(creatorRepo, creator, row => requestPayout(row, creator, `request-${row.id}`));
  assert.ok(assignment.finance!.requested);
  assignment = await act(hqRepo, hq, row => recordPayout(row, hq, { id: `pay-${Date.now()}`, amount: 2000000, paidAt: wib(), evidence: 'ref-1' }));
  assert.equal(assignment.finance!.payments[0].amount, 2000000);
  assert.equal(assignment.finance!.processing, false);

  // Rating: criteria are set by HQ, the Creator never sees ratings, and the server stores each round.
  await hqRepo.mutate(hq, campaign.id, row => addRatingCriterion(row, 'Ketepatan waktu', 'tmp-1'));
  await hqRepo.mutate(hq, campaign.id, row => addRatingCriterion(row, 'Kualitas hasil', 'tmp-2'));
  campaign = find(hqRepo, hq)!;
  const [timeliness, quality] = campaign.ratingCriteria!;
  assert.deepEqual([timeliness.label, quality.label], ['Ketepatan waktu', 'Kualitas hasil']);
  assert.notEqual(timeliness.id, 'tmp-1', 'criterion ids come from the server');
  assignment = await act(hqRepo, hq, row => recordRating(row, campaign.ratingCriteria!, hq, { id: 'local-rating', scores: { [timeliness.id]: 5, [quality.id]: 3 }, comment: 'Baik', continueCooperation: 'yes' }));
  assert.deepEqual([assignment.ratings!.length, assignment.ratings![0].scores[quality.id], assignment.ratings![0].continueCooperation], [1, 3, 'yes']);
  assert.equal((await mine()).ratings, undefined);
  assert.throws(() => hqRepo.mutate(hq, campaign.id, row => ({ ...row, ratingCriteria: [] })), /belum didukung/);

  // A server-side rule rejects what the local reducer allowed: overpaying beyond the fee.
  await assert.rejects(act(hqRepo, hq, row => ({ ...row, finance: { ...row.finance!, payments: [...row.finance!.payments, { id: `over-${Date.now()}`, amount: 1, paidAt: wib(), evidence: 'x' }] } })), /melebihi|sisa fee/i);
  // After a failed write the cache is reloaded from the server.
  assert.equal((await ready(hqRepo, hq))!.assignments[0].finance!.payments.length, 1);
});
