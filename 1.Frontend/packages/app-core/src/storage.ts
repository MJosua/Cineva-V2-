/**
 * storage.ts — namespaced localStorage for NON-SECRET preferences only.
 *
 * Never store auth tokens here (tokens live only in httpOnly cookies).
 * Keys are always prefixed `<app>_` to stop cross-app leaks
 * (e.g. the old `current_delv_week` written by both HOTS and form).
 */

const FORBIDDEN = /(token|tokek|password|secret|jwt)/i;

export function createAppStorage(appKey: string) {
  const prefix = `${appKey}_`;
  const key = (name: string) => {
    if (FORBIDDEN.test(name)) throw new Error(`[app-core/storage] "${name}" looks like a secret; secrets must not go to localStorage`);
    return prefix + name;
  };

  return {
    get<T = unknown>(name: string, fallback: T | null = null): T | null {
      try {
        const raw = localStorage.getItem(key(name));
        return raw === null ? fallback : (JSON.parse(raw) as T);
      } catch {
        return fallback;
      }
    },
    set(name: string, value: unknown): void {
      try {
        localStorage.setItem(key(name), JSON.stringify(value));
      } catch {
        /* storage unavailable */
      }
    },
    remove(name: string): void {
      try {
        localStorage.removeItem(key(name));
      } catch {
        /* storage unavailable */
      }
    },
  };
}
