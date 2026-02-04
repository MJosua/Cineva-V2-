/**
 * Mock Pool Data (Coupons / Serial Codes)
 * Schema Source: EVENT_m_pool + EVENT_m_pool_item (from event_cms_schema_decision.md)
 * 
 * ARCHITECTURAL CHANGE:
 * The old "MOCK_COUPONS" was a mix of:
 *   - Pool metadata (name, description, rules, effects)
 *   - Item data (code, usage count)
 * 
 * NEW STRUCTURE (Schema-aligned):
 *   - MOCK_POOLS: Pool headers (EVENT_m_pool shape)
 *   - MOCK_POOL_ITEMS: Individual codes (EVENT_m_pool_item shape)
 * 
 * FIELD MAPPING:
 * Old MOCK_COUPONS -> Split into:
 * 
 * EVENT_m_pool:
 *   - id -> pool_id
 *   - event_id -> campaign_id (moved to pool level)
 *   - name -> name
 *   - description -> description (added)
 *   - (new) type -> 'VOUCHER' | 'SERIAL' | 'WHITELIST'
 *   - rules, effects -> config (JSON, pool-level settings)
 * 
 * EVENT_m_pool_item:
 *   - (new) item_id
 *   - (new) pool_id (FK)
 *   - code -> value
 *   - status 'exhausted' -> is_used = 1
 *   - (new) used_at
 *   - (new) used_by_submission_id
 * 
 * REMOVED FIELDS (moved to pool-level config or deprecated):
 *   - max_uses (now derived from pool_items count)
 *   - uses_per_user (stored in pool config)
 *   - current_uses (derived from COUNT of used items)
 *   - valid_from, valid_until (stored in pool config)
 */

// Campaign ID mapping (reused from mockSubmissions.js)
const CAMPAIGN_IDS = {
    "tw-2024": 1,
    "tw-2025": 2,
    "maldives-2025": 3
};

/**
 * Pool Headers (EVENT_m_pool)
 * Represents a "bucket" of codes/vouchers
 */
export const MOCK_POOLS = [
    {
        pool_id: 1,
        campaign_id: CAMPAIGN_IDS["tw-2024"],
        name: "New Year Welcome Coupon",
        description: "Get 50 points on your first submission",
        type: "VOUCHER",
        config: {
            uses_per_user: 1,
            valid_from: "2024-11-25T00:00:00Z",
            valid_until: "2025-01-31T23:59:59Z",
            rules: [
                { type: "date_range", config: { start: "2024-11-25", end: "2025-01-31" } },
                { type: "min_spend", config: { amount: 200, currency: "TWD" } }
            ],
            effects: [
                { type: "points", config: { points: 50 } }
            ]
        }
    },
    {
        pool_id: 2,
        campaign_id: CAMPAIGN_IDS["tw-2024"],
        name: "VIP High Spender Bonus",
        description: "Extra 100 points for purchases over 500 TWD",
        type: "VOUCHER",
        config: {
            uses_per_user: 5,
            valid_from: "2024-12-01T00:00:00Z",
            valid_until: "2025-02-28T23:59:59Z",
            rules: [
                { type: "min_spend", config: { amount: 500, currency: "TWD" } }
            ],
            effects: [
                { type: "points", config: { points: 100 } }
            ]
        }
    },
    {
        pool_id: 3,
        campaign_id: CAMPAIGN_IDS["tw-2024"],
        name: "First 100 Lucky Draw",
        description: "First 100 users get a chance to win iPhone",
        type: "SERIAL",
        config: {
            uses_per_user: 1,
            valid_from: "2024-11-25T00:00:00Z",
            valid_until: "2025-01-31T23:59:59Z",
            rules: [
                { type: "first_n_users", config: { limit: 100 } }
            ],
            effects: [
                { type: "prize_draw", config: { prize_name: "iPhone 15 Pro", entries: 1 } }
            ]
        }
    },
    {
        pool_id: 4,
        campaign_id: CAMPAIGN_IDS["maldives-2025"],
        name: "Paradise Promotion",
        description: "Double points on all submissions",
        type: "VOUCHER",
        config: {
            uses_per_user: 10,
            valid_from: "2025-01-01T00:00:00Z",
            valid_until: "2025-06-30T23:59:59Z",
            rules: [],
            effects: [
                { type: "points_multiplier", config: { multiplier: 2 } }
            ]
        }
    }
];

/**
 * Pool Items (EVENT_m_pool_item)
 * Individual codes/serials that belong to a pool
 */
