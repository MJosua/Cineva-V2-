/**
 * core/reporting-engine.js
 * 
 * "The Brain" for HOTS Reporting.
 * Responsible for:
 * 1. Fetching raw ticket data (Header + Details + Work Data).
 * 2. "Pivoting" EAV (Entity-Attribute-Value) data into flat JSON objects.
 * 3. Applying filters and safety checks.
 * 
 * REUSABILITY:
 * - Can be called by API Controllers (for UI).
 * - Can be called by Cron Jobs (for nightly email reports).
 * - Can be called by Export Scripts (for generating Excel/PDF files in background).
 */

class ReportingEngine {
    constructor() {
        this.db = null;
        this.formLoader = null;
    }

    init({ dbPool, formLoader }) {
        this.db = dbPool;
        this.formLoader = formLoader;
        console.log('📊 Reporting Engine Initialized');
    }

    /**
     * Main entry point to get a flattened report.
     * @param {number|string} serviceId - The Service ID to report on.
     * @param {Object} filters - Filter criteria (status_id, date_range, etc.).
     * @param {Object} options - Options like 'limit', 'page', 'columns'.
     */
    async getReportData(serviceId, filters = {}, options = {}) {
        const {
            status_id,
            start_date,
            end_date
        } = filters;

        const {
            limit = 100,
            page = 1,
            columns = [] // Optional: Only return specific column keys
        } = options;

        const offset = (page - 1) * limit;

        // 1. Build Query for Ticket Headers
        // We use aliases for safety and clarity
        let query = `
            SELECT 
                t.ticket_id, 
                t.service_id, 
                t.service_name, 
                t.created_by,
                t.creation_date, 
                t.status_id,
                status.status_name,
                CONCAT(u.firstname, ' ', u.lastname) as creator_name
            FROM t_ticket t
            LEFT JOIN m_service_status status ON t.status_id = status.status_id
            LEFT JOIN user u ON t.created_by = u.user_id
            WHERE t.service_id = ?
        `;

        const params = [serviceId];

        // Apply Filters
        if (status_id) {
            query += ` AND t.status_id = ?`;
            params.push(status_id);
        }

        if (start_date) {
            query += ` AND t.creation_date >= ?`;
            params.push(start_date);
        }

        if (end_date) {
            query += ` AND t.creation_date <= ?`;
            params.push(end_date);
        }

        // Add Pagination
        query += ` ORDER BY t.creation_date DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // Execute Query
        const [tickets] = await this.db.promise().query(query, params);

        if (tickets.length === 0) {
            return { columns: [], rows: [], total: 0 };
        }

        // 2. Fetch Details for these tickets (Bulk Fetch for Performance)
        // We only want the LATEST revision for each ticket.
        // A subquery is usually used, but for EAV, simply filtering by ticket_ids is faster 
        // if we assume we just want the current state (which is usually revision=NULL or max).
        // In HOTS, `t_ticket_detail` with `revision IS NULL` represents the current active state? 
        // checking legcay code: `WHERE revision IS NULL OR revision = (SELECT MAX(revision)...)`
        // Let's stick to the safest current snapshot logic.

        const ticketIds = tickets.map(t => t.ticket_id);
        const placeholders = ticketIds.map(() => '?').join(',');

        const detailQuery = `
            SELECT ticket_id, cstm_col, lbl_col, value, field_type 
            FROM t_ticket_detail 
            WHERE ticket_id IN (${placeholders})
            AND (revision IS NULL OR revision = (
                SELECT MAX(d2.revision) FROM t_ticket_detail d2 WHERE d2.ticket_id = t_ticket_detail.ticket_id
            ))
        `;

        const [details] = await this.db.promise().query(detailQuery, ticketIds);

        // 3. (Optional) Fetch Work Data
        // If your system uses t_ticket_work_data, we fetch that too.
        const workDataQuery = `
            SELECT ticket_id, field_name, field_value 
            FROM t_ticket_work_data 
            WHERE ticket_id IN (${placeholders})
        `;
        const [workData] = await this.db.promise().query(workDataQuery, ticketIds);


        // 4. Pivot Logic (The "Brain" part)
        // Convert vertical rows into horizontal objects

        const rowsMap = new Map();

        // Initialize rows with Header Info
        tickets.forEach(t => {
            rowsMap.set(t.ticket_id, {
                ...t, // Spread header info (ticket_id, status, etc.)
                // Format dates nicely
                creation_date: t.creation_date ? new Date(t.creation_date).toISOString().split('T')[0] : null
            });
        });

        // Merge Details
        details.forEach(d => {
            const row = rowsMap.get(d.ticket_id);
            if (row) {
                // Use cstm_col (database key) as the JSON key
                // If cstm_col is missing, fallback to formatted label
                const key = d.cstm_col || this._sanitizeLabel(d.lbl_col);
                row[key] = d.value;
            }
        });

        // Merge Work Data
        workData.forEach(w => {
            const row = rowsMap.get(w.ticket_id);
            if (row) {
                row[w.field_name] = w.field_value;
            }
        });

        // 5. Finalize Rows
        const finalRows = Array.from(rowsMap.values());

        // 6. Inspect Columns dynamically (if not provided)
        let finalColumns = [];
        if (columns.length > 0) {
            // If user specified columns, verify they exist in at least one row or just respect request
            finalColumns = columns;
        } else {
            // Auto-discover columns from the first few rows
            const allKeys = new Set();
            // Always include standard headers first
            ['ticket_id', 'service_name', 'creator_name', 'status_name', 'creation_date'].forEach(k => allKeys.add(k));

            // Add dynamic keys
            finalRows.forEach(row => {
                Object.keys(row).forEach(k => allKeys.add(k));
            });

            finalColumns = Array.from(allKeys);
        }

        // 7. Column Filtering (Safety & UI Logic)
        // If user requested specific columns, filter the row objects.
        if (columns.length > 0) {
            const filteredRows = finalRows.map(row => {
                const newRow = {};
                columns.forEach(col => {
                    newRow[col] = row[col] || null; // Fill missing with null for consistency
                });
                return newRow;
            });
            return { columns: finalColumns, rows: filteredRows, total: tickets.length };
        }

        return { columns: finalColumns, rows: finalRows, total: tickets.length };
    }

    /**
     * Updates a single report cell (Work Data).
     * Replicates logic from hotsDashboardController.upsertReportDetail
     */
    async updateReportField({ ticket_id, service_id, field_name, value, user_id, entity_id = null }) {
        if (!ticket_id || !field_name) {
            throw new Error('ticket_id and field_name are required');
        }

        // Determine value (handle color logic if needed, but here we assume raw value)
        // If field_name is 'Color', value should be the hex code.

        // Check if exists
        const [existing] = await this.db.promise().query(
            `SELECT id FROM t_ticket_work_data 
             WHERE ticket_id = ? 
             AND (entity_id = ? OR (entity_id IS NULL AND ? IS NULL))
             AND field_name = ?`,
            [ticket_id, entity_id, entity_id, field_name]
        );

        if (existing.length > 0) {
            await this.db.promise().query(
                `UPDATE t_ticket_work_data 
                 SET field_value = ?, updated_at = NOW(), updated_by = ?
                 WHERE id = ?`,
                [value, user_id, existing[0].id]
            );
        } else {
            // Ensure service_id
            let sid = service_id;
            if (!sid) {
                const [t] = await this.db.promise().query('SELECT service_id FROM t_ticket WHERE ticket_id=?', [ticket_id]);
                sid = t[0]?.service_id;
            }

            await this.db.promise().query(
                `INSERT INTO t_ticket_work_data
                 (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by, created_at, updated_at)
                 VALUES (?, ?, 'report', ?, ?, ?, 'text', ?, NOW(), NOW())`,
                [ticket_id, sid, entity_id, field_name, value, user_id]
            );
        }

        return { success: true };
    }

    /**
     * Helper to turn "My Label" into "my_label"
     */
    _sanitizeLabel(label) {
        if (!label) return 'unknown_col';
        return label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
}

module.exports = ReportingEngine;
