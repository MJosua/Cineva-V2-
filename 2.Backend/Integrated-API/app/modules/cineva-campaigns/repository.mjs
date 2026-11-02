/** @purpose SQL for the t_cineva_* tables (campaign, stage plan, assignment, execution, finance, cancellation); parameterised, scoped by program/company, list queries paginated. */

const D = col => `DATE_FORMAT(${col}, '%Y-%m-%d')`;
const TS = col => `DATE_FORMAT(${col}, '%Y-%m-%dT%H:%i:%s.%fZ')`;
const lock = on => (on ? ' FOR UPDATE' : '');

// ---------- campaign ----------
export async function insertCampaign(conn, c) {
  await conn.query(
    `INSERT INTO t_cineva_campaign (campaign_id, program_id, company_id, owner_user_id, title, brand, brief, objective, audience, messaging)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [c.id, c.programId, c.companyId, c.ownerUserId, c.title, c.brand, c.brief, c.objective, c.audience, c.messaging]);
}
export const insertBatch = (conn, campaignId, b) => conn.query('INSERT INTO t_cineva_campaign_batch (batch_id, campaign_id, name) VALUES (?,?,?)', [b.id, campaignId, b.name]);
export const insertMilestone = (conn, campaignId, m) => conn.query('INSERT INTO t_cineva_campaign_milestone (milestone_id, campaign_id, title, deadline) VALUES (?,?,?,?)', [m.id, campaignId, m.title, m.deadline]);
export const insertProduct = (conn, campaignId, p) => conn.query('INSERT INTO t_cineva_campaign_product (product_id, campaign_id, name, variant, reference_value) VALUES (?,?,?,?,?)', [p.id, campaignId, p.name, p.variant, p.referenceValue]);

export async function findCampaign(conn, scope, id, { forUpdate = false } = {}) {
  const [rows] = await conn.query(
    `SELECT campaign_id AS id, owner_user_id AS ownerUserId, title, brand, brief, objective, audience, messaging, revision,
            stage_template_id AS stageTemplateId, ${D('stage_start_date')} AS stageStartDate
       FROM t_cineva_campaign WHERE campaign_id = ? AND program_id = ? AND company_id = ?${lock(forUpdate)}`,
    [id, scope.programId, scope.companyId]);
  return rows[0] ?? null;
}
export async function campaignChildren(conn, campaignId) {
  const [milestones] = await conn.query(`SELECT milestone_id AS id, title, ${D('deadline')} AS deadline FROM t_cineva_campaign_milestone WHERE campaign_id = ? ORDER BY deadline, milestone_id LIMIT 100`, [campaignId]);
  const [batches] = await conn.query('SELECT batch_id AS id, name FROM t_cineva_campaign_batch WHERE campaign_id = ? ORDER BY batch_id LIMIT 100', [campaignId]);
  const [products] = await conn.query('SELECT product_id AS id, name, variant, reference_value AS referenceValue FROM t_cineva_campaign_product WHERE campaign_id = ? ORDER BY product_id LIMIT 100', [campaignId]);
  const [holidays] = await conn.query(`SELECT ${D('holiday_date')} AS d FROM t_cineva_stage_holiday WHERE campaign_id = ? ORDER BY holiday_date LIMIT 100`, [campaignId]);
  const extensions = await listExtensions(conn, campaignId);
  return { milestones, batches, products, holidays: holidays.map(row => row.d), extensions };
}
/** HQ sees every campaign in scope; Creator sees only campaigns where they hold an assignment. */
export async function listCampaigns(conn, scope, { creatorUserId = null, limit, offset }) {
  const join = creatorUserId === null ? '' : 'JOIN (SELECT DISTINCT campaign_id FROM t_cineva_assignment WHERE creator_user_id = ?) mine ON mine.campaign_id = c.campaign_id';
  const binds = creatorUserId === null ? [] : [creatorUserId];
  const where = 'WHERE c.program_id = ? AND c.company_id = ?';
  const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM t_cineva_campaign c ${join} ${where}`, [...binds, scope.programId, scope.companyId]);
  const [items] = await conn.query(
    `SELECT c.campaign_id AS id, c.title, c.brand, c.revision, ${TS('c.created_at')} AS createdAt FROM t_cineva_campaign c ${join} ${where}
      ORDER BY c.created_at DESC, c.campaign_id LIMIT ? OFFSET ?`, [...binds, scope.programId, scope.companyId, limit, offset]);
  return { items, total: Number(total) };
}
export async function updateStagePlan(conn, id, templateId, startDate, expectedRevision) {
  const [result] = await conn.query('UPDATE t_cineva_campaign SET stage_template_id = ?, stage_start_date = ?, revision = revision + 1 WHERE campaign_id = ? AND revision = ?', [templateId, startDate, id, expectedRevision]);
  return result.affectedRows === 1;
}
export async function replaceHolidays(conn, id, holidays) {
  await conn.query('DELETE FROM t_cineva_stage_holiday WHERE campaign_id = ?', [id]);
  for (const day of holidays) await conn.query('INSERT INTO t_cineva_stage_holiday (campaign_id, holiday_date) VALUES (?,?)', [id, day]);
}
export async function listExtensions(conn, campaignId) {
  const [rows] = await conn.query(
    `SELECT extension_id AS id, stage_key AS stageKey, days, reason, proof_kind AS proofKind, proof_text AS proofText, proof_file_name AS proofFileName, proof_size_bytes AS proofSizeBytes
       FROM t_cineva_stage_extension WHERE campaign_id = ? ORDER BY extension_id LIMIT 100`, [campaignId]);
  return rows.map(row => ({ ...row, days: Number(row.days) }));
}
export async function insertExtension(conn, campaignId, e, userId) {
  const proof = e.proof;
  await conn.query(
    `INSERT INTO t_cineva_stage_extension (campaign_id, stage_key, days, reason, proof_kind, proof_text, proof_file_name, proof_size_bytes, created_by) VALUES (?,?,?,?,?,?,?,?,?)`,
    [campaignId, e.stageKey, e.days, e.reason, proof.kind, proof.kind === 'text' ? proof.text : null, proof.kind === 'text' ? null : proof.fileName, proof.kind === 'text' ? null : proof.sizeBytes, userId]);
}

