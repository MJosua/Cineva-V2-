import { creatorPaymentGate } from '../cineva-services/policies.ts';
import type { TalentAssignment } from './model';

/**
 * Syarat pengajuan payout Creator (client N19, N43): post tayang, insight masuk, dan seluruh kewajiban Creator selesai.
 * Kewajiban Creator = setiap deliverable milik Creator sudah disetujui QC; output milik brand tidak dihitung.
 * Hanya membaca assignment; tidak mengubah `finance.ts`, sehingga aturan penyimpanan payout yang ada tidak berubah.
 */
export const paymentGateLabels: Record<string, string> = {
  post_live: 'Semua posting wajib sudah tayang',
  insight_submitted: 'Insight sudah dicatat untuk setiap posting',
  obligations_complete: 'Semua deliverable Creator sudah disetujui QC',
};

export function assignmentPaymentGate(assignment: TalentAssignment) {
  const posting = assignment.deliverables.filter(item => item.postingRequired);
  const own = assignment.deliverables.filter(item => item.outputOwner !== 'brand');
  const run = assignment.execution?.deliverables ?? {};
  const insights = assignment.finance?.insights ?? [];
  return creatorPaymentGate({
    post_live: posting.every(item => Boolean(run[item.id]?.posting?.postedAt)),
    insight_submitted: posting.every(item => insights.some(snapshot => snapshot.deliverableId === item.id)),
    obligations_complete: own.length > 0 && own.every(item => run[item.id]?.status === 'approved'),
  });
}
