import type { Actor } from '../cineva-inquiries/domain';
import type { TalentAssignment } from './model';
import { getDeliveryExecution } from './execution';

export interface CreatorPayment { id: string; amount: number; paidAt: string; evidence: string }
export const metricNames = ['likes', 'comments', 'shares', 'saves', 'reposts', 'views'] as const;
export type InsightMetrics = Record<typeof metricNames[number], number | null>;
export interface InsightSnapshot { id: string; deliverableId: string; capturedAt: string; metrics: InsightMetrics }
export interface AssignmentFinance {
  feeAmount: number; marketingAmount: number; productBenefitAmount: number;
  requested?: { id: string; requestedBy: string }; processing: boolean;
  payments: CreatorPayment[]; insights: InsightSnapshot[];
}
export const readFinance = (assignment: TalentAssignment): AssignmentFinance => assignment.finance ?? {
  feeAmount: 0, marketingAmount: 0, productBenefitAmount: 0, processing: false, payments: [], insights: [],
};
const amountValid = (amount: number) => Number.isSafeInteger(amount) && amount >= 0;
export function financeDate(value: string) {
  const stamp = new Date(value + 'T00:00:00Z');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(stamp.getTime()) && stamp.toISOString().slice(0, 10) === value;
}
function assertHQ(actor: Actor) { if (actor.product !== 'hq') throw new Error('Hanya HQ tujuan dapat mencatat keuangan campaign.'); }
const update = (assignment: TalentAssignment, finance: AssignmentFinance): TalentAssignment => ({ ...assignment, finance });
export const totalPaid = (finance: AssignmentFinance) => finance.payments.reduce((sum, payment) => sum + payment.amount, 0);
export function payoutStatus(finance: AssignmentFinance) {
  const paid = totalPaid(finance);
  if (finance.feeAmount > 0 && paid === finance.feeAmount) return 'paid';
  if (paid > 0) return 'partial';
  return finance.processing ? 'processing' : finance.requested ? 'requested' : 'not_requested';
}
/** Cash creator fee, marketing and non-cash benefit are never combined as payout. */
export function configureFinance(assignment: TalentAssignment, actor: Actor, amounts: Pick<AssignmentFinance, 'feeAmount' | 'marketingAmount' | 'productBenefitAmount'>) {
  assertHQ(actor);
  if (![amounts.feeAmount, amounts.marketingAmount, amounts.productBenefitAmount].every(amountValid)) throw new Error('Nominal harus rupiah bulat non-negatif.');
  const finance = readFinance(assignment);
  if (amounts.feeAmount < totalPaid(finance)) throw new Error('Fee tidak boleh kurang dari payout yang sudah dibayar.');
  return update(assignment, { ...finance, ...amounts });
}
export function requestPayout(assignment: TalentAssignment, actor: Actor, id: string) {
  if (actor.product !== 'creator' || actor.id !== assignment.creatorId) throw new Error('Hanya Creator pemilik assignment dapat mengajukan payout.');
  const finance = readFinance(assignment);
  if (!id.trim() || finance.feeAmount <= totalPaid(finance)) throw new Error('Tidak ada sisa fee untuk diajukan.');
  if (finance.requested) return assignment;
  return update(assignment, { ...finance, requested: { id, requestedBy: actor.id } });
}
export function processPayout(assignment: TalentAssignment, actor: Actor) {
  assertHQ(actor); const finance = readFinance(assignment);
  if (!finance.requested || finance.feeAmount <= totalPaid(finance)) throw new Error('Payout belum diajukan atau sudah lunas.');
  return update(assignment, { ...finance, processing: true });
}
export function recordPayout(assignment: TalentAssignment, actor: Actor, payment: CreatorPayment) {
  assertHQ(actor); const finance = readFinance(assignment), existing = finance.payments.find(item => item.id === payment.id);
  const nextPayment = { ...payment, evidence: payment.evidence.trim() };
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(nextPayment)) throw new Error('ID payout sudah digunakan dengan rincian berbeda.');
    return assignment;
  }
  if (!payment.id.trim() || !finance.requested || !amountValid(payment.amount) || payment.amount <= 0 || !financeDate(payment.paidAt) || !nextPayment.evidence)
    throw new Error('Payout memerlukan pengajuan, nominal positif, tanggal dan referensi bukti.');
  const paid = totalPaid(finance) + payment.amount;
  if (!Number.isSafeInteger(paid) || paid > finance.feeAmount) throw new Error('Payout melebihi sisa fee Creator.');
  return update(assignment, { ...finance, processing: paid < finance.feeAmount, payments: [...finance.payments, nextPayment] });
}
/** Percentage points, matching workbook SUM(likes:reposts)/views*100. */
export function engagementRate(metrics: InsightMetrics): number | null {
  if (!metricNames.every(key => metrics[key] !== null && Number.isSafeInteger(metrics[key]) && metrics[key]! >= 0) || !metrics.views) return null;
  const numerator = metricNames.filter(key => key !== 'views').reduce((sum, key) => sum + metrics[key]!, 0);
  return Number.isSafeInteger(numerator) ? numerator / metrics.views * 100 : null;
}
export function recordInsight(assignment: TalentAssignment, actor: Actor, snapshot: InsightSnapshot) {
  if (actor.product !== 'hq' && actor.id !== assignment.creatorId) throw new Error('Insight hanya milik assignment ini.');
  const deliverable = assignment.deliverables.find(item => item.id === snapshot.deliverableId);
  const postedAt = getDeliveryExecution(assignment, snapshot.deliverableId).posting?.postedAt;
  if (!deliverable?.postingRequired || !postedAt || !financeDate(postedAt) || !financeDate(snapshot.capturedAt) || snapshot.capturedAt < postedAt)
    throw new Error('Insight memerlukan post dan tanggal pengambilan sesudah publikasi.');
  if (!snapshot.id.trim() || !metricNames.every(key => snapshot.metrics[key] === null || amountValid(snapshot.metrics[key]!)))
    throw new Error('Metrik insight harus bilangan bulat non-negatif atau belum tersedia.');
  const finance = readFinance(assignment), existing = finance.insights.find(item => item.id === snapshot.id);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(snapshot)) throw new Error('Snapshot insight tidak dapat diubah. Buat snapshot baru.');
    return assignment;
  }
  return update(assignment, { ...finance, insights: [...finance.insights, { ...snapshot, metrics: { ...snapshot.metrics } }] });
}
export function insightReminder(postedAt: string | undefined, today: string, snapshots: InsightSnapshot[], deliverableId: string) {
  if (!postedAt || !financeDate(postedAt) || !financeDate(today)) return { dueAt: null, due: false };
  const date = new Date(postedAt + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + 7);
  const dueAt = date.toISOString().slice(0, 10);
  return { dueAt, due: today >= dueAt && !snapshots.some(item => item.deliverableId === deliverableId && item.capturedAt >= dueAt) };
}

