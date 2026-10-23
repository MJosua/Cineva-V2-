/**
 * @hots/engine-client — Event Engine: reward pools, pool items, winner draw
 * Head: src/event/index.ts
 * Source: Event/src/services/eventEngineApi.js lines 578–816 (2026-10-06). Mock branches removed.
 */
import type { EngineCall } from '../core/request';

export interface DrawOptions {
  drawMode?: string;
  drawName?: string;
  excludePreviousWinners?: boolean;
  excludeDraws?: string[];
  filters?: unknown[];
}

export function createPoolApi(call: EngineCall) {
  const getPoolsByEvent = (slug: string) => call<{ pools: any[] }>('get', `/admin/campaigns/${slug}/pools`).then((d) => d.pools);

  const getPoolStats = (slug: string) =>
    getPoolsByEvent(slug).then((pools) => ({
      total: pools.length,
      active: pools.filter((p) => p.status === 'active').length,
      disabled: pools.filter((p) => p.status === 'disabled').length,
      exhausted: pools.filter((p) => p.status === 'exhausted').length,
    }));

  const getPoolDrawStats = (poolId: number) => call<any>('get', `/admin/pools/${poolId}/stats`);
  const getAvailablePoolItems = (poolId: number) => call<{ items: any[] }>('get', `/admin/pools/${poolId}/items`, { params: { is_used: 0 } }).then((d) => d.items);
  const getPoolItems = (poolId: number, filters: { page?: number; limit?: number; is_used?: number | boolean } = {}) =>
    call<{ items: any[]; total: number }>('get', `/admin/pools/${poolId}/items`, { params: filters });

  const createPool = (slug: string, poolData: unknown) => call<any>('post', `/admin/campaigns/${slug}/pools`, { data: poolData });
  const updatePool = (poolId: number, poolData: unknown) => call<any>('put', `/admin/pools/${poolId}`, { data: poolData });
  const deletePool = (poolId: number) => call<any>('delete', `/admin/pools/${poolId}`);
  const addPoolItems = (poolId: number, items: unknown[]) => call<any>('post', `/admin/pools/${poolId}/items`, { data: { items } });
  const generatePoolItems = (poolId: number, data: unknown) => call<any>('post', `/admin/pools/${poolId}/generate`, { data });
  const importPoolItems = (poolId: number, csvContent: string) =>
    call<any>('post', `/admin/pools/${poolId}/items/import`, { data: csvContent, headers: { 'Content-Type': 'text/plain' } });

  const drawWinners = (poolId: number, count: number, strategy = 'RANDOM', _userId = 0, options: DrawOptions = {}) => {
    const { drawMode = 'PRIZES', drawName = '', excludePreviousWinners = true, excludeDraws = [], filters = [] } = options;
    return call<any>('post', `/admin/pools/${poolId}/draw`, { data: { count, strategy, drawMode, drawName, excludePreviousWinners, excludeDraws, filters } });
  };

  const getEligibleSubmissions = (
    slug: string,
    excludePreviousWinners = true,
    excludeDraws: string[] = [],
    dateFrom: string | null = null,
    dateTo: string | null = null,
    filters: unknown[] = [],
  ) =>
    call<any>('get', `/admin/campaigns/${slug}/eligible-submissions`, {
      params: {
        exclude_previous_winners: String(excludePreviousWinners),
        exclude_draws: excludeDraws.length ? excludeDraws.join(',') : undefined,
        date_from: dateFrom,
        date_to: dateTo,
        filters: filters.length ? JSON.stringify(filters) : undefined,
      },
    });

  return {
    getPoolsByEvent,
    getPoolStats,
    getPoolDrawStats,
    getAvailablePoolItems,
    getPoolItems,
    createPool,
    updatePool,
    deletePool,
    addPoolItems,
    generatePoolItems,
    importPoolItems,
    drawWinners,
    getEligibleSubmissions,
  };
}
