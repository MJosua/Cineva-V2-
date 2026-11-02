import type { Campaign, CampaignDeliverable, TalentAssignment } from './model';
import type { DeliveryExecution } from './execution';
import type { ExtensionRecord, StagePlan } from './stages';

/**
 * Pemetaan murni antara bentuk API `/api/cineva/v1` dan view model campaign frontend, serta penerjemah perubahan (diff) menjadi panggilan API.
 * Tidak mengimpor fetch atau React sehingga dapat diuji langsung. Kecocokan identitas dummy (hq-1, creator-1, ...) dengan user id adalah milik adapter, bukan server.
 */
export type ApiCall = { method: 'POST' | 'PUT'; path: string; body?: unknown };
type Json = Record<string, any>;

/** Server mengirim mikrodetik; validator waktu frontend memakai paling banyak milidetik. */
export const isoMillis = (value: string) => value.replace(/(\.\d{3})\d*Z$/, '$1Z');
const clean = <T extends object>(value: T): T => JSON.parse(JSON.stringify(value));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

export interface IdentityMap { toFrontend(userId: number): string; toUserId(frontendId: string): number }
export const trialIdentities: IdentityMap = (() => {
  const users: Record<string, number> = { 'hq-1': 10, 'hq-2': 11, 'creator-1': 20, 'creator-2': 21 };
  const reverse = new Map(Object.entries(users).map(([id, userId]) => [userId, id]));
  return {
    toFrontend: userId => reverse.get(userId) ?? `user-${userId}`,
    toUserId: id => { if (!(id in users)) throw new Error(`Identitas ${id} tidak dikenal oleh API percobaan.`); return users[id]; },
  };
})();

export function toStagePlan(detail: Json): StagePlan | undefined {
  const plan = detail.stagePlan;
  if (!plan) return undefined;
  return {
    templateId: plan.templateId, startDate: plan.startDate, holidays: [...plan.holidays],
    extensions: plan.extensions.map((item: Json): ExtensionRecord => ({
      stageKey: item.stageKey, days: item.days, reason: item.reason,
      proof: item.proofKind === 'text' ? { kind: 'text', text: item.proofText } : { kind: item.proofKind, fileName: item.proofFileName, sizeBytes: item.proofSizeBytes },
    })),
  };
}

export function toAssignment(a: Json, products: Campaign['products'], identities: IdentityMap): TalentAssignment {
  const deliveries: Record<string, DeliveryExecution> = {};
  let events = 0;
  const deliverables: CampaignDeliverable[] = a.deliverables.map((d: Json) => {
    events += d.drafts.length + d.reviews.length + (d.posting ? 1 : 0);
    deliveries[d.id] = {
      status: d.status,
      drafts: d.drafts.map((x: Json) => ({ version: x.version, url: x.url, note: x.note, submittedAt: isoMillis(x.submittedAt) })),
      reviews: d.reviews.map((r: Json) => ({
        draftVersion: r.draftVersion, decision: r.decision, note: r.note, reviewedAt: isoMillis(r.reviewedAt), actor: r.actor,
        ...(r.approvals?.length ? { approvals: [...r.approvals] } : {}),
      })),
      ...(d.posting ? { posting: { url: d.posting.url, postedAt: d.posting.postedAt } } : {}),
    };
    return { id: d.id, title: d.title, platform: d.platform, postingRequired: d.postingRequired, deadline: d.deadline, outputOwner: d.outputOwner };
  });
  const product = a.productId ? products.find(item => item.id === a.productId) : undefined;
  const fulfilled = a.fulfillment === 'pending' ? 0 : a.fulfillment === 'ordered' ? 1 : 2;
  return {
    id: a.id, batchId: a.batchId, creatorId: identities.toFrontend(a.creatorUserId), creatorName: a.creatorName, deliverables,
    socialProfiles: (a.socialProfiles ?? []).map((x: Json) => ({ platform: x.platform, handle: x.handle, followers: x.followers, capturedAt: x.capturedAt })),
    ...(a.ratings ? { ratings: [...a.ratings].reverse().map((r: Json) => ({ id: String(r.id), ratedBy: r.ratedBy, ratedAt: isoMillis(r.ratedAt), scores: r.scores, comment: r.comment, ...(r.continueCooperation ? { continueCooperation: r.continueCooperation } : {}) })) } : {}),
    execution: {
      revision: events + (a.productId ? 1 : 0) + fulfilled,
      product: a.productId
        ? { choice: 'selected', productId: a.productId, name: product?.name, variant: product?.variant, fulfillment: a.fulfillment }
        : { choice: 'unselected', fulfillment: 'pending' },
      deliverables: deliveries,
    },
    finance: {
      feeAmount: a.feeAmount, marketingAmount: a.marketingAmount ?? 0, productBenefitAmount: a.productBenefitAmount,
      ...(a.payoutRequestId ? { requested: { id: a.payoutRequestId, requestedBy: String(a.payoutRequestedBy ?? '') } } : {}),
      processing: Boolean(a.payoutProcessing),
      payments: a.payouts.map((x: Json) => ({ id: x.id, amount: x.amount, paidAt: x.paidAt, evidence: x.evidence })),
      insights: a.insights.map((x: Json) => ({ id: x.id, deliverableId: x.deliverableId, capturedAt: x.capturedAt, metrics: x.metrics })),
    },
  };
}

