/**
 * @hots/engine-client — Event Engine: campaigns, campaign media, public campaign endpoints
 * Head: src/event/index.ts
 * Source: Event/src/services/eventEngineApi.js lines 137–425 (2026-10-06). Mock branches removed;
 * endpoints and return shapes unchanged.
 */
import type { EngineCall } from '../core/request';
import type { Campaign, ListOptions } from './types';

export function createCampaignApi(call: EngineCall) {
  const enc = encodeURIComponent;

  const getCampaigns = () => call<{ campaigns: Campaign[] }>('get', '/admin/campaigns').then((d) => d.campaigns);
  const getCampaignBySlug = (slug: string) => call<Campaign>('get', `/admin/campaigns/${slug}`);
  const createCampaign = (data: Partial<Campaign>) => call<Campaign>('post', '/admin/campaigns', { data });
  const updateCampaign = (slug: string, updates: Partial<Campaign>) => call<Campaign>('put', `/admin/campaigns/${slug}`, { data: updates });
  const deleteCampaign = (slug: string) => call('delete', `/admin/campaigns/${slug}`).then(() => true);

  /** Copies a campaign as a new draft with slug `<slug>-copy-NNNN`. */
  const duplicateCampaign = async (slug: string) => {
    const original = await getCampaignBySlug(slug);
    const copy: Partial<Campaign> = {
      ...original,
      slug: `${slug}-copy-${Date.now().toString().slice(-4)}`,
      name: `${original.name} (Copy)`,
      status: 'draft',
      settings_config: original.settings_config || {},
      theme_config: original.theme_config || {},
      blocks: original.blocks || [],
      description: original.description,
    };
    delete copy.campaign_id;
    delete copy.created_at;
    delete copy.updated_at;
    return createCampaign(copy);
  };

  const publishCampaign = (slug: string, shouldPublish: boolean) =>
    call<Campaign>('post', `/admin/campaigns/${slug}/publish`, { data: { publish: shouldPublish } });

  const getCampaignMedia = (slug: string, options: ListOptions & { includeMeta?: boolean } = {}) =>
    call<any>('get', `/admin/campaigns/${slug}/media`, {
      params: {
        search: options.search,
        start_date: options.startDate ?? options.start_date,
        end_date: options.endDate ?? options.end_date,
        limit: options.limit,
        offset: options.offset,
      },
    }).then((d) => (options.includeMeta ? d : d && d.media !== undefined ? d.media : d));

  const uploadCampaignMedia = (slug: string, formData: FormData) => call('post', `/admin/campaigns/${slug}/media/upload`, { data: formData });
  const deleteCampaignMedia = (slug: string, mediaId: number | string) => call('delete', `/admin/campaigns/${slug}/media/${mediaId}`);

  // ---- public (no login)
  const getPublicCampaign = (slug: string) => call<Campaign>('get', `/public/campaigns/${slug}`);
  const submitEntry = (slug: string, data: unknown) => call<{ submission_id: number; status: string }>('post', `/public/campaigns/${slug}/submit`, { data });
  const uploadPublicMedia = (slug: string, formData: FormData) => call('post', `/public/campaigns/${slug}/media/upload`, { data: formData });

  /** Same contract as the Event app: 404 → INVALID, other errors → INVALID with message. */
  const checkCouponStatus = async (eventSlug: string, couponCode: string, poolId?: number | string, useEncryption = false) => {
    try {
      return await call<{ status: string; message?: string }>('get', `/public/campaigns/${eventSlug}/check-coupon/${enc(couponCode)}`, {
        params: { pool: poolId, encrypted: String(useEncryption) },
      });
    } catch (err: any) {
      if (err?.status === 404) return { status: 'INVALID', message: 'Coupon not found.' };
      return { status: 'INVALID', message: err?.message || 'Unknown error.' };
    }
  };

  return {
    getCampaigns,
    getCampaignBySlug,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
    publishCampaign,
    getCampaignMedia,
    uploadCampaignMedia,
    deleteCampaignMedia,
    getPublicCampaign,
    submitEntry,
    uploadPublicMedia,
    checkCouponStatus,
  };
}
