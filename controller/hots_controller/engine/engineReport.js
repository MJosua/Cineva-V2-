/**
 * controller/engine/engineReport.js
 */

const { reportingEngine } = require('../../../core/init-engines');

module.exports = {
    getReport: async (req, res) => {
        try {
            const { service_id } = req.params;
            const { status_id, start_date, end_date, limit, page, columns } = req.query;
            if (!service_id) return res.status(400).json({ ok: false, error: 'service_id is required' });
            const filters = { status_id: status_id ? parseInt(status_id) : undefined, start_date, end_date };
            const options = { limit: limit ? parseInt(limit) : 20, page: page ? parseInt(page) : 1, columns: columns ? columns.split(',') : [] };
            const result = await reportingEngine.getReportData(service_id, filters, options);
            res.json({ ok: true, data: result });
        } catch (error) {
            console.error('[EngineReport] Error:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    updateReport: async (req, res) => {
        try {
            const { ticket_id, field_name, value, detail_id, service_id } = req.body;
            const user_id = req.dataToken?.user_id || null;
            await reportingEngine.updateReportField({ ticket_id, service_id, field_name, value, user_id, entity_id: detail_id });
            res.json({ ok: true });
        } catch (error) {
            console.error('[EngineReport][Update] Error:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/report/suggest
     *
     * Reads all t_ticket_work_data_report entries for a given assignment's ticket,
     * then builds a tree-structured narrative summary for posting to the timeline.
     *
     * Also returns individual card report entries in `card_reports` for the
     * AssignmentTimeline "card report" section.
     */
    suggestReport: async (req, res) => {
        const { dbHots } = require('../../../config/db');
        try {
            const { ticket_id, assignment_id } = req.body;

            console.log(`📊 [SUGGEST_REPORT] Called with ticket_id=${ticket_id}, assignment_id=${assignment_id}`);

            if (!ticket_id && !assignment_id) {
                return res.status(400).json({ ok: false, error: 'ticket_id or assignment_id required' });
            }

            const connection = await dbHots.promise().getConnection();
            try {
                // Resolve ticket_id from assignment_id if not provided
                let resolvedTicketId = ticket_id;
                if (!resolvedTicketId && assignment_id) {
                    const [[ta]] = await connection.query(
                        'SELECT ticket_id FROM t_ticket_assignment WHERE id = ? LIMIT 1',
                        [assignment_id]
                    );
                    resolvedTicketId = ta?.ticket_id;
                    console.log(`📊 [SUGGEST_REPORT] Resolved ticket_id=${resolvedTicketId} from assignment_id=${assignment_id}`);
                }

                if (!resolvedTicketId) {
                    return res.status(400).json({ ok: false, error: 'Could not resolve ticket_id' });
                }

                // 1. Get all task env rows (for tree structure + status)
                const [envRows] = await connection.query(`
                    SELECT e.entity_id, e.parent_entity_id, e.depth, e.sort_order, e.status,
                           MAX(CASE WHEN wd.field_name = 'title' THEN wd.field_value END) as title,
                           MAX(CASE WHEN wd.field_name = 'priority' THEN wd.field_value END) as priority
                    FROM t_ticket_work_data_env e
                    LEFT JOIN t_ticket_work_data wd
                        ON wd.entity_id COLLATE utf8mb4_unicode_ci = e.entity_id COLLATE utf8mb4_unicode_ci
                        AND wd.data_type = 'task'
                    WHERE e.ticket_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
                    GROUP BY e.entity_id, e.parent_entity_id, e.depth, e.sort_order, e.status
                    ORDER BY e.depth ASC, e.sort_order ASC
                `, [resolvedTicketId]);

                console.log(`📊 [SUGGEST_REPORT] Found ${envRows.length} task env rows for ticket ${resolvedTicketId}`);

                // 2. Get all report entries from t_ticket_work_data_report for this ticket
                const [reportEntries] = await connection.query(`
                    SELECT r.entity_id, r.content, r.created_at, CONCAT(u.firstname, ' ', u.lastname) as author_name
                    FROM t_ticket_work_data_report r
                    LEFT JOIN user u ON u.user_id = r.created_by
                    WHERE r.ticket_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
                      AND r.deleted_at IS NULL
                    ORDER BY r.created_at ASC
                `, [resolvedTicketId]);

                console.log(`📊 [SUGGEST_REPORT] Found ${reportEntries.length} report entries from t_ticket_work_data_report`);

                // 3. Map reports by entity_id
                const reportsByEntity = {};
                for (const entry of reportEntries) {
                    if (!reportsByEntity[entry.entity_id]) reportsByEntity[entry.entity_id] = [];
                    reportsByEntity[entry.entity_id].push(entry);
                }

                // 4. Get assignment title
                let ticketTitle = 'Assignment';
                const [[ticketRow]] = await connection.query(
                    `SELECT ta.title FROM t_ticket_assignment ta WHERE ta.ticket_id = ? ORDER BY ta.id DESC LIMIT 1`,
                    [resolvedTicketId]
                );
                if (ticketRow) ticketTitle = ticketRow.title || 'Assignment';

                // 5. Stats
                const total = envRows.length;
                const done = envRows.filter(t => t.status === 'done').length;
                const inProgress = envRows.filter(t => t.status === 'in_progress').length;
                const todo = envRows.filter(t => t.status === 'todo').length;
                const completion = total > 0 ? Math.round((done / total) * 100) : 0;
                const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

                // 6. Build tree narrative
                const lines = [];
                lines.push(`<h3>📋 Status Report — ${ticketTitle}</h3>`);
                lines.push(`<p><em>${today}</em></p>`);
                lines.push(`<p>Progress: <strong>${done}/${total}</strong> tasks completed (${completion}%). 🔄 In Progress: ${inProgress} &nbsp; ⬜ Todo: ${todo}</p>`);

                if (total > 0) {
                    const rootTasks = envRows.filter(t => !t.parent_entity_id);
                    const childrenOf = (parentId) => envRows.filter(t => t.parent_entity_id === parentId);

                    const renderTask = (task, indent = 0) => {
                        const statusEmoji = task.status === 'done' ? '✅' : task.status === 'in_progress' ? '🔄' : '⬜';
                        const prefix = indent > 0 ? '&nbsp;'.repeat(indent * 4) + '└ ' : '';
                        const priority = task.priority ? ` <em>[${task.priority.toUpperCase()}]</em>` : '';
                        lines.push(`<p>${prefix}${statusEmoji} <strong>${task.title || 'Untitled'}${priority}</strong></p>`);

                        const entries = reportsByEntity[task.entity_id] || [];
                        entries.forEach(entry => {
                            const stripped = entry.content.replace(/<[^>]*>/g, '').trim();
                            if (stripped) {
                                lines.push(`<p>${'&nbsp;'.repeat((indent + 1) * 4)}📝 <em>${stripped}</em></p>`);
                            }
                        });

                        childrenOf(task.entity_id).forEach(child => renderTask(child, indent + 1));
                    };

                    lines.push('<hr/>');
                    rootTasks.forEach(task => renderTask(task, 0));
                    const cardsWithReports = envRows.filter(t => (reportsByEntity[t.entity_id] || []).length > 0).length;
                    lines.push(`<hr/><p><small>${cardsWithReports}/${total} cards have written reports. Total entries: ${reportEntries.length}</small></p>`);
                } else {
                    lines.push(`<p>No tasks have been created yet.</p>`);
                }

                const narrative_text = lines.join('\n');
                const snapshot_meta_json = {
                    total, done, in_progress: inProgress, todo,
                    completion_pct: completion,
                    scraped_at: new Date().toISOString(),
                    total_report_entries: reportEntries.length
                };

                console.log(`✅ [SUGGEST_REPORT] Generated for ticket ${resolvedTicketId}: ${done}/${total} done, ${reportEntries.length} entries`);
                return res.json({ ok: true, narrative_text, snapshot_meta_json, card_reports: reportEntries });

            } finally {
                connection.release();
            }
        } catch (e) {
            console.error('[SUGGEST_REPORT] Error:', e);
            return res.status(500).json({ ok: false, error: e.message });
        }
    },

    /**
     * GET /engine/report/card-reports/:assignmentId
     * Returns ALL task report entries for an assignment, sorted by date,
     * for the Activity tab "Card Reports" section.
     */
    getCardReports: async (req, res) => {
        const { dbHots } = require('../../../config/db');
        try {
            const { assignmentId } = req.params;
            const [rows] = await dbHots.promise().query(`
                SELECT r.id, r.entity_id, r.content, r.created_at, r.updated_at,
                       CONCAT(u.firstname, ' ', u.lastname) as author_name,
                       MAX(CASE WHEN wd.field_name = 'title' THEN wd.field_value END) as task_title,
                       e.status as task_status, e.depth
                FROM t_ticket_work_data_report r
                LEFT JOIN user u ON u.user_id = r.created_by
                LEFT JOIN t_ticket_work_data_env e ON e.entity_id COLLATE utf8mb4_unicode_ci = r.entity_id COLLATE utf8mb4_unicode_ci
                LEFT JOIN t_ticket_work_data wd
                    ON wd.entity_id COLLATE utf8mb4_unicode_ci = r.entity_id COLLATE utf8mb4_unicode_ci
                    AND wd.field_name = 'title' AND wd.data_type = 'task'
                WHERE r.assignment_id = ? AND r.deleted_at IS NULL
                GROUP BY r.id, r.entity_id, r.content, r.created_at, r.updated_at,
                         u.firstname, u.lastname, e.status, e.depth
                ORDER BY r.created_at DESC
            `, [assignmentId]);

            res.json({ ok: true, reports: rows });
        } catch (e) {
            console.error('[CARD_REPORTS][GET_ALL]', e);
            res.status(500).json({ ok: false, error: e.message });
        }
    }
};
