const { dbHots } = require('../../config/db');

module.exports = {
    /**
     * POST /engine/timeline/edit
     * Edit a timeline entry with atomic revision logic.
     * Request body: { timeline_group_id, new_value }
     */
    editTimelineEntry: async (req, res) => {
        try {
            const { timeline_group_id, new_value } = req.body;
            const company_id = req.dataToken?.company_id || req.body.company_id || 1;

            if (!timeline_group_id || !new_value) {
                return res.status(400).json({ ok: false, error: 'timeline_group_id and new_value are required' });
            }

            const connection = await dbHots.promise().getConnection();
            try {
                // 1. Start Transaction
                await connection.beginTransaction();

                // 2. Fetch latest row
                const [latestRows] = await connection.query(
                    'SELECT * FROM t_ticket_work_data WHERE timeline_group_id = ? AND is_latest = 1 AND company_id = ? FOR UPDATE',
                    [timeline_group_id, company_id]
                );

                if (!latestRows.length) {
                    await connection.rollback();
                    return res.status(404).json({ ok: false, error: 'Timeline entry not found or unauthorized' });
                }

                const latest = latestRows[0];

                // 3. Demote old row
                await connection.query(
                    'UPDATE t_ticket_work_data SET is_latest = 0 WHERE id = ?',
                    [latest.id]
                );

                // 4. Insert new row
                const snapshotJson = typeof latest.snapshot_meta_json === 'string'
                    ? latest.snapshot_meta_json
                    : JSON.stringify(latest.snapshot_meta_json);

                await connection.query(
                    `INSERT INTO t_ticket_work_data 
                     (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, 
                      field_type, created_by, created_at, updated_at, root_ticket_id, ticket_depth, 
                      entry_type, timeline_group_id, revision, is_latest, is_hidden, snapshot_meta_json, company_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(6), ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
                    [
                        latest.ticket_id,
                        latest.assignment_id,
                        latest.service_id,
                        latest.data_type,
                        latest.entity_id,
                        latest.field_name,
                        new_value,           // NEW text
                        latest.field_type,
                        latest.created_by,
                        latest.created_at,   // ORIGINAL created_at
                        latest.root_ticket_id,
                        latest.ticket_depth,
                        latest.entry_type,   // IMMUTABLE
                        latest.timeline_group_id,
                        latest.revision + 1, // INCREMENTED revision
                        latest.is_hidden,
                        snapshotJson,        // IMMUTABLE
                        latest.company_id
                    ]
                );

                // 5. Commit
                await connection.commit();
                return res.json({ ok: true, message: 'Timeline entry revised successfully', revision: latest.revision + 1 });

            } catch (err) {
                await connection.rollback();
                console.error('❌ [TIMELINE] Revision failed:', err.message);
                return res.status(500).json({ ok: false, error: 'Database transaction failed' });
            } finally {
                connection.release();
            }

        } catch (e) {
            console.error('❌ [TIMELINE] Server error:', e);
            return res.status(500).json({ ok: false, error: e.message });
        }
    }
};
