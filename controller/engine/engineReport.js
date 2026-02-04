/**
 * controller/engine/engineReport.js
 * 
 * Thin wrapper controller that exposes the Core Reporting Engine to the API.
 */

const { reportingEngine } = require('../../core/init-engines');

module.exports = {
    getReport: async (req, res) => {
        try {
            const { service_id } = req.params;
            const {
                status_id,
                start_date,
                end_date,
                limit,
                page,
                columns
            } = req.query;

            if (!service_id) {
                return res.status(400).json({ ok: false, error: 'service_id is required' });
            }

            // Prepare filters
            const filters = {
                status_id: status_id ? parseInt(status_id) : undefined,
                start_date,
                end_date
            };

            // Prepare options
            const options = {
                limit: limit ? parseInt(limit) : 20,
                page: page ? parseInt(page) : 1,
                columns: columns ? columns.split(',') : []
            };

            const result = await reportingEngine.getReportData(service_id, filters, options);

            res.json({
                ok: true,
                data: result
            });

        } catch (error) {
            console.error('[EngineReport] Error:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    updateReport: async (req, res) => {
        try {
            const { ticket_id, field_name, value, detail_id, service_id } = req.body;
            const user_id = req.dataToken?.user_id || null;

            await reportingEngine.updateReportField({
                ticket_id,
                service_id,
                field_name,
                value,
                user_id,
                entity_id: detail_id // Map detail_id to entity_id
            });

            res.json({ ok: true });
        } catch (error) {
            console.error('[EngineReport][Update] Error:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    }
};
