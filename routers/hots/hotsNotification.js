/**
 * hotsNotification.js - Router
 * 
 * Handles notification API endpoints for the HOTS system.
 * All routes are protected and require authentication.
 */

const express = require("express");
const router = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const notificationController = require("../../controller/hots_controller/notification/notificationController");

/**
 * GET /hots_notifications
 * Fetch all notifications for the authenticated user.
 * Query params: limit (default 50), offset (default 0)
 */
router.get("/", decodeTokenHT, notificationController.getNotifications);

/**
 * GET /hots_notifications/unread_count
 * Get the unread notification count for the badge.
 */
router.get("/unread_count", decodeTokenHT, notificationController.getUnreadCount);

/**
 * POST /hots_notifications/read/:id
 * Mark a single notification as read.
 */
router.post("/read/:id", decodeTokenHT, notificationController.markAsRead);

/**
 * POST /hots_notifications/read_all
 * Mark all notifications as read for the user.
 */
router.post("/read_all", decodeTokenHT, notificationController.markAllRead);

module.exports = router;
