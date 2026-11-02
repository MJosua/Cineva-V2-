import type { Actor } from '../cineva-inquiries/domain';
import type { Campaign, TalentAssignment } from './model';
import { getDeliveryExecution, readExecution } from './execution.ts';
import { readFinance } from './finance.ts';

/**
 * Alur kerja per creator dari brief IC 100 (step mekanisme + alur kerja) dan sheet agency (storyline, feedback STL, draft, feedback client/zone, link post).
 * Menambah langkah yang belum ada di execution/finance: alamat pengiriman, konfirmasi terima + laporan produk tidak sesuai (1x24 jam), dan storyline.
 * Draft, posting, insight dan payment tetap dibaca dari execution.ts dan finance.ts (tidak diduplikasi).
 */
export type StorylineReviewer = 'kol_manager' | 'client' | 'zone';
export interface StorylineSubmission { version: number; text: string; submittedAt: string }
export interface StorylineReview { version: number; decision: 'revision_requested' | 'approved'; note: string; reviewer: StorylineReviewer; reviewedAt: string; actor: string }
export interface CreatorWorkflow {
  address?: { recipient: string; phone: string; full: string; savedAt: string };
  receipt?: { receivedAt: string; issue?: { note: string; photoName: string; reportedAt: string } };
  storyline?: { submissions: StorylineSubmission[]; reviews: StorylineReview[] };
}
export const reviewerLabels: Record<StorylineReviewer, string> = { kol_manager: 'KOL Manager', client: 'Client', zone: 'Zone' };
export const productIssueWindowHours = 24;

export const readWorkflow = (assignment: TalentAssignment): CreatorWorkflow => assignment.workflow ?? {};
const text = (value: string, label: string, max = 2000) => { const clean = value.trim(); if (!clean || clean.length > max) throw new Error(`${label} wajib diisi (maksimal ${max} karakter).`); return clean; };
const iso = (value: string) => { const time = Date.parse(value); if (!Number.isFinite(time)) throw new Error('Waktu tidak valid.'); return new Date(time).toISOString(); };
function creatorOnly(assignment: TalentAssignment, actor: Actor) { if (actor.product !== 'creator' || actor.id !== assignment.creatorId) throw new Error('Tindakan ini milik Creator yang ditugaskan.'); }
const withWorkflow = (assignment: TalentAssignment, workflow: CreatorWorkflow): TalentAssignment => ({ ...assignment, workflow });

export function saveAddress(assignment: TalentAssignment, actor: Actor, input: { recipient: string; phone: string; full: string }, now: string): TalentAssignment {
  creatorOnly(assignment, actor);
  const phone = input.phone.replace(/[^\d+]/g, '');
  if (phone.replace(/\D/g, '').length < 9) throw new Error('Nomor telepon penerima tidak valid.');
  return withWorkflow(assignment, { ...readWorkflow(assignment), address: { recipient: text(input.recipient, 'Nama penerima', 120), phone, full: text(input.full, 'Alamat lengkap', 500), savedAt: iso(now) } });
}
export function confirmReceipt(assignment: TalentAssignment, actor: Actor, now: string): TalentAssignment {
  creatorOnly(assignment, actor);
  const flow = readWorkflow(assignment);
  if (flow.receipt) throw new Error('Penerimaan produk sudah dikonfirmasi.');
  return withWorkflow(assignment, { ...flow, receipt: { receivedAt: iso(now) } });
}
/** Brief: produk cacat/salah kirim wajib dilaporkan ke KOL Manager dalam 1x24 jam setelah diterima, dengan foto bukti. */
export function reportProductIssue(assignment: TalentAssignment, actor: Actor, note: string, photoName: string, now: string): TalentAssignment {
  creatorOnly(assignment, actor);
  const flow = readWorkflow(assignment);
  if (!flow.receipt) throw new Error('Konfirmasi produk diterima terlebih dahulu.');
  if (flow.receipt.issue) throw new Error('Laporan produk sudah dikirim.');
  if (!/\.(png|jpe?g)$/i.test(photoName.trim())) throw new Error('Foto bukti wajib PNG atau JPEG.');
  const reportedAt = iso(now);
  if (Date.parse(reportedAt) - Date.parse(flow.receipt.receivedAt) > productIssueWindowHours * 3_600_000) throw new Error('Laporan produk melewati batas 1x24 jam setelah diterima.');
  return withWorkflow(assignment, { ...flow, receipt: { ...flow.receipt, issue: { note: text(note, 'Keterangan masalah produk'), photoName: photoName.trim(), reportedAt } } });
}

