import type { Actor } from '../cineva-inquiries/domain';
import type { AssignmentExecution } from './execution';
import type { AssignmentFinance } from './finance';
import { assertStagePlan, type StagePlan } from './stages';
import type { AssignmentRating, RatingCriterion } from './rating';

/** Synthetic operational view models, not physical tables or new ticket engines. */
export interface CampaignMilestone { id: string; title: string; deadline: string }
export interface CampaignBatch { id: string; name: string }
export interface CampaignProduct { id: string; name: string; variant: string; referenceValue: number }
export interface SocialProfileSnapshot { platform: string; handle: string; followers: number | null; capturedAt: string }
export interface CampaignDeliverable { id: string; title: string; platform: string; postingRequired: boolean; deadline: string; outputOwner?: 'creator' | 'brand' }
export interface TalentAssignment {
  id: string; batchId: string; creatorId: string; creatorName: string;
  socialProfiles: SocialProfileSnapshot[]; deliverables: CampaignDeliverable[];
  execution?: AssignmentExecution; finance?: AssignmentFinance;
  /** Riwayat penilaian putaran demi putaran, hanya HQ; lihat rating.ts. */
  ratings?: AssignmentRating[];
}
export interface Campaign {
  revision?: number;
  id: string; ownerId: string; title: string; brand: string; brief: string;
  objective: string; audience: string; messaging: string;
  milestones: CampaignMilestone[]; batches: CampaignBatch[];
  assignments: TalentAssignment[]; products: CampaignProduct[];
  /** Opsional dan additive: kalender tahap dari template client (B2). Campaign lama tanpa field ini tetap valid. */
  stagePlan?: StagePlan;
  /** Butir penilaian yang disusun HQ per campaign (jawaban N4). */
  ratingCriteria?: RatingCriterion[];
  /** Aturan per job (batch J lanjutan). Semua opsional: campaign lama tetap valid. */
  jobRules?: CampaignJobRules;
}
/**
 * Client: biaya per SOW (satu kali suruhan pengerjaan) besarannya fleksibel per job; syarat usia fleksibel per job (legal/KTP bila brand meminta);
 * ACC storyline bisa wajib atau tidak. Fee kru sakit diatur belakangan, sengaja tidak ada di sini.
 */
export interface CampaignJobRules {
  sowFee?: number;
  minAge?: number;
  requireLegalDoc?: boolean;
  requireIdCard?: boolean;
  storylineApprovalRequired?: boolean;
}
export function assertJobRules(rules: CampaignJobRules): CampaignJobRules {
  if (rules.sowFee !== undefined && (!Number.isSafeInteger(rules.sowFee) || rules.sowFee < 0)) throw new Error('Biaya per SOW harus rupiah bulat non-negatif.');
  if (rules.minAge !== undefined && (!Number.isSafeInteger(rules.minAge) || rules.minAge < 13 || rules.minAge > 100)) throw new Error('Syarat usia minimum harus 13 sampai 100 tahun.');
  for (const key of ['requireLegalDoc', 'requireIdCard', 'storylineApprovalRequired'] as const)
    if (rules[key] !== undefined && typeof rules[key] !== 'boolean') throw new Error('Pengaturan job tidak valid.');
  return rules;
}
/** Usia pendaftar terhadap syarat job. Tanpa `minAge` semua usia lolos. */
export const meetsAgeRule = (age: number, rules: CampaignJobRules = {}) => rules.minAge === undefined || (Number.isFinite(age) && age >= rules.minAge);
export const isHQOwner = (actor: Actor, campaign: Campaign) => actor.product === 'hq' && actor.id === campaign.ownerId;
export function validDate(value: string) {
  const date = new Date(value + 'T00:00:00Z');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateCampaign(row: Campaign) {
  if (![row.id, row.ownerId, row.title, row.brand, row.brief, row.objective, row.audience, row.messaging].every(value => typeof value === 'string' && value.trim()))
    throw new Error('Lengkapi identitas dan brief campaign.');
  const unique = (ids: string[]) => ids.every(Boolean) && new Set(ids).size === ids.length;
  if (!unique(row.batches.map(batch => batch.id)) || !unique(row.assignments.map(item => item.id)) || !unique(row.milestones.map(item => item.id)))
    throw new Error('ID batch, assignment dan milestone harus unik.');
  if (row.batches.some(batch => !batch.name.trim()) || row.milestones.some(item => !item.title.trim() || !validDate(item.deadline)))
    throw new Error('Nama batch dan deadline milestone harus valid.');
  for (const assignment of row.assignments) {
    if (!row.batches.some(batch => batch.id === assignment.batchId) || !['creator-1', 'creator-2'].includes(assignment.creatorId) || !assignment.creatorName.trim())
      throw new Error('Batch dan identitas assignment tidak valid.');
    if (!unique(assignment.deliverables.map(item => item.id)) || assignment.deliverables.some(item => !item.title.trim() || !item.platform.trim() || !validDate(item.deadline)))
      throw new Error('Deliverable dan deadline harus valid.');
    if (assignment.socialProfiles.some(profile => !profile.platform.trim() || !profile.handle.trim() || !validDate(profile.capturedAt) || (profile.followers !== null && (!Number.isSafeInteger(profile.followers) || profile.followers < 0))))
      throw new Error('Snapshot akun sosial tidak valid.');
  }
  if (!unique(row.products.map(item => item.id)) || row.products.some(item => !item.name.trim() || !Number.isSafeInteger(item.referenceValue) || item.referenceValue < 0))
    throw new Error('Produk campaign tidak valid.');
  if (row.stagePlan) assertStagePlan(row.stagePlan);
  if (row.jobRules) assertJobRules(row.jobRules);
  if (row.ratingCriteria && (!unique(row.ratingCriteria.map(item => item.id)) || row.ratingCriteria.some(item => !item.label.trim())))
    throw new Error('Butir penilaian tidak valid.');
}
