/**
 * Event Engine API Service Layer
 * 
 * This module provides a unified interface for Event Engine data access.
 * It can switch between mock data and real API calls via environment variable.
 * 
 * Usage:
 *   import { getCampaigns, getSubmissionsByEvent } from './services/eventEngineApi';
 *   
 *   // Mock mode (sync):
 *   const campaigns = getCampaigns();
 *   
 *   // API mode (async):
 *   const campaigns = await getCampaigns();
 * 
 * Toggle:
 *   VITE_USE_MOCK=true  → Uses mock data (SYNCHRONOUS, for current components)
 *   VITE_USE_MOCK=false → Uses real API calls (ASYNC, requires component refactor)
 * 
 * Contract:
 *   All functions return data in the EXACT same shape as existing mock helpers.
 *   Response format matches EVENT_t_* / EVENT_m_* schema columns.
 */

// ============================================================================
// MOCK DATA IMPORTS
// ============================================================================
import {
    getSubmissionsByEvent as mockGetSubmissionsByEvent,
    getSubmissionStats as mockGetSubmissionStats
} from '../data/mockSubmissions';

import {
    getPoolsByEvent as mockGetPoolsByEvent,
    getPoolStats as mockGetPoolStats,
    MOCK_POOLS
} from '../data/mockCoupons';

import {
    getPoolDrawStats as mockGetPoolDrawStats,
    getAvailablePoolItems as mockGetAvailablePoolItems,
    drawWinners as mockDrawWinners,
    // Team Management mock functions (if any) would be imported here
} from '../data/winnerGenerator';

import { MOCK_EVENTS } from '../data/mockEvents';

// ============================================================================
// CONFIGURATION
// ============================================================================
// ============================================================================
// CONFIGURATION
// ============================================================================
const USE_MOCK = false; // Force Real API - import.meta.env.VITE_USE_MOCK !== 'false';
console.log("[EventEngine] Using API Mode (Forced):", !USE_MOCK);

// Dynamic base URL — resolved by apiResolver.js on app startup (fast-failover).
// See: src/utils/apiResolver.js
import { getApiBase } from '../utils/apiResolver';
export { getApiBase };
const API_BASE = getApiBase();

// Debounce flag so multiple concurrent 401s only fire one modal
let _sessionExpiredFired = false;

/**
 * Generic fetch wrapper for API calls
 * Handles errors and extracts data from response envelope.
 * On 401 Unauthorized, fires a 'session-expired' window event
 * so the SessionExpiredModal can intercept and prompt re-login.
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const isAdminRoute = endpoint.startsWith('/admin');

    // 🔥 Inject Authorization Header from LocalStorage
    let authHeader = {};
    if (isAdminRoute) {
        try {
            const storedAdmin = localStorage.getItem("event_admin");
            if (storedAdmin) {
                const admin = JSON.parse(storedAdmin);
                if (admin.token) {
                    authHeader = { 'Authorization': `Bearer ${admin.token}` };
                }
            }
        } catch (e) {
            console.warn("[eventEngineApi] Failed to load auth token", e);
        }
    }

    try {
        const isFormData = options.body instanceof FormData;
        const headers = {
            ...authHeader,
            ...options.headers
        };
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include'
        });

        // ── 401 interception ─────────────────────────────────────────────────
        if (response.status === 401 && isAdminRoute) {
            if (!_sessionExpiredFired) {
                _sessionExpiredFired = true;

                // Clear state and force redirect as requested
                localStorage.removeItem("event_admin");
                localStorage.removeItem("current_event");

                window.dispatchEvent(new CustomEvent("session-expired"));

                // If not already on login page, throw them there
                if (!window.location.pathname.includes('/admin/login')) {
                    window.location.href = '/event/admin/login';
                }

                // Reset after 5s so subsequent 401s after re-login also work
                setTimeout(() => { _sessionExpiredFired = false; }, 5000);
            }
            throw new Error("SESSION_EXPIRED");
        }

        const json = await response.json();

        if (!response.ok || !json.success) {
            throw new Error(json.error?.message || `API error: ${response.status}`);
        }

        return json.data;
    } catch (error) {
        if (error.message !== "SESSION_EXPIRED") {
            console.error(`[eventEngineApi] ${endpoint}:`, error);
        }
        throw error;
    }
}


// ============================================================================
// CAMPAIGNS
// ============================================================================

/**
 * Get all campaigns
 * 
 * @returns {Array|Promise<Array>} Array of campaign objects
 * 
 * Mock: Returns MOCK_EVENTS values (SYNC)
 * API:  GET /admin/campaigns (ASYNC)
 */
