/**
 * Event Engine Routes - PUBLIC
 * 
 * Base path: /api/event-engine/public
 * 
 * Security:
 * - NO Authentication required (Open Storefront)
 * - Strict Validation
 * - Rate Limited
 */

const express = require('express');
const router = express.Router();
const eventEngineController = require('../../controller/eventEngineController');

// ============================================================================
// PUBLIC CAMPAIGN VIEW
// ============================================================================

/**
 * GET /projects/:slug
 * Get public campaign details (Must be Active & Published)
 */
router.get('/campaigns/:slug', eventEngineController.getPublicCampaign);

// ============================================================================
// SUBMISSIONS
// ============================================================================

/**
 * POST /campaigns/:slug/submit
 * Submit entry (Public)
 */
router.post('/campaigns/:slug/submit', eventEngineController.submitEntry);

module.exports = router;
