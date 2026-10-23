// routers/hots/hotsPreferences.js
// User Preferences API Routes

const express = require("express");
const route = express.Router();

const { decodeTokenHT } = require('../../config/encrypts');
const hotsPreferencesController = require("../../controller/hots_controller/hotsPreferencesController");

// ============ SPECIFIC ROUTES (must come BEFORE generic ones) ============

// Bulk save
route.post("/bulk", decodeTokenHT, hotsPreferencesController.setBulkPreferences);

// Get all preferences
route.get("/all", decodeTokenHT, hotsPreferencesController.getAllPreferences);

// Dashboard convenience routes (specific paths)
route.get("/dashboard/pinned", decodeTokenHT, hotsPreferencesController.getPinnedDashboards);
route.post("/dashboard/pin/:id", decodeTokenHT, hotsPreferencesController.togglePinDashboard);
route.get("/dashboard/preview/:id", decodeTokenHT, hotsPreferencesController.getCardPreview);
route.post("/dashboard/preview/:id", decodeTokenHT, hotsPreferencesController.saveCardPreview);

// ============ GENERIC ROUTES (must come AFTER specific ones) ============

// Get/Set by category
route.get("/:category", decodeTokenHT, hotsPreferencesController.getCategoryPreferences);

// Get/Set by category and key
route.get("/:category/:key", decodeTokenHT, hotsPreferencesController.getPreference);
route.post("/:category/:key", decodeTokenHT, hotsPreferencesController.setPreference);
route.delete("/:category/:key", decodeTokenHT, hotsPreferencesController.deletePreference);

module.exports = route;
