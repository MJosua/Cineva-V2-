import type { Actor } from '../cineva-inquiries/domain';
import type { CampaignProduct, TalentAssignment } from './model';

export type QualityStatus = 'not_submitted' | 'submitted' | 'revision_requested' | 'approved';
export interface DraftSubmission { version: number; url: string; note: string; submittedAt: string }
export interface QualityReview { draftVersion: number; decision: 'revision_requested' | 'approved'; note: string; reviewedAt: string; actor: string }
export interface DeliveryExecution {
  status: QualityStatus; drafts: DraftSubmission[]; reviews: QualityReview[];
  posting?: { url: string; postedAt: string };
}
export interface AssignmentExecution {
  revision: number;
  product: { choice: 'unselected' | 'selected'; productId?: string; name?: string; variant?: string; fulfillment: 'pending' | 'ordered' | 'received' };
  deliverables: Record<string, DeliveryExecution>;
}

/** Vendor view-model adapter composed with assignment repository scope, never a new ticket engine. */
export function readExecution(assignment: TalentAssignment): AssignmentExecution {
  return assignment.execution ?? { revision: 0, product: { choice: 'unselected', fulfillment: 'pending' }, deliverables: {} };
}
export function getDeliveryExecution(assignment: TalentAssignment, deliverableId: string): DeliveryExecution {
  if (!assignment.deliverables.some(item => item.id === deliverableId)) throw new Error('Deliverable tidak ditemukan pada assignment.');
  return readExecution(assignment).deliverables[deliverableId] ?? { status: 'not_submitted', drafts: [], reviews: [] };
}
export function validHttpUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw new Error('Gunakan URL http atau https yang valid tanpa username/password.'); }
}
function timestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || !Number.isFinite(Date.parse(value)) || Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59)
    throw new Error('Waktu operasional tidak valid.');
  dateOnly(value.slice(0, 10));
  return new Date(value).toISOString();
}
function dateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + 'T00:00:00Z'))
    || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) throw new Error('Tanggal posting tidak valid.');
  return value;
}
function assertOwner(assignment: TalentAssignment, actor: Actor, product: Actor['product']) {
  if (actor.product !== product || (product === 'creator' && actor.id !== assignment.creatorId))
    throw new Error(product === 'creator' ? 'Tindakan ini milik Creator yang ditugaskan.' : 'QC dan proses produk ditangani HQ pemilik campaign.');
}
function currentExecution(assignment: TalentAssignment, expectedRevision: number) {
  const current = readExecution(assignment);
  if (!Number.isSafeInteger(current.revision) || current.revision < 0 || current.revision !== expectedRevision)
    throw new Error('Progress assignment berubah. Baca kondisi terbaru sebelum menyimpan.');
  return current;
}
function save(assignment: TalentAssignment, execution: AssignmentExecution): TalentAssignment {
  return { ...assignment, execution: { ...execution, revision: execution.revision + 1 } };
}
function saveDelivery(assignment: TalentAssignment, execution: AssignmentExecution, id: string, delivery: DeliveryExecution) {
  return save(assignment, { ...execution, deliverables: { ...execution.deliverables, [id]: delivery } });
}
export function chooseProduct(assignment: TalentAssignment, actor: Actor, products: CampaignProduct[], productId: string, expectedRevision: number): TalentAssignment {
  assertOwner(assignment, actor, 'creator');
  const current = currentExecution(assignment, expectedRevision), product = products.find(item => item.id === productId);
  if (!product) throw new Error('Pilih produk dari katalog campaign ini.');
  if (current.product.fulfillment !== 'pending') throw new Error('Pilihan produk terkunci setelah diproses HQ.');
  if (current.product.productId === productId) return assignment;
  return save(assignment, { ...current, product: { choice: 'selected', productId, name: product.name, variant: product.variant, fulfillment: 'pending' } });
}
export function progressFulfillment(assignment: TalentAssignment, actor: Actor, next: 'ordered' | 'received', expectedRevision: number): TalentAssignment {
  if (actor.product === 'creator') assertOwner(assignment, actor, 'creator'); else assertOwner(assignment, actor, 'hq');
  const current = currentExecution(assignment, expectedRevision);
  if (current.product.choice !== 'selected') throw new Error('Creator harus memilih produk terlebih dahulu.');
  if (next === 'ordered' && (actor.product !== 'hq' || current.product.fulfillment !== 'pending')) throw new Error('HQ memproses produk terpilih satu kali.');
  if (next === 'received' && current.product.fulfillment !== 'ordered') throw new Error('Produk harus diproses sebelum diterima.');
  return save(assignment, { ...current, product: { ...current.product, fulfillment: next } });
}
export function submitDraft(assignment: TalentAssignment, actor: Actor, deliverableId: string,
  input: { url: string; note: string }, expectedRevision: number, at = new Date().toISOString()): TalentAssignment {
  assertOwner(assignment, actor, 'creator');
  const current = currentExecution(assignment, expectedRevision), delivery = getDeliveryExecution(assignment, deliverableId);
  if (!['not_submitted', 'revision_requested'].includes(delivery.status) || delivery.posting) throw new Error('Tunggu QC atau permintaan revisi sebelum mengirim draft baru.');
  if (input.note.length > 2000) throw new Error('Catatan draft maksimal 2.000 karakter.');
  const draft = { version: (delivery.drafts.at(-1)?.version ?? 0) + 1, url: validHttpUrl(input.url), note: input.note.trim(), submittedAt: timestamp(at) };
  return saveDelivery(assignment, current, deliverableId, { ...delivery, status: 'submitted', drafts: [...delivery.drafts, draft] });
}
export function reviewDraft(assignment: TalentAssignment, actor: Actor, deliverableId: string,
  input: { decision: 'revision_requested' | 'approved'; note: string; draftVersion: number }, expectedRevision: number, at = new Date().toISOString()): TalentAssignment {
  assertOwner(assignment, actor, 'hq');
  const current = currentExecution(assignment, expectedRevision), delivery = getDeliveryExecution(assignment, deliverableId), draft = delivery.drafts.at(-1);
  if (delivery.status !== 'submitted' || !draft || draft.version !== input.draftVersion) throw new Error('Draft QC berubah atau sudah diputuskan. Muat draft terbaru.');
  if (!['revision_requested', 'approved'].includes(input.decision) || input.note.length > 2000 || (input.decision === 'revision_requested' && !input.note.trim()))
    throw new Error('Keputusan QC valid dan alasan revisi wajib diisi (maksimal 2.000 karakter).');
  const reviewedAt = timestamp(at);
  if (Date.parse(reviewedAt) < Date.parse(draft.submittedAt)) throw new Error('Waktu QC tidak boleh mendahului pengiriman draft.');
  return saveDelivery(assignment, current, deliverableId, { ...delivery, status: input.decision, reviews: [...delivery.reviews,
    { draftVersion: draft.version, decision: input.decision, note: input.note.trim(), reviewedAt, actor: actor.id }] });
}
export function recordPosting(assignment: TalentAssignment, actor: Actor, deliverableId: string,
  input: { url: string; postedAt: string }, expectedRevision: number): TalentAssignment {
  assertOwner(assignment, actor, 'creator');
  const current = currentExecution(assignment, expectedRevision), delivery = getDeliveryExecution(assignment, deliverableId);
  const target = assignment.deliverables.find(item => item.id === deliverableId)!;
  if (!target.postingRequired || target.outputOwner === 'brand') throw new Error('Output brand/non-posting tidak memerlukan publikasi akun Creator.');
  if (delivery.status !== 'approved' || delivery.reviews.at(-1)?.decision !== 'approved') throw new Error('Posting hanya setelah draft disetujui QC.');
  if (delivery.posting) throw new Error('URL posting sudah disimpan.');
  const postedAt = dateOnly(input.postedAt), approval = delivery.reviews.at(-1)!;
  const approvedDate = new Date(approval.reviewedAt).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  if (postedAt < approvedDate) throw new Error('Tanggal posting tidak boleh mendahului persetujuan QC.');
  return saveDelivery(assignment, current, deliverableId, { ...delivery, posting: { url: validHttpUrl(input.url), postedAt } });
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
const same = (left: unknown, right: unknown) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

/** Repository guard: callbacks cannot bypass role/state/history rules by constructing arbitrary metadata. */
export function assertExecutionMutation(previous: TalentAssignment, next: TalentAssignment, actor: Actor, products: CampaignProduct[]): void {
  if (same(previous.execution, next.execution)) return;
  const before = readExecution(previous), after = next.execution;
  if (!after || after.revision !== before.revision + 1) throw new Error('Revisi progress assignment tidak valid.');
  const changed = [...new Set([...Object.keys(before.deliverables), ...Object.keys(after.deliverables)])]
    .filter(id => !same(before.deliverables[id], after.deliverables[id]));
  let replay: TalentAssignment | undefined;
  if (!same(before.product, after.product) && changed.length === 0) {
    if (before.product.productId !== after.product.productId)
      replay = chooseProduct(previous, actor, products, after.product.productId ?? '', before.revision);
    else if (after.product.fulfillment === 'ordered' || after.product.fulfillment === 'received')
      replay = progressFulfillment(previous, actor, after.product.fulfillment, before.revision);
  } else if (same(before.product, after.product) && changed.length === 1) {
    const id = changed[0], old = getDeliveryExecution(previous, id), delivery = after.deliverables[id];
    if (!delivery) throw new Error('Riwayat deliverable tidak boleh dihapus.');
    if (delivery.drafts.length === old.drafts.length + 1) {
      const draft = delivery.drafts.at(-1)!;
      replay = submitDraft(previous, actor, id, { url: draft.url, note: draft.note }, before.revision, draft.submittedAt);
    } else if (delivery.reviews.length === old.reviews.length + 1) {
      const review = delivery.reviews.at(-1)!;
      replay = reviewDraft(previous, actor, id, { decision: review.decision, note: review.note, draftVersion: review.draftVersion }, before.revision, review.reviewedAt);
    } else if (!old.posting && delivery.posting) replay = recordPosting(previous, actor, id, delivery.posting, before.revision);
  }
  if (!replay || !same(replay.execution, after)) throw new Error('Perubahan execution melewati alur produk, draft, QC atau posting yang diizinkan.');
}
