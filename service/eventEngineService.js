/**
 * Event Engine Service Layer
 * 
 * Raw SQL queries and database operations for Event Engine.
 * All queries map 1:1 to EVENT_* schema columns.
 * 
 * Tables:
 * - EVENT_t_campaign
 * - EVENT_t_submission
 * - EVENT_m_pool
 * - EVENT_m_pool_item
 * - EVENT_t_winner
 */

const { dbQueryHots, dbHots } = require('../config/db');
const RuleExecutor = require('./ruleExecutor'); // Phase 4.2
const sseManager = require('../core/sse-manager'); // Phase 5: Live Updates
const { encryptUrlSafe, decryptUrlSafe } = require('../core/cryptoUtil');

/**
 * Log administrative action to EVENT_t_log
 * @param {Object} logData 
 */
async function logEventAction({ campaignId, userId, actionType, details, ipAddress }) {
    try {
        const sql = `
            INSERT INTO EVENT_t_log (campaign_id, user_id, action_type, details, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        await dbQueryHots(sql, [
            campaignId,
            userId || null,
            actionType,
            JSON.stringify(details || {})
        ]);
    } catch (e) {
        console.error('[EventLog] Failed to log action:', e);
        // Don't throw, just log error so main flow isn't interrupted
    }
}

/**
 * Safe JSON parser
 * Handles cases where DB driver might have already parsed the JSON column
 */
function safeParse(val) {
    if (!val) return null;
    if (typeof val === 'object') return val; // Already parsed
    try {
        return JSON.parse(val);
    } catch (e) {
        console.error('JSON Parse Error:', e, val);
        return null;
    }
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

/**
 * Get all campaigns
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Campaign list
 */
async function getCampaigns(filters = {}, adminUser = null) {
    let sql = `
        SELECT 
            campaign_id,
            ticket_id,
            slug,
            name,
            status,
            published_at,
            is_locked,
            theme_config,
            block_schema,
            settings_config,
            created_by,
            created_at,
            updated_at
        FROM EVENT_t_campaign
        WHERE 1=1
    `;
    const params = [];

    // 🔐 RBAC Scoping
    if (adminUser && (adminUser.role !== 'superadmin' && adminUser.role !== 'distributor')) {
        // For standard admins, check DB assignment
        sql += ` AND campaign_id IN (
            SELECT campaign_id FROM EVENT_r_campaign_admin WHERE user_id = ?
        )`;
        params.push(adminUser.id);
    } else if (adminUser && adminUser.role === 'distributor') {
        // Distributors might rely on different logic or same?
        // User said "preset of distributor as guest".
        // Let's assume they also use the same table OR hardcoded logic.
        // For now, treat distributor as generic guest or restrict.
        // Safety: If no specific logic, maybe allow none or all? 
        // Original code didn't handle distributor specially in this block.
        // Let's assume distributors function like admins but read-only, so check the same table.
        sql += ` AND campaign_id IN (
            SELECT campaign_id FROM EVENT_r_campaign_admin WHERE user_id = ?
        )`;
        params.push(adminUser.id);
    }

    if (filters.status) {
        sql += ` AND status = ?`;
        params.push(filters.status);
    }

    sql += ` ORDER BY created_at DESC`;

    if (filters.limit) {
        sql += ` LIMIT ?`;
        params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
        sql += ` OFFSET ?`;
        params.push(parseInt(filters.offset));
    }

    const campaigns = await dbQueryHots(sql, params);

    // Parse JSON columns
    return campaigns.map(c => ({
        ...c,
        theme_config: safeParse(c.theme_config),
        settings_config: safeParse(c.settings_config),
        blocks: safeParse(c.block_schema) || [] // Ensure it's an array for frontend compatibility
    }));
}

/**
 * Get campaign by slug
 * @param {string} slug - Campaign URL slug
 * @returns {Promise<Object|null>} Campaign object
 */
async function getCampaignBySlug(slug) {
    const sql = `
        SELECT 
            campaign_id,
            ticket_id,
            slug,
            name,
            status,
            theme_config,
            block_schema,
            settings_config,
            created_by,
            created_at,
            updated_at
        FROM EVENT_t_campaign
        WHERE slug = ?
    `;
    const rows = await dbQueryHots(sql, [slug]);

    if (rows.length === 0) return null;

    const c = rows[0];
    return {
        ...c,
        theme_config: safeParse(c.theme_config),
        block_schema: safeParse(c.block_schema),
        blocks: safeParse(c.block_schema) || [], // Map for frontend compatibility
        settings_config: safeParse(c.settings_config)
    };
}

/**
 * Get campaign ID by slug (helper)
 * @param {string} slug - Campaign URL slug
 * @returns {Promise<number|null>} Campaign ID
 */
async function getCampaignIdBySlug(slug) {
    const sql = `SELECT campaign_id FROM EVENT_t_campaign WHERE slug = ?`;
    const rows = await dbQueryHots(sql, [slug]);
    return rows.length > 0 ? rows[0].campaign_id : null;
}

/**
 * Create a new campaign
 * @param {Object} campaignData - Campaign data
 * @returns {Promise<Object>} Created campaign
 */
async function createCampaign(campaignData) {
    const sql = `
        INSERT INTO EVENT_t_campaign (
            ticket_id,
            slug,
            name,
            description,
            status,
            theme_config,
            block_schema,
            settings_config,
            created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Generate ticket_id if not provided (fallback)
    const ticketId = campaignData.ticket_id || `EVT-${Date.now()}`;
    const status = campaignData.status || 'draft';

    // Ensure JSON fields are strings if they are objects
    const themeConfig = typeof campaignData.theme_config === 'object'
        ? JSON.stringify(campaignData.theme_config)
        : campaignData.theme_config;

    const blockSchema = typeof campaignData.block_schema === 'object'
        ? JSON.stringify(campaignData.block_schema)
        : campaignData.block_schema;

    const settingsConfig = typeof campaignData.settings_config === 'object'
        ? JSON.stringify(campaignData.settings_config)
        : campaignData.settings_config;


    const params = [
        ticketId,
        campaignData.slug,
        campaignData.name,
        campaignData.description || '',
        status,
        themeConfig,
        blockSchema,
        settingsConfig,
        campaignData.created_by || 0
    ];

    const result = await dbQueryHots(sql, params);
    const newCampaignId = result.insertId;

    // Audit Log
    await logEventAction({
        campaignId: newCampaignId,
        userId: campaignData.created_by,
        actionType: 'CREATE_CAMPAIGN',
        details: { slug: campaignData.slug, name: campaignData.name }
    });

    // Return the created object by fetching it back or constructing it
    return getCampaignBySlug(campaignData.slug);
}

/**
 * Update a campaign
 * @param {string} slug - Campaign slug to find
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated campaign
 */
async function updateCampaign(slug, updates) {
    const fields = [];
    const params = [];

    // Map allowed fields to DB columns
    if (updates.name) {
        fields.push("name = ?");
        params.push(updates.name);
    }
    if (updates.description) {
        fields.push("description = ?");
        params.push(updates.description);
    }
    if (updates.status) {
        fields.push("status = ?");
        params.push(updates.status);
    }
    if (updates.theme) {
        fields.push("theme_config = ?");
        params.push(typeof updates.theme === 'object' ? JSON.stringify(updates.theme) : updates.theme);
    }
    if (updates.blocks) {
        fields.push("block_schema = ?");
        params.push(typeof updates.blocks === 'object' ? JSON.stringify(updates.blocks) : updates.blocks);
    }
    if (updates.settings) {
        fields.push("settings_config = ?");
        params.push(typeof updates.settings === 'object' ? JSON.stringify(updates.settings) : updates.settings);
    }

    if (fields.length === 0) return getCampaignBySlug(slug);

    let sql = `UPDATE EVENT_t_campaign SET ${fields.join(", ")} WHERE slug = ?`;

    // params already pushed slug? No, let's check.
    // The previous code had `params.push(slug)` BEFORE `sql +=`.
    // I need to be careful with params order.
    // fields pushes first.
    // then `params.push(slug)` (for the WHERE clause).

    // So:
    // params already pushed slug? No, let's check.
    // The previous code had `params.push(slug)` BEFORE `sql +=`.
    // I need to be careful with params order.
    // fields pushes first.
    // then `params.push(slug)` (for the WHERE clause).

    // So:
    // params has [val1, val2, ...]
    // params.push(slug) -> [val1, val2, ..., slug]

    // So the SQL should be:
    // UPDATE ... SET col1=?, col2=? WHERE slug=?

    params.push(slug); // Ensure slug is the last param

    console.log(`[EventEngineService] Executing UPDATE:`, sql);
    const result = await dbQueryHots(sql, params);
    console.log(`[EventEngineService] Update result:`, result);

    // Audit Log
    if (result.affectedRows > 0) {
        // Fetch ID for logging
        const campaignId = await getCampaignIdBySlug(slug);
        await logEventAction({
            campaignId,
            userId: updates.updatedBy || 0, // Passed from controller
            actionType: 'UPDATE_CAMPAIGN',
            details: {
                slug,
                updates: Object.keys(updates).filter(k => k !== 'updatedBy') // Log which fields changed
            }
        });
    }

    return getCampaignBySlug(slug);
}

/**
 * Publish or Unpublish a campaign
 * @param {string} slug 
 * @param {boolean} shouldPublish 
 * @returns {Promise<Object>} Updated campaign
 */
async function publishCampaign(slug, shouldPublish, userId = 0) {
    const status = shouldPublish ? 'active' : 'draft';
    const sql = shouldPublish
        ? `UPDATE EVENT_t_campaign SET status = ?, published_at = NOW() WHERE slug = ?`
        : `UPDATE EVENT_t_campaign SET status = ?, published_at = NULL WHERE slug = ?`;

    await dbQueryHots(sql, [status, slug]);

    // Audit Log
    const campaignId = await getCampaignIdBySlug(slug);
    await logEventAction({
        campaignId,
        userId,
        actionType: shouldPublish ? 'PUBLISH_CAMPAIGN' : 'UNPUBLISH_CAMPAIGN',
        details: { slug, status }
    });

    return getCampaignBySlug(slug);
}

/**
 * Delete a campaign
 * @param {string} slug 
 * @returns {Promise<boolean>} Success (true if deleted, false if not found)
 */
async function deleteCampaign(slug) {
    const sql = `DELETE FROM EVENT_t_campaign WHERE slug = ?`;
    const result = await dbQueryHots(sql, [slug]);
    return result.affectedRows > 0;
}

/**
 * Get Public Campaign (Secure)
 * @param {string} slug 
 */
async function getPublicCampaign(slug) {
    const sql = `
        SELECT 
            slug, name, description, 
            theme_config, block_schema, 
            published_at 
        FROM EVENT_t_campaign 
        WHERE slug = ? AND status = 'active' AND published_at IS NOT NULL
    `;

    const rows = await dbQueryHots(sql, [slug]);
    if (rows.length === 0) return null;

    const c = rows[0];
    return {
        ...c,
        theme_config: safeParse(c.theme_config),
        block_schema: safeParse(c.block_schema),
        blocks: safeParse(c.block_schema) || [] // Map for frontend compatibility
    };
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

/**
 * Get submissions by campaign slug
 * @param {string} slug - Campaign slug
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} { submissions: [], total: number }
 */
async function getSubmissionsByCampaign(slug, filters = {}) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return { submissions: [], total: 0 };

    // Count total
    let countSql = `SELECT COUNT(*) as total FROM EVENT_t_submission WHERE campaign_id = ?`;
    const countParams = [campaignId];

    if (filters.status) {
        countSql += ` AND status = ?`;
        countParams.push(filters.status);
    }

    if (filters.search) {
        countSql += ` AND (participant_name LIKE ? OR participant_contact LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        countParams.push(searchTerm, searchTerm);
    }

    const countResult = await dbQueryHots(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Get data
    let sql = `
        SELECT 
            submission_id,
            campaign_id,
            participant_name,
            participant_contact,
            receipt_codes,
            extra_data,
            status,
            rejection_reason,
            ip_address,
            user_agent,
            submitted_at,
            updated_by,
            updated_at
        FROM EVENT_t_submission
        WHERE campaign_id = ?
    `;
    const params = [campaignId];

    if (filters.status) {
        sql += ` AND status = ?`;
        params.push(filters.status);
    }

    if (filters.search) {
        sql += ` AND (participant_name LIKE ? OR participant_contact LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
    }

    sql += ` ORDER BY submitted_at DESC`;

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const submissions = await dbQueryHots(sql, params);

    // Parse JSON columns
    return {
        submissions: submissions.map(s => ({
            ...s,
            extra_data: safeParse(s.extra_data)
        })),
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
    };
}

/**
 * Get submission statistics by campaign slug
 * @param {string} slug - Campaign slug
 * @returns {Promise<Object>} { total, pending, approved, rejected }
 */
async function getSubmissionStats(slug) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return { total: 0, pending: 0, approved: 0, rejected: 0 };

    const sql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM EVENT_t_submission
        WHERE campaign_id = ?
    `;
    const result = await dbQueryHots(sql, [campaignId]);

    return {
        total: result[0]?.total || 0,
        pending: result[0]?.pending || 0,
        approved: result[0]?.approved || 0,
        rejected: result[0]?.rejected || 0
    };
}

/**
 * Get all submissions for export (no paging)
 * @param {string} slug - Campaign slug
 * @returns {Promise<Array>} Flat submission list
 */
async function getSubmissionsForExport(slug) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return [];

    const sql = `
        SELECT 
            submission_id,
            participant_name,
            participant_contact,
            receipt_codes,
            extra_data,
            status,
            rejection_reason,
            ip_address,
            submitted_at
        FROM EVENT_t_submission
        WHERE campaign_id = ?
        ORDER BY submitted_at DESC
    `;
    const rows = await dbQueryHots(sql, [campaignId]);

    return rows.map(s => {
        const extra = safeParse(s.extra_data) || {};
        // Flatten extra_data for easy CSV conversion
        const flat = { ...s };
        delete flat.extra_data;

        // Add dynamic fields from extra_data
        Object.entries(extra).forEach(([key, val]) => {
            if (key !== 'images') { // Don't include raw image arrays in CSV
                flat[`data_${key}`] = val;
            }
        });

        return flat;
    });
}


// ============================================================================
// REWARD POOLS
// ============================================================================

/**
 * Get pools by campaign slug
 * @param {string} slug - Campaign slug
 * @returns {Promise<Array>} Pool list with aggregated item counts
 */
async function getPoolsByCampaign(slug) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return [];

    const sql = `
        SELECT 
            p.pool_id,
            p.campaign_id,
            p.name,
            p.description,
            p.type,
            p.config,
            (SELECT COUNT(*) FROM EVENT_m_pool_item WHERE pool_id = p.pool_id) as total_items,
            (SELECT COUNT(*) FROM EVENT_t_winner WHERE pool_id = p.pool_id) as used_items,
            (SELECT COUNT(*) FROM EVENT_m_pool_item WHERE pool_id = p.pool_id AND is_used = 0) as available_items
        FROM EVENT_m_pool p
        WHERE p.campaign_id = ?
        ORDER BY p.pool_id
    `;

    const pools = await dbQueryHots(sql, [campaignId]);

    return pools.map(p => {
        const config = safeParse(p.config);
        const available = p.available_items || 0;

        // Status determination
        let status = 'active';
        if (p.total_items === 0 && p.type !== 'WHITELIST') status = 'empty';
        else if (available === 0 && p.type === 'SERIAL') status = 'exhausted';
        if (config?.status) status = config.status; // Override if manually set (e.g. disabled)

        return {
            ...p,
            config,
            status,
            total_items: p.total_items || 0,
            used_items: p.used_items || 0
        };
    });
}

/**
 * Get pool by ID
 * @param {number} poolId - Pool ID
 * @returns {Promise<Object|null>} Pool object
 */
async function getPoolById(poolId) {
    const sql = `
        SELECT 
            pool_id,
            campaign_id,
            name,
            description,
            type,
            config
        FROM EVENT_m_pool
        WHERE pool_id = ?
    `;
    const rows = await dbQueryHots(sql, [poolId]);

    if (rows.length === 0) return null;

    const p = rows[0];
    return {
        ...p,
        config: safeParse(p.config)
    };
}

/**
 * Get pool items
 * @param {number} poolId - Pool ID
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} { items: [], total: number }
 */
async function getPoolItems(poolId, filters = {}) {
    // Count total
    let countSql = `SELECT COUNT(*) as total FROM EVENT_m_pool_item WHERE pool_id = ?`;
    const countParams = [poolId];

    if (filters.is_used !== undefined) {
        countSql += ` AND is_used = ?`;
        countParams.push(parseInt(filters.is_used));
    }

    const countResult = await dbQueryHots(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Get items
    let sql = `
        SELECT 
            item_id,
            pool_id,
            value,
            is_used,
            used_at,
            used_by_submission_id
        FROM EVENT_m_pool_item
        WHERE pool_id = ?
    `;
    const params = [poolId];

    if (filters.is_used !== undefined) {
        sql += ` AND is_used = ?`;
        params.push(parseInt(filters.is_used));
    }

    sql += ` ORDER BY item_id`;

    const limit = filters.limit || 100;
    sql += ` LIMIT ?`;
    params.push(parseInt(limit));

    const rawItems = await dbQueryHots(sql, params);

    // Attach encrypted value for frontend QR generation
    const items = rawItems.map(item => ({
        ...item,
        encrypted_value: encryptUrlSafe(item.value)
    }));

    return { items, total };
}

/**
 * Get pool statistics
 * @param {number} poolId - Pool ID
 * @returns {Promise<Object>} Pool stats
 */
async function getPoolStats(poolId) {
    const pool = await getPoolById(poolId);
    if (!pool) return null;

    const sql = `
        SELECT 
            COUNT(*) as total_items,
            SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used_items,
            SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available_items
        FROM EVENT_m_pool_item
        WHERE pool_id = ?
    `;
    const result = await dbQueryHots(sql, [poolId]);

    return {
        pool_id: pool.pool_id,
        pool_name: pool.name,
        pool_type: pool.type,
        total_items: result[0]?.total_items || 0,
        used_items: result[0]?.used_items || 0,
        available_items: result[0]?.available_items || 0,
        exhausted: (result[0]?.available_items || 0) === 0
    };
}

/**
 * Get aggregated pool stats by campaign slug
 * @param {string} slug - Campaign slug
 * @returns {Promise<Object>} { total, active, disabled, exhausted }
 */
async function getPoolStatsByCampaign(slug) {
    const pools = await getPoolsByCampaign(slug);

    return {
        total: pools.length,
        active: pools.filter(p => p.status === 'active').length,
        disabled: pools.filter(p => p.status === 'disabled').length,
        exhausted: pools.filter(p => p.status === 'exhausted').length
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Campaigns
    getCampaigns,
    getCampaignBySlug,
    getCampaignIdBySlug,
    createCampaign,
    updateCampaign,
    deleteCampaign,

    // Submissions
    getSubmissionsByCampaign,
    getSubmissionStats,
    updateSubmissionStatus,

    // Pools
    getPoolsByCampaign,
    getPoolById,
    getPoolItems,
    getPoolStats,
    getPoolStatsByCampaign,
    createPool,
    updatePool,
    addPoolItems,

    // Analytics
    getDailySubmissionStats,
    getWinnersByCampaign,
    getWinnersForExport,
    publishCampaign,
    getPublicCampaign,

    // Winner Generator
    drawWinners,

    // Team Management
    getCampaignTeam,
    addTeamMember,
    removeTeamMember,
    searchUsers
};

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

/**
 * Get team members for a campaign
 * @param {string} slug 
 * @returns {Promise<Array>}
 */
async function getCampaignTeam(slug) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return [];

    const sql = `
        SELECT r.relation_id, r.user_id, r.role, r.created_at,
               a.firstname, a.lastname, a.email, a.uid
        FROM EVENT_r_campaign_admin r
        JOIN user a ON r.user_id = a.user_id
        WHERE r.campaign_id = ?
    `;
    return dbQueryHots(sql, [campaignId]);
}

/**
 * Add a user to campaign team
 * @param {string} slug 
 * @param {number} userId 
 * @param {string} role 
 */
async function addTeamMember(slug, userId, role = 'admin') {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) throw new Error("Campaign not found");

    const sql = `
        INSERT INTO EVENT_r_campaign_admin (campaign_id, user_id, role)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE role = VALUES(role)
    `;
    await dbQueryHots(sql, [campaignId, userId, role]);

    // Broadcast?
    return getCampaignTeam(slug);
}

/**
 * Remove a user from campaign team
 * @param {string} slug 
 * @param {number} userId 
 */
async function removeTeamMember(slug, userId) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) throw new Error("Campaign not found");

    const sql = `DELETE FROM EVENT_r_campaign_admin WHERE campaign_id = ? AND user_id = ?`;
    await dbQueryHots(sql, [campaignId, userId]);
    return true;
}

/**
 * Search HOTS users
 * @param {string} query 
 */
async function searchUsers(query) {
    if (!query || query.length < 3) return [];

    const sql = `
        SELECT user_id, firstname, lastname, email, uid, role_id
        FROM user
        WHERE (firstname LIKE ? OR lastname LIKE ? OR uid LIKE ? OR email LIKE ?)
          AND active = 1
        LIMIT 10
    `;
    const search = `%${query}%`;
    return dbQueryHots(sql, [search, search, search, search]);
}

// ============================================================================
// COUPON MANAGEMENT (WRITE)
// ============================================================================

/**
 * Create a new reward pool
 * @param {string} slug - Campaign slug
 * @param {Object} poolData - { name, description, type, config, status }
 * @returns {Promise<Object>} Created pool
 */
async function createPool(slug, poolData) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) throw new Error(`Campaign not found: ${slug}`);

    const { name, description, type, config = {}, status = 'draft' } = poolData;

    // Validate required fields
    if (!name || !type) throw new Error("Name and Type are required");

    // Store status in config if it's not a column
    const finalConfig = { ...config, status };

    const sql = `
        INSERT INTO EVENT_m_pool (campaign_id, name, description, type, config)
        VALUES (?, ?, ?, ?, ?)
    `;

    const result = await dbQueryHots(sql, [
        campaignId,
        name,
        description || '',
        type,
        JSON.stringify(finalConfig)
    ]);

    const newPool = {
        pool_id: result.insertId,
        campaign_id: campaignId,
        ...poolData,
        config: finalConfig
    };

    // Broadcast
    sseManager.broadcast('pool_created', {
        slug: slug,
        pool: newPool
    });

    return newPool;
}

/**
 * Update an existing pool
 * @param {number} poolId - Pool ID
 * @param {Object} poolData - { name, description, type, config, status }
 * @returns {Promise<Object>} Updated pool
 */
async function updatePool(poolId, poolData) {
    // Check existence
    const existing = await getPoolById(poolId);
    if (!existing) throw new Error("Pool not found");

    const { name, description, type, config, status } = poolData;

    // Merge config
    const mergedConfig = { ...existing.config, ...config };
    if (status) mergedConfig.status = status;

    const sql = `
        UPDATE EVENT_m_pool 
        SET name = ?, description = ?, type = ?, config = ?
        WHERE pool_id = ?
    `;

    await dbQueryHots(sql, [
        name || existing.name,
        description !== undefined ? description : existing.description,
        type || existing.type,
        JSON.stringify(mergedConfig),
        poolId
    ]);

    return { ...existing, ...poolData, config: mergedConfig };
}

/**
 * Add items to a pool
 * @param {number} poolId - Pool ID
 * @param {Array<string>} items - Array of item values (codes)
 * @returns {Promise<Object>} { count: number }
 */
async function addPoolItems(poolId, items) {
    if (!Array.isArray(items) || items.length === 0) {
        return { count: 0 };
    }

    // Bulk insert
    const values = items.map(val => [poolId, val, 0]); // is_used = 0

    await dbQueryHots(
        `INSERT INTO EVENT_m_pool_item (pool_id, value, is_used) VALUES ?`,
        [values]
    );

    // Broadcast refresh
    const pool = await getPoolById(poolId);
    if (pool) {
        const slugRes = await dbQueryHots(`SELECT slug FROM EVENT_t_campaign WHERE campaign_id = ?`, [pool.campaign_id]);
        const slug = slugRes[0]?.slug;
        if (slug) sseManager.broadcast('pools_changed', { slug });
    }

    return { count: items.length };
}

/**
 * Import items from CSV content
 * @param {number} poolId 
 * @param {string} csvContent 
 */
async function importPoolItems(poolId, csvContent) {
    if (!csvContent || typeof csvContent !== 'string') throw new Error("Invalid CSV content");

    // normalize line endings
    const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const items = [];

    // Check Header (Optional, but good for validation)
    // If first line is "code" or "value", skip it.
    let startIndex = 0;
    if (lines.length > 0 && /^(code|value|item|serial)/i.test(lines[0].trim())) {
        startIndex = 1;
    }

    const uniqueSet = new Set();

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV assumption: values might be comma separated, we take the first column
        const parts = line.split(',');
        const val = parts[0].trim();

        if (val && !uniqueSet.has(val)) {
            uniqueSet.add(val);
            items.push(val);
        }
    }

    if (items.length === 0) {
        throw new Error("No valid items found in CSV");
    }

    // Reuse existing bulk insert
    return await addPoolItems(poolId, items);
}

// ============================================================================
// ANALYTICS (READ)
// ============================================================================

/**
 * Get daily submission counts for internal reporting
 * @param {string} slug - Campaign slug
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Promise<Array>} [{ date: 'YYYY-MM-DD', count: 123 }, ...]
 */
async function getDailySubmissionStats(slug, days = 30) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return [];

    const sql = `
        SELECT 
            DATE_FORMAT(submitted_at, '%Y-%m-%d') as date,
            COUNT(*) as count
        FROM EVENT_t_submission
        WHERE campaign_id = ? 
          AND submitted_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE_FORMAT(submitted_at, '%Y-%m-%d')
        ORDER BY date ASC
    `;

    const rows = await dbQueryHots(sql, [campaignId, days]);
    return rows;
}

/**
 * Get list of winners for a campaign
 * @param {string} slug - Campaign slug
 * @returns {Promise<Array>} Winners list with details
 */
async function getWinnersByCampaign(slug) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return [];

    const sql = `
        SELECT 
            w.winner_id,
            w.drawn_at,
            w.claimed,
            p.name as pool_name,
            pi.value as prize_value,
            w.draw_strategy,
            w.submission_id 
            -- (Join with submission if needed, but for now we just show IDs or raw values)
        FROM EVENT_t_winner w
        JOIN EVENT_m_pool p ON w.pool_id = p.pool_id
        JOIN EVENT_m_pool_item pi ON w.item_id = pi.item_id
        WHERE w.campaign_id = ?
        ORDER BY w.drawn_at DESC
        LIMIT 100
    `;

    const rows = await dbQueryHots(sql, [campaignId]);
    return rows;
}

/**
 * Get all winners for export (flat list)
 * @param {string} slug - Campaign slug
 * @returns {Promise<Array>} Flat winner list
 */
async function getWinnersForExport(slug) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return [];

    const sql = `
        SELECT 
            w.winner_id,
            w.drawn_at,
            w.claimed,
            w.draw_strategy,
            p.name as pool_name,
            pi.value as prize_value,
            w.submission_id,
            s.participant_name,
            s.participant_contact,
            s.receipt_codes,
            s.ip_address,
            s.submitted_at
        FROM EVENT_t_winner w
        JOIN EVENT_m_pool p ON w.pool_id = p.pool_id
        JOIN EVENT_m_pool_item pi ON w.item_id = pi.item_id
        LEFT JOIN EVENT_t_submission s ON w.submission_id = s.submission_id
        WHERE w.campaign_id = ?
        ORDER BY w.drawn_at DESC
    `;

    const rows = await dbQueryHots(sql, [campaignId]);

    // Format boolean for CSV
    return rows.map(w => ({
        ...w,
        claimed: w.claimed ? 'Yes' : 'No'
    }));
}

// ============================================================================
// SUBMISSIONS (WRITE)
// ============================================================================

/**
 * Update submission status
 * 
 * @param {string} submissionId - Submission ID (UUID)
 * @param {string} status - New status (approved/rejected)
 * @param {string} rejectionReason - Reason if rejected
 * @param {number} userId - Admin ID making the change
 */
async function updateSubmissionStatus(submissionId, status, rejectionReason = null, userId = 0) {
    // 1. Validate Status
    const allowed = ['approved', 'rejected', 'pending'];
    if (!allowed.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
    }

    // 2. Update DB
    const sql = `
        UPDATE EVENT_t_submission
        SET 
            status = ?,
            rejection_reason = ?,
            updated_by = ?,
            updated_at = NOW()
        WHERE submission_id = ?
    `;

    const params = [
        status,
        status === 'rejected' ? rejectionReason : null,
        userId,
        submissionId
    ];

    const result = await dbQueryHots(sql, params);

    if (result.affectedRows === 0) {
        throw new Error("Submission not found");
    }

    // Phase 5: SSE Broadcast
    sseManager.broadcast('submission_updated', {
        submission_id: submissionId,
        status: status,
        updated_at: new Date().toISOString(),
        updated_by: userId
    });

    // Audit Log
    // Get campaign_id first
    const [subRows] = await dbHots.promise().query("SELECT campaign_id FROM EVENT_t_submission WHERE submission_id = ?", [submissionId]);
    if (subRows.length > 0) {
        await logEventAction({
            campaignId: subRows[0].campaign_id,
            userId,
            actionType: 'UPDATE_SUBMISSION_STATUS',
            details: { submissionId, status, rejectionReason }
        });
    }

    return { submission_id: submissionId, status, updated: true };
}

// ============================================================================
// WINNER GENERATOR (WRITE)
// ============================================================================

/**
 * Draw winners from a pool
 * SAFE & ATOMIC: Uses transactions and row locking.
 * 
 * @param {number} poolId - Pool to draw from
 * @param {number} count - Number of items to draw
 * @param {string} strategy - "RANDOM" or "FIRST_N"
 * @param {number} drawnByUserId - Admin ID drawing the winners
 */
async function drawWinners(poolId, count, strategy = 'RANDOM', drawnByUserId = 0) {
    const connection = await dbHots.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get Pool Details (to verify campaign linkage)
        const [poolRows] = await connection.query(
            "SELECT campaign_id FROM EVENT_m_pool WHERE pool_id = ?",
            [poolId]
        );
        if (poolRows.length === 0) throw new Error("Pool not found");
        const campaignId = poolRows[0].campaign_id;

        // [Phase 4.2] Rule Validation
        const validation = await RuleExecutor.validateDraw(poolId, {
            count,
            drawnByUserId,
            // submissionId: null // Future: pass if available 
        });

        if (!validation.valid) {
            await connection.rollback();
            return { success: false, error: validation.error };
        }

        // 2. Select Items for Update (Locking)
        // FOR UPDATE ensures no one else draws these specific items until we commit.
        let orderByClause = "RAND()";

        if (strategy === "FIRST_N") orderByClause = "item_id ASC";

        const [items] = await connection.query(
            `SELECT item_id, value, pool_id 
             FROM EVENT_m_pool_item 
             WHERE pool_id = ? AND is_used = 0 
             ORDER BY ${orderByClause} 
             LIMIT ? 
             FOR UPDATE`,
            [poolId, parseInt(count)]
        );

        if (items.length === 0) {
            await connection.rollback();
            return { success: false, error: "No available items to draw" };
        }

        const itemIds = items.map(i => i.item_id);

        // 3. Mark items as USED
        await connection.query(
            `UPDATE EVENT_m_pool_item 
             SET is_used = 1, used_at = NOW() 
             WHERE item_id IN (?)`,
            [itemIds]
        );

        // 4. Insert into Winner Table
        // Bulk insert
        const winnerValues = items.map(item => [
            campaignId,
            poolId,
            item.item_id,
            null, // submission_id (null for now, manual draw)
            strategy,
            0 // claimed
        ]);

        await connection.query(
            `INSERT INTO EVENT_t_winner (campaign_id, pool_id, item_id, submission_id, draw_strategy, claimed) 
             VALUES ?`,
            [winnerValues]
        );

        await connection.commit();

        // 5. Audit Log (Async, outside transaction or after commit)
        // We do it after commit to ensure log reflects reality
        logEventAction({
            campaignId,
            userId: drawnByUserId,
            actionType: 'DRAW_WINNERS',
            details: {
                poolId,
                count: items.length,
                strategy
            }
        });

        return {
            success: true,
            drawn_count: items.length,
            items: items,
            campaign_id: campaignId
        };

    } catch (error) {
        await connection.rollback();
        console.error("[drawWinners] Transaction Failed:", error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Get audit logs for a campaign
 * @param {string} slug 
 * @param {Object} filters 
 */
async function getAuditLogs(slug, filters = {}) {
    const campaignId = await getCampaignIdBySlug(slug);
    if (!campaignId) return [];

    let sql = `
        SELECT 
            l.log_id,
            l.action_type,
            l.details,
            l.created_at,
            l.user_id,
            u.firstname,
            u.lastname,
            u.email
        FROM EVENT_t_log l
        LEFT JOIN user u ON l.user_id = u.user_id
        WHERE l.campaign_id = ?
    `;
    const params = [campaignId];

    sql += ` ORDER BY l.created_at DESC`;

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const rows = await dbQueryHots(sql, params);

    return rows.map(r => ({
        ...r,
        details: safeParse(r.details)
    }));
}

/**
 * Submit a new entry
 * @param {string} slug 
 * @param {Object} submissionData 
 */
async function submitEntry(slug, { participant_name, participant_contact, receipt_codes, extra_data, is_encrypted }) {
    // 1. Get Campaign
    const campaign = await getCampaignBySlug(slug);
    if (!campaign) throw new Error("Campaign not found");

    // 2. Prepare Data
    // Use shorter ID to avoid truncation (assuming VARCHAR(20) or similar)
    const submissionId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Ensure receipt_codes is a string (JSON array) or null
    let finalCodes = receipt_codes;
    if (receipt_codes && is_encrypted) {
        const codeArray = Array.isArray(receipt_codes) ? receipt_codes : [receipt_codes];
        finalCodes = codeArray.map(c => decryptUrlSafe(c)).filter(Boolean);
    }

    let codesStr = '[]';
    if (finalCodes && finalCodes.length > 0) {
        codesStr = Array.isArray(finalCodes) ? JSON.stringify(finalCodes) : JSON.stringify([finalCodes]);
    }
    const extra = extra_data ? (typeof extra_data === 'string' ? extra_data : JSON.stringify(extra_data)) : '{}';

    // 3. Insert
    const sql = `
        INSERT INTO EVENT_t_submission 
        (campaign_id, participant_name, participant_contact, receipt_codes, extra_data, status, submitted_at)
        VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    `;

    // Perform INSERT
    const result = await dbQueryHots(sql, [
        campaign.campaign_id,
        participant_name || 'Guest',
        participant_contact || '',
        codesStr,
        extra
    ]);
    const newSubmissionId = result.insertId; // Use auto-incremented ID

    // Phase 5: SSE Broadcast
    sseManager.broadcast('submission_created', {
        slug: slug,
        submission: {
            submission_id: newSubmissionId,
            campaign_id: campaign.campaign_id,
            participant_name: participant_name || 'Guest',
            participant_contact: participant_contact || '',
            receipt_codes: codesStr,
            extra_data: safeParse(extra),
            status: 'pending',
            submitted_at: new Date().toISOString()
        }
    });

    if (receipt_codes && receipt_codes.length > 0) {
        // [Logic moved to submitEntry in earlier step, assuming it's here or I need to preserve it]
        // Wait, I am editing lines 1027-1033 but need to be careful not to overwrite the coupon logic I added before.
        // Let me check the file content again to be safe about the surrounding lines.
        // The previous view_file stopped at 1030. Ideally I should see what's after.
        // I will assume the coupon logic (validation/redemption) follows this block.
        // Actually, let me READ MORE lines to be safe.
    }

    // If AUTO_INCREMENT, result.insertId gives the ID
    // const newSubmissionId = result.insertId; // Already declared above

    // 4. Validate and Consume Codes (Rule Engine - Lite)
    if (receipt_codes && receipt_codes.length > 0) {
        // Find matching available items in this campaign's pools
        // We join with Pools to ensure it belongs to THIS campaign
        const findSql = `
            SELECT i.item_id, i.pool_id, i.value, p.type 
            FROM EVENT_m_pool_item i
            JOIN EVENT_m_pool p ON i.pool_id = p.pool_id
            WHERE p.campaign_id = ? 
              AND i.value IN (?)
              AND (i.is_used = 0 OR p.type = 'VOUCHER') -- Vouchers are reusable
        `;

        const codeArray = Array.isArray(finalCodes) ? finalCodes : [finalCodes];
        const validItems = await dbQueryHots(findSql, [campaign.campaign_id, codeArray]);

        if (validItems.length > 0) {
            // Process Validation
            // A. Mark Serial items as USED
            const serialItems = validItems.filter(i => i.type !== 'VOUCHER').map(i => i.item_id);
            if (serialItems.length > 0) {
                await dbQueryHots(`UPDATE EVENT_m_pool_item SET is_used = 1, used_at = NOW() WHERE item_id IN (?)`, [serialItems]);
            }

            // B. Record as "Winner" / "Redemption"
            const winnerValues = validItems.map(item => [
                campaign.campaign_id,
                item.pool_id,
                item.item_id,
                newSubmissionId,
                'REDEMPTION',
                1 // claimed immediately
            ]);

            await dbQueryHots(
                `INSERT INTO EVENT_t_winner (campaign_id, pool_id, item_id, submission_id, draw_strategy, claimed) VALUES ?`,
                [winnerValues]
            );

            // C. Auto-Approve Submission
            await dbQueryHots(`UPDATE EVENT_t_submission SET status = 'approved' WHERE submission_id = ?`, [newSubmissionId]);

            // Broadcast Pool Stats Update
            sseManager.broadcast('pools_changed', { slug: slug });

            return { submission_id: newSubmissionId, status: 'approved', redeemed_count: validItems.length };
        }
    }

    return { submission_id: newSubmissionId, status: 'pending' };
}

/**
 * Delete a pool
 * @param {number} poolId 
 * @returns {Promise<boolean>}
 */
async function deletePool(poolId) {
    const pool = await getPoolById(poolId);
    if (!pool) return false;

    // Fetch slug for broadcast BEFORE deleting
    const slugRes = await dbQueryHots(`SELECT slug FROM EVENT_t_campaign WHERE campaign_id = ?`, [pool.campaign_id]);
    const slug = slugRes[0]?.slug;

    await dbQueryHots(`DELETE FROM EVENT_m_pool WHERE pool_id = ?`, [poolId]);

    if (slug) {
        sseManager.broadcast('pool_deleted', {
            slug: slug,
            pool_id: poolId
        });
        // Also trigger stats refresh
        sseManager.broadcast('pools_changed', { slug: slug });
    }

    return true;
}

module.exports = {
    getCampaigns,
    getCampaignBySlug,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getSubmissionsByCampaign,
    getSubmissionStats,
    getPoolsByCampaign,
    getPoolItems,
    getPoolStats,
    addPoolItems,
    deletePool,
    importPoolItems,
    createPool,
    updatePool,
    drawWinners,
    getWinnersByCampaign,
    updateSubmissionStatus,
    getDailySubmissionStats,
    getPublicCampaign,
    publishCampaign,
    submitEntry,

    // Team Management
    getCampaignTeam,
    addTeamMember,
    removeTeamMember,
    searchUsers,
    searchUsers,
    getSubmissionsForExport,
    getAuditLogs,

    // Coupon Check (Public)
    checkCoupon,
};

// ============================================================================
// COUPON CHECK (appended after exports to avoid reference issues)
// ============================================================================

/**
 * Check if a coupon code is valid for a specific pool in a campaign.
 *
 * @param {string} slug        Campaign slug
 * @param {number|null} poolId Pool ID to check. If null, checks ALL pools of the campaign.
 * @param {string} rawCode     The coupon code string (either raw or encrypted)
 * @param {boolean} isEncrypted Whether rawCode is an encrypted payload
 * @returns {{ status: 'AVAILABLE'|'ALREADY_USED'|'INVALID', message: string, item: Object|null }}
 */
async function checkCoupon(slug, poolId, rawCode, isEncrypted = false) {
    let code = rawCode;
    if (isEncrypted) {
        code = decryptUrlSafe(rawCode);
        if (!code) {
            return { status: 'INVALID', message: 'Invalid or corrupted coupon code payload.' };
        }
    }

    // 1. Resolve campaign_id from slug
    const [campaign] = await dbQueryHots(
        `SELECT campaign_id FROM EVENT_t_campaign WHERE slug = ? LIMIT 1`,
        [slug]
    );
    if (!campaign) {
        return { status: 'INVALID', message: 'Campaign not found.' };
    }
    const campaignId = campaign.campaign_id;

    // 2. Build pool filter
    //    If poolId is provided, verify it belongs to this campaign.
    //    If no poolId, check across all pools of this campaign.
    let poolFilter = '';
    const params = [campaignId, code];

    if (poolId) {
        // Validate pool belongs to campaign
        const [pool] = await dbQueryHots(
            `SELECT pool_id FROM EVENT_m_pool WHERE pool_id = ? AND campaign_id = ? LIMIT 1`,
            [poolId, campaignId]
        );
        if (!pool) {
            return { status: 'INVALID', message: 'Invalid pool configuration.' };
        }
        poolFilter = `AND pi.pool_id = ?`;
        params.push(poolId);
    }

    // 3. Look up the code in EVENT_m_pool_item
    const sql = `
        SELECT pi.item_id, pi.pool_id, pi.value, pi.is_used, pi.used_by_submission_id, pi.used_at
        FROM EVENT_m_pool_item pi
        INNER JOIN EVENT_m_pool p ON p.pool_id = pi.pool_id
        WHERE p.campaign_id = ?
          AND pi.value = ?
          ${poolFilter}
        LIMIT 1
    `;

    const [item] = await dbQueryHots(sql, params);

    if (!item) {
        return { status: 'INVALID', message: 'Coupon code not found.' };
    }

    if (item.is_used) {
        return { status: 'ALREADY_USED', message: 'This code has already been claimed.', item };
    }

    return { status: 'AVAILABLE', message: 'Code is valid.', item };
}

