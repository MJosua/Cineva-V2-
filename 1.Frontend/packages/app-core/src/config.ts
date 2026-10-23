/**
 * config.ts — single reader for app environment.
 * Standard env names (see 3.Knowledge/domains/shared-platform/07_naming_standards.md):
 *   VITE_API_URL        API host only, e.g. https://backend.indofoodinternational.com:2864
 *   VITE_<SVC>_PATH     optional service path, e.g. VITE_EVENT_PATH=/api/event-engine
 */

export interface HotsCoreConfig {
  /** API host (no trailing slash). Empty string = same origin (Vite dev proxy). */
  baseUrl: string;
  /** Origins considered "our API": cookies + CSRF header are only sent there. */
  apiOrigins?: string[];
  /** Name of the readable CSRF cookie set by the backend. */
  csrfCookieName?: string;
  /** Header the backend expects the CSRF value in. */
  csrfHeaderName?: string;
  /** Called on 401 so the app can show its session-expired UI / redirect. */
  onUnauthorized?: () => void;
}

export const DEFAULT_CSRF_COOKIE = 'csrf_token';
export const DEFAULT_CSRF_HEADER = 'X-CSRF-Token';

export function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/** Builds config from `import.meta.env` (pass it in to keep the package env-agnostic). */
export function configFromEnv(env: Record<string, string | undefined>, overrides: Partial<HotsCoreConfig> = {}): HotsCoreConfig {
  return {
    baseUrl: trimSlash(env.VITE_API_URL ?? ''),
    csrfCookieName: DEFAULT_CSRF_COOKIE,
    csrfHeaderName: DEFAULT_CSRF_HEADER,
    ...overrides,
  };
}

/** Joins the API base with an optional service path and endpoint path. */
export function apiUrl(baseUrl: string, ...parts: Array<string | undefined>): string {
  const tail = parts
    .filter((p): p is string => !!p)
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  const base = trimSlash(baseUrl);
  return tail ? `${base}/${tail}` : base || '/';
}