export function toCampaign(detail: Json, assignments: Json[], identities: IdentityMap): Campaign {
  const products = detail.products.map((item: Json) => ({ id: item.id, name: item.name, variant: item.variant, referenceValue: item.referenceValue }));
  const stagePlan = toStagePlan(detail);
  return {
    id: detail.id, revision: detail.revision, ownerId: identities.toFrontend(detail.ownerUserId), title: detail.title, brand: detail.brand, brief: detail.brief,
    objective: detail.objective, audience: detail.audience, messaging: detail.messaging,
    milestones: detail.milestones.map((item: Json) => ({ id: item.id, title: item.title, deadline: item.deadline })),
    batches: detail.batches.map((item: Json) => ({ id: item.id, name: item.name })), products,
    assignments: assignments.map(a => toAssignment(a, products, identities)),
    ...(stagePlan ? { stagePlan } : {}),
    ratingCriteria: (detail.ratingCriteria ?? []).map((item: Json) => ({ id: item.id, label: item.label })),
  };
}

const proofBody = (proof: ExtensionRecord['proof']) => proof;
const deliverableBody = (d: CampaignDeliverable) => ({ title: d.title, platform: d.platform, postingRequired: d.postingRequired, deadline: d.deadline, outputOwner: d.outputOwner ?? (d.postingRequired ? 'creator' : 'brand') });

/** Panggilan API untuk perubahan satu assignment (tindakan Creator atau HQ). Urutan mengikuti ketergantungan: produk, output, draft/QC/posting, insight, keuangan. */
export function planAssignmentCalls(previous: TalentAssignment, next: TalentAssignment): ApiCall[] {
  const calls: ApiCall[] = [], base = `/assignments/${previous.id}`;
  const before = previous.execution, after = next.execution;
  if (after?.product.productId && after.product.productId !== before?.product.productId) calls.push({ method: 'PUT', path: `${base}/product`, body: { productId: after.product.productId } });
  if (after && after.product.fulfillment !== (before?.product.fulfillment ?? 'pending') && after.product.fulfillment !== 'pending') calls.push({ method: 'POST', path: `${base}/fulfillment`, body: { next: after.product.fulfillment } });
  for (const d of next.deliverables) if (!previous.deliverables.some(item => item.id === d.id)) calls.push({ method: 'POST', path: `${base}/deliverables`, body: deliverableBody(d) });
  for (const [id, delivery] of Object.entries(after?.deliverables ?? {})) {
    const old = before?.deliverables[id], path = `/deliverables/${id}`;
    for (const draft of delivery.drafts.slice(old?.drafts.length ?? 0)) calls.push({ method: 'POST', path: `${path}/drafts`, body: { url: draft.url, note: draft.note } });
    for (const review of delivery.reviews.slice(old?.reviews.length ?? 0)) calls.push({ method: 'POST', path: `${path}/reviews`, body: { decision: review.decision, note: review.note, draftVersion: review.draftVersion, approvals: review.approvals ?? [] } });
    if (delivery.posting && !old?.posting) calls.push({ method: 'POST', path: `${path}/posting`, body: { url: delivery.posting.url, postedAt: delivery.posting.postedAt } });
  }
  const oldFinance = previous.finance, newFinance = next.finance;
  if (newFinance) {
    for (const snapshot of newFinance.insights.slice(oldFinance?.insights.length ?? 0)) calls.push({ method: 'POST', path: `/deliverables/${snapshot.deliverableId}/insights`, body: { id: snapshot.id, capturedAt: snapshot.capturedAt, metrics: snapshot.metrics } });
    if (!same([oldFinance?.feeAmount ?? 0, oldFinance?.marketingAmount ?? 0, oldFinance?.productBenefitAmount ?? 0], [newFinance.feeAmount, newFinance.marketingAmount, newFinance.productBenefitAmount]))
      calls.push({ method: 'PUT', path: `${base}/finance`, body: { feeAmount: newFinance.feeAmount, marketingAmount: newFinance.marketingAmount, productBenefitAmount: newFinance.productBenefitAmount } });
    if (newFinance.requested && !oldFinance?.requested) calls.push({ method: 'POST', path: `${base}/payout-requests` });
    for (const payment of newFinance.payments.slice(oldFinance?.payments.length ?? 0)) calls.push({ method: 'POST', path: `${base}/payouts`, body: { id: payment.id, amount: payment.amount, paidAt: payment.paidAt, evidence: payment.evidence } });
  }
  for (const rating of next.ratings?.slice(previous.ratings?.length ?? 0) ?? []) calls.push({ method: 'POST', path: `${base}/ratings`, body: { scores: rating.scores, comment: rating.comment, continueCooperation: rating.continueCooperation } });
  return calls;
}

