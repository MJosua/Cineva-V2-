// controller/engine/engineWorkData.js
const { dbHots } = require('../../config/db');

/**
 * Controller for managing work data (EAV structure)
 * Handles service-specific data like job applications, asset allocations, etc.
 */

module.exports = {
    /**
     * GET /engine/assignment/:assignmentId/work-data
     * Fetch work data for an assignment
     */
    getAssignmentWorkData: async (req, res) => {
        try {
            const { assignmentId } = req.params;
            const { data_type } = req.query;

            // Get assignment details with service_id from ticket
            const [assignment] = await dbHots.promise().query(
                `SELECT ta.ticket_id, t.service_id 
                 FROM t_ticket_assignment ta
                 LEFT JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignment.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const { ticket_id, service_id } = assignment[0];
            const safeServiceId = service_id || 0;

            // Build query
            let query = `
        SELECT entity_id, field_name, field_value, field_type, created_at
        FROM t_ticket_work_data
        WHERE (ticket_id = ? OR assignment_id = ?)
          AND service_id = ?
      `;
            const params = [ticket_id, assignmentId, safeServiceId];

            if (data_type) {
                query += ' AND data_type = ?';
                params.push(data_type);
            }

            query += ' ORDER BY entity_id, created_at';

            const [rows] = await dbHots.promise().query(query, params);

            // Group by entity_id and data_type
            const grouped = {};
            rows.forEach(row => {
                const entityId = row.entity_id || 'default';
                if (!grouped[entityId]) {
                    grouped[entityId] = {};
                }
                grouped[entityId][row.field_name] = row.field_value;
            });

            res.json({
                ok: true,
                ticket_id,
                service_id,
                assignment_id: assignmentId,
                work_data: grouped
            });

        } catch (error) {
            console.error('Error fetching work data:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/tickets/:ticketId/work-data
     * Add work data entries
     */
    addWorkData: async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { data_type, entity_id, fields, assignment_id } = req.body;
            const user_id = req.dataToken?.user_id;

            if (!data_type || !fields) {
                return res.status(400).json({
                    ok: false,
                    error: 'Missing required fields: data_type, fields'
                });
            }

            // Get service_id from ticket
            const [ticket] = await dbHots.promise().query(
                'SELECT service_id FROM t_ticket WHERE ticket_id = ?',
                [ticketId]
            );

            if (!ticket.length) {
                return res.status(404).json({ ok: false, error: 'Ticket not found' });
            }

            const service_id = ticket[0].service_id;

            // Generate entity_id if not provided
            const finalEntityId = entity_id || `ENT${Date.now()}`;

            // Insert all fields
            const insertPromises = [];
            for (const [field_name, field_value] of Object.entries(fields)) {
                // Determine field type
                let field_type = 'text';
                if (typeof field_value === 'number') field_type = 'number';
                else if (field_value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(field_value)) field_type = 'date';
                else if (field_name.includes('file') || field_name.includes('path')) field_type = 'file';

                const promise = dbHots.promise().query(
                    `INSERT INTO t_ticket_work_data 
           (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [ticketId, assignment_id || null, service_id, data_type, finalEntityId, field_name, field_value, field_type, user_id]
                );
                insertPromises.push(promise);
            }

            await Promise.all(insertPromises);

            console.log(`✅ [WORK_DATA] Created ${Object.keys(fields).length} fields for entity ${finalEntityId}`);

            res.json({
                ok: true,
                entity_id: finalEntityId,
                fields_created: Object.keys(fields).length
            });

        } catch (error) {
            console.error('Error adding work data:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * PATCH /engine/tickets/:ticketId/work-data/:entityId
     * Update work data entries
     */
    updateWorkData: async (req, res) => {
        try {
            const { ticketId, entityId } = req.params;
            const { fields } = req.body;

            if (!fields || Object.keys(fields).length === 0) {
                return res.status(400).json({ ok: false, error: 'No fields to update' });
            }

            const updatePromises = [];
            for (const [field_name, field_value] of Object.entries(fields)) {
                // Update if exists, insert if not
                const promise = dbHots.promise().query(
                    `INSERT INTO t_ticket_work_data 
           (ticket_id, entity_id, field_name, field_value, service_id, data_type)
           SELECT ?, ?, ?, ?, service_id, data_type FROM t_ticket_work_data
           WHERE ticket_id = ? AND entity_id = ? LIMIT 1
           ON DUPLICATE KEY UPDATE field_value = VALUES(field_value), updated_at = NOW()`,
                    [ticketId, entityId, field_name, field_value, ticketId, entityId]
                );
                updatePromises.push(promise);
            }

            await Promise.all(updatePromises);

            console.log(`✅ [WORK_DATA] Updated ${Object.keys(fields).length} fields for entity ${entityId}`);

            res.json({
                ok: true,
                fields_updated: Object.keys(fields).length
            });

        } catch (error) {
            console.error('Error updating work data:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * GET /engine/ticket/:ticketId/work-data/:fieldName
     * Get a specific work data field by ticket_id and field_name
     */
    getWorkDataField: async (req, res) => {
        try {
            const { ticketId, fieldName } = req.params;

            const [result] = await dbHots.promise().query(
                `SELECT field_value, field_type, created_at 
                 FROM t_ticket_work_data 
                 WHERE ticket_id = ? AND field_name = ? 
                 ORDER BY created_at DESC LIMIT 1`,
                [ticketId, fieldName]
            );

            if (!result.length) {
                return res.json({ ok: true, value: null });
            }

            res.json({
                ok: true,
                value: result[0].field_value,
                field_type: result[0].field_type,
                created_at: result[0].created_at
            });

        } catch (error) {
            console.error('Error getting work data field:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/ticket/:ticketId/work-data
     * Save/upsert a work data field for a ticket
     */
    saveWorkDataField: async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { field_name, field_value } = req.body;
            const user_id = req.dataToken?.user_id;

            if (!field_name || field_value === undefined) {
                return res.status(400).json({ ok: false, error: 'Missing field_name or field_value' });
            }

            // Get service_id from ticket
            const [ticket] = await dbHots.promise().query(
                'SELECT service_id FROM t_ticket WHERE ticket_id = ?',
                [ticketId]
            );

            if (!ticket.length) {
                return res.status(404).json({ ok: false, error: 'Ticket not found' });
            }

            const service_id = ticket[0].service_id;

            // Upsert: delete existing and insert new
            await dbHots.promise().query(
                `DELETE FROM t_ticket_work_data WHERE ticket_id = ? AND field_name = ?`,
                [ticketId, field_name]
            );

            await dbHots.promise().query(
                `INSERT INTO t_ticket_work_data 
                 (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
                 VALUES (?, ?, 'executor_input', 'data update', ?, ?, 'text', ?)`,
                [ticketId, service_id, field_name, field_value, user_id]
            );

            console.log(`✅ [WORK_DATA] Saved ${field_name}=${field_value} for ticket ${ticketId}`);

            res.json({
                ok: true,
                message: 'Work data saved successfully',
                field_name,
                field_value
            });

        } catch (error) {
            console.error('Error saving work data field:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    }
};