export const MOCK_POOL_ITEMS = [
    // Pool 1: INDOMIE2024 voucher (single-code reusable voucher)
    { item_id: 1, pool_id: 1, value: "INDOMIE2024", is_used: 0, used_at: null, used_by_submission_id: null },

    // Pool 2: VIP500 voucher (single-code reusable voucher)
    { item_id: 2, pool_id: 2, value: "VIP500", is_used: 0, used_at: null, used_by_submission_id: null },

    // Pool 3: First 100 Lucky Draw (100 unique serial codes, all used)
    { item_id: 3, pool_id: 3, value: "LUCKY-001", is_used: 1, used_at: "2024-11-25T10:00:00Z", used_by_submission_id: 1 },
    { item_id: 4, pool_id: 3, value: "LUCKY-002", is_used: 1, used_at: "2024-11-25T10:15:00Z", used_by_submission_id: 2 },
    { item_id: 5, pool_id: 3, value: "LUCKY-003", is_used: 1, used_at: "2024-11-25T10:30:00Z", used_by_submission_id: 3 },
    // ... (remaining 97 items would be generated in production)

    // Pool 4: Paradise promotion (single-code reusable voucher)
    { item_id: 100, pool_id: 4, value: "PARADISE", is_used: 0, used_at: null, used_by_submission_id: null }
];

// Rule type definitions for UI (unchanged - these are UI helpers, not DB)
export const RULE_TYPES = [
    { type: "date_range", label: "Date Range", icon: "📅", fields: ["start", "end"] },
    { type: "min_spend", label: "Minimum Spend", icon: "💰", fields: ["amount", "currency"] },
    { type: "first_n_users", label: "First N Users", icon: "🏃", fields: ["limit"] },
    { type: "user_tag", label: "User Tag", icon: "🏷️", fields: ["tags"] },
    { type: "day_of_week", label: "Day of Week", icon: "📆", fields: ["days"] },
    { type: "store_id", label: "Specific Store", icon: "🏪", fields: ["store_ids"] }
];

// Effect type definitions for UI (unchanged - these are UI helpers, not DB)
export const EFFECT_TYPES = [
    { type: "points", label: "Award Points", icon: "⭐", fields: ["points"] },
    { type: "points_multiplier", label: "Points Multiplier", icon: "✖️", fields: ["multiplier"] },
    { type: "discount_percent", label: "Discount %", icon: "💸", fields: ["percent", "max_discount"] },
    { type: "discount_fixed", label: "Fixed Discount", icon: "💵", fields: ["amount", "currency"] },
    { type: "prize_draw", label: "Prize Draw Entry", icon: "🎁", fields: ["prize_name", "entries"] }
];

/**
 * Helper: Get pools by campaign slug
 * @param {string} eventSlug - The campaign slug
 * @returns {Array} Pool objects with computed usage stats
 */
export function getPoolsByEvent(eventSlug) {
    const campaignId = CAMPAIGN_IDS[eventSlug];
    if (!campaignId) return [];

    return MOCK_POOLS
        .filter(p => p.campaign_id === campaignId)
        .map(pool => {
            const items = MOCK_POOL_ITEMS.filter(i => i.pool_id === pool.pool_id);
            const usedCount = items.filter(i => i.is_used === 1).length;
            const totalCount = items.length;

            // Compute status from items
            let status = "active";
            if (pool.type === "SERIAL" && usedCount >= totalCount && totalCount > 0) {
                status = "exhausted";
            }

            return {
                ...pool,
                // Computed fields for UI compatibility
                total_items: totalCount,
                used_items: usedCount,
                status
            };
        });
}

// BACKWARD COMPATIBILITY: Alias for existing code that uses getCouponsByEvent
export function getCouponsByEvent(eventSlug) {
    return getPoolsByEvent(eventSlug);
}

/**
 * Helper: Get pool statistics for a campaign
 * @param {string} eventSlug - The campaign slug
 * @returns {Object} Stats object
 */
export function getPoolStats(eventSlug) {
    const pools = getPoolsByEvent(eventSlug);
    return {
        total: pools.length,
        active: pools.filter(p => p.status === "active").length,
        exhausted: pools.filter(p => p.status === "exhausted").length,
        disabled: pools.filter(p => p.status === "disabled").length
    };
}

// BACKWARD COMPATIBILITY: Alias for existing code
export function getCouponStats(eventSlug) {
    return getPoolStats(eventSlug);
}

/**
 * Helper: Check if a code/value exists in any pool for validation
 * @param {string} value - The code to check
 * @param {number} poolId - Optional pool to search within
 * @returns {Object|null} The item if found, null otherwise
 */
export function findPoolItem(value, poolId = null) {
    return MOCK_POOL_ITEMS.find(item => {
        const matchesValue = item.value.toLowerCase() === value.toLowerCase();
        const matchesPool = poolId === null || item.pool_id === poolId;
        return matchesValue && matchesPool;
    }) || null;
}

// Export campaign ID lookup
export { CAMPAIGN_IDS };