export function getCampaigns() {
    if (USE_MOCK) {
        return Object.values(MOCK_EVENTS);
    }

    return apiFetch('/admin/campaigns').then(data => data.campaigns);
}

/**
 * Get media assets for a campaign
 * @param {string} slug 
 */
export function getCampaignMedia(slug) {
    return apiFetch(`/admin/campaigns/${slug}/media`);
}

/**
 * Upload media for a campaign
 * @param {string} slug 
 * @param {FormData} formData 
 */
export function uploadCampaignMedia(slug, formData) {
    return apiFetch(`/admin/campaigns/${slug}/media/upload`, {
        method: 'POST',
        body: formData
    });
}

/**
 * Delete media for a campaign
 * @param {string} slug 
 * @param {number} mediaId 
 */
export function deleteCampaignMedia(slug, mediaId) {
    return apiFetch(`/admin/campaigns/${slug}/media/${mediaId}`, {
        method: 'DELETE'
    });
}

/**
 * Create a new campaign
 * 
 * @param {Object} campaignData - { name, slug, description, ... }
 * @returns {Promise<Object>} Created campaign
 */
export function createCampaign(campaignData) {
    if (USE_MOCK) {
        console.warn("createCampaign is not supported in mock mode");
        return Promise.resolve(campaignData);
    }

    return apiFetch('/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData)
    });
}

/**
 * Get single campaign by slug
 * 
 * @param {string} slug - Campaign URL slug
 * @returns {Object|Promise<Object>} Campaign object
 * 
 * Mock: Returns MOCK_EVENTS[slug] (SYNC)
 * API:  GET /admin/campaigns/:slug (ASYNC)
 */
export function getCampaignBySlug(slug) {
    if (USE_MOCK) {
        const event = MOCK_EVENTS[slug];
        if (!event) {
            throw new Error(`Campaign not found: ${slug}`);
        }
        return event;
    }

    return apiFetch(`/admin/campaigns/${slug}`);
}

/**
 * Update a campaign
 * 
 * @param {string} slug - Campaign URL slug
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated campaign
 */
