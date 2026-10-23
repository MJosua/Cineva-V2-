import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignRepository } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/repository';
import { validDate, validateCampaign } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/model';
import { campaignSeed } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/seed';
import { configureFinance } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/finance';
const hq = { id: 'hq-1', product: 'hq' as const }, creator = { id: 'creator-1', product: 'creator' as const };
function fixture() {
  let saved: unknown, fail = false;
  const storage = { get: <T,>() => structuredClone(saved) as T, set: (_key: string, value: unknown) => { if (!fail) saved = structuredClone(value); } };
  return { repo: createCampaignRepository(storage), storage, fail: () => { fail = true; } };
}
test('Campaign HQ ownership and Creator assignment projection isolate both actors', () => {
  const { repo } = fixture();
  assert.equal(repo.getCampaigns(hq).length, 1);
  assert.equal(repo.getCampaigns({ id: 'hq-2', product: 'hq' }).length, 1);
  const campaigns = repo.getCampaigns(creator);
  assert.equal(campaigns.length, 2);
  assert.ok(campaigns.every(row => row.assignments.length === 1 && row.assignments[0].creatorId === creator.id));
  assert.throws(() => repo.get('campaign-demo-1', { id: 'hq-2', product: 'hq' }));
  assert.throws(() => repo.mutate(creator, 'campaign-demo-1', row => row));
  assert.throws(() => repo.updateAssignment(creator, 'campaign-demo-1', 'assignment-1-2', row => row));
});
test('Persistence reload, stale campaign revisions, identity changes and rejected storage writes', () => {
  const { repo, storage, fail } = fixture();
  repo.mutate(hq, 'campaign-demo-1', row => ({ ...row, title: 'Campaign revised' }), 0);
  assert.equal(createCampaignRepository(storage).get('campaign-demo-1', hq).title, 'Campaign revised');
  assert.throws(() => repo.mutate(hq, 'campaign-demo-1', row => ({ ...row, title: 'Stale overwrite' }), 0));
  assert.throws(() => repo.mutate(hq, 'campaign-demo-1', row => ({ ...row, ownerId: 'hq-2' }), 1));
  fail();
  assert.throws(() => repo.mutate(hq, 'campaign-demo-1', row => ({ ...row, title: 'Not stored' }), 1));
  assert.equal(repo.get('campaign-demo-1', hq).title, 'Campaign revised');
});
test('Campaign validation preserves unknown followers and rejects invalid references/date/quantity', () => {
  const campaign = campaignSeed()[0]; validateCampaign(campaign);
  assert.equal(campaign.assignments[1].socialProfiles[0].followers, null);
  assert.equal(validDate('2026-02-31'), false); assert.equal(validDate('2026-99-01'), false);
  const bad = structuredClone(campaign); bad.assignments[0].batchId = 'foreign'; assert.throws(() => validateCampaign(bad));
  const count = structuredClone(campaign); count.assignments[0].socialProfiles[0].followers = -1; assert.throws(() => validateCampaign(count));
});
test('Malformed saved campaign state produces actionable error and is never replaced with seed', () => {
  let writes = 0;
  const repo = createCampaignRepository({ get: <T,>() => ({ invalid: true }) as T, set: () => { writes++; } });
  assert.throws(() => repo.getCampaigns(hq), /Data campaign dummy tidak valid/);
  assert.equal(writes, 0);
});
test('New campaign or assignment cannot smuggle progress or paid ledger into master writes', () => {
  const { repo } = fixture(), campaign = campaignSeed()[0];
  const assignment = configureFinance(campaign.assignments[0], hq, { feeAmount: 500, marketingAmount: 0, productBenefitAmount: 0 });
  assert.throws(() => repo.create(hq, { ...campaign, id: 'new-campaign', assignments: [assignment] }), /Assignment baru/);
  assert.throws(() => repo.mutate(hq, campaign.id, row => ({ ...row, assignments: [...row.assignments, { ...assignment, id: 'smuggled' }] }), 0), /Assignment baru/);
  assert.equal(repo.get(campaign.id, hq).assignments.length, 2);
});
test('Assignment outputs become immutable once operations start; new output remains additive', () => {
  const { repo } = fixture();
  repo.updateAssignment(hq, 'campaign-demo-1', 'assignment-1-1', row => configureFinance(row, hq, { feeAmount: 500, marketingAmount: 0, productBenefitAmount: 0 }), 0);
  assert.throws(() => repo.updateAssignment(hq, 'campaign-demo-1', 'assignment-1-1', row => ({ ...row, deliverables: row.deliverables.slice(1) }), 1), /Output/);
  assert.throws(() => repo.updateAssignment(hq, 'campaign-demo-1', 'assignment-1-1', row => ({ ...row, deliverables: row.deliverables.map(item => ({ ...item, postingRequired: false })) }), 1), /Output/);
  repo.updateAssignment(hq, 'campaign-demo-1', 'assignment-1-1', row => ({ ...row, deliverables: [...row.deliverables, { id: 'extra', title: 'Asset tambahan', platform: 'Brand', postingRequired: false, deadline: '2026-10-28' }] }), 1);
  assert.equal(repo.get('campaign-demo-1', hq).assignments[0].deliverables.length, 3);
});
