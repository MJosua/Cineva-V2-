/** @purpose Integration tests for the Cineva campaign service against a real MySQL (throwaway database `cineva_trial_test`, never hots). */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { createService, CampaignError } from '../service.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(here, '../../../../../../3.Knowledge/scripts/cineva_db_trial_2026_11_02');
const DB = 'cineva_trial_test';
const base = { host: process.env.CINEVA_TRIAL_HOST || '127.0.0.1', port: Number(process.env.CINEVA_TRIAL_PORT || 3307), user: process.env.CINEVA_TRIAL_USER || 'root', password: process.env.CINEVA_TRIAL_PASSWORD || '' };
if (!['127.0.0.1', 'localhost'].includes(base.host)) throw new Error('Tests only run against a loopback MySQL');

let pool, svc, reason = '';
const hq = { userId: 10, programId: 1, companyId: 1, product: 'hq' };
const creator = { userId: 20, programId: 1, companyId: 1, product: 'creator' };
const otherCreator = { userId: 21, programId: 1, companyId: 1, product: 'creator' };
const foreignHq = { userId: 11, programId: 1, companyId: 2, product: 'hq' };
let now = new Date('2026-11-05T03:00:00Z');
const code = promise => promise.then(() => 'no error', error => (error instanceof CampaignError ? error.code : `unexpected:${error.message}`));
const rows = async sql => (await pool.query(sql))[0];

before(async () => {
  try {
    const admin = await mysql.createConnection({ ...base, multipleStatements: true });
    await admin.query(`DROP DATABASE IF EXISTS \`${DB}\`; CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${DB}\`;`);
    await admin.query(fs.readFileSync(path.join(sqlDir, '01_stub_parents.sql'), 'utf8'));
    await admin.query(fs.readFileSync(path.join(sqlDir, '02_cineva_tables.sql'), 'utf8'));
    await admin.query("INSERT INTO m_company (company_id, company_name) VALUES (1,'Cineva'),(2,'Lain'); INSERT INTO m_company_program_list (program_id, system_name) VALUES (1,'Cineva'); INSERT INTO `user` (user_id, firstname) VALUES (10,'hq'),(11,'hq2'),(20,'creator'),(21,'creator2')");
    await admin.end();
    pool = mysql.createPool({ ...base, database: DB, connectionLimit: 5 });
    svc = createService({ pool, clock: () => now });
  } catch (error) { reason = `MySQL trial server unavailable: ${error.code || error.message}`; }
});
after(async () => {
  if (!pool) return;
  await pool.end();
  const admin = await mysql.createConnection(base);
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await admin.end();
});
const guarded = (name, fn) => test(name, async t => { if (reason) return t.skip(reason); await fn(); });

const sampleCampaign = (title = 'Campaign A') => ({ title, brand: 'Brand', brief: 'Brief', objective: 'Obj', audience: 'Aud', messaging: 'Msg', milestones: [{ title: 'Draft', deadline: '2026-11-10' }], products: [{ name: 'Produk', variant: 'V1', referenceValue: 100000 }] });
async function seedAssignment(deadline = '2026-11-10') {
  const campaign = await svc.createCampaign(hq, sampleCampaign(`C-${Math.random()}`));
  const assignment = await svc.addAssignment(hq, campaign.id, { batchId: campaign.batches[0].id, creatorUserId: 20, creatorName: 'Creator', deliverables: [{ title: 'Reels', platform: 'Instagram', postingRequired: true, deadline }] });
  return { campaign, assignment, deliverableId: assignment.deliverables[0].id };
}
const approved = ['client', 'owner'];

