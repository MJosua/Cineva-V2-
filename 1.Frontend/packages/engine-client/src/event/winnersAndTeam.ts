/**
 * @hots/engine-client — Event Engine: winners, campaign team, external users
 * Head: src/event/index.ts
 * Source: Event/src/services/eventEngineApi.js lines 520–577 (winners export), 836–847, 866–949 (2026-10-06).
 */
import type { AxiosInstance } from 'axios';
import { downloadFile } from '@hots/app-core';
import type { EngineCall } from '../core/request';

export function createWinnersAndTeamApi(call: EngineCall, http: AxiosInstance, basePath: string) {
  const getWinnersByCampaign = (slug: string) => call<any[]>('get', `/admin/campaigns/${slug}/winners`);

  const resetWinners = (slug: string, drawName?: string | null) =>
    call<any>('delete', `/admin/campaigns/${slug}/winners`, { params: { draw_name: drawName ?? '' } });

  const exportWinners = (slug: string, drawName = '') => {
    const query = drawName ? `?draw_name=${encodeURIComponent(drawName)}` : '';
    return downloadFile(http, `${basePath}/admin/campaigns/${slug}/winners/export${query}`, { fallbackName: `winners_${slug}_${Date.now()}.xlsx` });
  };

  const registerExternalUser = (userData: unknown) => call<any>('post', '/admin/users/external', { data: userData });
  const searchUsers = (query: string) => call<any[]>('get', '/admin/users/search', { params: { q: query } });
  const getCampaignTeam = (slug: string) => call<any[]>('get', `/admin/campaigns/${slug}/team`);
  const addTeamMember = (slug: string, userId: number, role: string, source = 'HOTS') =>
    call<any>('post', `/admin/campaigns/${slug}/team`, { data: { user_id: userId, role, source } });
  const removeTeamMember = (slug: string, userId: number, source = 'HOTS') =>
    call<any>('delete', `/admin/campaigns/${slug}/team/${userId}`, { params: { source } });

  return { getWinnersByCampaign, resetWinners, exportWinners, registerExternalUser, searchUsers, getCampaignTeam, addTeamMember, removeTeamMember };
}
