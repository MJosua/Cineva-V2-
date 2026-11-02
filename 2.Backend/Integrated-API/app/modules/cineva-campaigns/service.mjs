/** @purpose Cineva campaign use cases (campaign, stage plan, execution/QC, insight, payout, cancellation, late submission) over t_cineva_*; rules come from shared @hots kits. */
import { randomUUID } from 'node:crypto';
import * as repo from './repository.mjs';
import { withConnection, withTransaction } from './db.mjs';
import { defaultConfig } from './config.mjs';
import { evaluateCancellation, evaluateExtension, evaluateGate } from './policyPorts.mjs';

export class CampaignError extends Error {
  constructor(code, status = 400, message = code, details) { super(message); this.code = code; this.status = status; this.details = details; }
}
const fail = (code, status, message, details) => { throw new CampaignError(code, status, message, details); };
const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
const isMoney = value => Number.isSafeInteger(value) && value >= 0;
const text = (value, label, max = 255) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail('VALIDATION', 422, `${label} wajib diisi (maksimal ${max} karakter).`);
  return value.trim();
};
const optionalText = (value, label, max) => (value === undefined || value === null || value === '' ? '' : text(value, label, max));
const httpUrl = value => {
  try {
    const url = new URL(String(value).trim());
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.href.length > 2048) throw new Error();
    return url.href;
  } catch { return fail('VALIDATION', 422, 'Gunakan URL http atau https yang valid tanpa username/password.'); }
};
const sqlTime = date => date.toISOString().replace('T', ' ').replace('Z', '');
const wibDate = value => new Date(value).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