guarded('campaign is created with children and is scoped to program and company', async () => {
  const campaign = await svc.createCampaign(hq, sampleCampaign());
  assert.equal(campaign.batches.length, 1);
  assert.equal(campaign.milestones[0].deadline, '2026-11-10');
  assert.equal(campaign.products[0].referenceValue, 100000);
  assert.equal(campaign.stagePlan, null);
  assert.equal(await code(svc.getCampaign(foreignHq, campaign.id)), 'NOT_FOUND');
  assert.equal(await code(svc.getCampaign(creator, campaign.id)), 'NOT_FOUND');
  assert.equal(await code(svc.createCampaign(creator, sampleCampaign())), 'FORBIDDEN');
  assert.equal(await code(svc.createCampaign(hq, { ...sampleCampaign(), title: ' ' })), 'VALIDATION');
});
guarded('list is paginated, capped at 100 rows, and creators only see their campaigns', async () => {
  await svc.createCampaign(hq, sampleCampaign('Paging 1')); await svc.createCampaign(hq, sampleCampaign('Paging 2'));
  const first = await svc.listCampaigns(hq, { limit: 1, offset: 0 });
  assert.equal(first.items.length, 1);
  assert.ok(first.page.total >= 3);
  assert.equal((await svc.listCampaigns(hq, { limit: 100000 })).page.limit, 100);
  assert.equal((await svc.listCampaigns(foreignHq, {})).page.total, 0);
  const { campaign } = await seedAssignment();
  const mine = await svc.listCampaigns(creator, {});
  assert.ok(mine.items.some(item => item.id === campaign.id));
  assert.equal((await svc.listCampaigns(otherCreator, {})).page.total, 0);
});
guarded('a failing child insert rolls the whole campaign back', async () => {
  const flaky = {
    getConnection: async () => {
      const conn = await pool.getConnection();
      const query = conn.query.bind(conn);
      conn.query = (sql, ...rest) => (String(sql).includes('INSERT INTO t_cineva_campaign_milestone') ? Promise.reject(new Error('boom')) : query(sql, ...rest));
      return conn;
    },
  };
  const before = (await rows('SELECT COUNT(*) AS n FROM t_cineva_campaign'))[0].n;
  await assert.rejects(createService({ pool: flaky }).createCampaign(hq, sampleCampaign('Rollback')), /boom/);
  assert.equal((await rows('SELECT COUNT(*) AS n FROM t_cineva_campaign'))[0].n, before);
});
guarded('stage plan uses optimistic revision, and the extension is allowed once for 2 days', async () => {
  const campaign = await svc.createCampaign(hq, sampleCampaign());
  const plan = { templateId: 'reguler-bulanan', startDate: '2026-11-04', holidays: ['2026-11-25', '2026-11-25'] };
  assert.equal(await code(svc.setStagePlan(hq, campaign.id, plan, 5)), 'REVISION_CONFLICT');
  const planned = await svc.setStagePlan(hq, campaign.id, plan, 0);
  assert.deepEqual(planned.stagePlan.holidays, ['2026-11-25']);
  assert.equal(planned.revision, 1);
  assert.equal(await code(svc.setStagePlan(foreignHq, campaign.id, plan, 1)), 'NOT_FOUND');
  const proof = { kind: 'text', text: 'Surat dokter' };
  assert.equal(await code(svc.addExtension(hq, campaign.id, { stageKey: 'konten', days: 3, reason: 'Sakit', proof })), 'EXTENSION_INVALID');
  const extended = await svc.addExtension(hq, campaign.id, { stageKey: 'konten', days: 2, reason: ' Sakit ', proof });
  assert.equal(extended.stagePlan.extensions[0].days, 2);
  assert.equal(extended.stagePlan.extensions[0].reason, 'Sakit');
  await svc.addExtension(hq, campaign.id, { stageKey: 'konten', days: 2, reason: 'Sakit lagi', proof });
  await assert.rejects(svc.addExtension(hq, campaign.id, { stageKey: 'konten', days: 1, reason: 'Lagi', proof }), error => error.code === 'EXTENSION_INVALID' && error.details.some(issue => issue.code === 'request_limit'));
  assert.equal(await code(svc.addExtension(hq, (await svc.createCampaign(hq, sampleCampaign())).id, { stageKey: 'k', days: 1, reason: 'x', proof })), 'NO_STAGE_PLAN');
});
guarded('execution: QC needs both approvals, posting follows approval, payout follows the gate', async () => {
  const { assignment, deliverableId } = await seedAssignment();
  const id = assignment.id;
  await svc.configureFinance(hq, id, { feeAmount: 2000000, marketingAmount: 500000, productBenefitAmount: 0 });
  assert.equal(await code(svc.requestPayout(creator, id)), 'PAYOUT_GATE_CLOSED');
  assert.equal(await code(svc.submitDraft(otherCreator, deliverableId, { url: 'https://example.test/d' })), 'NOT_FOUND');
  assert.equal(await code(svc.submitDraft(creator, deliverableId, { url: 'javascript:alert(1)' })), 'VALIDATION');
  assert.equal((await svc.submitDraft(creator, deliverableId, { url: 'https://example.test/d1', note: 'v1' })).status, 'submitted');
  assert.equal(await code(svc.submitDraft(creator, deliverableId, { url: 'https://example.test/d2' })), 'DRAFT_NOT_ALLOWED');
  assert.equal(await code(svc.reviewDraft(creator, deliverableId, { decision: 'approved', draftVersion: 1, approvals: approved })), 'FORBIDDEN');
  assert.equal(await code(svc.reviewDraft(hq, deliverableId, { decision: 'approved', draftVersion: 1, approvals: ['client'] })), 'APPROVALS_INCOMPLETE');
  assert.equal(await code(svc.reviewDraft(hq, deliverableId, { decision: 'revision_requested', draftVersion: 1, note: ' ' })), 'VALIDATION');
  assert.equal((await svc.reviewDraft(hq, deliverableId, { decision: 'revision_requested', draftVersion: 1, note: 'Perbaiki' })).status, 'revision_requested');
  assert.equal(await code(svc.reviewDraft(hq, deliverableId, { decision: 'approved', draftVersion: 1, approvals: approved })), 'REVIEW_STALE');
  assert.equal((await svc.submitDraft(creator, deliverableId, { url: 'https://example.test/d2' })).lastDraft.version, 2);
  assert.equal(await code(svc.recordPosting(creator, deliverableId, { url: 'https://example.test/p', postedAt: '2026-11-06' })), 'NOT_APPROVED');
  const reviewed = await svc.reviewDraft(hq, deliverableId, { decision: 'approved', draftVersion: 2, approvals: approved });
  assert.deepEqual([reviewed.status, reviewed.reviews.at(-1).approvals], ['approved', ['client', 'owner']]);
  assert.equal(await code(svc.recordPosting(creator, deliverableId, { url: 'https://example.test/p', postedAt: '2026-11-01' })), 'POSTED_BEFORE_APPROVAL');
  assert.equal((await svc.recordPosting(creator, deliverableId, { url: 'https://example.test/p', postedAt: '2026-11-06' })).posting.postedAt, '2026-11-06');
  assert.equal(await code(svc.recordPosting(creator, deliverableId, { url: 'https://example.test/p2', postedAt: '2026-11-06' })), 'ALREADY_POSTED');
  assert.equal(await code(svc.recordInsight(creator, deliverableId, { id: 'ins-early', capturedAt: '2026-11-05', metrics: { likes: 1 } })), 'INSIGHT_NOT_ALLOWED');
  const metrics = { likes: 10, comments: 2, shares: 0, saves: 0, reposts: 0, views: 100 };
  assert.deepEqual(await svc.recordInsight(creator, deliverableId, { id: 'ins-1', capturedAt: '2026-11-13', metrics }), { id: 'ins-1', created: true });
  assert.deepEqual(await svc.recordInsight(creator, deliverableId, { id: 'ins-1', capturedAt: '2026-11-13', metrics }), { id: 'ins-1', created: false });
  assert.equal(await code(svc.recordInsight(creator, deliverableId, { id: 'ins-1', capturedAt: '2026-11-13', metrics: { ...metrics, likes: 11 } })), 'INSIGHT_IMMUTABLE');
  assert.equal(await code(svc.recordInsight(creator, deliverableId, { id: 'ins-bad', capturedAt: '2026-11-13', metrics: { likes: -1 } })), 'VALIDATION');
  assert.equal(await code(svc.recordPayout(hq, id, { id: 'pay-0', amount: 1, paidAt: '2026-11-20', evidence: 'ref' })), 'NOT_REQUESTED');
  const requested = await svc.requestPayout(creator, id);
  assert.equal(requested.payoutRequestId, `request-${id}`);
  assert.equal(requested.paymentGate.open, true);
  assert.equal(await code(svc.requestPayout(otherCreator, id)), 'NOT_FOUND');
  const first = await svc.recordPayout(hq, id, { id: 'pay-1', amount: 1500000, paidAt: '2026-11-20', evidence: 'ref-1' });
  assert.deepEqual([first.paid, first.remaining, first.payoutProcessing], [1500000, 500000, true]);
  assert.equal((await svc.recordPayout(hq, id, { id: 'pay-1', amount: 1500000, paidAt: '2026-11-20', evidence: 'ref-1' })).paid, 1500000);
  assert.equal(await code(svc.recordPayout(hq, id, { id: 'pay-1', amount: 1, paidAt: '2026-11-20', evidence: 'x' })), 'PAYOUT_ID_REUSED');
  assert.equal(await code(svc.recordPayout(hq, id, { id: 'pay-2', amount: 500001, paidAt: '2026-11-21', evidence: 'x' })), 'PAYOUT_EXCEEDS_FEE');
  const paid = await svc.recordPayout(hq, id, { id: 'pay-2', amount: 500000, paidAt: '2026-11-21', evidence: 'ref-2' });
  assert.deepEqual([paid.remaining, paid.payoutProcessing], [0, false]);
  assert.equal(await code(svc.configureFinance(hq, id, { feeAmount: 1000000 })), 'FEE_BELOW_PAID');
  assert.equal(creator && (await svc.getAssignment(creator, id)).marketingAmount, undefined);
  assert.equal((await svc.getAssignment(hq, id)).marketingAmount, 500000);
});
guarded('draft window closes after the deadline and reopens only after HQ approves a late request', async () => {
  const { deliverableId } = await seedAssignment('2026-11-10');
  const original = now;
  now = new Date('2026-11-12T03:00:00Z');
  try {
    assert.equal(await code(svc.submitDraft(creator, deliverableId, { url: 'https://example.test/late' })), 'WINDOW_CLOSED');
    assert.equal(await code(svc.requestLateSubmission(hq, deliverableId, { reason: 'x' })), 'FORBIDDEN');
    assert.equal(await code(svc.requestLateSubmission(creator, deliverableId, { reason: ' ' })), 'VALIDATION');
    const request = await svc.requestLateSubmission(creator, deliverableId, { reason: 'Listrik padam' });
    assert.equal(await code(svc.submitDraft(creator, deliverableId, { url: 'https://example.test/late' })), 'WINDOW_CLOSED');
    assert.equal(await code(svc.decideLateSubmission(creator, request.id, { decision: 'approved' })), 'FORBIDDEN');
    assert.equal(await code(svc.decideLateSubmission(foreignHq, request.id, { decision: 'approved' })), 'NOT_FOUND');
    assert.deepEqual(await svc.decideLateSubmission(hq, request.id, { decision: 'approved' }), { id: request.id, status: 'approved' });
    assert.equal(await code(svc.decideLateSubmission(hq, request.id, { decision: 'rejected' })), 'ALREADY_DECIDED');
    assert.equal((await svc.submitDraft(creator, deliverableId, { url: 'https://example.test/late' })).status, 'submitted');
    const decided = await rows(`SELECT status, decided_by, decided_at FROM t_cineva_late_submission WHERE request_id = ${request.id}`);
    assert.deepEqual([decided[0].status, decided[0].decided_by, decided[0].decided_at instanceof Date], ['approved', '10', true]);
  } finally { now = original; }
});
guarded('cancellation applies the client policy and is stored with the decider', async () => {
  const { campaign, assignment } = await seedAssignment();
  const crew = await svc.recordCancellation(hq, campaign.id, { party: 'crew', assignmentId: assignment.id, amounts: { totalFee: 2000000 }, extraCharges: { productReplacement: 50000 } });
  assert.deepEqual([crew.penalty.amount, crew.requiresReplacement, crew.total], [300000, true, 350000]);
  const sick = await svc.recordCancellation(hq, campaign.id, { party: 'creator', reason: 'valid_reason', amounts: { totalFee: 2000000 }, extraCharges: { productReplacement: 0 } });
  assert.equal(sick.penalty, null);
  const storm = await svc.recordCancellation(hq, campaign.id, { party: 'brand', reason: 'force_majeure', deposit: 3000000, amounts: { amountPaid: 6000000 } });
  assert.deepEqual([storm.depositForfeited, storm.refund.amount], [0, 3000000]);
  assert.equal(await code(svc.recordCancellation(hq, campaign.id, { party: 'brand', reason: 'valid_reason', deposit: 1 })), 'CANCELLATION_INVALID');
  assert.equal(await code(svc.recordCancellation(hq, campaign.id, { party: 'nobody' })), 'CANCELLATION_INVALID');
  assert.equal(await code(svc.recordCancellation(creator, campaign.id, { party: 'brand', deposit: 1 })), 'FORBIDDEN');
  assert.equal(await code(svc.recordCancellation(foreignHq, campaign.id, { party: 'brand', deposit: 1 })), 'NOT_FOUND');
  const stored = await rows(`SELECT party, reason, penalty_amount, refund_amount, penalty_payee, decided_by FROM t_cineva_cancellation WHERE campaign_id = '${campaign.id}' ORDER BY cancellation_id`);
  assert.deepEqual(stored.map(row => [row.party, row.reason, Number(row.penalty_amount), Number(row.refund_amount), row.penalty_payee, row.decided_by]), [
    ['crew', null, 300000, 0, null, '10'], ['creator', 'valid_reason', 0, 0, null, '10'], ['brand', 'force_majeure', 0, 3000000, null, '10']]);
});