/** Defense at repository boundary: reducers cannot rewrite financial history. */
export function assertFinanceMutation(previous: TalentAssignment, next: TalentAssignment, actor: Actor) {
  const before = readFinance(previous), after = readFinance(next);
  const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
  if (same(before, after)) return;
  if (actor.product !== 'hq' && actor.id !== previous.creatorId) throw new Error('Keuangan assignment tidak tersedia.');
  const prefix = (oldItems: unknown[], newItems: unknown[]) => newItems.length >= oldItems.length && oldItems.every((item, index) => same(item, newItems[index]));
  if (!prefix(before.payments, after.payments) || !prefix(before.insights, after.insights)) throw new Error('Riwayat payout dan insight tidak boleh diubah atau dihapus.');
  if (actor.product === 'creator') {
    if (!same([before.feeAmount, before.marketingAmount, before.productBenefitAmount, before.processing, before.payments], [after.feeAmount, after.marketingAmount, after.productBenefitAmount, after.processing, after.payments]))
      throw new Error('Creator tidak dapat mengubah nominal atau pembayaran HQ.');
    if (!same(before.requested, after.requested)) {
      if (before.requested || !after.requested || !same(readFinance(requestPayout(previous, actor, after.requested.id)).requested, after.requested))
        throw new Error('Pengajuan payout tidak valid.');
    }
  } else {
    if (!same(before.requested, after.requested)) throw new Error('HQ tidak dapat mengubah pengajuan payout Creator.');
    configureFinance(previous, actor, { feeAmount: after.feeAmount, marketingAmount: after.marketingAmount, productBenefitAmount: after.productBenefitAmount });
    let checked: TalentAssignment = { ...previous, finance: { ...before, feeAmount: after.feeAmount, marketingAmount: after.marketingAmount, productBenefitAmount: after.productBenefitAmount } };
    for (const payment of after.payments.slice(before.payments.length)) checked = recordPayout(checked, actor, payment);
    if (!same(readFinance(checked).payments, after.payments)) throw new Error('ID payout harus unik dan rincian harus valid.');
    if (after.processing !== before.processing && after.payments.length === before.payments.length) {
      if (!after.processing) throw new Error('Status diproses tidak dapat dihapus tanpa pembayaran.');
      processPayout(previous, actor);
    }
    if (after.payments.length > before.payments.length && after.processing !== readFinance(checked).processing) throw new Error('Status payout tidak sesuai ledger.');
  }
  let checkedInsights = previous;
  for (const snapshot of after.insights.slice(before.insights.length)) checkedInsights = recordInsight(checkedInsights, actor, snapshot);
  if (readFinance(checkedInsights).insights.length !== after.insights.length) throw new Error('ID snapshot insight harus unik.');
}