/** Panggilan API untuk perubahan tingkat campaign (HQ pemilik). Perubahan yang belum punya endpoint ditolak, bukan diabaikan. */
export function planCampaignCalls(previous: Campaign, next: Campaign, identities: IdentityMap): ApiCall[] {
  const calls: ApiCall[] = [], base = `/campaigns/${previous.id}`;
  const fixed = (row: Campaign) => [row.title, row.brand, row.brief, row.objective, row.audience, row.messaging];
  if (!same(fixed(previous), fixed(next))) throw new Error('Mengubah identitas atau brief campaign belum didukung API percobaan.');
  for (const [name, left, right] of [['batch', previous.batches, next.batches], ['milestone', previous.milestones, next.milestones], ['produk', previous.products, next.products]] as const)
    if ((left as { id: string }[]).some(item => !(right as { id: string }[]).find(other => other.id === item.id && same(other, item)))) throw new Error(`Mengubah atau menghapus ${name} belum didukung API percobaan.`);
  if (previous.assignments.some(item => !next.assignments.some(other => other.id === item.id))) throw new Error('Menghapus assignment belum didukung API percobaan.');
  const oldCriteria = previous.ratingCriteria ?? [], newCriteria = next.ratingCriteria ?? [];
  if (oldCriteria.some(item => !newCriteria.some(other => other.id === item.id && other.label === item.label))) throw new Error('Mengubah atau menghapus butir penilaian belum didukung API percobaan.');
  for (const criterion of newCriteria) if (!oldCriteria.some(item => item.id === criterion.id)) calls.push({ method: 'POST', path: `${base}/rating-criteria`, body: { label: criterion.label } });
  for (const batch of next.batches) if (!previous.batches.some(item => item.id === batch.id)) calls.push({ method: 'POST', path: `${base}/batches`, body: { name: batch.name } });
  for (const m of next.milestones) if (!previous.milestones.some(item => item.id === m.id)) calls.push({ method: 'POST', path: `${base}/milestones`, body: { title: m.title, deadline: m.deadline } });
  for (const p of next.products) if (!previous.products.some(item => item.id === p.id)) calls.push({ method: 'POST', path: `${base}/products`, body: { name: p.name, variant: p.variant, referenceValue: p.referenceValue } });
  const oldPlan = previous.stagePlan, plan = next.stagePlan;
  if (!plan && oldPlan) throw new Error('Menghapus kalender tahap belum didukung API percobaan.');
  if (!same(previous.jobRules ?? {}, next.jobRules ?? {})) throw new Error('Pengaturan per job belum didukung API percobaan.');
  if (!same(oldPlan?.reopens ?? [], plan?.reopens ?? [])) throw new Error('Membuka ulang tahap belum didukung API percobaan.');
  if (plan) {
    if (!oldPlan || oldPlan.templateId !== plan.templateId || oldPlan.startDate !== plan.startDate || !same(oldPlan.holidays, plan.holidays))
      calls.push({ method: 'PUT', path: `${base}/stage-plan`, body: { templateId: plan.templateId, startDate: plan.startDate, holidays: plan.holidays, expectedRevision: previous.revision ?? 0 } });
    for (const item of plan.extensions.slice(oldPlan?.extensions.length ?? 0)) calls.push({ method: 'POST', path: `${base}/extensions`, body: { stageKey: item.stageKey, days: item.days, reason: item.reason, proof: proofBody(item.proof) } });
  }
  for (const a of next.assignments) {
    if (previous.assignments.some(item => item.id === a.id)) continue;
    calls.push({ method: 'POST', path: `${base}/assignments`, body: {
      batchId: a.batchId, creatorUserId: identities.toUserId(a.creatorId), creatorName: a.creatorName,
      socialProfiles: a.socialProfiles, deliverables: a.deliverables.map(deliverableBody),
    } });
  }
  return calls;
}

export function planCreateBody(row: Campaign) {
  if (Object.keys(row.jobRules ?? {}).length) throw new Error('Pengaturan per job belum didukung API percobaan; kosongkan biaya SOW, usia, dokumen, dan ACC storyline.');
  return {
    title: row.title, brand: row.brand, brief: row.brief, objective: row.objective, audience: row.audience, messaging: row.messaging,
    batches: row.batches.map(item => ({ name: item.name })), milestones: row.milestones.map(item => ({ title: item.title, deadline: item.deadline })),
    products: row.products.map(item => ({ name: item.name, variant: item.variant, referenceValue: item.referenceValue })),
  };
}
export { clean };