// ---------- assignment and deliverables ----------
export async function insertAssignment(conn, campaignId, a) {
  await conn.query(
    `INSERT INTO t_cineva_assignment (assignment_id, campaign_id, batch_id, creator_user_id, creator_name, product_id) VALUES (?,?,?,?,?,?)`,
    [a.id, campaignId, a.batchId, a.creatorUserId, a.creatorName, a.productId ?? null]);
  for (const profile of a.socialProfiles ?? [])
    await conn.query('INSERT INTO t_cineva_social_profile (assignment_id, platform, handle, followers, captured_at) VALUES (?,?,?,?,?)', [a.id, profile.platform, profile.handle, profile.followers ?? null, profile.capturedAt]);
  for (const d of a.deliverables)
    await conn.query('INSERT INTO t_cineva_deliverable (deliverable_id, assignment_id, title, platform, posting_required, deadline, output_owner) VALUES (?,?,?,?,?,?,?)', [d.id, a.id, d.title, d.platform, d.postingRequired ? 1 : 0, d.deadline, d.outputOwner]);
}
const ASSIGNMENT_COLUMNS = `a.assignment_id AS id, a.campaign_id AS campaignId, a.batch_id AS batchId, a.creator_user_id AS creatorUserId, a.creator_name AS creatorName,
  a.product_id AS productId, a.fulfillment, a.fee_amount AS feeAmount, a.marketing_amount AS marketingAmount, a.product_benefit_amount AS productBenefitAmount,
  a.payout_request_id AS payoutRequestId, a.payout_requested_by AS payoutRequestedBy, a.payout_processing AS payoutProcessing`;