export type StorylineStatus = 'not_submitted' | 'submitted' | 'revision_requested' | 'approved';
export function storylineStatus(assignment: TalentAssignment): StorylineStatus {
  const story = readWorkflow(assignment).storyline, latest = story?.submissions.at(-1);
  if (!story || !latest) return 'not_submitted';
  const reviews = story.reviews.filter(item => item.version === latest.version);
  if (reviews.some(item => item.decision === 'revision_requested')) return 'revision_requested';
  return reviews.some(item => item.reviewer === 'kol_manager' && item.decision === 'approved') ? 'approved' : 'submitted';
}
export function submitStoryline(assignment: TalentAssignment, actor: Actor, body: string, now: string): TalentAssignment {
  creatorOnly(assignment, actor);
  const flow = readWorkflow(assignment), story = flow.storyline ?? { submissions: [], reviews: [] }, status = storylineStatus(assignment);
  if (status === 'submitted') throw new Error('Storyline sedang direview; tunggu feedback sebelum mengirim versi baru.');
  if (status === 'approved') throw new Error('Storyline sudah disetujui.');
  const submission = { version: story.submissions.length + 1, text: text(body, 'Storyline', 5000), submittedAt: iso(now) };
  return withWorkflow(assignment, { ...flow, storyline: { ...story, submissions: [...story.submissions, submission] } });
}
/** HQ mencatat feedback storyline atas nama KOL Manager, client atau zone. ACC final storyline oleh KOL Manager (brief alur kerja langkah 1-2). */
export function reviewStoryline(assignment: TalentAssignment, actor: Actor, decision: StorylineReview['decision'], reviewer: StorylineReviewer, note: string, now: string): TalentAssignment {
  if (actor.product !== 'hq') throw new Error('Feedback storyline dicatat oleh HQ.');
  const flow = readWorkflow(assignment), story = flow.storyline, latest = story?.submissions.at(-1);
  if (!story || !latest || storylineStatus(assignment) !== 'submitted') throw new Error('Tidak ada storyline yang menunggu review.');
  if (!reviewerLabels[reviewer]) throw new Error('Peninjau storyline tidak dikenal.');
  const clean = decision === 'revision_requested' ? text(note, 'Catatan revisi') : note.trim().slice(0, 2000);
  return withWorkflow(assignment, { ...flow, storyline: { ...story, reviews: [...story.reviews, { version: latest.version, decision, note: clean, reviewer, reviewedAt: iso(now), actor: actor.id }] } });
}

/** Guard repository: creator hanya mengubah langkah creator, HQ hanya menambah review storyline; riwayat tidak boleh dihapus. */
export function assertWorkflowMutation(previous: TalentAssignment, next: TalentAssignment, actor: Actor): void {
  const before = readWorkflow(previous), after = readWorkflow(next);
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  const prefix = <T,>(a: T[] = [], b: T[] = []) => b.length >= a.length && a.every((item, i) => JSON.stringify(item) === JSON.stringify(b[i]));
  if (!prefix(before.storyline?.submissions, after.storyline?.submissions) || !prefix(before.storyline?.reviews, after.storyline?.reviews)) throw new Error('Riwayat storyline tidak boleh diubah.');
  if (before.receipt && (after.receipt?.receivedAt !== before.receipt.receivedAt || (before.receipt.issue && JSON.stringify(after.receipt.issue) !== JSON.stringify(before.receipt.issue)))) throw new Error('Riwayat penerimaan produk tidak boleh diubah.');
  if (actor.product === 'hq' && (JSON.stringify(before.address) !== JSON.stringify(after.address) || JSON.stringify(before.receipt) !== JSON.stringify(after.receipt)
    || (after.storyline?.submissions.length ?? 0) !== (before.storyline?.submissions.length ?? 0))) throw new Error('HQ hanya mencatat review storyline.');
  if (actor.product === 'creator' && (after.storyline?.reviews.length ?? 0) !== (before.storyline?.reviews.length ?? 0)) throw new Error('Creator tidak dapat mereview storyline.');
}
/** Jika campaign mewajibkan ACC storyline (jobRules), draft baru ditolak sebelum storyline disetujui. */
export function assertStorylineGate(previous: TalentAssignment, next: TalentAssignment, campaign: Campaign): void {
  if (!campaign.jobRules?.storylineApprovalRequired) return;
  const drafts = (row: TalentAssignment) => Object.values(readExecution(row).deliverables).reduce((sum, item) => sum + item.drafts.length, 0);
  if (drafts(next) > drafts(previous) && storylineStatus(previous) !== 'approved') throw new Error('Storyline wajib di-ACC KOL Manager sebelum menyetor draft konten.');
}

