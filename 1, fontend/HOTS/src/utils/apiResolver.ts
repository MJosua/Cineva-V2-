/**
 * apiResolver.ts  —  HOTS Frontend (Vite)
 * ============================================================
 * Fast API Endpoint Discovery with Failover.
 * Stores result in window.__API_URL__ — the shared source of truth.
 * sourceConfig.jsx reads this via getApiBase() / isServerReady().
 * KNOWLEDGE REF: 3. knowledge/architecture/infrastructure_analysis_dns_timeout.md
 * ============================================================
 */

declare global {
    interface Window { __API_URL__?: string; }
}

const CONNECTION_TIMEOUT_MS = 2000;

const PRIMARY_URL: string =
    import.meta.env.VITE_API_URL || 'https://backend.indofoodinternational.com:2468';

const FALLBACK_URLS: string[] = [
    'https://backend.indofoodinternational.com:2468',
    'http://110.35.82.52:2864',
    'http://10.126.106.105',
];

/** Returns the resolved URL string (or PRIMARY_URL as fallback). */
export const getApiBase = (): string => window.__API_URL__ || PRIMARY_URL;

/** True if resolver successfully found a healthy endpoint before React rendered. */
export const isServerReady = (): boolean => Boolean(window.__API_URL__);

function pingEndpoint(baseUrl: string, timeoutMs = CONNECTION_TIMEOUT_MS): Promise<string> {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            controller.abort();
            reject(new Error(`Timeout: ${baseUrl}`));
        }, timeoutMs);

        fetch(`${baseUrl}/auth/ping`, {
            method: 'GET',
            signal: controller.signal,
            credentials: 'omit',
            cache: 'no-store',
        })
            .then(res => {
                clearTimeout(timer);
                if (res.ok || res.status < 500) resolve(baseUrl);
                else reject(new Error(`Bad status ${res.status}: ${baseUrl}`));
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

async function findHealthyUrl(urls: string[]): Promise<string> {
    for (const url of urls) {
        try {
            console.log(`[apiResolver] Probing: ${url}`);
            const result = await pingEndpoint(url);
            console.log(`[apiResolver] ✔ Healthy: ${result}`);
            return result;
        } catch (e: any) {
            console.warn(`[apiResolver] ✖ Failed: ${url} — ${e.message}`);
        }
    }
    throw new Error('[apiResolver] All endpoints failed.');
}

/**
 * CALL THIS ONCE in index.js before ReactDOM.createRoot().render().
 * Sets window.__API_URL__ to the first healthy endpoint found.
 */
export async function resolveApiBase(): Promise<string> {
    const candidates = [PRIMARY_URL, ...FALLBACK_URLS.filter(u => u !== PRIMARY_URL)];
    try {
        window.__API_URL__ = await findHealthyUrl(candidates);
    } catch {
        console.error('[apiResolver] Could not reach any endpoint. Defaulting to PRIMARY_URL.');
        // Don't set window.__API_URL__ — isServerReady() returns false
    }
    return getApiBase();
}
