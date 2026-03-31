/**
 * apiResolver.js
 * ============================================================
 * Fast API Endpoint Discovery with Failover
 * 
 * PROBLEM:
 *   backend.indofoodinternational.com has 2 A-records.
 *   If DNS resolves to the unresponsive IP first, the browser
 *   waits ~18 seconds (OS TCP timeout) before trying the next.
 * 
 * SOLUTION:
 *   Before the app starts, race-test multiple known endpoints.
 *   Pick the first one that responds within CONNECTION_TIMEOUT_MS.
 *   Store the result in window.__API_URL__ — the shared source of truth.
 * 
 * BACKWARD COMPATIBILITY:
 *   config.js re-exports API_URL as a Proxy so that:
 *     - API_URL + "/path"     ← still works (toString coercion)
 *     - API_URL() + "/path"   ← also works (callable)
 *   NO changes needed in the 50+ existing callers.
 * 
 * PROCEDURE (Mandatory):
 *   All frontends (HOTS, E-Order, Event) MUST call `resolveApiBase()`
 *   in their entry point (index.js / main.jsx) BEFORE ReactDOM.render().
 * 
 * KNOWLEDGE REF: 3. knowledge/architecture/infrastructure_analysis_dns_timeout.md
 * ============================================================
 */

// ============================================================
// CONFIGURATION
// ============================================================

/** Max wait time (ms) per endpoint probe. OS default is ~18s → reduced to 2s. */
const CONNECTION_TIMEOUT_MS = 2000;

/**
 * Primary URL from CRA env. Set in .env:
 *   REACT_APP_API_URL=https://backend.indofoodinternational.com:2468
 */
const PRIMARY_URL = import.meta.env.REACT_APP_API_URL
    || 'https://backend.indofoodinternational.com:2468';

console.log(`[apiResolver] Initialized. PRIMARY_URL: ${PRIMARY_URL}`);

/**
 * Ordered fallback list. First reachable URL wins.
 * Update when Corporate IT provides new IPs.
 */
const FALLBACK_URLS = [
    'https://backend.indofoodinternational.com:2468',
    'http://110.35.82.52:2864',
    'http://10.126.106.105',
];

// ============================================================
// SHARED STATE via window — zero-dependency singleton
// ============================================================

/**
 * Returns the currently resolved base URL string.
 * Falls back to PRIMARY_URL until resolveApiBase() completes.
 */
export const getApiBase = () => {
    return window.__API_URL__ || PRIMARY_URL;
};

/**
 * Returns true if resolveApiBase() successfully found a healthy endpoint.
 * Use in LoginPage / MaintenancePage to skip the redundant Axios ping.
 */
export const isServerReady = () => Boolean(window.__API_URL__);

// ============================================================
// CORE LOGIC
// ============================================================

function pingEndpoint(baseUrl, timeoutMs = CONNECTION_TIMEOUT_MS) {
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

async function findHealthyUrl(urls) {
    for (const url of urls) {
        try {
            console.log(`[apiResolver] Probing: ${url}`);
            const result = await pingEndpoint(url);
            console.log(`[apiResolver] ✔ Healthy: ${result}`);
            return result;
        } catch (e) {
            console.warn(`[apiResolver] ✖ Failed: ${url} — ${e.message}`);
        }
    }
    throw new Error('[apiResolver] All endpoints failed. Application may not work correctly.');
}

/**
 * CALL THIS ONCE in index.js before ReactDOM.createRoot().render().
 * Sets window.__API_URL__ to the first healthy endpoint found.
 *
 * @returns {Promise<string>} The resolved base URL
 */
export async function resolveApiBase() {
    const candidates = [PRIMARY_URL, ...FALLBACK_URLS.filter(u => u !== PRIMARY_URL)];
    try {
        window.__API_URL__ = await findHealthyUrl(candidates);
    } catch {
        console.error('[apiResolver] Could not reach any endpoint. Defaulting to PRIMARY_URL.');
        // Do NOT set window.__API_URL__ — isServerReady() will return false
        // so LoginPage knows to show maintenance/loading state
    }
    return getApiBase();
}