export function updateCampaign(slug, updates) {
    if (USE_MOCK) {
        console.warn("updateCampaign is not supported in mock mode");
        return Promise.resolve({ ...MOCK_EVENTS[slug], ...updates });
    }

    return apiFetch(`/admin/campaigns/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

/**
 * Delete a campaign
 * 
 * @param {string} slug 
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCampaign(slug) {
    if (USE_MOCK) {
        if (MOCK_EVENTS[slug]) {
            delete MOCK_EVENTS[slug];
            return true;
        }
        return false;
    }

    return apiFetch(`/admin/campaigns/${slug}`, {
        method: 'DELETE'
    }).then(() => true);
}

/**
 * Duplicate a campaign (Client-side logic)
 * 1. Fetch original
 * 2. Create new with -copy suffix
 * 
 * @param {string} slug 
 * @returns {Promise<Object>} New campaign object
 */
export async function duplicateCampaign(slug) {
    if (USE_MOCK) {
        const original = MOCK_EVENTS[slug];
        if (!original) throw new Error("Campaign not found");
        const newSlug = `${slug}-copy-${Date.now().toString().slice(-4)}`;
        const newEvent = {
            ...JSON.parse(JSON.stringify(original)),
            slug: newSlug,
            name: `${original.name} (Copy)`,
            status: "draft",
            createdAt: new Date().toISOString()
        };
        MOCK_EVENTS[newSlug] = newEvent;
        return newEvent;
    }

    // API Mode: Fetch -> Modify -> Create
    const original = await getCampaignBySlug(slug);
    const newSlug = `${slug}-copy-${Date.now().toString().slice(-4)}`;
    const newCampaign = {
        ...original,
        slug: newSlug,
        name: `${original.name} (Copy)`,
        status: 'draft',
        settings_config: original.settings_config || {},
        theme_config: original.theme_config || {},
        blocks: original.blocks || [],
        description: original.description
    };

    // Remove ID/created_at fields to let DB handle them
    delete newCampaign.campaign_id;
    delete newCampaign.created_at;
    delete newCampaign.updated_at;

    return createCampaign(newCampaign);
}

/**
 * Get public campaign details (Must be Active & Published)
 * 
 * @param {string} slug
 * @returns {Promise<Object>} Campaign object
 */
export async function getPublicCampaign(slug) {
    if (USE_MOCK) {
        const campaign = Object.values(MOCK_EVENTS).find(e => e.slug === slug);
        if (campaign) {
            // Simulate Public API filtering
            if (campaign.status === 'active') { // Mock doesn't track published_at for now, just status
                return { ...campaign };
            }
        }
        return null;
    }
    return apiFetch(`/public/campaigns/${slug}`);
}

/**
 * Publish or Unpublish a campaign
 * 
 * @param {string} slug 
 * @param {boolean} shouldPublish 
 * @returns {Promise<Object>} Updated campaign object
 */
export async function publishCampaign(slug, shouldPublish) {
    if (USE_MOCK) {
        // Mock update
        const campaign = Object.values(MOCK_EVENTS).find(e => e.slug === slug);
        if (campaign) {
            campaign.status = shouldPublish ? 'active' : 'draft';
            campaign.published_at = shouldPublish ? new Date().toISOString() : null;
            return { ...campaign };
        }
        throw new Error("Campaign not found");
    }

    return apiFetch(`/admin/campaigns/${slug}/publish`, {
        method: 'POST',
        body: JSON.stringify({ publish: shouldPublish })
    });
}

/**
 * Submit entry (Public)
 * @param {string} slug 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export async function submitEntry(slug, data) {
    if (USE_MOCK) {
        console.log("Mock Submit:", data);
        return Promise.resolve({ submission_id: Date.now(), status: 'pending' });
    }
    return apiFetch(`/public/campaigns/${slug}/submit`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}


// ============================================================================
// SUBMISSIONS
// ============================================================================

/**
 * Get all submissions for a campaign
 * 
 * @param {string} slug - Campaign slug
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status
 * @param {string} options.search - Search term
 * @returns {Array|Promise<Array>} Array of submission objects
 * 
 * Response fields: submission_id, campaign_id, participant_name, participant_contact,
 *                  receipt_codes, extra_data, status, rejection_reason, ip_address,
 *                  user_agent, submitted_at, updated_by, updated_at
 * 
 * Mock: Calls mockGetSubmissionsByEvent (SYNC)
 * API:  GET /admin/campaigns/:slug/submissions (ASYNC)
 */
export function getSubmissionsByEvent(slug, options = {}) {
    if (USE_MOCK) {
        return mockGetSubmissionsByEvent(slug);
    }

    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.search) params.append('search', options.search);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);

    const query = params.toString();
    return apiFetch(`/admin/campaigns/${slug}/submissions${query ? '?' + query : ''}`).then(data => data.submissions);
}

/**
 * Get submission statistics for a campaign
 * 
 * @param {string} slug - Campaign slug
 * @returns {Object|Promise<Object>} Stats object { total, pending, approved, rejected }
 * 
 * Mock: Calls mockGetSubmissionStats (SYNC)
 * API:  GET /admin/campaigns/:slug/submissions/stats (ASYNC)
 */
export function getSubmissionStats(slug) {
    if (USE_MOCK) {
        return mockGetSubmissionStats(slug);
    }

    return apiFetch(`/admin/campaigns/${slug}/submissions/stats`);
}

/**
 * Export submissions to CSV
 * @param {string} slug 
 */
export async function exportSubmissionsCSV(slug) {
    const url = `${API_BASE}/admin/campaigns/${slug}/submissions/export`;

    // Fetch with Auth token manually since it's a blob
    const storedAdmin = localStorage.getItem("event_admin");
    const admin = storedAdmin ? JSON.parse(storedAdmin) : null;

    const response = await fetch(url, {
        headers: {
            'Authorization': admin?.token ? `Bearer ${admin.token}` : ''
        }
    });

    if (!response.ok) {
        let errorMsg = `Export failed: ${response.status}`;
        try {
            const json = await response.json();
            errorMsg = json.error?.message || errorMsg;
        } catch (e) { /* ignore */ }
        throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `submissions_${slug}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

/**
 * Export winners to CSV
 * @param {string} slug 
 */
export async function exportWinnersCSV(slug) {
    const url = `${API_BASE}/admin/campaigns/${slug}/winners/export`;

    // Fetch with Auth token manually since it's a blob
    const storedAdmin = localStorage.getItem("event_admin");
    const admin = storedAdmin ? JSON.parse(storedAdmin) : null;

    const response = await fetch(url, {
        headers: {
            'Authorization': admin?.token ? `Bearer ${admin.token}` : ''
        }
    });

    if (!response.ok) {
        let errorMsg = `Export failed: ${response.status}`;
        try {
            const json = await response.json();
            errorMsg = json.error?.message || errorMsg;
        } catch (e) { /* ignore */ }
        throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `winners_${slug}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// ============================================================================
// REWARD POOLS
// ============================================================================

/**
 * Get all pools for a campaign
 * 
 * @param {string} slug - Campaign slug
 * @returns {Array|Promise<Array>} Array of pool objects
 * 
 * Response fields: pool_id, campaign_id, name, description, type, config,
 *                  total_items, used_items, status
 * 
 * Mock: Calls mockGetPoolsByEvent (SYNC)
 * API:  GET /admin/campaigns/:slug/pools (ASYNC)
 */
/**
 * Update submission status
 * 
 * @param {string} submissionId - Submission UUID
 * @param {string} status - New status ('approved', 'rejected')
 * @param {string} rejectionReason - Optional reason
 * @returns {Promise<Object>} Updated submission
 */
export function updateSubmissionStatus(submissionId, status, rejectionReason = null) {
    if (USE_MOCK) {
        console.warn("Approval not supported in mock mode");
        return Promise.resolve({ submission_id: submissionId, status, updated: true });
    }

    return apiFetch(`/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejection_reason: rejectionReason })
    });
}