export async function findAssignment(conn, scope, id, { forUpdate = false } = {}) {
  const [rows] = await conn.query(
    `SELECT ${ASSIGNMENT_COLUMNS} FROM t_cineva_assignment a JOIN t_cineva_campaign c ON c.campaign_id = a.campaign_id
      WHERE a.assignment_id = ? AND c.program_id = ? AND c.company_id = ?${lock(forUpdate)}`, [id, scope.programId, scope.companyId]);
  return rows[0] ? normaliseAssignment(rows[0]) : null;
}
const normaliseAssignment = row => ({ ...row, feeAmount: Number(row.feeAmount), marketingAmount: Number(row.marketingAmount), productBenefitAmount: Number(row.productBenefitAmount), payoutProcessing: Boolean(row.payoutProcessing) });
export async function assignmentDeliverables(conn, assignmentId) {
  const [rows] = await conn.query(
    `SELECT deliverable_id AS id, title, platform, posting_required AS postingRequired, ${D('deadline')} AS deadline, output_owner AS outputOwner
       FROM t_cineva_deliverable WHERE assignment_id = ? ORDER BY deadline, deliverable_id LIMIT 100`, [assignmentId]);
  return rows.map(row => ({ ...row, postingRequired: Boolean(row.postingRequired) }));
}
export async function findDeliverable(conn, scope, id) {
  const [rows] = await conn.query(
    `SELECT d.deliverable_id AS id, d.assignment_id AS assignmentId, d.posting_required AS postingRequired, d.output_owner AS outputOwner, ${D('d.deadline')} AS deadline, a.creator_user_id AS creatorUserId, a.campaign_id AS campaignId
       FROM t_cineva_deliverable d JOIN t_cineva_assignment a ON a.assignment_id = d.assignment_id JOIN t_cineva_campaign c ON c.campaign_id = a.campaign_id
      WHERE d.deliverable_id = ? AND c.program_id = ? AND c.company_id = ?`, [id, scope.programId, scope.companyId]);
  return rows[0] ? { ...rows[0], postingRequired: Boolean(rows[0].postingRequired) } : null;
}
/** Serialises concurrent writers on one deliverable. */
export const lockDeliverable = (conn, id) => conn.query('SELECT deliverable_id FROM t_cineva_deliverable WHERE deliverable_id = ? FOR UPDATE', [id]);

// ---------- draft, review, posting ----------
export async function deliveryState(conn, deliverableId) {
  const [drafts] = await conn.query(`SELECT version, url, note, ${TS('submitted_at')} AS submittedAt FROM t_cineva_delivery_draft WHERE deliverable_id = ? ORDER BY version LIMIT 100`, [deliverableId]);
  const [reviews] = await conn.query(
    `SELECT r.review_id AS id, r.draft_version AS draftVersion, r.decision, r.note, ${TS('r.reviewed_at')} AS reviewedAt, r.actor,
            (SELECT GROUP_CONCAT(approval_key ORDER BY approval_key) FROM t_cineva_review_approval x WHERE x.review_id = r.review_id) AS approvals
       FROM t_cineva_delivery_review r WHERE r.deliverable_id = ? ORDER BY r.draft_version LIMIT 100`, [deliverableId]);
  const [postings] = await conn.query(`SELECT url, ${D('posted_at')} AS postedAt FROM t_cineva_delivery_posting WHERE deliverable_id = ?`, [deliverableId]);
  const lastDraft = drafts.at(-1) ?? null, lastReview = reviews.at(-1) ?? null;
  const status = !lastDraft ? 'not_submitted' : lastReview?.draftVersion === lastDraft.version ? lastReview.decision : 'submitted';
  return { status, drafts, reviews: reviews.map(r => ({ ...r, approvals: r.approvals ? r.approvals.split(',') : [] })), posting: postings[0] ?? null, lastDraft };
}
export const insertDraft = (conn, deliverableId, version, d, at) => conn.query('INSERT INTO t_cineva_delivery_draft (deliverable_id, version, url, note, submitted_at) VALUES (?,?,?,?,?)', [deliverableId, version, d.url, d.note, at]);
export async function insertReview(conn, deliverableId, r, at) {
  const [result] = await conn.query('INSERT INTO t_cineva_delivery_review (deliverable_id, draft_version, decision, note, reviewed_at, actor) VALUES (?,?,?,?,?,?)', [deliverableId, r.draftVersion, r.decision, r.note, at, r.actor]);
  for (const key of r.approvals ?? []) await conn.query('INSERT INTO t_cineva_review_approval (review_id, approval_key) VALUES (?,?)', [result.insertId, key]);
}
export const insertPosting = (conn, deliverableId, p) => conn.query('INSERT INTO t_cineva_delivery_posting (deliverable_id, url, posted_at) VALUES (?,?,?)', [deliverableId, p.url, p.postedAt]);
export async function approvalDate(conn, deliverableId) {
  const [rows] = await conn.query(`SELECT ${TS('reviewed_at')} AS reviewedAt FROM t_cineva_delivery_review WHERE deliverable_id = ? AND decision = 'approved' ORDER BY draft_version DESC LIMIT 1`, [deliverableId]);
  return rows[0]?.reviewedAt ?? null;
}

