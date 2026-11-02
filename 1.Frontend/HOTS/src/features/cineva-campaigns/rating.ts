import type { Actor } from '../cineva-inquiries/domain';
import type { Campaign, TalentAssignment } from './model';

/**
 * Penilaian crew/Creator (jawaban client N4: butir penilaian tergantung penanggung jawab project). Butir disusun HQ per campaign dan hanya bertambah;
 * penilaian dicatat HQ (client belum punya akun) per putaran dengan skala 1 sampai 5. Pemetaan rata-rata ke grade belum dijawab client, jadi tidak dihitung.
 * Creator tidak melihat penilaian (apakah nilai terlihat oleh kru belum dijawab).
 */
export interface RatingCriterion { id: string; label: string }
export interface AssignmentRating { id: string; ratedBy: string; ratedAt: string; scores: Record<string, number>; comment: string; continueCooperation?: 'yes' | 'no' }
export const maxCriteria = 20;

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const assertHQ = (actor: Actor) => { if (actor.product !== 'hq') throw new Error('Hanya HQ yang dapat mengelola penilaian.'); };

/** Rata-rata nilai satu putaran, dua desimal. */
export function ratingAverage(rating: Pick<AssignmentRating, 'scores'>): number | null {
  const values = Object.values(rating.scores);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 100) / 100 : null;
}

export function addRatingCriterion(campaign: Campaign, label: string, id: string): Campaign {
  const text = label.trim(), current = campaign.ratingCriteria ?? [];
  if (!text || text.length > 255) throw new Error('Isi butir penilaian (maksimal 255 karakter).');
  if (current.length >= maxCriteria) throw new Error(`Maksimal ${maxCriteria} butir penilaian per campaign.`);
  if (current.some(item => item.label.toLowerCase() === text.toLowerCase())) throw new Error('Butir penilaian sudah ada.');
  return { ...campaign, ratingCriteria: [...current, { id, label: text }] };
}

export interface RatingInput { id: string; scores: Record<string, number>; comment?: string; continueCooperation?: 'yes' | 'no' }
export function recordRating(assignment: TalentAssignment, criteria: RatingCriterion[], actor: Actor, input: RatingInput, at = new Date().toISOString()): TalentAssignment {
  assertHQ(actor);
  if (!criteria.length) throw new Error('Susun butir penilaian campaign lebih dulu.');
  if (!input.id.trim() || (assignment.ratings ?? []).some(item => item.id === input.id)) throw new Error('ID penilaian harus unik.');
  const comment = (input.comment ?? '').trim();
  if (comment.length > 2000) throw new Error('Komentar maksimal 2.000 karakter.');
  if (input.continueCooperation !== undefined && !['yes', 'no'].includes(input.continueCooperation)) throw new Error('Pilihan lanjut kerja sama tidak valid.');
  for (const criterion of criteria) {
    const value = input.scores[criterion.id];
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error(`Nilai "${criterion.label}" harus bilangan bulat 1 sampai 5.`);
  }
  if (Object.keys(input.scores).some(id => !criteria.some(item => item.id === id))) throw new Error('Ada butir penilaian yang bukan milik campaign ini.');
  const rating: AssignmentRating = { id: input.id, ratedBy: actor.id, ratedAt: at, scores: { ...input.scores }, comment, ...(input.continueCooperation ? { continueCooperation: input.continueCooperation } : {}) };
  return { ...assignment, ratings: [...(assignment.ratings ?? []), rating] };
}

/** Penjaga repository: riwayat penilaian hanya bertambah satu putaran yang valid per perubahan dan hanya oleh HQ. */
export function assertRatingMutation(previous: TalentAssignment, next: TalentAssignment, actor: Actor, criteria: RatingCriterion[]) {
  const before = previous.ratings ?? [], after = next.ratings ?? [];
  if (same(before, after)) return;
  assertHQ(actor);
  if (after.length !== before.length + 1 || !same(after.slice(0, before.length), before)) throw new Error('Riwayat penilaian tidak boleh diubah atau dihapus.');
  const added = after[after.length - 1];
  const replay = recordRating(previous, criteria, actor, { id: added.id, scores: added.scores, comment: added.comment, continueCooperation: added.continueCooperation }, added.ratedAt);
  if (!same(replay.ratings, after)) throw new Error('Penilaian tidak valid.');
}
