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

    /**
     * GET /hotsdashboard/summary
     * Returns consolidated dashboard KPIs for the current user
     * Includes: approvals, tickets, assignments, SRF stats, E-Order volume
     */
    getDashboardSummary: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const user_id = req.dataToken.user_id;
            const { dbConf } = require("../../config/db");

            // 🔥 OPTIMIZATION: Run all independent queries in parallel
            console.time(timestamp + "DashboardQueries");

            const results = await Promise.allSettled([
                // 1. My pending approvals
                dbHots.promise().query(`
                    SELECT COUNT(*) as total 
                    FROM t_ticket_event e 
                    INNER JOIN t_ticket t ON e.ticket_id = t.ticket_id
                    WHERE e.approver_id = ? 
                    AND e.approval_status = 0
                    AND t.status_id NOT IN (6, 7, 99)
                `, [user_id]),

                // 2. My open tickets
                dbHots.promise().query(`
                    SELECT COUNT(*) as total 
                    FROM t_ticket 
                    WHERE created_by = ? 
                    AND status_id NOT IN (6, 7, 99)
                `, [user_id]),

                // 3. My active assignments
                dbHots.promise().query(`
                    SELECT COUNT(*) as total
                    FROM t_ticket_assignment ta
                    WHERE ta.assignment_status = 'active'
                    AND (
                        (ta.assigned_type = 'user' AND ta.assigned_id = ?)
                        OR (ta.assigned_type = 'team' AND ta.assigned_id IN (
                            SELECT team_id FROM m_team_member WHERE user_id = ?
                        ))
                    )
                `, [user_id, user_id]),

                // 4. Tickets this week
                dbHots.promise().query(`
                    SELECT COUNT(*) as total 
                    FROM t_ticket 
                    WHERE creation_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
                `),

                // 5. Tickets this month
                dbHots.promise().query(`
                    SELECT COUNT(*) as total 
                    FROM t_ticket 
                    WHERE YEAR(creation_date) = YEAR(CURRENT_DATE)
                    AND MONTH(creation_date) = MONTH(CURRENT_DATE)
                `),

                // 6. SRF tickets this month
                dbHots.promise().query(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status_id IN (1,2,3) THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status_id = 6 THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN status_id = 7 THEN 1 ELSE 0 END) as rejected
                    FROM t_ticket 
                    WHERE service_id = 6
                    AND YEAR(creation_date) = YEAR(CURRENT_DATE)
                    AND MONTH(creation_date) = MONTH(CURRENT_DATE)
                `),

                // 7. E-Order volume
                dbConf.promise().query(`
                    SELECT SUM(COALESCE(ms.qty, 0)) as total
                    FROM iod.m_order mo
                    INNER JOIN iod.m_summary ms ON mo.order_id = ms.order_id AND mo.company_id = ms.company_id
                    WHERE MONTH(mo.po_date) = MONTH(NOW())
                    AND YEAR(mo.po_date) = YEAR(NOW())
                    AND mo.status NOT IN (0, 77, 99)
                `),

                // 8. Status breakdown
                dbHots.promise().query(`
                    SELECT 
                        s.status_name,
                        COUNT(*) as count
                    FROM t_ticket t
                    JOIN m_service_status s ON t.status_id = s.status_id
                    WHERE YEAR(t.creation_date) = YEAR(CURRENT_DATE)
                    AND MONTH(t.creation_date) = MONTH(CURRENT_DATE)
                    GROUP BY t.status_id, s.status_name
                `),

                // 9. Service stats
                dbHots.promise().query(`
                    SELECT 
                        s.service_name,
                        COUNT(*) as total_tickets,
                        SUM(CASE WHEN t.status_id NOT IN (6, 7, 99) THEN 1 ELSE 0 END) as open_tickets,
                        SUM(CASE WHEN t.status_id IN (6, 7, 99) THEN 1 ELSE 0 END) as closed_tickets
                    FROM t_ticket t
                    JOIN m_service s ON t.service_id = s.service_id
                    WHERE YEAR(t.creation_date) = YEAR(CURRENT_DATE)
                    GROUP BY t.service_id, s.service_name
                    ORDER BY total_tickets DESC
                `)
            ]);

            console.timeEnd(timestamp + "DashboardQueries");

            // Extract results safely
            const getVal = (res, index) => {
                if (res[index].status === 'fulfilled') {
                    // query returns [rows, fields], we want rows (index 0)
                    return res[index].value[0];
                }
                console.warn(`${timestamp} Query ${index + 1} failed:`, res[index].reason);
                return [];
            };

            const approvalRows = getVal(results, 0);
            const myTicketsRows = getVal(results, 1);
            const assignmentRows = getVal(results, 2);
            const weekTicketsRows = getVal(results, 3);
            const monthTicketsRows = getVal(results, 4);
            const srfRows = getVal(results, 5);
            const orderRows = getVal(results, 6); // Note: E-order might fail independently
            const statusRows = getVal(results, 7);
            const serviceStatsRows = getVal(results, 8);

            // Process specific data
            const orderVolume = orderRows[0]?.total || 0;
            const byStatus = {};
            statusRows.forEach(r => byStatus[r.status_name] = r.count);

            console.log(timestamp, "GET Dashboard Summary SUCCESS (Parallel)");

            res.json({
                success: true,
                summary: {
                    my_approvals_pending: approvalRows[0]?.total || 0,
                    my_tickets_open: myTicketsRows[0]?.total || 0,
                    my_assignments_active: assignmentRows[0]?.total || 0,
                    tickets_this_week: weekTicketsRows[0]?.total || 0,
                    tickets_this_month: monthTicketsRows[0]?.total || 0,
                    srf_total: srfRows[0]?.total || 0,
                    srf_pending: srfRows[0]?.pending || 0,
                    srf_approved: srfRows[0]?.approved || 0,
                    srf_rejected: srfRows[0]?.rejected || 0,
                    order_volume_mtd: orderVolume,
                    by_status: byStatus,
                    service_stats: serviceStatsRows
                }
            });

        } catch (err) {
            console.error(timestamp + "Error fetching dashboard summary:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /hotsdashboard/report_service
     * Returns ticket counts grouped by service for Service Report page
     */
    report_service: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { year } = req.query;
            const targetYear = year || new Date().getFullYear();

            const [rows] = await dbHots.promise().query(`
                SELECT 
                    s.service_name,
                    COUNT(*) as total_tickets,
                    SUM(CASE WHEN t.status_id NOT IN (6, 7, 99) THEN 1 ELSE 0 END) as open_tickets,
                    SUM(CASE WHEN t.status_id IN (6, 7, 99) THEN 1 ELSE 0 END) as closed_tickets
                FROM t_ticket t
                JOIN m_service s ON t.service_id = s.service_id
                WHERE YEAR(t.creation_date) = ?
                GROUP BY t.service_id, s.service_name
                ORDER BY total_tickets DESC
            `, [targetYear]);

            console.log(timestamp, `GET Report Service SUCCESS | Rows: ${rows.length}`);

            res.json({
                success: true,
                year: targetYear,
                results: rows
            });

        } catch (err) {
            console.error("Error fetching service report:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },



    getDashboardFunctions: async (req, res) => {


        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        try {
            const role_id = req.dataToken.role_id;
            const dept_id = req.dataToken.department_id;

            const [rows] = await dbHots.promise().query(`
            SELECT f.*, c.name AS category_name
            FROM m_dashboard_menu f
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
            const { year, type, distributor, country, category, page = 1, limit = 50 } = req.query;

            const pageNum = Math.max(Number(page) || 1, 1);
            const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 1000);
            const offset = (pageNum - 1) * limitNum;

            // Base SQL - VIEW columns + custom work_data columns
            let sql = `
            SELECT 
                sr.\`SRF No.\`,
                sr.\`Year\`,
                sr.\`Tgl Email SRF\`,
                sr.\`Requester\`,
                sr.\`Deliver To\`,
                sr.\`Distributor\`,
                sr.\`Country\`,
                sr.\`Purpose\`,
                sr.\`Product Category\`,
                sr.\`Sample Category\`,
                sr.\`Factory\`,
                sr.\`PO Req\`,
                sr.\`Week\`,
                sr.\`Declare on Shipping Docs\`,
                sr.\`Request Detail\`,
                sr.\`Reason\`,
                sr.\`Item Name\`,
                sr.\`Material Code\`,
                sr.\`Product\`,
                sr.\`QTY Req\`,
                sr.\`Satuan\`,
                sr.\`Lead Time Approval (Factory)\`,
                sr.\`Status ID\`,
                sr.\`Status\`,
                sr.\`Tanggal Created\`,
                sr.\`Last Update\`,
                sr.ticket_id,
                sr.detail_id,
                sr.Color,
                sr.Remarks,
                wd_dest.field_value as \`Destination\`,
                wd_weekrdd.field_value as \`Week RDD\`,
                wd_qtyact.field_value as \`QTY Act\`,
                wd_qtyout.field_value as \`Qty Outstanding\`,
                wd_stuffing.field_value as \`Realisasi Stuffing\`,
                wd_oasys.field_value as \`OASYS\`
            FROM hots.srf_report sr
            LEFT JOIN hots.t_ticket_work_data wd_dest 
                ON sr.ticket_id = wd_dest.ticket_id AND sr.detail_id = wd_dest.entity_id
                AND wd_dest.field_name = 'Destination'
            LEFT JOIN hots.t_ticket_work_data wd_weekrdd 
                ON sr.ticket_id = wd_weekrdd.ticket_id AND sr.detail_id = wd_weekrdd.entity_id
                AND wd_weekrdd.field_name = 'Week RDD'
            LEFT JOIN hots.t_ticket_work_data wd_qtyact 
                ON sr.ticket_id = wd_qtyact.ticket_id AND sr.detail_id = wd_qtyact.entity_id
                AND wd_qtyact.field_name = 'QTY Act'
            LEFT JOIN hots.t_ticket_work_data wd_qtyout 
                ON sr.ticket_id = wd_qtyout.ticket_id AND sr.detail_id = wd_qtyout.entity_id
                AND wd_qtyout.field_name = 'Qty Outstanding'
            LEFT JOIN hots.t_ticket_work_data wd_stuffing 
                ON sr.ticket_id = wd_stuffing.ticket_id AND sr.detail_id = wd_stuffing.entity_id
                AND wd_stuffing.field_name = 'Realisasi Stuffing'
            LEFT JOIN hots.t_ticket_work_data wd_oasys 
                ON sr.ticket_id = wd_oasys.ticket_id AND sr.detail_id = wd_oasys.entity_id
                AND wd_oasys.field_name = 'OASYS'
            WHERE 1 = 1
          `;
            const params = [];

            // Apply Filters
            if (year) {
                sql += ` AND YEAR(sr.\`Tgl Email SRF\`) = ?`;
                params.push(year);
            }
            if (type) {
                sql += ` AND (sr.\`Product Category\` LIKE ? OR sr.\`Sample Category\` LIKE ?)`;
                params.push(`%${type}%`, `%${type}%`);
            }
            if (distributor) {
                sql += ` AND sr.\`Distributor\` LIKE ?`;
                params.push(`%${distributor}%`);
            }
            if (country) {
                sql += ` AND sr.\`Country\` LIKE ?`;
                params.push(`%${country}%`);
            }
            // Generic Search
            if (req.query.search) {
                const term = `%${req.query.search}%`;
                sql += ` AND (
                    sr.\`SRF No.\` LIKE ? OR 
                    sr.\`Distributor\` LIKE ? OR 
                    sr.\`Product\` LIKE ? OR 
                    sr.\`Requester\` LIKE ? OR 
                    sr.\`Remarks\` LIKE ? OR
                    sr.\`Country\` LIKE ?
                )`;
                params.push(term, term, term, term, term, term);
            }

            // RM vs FG Filter
            if (category === 'RM') {
                sql += ` AND sr.\`Sample Category\` LIKE 'RM -%'`;
            } else if (category === 'FG') {
                sql += ` AND sr.\`Sample Category\` LIKE 'FG -%'`;
            }

            // 1. Calculate Global Stats (Total, Pending, Approved, Rejected)
            // We use the same WHERE clause but wrap it to count by status
            const statsSql = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN \`Status ID\` IN (1,2,3) THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN \`Status ID\` = 6 THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN \`Status ID\` = 7 THEN 1 ELSE 0 END) as rejected
                FROM (${sql}) as tmp
            `;

            const [statsRows] = await dbHots.promise().query(statsSql, params);
            const stats = statsRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };

            // 2. Fetch Paginated Data
            sql += ` ORDER BY sr.\`Tgl Email SRF\` DESC, sr.\`SRF No.\` ASC LIMIT ?, ?`;
            params.push(Number(offset), Number(limitNum));

            const [rows] = await dbHots.promise().query(sql, params);

            console.log(timestamp, `GET SRF REPORT SUCCESS | Rows: ${rows.length}/${stats.total} | Category: ${category || 'All'}`);

            res.json({
                success: true,
                total: stats.total,
                stats: {
                    total: stats.total,
                    pending: Number(stats.pending) || 0,
                    approved: Number(stats.approved) || 0,
                    rejected: Number(stats.rejected) || 0
                },
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

            // Parse detail_id - handle string "null" and ensure proper type
            let entity_id = null;
            if (detail_id && detail_id !== 'null' && detail_id !== 'undefined' && detail_id !== '') {
                // Try to parse as number if it looks like one
                const parsed = parseInt(detail_id, 10);
                entity_id = !isNaN(parsed) ? parsed : detail_id;
            }

            console.log("📝 upsertReportDetail params:", {
                ticket_id,
                detail_id,
                entity_id,
                lbl_col,
                cstm_col,
                color_code,
                visible_to
            });

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

            // Check for existing record - use multiple conditions for robustness
            const [existing] = await dbHots.promise().query(
                `SELECT id FROM hots.t_ticket_work_data 
                 WHERE ticket_id = ? 
                 AND (entity_id = ? OR (entity_id IS NULL AND ? IS NULL))
                 AND field_name = ?`,
                [ticket_id, entity_id, entity_id, lbl_col]
            );

            console.log("📋 Existing records found:", existing.length);

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
                JOIN m_service_status s ON t.status_id = s.status_id
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
     * Returns all tickets for a service (Reference + Work Data flattened)
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

            // 1. Fetch Basic Ticket Data
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
                JOIN m_service_status s ON t.status_id = s.status_id
                LEFT JOIN user u ON t.created_by = u.user_id
                WHERE t.service_id = ? AND t.creation_date >= ?
                ORDER BY t.creation_date DESC
                LIMIT ?, ?
            `, [service_id, startDate, offset, limitNum]);

            // 2. Fetch Work Data (Dynamic Fields) for these tickets
            if (rows.length > 0) {
                const ticketIds = rows.map(r => r.ticket_id);

                // Use a safe IN clause
                const placeholders = ticketIds.map(() => '?').join(',');
                const [workDataRows] = await dbHots.promise().query(`
                    SELECT ticket_id, field_name, field_value 
                    FROM t_ticket_work_data 
                    WHERE ticket_id IN (${placeholders})
                `, ticketIds);

                // 3. Merge Work Data into Ticket Objects
                const workDataMap = {};

                // Group by ticket_id
                workDataRows.forEach(wd => {
                    if (!workDataMap[wd.ticket_id]) {
                        workDataMap[wd.ticket_id] = {};
                    }
                    // Clean field name for JSON key (remove special chars if needed, but usually fine)
                    // We prioritize showing meaningful columns
                    if (wd.field_name && wd.field_value) {
                        workDataMap[wd.ticket_id][wd.field_name] = wd.field_value;
                    }
                });

                // Attach to rows
                rows.forEach(row => {
                    const extraData = workDataMap[row.ticket_id] || {};
                    Object.assign(row, extraData);
                });
            }

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
                    p.dashboard_menu_id,
                    p.panel_type,
                    p.title,
                    p.component_key,
                    p.order_index,
                    p.is_tab,
                    p.is_collapsible,
                    p.default_collapsed,
                    p.config,
                    p.is_active
                FROM m_dashboard_widget p
                WHERE p.dashboard_menu_id = ? AND p.is_active = 1
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
    },

    /**
     * GET /hotsdashboard/card_summary/:function_id
     * Returns summary data for a dashboard card based on its card_config
     * Supports: ticket (from t_ticket), custom endpoint, static (no data)
     */
    getCardSummary: async (req, res) => {
        try {
            const { function_id } = req.params;

            // 1. Get function with card_config
            const [funcRows] = await dbHots.promise().query(`
                SELECT id, title, card_config, related_service_id 
                FROM m_dashboard_menu 
                WHERE id = ?
            `, [function_id]);

            if (!funcRows.length) {
                return res.status(404).json({ success: false, error: 'Dashboard function not found' });
            }

            const func = funcRows[0];
            let config = {};

            // Parse card_config JSON
            if (func.card_config) {
                try {
                    config = typeof func.card_config === 'string'
                        ? JSON.parse(func.card_config)
                        : func.card_config;
                } catch (e) {
                    console.warn('Invalid card_config JSON:', e);
                }
            }

            // 2. Handle different config types
            const configType = config.type || 'ticket'; // default to ticket

            // STATIC type - no data needed
            if (configType === 'static') {
                return res.json({
                    success: true,
                    type: 'static',
                    data: null
                });
            }

            // TICKET type - fetch from t_ticket
            if (configType === 'ticket') {
                const serviceId = config.serviceId || func.related_service_id;

                if (!serviceId) {
                    return res.json({
                        success: true,
                        type: 'ticket',
                        data: null // No service configured
                    });
                }

                // Get ticket stats
                const [statsRows] = await dbHots.promise().query(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status_id IN (1,2,3) THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status_id = 6 THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN status_id = 7 THEN 1 ELSE 0 END) as rejected
                    FROM t_ticket 
                    WHERE service_id = ?
                    AND YEAR(creation_date) = YEAR(CURRENT_DATE)
                `, [serviceId]);

                // Get trend (compare to last month)
                const [trendRows] = await dbHots.promise().query(`
                    SELECT 
                        (SELECT COUNT(*) FROM t_ticket 
                         WHERE service_id = ? 
                         AND YEAR(creation_date) = YEAR(CURRENT_DATE) 
                         AND MONTH(creation_date) = MONTH(CURRENT_DATE)) as thisMonth,
                        (SELECT COUNT(*) FROM t_ticket 
                         WHERE service_id = ? 
                         AND creation_date >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH)
                         AND creation_date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) as lastMonth
                `, [serviceId, serviceId]);

                const thisMonth = trendRows[0]?.thisMonth || 0;
                const lastMonth = trendRows[0]?.lastMonth || 1;
                const trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

                // Get sparkline data (last 7 days)
                const [sparkRows] = await dbHots.promise().query(`
                    SELECT DATE(creation_date) as date, COUNT(*) as value
                    FROM t_ticket 
                    WHERE service_id = ?
                    AND creation_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
                    GROUP BY DATE(creation_date)
                    ORDER BY date
                `, [serviceId]);

                return res.json({
                    success: true,
                    type: 'ticket',
                    data: {
                        total: statsRows[0]?.total || 0,
                        pending: statsRows[0]?.pending || 0,
                        approved: statsRows[0]?.approved || 0,
                        rejected: statsRows[0]?.rejected || 0,
                        trend: trend,
                        trendDirection: trend > 3 ? 'up' : trend < -3 ? 'down' : 'neutral',
                        sparklineData: sparkRows.map(r => ({ value: r.value }))
                    }
                });
            }

            // EORDER type - fetch from iod.m_order
            if (configType === 'eorder') {
                const { dbConf } = require("../../config/db");

                try {
                    const [orderStats] = await dbConf.promise().query(`
                        SELECT 
                            COUNT(*) as total,
                            SUM(CASE WHEN status IN ('pending', 'confirmed') THEN 1 ELSE 0 END) as pending,
                            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed,
                            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                        FROM iod.m_order
                        WHERE YEAR(po_date) = YEAR(CURRENT_DATE)
                    `);

                    return res.json({
                        success: true,
                        type: 'eorder',
                        data: {
                            total: orderStats[0]?.total || 0,
                            pending: orderStats[0]?.pending || 0,
                            approved: orderStats[0]?.completed || 0,
                            rejected: orderStats[0]?.cancelled || 0,
                            trend: 0,
                            trendDirection: 'neutral',
                            sparklineData: []
                        }
                    });
                } catch (err) {
                    console.warn('E-Order query failed:', err.message);
                    return res.json({ success: true, type: 'eorder', data: null });
                }
            }

            // Unknown type - return null
            return res.json({ success: true, type: configType, data: null });

        } catch (err) {
            console.error("Error fetching card summary:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

}