/**
 * endpoint.ts — fast API endpoint discovery with failover.
 * Source: E-Order/src/utils/apiResolver.js (same logic in HOTS/src/utils/apiResolver.ts and
 * Event/src/utils/apiResolver.js), collected 2026-10-06. Source apps unchanged.
 *
 * Problem it solves: backend.indofoodinternational.com has 2 A-records; when DNS returns the dead IP
 * first the browser waits ~18 s (OS TCP timeout). Before the app renders, probe candidates in order
 * with a short timeout and use the first healthy one.
 *
 * Changes vs source: candidate URLs, ping path and timeout are parameters (no IPs hard-coded in the
 * package); the result is still stored in `window.__API_URL__` so it interoperates with existing apps.
 *
 * Usage (main.tsx, before render):
 *   const base = await resolveApiBase({ candidates: [env.VITE_API_URL, ...fallbacks], skip: import.meta.env.DEV });
 *   const config = configFromEnv(import.meta.env, { baseUrl: base });
 */

declare global {
  interface Window {
    __API_URL__?: string;
  }
}

export interface ResolveApiBaseOptions {
  /** Ordered list; first entry is the primary. Empty/duplicate entries are ignored. */
  candidates: Array<string | undefined | null>;
  /** Health path appended to each candidate. Default '/auth/ping' (as in the source apps). */
  pingPath?: string;
  /** Per-candidate timeout in ms. Default 2000. */
  timeoutMs?: number;
  /** Skip probing (e.g. dev) and use the primary directly. */
  skip?: boolean;
  /** Optional logger (default: silent). */
  log?: (message: string) => void;
}

function uniqueCandidates(list: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  for (const raw of list) {
    const url = (raw ?? '').trim().replace(/\/+$/, '');
    if (url && !out.includes(url)) out.push(url);
  }
  return out;
}

/** Resolves if the endpoint answers with any status < 500 within the timeout. */
export function pingEndpoint(baseUrl: string, pingPath = '/auth/ping', timeoutMs = 2000): Promise<string> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Timeout: ${baseUrl}`));
    }, timeoutMs);
    fetch(`${baseUrl}${pingPath}`, { method: 'GET', signal: controller.signal, credentials: 'omit', cache: 'no-store' })
      .then((res) => {
        clearTimeout(timer);
        if (res.ok || res.status < 500) resolve(baseUrl);
        else reject(new Error(`Bad status ${res.status}: ${baseUrl}`));
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/** Tries candidates in order; returns the first healthy one or throws. */
export async function findHealthyUrl(urls: string[], pingPath?: string, timeoutMs?: number, log?: (m: string) => void): Promise<string> {
  for (const url of urls) {
    try {
      const ok = await pingEndpoint(url, pingPath, timeoutMs);
      log?.(`[endpoint] healthy: ${ok}`);
      return ok;
    } catch (e) {
      log?.(`[endpoint] failed: ${url} — ${(e as Error).message}`);
    }
  }
  throw new Error('[endpoint] All endpoints failed.');
}

/** Current base URL: the resolved one, else the given fallback (usually the primary). */
export function getApiBase(fallback = ''): string {
  return (typeof window !== 'undefined' && window.__API_URL__) || fallback;
}

/** True once `resolveApiBase` found a healthy endpoint (use to show a maintenance/loading state). */
export function isServerReady(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__API_URL__);
}

/**
 * Call once before rendering. Sets `window.__API_URL__` to the first healthy candidate.
 * If none answers, leaves it unset (isServerReady() === false) and returns the primary.
 */
export async function resolveApiBase(options: ResolveApiBaseOptions): Promise<string> {
  const { pingPath = '/auth/ping', timeoutMs = 2000, skip = false, log } = options;
  const candidates = uniqueCandidates(options.candidates);
  const primary = candidates[0] ?? '';
  if (typeof window === 'undefined') return primary;

  if (skip) {
    window.__API_URL__ = primary;
    return primary;
  }
  try {
    window.__API_URL__ = await findHealthyUrl(candidates, pingPath, timeoutMs, log);
  } catch {
    log?.('[endpoint] no endpoint reachable; using primary');
  }
  return getApiBase(primary);
}
