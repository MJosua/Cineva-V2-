import { createEngineClient } from '@hots/engine-client';
import { API_URL } from '@/config/sourceConfig';
import { createCinevaHttpClient } from './httpFactory';

export function getLegacyToken(): string | null {
  try { return localStorage.getItem('hots_tokek'); } catch { return null; }
}
// Resolve on every request so login refresh and endpoint failover remain supported.
export const cinevaHttp = createCinevaHttpClient(() => String(API_URL), getLegacyToken);
export const cinevaEngines = createEngineClient(cinevaHttp);