// ---------- insight and payout ----------
const METRICS = ['likes', 'comments', 'shares', 'saves', 'reposts', 'views'];
export async function findInsight(conn, id) {
  const [rows] = await conn.query(`SELECT snapshot_id AS id, deliverable_id AS deliverableId, ${D('captured_at')} AS capturedAt, ${METRICS.join(', ')} FROM t_cineva_insight_snapshot WHERE snapshot_id = ?`, [id]);
  return rows[0] ?? null;
}
export const insertInsight = (conn, s) => conn.query(
  `INSERT INTO t_cineva_insight_snapshot (snapshot_id, deliverable_id, captured_at, ${METRICS.join(', ')}) VALUES (?,?,?,?,?,?,?,?,?)`,
  [s.id, s.deliverableId, s.capturedAt, ...METRICS.map(key => s.metrics[key])]);
export async function insightCounts(conn, assignmentId) {
  const [rows] = await conn.query(
    `SELECT d.deliverable_id AS id, (SELECT COUNT(*) FROM t_cineva_insight_snapshot i WHERE i.deliverable_id = d.deliverable_id) AS insights
       FROM t_cineva_deliverable d WHERE d.assignment_id = ? LIMIT 100`, [assignmentId]);
  return new Map(rows.map(row => [row.id, Number(row.insights)]));
}
export const updateFinanceAmounts = (conn, id, a) => conn.query('UPDATE t_cineva_assignment SET fee_amount = ?, marketing_amount = ?, product_benefit_amount = ? WHERE assignment_id = ?', [a.feeAmount, a.marketingAmount, a.productBenefitAmount, id]);
export const markPayoutRequested = (conn, id, requestId, by) => conn.query('UPDATE t_cineva_assignment SET payout_request_id = ?, payout_requested_by = ? WHERE assignment_id = ?', [requestId, by, id]);
export const setPayoutProcessing = (conn, id, processing) => conn.query('UPDATE t_cineva_assignment SET payout_processing = ? WHERE assignment_id = ?', [processing ? 1 : 0, id]);
export async function listPayouts(conn, assignmentId) {
  const [rows] = await conn.query(`SELECT payout_id AS id, amount, ${D('paid_at')} AS paidAt, evidence FROM t_cineva_payout WHERE assignment_id = ? ORDER BY created_at, payout_id LIMIT 100`, [assignmentId]);
  return rows.map(row => ({ ...row, amount: Number(row.amount) }));
}
export const insertPayout = (conn, assignmentId, p) => conn.query('INSERT INTO t_cineva_payout (payout_id, assignment_id, amount, paid_at, evidence) VALUES (?,?,?,?,?)', [p.id, assignmentId, p.amount, p.paidAt, p.evidence]);