export type StepState = 'done' | 'active' | 'pending' | 'issue';
export interface WorkflowStep { key: string; label: string; state: StepState; detail: string }
/** Ringkasan langkah per creator untuk tabel progres (pengganti sheet "IC.100 Progress"). */
export function workflowSteps(assignment: TalentAssignment): WorkflowStep[] {
  const flow = readWorkflow(assignment), exec = readExecution(assignment), finance = readFinance(assignment);
  const posted = assignment.deliverables.filter(item => item.postingRequired);
  const deliveries = posted.map(item => getDeliveryExecution(assignment, item.id));
  const story = storylineStatus(assignment);
  const draftApproved = deliveries.length > 0 && deliveries.every(item => item.status === 'approved');
  const draftState: StepState = draftApproved ? 'done' : deliveries.some(item => item.status === 'revision_requested') ? 'issue' : deliveries.some(item => item.drafts.length) ? 'active' : 'pending';
  const postedAll = deliveries.length > 0 && deliveries.every(item => item.posting);
  const insights = posted.filter(item => finance.insights.some(snap => snap.deliverableId === item.id));
  const paid = finance.payments.reduce((sum, item) => sum + item.amount, 0);
  return [
    { key: 'alamat', label: 'Alamat', state: flow.address ? 'done' : 'pending', detail: flow.address ? `Penerima ${flow.address.recipient}` : 'Belum diisi' },
    { key: 'produk', label: 'Produk', state: flow.receipt?.issue ? 'issue' : flow.receipt || exec.product.fulfillment === 'received' ? 'done' : exec.product.choice === 'selected' ? 'active' : 'pending',
      detail: flow.receipt?.issue ? `Dilaporkan: ${flow.receipt.issue.note}` : exec.product.name ? `${exec.product.name} · ${exec.product.fulfillment}` : 'Belum pilih produk' },
    { key: 'storyline', label: 'Storyline', state: story === 'approved' ? 'done' : story === 'revision_requested' ? 'issue' : story === 'submitted' ? 'active' : 'pending',
      detail: { not_submitted: 'Belum setor', submitted: 'Menunggu feedback', revision_requested: 'Perlu revisi', approved: 'ACC' }[story] },
    { key: 'draft', label: 'Draft', state: draftState, detail: draftApproved ? 'Approval final' : `${deliveries.reduce((sum, item) => sum + item.drafts.length, 0)} versi` },
    { key: 'posting', label: 'Posting', state: postedAll ? 'done' : deliveries.some(item => item.posting) ? 'active' : 'pending', detail: postedAll ? 'Sudah tayang' : 'Belum tayang' },
    { key: 'insight', label: 'Insight H+7', state: posted.length && insights.length === posted.length ? 'done' : insights.length ? 'active' : 'pending', detail: `${insights.length}/${posted.length} output` },
    { key: 'payment', label: 'Payment', state: paid > 0 && paid >= finance.feeAmount ? 'done' : finance.requested || paid > 0 ? 'active' : 'pending', detail: paid ? `Rp${paid.toLocaleString('id-ID')}` : finance.requested ? 'Diajukan' : 'Belum' },
  ];
}
