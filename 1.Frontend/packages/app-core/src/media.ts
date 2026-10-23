/**
 * media.ts — turn backend file paths into usable URLs.
 * Based on Event/src/utils/mediaHelper.js (2026-10-06); the origin and temp folder are now
 * parameters instead of being derived from the Event API base / hard-coded.
 */

export interface ResolveMediaOptions {
  /** API origin, e.g. https://backend.indofoodinternational.com:2864 (no path). */
  origin: string;
  /** Folder for bare file names. Default matches the current backend: /public/files/hots/temp/ */
  tempDir?: string;
}

export const DEFAULT_MEDIA_TEMP_DIR = '/public/files/hots/temp/';

export function resolveMediaUrl(path: string | null | undefined, { origin, tempDir = DEFAULT_MEDIA_TEMP_DIR }: ResolveMediaOptions): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  let clean = path.replace(/\\/g, '/');
  const bare = clean.replace(/^\/+/, '');

  if (bare && !bare.includes('/')) {
    // Just a file name → it lives in the temp/upload folder.
    clean = `${tempDir.replace(/\/?$/, '/')}${bare}`;
  } else if (!clean.startsWith('/')) {
    clean = `/${clean}`;
  }
  return `${origin.replace(/\/+$/, '')}${clean}`;
}

/** Derives the origin from an API base such as https://host:2864/api/event-engine. */
export function originFromApiBase(apiBase: string): string {
  try {
    return new URL(apiBase).origin;
  } catch {
    return apiBase.split('/api/')[0];
  }
}
