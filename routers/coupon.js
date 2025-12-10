/**
 * Coupon Router - Route definitions for coupon API
 */

const express = require('express');
const route = express.Router();
const couponController = require('../controller/couponController');

// ========================================
// PUBLIC ROUTES (no auth required)
// ========================================

// Validate coupon hash and get form schema
route.get('/coupon/:hash', couponController.checkCoupon);

// Redeem coupon with form submission
route.post('/coupon/:hash/redeem', couponController.redeemCoupon);

// ========================================
// ADMIN ROUTES (should add auth middleware)
// ========================================

// Generate coupon batch
route.post('/admin/event/:event_id/coupons/generate', couponController.generateBatch);

// List batches/coupons for event
route.get('/admin/event/:event_id/coupons', couponController.listCoupons);

// Export batch coupons as CSV (URLs + Codes)
route.get('/admin/event/:event_id/coupons/export_batch', couponController.exportBatch);

// Export submissions
route.get('/admin/event/:event_id/submissions/export', couponController.exportSubmissions);

module.exports = route;