export function getPoolsByEvent(slug) {
    if (USE_MOCK) {
        return mockGetPoolsByEvent(slug);
    }

    return apiFetch(`/admin/campaigns/${slug}/pools`).then(data => data.pools);
}

/**
 * Get pool usage statistics
 * 
 * @param {string} slug - Campaign slug
 * @returns {Object|Promise<Object>} Stats object { total, active, disabled, exhausted }
 * 
 * Note: This function is for campaign-level pool aggregation (used by CouponsPage)
 * 
 * Mock: Calls mockGetPoolStats (SYNC)
 * API:  GET /admin/campaigns/:slug/pools (aggregated) (ASYNC)
 */
export function getPoolStats(slug) {
    if (USE_MOCK) {
        return mockGetPoolStats(slug);
    }

    return apiFetch(`/admin/campaigns/${slug}/pools`).then(data => ({
        total: data.pools.length,
        active: data.pools.filter(p => p.status === 'active').length,
        disabled: data.pools.filter(p => p.status === 'disabled').length,
        exhausted: data.pools.filter(p => p.status === 'exhausted').length
    }));
}

/**
 * Get draw statistics for a specific pool
 * 
 * @param {number} poolId - Pool ID
 * @returns {Object|Promise<Object>} Stats object
 * 
 * Mock: Calls mockGetPoolDrawStats from winnerGenerator (SYNC)
 * API:  GET /admin/pools/:id/stats (ASYNC)
 */
