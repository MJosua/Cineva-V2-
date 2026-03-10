/**
 * Event Engine Controller
 * 
 * Request handlers for Event Engine API endpoints.
 * Controllers only orchestrate - no SQL or business logic here.
 * 
 * All responses use standard envelope:
 * { success: boolean, data: any, error: any, meta: { timestamp, request_id } }
 */

const eventEngineService = require('../../service/eventEngineService');
const crypto = require('crypto');
const XLSX = require('xlsx');

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create standard response envelope
 */
function createResponse(success, data, error = null) {
    return {
        success,
        data,
        error,
        meta: {
            timestamp: new Date().toISOString(),
            request_id: crypto.randomUUID()
        }
    };
}

/**
 * Handle async errors in controllers
 */
const sseManager = require('../../core/sse-manager');

/**
 * Handle async errors in controllers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(err => {
            console.error('[EventEngine]', err);
            res.status(500).json(createResponse(false, null, {
                code: 'INTERNAL_ERROR',
                message: err.message
            }));
        });
    };
}

/**
 * GET /api/event-engine/stream
 * SSE Endpoint for Event Admin (Mock Auth compatible)
 */
const connectSSE = (req, res) => {
    // 1. Get User ID (Allow mock token or simple ID)
    const userId = req.query.token || 'guest-admin';

    // 2. Set Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 3. Register Connection
    sseManager.addConnection(userId, res);

    // 4. Initial Event
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ message: 'Connected to EventEngine SSE', userId })}\n\n`);

    // 5. Heartbeat
    const hb = setInterval(() => res.write(`:heartbeat\n\n`), 30000);

    // 6. Cleanup
    const cleanup = () => {
        clearInterval(hb);
        sseManager.removeConnection(userId, res);
    };
    req.on('close', cleanup);
    req.on('error', cleanup);
};

// ============================================================================
// CAMPAIGNS
// ============================================================================

/**
 * GET /campaigns
 * List all campaigns
 */
const getCampaigns = asyncHandler(async (req, res) => {
    const { status, limit, offset } = req.query;

    // Pass req.user (admin) for RBAC enforcement
    const campaigns = await eventEngineService.getCampaigns(
        { status, limit, offset },
        req.user // Injected by auth middleware
    );

    res.json(createResponse(true, {
        campaigns,
        total: campaigns.length
    }));
});

/**
 * GET /campaigns/:slug/submissions/export
 * Export submissions to CSV
 */
const exportSubmissions = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await eventEngineService.getSubmissionsForExport(slug);

    if (data.length === 0) {
        return res.status(404).json(createResponse(false, null, { message: "No submissions to export" }));
    }

    // Convert to CSV using XLSX
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=submissions_${slug}_${new Date().getTime()}.csv`);
    res.send(csv);
});

/**
 * GET /campaigns/:slug/winners/export
 * Export winners to CSV
 */
