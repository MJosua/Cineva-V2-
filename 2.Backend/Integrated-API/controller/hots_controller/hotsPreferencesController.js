// controller/hots_controller/hotsPreferencesController.js
// User Preferences API - handles all user-specific settings

const { dbHots } = require("../../config/db");

const yellowTerminal = '\x1b[33m';

const hotsPreferencesController = {
    /**
     * GET /hotsprefs/all
     * Get all preferences for current user
     */
    getAllPreferences: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;

            const [rows] = await dbHots.promise().query(`
                SELECT pref_category, pref_key, pref_value
                FROM user_preferences
                WHERE user_id = ?
            `, [user_id]);

            // Group by category
            const preferences = {};
            rows.forEach(row => {
                if (!preferences[row.pref_category]) {
                    preferences[row.pref_category] = {};
                }
                // Parse JSON value
                try {
                    preferences[row.pref_category][row.pref_key] = JSON.parse(row.pref_value);
                } catch {
                    preferences[row.pref_category][row.pref_key] = row.pref_value;
                }
            });

            res.json({ success: true, preferences });
        } catch (err) {
            console.error("Error fetching preferences:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /hotsprefs/:category
     * Get preferences for a specific category
     */
    getCategoryPreferences: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const { category } = req.params;

            const [rows] = await dbHots.promise().query(`
                SELECT pref_key, pref_value
                FROM user_preferences
                WHERE user_id = ? AND pref_category = ?
            `, [user_id, category]);

            const preferences = {};
            rows.forEach(row => {
                try {
                    preferences[row.pref_key] = JSON.parse(row.pref_value);
                } catch {
                    preferences[row.pref_key] = row.pref_value;
                }
            });

            res.json({ success: true, category, preferences });
        } catch (err) {
            console.error("Error fetching category preferences:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /hotsprefs/:category/:key
     * Get a single preference value
     */
    getPreference: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const { category, key } = req.params;

            const [rows] = await dbHots.promise().query(`
                SELECT pref_value
                FROM user_preferences
                WHERE user_id = ? AND pref_category = ? AND pref_key = ?
            `, [user_id, category, key]);

            if (rows.length === 0) {
                return res.json({ success: true, value: null });
            }

            let value;
            try {
                value = JSON.parse(rows[0].pref_value);
            } catch {
                value = rows[0].pref_value;
            }

            res.json({ success: true, value });
        } catch (err) {
            console.error("Error fetching preference:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * POST /hotsprefs/:category/:key
     * Set a preference value (upsert)
     */
    setPreference: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const { category, key } = req.params;
            const { value } = req.body;

            // Convert value to JSON string
            const jsonValue = JSON.stringify(value);

            await dbHots.promise().query(`
                INSERT INTO user_preferences (user_id, pref_category, pref_key, pref_value)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    pref_value = VALUES(pref_value),
                    updated_at = NOW()
            `, [user_id, category, key, jsonValue]);

            console.log(`✅ Preference saved: ${category}/${key} for user ${user_id}`);

            res.json({ success: true, message: "Preference saved" });
        } catch (err) {
            console.error("Error saving preference:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * POST /hotsprefs/bulk
     * Set multiple preferences at once
     */
    setBulkPreferences: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const { preferences } = req.body;

            // preferences = { category: { key: value, key2: value2 }, ... }
            if (!preferences || typeof preferences !== 'object') {
                return res.status(400).json({ success: false, message: "Invalid preferences format" });
            }

            const values = [];
            for (const [category, prefs] of Object.entries(preferences)) {
                for (const [key, value] of Object.entries(prefs)) {
                    values.push([user_id, category, key, JSON.stringify(value)]);
                }
            }

            if (values.length === 0) {
                return res.json({ success: true, message: "No preferences to save" });
            }

            // Batch upsert
            await dbHots.promise().query(`
                INSERT INTO user_preferences (user_id, pref_category, pref_key, pref_value)
                VALUES ?
                ON DUPLICATE KEY UPDATE 
                    pref_value = VALUES(pref_value),
                    updated_at = NOW()
            `, [values]);

            console.log(`✅ Bulk preferences saved: ${values.length} items for user ${user_id}`);

            res.json({ success: true, message: `${values.length} preferences saved` });
        } catch (err) {
            console.error("Error saving bulk preferences:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * DELETE /hotsprefs/:category/:key
     * Delete a preference
     */
    deletePreference: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const { category, key } = req.params;

            await dbHots.promise().query(`
                DELETE FROM user_preferences
                WHERE user_id = ? AND pref_category = ? AND pref_key = ?
            `, [user_id, category, key]);

            res.json({ success: true, message: "Preference deleted" });
        } catch (err) {
            console.error("Error deleting preference:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ============ CONVENIENCE METHODS ============

    /**
     * GET /hotsprefs/dashboard/pinned
     * Get pinned dashboard IDs for current user
     */
    getPinnedDashboards: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;

            const [rows] = await dbHots.promise().query(`
                SELECT pref_value
                FROM user_preferences
                WHERE user_id = ? AND pref_category = 'dashboard' AND pref_key = 'pinned_ids'
            `, [user_id]);

            let pinned = [];
            if (rows.length > 0) {
                let rawValue = rows[0].pref_value;
                if (Array.isArray(rawValue)) {
                    pinned = rawValue;
                } else if (typeof rawValue === 'string') {
                    try {
                        pinned = JSON.parse(rawValue);
                        if (!Array.isArray(pinned)) pinned = [];
                    } catch { pinned = []; }
                } else if (rawValue && typeof rawValue === 'object') {
                    pinned = Object.values(rawValue);
                }
            }
            pinned = pinned.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

            res.json({ success: true, pinned });
        } catch (err) {
            console.error("Error fetching pinned dashboards:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * POST /hotsprefs/dashboard/pin/:id
     * Toggle pin status for a dashboard
     */
    togglePinDashboard: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const dashboard_id = parseInt(req.params.id, 10);

            // Get current pinned list
            const [rows] = await dbHots.promise().query(`
                SELECT pref_value
                FROM user_preferences
                WHERE user_id = ? AND pref_category = 'dashboard' AND pref_key = 'pinned_ids'
            `, [user_id]);

            let pinned = [];
            if (rows.length > 0) {
                let rawValue = rows[0].pref_value;
                // Handle if it's already an array (MySQL JSON column)
                if (Array.isArray(rawValue)) {
                    pinned = rawValue;
                } else if (typeof rawValue === 'string') {
                    // Parse string JSON
                    try {
                        pinned = JSON.parse(rawValue);
                        if (!Array.isArray(pinned)) pinned = [];
                    } catch { pinned = []; }
                } else if (rawValue && typeof rawValue === 'object') {
                    // Could be an object with numeric keys
                    pinned = Object.values(rawValue);
                }
            }

            // Ensure all values are numbers
            pinned = pinned.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

            // Toggle
            const index = pinned.indexOf(dashboard_id);
            let isPinned;
            if (index > -1) {
                pinned.splice(index, 1);
                isPinned = false;
            } else {
                pinned.push(dashboard_id);
                isPinned = true;
            }

            // Save
            await dbHots.promise().query(`
                INSERT INTO user_preferences (user_id, pref_category, pref_key, pref_value)
                VALUES (?, 'dashboard', 'pinned_ids', ?)
                ON DUPLICATE KEY UPDATE 
                    pref_value = VALUES(pref_value),
                    updated_at = NOW()
            `, [user_id, JSON.stringify(pinned)]);

            console.log(`📌 Dashboard ${dashboard_id} ${isPinned ? 'pinned' : 'unpinned'} by user ${user_id}`);

            res.json({ success: true, isPinned, pinned });
        } catch (err) {
            console.error("Error toggling pin:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /hotsprefs/dashboard/preview/:id
     * Get card preview settings for a dashboard
     */
    getCardPreview: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const dashboard_id = req.params.id;

            const [rows] = await dbHots.promise().query(`
                SELECT pref_value
                FROM user_preferences
                WHERE user_id = ? AND pref_category = 'dashboard' AND pref_key = ?
            `, [user_id, `card_preview_${dashboard_id}`]);

            let settings = null;
            if (rows.length > 0) {
                try {
                    settings = JSON.parse(rows[0].pref_value);
                } catch { }
            }

            res.json({ success: true, settings });
        } catch (err) {
            console.error("Error fetching card preview:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * POST /hotsprefs/dashboard/preview/:id
     * Save card preview settings for a dashboard
     */
    saveCardPreview: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const dashboard_id = req.params.id;
            const { settings } = req.body;

            await dbHots.promise().query(`
                INSERT INTO user_preferences (user_id, pref_category, pref_key, pref_value)
                VALUES (?, 'dashboard', ?, ?)
                ON DUPLICATE KEY UPDATE 
                    pref_value = VALUES(pref_value),
                    updated_at = NOW()
            `, [user_id, `card_preview_${dashboard_id}`, JSON.stringify(settings)]);

            console.log(`⚙️ Card preview saved for dashboard ${dashboard_id} by user ${user_id}`);

            res.json({ success: true, message: "Card preview settings saved" });
        } catch (err) {
            console.error("Error saving card preview:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = hotsPreferencesController;
