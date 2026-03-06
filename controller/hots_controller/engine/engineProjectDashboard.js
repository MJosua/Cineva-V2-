/**
 * controller/hots_controller/engine/engineProjectDashboard.js
 * Controller for Project Dashboard features (IT Project, etc.)
 * Optimized and aligned with project standards (Refrence Folder)
 */

const { dbHots } = require('../../../config/db');
const engineTicket = require('./engineTicket');

let yellowTerminal = "\x1b[33m";

// 🧩 Safe parser that supports both MySQL JSON type & text JSON
const safeParseJSON = (value, fallback = {}) => {
    if (typeof value === 'object' && value !== null) return value;
    if (!value || value === "null" || value === "") return fallback;
    try {
        return JSON.parse(value);
    } catch (err) {
        console.warn("⚠️ Invalid JSON found in project snapshot:", value);
        return fallback;
    }
};

const EngineProjectDashboard = {
    /**
     * Proxy to standard engine create for ticket/project creation
     */
    async createProject(req, res) {
        return engineTicket.create(req, res);
    },

    /**
     * GET /engine/project/list/:service_id
     * List projects with basic metrics and risk-level calculated on-the-fly
     */
    async listProjects(req, res) {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { service_id } = req.params;
            const { page = 1, limit = 10, status_id, search = '', sort = 'active_first' } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            let filterQuery = '';
            const params = [Number(service_id)];

            if (status_id && status_id !== 'all') {
                filterQuery += ' AND t.status_id = ?';
                params.push(Number(status_id));
            }

            if (search) {
                filterQuery += ` AND (t.ticket_id LIKE ? OR t.title LIKE ? OR u.firstname LIKE ?)`;
                const searchParam = `%${search}%`;
                params.push(searchParam, searchParam, searchParam);
            }

            // ... (count query remains same) ...

            let orderBy = 't.creation_date DESC';
            if (sort === 'active_first') {
                orderBy = '(CASE WHEN t.status_id = 1 THEN 1 ELSE 0 END) ASC, t.creation_date DESC';
            } else if (sort === 'newest') {
                orderBy = 't.creation_date DESC';
            } else if (sort === 'oldest') {
                orderBy = 't.creation_date ASC';
            }

            // Get total count for pagination
            const countQuery = `
                SELECT COUNT(*) as total
                FROM t_ticket t
                LEFT JOIN user u ON t.created_by = u.user_id
                WHERE t.service_id = ? ${filterQuery}
            `;
            const [countRows] = await dbHots.promise().query(countQuery, params);
            const totalRecords = countRows[0].total;

            // Step 1: Fetch only ticket IDs with sorting and pagination (Fast & memory efficient)
            const idQuery = `
                SELECT t.ticket_id
                FROM t_ticket t
                LEFT JOIN user u ON t.created_by = u.user_id
                WHERE t.service_id = ? ${filterQuery}
                ORDER BY ${orderBy}
                LIMIT ? OFFSET ?
            `;
            const idParams = [...params, Number(limit), Number(offset)];
            const [idRows] = await dbHots.promise().query(idQuery, idParams);

            if (!idRows.length) {
                return res.json({
                    success: true,
                    data: [],
                    pagination: { total: totalRecords, page: Number(page), limit: Number(limit) }
                });
            }

            const ticketIds = idRows.map(r => r.ticket_id);

            // Step 2: Fetch full details for only the selected IDs (No sorting needed here)
            const query = `
                SELECT 
                    t.ticket_id, t.service_id, t.status_id, t.creation_date, t.last_update, t.title as project_title,
                    t.json_snapshot as form_data,
                    u.firstname as creator_name,
                    s.status_name,
                    at.total_assignments,
                    at.completed_assignments
                FROM t_ticket t
                LEFT JOIN user u ON t.created_by = u.user_id
                LEFT JOIN m_service_status s ON t.status_id = s.status_id
                LEFT JOIN (
                    SELECT 
                        ticket_id, 
                        COUNT(*) as total_assignments,
                        SUM(CASE WHEN assignment_status = 'completed' THEN 1 ELSE 0 END) as completed_assignments
                    FROM t_ticket_assignment
                    WHERE ticket_id IN (?)
                    GROUP BY ticket_id
                ) at ON t.ticket_id = at.ticket_id
                WHERE t.ticket_id IN (?)
                ORDER BY FIELD(t.ticket_id, ${ticketIds.map(id => `'${id}'`).join(',')})
            `;

            const [rows] = await dbHots.promise().query(query, [ticketIds, ticketIds]);
            const [ebvRows] = await dbHots.promise().query(
                "SELECT ticket_id, lbl_col, value FROM t_ticket_detail WHERE ticket_id IN (?)",
                [ticketIds]
            );

            // Group EAV rows by ticket_id for easy lookup
            const metaMap = ebvRows.reduce((acc, row) => {
                if (!acc[row.ticket_id]) acc[row.ticket_id] = {};
                const key = row.lbl_col.toLowerCase().replace(/\s+/g, '_');
                acc[row.ticket_id][key] = row.value;
                return acc;
            }, {});

            const projects = rows.map(r => {
                const snapshotData = safeParseJSON(r.form_data);
                const eavData = metaMap[r.ticket_id] || {};
                const formData = { ...eavData, ...snapshotData };

                const totalA = r.total_assignments || 0;
                const completedA = r.completed_assignments || 0;
                const completionPercent = totalA > 0 ? Math.round((completedA / totalA) * 100) : 0;

                let daysRemaining = null;
                const targetDate = formData.target_date || formData.targetdate;

                if (targetDate) {
                    const target = new Date(targetDate);
                    const comparisonDate = r.status_id === 1 ? new Date(r.last_update) : new Date();
                    target.setHours(0, 0, 0, 0);
                    comparisonDate.setHours(0, 0, 0, 0);
                    daysRemaining = Math.ceil((target - comparisonDate) / (1000 * 60 * 60 * 24));
                }

                let riskLevel = 'none';
                if (r.status_id !== 1) {
                    if (daysRemaining !== null) {
                        if (daysRemaining < 0) riskLevel = 'high';
                        else if (daysRemaining <= 3) riskLevel = 'high';
                        else if (daysRemaining <= 7) riskLevel = 'medium';
                        else riskLevel = 'low';
                    }
                } else {
                    if (daysRemaining !== null && daysRemaining < 0) riskLevel = 'low';
                }

                return {
                    ...r,
                    project_title: r.project_title || formData.project_title || r.title,
                    project_description: formData.project_description,
                    form_data: formData,
                    completion_percent: completionPercent,
                    days_remaining: daysRemaining,
                    risk_level: riskLevel,
                    priority: formData.priority || 'medium'
                };
            });

            console.log(timestamp, `GET List Projects SUCCESS | service_id=${service_id}, page=${page}, count=${projects.length}`);
            return res.json({
                success: true,
                data: projects,
                pagination: {
                    total: totalRecords,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(totalRecords / Number(limit))
                }
            });
        } catch (err) {
            console.error(timestamp + 'listProjects error:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /engine/project/summary/:service_id
     * Returns service info and consolidated project counts
     */
    async dashboardSummary(req, res) {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { service_id } = req.params;
            const company_id = req.dataToken?.company_id || 1;

            console.time(timestamp + "ProjectSummaryQueries");

            // 🔥 OPTIMIZATION: Run independent queries in parallel
            const [serviceResult, summaryResult] = await Promise.all([
                dbHots.promise().query(
                    'SELECT service_id, service_name, service_description FROM m_service WHERE service_id = ?',
                    [service_id]
                ),
                dbHots.promise().query(
                    `SELECT 
                        COUNT(*) as total_projects,
                        SUM(CASE WHEN t.status_id = 1 THEN 1 ELSE 0 END) as fulfilled,
                        SUM(CASE WHEN t.status_id = 3 THEN 1 ELSE 0 END) as in_progress,
                        SUM(CASE WHEN t.status_id = 2 OR t.status_id = 0 THEN 1 ELSE 0 END) as submitted,
                        SUM(CASE WHEN t.status_id = 7 OR t.status_id = 4 THEN 1 ELSE 0 END) as rejected
                    FROM t_ticket t
                    WHERE t.service_id = ?`,
                    [service_id]
                )
            ]);

            console.timeEnd(timestamp + "ProjectSummaryQueries");

            const svcRows = serviceResult[0];
            const summaryRows = summaryResult[0];

            if (!svcRows.length) {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }

            console.log(timestamp, `GET Project Summary SUCCESS | service_id=${service_id}`);
            return res.json({
                success: true,
                service: svcRows[0],
                summary: summaryRows[0] || { total_projects: 0, fulfilled: 0, in_progress: 0, submitted: 0, rejected: 0 }
            });
        } catch (err) {
            console.error(timestamp + 'dashboardSummary error:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * PATCH /engine/project/priority
     * Specialized update for project priority (stored in json_snapshot)
     */
    async updatePriority(req, res) {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const { ticket_id, priority } = req.body;
            const user_id = req.dataToken?.user_id || null;

            const [rows] = await dbHots.promise().query('SELECT json_snapshot FROM t_ticket WHERE ticket_id = ?', [ticket_id]);

            if (!rows.length) return res.status(404).json({ success: false, error: 'Ticket not found' });

            const snapshot = safeParseJSON(rows[0].json_snapshot);
            snapshot.priority = priority;

            // Atomic update of snapshot and timing
            await dbHots.promise().query(
                'UPDATE t_ticket SET json_snapshot = ?, last_update = NOW() WHERE ticket_id = ?',
                [JSON.stringify(snapshot), ticket_id]
            );

            // Sync with historical/meta tables if needed
            await dbHots.promise().query(
                "UPDATE hots.t_ticket_detail SET value = ? WHERE ticket_id = ? AND cstm_col = 'priority'",
                [priority, ticket_id]
            );

            console.log(timestamp, `PATCH Update Priority SUCCESS | ticket_id=${ticket_id}, priority=${priority}`);
            return res.json({ success: true });
        } catch (err) {
            console.error(timestamp + 'updatePriority error:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /engine/project/service-list
     */
    async listProjectServices(req, res) {
        try {
            const [rows] = await dbHots.promise().query(
                "SELECT service_id, service_name FROM m_service WHERE service_name LIKE '%Project%' OR service_id IN (23)"
            );
            return res.json({ success: true, data: rows });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = EngineProjectDashboard;