export function createService({ pool, config = defaultConfig, clock = () => new Date(), events = { emit() {} } }) {
  const scopeOf = p => ({ programId: p.programId, companyId: p.companyId });
  const today = () => wibDate(clock());
  const hq = p => { if (p.product !== 'hq') fail('FORBIDDEN', 403, 'Hanya HQ yang dapat melakukan tindakan ini.'); };
  const emit = (campaignId, kind) => events.emit('cineva_campaign_changed', { campaignId, kind });
  const pageOf = ({ limit, offset } = {}) => {
    const size = Number.isInteger(limit) && limit > 0 ? Math.min(limit, config.maxPageSize) : 25;
    return { limit: size, offset: Number.isInteger(offset) && offset >= 0 ? offset : 0 };
  };

  async function requireCampaign(conn, p, id, options) {
    const row = await repo.findCampaign(conn, scopeOf(p), id, options);
    if (!row) fail('NOT_FOUND', 404, 'Campaign tidak ditemukan.');
    if (p.product === 'creator' && !(await repo.creatorHasAssignment(conn, id, p.userId))) fail('NOT_FOUND', 404, 'Campaign tidak ditemukan.');
    return row;
  }
  const requireOwnerHQ = (p, campaign) => { hq(p); if (campaign.ownerUserId !== p.userId) fail('FORBIDDEN', 403, 'Hanya HQ pemilik campaign.'); };
  async function requireAssignment(conn, p, id, options) {
    const row = await repo.findAssignment(conn, scopeOf(p), id, options);
    if (!row || (p.product === 'creator' && row.creatorUserId !== p.userId)) fail('NOT_FOUND', 404, 'Assignment tidak ditemukan.');
    return row;
  }
  async function requireDeliverable(conn, p, id) {
    const row = await repo.findDeliverable(conn, scopeOf(p), id);
    if (!row || (p.product === 'creator' && row.creatorUserId !== p.userId)) fail('NOT_FOUND', 404, 'Deliverable tidak ditemukan.');
    return row;
  }
  const ownerCreator = (p, deliverableOrAssignment) => {
    if (p.product !== 'creator' || deliverableOrAssignment.creatorUserId !== p.userId) fail('FORBIDDEN', 403, 'Tindakan ini milik Creator yang ditugaskan.');
  };

  /** Payout gate from stored facts: posts live, insight recorded, every Creator-owned deliverable QC-approved. */
  async function paymentGate(conn, assignmentId) {
    const deliverables = await repo.assignmentDeliverables(conn, assignmentId), counts = await repo.insightCounts(conn, assignmentId);
    const states = new Map();
    for (const item of deliverables) states.set(item.id, await repo.deliveryState(conn, item.id));
    const posting = deliverables.filter(item => item.postingRequired), own = deliverables.filter(item => item.outputOwner !== 'brand');
    return evaluateGate(config.paymentKeys, {
      post_live: posting.every(item => states.get(item.id).posting !== null),
      insight_submitted: posting.every(item => (counts.get(item.id) ?? 0) > 0),
      obligations_complete: own.length > 0 && own.every(item => states.get(item.id).status === 'approved'),
    });
  }

  const service = {
    // ----- campaign -----
    async createCampaign(p, input) {
      hq(p);
      const campaign = {
        id: randomUUID(), programId: p.programId, companyId: p.companyId, ownerUserId: p.userId,
        title: text(input.title, 'Judul'), brand: text(input.brand, 'Brand'), brief: text(input.brief, 'Brief', 5000),
        objective: text(input.objective, 'Objective', 2000), audience: text(input.audience, 'Audience', 2000), messaging: text(input.messaging, 'Key messaging', 2000),
      };
      const batches = (input.batches?.length ? input.batches : [{ name: 'Batch 1' }]).map(b => ({ id: randomUUID(), name: text(b.name, 'Nama batch') }));
      const milestones = (input.milestones ?? []).map(m => {
        if (!isDate(m.deadline)) fail('VALIDATION', 422, 'Deadline milestone harus tanggal YYYY-MM-DD yang valid.');
        return { id: randomUUID(), title: text(m.title, 'Nama milestone'), deadline: m.deadline };
      });
      const products = (input.products ?? []).map(item => {
        if (!isMoney(item.referenceValue ?? 0)) fail('VALIDATION', 422, 'Nilai produk harus rupiah bulat non-negatif.');
        return { id: randomUUID(), name: text(item.name, 'Nama produk'), variant: optionalText(item.variant, 'Varian', 255), referenceValue: item.referenceValue ?? 0 };
      });
      if (batches.length > 50 || milestones.length > 100 || products.length > 100) fail('VALIDATION', 422, 'Jumlah batch, milestone atau produk melebihi batas.');
      await withTransaction(pool, async conn => {
        await repo.insertCampaign(conn, campaign);
        for (const item of batches) await repo.insertBatch(conn, campaign.id, item);
        for (const item of milestones) await repo.insertMilestone(conn, campaign.id, item);
        for (const item of products) await repo.insertProduct(conn, campaign.id, item);
      });
      emit(campaign.id, 'created');
      return service.getCampaign(p, campaign.id);
    },
    listCampaigns(p, paging) {
      const { limit, offset } = pageOf(paging);
      return withConnection(pool, async conn => {
        const { items, total } = await repo.listCampaigns(conn, scopeOf(p), { creatorUserId: p.product === 'creator' ? p.userId : null, limit, offset });
        return { items, page: { limit, offset, total } };
      });
    },
    getCampaign(p, id) {
      return withConnection(pool, async conn => {
        const campaign = await requireCampaign(conn, p, id), children = await repo.campaignChildren(conn, id), ratingCriteria = await repo.listCriteria(conn, id);
        const { stageTemplateId, stageStartDate, ...base } = campaign;
        return {
          ...base, milestones: children.milestones, batches: children.batches, products: children.products, ratingCriteria,
          stagePlan: stageTemplateId ? { templateId: stageTemplateId, startDate: stageStartDate, holidays: children.holidays, extensions: children.extensions } : null,
        };
      });
    },
    async setStagePlan(p, id, input, expectedRevision) {
      const templateId = text(input.templateId, 'Template tahap', 50);
      if (!isDate(input.startDate)) fail('VALIDATION', 422, 'Tanggal mulai tidak valid.');
      const holidays = input.holidays;
      if (!Array.isArray(holidays) || holidays.length > 100 || !holidays.every(isDate)) fail('VALIDATION', 422, 'Daftar libur harus larik tanggal YYYY-MM-DD (kosong berarti tanpa libur).');
      if (!Number.isInteger(expectedRevision) || expectedRevision < 0) fail('VALIDATION', 422, 'Revisi yang diharapkan wajib diisi.');
      await withTransaction(pool, async conn => {
        const campaign = await requireCampaign(conn, p, id, { forUpdate: true });
        requireOwnerHQ(p, campaign);
        if (!(await repo.updateStagePlan(conn, id, templateId, input.startDate, expectedRevision))) fail('REVISION_CONFLICT', 409, 'Campaign berubah. Muat ulang sebelum menyimpan.');
        await repo.replaceHolidays(conn, id, [...new Set(holidays)]);
      });
      emit(id, 'stage_plan');
      return service.getCampaign(p, id);
    },
    async addExtension(p, id, input) {
      const request = { stageKey: text(input.stageKey, 'Tahap', 50), days: input.days, reason: input.reason, proof: input.proof };
      await withTransaction(pool, async conn => {
        const campaign = await requireCampaign(conn, p, id, { forUpdate: true });
        requireOwnerHQ(p, campaign);
        if (!campaign.stageTemplateId) fail('NO_STAGE_PLAN', 409, 'Susun kalender tahap lebih dulu.');
        const used = await repo.listExtensions(conn, id), verdict = evaluateExtension(request, used, config.extensionLimits);
        if (!verdict.ok) fail('EXTENSION_INVALID', 422, 'Pengajuan perpanjangan tidak valid.', verdict.issues);
        await repo.insertExtension(conn, id, { ...request, reason: request.reason.trim() }, p.userId);
      });
      emit(id, 'extension');
      return service.getCampaign(p, id);
    },

    // ----- assignment -----
    async addAssignment(p, campaignId, input) {
      const assignment = { id: randomUUID(), batchId: text(input.batchId, 'Batch', 36), creatorUserId: input.creatorUserId, creatorName: text(input.creatorName, 'Nama Creator'), productId: input.productId ?? null, socialProfiles: [], deliverables: [] };
      if (!Number.isInteger(assignment.creatorUserId) || assignment.creatorUserId < 1) fail('VALIDATION', 422, 'Creator tidak valid.');
      if (!Array.isArray(input.deliverables) || !input.deliverables.length || input.deliverables.length > 50) fail('VALIDATION', 422, 'Isi 1 sampai 50 deliverable.');
      assignment.deliverables = input.deliverables.map(item => {
        if (!isDate(item.deadline)) fail('VALIDATION', 422, 'Deadline deliverable tidak valid.');
        const owner = item.outputOwner ?? (item.postingRequired ? 'creator' : 'brand');
        if (!['creator', 'brand'].includes(owner)) fail('VALIDATION', 422, 'Pemilik output tidak valid.');
        return { id: randomUUID(), title: text(item.title, 'Judul deliverable'), platform: text(item.platform, 'Platform', 50), postingRequired: Boolean(item.postingRequired) && owner === 'creator', deadline: item.deadline, outputOwner: owner };
      });
      assignment.socialProfiles = (input.socialProfiles ?? []).slice(0, 20).map(item => {
        if (!isDate(item.capturedAt) || (item.followers != null && !isMoney(item.followers))) fail('VALIDATION', 422, 'Snapshot akun sosial tidak valid.');
        return { platform: text(item.platform, 'Platform', 50), handle: text(item.handle, 'Handle'), followers: item.followers ?? null, capturedAt: item.capturedAt };
      });
      await withTransaction(pool, async conn => {
        const campaign = await requireCampaign(conn, p, campaignId, { forUpdate: true });
        requireOwnerHQ(p, campaign);
        const children = await repo.campaignChildren(conn, campaignId);
        if (!children.batches.some(batch => batch.id === assignment.batchId)) fail('VALIDATION', 422, 'Batch bukan milik campaign ini.');
        if (assignment.productId && !children.products.some(item => item.id === assignment.productId)) fail('VALIDATION', 422, 'Produk bukan milik campaign ini.');
        await repo.insertAssignment(conn, campaignId, assignment);
      });
      emit(campaignId, 'assignment');
      return service.getAssignment(p, assignment.id);
    },
    getAssignment(p, id) {
      return withConnection(pool, async conn => {
        const assignment = await requireAssignment(conn, p, id), deliverables = await repo.assignmentDeliverables(conn, id);
        const detailed = [];
        for (const item of deliverables) {
          const state = await repo.deliveryState(conn, item.id);
          detailed.push({ ...item, status: state.status, drafts: state.drafts, reviews: state.reviews, posting: state.posting });
        }
        const payouts = await repo.listPayouts(conn, id), paid = payouts.reduce((sum, item) => sum + item.amount, 0), gate = await paymentGate(conn, id);
        const insights = await repo.assignmentInsights(conn, id), socialProfiles = await repo.assignmentProfiles(conn, id);
        const ratings = p.product === 'hq' ? await repo.listRatings(conn, id) : undefined;
        const { marketingAmount, ...rest } = assignment;
        return { ...(p.product === 'hq' ? { ...rest, marketingAmount } : rest), deliverables: detailed, payouts, insights, socialProfiles, ...(ratings ? { ratings } : {}), paid, remaining: assignment.feeAmount - paid, paymentGate: gate };
      });
    },
    async listAssignments(p, campaignId) {
      const ids = await withConnection(pool, async conn => {
        await requireCampaign(conn, p, campaignId);
        return repo.listAssignmentIds(conn, scopeOf(p), campaignId, { creatorUserId: p.product === 'creator' ? p.userId : null, limit: config.maxPageSize });
      });
      const items = [];
      for (const id of ids) items.push(await service.getAssignment(p, id));
      return { items };
    },
    async addBatch(p, campaignId, input) {
      const batch = { id: randomUUID(), name: text(input.name, 'Nama batch') };
      await withTransaction(pool, async conn => { requireOwnerHQ(p, await requireCampaign(conn, p, campaignId, { forUpdate: true })); await repo.insertBatch(conn, campaignId, batch); });
      emit(campaignId, 'batch');
      return batch;
    },
    async addMilestone(p, campaignId, input) {
      if (!isDate(input.deadline)) fail('VALIDATION', 422, 'Deadline milestone harus tanggal YYYY-MM-DD yang valid.');
      const milestone = { id: randomUUID(), title: text(input.title, 'Nama milestone'), deadline: input.deadline };
      await withTransaction(pool, async conn => { requireOwnerHQ(p, await requireCampaign(conn, p, campaignId, { forUpdate: true })); await repo.insertMilestone(conn, campaignId, milestone); });
      emit(campaignId, 'milestone');
      return milestone;
    },
    async addProduct(p, campaignId, input) {
      if (!isMoney(input.referenceValue ?? 0)) fail('VALIDATION', 422, 'Nilai produk harus rupiah bulat non-negatif.');
      const product = { id: randomUUID(), name: text(input.name, 'Nama produk'), variant: optionalText(input.variant, 'Varian', 255), referenceValue: input.referenceValue ?? 0 };
      await withTransaction(pool, async conn => { requireOwnerHQ(p, await requireCampaign(conn, p, campaignId, { forUpdate: true })); await repo.insertProduct(conn, campaignId, product); });
      emit(campaignId, 'product');
      return product;
    },
    async addDeliverable(p, assignmentId, input) {
      if (!isDate(input.deadline)) fail('VALIDATION', 422, 'Deadline deliverable tidak valid.');
      const owner = input.outputOwner ?? (input.postingRequired ? 'creator' : 'brand');
      if (!['creator', 'brand'].includes(owner)) fail('VALIDATION', 422, 'Pemilik output tidak valid.');
      const item = { id: randomUUID(), title: text(input.title, 'Judul deliverable'), platform: text(input.platform, 'Platform', 50), postingRequired: Boolean(input.postingRequired) && owner === 'creator', deadline: input.deadline, outputOwner: owner };
      const campaignId = await withTransaction(pool, async conn => {
        const assignment = await requireAssignment(conn, p, assignmentId, { forUpdate: true });
        requireOwnerHQ(p, await requireCampaign(conn, p, assignment.campaignId));
        if ((await repo.assignmentDeliverables(conn, assignmentId)).length >= 50) fail('VALIDATION', 422, 'Maksimal 50 deliverable per assignment.');
        await repo.insertDeliverable(conn, assignmentId, item);
        return assignment.campaignId;
      });
      emit(campaignId, 'deliverable');
      return item;
    },
    async chooseProduct(p, assignmentId, input) {
      const productId = text(input.productId, 'Produk', 36);
      const campaignId = await withTransaction(pool, async conn => {
        const assignment = await requireAssignment(conn, p, assignmentId, { forUpdate: true });
        ownerCreator(p, assignment);
        if (assignment.fulfillment !== 'pending') fail('PRODUCT_LOCKED', 409, 'Pilihan produk terkunci setelah diproses HQ.');
        const { products } = await repo.campaignChildren(conn, assignment.campaignId);
        if (!products.some(item => item.id === productId)) fail('VALIDATION', 422, 'Pilih produk dari katalog campaign ini.');
        if (assignment.productId !== productId) await repo.setAssignmentProduct(conn, assignmentId, productId);
        return assignment.campaignId;
      });
      emit(campaignId, 'product_choice');
      return service.getAssignment(p, assignmentId);
    },
    async progressFulfillment(p, assignmentId, input) {
      if (!['ordered', 'received'].includes(input.next)) fail('VALIDATION', 422, 'Status pemenuhan tidak valid.');
      const campaignId = await withTransaction(pool, async conn => {
        const assignment = await requireAssignment(conn, p, assignmentId, { forUpdate: true });
        if (p.product === 'creator') ownerCreator(p, assignment); else hq(p);
        if (!assignment.productId) fail('PRODUCT_NOT_CHOSEN', 409, 'Creator harus memilih produk terlebih dahulu.');
        if (input.next === 'ordered' && (p.product !== 'hq' || assignment.fulfillment !== 'pending')) fail('FULFILLMENT_INVALID', 409, 'HQ memproses produk terpilih satu kali.');
        if (input.next === 'received' && assignment.fulfillment !== 'ordered') fail('FULFILLMENT_INVALID', 409, 'Produk harus diproses sebelum diterima.');
        await repo.setFulfillment(conn, assignmentId, input.next);
        return assignment.campaignId;
      });
      emit(campaignId, 'fulfillment');
      return service.getAssignment(p, assignmentId);
    },

    // ----- execution -----
    async submitDraft(p, deliverableId, input) {
      const url = httpUrl(input.url), note = optionalText(input.note, 'Catatan', 2000);
      const result = await withTransaction(pool, async conn => {
        const deliverable = await requireDeliverable(conn, p, deliverableId);
        ownerCreator(p, deliverable);
        await repo.lockDeliverable(conn, deliverableId);
        const state = await repo.deliveryState(conn, deliverableId);
        if (['submitted', 'approved'].includes(state.status) || state.posting) fail('DRAFT_NOT_ALLOWED', 409, 'Tunggu QC atau permintaan revisi sebelum mengirim draft baru.');
        if (today() > deliverable.deadline && !(await repo.approvedLateRequest(conn, deliverableId))) fail('WINDOW_CLOSED', 409, 'Batas waktu draft sudah lewat. Ajukan submit terlambat.');
        await repo.insertDraft(conn, deliverableId, (state.lastDraft?.version ?? 0) + 1, { url, note }, sqlTime(clock()));
        return { campaignId: deliverable.campaignId, state: await repo.deliveryState(conn, deliverableId) };
      });
      emit(result.campaignId, 'draft');
      return result.state;
    },
    async reviewDraft(p, deliverableId, input) {
      hq(p);
      if (!['revision_requested', 'approved'].includes(input.decision)) fail('VALIDATION', 422, 'Keputusan QC tidak valid.');
      const note = input.decision === 'revision_requested' ? text(input.note, 'Alasan revisi', 2000) : optionalText(input.note, 'Catatan', 2000);
      const result = await withTransaction(pool, async conn => {
        const deliverable = await requireDeliverable(conn, p, deliverableId);
        await repo.lockDeliverable(conn, deliverableId);
        const state = await repo.deliveryState(conn, deliverableId);
        if (state.status !== 'submitted' || state.lastDraft.version !== input.draftVersion) fail('REVIEW_STALE', 409, 'Draft QC berubah atau sudah diputuskan. Muat draft terbaru.');
        let approvals = [];
        if (input.decision === 'approved') {
          const gate = evaluateGate(config.approvalKeys, input.approvals ?? []);
          if (!gate.open) fail('APPROVALS_INCOMPLETE', 422, 'Persetujuan belum lengkap.', { missing: gate.missing });
          approvals = [...config.approvalKeys];
        }
        await repo.insertReview(conn, deliverableId, { draftVersion: input.draftVersion, decision: input.decision, note, actor: String(p.userId), approvals }, sqlTime(clock()));
        return { campaignId: deliverable.campaignId, state: await repo.deliveryState(conn, deliverableId) };
      });
      emit(result.campaignId, 'review');
      return result.state;
    },
    async recordPosting(p, deliverableId, input) {
      const url = httpUrl(input.url);
      if (!isDate(input.postedAt)) fail('VALIDATION', 422, 'Tanggal posting tidak valid.');
      const result = await withTransaction(pool, async conn => {
        const deliverable = await requireDeliverable(conn, p, deliverableId);
        ownerCreator(p, deliverable);
        if (!deliverable.postingRequired || deliverable.outputOwner === 'brand') fail('POSTING_NOT_REQUIRED', 409, 'Output brand/non-posting tidak memerlukan publikasi akun Creator.');
        await repo.lockDeliverable(conn, deliverableId);
        const state = await repo.deliveryState(conn, deliverableId);
        if (state.status !== 'approved') fail('NOT_APPROVED', 409, 'Posting hanya setelah draft disetujui QC.');
        if (state.posting) fail('ALREADY_POSTED', 409, 'URL posting sudah disimpan.');
        if (input.postedAt < wibDate(await repo.approvalDate(conn, deliverableId))) fail('POSTED_BEFORE_APPROVAL', 422, 'Tanggal posting tidak boleh mendahului persetujuan QC.');
        await repo.insertPosting(conn, deliverableId, { url, postedAt: input.postedAt });
        return { campaignId: deliverable.campaignId, state: await repo.deliveryState(conn, deliverableId) };
      });
      emit(result.campaignId, 'posting');
      return result.state;
    },

    // ----- insight and payout -----
    async recordInsight(p, deliverableId, input) {
      const id = text(input.id, 'ID snapshot', 36);
      if (!isDate(input.capturedAt)) fail('VALIDATION', 422, 'Tanggal pengambilan tidak valid.');
      const metrics = {};
      for (const key of ['likes', 'comments', 'shares', 'saves', 'reposts', 'views']) {
        const value = input.metrics?.[key] ?? null;
        if (value !== null && !isMoney(value)) fail('VALIDATION', 422, 'Metrik insight harus bilangan bulat non-negatif atau kosong.');
        metrics[key] = value;
      }
      const result = await withTransaction(pool, async conn => {
        const deliverable = await requireDeliverable(conn, p, deliverableId);
        await repo.lockDeliverable(conn, deliverableId);
        const state = await repo.deliveryState(conn, deliverableId);
        if (!deliverable.postingRequired || !state.posting || input.capturedAt < state.posting.postedAt) fail('INSIGHT_NOT_ALLOWED', 422, 'Insight memerlukan post dan tanggal pengambilan sesudah publikasi.');
        const existing = await repo.findInsight(conn, id);
        if (existing) {
          const same = existing.deliverableId === deliverableId && existing.capturedAt === input.capturedAt && Object.keys(metrics).every(key => (existing[key] === null ? null : Number(existing[key])) === metrics[key]);
          if (!same) fail('INSIGHT_IMMUTABLE', 409, 'Snapshot insight tidak dapat diubah. Buat snapshot baru.');
          return { campaignId: deliverable.campaignId, created: false };
        }
        await repo.insertInsight(conn, { id, deliverableId, capturedAt: input.capturedAt, metrics });
        return { campaignId: deliverable.campaignId, created: true };
      });
      if (result.created) emit(result.campaignId, 'insight');
      return { id, created: result.created };
    },
    async configureFinance(p, assignmentId, input) {
      hq(p);
      const amounts = { feeAmount: input.feeAmount, marketingAmount: input.marketingAmount ?? 0, productBenefitAmount: input.productBenefitAmount ?? 0 };
      if (!Object.values(amounts).every(isMoney)) fail('VALIDATION', 422, 'Nominal harus rupiah bulat non-negatif.');
      const result = await withTransaction(pool, async conn => {
        const assignment = await requireAssignment(conn, p, assignmentId, { forUpdate: true });
        const paid = (await repo.listPayouts(conn, assignmentId)).reduce((sum, item) => sum + item.amount, 0);
        if (amounts.feeAmount < paid) fail('FEE_BELOW_PAID', 422, 'Fee tidak boleh kurang dari payout yang sudah dibayar.');
        await repo.updateFinanceAmounts(conn, assignmentId, amounts);
        return assignment.campaignId;
      });
      emit(result, 'finance');
      return service.getAssignment(p, assignmentId);
    },
    async requestPayout(p, assignmentId) {
      const result = await withTransaction(pool, async conn => {
        const assignment = await requireAssignment(conn, p, assignmentId, { forUpdate: true });
        ownerCreator(p, assignment);
        if (assignment.payoutRequestId) return { campaignId: assignment.campaignId, changed: false };
        const paid = (await repo.listPayouts(conn, assignmentId)).reduce((sum, item) => sum + item.amount, 0);
        if (assignment.feeAmount <= paid) fail('NOTHING_TO_REQUEST', 409, 'Tidak ada sisa fee untuk diajukan.');
        const gate = await paymentGate(conn, assignmentId);
        if (!gate.open) fail('PAYOUT_GATE_CLOSED', 422, 'Syarat payout belum lengkap.', { missing: gate.missing });
        await repo.markPayoutRequested(conn, assignmentId, `request-${assignmentId}`, String(p.userId));
        return { campaignId: assignment.campaignId, changed: true };
      });
      if (result.changed) emit(result.campaignId, 'payout_request');
      return service.getAssignment(p, assignmentId);
    },
    async recordPayout(p, assignmentId, input) {
      hq(p);
      const payment = { id: text(input.id, 'ID payout', 36), amount: input.amount, paidAt: input.paidAt, evidence: text(input.evidence, 'Referensi bukti', 500) };
      if (!Number.isSafeInteger(payment.amount) || payment.amount <= 0 || !isDate(payment.paidAt)) fail('VALIDATION', 422, 'Payout memerlukan nominal positif dan tanggal valid.');
      const result = await withTransaction(pool, async conn => {
        const assignment = await requireAssignment(conn, p, assignmentId, { forUpdate: true });
        if (!assignment.payoutRequestId) fail('NOT_REQUESTED', 409, 'Payout belum diajukan Creator.');
        const payouts = await repo.listPayouts(conn, assignmentId), existing = payouts.find(item => item.id === payment.id);
        if (existing) {
          if (existing.amount !== payment.amount || existing.paidAt !== payment.paidAt || existing.evidence !== payment.evidence) fail('PAYOUT_ID_REUSED', 409, 'ID payout sudah digunakan dengan rincian berbeda.');
          return { campaignId: assignment.campaignId, created: false };
        }
        const paid = payouts.reduce((sum, item) => sum + item.amount, 0) + payment.amount;
        if (paid > assignment.feeAmount) fail('PAYOUT_EXCEEDS_FEE', 422, 'Payout melebihi sisa fee Creator.');
        await repo.insertPayout(conn, assignmentId, payment);
        await repo.setPayoutProcessing(conn, assignmentId, paid < assignment.feeAmount);
        return { campaignId: assignment.campaignId, created: true };
      });
      if (result.created) emit(result.campaignId, 'payout');
      return service.getAssignment(p, assignmentId);
    },

    // ----- rating (criteria are configured per campaign by the PIC; HQ records ratings; Creators do not see them) -----
    async addRatingCriterion(p, campaignId, input) {
      const criterion = { id: randomUUID(), label: text(input.label, 'Butir penilaian', 255) };
      await withTransaction(pool, async conn => {
        requireOwnerHQ(p, await requireCampaign(conn, p, campaignId, { forUpdate: true }));
        const existing = await repo.listCriteria(conn, campaignId);
        if (existing.length >= 20) fail('VALIDATION', 422, 'Maksimal 20 butir penilaian per campaign.');
        if (existing.some(item => item.label.toLowerCase() === criterion.label.toLowerCase())) fail('CRITERION_EXISTS', 409, 'Butir penilaian sudah ada.');
        await repo.insertCriterion(conn, campaignId, criterion);
      });
      emit(campaignId, 'rating_criterion');
      return criterion;
    },
    async recordRating(p, assignmentId, input) {
      hq(p);
      const comment = optionalText(input.comment, 'Komentar', 2000);
      if (input.continueCooperation != null && !['yes', 'no'].includes(input.continueCooperation)) fail('VALIDATION', 422, 'Pilihan lanjut kerja sama tidak valid.');
      const result = await withTransaction(pool, async conn => {
        const assignment = await requireAssignment(conn, p, assignmentId, { forUpdate: true });
        const criteria = await repo.listCriteria(conn, assignment.campaignId);
        if (!criteria.length) fail('NO_CRITERIA', 409, 'Susun butir penilaian campaign lebih dulu.');
        const scores = input.scores ?? {};
        for (const criterion of criteria) {
          const value = scores[criterion.id];
          if (!Number.isInteger(value) || value < 1 || value > 5) fail('VALIDATION', 422, `Nilai "${criterion.label}" harus bilangan bulat 1 sampai 5.`);
        }
        if (Object.keys(scores).some(id => !criteria.some(item => item.id === id))) fail('VALIDATION', 422, 'Ada butir penilaian yang bukan milik campaign ini.');
        const id = await repo.insertRating(conn, assignmentId, { ratedBy: String(p.userId), comment, continueCooperation: input.continueCooperation ?? null, scores }, sqlTime(clock()));
        return { campaignId: assignment.campaignId, id };
      });
      emit(result.campaignId, 'rating');
      return service.getAssignment(p, assignmentId);
    },

    // ----- cancellation and late submission -----
    async recordCancellation(p, campaignId, input) {
      hq(p);
      let outcome;
      try {
        outcome = evaluateCancellation(config.cancellationPolicy, { party: input.party, reason: input.reason, deposit: input.deposit, amounts: input.amounts, extraCharges: input.extraCharges });
      } catch (error) { return fail('CANCELLATION_INVALID', 422, error.message); }
      await withTransaction(pool, async conn => {
        await requireCampaign(conn, p, campaignId, { forUpdate: true });
        if (input.assignmentId) await requireAssignment(conn, p, input.assignmentId).then(row => { if (row.campaignId !== campaignId) fail('VALIDATION', 422, 'Assignment bukan milik campaign ini.'); });
        await repo.insertCancellation(conn, campaignId, input.assignmentId ?? null, outcome, String(p.userId));
      });
      emit(campaignId, 'cancellation');
      return outcome;
    },
    async requestLateSubmission(p, deliverableId, input) {
      const reason = text(input.reason, 'Alasan', 2000);
      const result = await withTransaction(pool, async conn => {
        const deliverable = await requireDeliverable(conn, p, deliverableId);
        ownerCreator(p, deliverable);
        await repo.lockDeliverable(conn, deliverableId);
        const state = await repo.deliveryState(conn, deliverableId);
        if (state.status === 'approved' || state.posting) fail('LATE_NOT_NEEDED', 409, 'Draft sudah disetujui.');
        return { campaignId: deliverable.campaignId, id: await repo.insertLateRequest(conn, deliverableId, String(p.userId), reason) };
      });
      emit(result.campaignId, 'late_request');
      return { id: result.id, status: 'pending' };
    },
    async decideLateSubmission(p, requestId, input) {
      hq(p);
      if (!['approved', 'rejected'].includes(input.decision)) fail('VALIDATION', 422, 'Keputusan tidak valid.');
      await withTransaction(pool, async conn => {
        const request = await repo.findLateRequest(conn, scopeOf(p), requestId, { forUpdate: true });
        if (!request) fail('NOT_FOUND', 404, 'Pengajuan tidak ditemukan.');
        if (request.status !== 'pending') fail('ALREADY_DECIDED', 409, 'Pengajuan sudah diputuskan.');
        await repo.decideLateRequest(conn, requestId, input.decision, String(p.userId));
      });
      return { id: requestId, status: input.decision };
    },
  };
  return service;
}
