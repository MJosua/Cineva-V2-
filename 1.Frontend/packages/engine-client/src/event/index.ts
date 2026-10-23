/**
 * @hots/engine-client — Event Engine client (HEAD of src/event/)
 * Head: src/index.ts
 * Source: Event/src/services/eventEngineApi.js (949 lines, 2026-10-06) split per resource:
 *   campaigns.ts        campaigns, media, publish, public pages, coupon check
 *   submissions.ts      submissions, stats, approval, export
 *   pools.ts            reward pools, items, draw, eligibility
 *   winnersAndTeam.ts   winners, team, external users
 * Removed: mock data/USE_MOCK, localStorage token, console noise. Same function names and endpoints.
 */
import type { AxiosInstance } from 'axios';
import { createEngineCall } from '../core/request';
import { createCampaignApi } from './campaigns';
import { createSubmissionApi } from './submissions';
import { createPoolApi } from './pools';
import { createWinnersAndTeamApi } from './winnersAndTeam';

export type * from './types';
export type { DrawOptions } from './pools';

export function createEventClient(http: AxiosInstance, basePath = '/api/event-engine') {
  const call = createEngineCall(http, basePath, 'EVENT_API_ERROR');
  return {
    ...createCampaignApi(call),
    ...createSubmissionApi(call, http, basePath),
    ...createPoolApi(call),
    ...createWinnersAndTeamApi(call, http, basePath),
  };
}

export type EventClient = ReturnType<typeof createEventClient>;