export function getPoolDrawStats(poolId) {
    if (USE_MOCK) {
        return mockGetPoolDrawStats(poolId);
    }

    return apiFetch(`/admin/pools/${poolId}/stats`);
}

/**
 * Get available (unused) items from a pool
 * 
 * @param {number} poolId - Pool ID
 * @returns {Array|Promise<Array>} Array of pool item objects
 * 
 * Mock: Calls mockGetAvailablePoolItems from winnerGenerator (SYNC)
 * API:  GET /admin/pools/:id/items?is_used=0 (ASYNC)
 */
export function getAvailablePoolItems(poolId) {
    if (USE_MOCK) {
        return mockGetAvailablePoolItems(poolId);
    }

    return apiFetch(`/admin/pools/${poolId}/items?is_used=0`).then(data => data.items);
}

/**
 * Get all pool items (managed view)
 * @param {number} poolId 
 * @returns {Promise<Object>} { items, total }
 */
export function getPoolItems(poolId) {
    if (USE_MOCK) return Promise.resolve({ items: [], total: 0 }); // Mock impl omitted
    return apiFetch(`/admin/pools/${poolId}/items`);
}

/**
 * Execute a winner draw
 * 
 * @param {number} poolId - Pool ID
 * @param {number} count - Number of winners
 * @param {string} strategy - Draw strategy
 * @returns {Promise<Object>} Draw result { success, winners, metadata }
 */
export function drawWinners(poolId, count, strategy = 'RANDOM') {
    if (USE_MOCK) {
        return Promise.resolve(mockDrawWinners(poolId, count, strategy));
    }

    return apiFetch(`/admin/pools/${poolId}/draw`, {
        method: 'POST',
        body: JSON.stringify({ count, strategy })
    });
}

/**
 * Create a new pool
 */
export function createPool(slug, poolData) {
    if (USE_MOCK) return Promise.resolve({ ...poolData, pool_id: Date.now() });

    return apiFetch(`/admin/campaigns/${slug}/pools`, {
        method: 'POST',
        body: JSON.stringify(poolData)
    });
}

/**
 * Update a pool
 */
export function updatePool(poolId, poolData) {
    if (USE_MOCK) return Promise.resolve({ pool_id: poolId, ...poolData });

    return apiFetch(`/admin/pools/${poolId}`, {
        method: 'PUT',
        body: JSON.stringify(poolData)
    });
}

/**
 * Delete a pool
 */
export function deletePool(poolId) {
    if (USE_MOCK) return Promise.resolve(true); // Mock

    return apiFetch(`/admin/pools/${poolId}`, {
        method: 'DELETE'
    });
}

/**
 * Add items to a pool
 */
export function addPoolItems(poolId, items) {
    if (USE_MOCK) return Promise.resolve({ count: items.length });

    return apiFetch(`/admin/pools/${poolId}/items`, {
        method: 'POST',
        body: JSON.stringify({ items })
    });
}

/**
 * Import items from CSV string
 * @param {number} poolId 
 * @param {string} csvContent 
 */
