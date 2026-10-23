/**
 * @hots/engine-client — HOTS user preferences client
 * Head: src/index.ts
 * Source: HOTS/src/hooks/usePreferences.ts (2026-10-06) — endpoints pulled out of the hook.
 * The same store backs table-engine saved views (`report_table/<reportKey>_saved_views`).
 */
import type { AxiosInstance } from 'axios';
import { createEngineCall } from '../core/request';

export function createPrefsClient(http: AxiosInstance, basePath = '/hotsprefs') {
  const call = createEngineCall(http, basePath, 'PREFS_API_ERROR');
  return {
    /** `{ success, preferences: { [category]: { [key]: value } } }` */
    getAll: () => call<{ success: boolean; preferences: Record<string, Record<string, unknown>> }>('get', '/all', { raw: true }),
    get: <T = unknown>(category: string, key: string) => call<{ value: T }>('get', `/${category}/${key}`, { raw: true }),
    set: (category: string, key: string, value: unknown) => call<any>('post', `/${category}/${key}`, { data: { value }, raw: true }),
    togglePin: (dashboardId: number) => call<any>('post', `/dashboard/pin/${dashboardId}`, { data: {}, raw: true }),
    saveCardPreview: (dashboardId: number, settings: unknown) => call<any>('post', `/dashboard/preview/${dashboardId}`, { data: { settings }, raw: true }),
  };
}

export type PrefsClient = ReturnType<typeof createPrefsClient>;