// ---------- cancellation and late submission ----------
export const insertCancellation = (conn, campaignId, assignmentId, outcome, decidedBy) => conn.query(
  `INSERT INTO t_cineva_cancellation (campaign_id, assignment_id, party, reason, policy_version, deposit_forfeited, refund_amount, penalty_amount, penalty_percent, penalty_payee, requires_replacement, decided_by)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  [campaignId, assignmentId, outcome.party, outcome.reason ?? null, outcome.policyVersion, outcome.depositForfeited, outcome.refund?.amount ?? 0, outcome.penalty?.amount ?? 0,
    outcome.penalty?.percent ?? null, outcome.penalty?.payee ?? null, outcome.requiresReplacement ? 1 : 0, decidedBy]);
export async function insertLateRequest(conn, deliverableId, requestedBy, reason) {
  const [result] = await conn.query('INSERT INTO t_cineva_late_submission (deliverable_id, requested_by, reason) VALUES (?,?,?)', [deliverableId, requestedBy, reason]);
  return Number(result.insertId);
}
export async function findLateRequest(conn, scope, id, { forUpdate = false } = {}) {
  const [rows] = await conn.query(
    `SELECT l.request_id AS id, l.deliverable_id AS deliverableId, l.requested_by AS requestedBy, l.status FROM t_cineva_late_submission l
       JOIN t_cineva_deliverable d ON d.deliverable_id = l.deliverable_id JOIN t_cineva_assignment a ON a.assignment_id = d.assignment_id JOIN t_cineva_campaign c ON c.campaign_id = a.campaign_id
      WHERE l.request_id = ? AND c.program_id = ? AND c.company_id = ?${lock(forUpdate)}`, [id, scope.programId, scope.companyId]);
  return rows[0] ?? null;
}
export const decideLateRequest = (conn, id, status, by) => conn.query("UPDATE t_cineva_late_submission SET status = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP(3) WHERE request_id = ? AND status = 'pending'", [status, by, id]);
export async function approvedLateRequest(conn, deliverableId) {
  const [rows] = await conn.query("SELECT request_id AS id FROM t_cineva_late_submission WHERE deliverable_id = ? AND status = 'approved' ORDER BY request_id DESC LIMIT 1", [deliverableId]);
  return rows[0] ?? null;
}

export async function creatorHasAssignment(conn, campaignId, userId) {
  const [rows] = await conn.query('SELECT 1 AS ok FROM t_cineva_assignment WHERE campaign_id = ? AND creator_user_id = ? LIMIT 1', [campaignId, userId]);
  return rows.length > 0;
}

// ---------- additions used by the frontend adapter ----------
export const insertDeliverable = (conn, assignmentId, d) => conn.query(
  'INSERT INTO t_cineva_deliverable (deliverable_id, assignment_id, title, platform, posting_required, deadline, output_owner) VALUES (?,?,?,?,?,?,?)',
  [d.id, assignmentId, d.title, d.platform, d.postingRequired ? 1 : 0, d.deadline, d.outputOwner]);
export const setAssignmentProduct = (conn, assignmentId, productId) => conn.query("UPDATE t_cineva_assignment SET product_id = ?, fulfillment = 'pending' WHERE assignment_id = ?", [productId, assignmentId]);
export const setFulfillment = (conn, assignmentId, value) => conn.query('UPDATE t_cineva_assignment SET fulfillment = ? WHERE assignment_id = ?', [value, assignmentId]);
export async function listAssignmentIds(conn, scope, campaignId, { creatorUserId = null, limit = 100 } = {}) {
  const creator = creatorUserId === null ? '' : ' AND a.creator_user_id = ?';
  const [rows] = await conn.query(
    `SELECT a.assignment_id AS id FROM t_cineva_assignment a JOIN t_cineva_campaign c ON c.campaign_id = a.campaign_id
      WHERE a.campaign_id = ? AND c.program_id = ? AND c.company_id = ?${creator} ORDER BY a.created_at, a.assignment_id LIMIT ?`,
    creatorUserId === null ? [campaignId, scope.programId, scope.companyId, limit] : [campaignId, scope.programId, scope.companyId, creatorUserId, limit]);
  return rows.map(row => row.id);
}
export async function assignmentInsights(conn, assignmentId) {
  const [rows] = await conn.query(
    `SELECT i.snapshot_id AS id, i.deliverable_id AS deliverableId, ${D('i.captured_at')} AS capturedAt, i.likes, i.comments, i.shares, i.saves, i.reposts, i.views
       FROM t_cineva_insight_snapshot i JOIN t_cineva_deliverable d ON d.deliverable_id = i.deliverable_id
      WHERE d.assignment_id = ? ORDER BY i.created_at, i.snapshot_id LIMIT 100`, [assignmentId]);
  return rows.map(row => ({ id: row.id, deliverableId: row.deliverableId, capturedAt: row.capturedAt,
    metrics: Object.fromEntries(METRICS.map(key => [key, row[key] === null ? null : Number(row[key])])) }));
}

// ---------- social profiles, rating criteria and ratings ----------
export async function assignmentProfiles(conn, assignmentId) {
  const [rows] = await conn.query(`SELECT platform, handle, followers, ${D('captured_at')} AS capturedAt FROM t_cineva_social_profile WHERE assignment_id = ? ORDER BY profile_id LIMIT 20`, [assignmentId]);
  return rows.map(row => ({ ...row, followers: row.followers === null ? null : Number(row.followers) }));
}
export async function listCriteria(conn, campaignId) {
  const [rows] = await conn.query('SELECT criterion_id AS id, label FROM t_cineva_rating_criterion WHERE campaign_id = ? ORDER BY position, criterion_id LIMIT 50', [campaignId]);
  return rows;
}
export async function insertCriterion(conn, campaignId, c) {
  const [[{ next }]] = await conn.query('SELECT COALESCE(MAX(position), 0) + 1 AS next FROM t_cineva_rating_criterion WHERE campaign_id = ?', [campaignId]);
  await conn.query('INSERT INTO t_cineva_rating_criterion (criterion_id, campaign_id, label, position) VALUES (?,?,?,?)', [c.id, campaignId, c.label, Number(next)]);
}
export async function insertRating(conn, assignmentId, r, at) {
  const [result] = await conn.query('INSERT INTO t_cineva_assignment_rating (assignment_id, rated_by, comment, continue_cooperation, rated_at) VALUES (?,?,?,?,?)', [assignmentId, r.ratedBy, r.comment, r.continueCooperation, at]);
  for (const [criterionId, score] of Object.entries(r.scores)) await conn.query('INSERT INTO t_cineva_rating_score (rating_id, criterion_id, score) VALUES (?,?,?)', [result.insertId, criterionId, score]);
  return Number(result.insertId);
}
export async function listRatings(conn, assignmentId) {
  const [ratings] = await conn.query(
    `SELECT rating_id AS id, rated_by AS ratedBy, comment, continue_cooperation AS continueCooperation, ${TS('rated_at')} AS ratedAt
       FROM t_cineva_assignment_rating WHERE assignment_id = ? ORDER BY rating_id DESC LIMIT 50`, [assignmentId]);
  const out = [];
  for (const rating of ratings) {
    const [scores] = await conn.query('SELECT criterion_id AS criterionId, score FROM t_cineva_rating_score WHERE rating_id = ? ORDER BY criterion_id', [rating.id]);
    out.push({ ...rating, id: Number(rating.id), scores: Object.fromEntries(scores.map(row => [row.criterionId, Number(row.score)])) });
  }
  return out;
}
