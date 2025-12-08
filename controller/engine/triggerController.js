// controller/engine/triggerController.js
const { dbQueryHots } = require("../../config/db");

const DEBUG = true;

function logDebug(label, data) {
    if (!DEBUG) return;
    console.log(`%c[TRIGGER-CTRL] ${label}`, "color:#ff9800;font-weight:bold", data);
}

function logError(label, err) {
    console.error(`%c[TRIGGER-CTRL ERROR] ${label}`, "color:#e91e63;font-weight:bold", err.message || err);
}

module.exports = {
    /**
     * GET /triggers/:service_id
     * List all triggers for a service
     */
    async list(req, res) {
        const { service_id } = req.params;

        try {
            logDebug("LIST → service_id", service_id);

            const rows = await dbQueryHots(
                `SELECT * FROM m_service_triggers WHERE service_id = ? ORDER BY trigger_id ASC`,
                [service_id]
            );

            // Parse trigger_config JSON
            const triggers = rows.map(r => {
                let triggerConfig = r.trigger_config;
                if (typeof triggerConfig === 'string') {
                    try { triggerConfig = JSON.parse(triggerConfig); } catch (e) { triggerConfig = { actions: [] }; }
                }
                return {
                    ...r,
                    trigger_config: triggerConfig || { actions: [] },
                };
            });

            logDebug("LIST → Found", triggers.length);

            return res.json({ ok: true, triggers });

        } catch (err) {
            logError("LIST", err);
            return res.status(500).json({ ok: false, error: "Failed to load triggers" });
        }
    },

    /**
     * POST /triggers/:service_id
     * Save all triggers for a service (replace all)
     */
    async saveAll(req, res) {
        const { service_id } = req.params;
        const { triggers } = req.body;

        try {
            logDebug("SAVE ALL → service_id", service_id);
            logDebug("SAVE ALL → triggers", triggers?.length);

            if (!Array.isArray(triggers)) {
                return res.status(400).json({ ok: false, error: "triggers must be an array" });
            }

            // Delete existing triggers for this service
            await dbQueryHots(`DELETE FROM m_service_triggers WHERE service_id = ?`, [service_id]);

            // Insert new triggers
            for (const t of triggers) {
                const configJson = typeof t.trigger_config === 'string'
                    ? t.trigger_config
                    : JSON.stringify(t.trigger_config);

                await dbQueryHots(
                    `INSERT INTO m_service_triggers (service_id, trigger_name, trigger_type, trigger_config, active) 
           VALUES (?, ?, ?, ?, ?)`,
                    [
                        service_id,
                        t.trigger_name,
                        t.trigger_type || 'custom',
                        configJson,
                        t.active !== false ? 1 : 0,
                    ]
                );
            }

            logDebug("SAVE ALL → Inserted", triggers.length);

            return res.json({ ok: true, count: triggers.length });

        } catch (err) {
            logError("SAVE ALL", err);
            return res.status(500).json({ ok: false, error: "Failed to save triggers" });
        }
    },

    /**
     * POST /triggers/:service_id/add
     * Add a single trigger
     */
    async add(req, res) {
        const { service_id } = req.params;
        const { trigger_name, trigger_type, trigger_config, active } = req.body;

        try {
            logDebug("ADD → service_id", service_id);
            logDebug("ADD → trigger_name", trigger_name);

            const configJson = typeof trigger_config === 'string'
                ? trigger_config
                : JSON.stringify(trigger_config);

            const result = await dbQueryHots(
                `INSERT INTO m_service_triggers (service_id, trigger_name, trigger_type, trigger_config, active) 
         VALUES (?, ?, ?, ?, ?)`,
                [service_id, trigger_name, trigger_type || 'custom', configJson, active !== false ? 1 : 0]
            );

            logDebug("ADD → insertId", result.insertId);

            return res.json({ ok: true, trigger_id: result.insertId });

        } catch (err) {
            logError("ADD", err);
            return res.status(500).json({ ok: false, error: "Failed to add trigger" });
        }
    },

    /**
     * PUT /triggers/:service_id/:trigger_id
     * Update a single trigger
     */
    async update(req, res) {
        const { trigger_id } = req.params;
        const { trigger_name, trigger_type, trigger_config, active } = req.body;

        try {
            logDebug("UPDATE → trigger_id", trigger_id);

            const configJson = typeof trigger_config === 'string'
                ? trigger_config
                : JSON.stringify(trigger_config);

            await dbQueryHots(
                `UPDATE m_service_triggers 
         SET trigger_name = ?, trigger_type = ?, trigger_config = ?, active = ?, updated_at = NOW()
         WHERE trigger_id = ?`,
                [trigger_name, trigger_type || 'custom', configJson, active !== false ? 1 : 0, trigger_id]
            );

            logDebug("UPDATE → OK");

            return res.json({ ok: true });

        } catch (err) {
            logError("UPDATE", err);
            return res.status(500).json({ ok: false, error: "Failed to update trigger" });
        }
    },

    /**
     * DELETE /triggers/:service_id/:trigger_id
     * Delete a single trigger
     */
    async remove(req, res) {
        const { trigger_id } = req.params;

        try {
            logDebug("DELETE → trigger_id", trigger_id);

            await dbQueryHots(`DELETE FROM m_service_triggers WHERE trigger_id = ?`, [trigger_id]);

            logDebug("DELETE → OK");

            return res.json({ ok: true });

        } catch (err) {
            logError("DELETE", err);
            return res.status(500).json({ ok: false, error: "Failed to delete trigger" });
        }
    },
};
