// controller/hots_controller/hotsDashboardController.js
const {
    dbHots,
    dbQueryHots,
} = require("../../config/db");
/**
 * Get dashboard functions filtered by user role & department
 */
let yellowTerminal = "\x1b[33m";

module.exports = {


    getDashboardFunctions: async (req, res) => {


        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        try {
            const role_id = req.dataToken.role_id;
            const dept_id = req.dataToken.department_id;

            const [rows] = await dbHots.promise().query(`
            SELECT f.*, c.name AS category_name
            FROM m_dashboard_function f
            LEFT JOIN m_dashboard_category c ON f.category_id = c.id
            WHERE f.is_active = 1
            ORDER BY c.order_index, f.order_index;
          `);

            // 🧩 Safe parser that supports both MySQL JSON type & text JSON
            const safeParseJSON = (value, fallback = []) => {
                if (Array.isArray(value)) return value;
                if (!value || value === "null" || value === "") return fallback;
                try {
                    return JSON.parse(value);
                } catch (err) {
                    console.warn("⚠️ Invalid JSON found in dashboard function:", value);
                    return fallback;
                }
            };

            const filtered = rows.filter((f) => {
                const allowedRoles = safeParseJSON(f.roles_allowed).map((x) =>
                    isNaN(x) ? x : Number(x)
                );
                const allowedDepts = safeParseJSON(f.department_scope).map((x) =>
                    isNaN(x) ? x : Number(x)
                );

                // Step 1️⃣: role filter
                const roleAllowed =
                    allowedRoles.includes("all") ||
                    allowedRoles.includes(0) ||
                    allowedRoles.includes(role_id);

                // Step 2️⃣: department filter (only if role allowed)
                const deptAllowed =
                    roleAllowed &&
                    (allowedDepts.includes("all") ||
                        allowedDepts.length === 0 ||
                        allowedDepts.includes(dept_id));

                return roleAllowed && deptAllowed;
            });

            console.log(timestamp, "GET Dashboard SUCCESS");

            res.json(filtered);
        } catch (err) {
            console.error("Error fetching dashboard functions:", err);
            res.status(500).json({
                message: "Error loading dashboard functions",
                error: err.message,
            });
        }
    },

    srf_report: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { year, type, distributor, country, page = 1, limit = 50 } = req.query;

            const pageNum = Math.max(Number(page) || 1, 1);
            const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 1000);
            const offset = (pageNum - 1) * limitNum;

            let sql = `
            SELECT *
            FROM hots.srf_report
            WHERE 1 = 1
          `;
            const params = [];

            if (year) {
                sql += ` AND YEAR(\`Tgl Email SRF\`) = ?`;
                params.push(year);
            }
            if (type) {
                sql += ` AND (\`Product Category\` LIKE ? OR \`Sample Category\` LIKE ?)`;
                params.push(`%${type}%`, `%${type}%`);
            }
            if (distributor) {
                sql += ` AND \`Distributor\` LIKE ?`;
                params.push(`%${distributor}%`);
            }
            if (country) {
                sql += ` AND \`Country\` LIKE ?`;
                params.push(`%${country}%`);
            }

            // Count total first
            const [countRows] = await dbHots.promise().query(`SELECT COUNT(*) as total FROM (${sql}) as tmp`, params);
            const total = countRows[0].total;

            // Apply pagination
            sql += ` ORDER BY \`Tgl Email SRF\` DESC, \`SRF No.\` ASC LIMIT ?, ?`;
            params.push(Number(offset), Number(limitNum));

            const [rows] = await dbHots.promise().query(sql, params);

            console.log(timestamp, `GET SRF REPORT SUCCESS | Rows: ${rows.length}/${total}`);


            if (rows.length === 0) {
                console.log(timestamp, "SRF REPORT — No results found");
                return res.json({
                    success: true,
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    results: [],
                    message: "No SRF data found for given filters."
                });
            }

            res.json({
                success: true,
                total,
                page: Number(pageNum),
                limit: Number(limitNum),
                results: rows,
            });
        } catch (err) {
            console.error("Error fetching SRF Report:", err);
            res.status(500).json({
                success: false,
                message: "Error loading SRF report data",
                error: err.message,
            });
        }
    },

    getReportDetails: async (req, res) => {
        try {
            const { ticket_id } = req.params;
            // Use t_ticket_work_data instead of t_ticket_report
            const [rows] = await dbHots.promise().query(
                `SELECT id, ticket_id, assignment_id, service_id, data_type, entity_id, 
                        field_name, field_value, field_type, created_by, created_at, updated_at
                 FROM hots.t_ticket_work_data 
                 WHERE ticket_id = ?`,
                [ticket_id]
            );
            res.json({ success: true, data: rows });
        } catch (err) {
            console.error("Error fetching report details:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 🔹 Add or update work data (using EAV structure in t_ticket_work_data)
    upsertReportDetail: async (req, res) => {
        console.log("Trying to do upsert to t_ticket_work_data");

        try {
            const {
                ticket_id,
                detail_id,      // maps to entity_id
                lbl_col,        // maps to field_name
                cstm_col,       // maps to field_value
                color_code,     // if lbl_col is 'Color', use cstm_col for this
                visible_to,     // stored as field_type or separate field
                service_id: requestServiceId, // can be passed from frontend
            } = req.body;

            const user_id = req.dataToken?.user_id || null;

            if (!ticket_id || !lbl_col) {
                return res.status(400).json({
                    success: false,
                    message: "Missing ticket_id or lbl_col (field_name)",
                });
            }

            // Parse detail_id - handle string "null" 
            const entity_id = (detail_id && detail_id !== 'null' && detail_id !== 'undefined')
                ? detail_id
                : null;

            // Get service_id from ticket, fallback to request body
            let service_id = requestServiceId || null;
            if (!service_id) {
                const [ticketRows] = await dbHots.promise().query(
                    `SELECT service_id FROM hots.t_ticket WHERE ticket_id = ? LIMIT 1`,
                    [ticket_id]
                );
                service_id = ticketRows[0]?.service_id || 6; // Default to 6 (SRF) if not found
            }

            // Determine the value to store
            const field_value = lbl_col === 'Color' ? (color_code || cstm_col) : cstm_col;

            // Check for existing record
            const [existing] = await dbHots.promise().query(
                `SELECT id FROM hots.t_ticket_work_data 
                 WHERE ticket_id = ? AND entity_id <=> ? AND field_name = ?`,
                [ticket_id, entity_id, lbl_col]
            );

            if (existing.length > 0) {
                // ✅ Update existing record
                await dbHots.promise().query(
                    `UPDATE hots.t_ticket_work_data 
                     SET field_value = ?, field_type = ?, updated_at = NOW()
                     WHERE ticket_id = ? AND entity_id <=> ? AND field_name = ?`,
                    [
                        field_value,
                        visible_to || 'admin',
                        ticket_id,
                        entity_id,
                        lbl_col,
                    ]
                );

                console.log("🟡 Updated existing work data:", { ticket_id, entity_id, lbl_col });
            } else {
                // ✅ Insert new record
                await dbHots.promise().query(
                    `INSERT INTO hots.t_ticket_work_data
                     (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by, created_at, updated_at)
                     VALUES (?, NULL, ?, 'report', ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                        ticket_id,
                        service_id,
                        entity_id,
                        lbl_col,
                        field_value,
                        visible_to || 'admin',
                        user_id,
                    ]
                );

                console.log("🟢 Inserted new work data:", { ticket_id, entity_id, lbl_col });
            }

            res.json({ success: true, message: "Report detail saved successfully" });
        } catch (err) {
            console.error("❌ Error saving report detail:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /hotsdashboard/service_summary/:service_id
     * Returns KPIs, trends, and status distribution for a service
     */
    getServiceSummary: async (req, res) => {
        let date = new Date();
        let timestamp = "\x1b[33m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { service_id } = req.params;
            const { range = '30d' } = req.query;

            // Calculate date range
            const days = range === '7d' ? 7 : range === '90d' ? 90 : range === 'YTD' ? 365 : 30;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // 1. Get KPIs
            const [kpiRows] = await dbHots.promise().query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status_id IN (1,2,3) THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status_id = 6 THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status_id = 7 THEN 1 ELSE 0 END) as rejected
                FROM t_ticket
                WHERE service_id = ? AND creation_date >= ?
            `, [service_id, startDate]);

            // 2. Get previous period for trend calculation
            const prevStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const [prevRows] = await dbHots.promise().query(`
                SELECT COUNT(*) as total
                FROM t_ticket
                WHERE service_id = ? AND creation_date >= ? AND creation_date < ?
            `, [service_id, prevStart, startDate]);

            const currentTotal = kpiRows[0]?.total || 0;
            const prevTotal = prevRows[0]?.total || 1;
            const trend = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);

            // 3. Get sparkline data (daily counts for the period)
            const [sparklineRows] = await dbHots.promise().query(`
                SELECT DATE(creation_date) as date, COUNT(*) as value
                FROM t_ticket
                WHERE service_id = ? AND creation_date >= ?
                GROUP BY DATE(creation_date)
                ORDER BY date ASC
            `, [service_id, startDate]);

            // 4. Get status distribution
            const [statusRows] = await dbHots.promise().query(`
                SELECT 
                    s.status_name as name,
                    COUNT(*) as value,
                    CASE 
                        WHEN t.status_id = 6 THEN 'hsl(142, 76%, 36%)'
                        WHEN t.status_id = 7 THEN 'hsl(0, 84%, 60%)'
                        ELSE 'hsl(38, 92%, 50%)'
                    END as color
                FROM t_ticket t
                JOIN m_ticket_status s ON t.status_id = s.status_id
                WHERE t.service_id = ? AND t.creation_date >= ?
                GROUP BY t.status_id, s.status_name
            `, [service_id, startDate]);

            // 5. Get trend data (daily)
            const [trendRows] = await dbHots.promise().query(`
                SELECT 
                    DATE(creation_date) as date,
                    COUNT(*) as requests,
                    SUM(CASE WHEN status_id = 6 THEN 1 ELSE 0 END) as approved
                FROM t_ticket
                WHERE service_id = ? AND creation_date >= ?
                GROUP BY DATE(creation_date)
                ORDER BY date ASC
            `, [service_id, startDate]);

            console.log(timestamp, `GET Service Summary SUCCESS | service_id=${service_id}`);

            res.json({
                success: true,
                kpis: {
                    total: currentTotal,
                    pending: kpiRows[0]?.pending || 0,
                    approved: kpiRows[0]?.approved || 0,
                    rejected: kpiRows[0]?.rejected || 0,
                    trend: trend,
                    trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'
                },
                sparklineData: sparklineRows.map(r => ({ value: r.value })),
                statusDistribution: statusRows,
                trendData: trendRows.map(r => ({
                    date: new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                    requests: r.requests,
                    approved: r.approved
                }))
            });

        } catch (err) {
            console.error("Error fetching service summary:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /hotsdashboard/service_analytics/:service_id
     * Returns detailed analytics data for the Data Table tab
     */
    getServiceAnalytics: async (req, res) => {
        let date = new Date();
        let timestamp = "\x1b[33m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { service_id } = req.params;
            const { page = 1, limit = 50, range = '30d' } = req.query;

            const pageNum = Math.max(Number(page) || 1, 1);
            const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 1000);
            const offset = (pageNum - 1) * limitNum;

            const days = range === '7d' ? 7 : range === '90d' ? 90 : range === 'YTD' ? 365 : 30;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Get analytics data from t_ticket_analytics if exists, else from t_ticket
            const [rows] = await dbHots.promise().query(`
                SELECT 
                    a.id,
                    a.ticket_id,
                    a.event_type,
                    a.ref_key,
                    a.dim_1 as category,
                    a.dim_2 as field_name,
                    a.dim_3 as reason,
                    a.val_str_old as old_value,
                    a.val_str_new as new_value,
                    a.created_at,
                    CONCAT(u.firstname, ' ', u.lastname) as created_by_name
                FROM t_ticket_analytics a
                LEFT JOIN user u ON a.created_by = u.user_id
                WHERE a.service_id = ? AND a.created_at >= ?
                ORDER BY a.created_at DESC
                LIMIT ?, ?
            `, [service_id, startDate, offset, limitNum]);

            // Get total count
            const [countRows] = await dbHots.promise().query(`
                SELECT COUNT(*) as total FROM t_ticket_analytics 
                WHERE service_id = ? AND created_at >= ?
            `, [service_id, startDate]);

            console.log(timestamp, `GET Service Analytics SUCCESS | service_id=${service_id}, rows=${rows.length}`);

            res.json({
                success: true,
                total: countRows[0]?.total || 0,
                page: pageNum,
                limit: limitNum,
                results: rows
            });

        } catch (err) {
            console.error("Error fetching service analytics:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /hotsdashboard/service_tickets/:service_id
     * Returns all tickets for a service (for basic table view)
     */
    getServiceTickets: async (req, res) => {
        let date = new Date();
        let timestamp = "\x1b[33m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { service_id } = req.params;
            const { page = 1, limit = 50, range = '30d' } = req.query;

            const pageNum = Math.max(Number(page) || 1, 1);
            const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 1000);
            const offset = (pageNum - 1) * limitNum;

            const days = range === '7d' ? 7 : range === '90d' ? 90 : range === 'YTD' ? 365 : 30;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const [rows] = await dbHots.promise().query(`
                SELECT 
                    t.ticket_id,
                    t.title,
                    t.creation_date,
                    t.status_id,
                    s.status_name,
                    CONCAT(u.firstname, ' ', u.lastname) as requester_name,
                    t.last_update as completed_at
                FROM t_ticket t
                JOIN m_ticket_status s ON t.status_id = s.status_id
                LEFT JOIN user u ON t.created_by = u.user_id
                WHERE t.service_id = ? AND t.creation_date >= ?
                ORDER BY t.creation_date DESC
                LIMIT ?, ?
            `, [service_id, startDate, offset, limitNum]);

            // Get total count
            const [countRows] = await dbHots.promise().query(`
                SELECT COUNT(*) as total FROM t_ticket 
                WHERE service_id = ? AND creation_date >= ?
            `, [service_id, startDate]);

            console.log(timestamp, `GET Service Tickets SUCCESS | service_id=${service_id}, rows=${rows.length}`);

            res.json({
                success: true,
                total: countRows[0]?.total || 0,
                page: pageNum,
                limit: limitNum,
                results: rows
            });

        } catch (err) {
            console.error("Error fetching service tickets:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /hotsdashboard/panels/:dashboard_id
     * Returns all panels configured for a dashboard function
     */
    getDashboardPanels: async (req, res) => {
        let date = new Date();
        let timestamp = "\x1b[33m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { dashboard_id } = req.params;

            const [panels] = await dbHots.promise().query(`
                SELECT 
                    p.id,
                    p.dashboard_function_id,
                    p.panel_type,
                    p.title,
                    p.component_key,
                    p.order_index,
                    p.is_tab,
                    p.is_collapsible,
                    p.default_collapsed,
                    p.config,
                    p.is_active
                FROM m_dashboard_panel p
                WHERE p.dashboard_function_id = ? AND p.is_active = 1
                ORDER BY p.order_index ASC
            `, [dashboard_id]);

            // Parse config JSON safely
            const parsedPanels = panels.map(panel => ({
                ...panel,
                config: typeof panel.config === 'string'
                    ? JSON.parse(panel.config || '{}')
                    : panel.config || {}
            }));

            console.log(timestamp, `GET Dashboard Panels SUCCESS | dashboard_id=${dashboard_id}, count=${panels.length}`);

            res.json({
                success: true,
                panels: parsedPanels
            });

        } catch (err) {
            console.error("Error fetching dashboard panels:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

}