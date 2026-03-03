/**
 * apiResolver.js  —  Event Frontend (Vite)
 * ============================================================
 * Fast API Endpoint Discovery with Failover.
 * 
 * PROBLEM: backend.indofoodinternational.com has 2 A-records.
 * If the unresponsive IP is resolved first, browser waits ~18s.
 * 
 * SOLUTION: Race-probe multiple known endpoints before rendering.
 * Pick the first healthy one. Cache it for the session.
 * 
 * MANDATORY PROCEDURE:
 *   Call resolveApiBase() in main.jsx BEFORE ReactDOM.createRoot().render().
 *   eventEngineApi.js uses API_BASE — update it to call getApiBase().
 * 
 * KNOWLEDGE REF: 3. knowledge/architecture/infrastructure_analysis_dns_timeout.md
 * ============================================================
 */

// ============================================================
// CONFIGURATION — Edit these values when IPs change
// ============================================================

/** Max wait time (ms) per endpoint probe. OS default is ~18s. */
const CONNECTION_TIMEOUT_MS = 2000;

/**
 * Primary base from Vite env. Set in .env:
 *   VITE_API_BASE=/api/event-engine     ← relative (Vite proxy)
 *   OR
 *   VITE_API_BASE=https://backend.indofoodinternational.com:2468/api/event-engine  ← absolute
 *
 * The resolver strips the path suffix to get the root host for probing.
 */
const ENV_API_BASE = import.meta.env.VITE_API_BASE || '/api/event-engine';

/**
 * Derive the root origin from the configured base.
 * If VITE_API_BASE is relative (e.g. /api/event-engine), use window.location.origin.
 */
function deriveOrigin(apiBase) {
    try {
        const url = new URL(apiBase);
        return url.origin;
    } catch {
        // Relative path — use current origin (Vite proxy mode)
        return window.location.origin;
    }
}

const PRIMARY_ORIGIN = deriveOrigin(ENV_API_BASE);

/**
 * Ordered fallback origins to probe.
 * First reachable origin wins.
 */
const FALLBACK_ORIGINS = [
    'https://backend.indofoodinternational.com:2468',
    'http://110.35.82.52:2864',
    'http://10.126.106.105',
];

// Path suffix to append when constructing the full API_BASE
const API_PATH_SUFFIX = '/api/event-engine';

// ============================================================
// SINGLETON STATE
// ============================================================
let _resolvedOrigin = null;

/**
 * Returns the full resolved API base (origin + path).
 * Falls back to ENV_API_BASE if called before resolveApiBase().
 */
export const getApiBase = () => {
    if (!_resolvedOrigin) {
        console.warn('[apiResolver] getApiBase() called before resolveApiBase(). Using env default.');
        return ENV_API_BASE;
    }
    return _resolvedOrigin + API_PATH_SUFFIX;
};

// ============================================================
// CORE LOGIC
// ============================================================

function pingEndpoint(origin, timeoutMs = CONNECTION_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            controller.abort();
            reject(new Error(`Timeout: ${origin}`));
        }, timeoutMs);

        fetch(`${origin}/auth/ping`, {
            method: 'GET',
            signal: controller.signal,
            credentials: 'omit',
            cache: 'no-store',
        })
            .then(res => {
                clearTimeout(timer);
                if (res.ok || res.status < 500) resolve(origin);
                else reject(new Error(`Bad status ${res.status}: ${origin}`));
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

async function findHealthyOrigin(origins) {
    for (const origin of origins) {
        try {
            console.log(`[apiResolver] Probing: ${origin}`);
            const result = await pingEndpoint(origin);
            console.log(`[apiResolver] ✔ Healthy: ${result}`);
            return result;
        } catch (e) {
            console.warn(`[apiResolver] ✖ Failed: ${origin} — ${e.message}`);
        }
    }
    throw new Error('[apiResolver] All endpoints failed.');
}

/**
 * CALL THIS ONCE in main.jsx before ReactDOM.createRoot().render().
 * 
 * Example:
 *   import { resolveApiBase } from './utils/apiResolver';
 *   resolveApiBase().then(() => {
 *     ReactDOM.createRoot(document.getElementById('root')).render(<App />);
 *   });
 */
export async function resolveApiBase() {
    const candidates = [PRIMARY_ORIGIN, ...FALLBACK_ORIGINS.filter(u => u !== PRIMARY_ORIGIN)];
    try {
        _resolvedOrigin = await findHealthyOrigin(candidates);
    } catch {
        console.error('[apiResolver] Could not reach any endpoint. Defaulting to primary origin.');
        _resolvedOrigin = PRIMARY_ORIGIN;
    }
    return getApiBase();
}
