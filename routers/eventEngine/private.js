/**
 * Event Engine Routes - PRIVATE (ADMIN)
 * 
 * Base path: /api/event-engine/admin
 * 
 * Security:
 * - Strict Authentication (HOTS/IOD Token)
 * - Role-based Access Control
 */

const express = require('express');
const router = express.Router();
const eventEngineController = require('../../controller/event/eventEngineController');

/**
 * GET /stream
 * SSE Connection Endpoint
 */
router.get('/stream', eventEngineController.connectSSE);

// ============================================================================
// CAMPAIGNS
// ============================================================================

/**
 * GET /campaigns
 * List all campaigns
 */
router.get('/campaigns', eventEngineController.getCampaigns);

/**
 * POST /campaigns
 * Create a new campaign
 */
router.post('/campaigns', eventEngineController.createCampaign);

/**
 * GET /campaigns/:slug
 * Get single campaign by slug
 */
router.get('/campaigns/:slug', eventEngineController.getCampaignBySlug);

/**
 * PUT /campaigns/:slug
 * Update a campaign
 */
router.put('/campaigns/:slug', eventEngineController.updateCampaign);

/**
 * DELETE /campaigns/:slug
 * Delete a campaign
 */
router.delete('/campaigns/:slug', eventEngineController.deleteCampaign);

/**
 * POST /campaigns/:slug/publish
 * Publish or Unpublish a campaign
 */
router.post('/campaigns/:slug/publish', eventEngineController.setPublishStatus);

/**
 * GET /campaigns/:slug/logs
 * Get audit logs for a campaign
 */
router.get('/campaigns/:slug/logs', eventEngineController.getAuditLogs);

const { hotsTempUploader } = require('../../config/uploader');
router.get('/campaigns/:slug/media', eventEngineController.getCampaignMedia);
router.post('/campaigns/:slug/media/upload', hotsTempUploader().array('files'), eventEngineController.uploadCampaignMedia);
router.delete('/campaigns/:slug/media/:mediaId', eventEngineController.deleteCampaignMedia);

// ============================================================================
// SUBMISSIONS
// ============================================================================

/**
 * GET /campaigns/:slug/submissions
 * List submissions for a campaign
 */
router.get('/campaigns/:slug/submissions', eventEngineController.getSubmissions);

/**
 * GET /campaigns/:slug/submissions/stats
 * Get submission statistics for a campaign
 */
router.get('/campaigns/:slug/submissions/stats', eventEngineController.getSubmissionStats);
router.get('/campaigns/:slug/submissions/export', eventEngineController.exportSubmissions);

/**
 * POST /submissions/:id
 * Update submission status (Approve/Reject) (Note: Was PATCH in old router comments, but code is likely updated or will be)
 * The old router had logic for this or planned it.
 * Implementation Plan lists "PATCH /submissions/:id" as Future.
 * But user requirements said "Approve/Reject Submissions" is allowed operation.
 * I will blindly copy mapped routes from original file.
 * Original file had: `route.patch('/submissions/:id', eventEngineController.updateSubmissionStatus);`
 */
router.patch('/submissions/:id', eventEngineController.updateSubmissionStatus);

/**
 * GET /campaigns/:slug/submissions/daily
 * Get daily submission stats
 */
router.get('/campaigns/:slug/submissions/daily', eventEngineController.getDailySubmissionStats);


// ============================================================================
// REWARD POOLS
// ============================================================================

/**
 * GET /campaigns/:slug/pools
 * List pools for a campaign
 */
router.get('/campaigns/:slug/pools', eventEngineController.getPools);

/**
 * GET /pools/:id/items
 * Get items in a pool
 */
router.get('/pools/:id/items', eventEngineController.getPoolItems);

/**
 * GET /pools/:id/stats
 * Get pool statistics
 */
router.get('/pools/:id/stats', eventEngineController.getPoolStats);

/**
 * POST /campaigns/:slug/pools
 * Create a new pool
 */
router.post('/campaigns/:slug/pools', eventEngineController.createPool);

/**
 * PUT /pools/:id
 * Update a pool
 */
router.put('/pools/:id', eventEngineController.updatePool);

/**
 * DELETE /pools/:id
 * Delete a pool
 */
router.delete('/pools/:id', eventEngineController.deletePool);

/**
 * POST /pools/:id/items
 * Add items to a pool
 */
router.post('/pools/:id/items', eventEngineController.addPoolItems);

/**
 * POST /pools/:id/items/import
 * Import items from CSV
 */
router.post('/pools/:id/items/import', express.text({ type: ['text/csv', 'text/plain'], limit: '25mb' }), eventEngineController.importPoolItems);

// ============================================================================
// DRAWING / WINNERS (Future/Phase 3 but included in original router)
// ============================================================================

/**
 * POST /pools/:id/draw
 * Execute prize draw
 */
router.post('/pools/:id/draw', eventEngineController.drawWinners);

/**
 * GET /campaigns/:slug/winners
 * Get list of winners
 */
router.get('/campaigns/:slug/winners', eventEngineController.getWinnersByCampaign);
router.get('/campaigns/:slug/winners/export', eventEngineController.exportWinners);

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

router.get('/users/search', eventEngineController.searchUsers);
router.get('/campaigns/:slug/team', eventEngineController.getCampaignTeam);
router.post('/campaigns/:slug/team', eventEngineController.addTeamMember);
router.delete('/campaigns/:slug/team/:userId', eventEngineController.removeTeamMember);

module.exports = router;
