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
            const [rows] = await dbHots.promise().query(
                `SELECT * FROM t_ticket_report WHERE ticket_id = ? AND is_active = 1`,
                [ticket_id]
            );
            res.json({ success: true, data: rows });
        } catch (err) {
            console.error("Error fetching report details:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 🔹 Add or update remark (based on lbl_col)
    // controller/hots_controller/hotsDashboardController.js

    upsertReportDetail: async (req, res) => {
        console.log("Trying to do upsert");

        try {
            const {
                ticket_id,
                detail_id,
                lbl_col,
                cstm_col,
                color_code,
                visible_to,
            } = req.body;

            const user_id = req.dataToken?.user_id || "system";

            if (!ticket_id || !detail_id || !lbl_col) {
                return res.status(400).json({
                    success: false,
                    message: "Missing ticket_id, detail_id, or lbl_col",
                });
            }

            const [existing] = await dbHots
                .promise()
                .query(
                    `SELECT report_detail_id FROM hots.t_ticket_report 
           WHERE ticket_id = ? AND detail_id = ? AND lbl_col = ?`,
                    [ticket_id, detail_id, lbl_col]
                );

            if (existing.length > 0) {
                // ✅ Update existing record
                await dbHots.promise().query(
                    `UPDATE hots.t_ticket_report 
           SET cstm_col=?, color_code=?, remark_by=?, remark_date=NOW(), visible_to=?, is_active=1
           WHERE ticket_id=? AND detail_id=? AND lbl_col=?`,
                    [
                        cstm_col,
                        color_code,
                        user_id,
                        visible_to || "admin",
                        ticket_id,
                        detail_id,
                        lbl_col,
                    ]
                );

                console.log("🟡 Updated existing report detail:", { detail_id, lbl_col });
            } else {
                // ✅ Insert new record
                await dbHots.promise().query(
                    `INSERT INTO hots.t_ticket_report
           (ticket_id, detail_id, lbl_col, cstm_col, color_code, visible_to, remark_by, remark_date, is_active)
           VALUES (?,?,?,?,?,?,?,NOW(),1)`,
                    [
                        ticket_id,
                        detail_id,
                        lbl_col,
                        cstm_col,
                        color_code || null,
                        visible_to || "admin",
                        user_id,
                    ]
                );

                console.log("🟢 Inserted new report detail:", { detail_id, lbl_col });
            }

            res.json({ success: true, message: "Report detail saved successfully" });
        } catch (err) {
            console.error("❌ Error saving report detail:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    },



}