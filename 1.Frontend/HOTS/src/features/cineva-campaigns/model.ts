import type { Actor } from '../cineva-inquiries/domain';
import type { AssignmentExecution } from './execution';
import type { AssignmentFinance } from './finance';

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
}
export interface Campaign {
  revision?: number;
  id: string; ownerId: string; title: string; brand: string; brief: string;
  objective: string; audience: string; messaging: string;
  milestones: CampaignMilestone[]; batches: CampaignBatch[];
  assignments: TalentAssignment[]; products: CampaignProduct[];
}
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
}