const exportWinners = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await eventEngineService.getWinnersForExport(slug);

    if (data.length === 0) {
        return res.status(404).json(createResponse(false, null, { message: "No winners to export" }));
    }

    // Convert to CSV using XLSX
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=winners_${slug}_${new Date().getTime()}.csv`);
    res.send(csv);
});

/**
 * GET /campaigns/:slug
 * Get single campaign by slug
 */
const getCampaignBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const campaign = await eventEngineService.getCampaignBySlug(slug);

    if (!campaign) {
        return res.status(404).json(createResponse(false, null, {
            code: 'NOT_FOUND',
            message: `Campaign not found: ${slug}`
        }));
    }

    res.json(createResponse(true, campaign));
});

/**
 * POST /campaigns
 * Create a new campaign
 */
const createCampaign = asyncHandler(async (req, res) => {
    const { name, slug, description, startDate, endDate, blocks, theme } = req.body;

    // Validation
    if (!name || !slug) {
        return res.status(400).json(createResponse(false, null, {
            code: 'VALIDATION_ERROR',
            message: 'Name and slug are required'
        }));
    }

    // Check if slug exists
    const existing = await eventEngineService.getCampaignBySlug(slug);
    if (existing) {
        return res.status(409).json(createResponse(false, null, {
            code: 'DUPLICATE_SLUG',
            message: 'Campaign slug already exists'
        }));
    }

    // Construct payload
    const campaignData = {
        ticket_id: `EVT-${Date.now()}`, // Simple ID generation
        slug,
        name,
        description,
        status: 'draft',
        theme_config: theme,
        block_schema: blocks,
        created_by: req.user?.id || 0 // Assuming Auth middleware populates req.user
    };

    const newCampaign = await eventEngineService.createCampaign(campaignData);

    res.status(201).json(createResponse(true, newCampaign));
});

/**
 * PUT /campaigns/:slug
 * Update an existing campaign
 */
const updateCampaign = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { name, description, status, theme, blocks, settings } = req.body;

    console.log(`[EventEngine] Updating campaign: ${slug}`);
    if (blocks) console.log(`[EventEngine] Blocks payload length: ${JSON.stringify(blocks).length}`);

    const existing = await eventEngineService.getCampaignBySlug(slug);
    if (!existing) {
        return res.status(404).json(createResponse(false, null, {
            code: 'NOT_FOUND',
            message: 'Campaign not found'
        }));
    }

    const updates = {
        name,
        description,
        status,
        theme,
        blocks,
        blocks,
        settings,
        updatedBy: req.user?.id || 0
    };

    const updatedCampaign = await eventEngineService.updateCampaign(slug, updates);

    res.json(createResponse(true, updatedCampaign));
});

/**
 * DELETE /campaigns/:slug
 * Delete a campaign
 */
const deleteCampaign = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const result = await eventEngineService.deleteCampaign(slug);

    if (!result) {
        return res.status(404).json(createResponse(false, null, {
            code: 'NOT_FOUND',
            message: 'Campaign not found'
        }));
    }

    res.json(createResponse(true, { deleted: true }));
});

// ============================================================================
// SUBMISSIONS
// ============================================================================

/**
 * GET /campaigns/:slug/submissions
 * List submissions for a campaign
 */
const getSubmissionsByCampaign = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { status, search, limit, offset } = req.query;

    const result = await eventEngineService.getSubmissionsByCampaign(slug, {
        status,
        search,
        limit,
        offset
    });

    res.json(createResponse(true, result));
});

/**
 * GET /campaigns/:slug/submissions/stats
 * Get submission statistics for a campaign
 */
const getSubmissionStats = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const stats = await eventEngineService.getSubmissionStats(slug);

    res.json(createResponse(true, stats));
});

/**
 * PATCH /submissions/:id
 * Update submission status (Approve/Reject)
 */
const updateSubmissionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const userId = req.user?.id || 0; // Assuming auth middleware

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json(createResponse(false, null, {
            code: 'INVALID_STATUS',
            message: 'Status must be approved or rejected'
        }));
    }

    if (status === 'rejected' && !rejection_reason) {
        return res.status(400).json(createResponse(false, null, {
            code: 'MISSING_REASON',
            message: 'Rejection reason is required'
        }));
    }

    try {
        const result = await eventEngineService.updateSubmissionStatus(id, status, rejection_reason, userId);
        res.json(createResponse(true, result));
    } catch (e) {
        if (e.message === 'Submission not found') {
            return res.status(404).json(createResponse(false, null, {
                code: 'NOT_FOUND',
                message: 'Submission not found'
            }));
        }
        throw e;
    }
});

// ============================================================================
// REWARD POOLS
// ============================================================================

/**
 * GET /campaigns/:slug/pools
 * List pools for a campaign
 */
const getPoolsByCampaign = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const pools = await eventEngineService.getPoolsByCampaign(slug);

    res.json(createResponse(true, { pools }));
});

/**
 * GET /pools/:id/items
 * Get items in a pool
 */
const getPoolItems = asyncHandler(async (req, res) => {
    const poolId = parseInt(req.params.id);
    const { is_used, limit } = req.query;

    const result = await eventEngineService.getPoolItems(poolId, {
        is_used: is_used !== undefined ? parseInt(is_used) : undefined,
        limit
    });

    res.json(createResponse(true, result));
});

/**
 * GET /pools/:id/stats
 * Get pool statistics
 */
const getPoolStats = asyncHandler(async (req, res) => {
    const poolId = parseInt(req.params.id);

    const stats = await eventEngineService.getPoolStats(poolId);

    if (!stats) {
        return res.status(404).json(createResponse(false, null, {
            code: 'NOT_FOUND',
            message: `Pool not found: ${poolId}`
        }));
    }

    res.json(createResponse(true, stats));
});

/**
 * POST /campaigns/:slug/pools
 * Create a new pool
 */
const createPool = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { name, description, type, config, status } = req.body;

    if (!name || !type) {
        return res.status(400).json(createResponse(false, null, {
            code: 'MISSING_FIELDS',
            message: 'Name and Type are required'
        }));
    }

    const pool = await eventEngineService.createPool(slug, {
        name, description, type, config, status
    });

    res.json(createResponse(true, pool));
});

/**
 * PUT /pools/:id
 * Update a pool
 */
const updatePool = asyncHandler(async (req, res) => {
    const poolId = parseInt(req.params.id);
    const updates = req.body;

    try {
        const pool = await eventEngineService.updatePool(poolId, updates);
        res.json(createResponse(true, pool));
    } catch (e) {
        if (e.message === 'Pool not found') {
            return res.status(404).json(createResponse(false, null, {
                code: 'NOT_FOUND',
                message: 'Pool not found'
            }));
        }
        throw e;
    }
});

/**
 * POST /pools/:id/items
 * Add items to a pool
 */
const addPoolItems = asyncHandler(async (req, res) => {
    const poolId = parseInt(req.params.id);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json(createResponse(false, null, {
            code: 'INVALID_ITEMS',
            message: 'Items must be a non-empty array'
        }));
    }

    const result = await eventEngineService.addPoolItems(poolId, items);
    res.json(createResponse(true, result));
});

/**
 * DELETE /pools/:id
 * Delete a pool
 */
const deletePool = asyncHandler(async (req, res) => {
    const poolId = parseInt(req.params.id);

    const result = await eventEngineService.deletePool(poolId);

    if (!result) {
        return res.status(404).json(createResponse(false, null, {
            code: 'NOT_FOUND',
            message: 'Pool not found'
        }));
    }

    res.json(createResponse(true, { deleted: true }));
});

/**
 * POST /pools/:id/items/import
 * Import items from CSV
 */
const importPoolItems = asyncHandler(async (req, res) => {
    const poolId = parseInt(req.params.id);
    const content = req.body; // Handled by text/plain parser

    // Validation
    if (!content || typeof content !== 'string') {
        return res.status(400).json(createResponse(false, null, {
            code: 'INVALID_CONTENT',
            message: 'Body must be CSV string (Content-Type: text/csv or text/plain)'
        }));
    }

    try {
        const result = await eventEngineService.importPoolItems(poolId, content);
        res.json(createResponse(true, result));
    } catch (e) {
        return res.status(400).json(createResponse(false, null, {
            code: 'IMPORT_FAILED',
            message: e.message
        }));
    }
});

/**
 * POST /pools/:id/draw
 * Draw winners from a pool
 */
const drawWinners = asyncHandler(async (req, res) => {
    const poolId = parseInt(req.params.id);
    const { count = 1, strategy = 'RANDOM' } = req.body;
    const userId = req.user?.id || 0; // Assuming auth middleware

    if (isNaN(poolId)) {
        return res.status(400).json(createResponse(false, null, {
            code: 'INVALID_ID',
            message: 'Invalid pool ID'
        }));
    }

    if (count < 1) {
        return res.status(400).json(createResponse(false, null, {
            code: 'INVALID_COUNT',
            message: 'Count must be at least 1'
        }));
    }

    const validStrategies = ['RANDOM', 'FIRST_N'];
    if (!validStrategies.includes(strategy)) {
        return res.status(400).json(createResponse(false, null, {
            code: 'INVALID_STRATEGY',
            message: `Strategy must be one of: ${validStrategies.join(', ')}`
        }));
    }

    const result = await eventEngineService.drawWinners(poolId, count, strategy, userId);

    if (!result.success) {
        return res.status(400).json(createResponse(false, null, {
            code: 'DRAW_FAILED',
            message: result.error
        }));
    }

    res.json(createResponse(true, {
        campaign_id: result.campaign_id,
        winners: result.items,
        drawn_count: result.drawn_count,
        metadata: {
            strategy,
            drawn_at: new Date().toISOString()
        }
    }));
});

/**
 * GET /campaigns/:slug/submissions/daily
 * Get daily submission stats
 */
const getDailySubmissionStats = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { days } = req.query;

    const stats = await eventEngineService.getDailySubmissionStats(slug, days ? parseInt(days) : 30);
    res.json(createResponse(true, stats));
});

/**
 * GET /campaigns/:slug/winners
 * Get list of winners
 */
const getWinnersByCampaign = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const winners = await eventEngineService.getWinnersByCampaign(slug);
    res.json(createResponse(true, winners));
});

// ============================================================================
// NEW METHODS (Phase 4)
// ============================================================================

const submitEntry = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { participant_name, participant_contact, receipt_codes, is_encrypted, ...otherFields } = req.body;

    const submission = await eventEngineService.submitEntry(slug, {
        participant_name,
        participant_contact,
        receipt_codes,
        extra_data: otherFields,
        is_encrypted: is_encrypted === true
    });

    res.json(createResponse(true, submission));
});

const getPublicCampaign = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const campaign = await eventEngineService.getPublicCampaign(slug);

    if (!campaign) {
        return res.status(404).json(createResponse(false, null, {
            code: 'NOT_FOUND',
            message: 'Campaign not found or not active'
        }));
    }

    res.json(createResponse(true, campaign));
});

const setPublishStatus = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { publish } = req.body; // true = publish, false = unpublish

    // Verify Is SuperAdmin or Permitted
    const userId = req.user?.id || 0;
    const campaign = await eventEngineService.publishCampaign(slug, publish, userId);
    res.json(createResponse(true, campaign));
});

const getCampaignMedia = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const media = await eventEngineService.getCampaignMedia(slug);
    res.json(createResponse(true, media));
});

const uploadCampaignMedia = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const files = req.files || [];
    const userId = req.user?.id || 0;

    if (files.length === 0) {
        return res.status(400).json(createResponse(false, null, { message: "No files uploaded" }));
    }

    const media = await eventEngineService.uploadCampaignMedia(slug, files, userId);
    res.json(createResponse(true, media));
});

const getAuditLogs = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { limit, offset } = req.query;

    // Verify permissions? (Assuming private router handles auth)

    const logs = await eventEngineService.getAuditLogs(slug, { limit, offset });

    res.json(createResponse(true, logs));
});

/**
 * GET /public/campaigns/:slug/check-coupon/:code?pool=<poolId>
 * Public endpoint to validate a coupon code.
 * poolId is optional query param — if omitted, checks all pools of the campaign.
 */
const checkCoupon = asyncHandler(async (req, res) => {
    const { slug, code } = req.params;
    const poolId = req.query.pool ? parseInt(req.query.pool) : null;

    if (!code || code.trim() === '') {
        return res.status(400).json(createResponse(false, null, {
            code: 'MISSING_CODE',
            message: 'Coupon code is required.'
        }));
    }

    const isEncrypted = req.query.encrypted === 'true';

    const result = await eventEngineService.checkCoupon(slug, poolId, code.trim(), isEncrypted);

    // Map status to HTTP code: 404 for INVALID, 200 for others
    if (result.status === 'INVALID') {
        return res.status(404).json(createResponse(false, null, {
            code: 'INVALID',
            message: result.message
        }));
    }

    res.json(createResponse(true, result));
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {

    // Campaign
    getCampaigns,
    getCampaignBySlug,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getPublicCampaign,
    setPublishStatus,
    getCampaignMedia,
    uploadCampaignMedia,
    getAuditLogs,

    // Submissions
    submitEntry,
    getSubmissions: getSubmissionsByCampaign,
    updateSubmissionStatus,
    getSubmissionStats,
    getDailySubmissionStats,

    // Pools & Items
    getPools: getPoolsByCampaign,
    getPoolItems,
    getPoolStats,
    createPool,
    updatePool,
    deletePool,
    addPoolItems,
    importPoolItems,

    // SSE
    connectSSE,

    // Winner Generator
    drawWinners,
    getWinnersByCampaign,
    exportSubmissions,
    exportWinners,

    // Team Management
    searchUsers: asyncHandler(async (req, res) => {
        const { q } = req.query;
        const users = await eventEngineService.searchUsers(q);
        res.json(createResponse(true, users));
    }),

    getCampaignTeam: asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const team = await eventEngineService.getCampaignTeam(slug);
        res.json(createResponse(true, team));
    }),

    addTeamMember: asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const { user_id, role } = req.body;

        if (!user_id) return res.status(400).json(createResponse(false, null, { message: "User ID required" }));

        const team = await eventEngineService.addTeamMember(slug, user_id, role);
        res.json(createResponse(true, team));
    }),

    removeTeamMember: asyncHandler(async (req, res) => {
        const { slug, userId } = req.params;
        await eventEngineService.removeTeamMember(slug, userId);
        res.json(createResponse(true, { deleted: true }));
    }),

    // Coupon Check
    checkCoupon,
};