guarded('HTTP routes: fail closed without a runtime, then serve the service with envelopes and status codes', async () => {
  const { createRequire } = await import('node:module');
  const { createCampaignRouter } = createRequire(import.meta.url)('../routes.js');
  const express = (await import('express')).default;
  const listen = app => new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  const closed = express(); closed.use('/api/cineva/v1', createCampaignRouter({ Router: express.Router, runtime: null }));
  const closedServer = await listen(closed);
  try {
    const res = await fetch(`http://127.0.0.1:${closedServer.address().port}/api/cineva/v1/campaigns`);
    assert.deepEqual([res.status, (await res.json()).error.code], [503, 'CINEVA_CAMPAIGNS_NOT_CONFIGURED']);
  } finally { closedServer.close(); }

  const principals = { hq, creator, foreignHq };
  const runtime = { service: svc, authorize: async req => { const p = principals[req.get('x-test-principal')]; if (!p) throw Object.assign(new Error('no principal'), { code: 'UNAUTHENTICATED', status: 401 }); return p; } };
  const app = express(); app.use(express.json()); app.use('/api/cineva/v1', createCampaignRouter({ Router: express.Router, runtime }));
  const server = await listen(app), url = `http://127.0.0.1:${server.address().port}/api/cineva/v1`;
  const call = async (method, route, who, body) => {
    const res = await fetch(url + route, { method, headers: { 'content-type': 'application/json', ...(who ? { 'x-test-principal': who } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, json: await res.json() };
  };
  try {
    assert.equal((await call('GET', '/campaigns', null)).status, 401);
    const created = await call('POST', '/campaigns', 'hq', sampleCampaign('Via HTTP'));
    assert.equal(created.status, 200);
    assert.equal(created.json.success, true);
    const id = created.json.data.id;
    assert.equal((await call('GET', `/campaigns/${id}`, 'foreignHq')).status, 404);
    assert.equal((await call('POST', '/campaigns', 'creator', sampleCampaign())).status, 403);
    const invalid = await call('POST', '/campaigns', 'hq', { ...sampleCampaign(), title: '' });
    assert.deepEqual([invalid.status, invalid.json.error.code], [422, 'VALIDATION']);
    const listed = await call('GET', '/campaigns?limit=1&offset=0', 'hq');
    assert.deepEqual([listed.json.data.items.length, listed.json.data.page.limit], [1, 1]);
    const conflict = await call('PUT', `/campaigns/${id}/stage-plan`, 'hq', { templateId: 'reguler-bulanan', startDate: '2026-11-04', holidays: [], expectedRevision: 9 });
    assert.deepEqual([conflict.status, conflict.json.error.code], [409, 'REVISION_CONFLICT']);
    const cancelled = await call('POST', `/campaigns/${id}/cancellations`, 'hq', { party: 'brand', deposit: 1000000 });
    assert.deepEqual([cancelled.status, cancelled.json.data.depositForfeited], [200, 1000000]);
  } finally { server.close(); }
});

guarded('setup additions, product choice, fulfillment and assignment listing', async () => {
  const { campaign, assignment } = await seedAssignment();
  assert.equal(await code(svc.addBatch(creator, campaign.id, { name: 'B2' })), 'FORBIDDEN');
  const batch = await svc.addBatch(hq, campaign.id, { name: 'Batch 2' });
  await svc.addMilestone(hq, campaign.id, { title: 'Posting', deadline: '2026-11-30' });
  const product = await svc.addProduct(hq, campaign.id, { name: 'Produk 2', variant: 'V2', referenceValue: 50000 });
  assert.equal(await code(svc.addMilestone(hq, campaign.id, { title: 'x', deadline: '2026-02-30' })), 'VALIDATION');
  const detail = await svc.getCampaign(hq, campaign.id);
  assert.deepEqual([detail.batches.length, detail.milestones.length, detail.products.length], [2, 2, 2]);
  const item = await svc.addDeliverable(hq, assignment.id, { title: 'Story', platform: 'Instagram', postingRequired: true, deadline: '2026-11-20' });
  assert.equal((await svc.getAssignment(hq, assignment.id)).deliverables.length, 2);
  assert.equal(await code(svc.addDeliverable(creator, assignment.id, { title: 'x', platform: 'x', deadline: '2026-11-20' })), 'FORBIDDEN');
  assert.ok(item.id && batch.id);
  assert.equal(await code(svc.progressFulfillment(hq, assignment.id, { next: 'ordered' })), 'PRODUCT_NOT_CHOSEN');
  assert.equal(await code(svc.chooseProduct(creator, assignment.id, { productId: 'nope' })), 'VALIDATION');
  assert.equal((await svc.chooseProduct(creator, assignment.id, { productId: product.id })).productId, product.id);
  assert.equal(await code(svc.progressFulfillment(creator, assignment.id, { next: 'ordered' })), 'FULFILLMENT_INVALID');
  assert.equal(await code(svc.progressFulfillment(hq, assignment.id, { next: 'received' })), 'FULFILLMENT_INVALID');
  assert.equal((await svc.progressFulfillment(hq, assignment.id, { next: 'ordered' })).fulfillment, 'ordered');
  assert.equal(await code(svc.chooseProduct(creator, assignment.id, { productId: product.id })), 'PRODUCT_LOCKED');
  assert.equal((await svc.progressFulfillment(creator, assignment.id, { next: 'received' })).fulfillment, 'received');
  const listed = await svc.listAssignments(hq, campaign.id);
  assert.equal(listed.items.length, 1);
  assert.deepEqual((await svc.listAssignments(creator, campaign.id)).items.map(row => row.id), [assignment.id]);
  assert.equal(await code(svc.listAssignments(otherCreator, campaign.id)), 'NOT_FOUND');
});

guarded('rating: criteria are configured per campaign, ratings are HQ-only, validated 1-5, and profiles are returned', async () => {
  const campaign = await svc.createCampaign(hq, sampleCampaign(`R-${Math.random()}`));
  const assignment = await svc.addAssignment(hq, campaign.id, { batchId: campaign.batches[0].id, creatorUserId: 20, creatorName: 'Creator',
    socialProfiles: [{ platform: 'Instagram', handle: '@creator', followers: 12000, capturedAt: '2026-11-01' }],
    deliverables: [{ title: 'Reels', platform: 'Instagram', postingRequired: true, deadline: '2099-01-01' }] });
  assert.deepEqual(assignment.socialProfiles, [{ platform: 'Instagram', handle: '@creator', followers: 12000, capturedAt: '2026-11-01' }]);
  assert.equal(await code(svc.recordRating(hq, assignment.id, { scores: {} })), 'NO_CRITERIA');
  assert.equal(await code(svc.addRatingCriterion(creator, campaign.id, { label: 'Ketepatan waktu' })), 'FORBIDDEN');
  const timeliness = await svc.addRatingCriterion(hq, campaign.id, { label: 'Ketepatan waktu' });
  const quality = await svc.addRatingCriterion(hq, campaign.id, { label: 'Kualitas hasil' });
  assert.equal(await code(svc.addRatingCriterion(hq, campaign.id, { label: ' ketepatan WAKTU ' })), 'CRITERION_EXISTS');
  assert.deepEqual((await svc.getCampaign(hq, campaign.id)).ratingCriteria.map(item => item.label), ['Ketepatan waktu', 'Kualitas hasil']);
  assert.equal(await code(svc.recordRating(creator, assignment.id, { scores: { [timeliness.id]: 5, [quality.id]: 5 } })), 'FORBIDDEN');
  assert.equal(await code(svc.recordRating(hq, assignment.id, { scores: { [timeliness.id]: 5 } })), 'VALIDATION');
  assert.equal(await code(svc.recordRating(hq, assignment.id, { scores: { [timeliness.id]: 6, [quality.id]: 5 } })), 'VALIDATION');
  assert.equal(await code(svc.recordRating(hq, assignment.id, { scores: { [timeliness.id]: 4, [quality.id]: 4, nope: 3 } })), 'VALIDATION');
  assert.equal(await code(svc.recordRating(hq, assignment.id, { scores: { [timeliness.id]: 4, [quality.id]: 4 }, continueCooperation: 'maybe' })), 'VALIDATION');
  const rated = await svc.recordRating(hq, assignment.id, { scores: { [timeliness.id]: 5, [quality.id]: 3 }, comment: 'Baik', continueCooperation: 'yes' });
  assert.deepEqual([rated.ratings.length, rated.ratings[0].scores[quality.id], rated.ratings[0].continueCooperation, rated.ratings[0].ratedBy], [1, 3, 'yes', '10']);
  await svc.recordRating(hq, assignment.id, { scores: { [timeliness.id]: 4, [quality.id]: 4 } });
  assert.equal((await svc.getAssignment(hq, assignment.id)).ratings.length, 2);
  assert.equal('ratings' in (await svc.getAssignment(creator, assignment.id)), false);
  assert.equal(await code(svc.recordRating(foreignHq, assignment.id, { scores: { [timeliness.id]: 5, [quality.id]: 5 } })), 'NOT_FOUND');
  const other = await svc.createCampaign(hq, sampleCampaign(`R2-${Math.random()}`));
  const foreign = await svc.addRatingCriterion(hq, other.id, { label: 'Lain' });
  assert.equal(await code(svc.recordRating(hq, assignment.id, { scores: { [timeliness.id]: 5, [quality.id]: 5, [foreign.id]: 5 } })), 'VALIDATION');
});