export function importPoolItems(poolId, csvContent) {
    if (USE_MOCK) return Promise.resolve({ count: csvContent.split('\n').length });

    return apiFetch(`/admin/pools/${poolId}/items/import`, {
        method: 'POST',
        body: csvContent, // Send raw text
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}

// ============================================================================
// ANALYTICS (READ)
// ============================================================================

/**
 * Get daily submission stats
 * @returns {Promise<Array>} [{ date, count }]
 */
export function getDailySubmissionStats(slug, days = 30) {
    if (USE_MOCK) return Promise.resolve([]); // Mock not implemented for charts
    return apiFetch(`/admin/campaigns/${slug}/submissions/daily?days=${days}`);
}

/**
 * Get winners list
 * @returns {Promise<Array>}
 */
export function getWinnersByCampaign(slug) {
    if (USE_MOCK) return Promise.resolve([]);
    return apiFetch(`/admin/campaigns/${slug}/winners`);
}

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

/**
 * These re-exports maintain backward compatibility.
 * Components can import from this module instead of mock files directly.
 */

// For components that still import MOCK_POOLS directly
export { MOCK_POOLS } from '../data/mockCoupons';
export { MOCK_POOL_ITEMS, RULE_TYPES, EFFECT_TYPES } from '../data/mockCoupons';
export { MOCK_SUBMISSIONS } from '../data/mockSubmissions';
export { MOCK_EVENTS } from '../data/mockEvents';

// For Winner Generator (these are business logic, not API calls)
export { previewDraw } from '../data/winnerGenerator';

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

/**
 * Search HOTS users
 * @param {string} query 
 * @returns {Promise<Array>}
 */
export async function searchUsers(query) {
    if (USE_MOCK) return Promise.resolve([]);
    return apiFetch(`/admin/users/search?q=${encodeURIComponent(query)}`);
}

/**
 * Get campaign team
 * @param {string} slug 
 * @returns {Promise<Array>}
 */
export async function getCampaignTeam(slug) {
    if (USE_MOCK) return Promise.resolve([]);
    return apiFetch(`/admin/campaigns/${slug}/team`);
}

/**
 * Add team member
 * @param {string} slug 
 * @param {number} userId 
 * @param {string} role 
 */
export async function addTeamMember(slug, userId, role) {
    if (USE_MOCK) return Promise.resolve({ success: true });
    return apiFetch(`/admin/campaigns/${slug}/team`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role })
    });
}

/**
 * Remove team member
 * @param {string} slug 
 * @param {number} userId 
 */
export async function removeTeamMember(slug, userId) {
    if (USE_MOCK) return Promise.resolve({ success: true });
    return apiFetch(`/admin/campaigns/${slug}/team/${userId}`, {
        method: 'DELETE'
    });
}

// ============================================================================
// MAPPING TABLE (for documentation)
// ============================================================================
/*
| Old Mock Helper                    | New API Function              | Endpoint                           |
|------------------------------------|-------------------------------|------------------------------------| 
| mockSubmissions.getSubmissionsByEvent | getSubmissionsByEvent      | GET /campaigns/:slug/submissions   |
| mockSubmissions.getSubmissionStats    | getSubmissionStats          | GET /campaigns/:slug/submissions/stats |
| mockCoupons.getCouponsByEvent         | getPoolsByEvent             | GET /campaigns/:slug/pools         |
| mockCoupons.getCouponStats            | getPoolStats                | GET /campaigns/:slug/pools (agg)   |
| winnerGenerator.getPoolDrawStats      | getPoolDrawStats            | GET /pools/:id/stats               |
| winnerGenerator.getAvailablePoolItems | getAvailablePoolItems       | GET /pools/:id/items?is_used=0     |
| MOCK_EVENTS                           | getCampaigns                | GET /campaigns                     |
| MOCK_EVENTS[slug]                     | getCampaignBySlug           | GET /campaigns/:slug               |

NOTE: In MOCK mode, functions return SYNC data.
      In API mode, functions return PROMISES (require await or .then()).
      Components using useMemo MUST use mock mode until refactored to useState+useEffect.
*/
