// controller/engine/engineAssignment.js
const { dbHots } = require('../../config/db');
const triggerEngine = require('../../core/trigger-engine');

/**
 * Helper: Generate custom ticket ID
 */
async function generateCustomTicketID(db, service_id, user_id) {
    const year = new Date().getFullYear().toString().slice(-2);
    const service = String(service_id).padStart(2, "0");
    const user = String(user_id).padStart(4, "0");

    const [rows] = await db.promise().query(
        `SELECT ticket_id 
         FROM t_ticket 
         WHERE ticket_id LIKE ? 
         ORDER BY ticket_id DESC 
         LIMIT 1`,
        [`${year}${service}${user}%`]
    );

    let running = "0001";
    if (rows.length > 0) {
        const last = rows[0].ticket_id.toString();
        const lastRun = parseInt(last.slice(-4)) || 0;
        running = String(lastRun + 1).padStart(4, "0");
    }

    return `${year}${service}${user}${running}`;
}

/**
 * Helper: Notify all stakeholders of an assignment update (Creator, Assignees, Actor)
 */
async function notifyAssignmentStakeholders(assignmentId, userId, eventType, data, options = {}) {
    if (!global.sseManager) return;

    try {
        const [stakeholders] = await dbHots.promise().query(`
            SELECT DISTINCT user_id FROM (
                -- Creator
                SELECT t.created_by as user_id 
                FROM t_ticket_assignment ta
                JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                WHERE ta.id = ?
                UNION
                -- Current Assignee (User)
                SELECT assigned_id as user_id FROM t_ticket_assignment WHERE id = ? AND assigned_type = 'user'
                UNION
                -- Team Members (if assigned to team)
                SELECT tm.user_id 
                FROM t_ticket_assignment tta
                JOIN m_team_member tm ON tm.team_id = tta.assigned_id
                WHERE tta.id = ? AND tta.assigned_type = 'team'
                UNION
                -- Current Actor (to sync other tabs)
                SELECT ? as user_id
            ) AS all_users
            WHERE user_id IS NOT NULL
        `, [assignmentId, assignmentId, assignmentId, userId]);

        const recipientIds = stakeholders.map(s => s.user_id);
        if (recipientIds.length > 0) {
            // Get some context for the notification
            const [info] = await dbHots.promise().query(
                `SELECT s.service_name, t.ticket_id,
                        CONCAT(u.firstname, ' ', u.lastname) as updater_name
                 FROM t_ticket_assignment ta
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 LEFT JOIN m_service s ON s.service_id = t.service_id
                 LEFT JOIN user u ON u.user_id = ?
                 WHERE ta.id = ? LIMIT 1`,
                [userId, assignmentId]
            );

            const updaterName = info[0]?.updater_name || 'Someone';
            const serviceName = info[0]?.service_name || 'Assignment';
            const ticketId = info[0]?.ticket_id;

            const finalData = {
                ...data,
                assignmentId,
                ticketId,
                updater_name: updaterName,
                service_name: serviceName,
                timestamp: new Date().toISOString()
            };

            // If title/message not provided in options, generate defaults if it's a notification-worthy event
            const finalOptions = { ...options };
            if (options.notify) {
                // Determine a specific title based on action if available
                let defaultTitle = `📌 Assignment Update - #${ticketId} ${serviceName}`;
                if (data.action === 'task_created') defaultTitle = `📌 New Task - #${ticketId} ${serviceName}`;
                else if (data.action === 'task_status_change' || data.action === 'task_updated') defaultTitle = `📌 Task Update - #${ticketId} ${serviceName}`;
                else if (data.action === 'timeline_update') defaultTitle = `📋 Timeline Update - #${ticketId} ${serviceName}`;

                finalOptions.title = options.title || defaultTitle;

                // Construct a rich message
                let defaultMessage = `${updaterName} updated the assignment.`;
                if (data.action === 'task_status_change' && data.updates?.status) {
                    defaultMessage = `Task moved to ${data.updates.status.replace('_', ' ')} by ${updaterName}`;
                } else if (data.action === 'timeline_update') {
                    defaultMessage = `"${data.content.substring(0, 30)}${data.content.length > 30 ? '...' : ''}" by ${updaterName}`;
                } else if (data.action === 'task_created') {
                    defaultMessage = `Task "${data.title}" added by ${updaterName}`;
                }

                finalOptions.message = options.message || defaultMessage;
            }

            // Provide URL for clicking
            finalData.url = `/ticket/${ticketId}`; // Generic ticket URL

            await global.sseManager.emitToUsers(recipientIds, eventType, finalData, finalOptions);
        }
    } catch (error) {
        console.error('Error in notifyAssignmentStakeholders:', error);
    }
}

/**
 * Controller for assignment management
 */

module.exports = {
    /**
     * GET /engine/my-assignments
     * Get current user's assignments
     */
    getMyAssignments: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;
            const { status } = req.query;

            // 🧠 Refined Query: Join with work_data to calculate overdue status based on tasks OR 7-day fallback
            // And aggregate task summaries (count of todo/in_progress)
            let query = `
        SELECT 
          ta.id as assignment_id,
          ta.ticket_id,
          ta.assigned_type,
          ta.assigned_id,
          ta.assigned_at,
          ta.assignment_status,
          ta.notes,
          t.title as ticket_title,
          t.service_id,
          t.service_name,
          t.status_id as ticket_status,
          s.service_name as service_display_name,
          -- 🛠️ Refined Overdue Logic: pick latest values from duplicates
          (
            SELECT COUNT(*) FROM (
                SELECT 
                    MAX(CASE WHEN field_name = 'status' THEN field_value END) as status,
                    MAX(CASE WHEN field_name = 'due_date' THEN field_value END) as due_date
                FROM (
                    SELECT entity_id, field_name, field_value
                    FROM t_ticket_work_data twd_ov 
                    WHERE twd_ov.assignment_id = ta.id AND twd_ov.data_type = 'task'
                    AND twd_ov.id = (SELECT MAX(id) FROM t_ticket_work_data t_sub WHERE t_sub.entity_id = twd_ov.entity_id AND t_sub.field_name = twd_ov.field_name)
                ) latest_fields_ov
                GROUP BY entity_id
            ) tasks
            WHERE status != 'done'
              AND due_date IS NOT NULL AND due_date != ''
              AND (
                (due_date LIKE '%-%-%' AND STR_TO_DATE(due_date, '%Y-%m-%d') <= CURDATE())
                OR (due_date LIKE '%/%/%' AND STR_TO_DATE(due_date, '%m/%d/%Y') <= CURDATE())
              )
          ) as overdue_task_count,
          (
            EXISTS (
                SELECT 1 FROM (
                    SELECT 
                        MAX(CASE WHEN field_name = 'status' THEN field_value END) as status,
                        MAX(CASE WHEN field_name = 'due_date' THEN field_value END) as due_date
                    FROM (
                        SELECT entity_id, field_name, field_value
                        FROM t_ticket_work_data twd_ov 
                        WHERE twd_ov.assignment_id = ta.id AND twd_ov.data_type = 'task'
                        AND twd_ov.id = (SELECT MAX(id) FROM t_ticket_work_data t_sub WHERE t_sub.entity_id = twd_ov.entity_id AND t_sub.field_name = twd_ov.field_name)
                    ) latest_fields_ov2
                    GROUP BY entity_id
                ) tasks_ex
                WHERE status != 'done'
                  AND due_date IS NOT NULL AND due_date != ''
                  AND (
                    (due_date LIKE '%-%-%' AND STR_TO_DATE(due_date, '%Y-%m-%d') <= CURDATE())
                    OR (due_date LIKE '%/%/%' AND STR_TO_DATE(due_date, '%m/%d/%Y') <= CURDATE())
                  )
            )
          ) as is_overdue,
          -- 📋 Task Summary (JSON) - Fixed to pick latest field versions and avoid cross-join ballooning
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('title', title, 'status', status))
            FROM (
              SELECT 
                entity_id,
                MAX(CASE WHEN field_name = 'title' THEN field_value END) as title,
                MAX(CASE WHEN field_name = 'status' THEN field_value END) as status
              FROM (
                  -- Inner subquery to pick the LATEST row for each field per entity
                  SELECT twd_inner.entity_id, twd_inner.field_name, twd_inner.field_value
                  FROM t_ticket_work_data twd_inner
                  WHERE twd_inner.assignment_id = ta.id AND twd_inner.data_type = 'task'
                  AND twd_inner.id = (
                     SELECT MAX(id) 
                     FROM t_ticket_work_data twd_max 
                     WHERE twd_max.entity_id = twd_inner.entity_id 
                       AND twd_max.field_name = twd_inner.field_name
                  )
              ) latest_fields
              GROUP BY entity_id
            ) latest_tasks
            WHERE status IN ('todo', 'in_progress')
          ) as task_preview
        FROM t_ticket_assignment ta
        LEFT JOIN t_ticket t ON ta.ticket_id = t.ticket_id
        LEFT JOIN m_service s ON t.service_id = s.service_id
        WHERE ta.assignment_status != 'cancelled'
          AND (
            (ta.assigned_type = 'user' AND ta.assigned_id = ?)
            OR (ta.assigned_type = 'team' AND ta.assigned_id IN (
              SELECT team_id FROM m_team_member WHERE user_id = ?
            ))
          )
      `;

            const params = [user_id, user_id];

            if (status) {
                query += ' AND ta.assignment_status = ?';
                params.push(status);
            }

            query += ' ORDER BY ta.assigned_at DESC';

            const [assignments] = await dbHots.promise().query(query, params);

            // Parse JSON fields if necessary (mysql2 sometimes returns strings)
            const processed = assignments.map(a => ({
                ...a,
                is_overdue: !!a.is_overdue,
                task_preview: typeof a.task_preview === 'string' ? JSON.parse(a.task_preview) : (a.task_preview || [])
            }));

            res.json({
                ok: true,
                assignments: processed,
                count: processed.length
            });
        } catch (error) {
            console.error('Error fetching assignments:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * GET /engine/my-assignments/count
     * Get count of active assignments for badge
     */
    getMyAssignmentCount: async (req, res) => {
        try {
            const user_id = req.dataToken.user_id;

            const [rows] = await dbHots.promise().query(`
        SELECT COUNT(*) as assignment_count
        FROM t_ticket_assignment ta
        WHERE
        ta.assignment_status = 'active'  
        AND
        (
            (ta.assigned_type = 'user' AND ta.assigned_id = ?)
            OR (ta.assigned_type = 'team' AND ta.assigned_id IN (
              SELECT team_id FROM m_team_member WHERE user_id = ?
            ))
          )
      `, [user_id, user_id]);

            res.json({ count: rows[0].assignment_count || 0 });

        } catch (error) {
            console.error('Error fetching assignment count:', error);
            res.status(500).json({ count: 0, error: error.message });
        }
    },

    /**
     * GET /engine/assignment/:assignmentId
     * Get assignment details
     */
    getAssignmentDetail: async (req, res) => {
        try {
            const { assignmentId } = req.params;
            const user_id = req.dataToken.user_id;

            const [assignments] = await dbHots.promise().query(`
        SELECT 
          ta.*,
          t.title as ticket_title,
          t.service_id,
          t.service_name,
          t.status_id as ticket_status,
          t.created_by as ticket_creator,
          s.service_name as service_display_name,
          s.assignment_config
        FROM t_ticket_assignment ta
        LEFT JOIN t_ticket t ON ta.ticket_id = t.ticket_id
        LEFT JOIN m_service s ON t.service_id = s.service_id
        WHERE ta.id = ?
      `, [assignmentId]);

            if (!assignments.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const assignment = assignments[0];

            // Verify user has access
            const hasAccess = (
                (assignment.assigned_type === 'user' && assignment.assigned_id == user_id) ||
                (assignment.assigned_type === 'team' && await checkTeamMembership(user_id, assignment.assigned_id))
            );

            if (!hasAccess) {
                return res.status(403).json({ ok: false, error: 'Access denied' });
            }

            res.json({ ok: true, assignment });

        } catch (error) {
            console.error('Error fetching assignment detail:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/assignment/:assignmentId/complete
     * Complete an assignment
     */
    completeAssignment: async (req, res) => {
        try {
            const { assignmentId } = req.params;
            const { completion_note, completion_data } = req.body;
            const user_id = req.dataToken.user_id;
            const user_name = `${req.dataToken.firstname || ''} ${req.dataToken.lastname || ''}`.trim() || 'Someone';

            // Get assignment details with service_id, title, and service_name
            const [assignments] = await dbHots.promise().query(
                `SELECT ta.*, ta.title as assignment_title, t.service_id, t.created_by,
                        s.service_name
                 FROM t_ticket_assignment ta
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 LEFT JOIN m_service s ON s.service_id = t.service_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignments.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const assignment = assignments[0];

            // Update assignment status
            await dbHots.promise().query(
                `UPDATE t_ticket_assignment 
         SET assignment_status = 'completed', unassigned_at = NOW()
         WHERE id = ?`,
                [assignmentId]
            );

            // Check if all assignments for this ticket are complete
            const [remaining] = await dbHots.promise().query(
                `SELECT COUNT(*) as count FROM t_ticket_assignment 
         WHERE ticket_id = ? AND assignment_status = 'active'`,
                [assignment.ticket_id]
            );

            // If no more active assignments, update ticket status to Fulfilled (2)
            if (remaining[0].count === 0) {
                await dbHots.promise().query(
                    'UPDATE t_ticket SET status_id = 1 WHERE ticket_id = ?',
                    [assignment.ticket_id]
                );
            }

            console.log(`✅ [ASSIGNMENT] Assignment ${assignmentId} completed by user ${user_id}`);

            // 🆕 RESPOND IMMEDIATELY (non-blocking)
            res.json({
                ok: true,
                message: 'Assignment completed successfully',
                all_assignments_complete: remaining[0].count === 0
            });

            // 🆕 ASYNC: Run completion triggers (fire-and-forget with notification)
            if (global.sseManager && assignment.created_by) {
                // Create "processing" notification for trigger execution
                const notifId = await global.sseManager.emitToUser(assignment.created_by, 'doc_generation_started', {
                    assignmentId,
                    ticketId: assignment.ticket_id,
                    message: 'Processing completion triggers...'
                }, { persist: true, title: '⏳ Processing...', message: 'Running completion actions' });

                // Fire triggers async
                triggerEngine.runTriggersForEvent(
                    assignment.service_id,
                    'on_assignment_complete',
                    {
                        assignmentId,
                        ticketId: assignment.ticket_id,
                        actor: { user_id },
                        completion_data
                    }
                ).then(() => {
                    // Update notification to success
                    if (notifId?.notificationId) {
                        global.sseManager.updateNotification(notifId.notificationId, {
                            type: 'doc_generation_complete',
                            title: '✅ Processing Complete',
                            message: 'All completion actions finished'
                        });
                    }
                    // Emit completion SSE
                    global.sseManager.emitToUser(assignment.created_by, 'assignment_update', {
                        assignmentId,
                        ticketId: assignment.ticket_id,
                        action: 'completed',
                        allComplete: remaining[0].count === 0,
                        assignment_title: assignment.assignment_title || 'Assignment',
                        service_name: assignment.service_name,
                        actor_name: user_name,
                        timestamp: new Date().toISOString()
                    }, {
                        persist: true,
                        title: '✅ Assignment Complete',
                        message: `${user_name} completed ${assignment.assignment_title || 'assignment'}`
                    });
                }).catch(err => {
                    console.error('Trigger execution error:', err);
                    // Update notification to error
                    if (notifId?.notificationId) {
                        global.sseManager.updateNotification(notifId.notificationId, {
                            type: 'assignment_update',
                            title: '⚠️ Trigger Error',
                            message: `Completion actions failed: ${err.message}`
                        });
                    }
                });
            }

            if (global.io) {
                global.io.emit("message", "assignment_complete_" + assignmentId);
            }

            // 🆕 PUSH COUNTERS (Completed assignment = count decrement)
            try {
                const { pushCountersToUser, pushCountersToTeam } = require('../../core/sse-helper');
                if (assignment.assigned_type === 'user') {
                    pushCountersToUser(assignment.assigned_id);
                } else if (assignment.assigned_type === 'team') {
                    pushCountersToTeam(assignment.assigned_id);
                }
            } catch (e) {
                console.error('SSE Push Error (completeAssignment):', e.message);
            }

        } catch (error) {
            console.error('Error completing assignment:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * GET /engine/assignment/:assignmentId/timeline
     * Get timeline updates for an assignment
     */
    getTimeline: async (req, res) => {
        try {
            const { assignmentId } = req.params;
            const user_id = req.dataToken.user_id;

            // Verify access to assignment
            const [assignments] = await dbHots.promise().query(
                `SELECT t.root_ticket_id, t.ticket_id, t.company_id, ta.ticket_id as fallback_ticket_id 
                 FROM t_ticket_assignment ta 
                 LEFT JOIN t_ticket t ON t.ticket_id = ta.ticket_id 
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignments.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const { root_ticket_id, ticket_id, company_id, fallback_ticket_id } = assignments[0];
            const masterRouteId = (root_ticket_id && root_ticket_id !== '') ? root_ticket_id : (ticket_id || fallback_ticket_id);

            // Get timeline updates from work_data
            const [workData] = await dbHots.promise().query(`
                SELECT 
                    twd.entity_id,
                    twd.field_name,
                    twd.field_value,
                    twd.created_at,
                    twd.created_by,
                    twd.ticket_depth,
                    twd.entry_type,
                    twd.revision,
                    twd.snapshot_meta_json,
                    CONCAT(u.firstname, ' ', u.lastname) as user_name
                FROM t_ticket_work_data twd
                LEFT JOIN user u ON u.user_id = twd.created_by
                WHERE twd.root_ticket_id = ?
                  AND twd.data_type = 'timeline_update'
                  AND twd.is_latest = 1
                  AND twd.is_hidden = 0
                ORDER BY twd.created_at DESC
            `, [masterRouteId]);

            // Group by entity_id to reconstruct updates
            const updates = {};
            workData.forEach(row => {
                if (!updates[row.entity_id]) {
                    updates[row.entity_id] = {
                        entity_id: row.entity_id,
                        created_at: row.created_at,
                        created_by: row.created_by,
                        user_name: row.user_name,
                        ticket_depth: row.ticket_depth,
                        entry_type: row.entry_type,
                        revision: row.revision,
                        snapshot_meta_json: typeof row.snapshot_meta_json === 'string' ? JSON.parse(row.snapshot_meta_json) : row.snapshot_meta_json
                    };
                }
                updates[row.entity_id][row.field_name] = row.field_value;
            });

            const timelineArray = Object.values(updates).sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

            res.json({ ok: true, updates: timelineArray });

        } catch (error) {
            console.error('Error fetching timeline:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/assignment/:assignmentId/timeline
     * Add timeline update for an assignment
     */
    addTimelineUpdate: async (req, res) => {
        try {
            const { assignmentId } = req.params;
            const { content, images } = req.body;
            const user_id = req.dataToken.user_id;

            if (!content || content.trim().length === 0) {
                return res.status(400).json({ ok: false, error: 'Content is required' });
            }

            // Verify assignment exists and get service_id from ticket
            const [assignments] = await dbHots.promise().query(
                `SELECT t.service_id, t.ticket_id, t.root_ticket_id, t.ticket_depth, t.company_id, ta.ticket_id as fallback_ticket_id 
                 FROM t_ticket_assignment ta
                 LEFT JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignments.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const { service_id, ticket_id, root_ticket_id, ticket_depth, company_id, fallback_ticket_id } = assignments[0];
            const masterRouteId = (root_ticket_id && root_ticket_id !== '') ? root_ticket_id : (ticket_id || fallback_ticket_id);
            const serviceId = service_id || 0;
            const safeCompanyId = company_id || 1;

            const entityId = `UPDATE_${Date.now()}`;
            const timelineGroupId = entityId; // Same ID helps sync edits

            // Store timeline update in work_data
            const fields = {
                content: content,
                created_at: new Date().toISOString(),
            };

            if (images && Array.isArray(images) && images.length > 0) {
                fields.images = JSON.stringify(images);
            }

            const insertPromises = [];
            for (const [field_name, field_value] of Object.entries(fields)) {
                const promise = dbHots.promise().query(
                    `INSERT INTO t_ticket_work_data 
                     (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, 
                      created_by, root_ticket_id, ticket_depth, entry_type, timeline_group_id, revision, 
                      is_latest, is_hidden, company_id)
                     VALUES (?, ?, ?, 'timeline_update', ?, ?, ?, ?, ?, ?, 'manual_update', ?, 0, 1, 0, ?)`,
                    [ticket_id || fallback_ticket_id, assignmentId, serviceId, entityId, field_name, field_value, user_id,
                        masterRouteId, ticket_depth || 0, timelineGroupId, safeCompanyId]
                );
                insertPromises.push(promise);
            }

            await Promise.all(insertPromises);

            console.log(`✅ [TIMELINE] Update ${entityId} added to assignment ${assignmentId} by user ${user_id}`);

            // 🆕 SSE Notify
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: 'timeline_update',
                entityId,
                content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
            }, {
                notify: true,
                title: '📋 Timeline Update',
                message: 'New update on your assignment'
            }).catch(() => { });

            res.json({
                ok: true,
                message: 'Timeline update added successfully',
                entity_id: entityId
            });

        } catch (error) {
            console.error('Error adding timeline update:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/tickets/:ticketId/assign
     * Create assignment (for HR to assign applicant to job)
     */
    createAssignment: async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { assigned_type, assigned_id, notes } = req.body;
            const user_id = req.dataToken?.user_id;

            if (!user_id) {
                return res.status(401).json({ ok: false, error: 'User not authenticated' });
            }

            if (!assigned_type || !assigned_id) {
                return res.status(400).json({ ok: false, error: 'assigned_type and assigned_id are required' });
            }

            console.log(`👥 [ASSIGN] Creating assignment for ticket ${ticketId} to ${assigned_type} ${assigned_id}`);

            // Verify ticket exists
            const [tickets] = await dbHots.promise().query(
                'SELECT ticket_id, service_id, title FROM t_ticket WHERE ticket_id = ?',
                [ticketId]
            );

            if (!tickets.length) {
                return res.status(404).json({ ok: false, error: 'Ticket not found' });
            }

            const ticket = tickets[0];

            // Create assignment
            const [result] = await dbHots.promise().query(
                `INSERT INTO t_ticket_assignment 
                 (ticket_id, assigned_type, assigned_id, assigned_by, assignment_status, notes, assigned_at)
                 VALUES (?, ?, ?, ?, 'active', ?, NOW())`,
                [ticketId, assigned_type, assigned_id, user_id, notes || `Assignment for: ${ticket.title}`]
            );

            const assignmentId = result.insertId;

            // Run triggers for assignment creation
            await triggerEngine.runTriggersForEvent(
                ticket.service_id,
                'on_assignment_create',
                {
                    assignmentId,
                    ticketId,
                    assigned_type,
                    assigned_id,
                    actor: { user_id }
                }
            );

            console.log(`✅ [ASSIGN] Assignment ${assignmentId} created successfully`);

            // 🆕 SSE: Notify assignee about new assignment
            if (global.sseManager && assigned_type === 'user') {
                global.sseManager.emitToUser(assigned_id, 'badge_update', {
                    type: 'assignment_inbox',
                    action: 'new_item',
                    assignmentId,
                    ticketId
                });
            }

            // 🆕 PUSH COUNTERS (New assignment = count increment)
            try {
                const { pushCountersToUser, pushCountersToTeam } = require('../../core/sse-helper');
                if (assigned_type === 'user') {
                    pushCountersToUser(assigned_id);
                } else if (assigned_type === 'team') {
                    pushCountersToTeam(assigned_id);
                }
            } catch (e) {
                console.error('SSE Push Error (createAssignment):', e.message);
            }

            return res.json({
                ok: true,
                assignment_id: assignmentId,
                message: 'Assignment created successfully'
            });

        } catch (e) {
            console.error('❌ [ASSIGN] Error:', e);
            return res.status(500).json({ ok: false, error: e.message });
        }
    },

    /**
     * POST /engine/tickets/:ticketId/apply
     * Apply for job
     */
    applyForJob: async (req, res) => {
        try {
            const { application_data } = req.body;
            const { ticketId } = req.params;
            const user_id = req.dataToken?.user_id;

            if (!user_id) {
                return res.status(401).json({ ok: false, error: 'User not authenticated' });
            }

            console.log(`📝 [APPLY] User ${user_id} applying for job ticket ${ticketId}`);

            // Get parent ticket and service info
            const [tickets] = await dbHots.promise().query(
                'SELECT service_id, service_name, title, root_ticket_id, ticket_depth, company_id FROM t_ticket WHERE ticket_id = ?',
                [ticketId]
            );

            if (!tickets.length) {
                return res.status(404).json({ ok: false, error: 'Job posting not found' });
            }

            const parentTicket = tickets[0];

            if (parentTicket.ticket_depth >= 3) {
                return res.status(400).json({ ok: false, error: 'Maximum nesting depth limit (4 levels) reached for applications' });
            }

            // Get service configuration
            const [services] = await dbHots.promise().query(
                'SELECT assignment_config FROM m_service WHERE service_id = ?',
                [parentTicket.service_id]
            );

            const assignmentConfig = services[0]?.assignment_config
                ? (typeof services[0].assignment_config === 'string'
                    ? JSON.parse(services[0].assignment_config)
                    : services[0].assignment_config)
                : { mode: 'manual_review' };

            console.log(`🔧 [APPLY] Assignment mode: ${assignmentConfig.mode}`);

            if (assignmentConfig.mode === 'auto_approve') {
                // ========== AUTO-APPROVE MODE ==========
                console.log(`⚡ [APPLY] Auto-approve mode - creating assignment directly`);

                // Create assignment directly
                const [result] = await dbHots.promise().query(
                    `INSERT INTO t_ticket_assignment 
                     (ticket_id, assigned_type, assigned_id, assigned_by, assignment_status, notes, assigned_at)
                     VALUES (?, 'user', ?, ?, 'active', ?, NOW())`,
                    [ticketId, user_id, user_id, `Auto-assigned for: ${parentTicket.title}`]
                );

                const assignmentId = result.insertId;

                // Store application data in work_data linked to assignment
                if (application_data) {
                    const entityId = `APP${Date.now()}`;
                    const fields = {
                        applicant_id: user_id,
                        status: 'accepted',
                        applied_at: new Date().toISOString(),
                        ...application_data
                    };

                    const insertPromises = [];
                    for (const [field_name, field_value] of Object.entries(fields)) {
                        const promise = dbHots.promise().query(
                            `INSERT INTO t_ticket_work_data 
                             (assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by)
                             VALUES (?, ?, 'application', ?, ?, ?, ?)`,
                            [assignmentId, parentTicket.service_id, entityId, field_name, field_value, user_id]
                        );
                        insertPromises.push(promise);
                    }
                    await Promise.all(insertPromises);
                }

                console.log(`✅ [APPLY] Auto-approved! Assignment ${assignmentId} created for user ${user_id}`);

                return res.json({
                    ok: true,
                    mode: 'auto_approve',
                    assignment_id: assignmentId,
                    message: 'Application auto-approved! You have been assigned to this job.'
                });

            } else {
                // ========== MANUAL REVIEW MODE ==========
                console.log(`📋 [APPLY] Manual review mode - creating application ticket`);

                // Generate ticket ID for application
                const applicationTicketId = await generateCustomTicketID(
                    dbHots,
                    parentTicket.service_id,
                    user_id
                );

                // Create application summary for description
                const applicationSummary = `Application for: ${parentTicket.title}\nApplied by: User ID ${user_id}\nCover Letter: ${application_data?.cover_letter || 'N/A'}\nStatus: Pending HR Review`;

                // Create application ticket with parent_ticket_id link
                // Note: t_ticket table doesn't have a 'description' column
                await dbHots.promise().query(
                    `INSERT INTO t_ticket 
                     (ticket_id, parent_ticket_id, service_id, service_name, created_by, status_id, 
                      submitted_at, creation_date, last_update, title, workflow_step, root_ticket_id, ticket_depth, company_id)
                     VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW(), ?, 0, ?, ?, ?)`,
                    [
                        applicationTicketId,
                        ticketId,  // parent_ticket_id
                        parentTicket.service_id,
                        parentTicket.service_name,
                        user_id,
                        `Application for: ${parentTicket.title}`,
                        parentTicket.root_ticket_id || ticketId,
                        parentTicket.ticket_depth + 1,
                        parentTicket.company_id
                    ]
                );

                // Create ticket details for better display
                await dbHots.promise().query(
                    `INSERT INTO t_ticket_detail (ticket_id, lbl_col, cstm_col, order_col)
                     VALUES 
                       (?, 'Applicant ID', ?, 1),
                       (?, 'Applied For Job', ?, 2),
                       (?, 'Application Status', 'Pending Review', 3),
                       (?, 'Applied Date', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'), 4)`,
                    [
                        applicationTicketId, user_id.toString(),
                        applicationTicketId, parentTicket.title,
                        applicationTicketId,
                        applicationTicketId
                    ]
                );

                // Store application data in work_data linked to application ticket
                const entityId = `APP${Date.now()}`;
                const fields = {
                    applicant_id: user_id,
                    parent_job_ticket_id: ticketId,
                    status: 'pending',
                    applied_at: new Date().toISOString(),
                    ...application_data
                };

                const insertPromises = [];
                for (const [field_name, field_value] of Object.entries(fields)) {
                    let field_type = 'text';
                    if (typeof field_value === 'number') field_type = 'number';
                    else if (field_value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(field_value)) field_type = 'date';
                    else if (field_name.includes('file') || field_name.includes('path') || field_name.includes('resume')) field_type = 'file';

                    const promise = dbHots.promise().query(
                        `INSERT INTO t_ticket_work_data 
                         (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
                         VALUES (?, ?, 'application', ?, ?, ?, ?, ?)`,
                        [applicationTicketId, parentTicket.service_id, entityId, field_name, field_value, field_type, user_id]
                    );
                    insertPromises.push(promise);
                }
                await Promise.all(insertPromises);

                console.log(`✅ [APPLY] Application ticket ${applicationTicketId} created, awaiting HR review`);

                return res.json({
                    ok: true,
                    mode: 'manual_review',
                    application_ticket_id: applicationTicketId,
                    parent_ticket_id: ticketId,
                    entity_id: entityId,
                    message: 'Application submitted successfully! HR will review your application.'
                });
            }

        } catch (e) {
            console.error('❌ [APPLY] Error:', e);
            return res.status(500).json({ ok: false, error: e.message });
        }
    },

    /**
     * GET /engine/tickets/my-applications
     * Get user's job applications
     */
    myApplications: async (req, res) => {
        try {
            const user_id = req.dataToken?.user_id;

            if (!user_id) {
                return res.status(401).json({ ok: false, error: 'User not authenticated' });
            }

            console.log(`📋 [MY_APPS] Fetching applications for user ${user_id}`);

            // Get all application tickets created by this user
            // Applications are tickets with parent_ticket_id set (child of job posting)
            const [applications] = await dbHots.promise().query(`
                SELECT 
                  app_ticket.ticket_id as application_ticket_id,
                  app_ticket.parent_ticket_id as job_ticket_id,
                  app_ticket.status_id as application_status_id,
                  app_ticket.submitted_at as applied_at,
                  app_status.status_name as application_status,
                  job_ticket.title as job_title,
                  job_ticket.service_name,
                  job_ticket.status_id as job_status_id,
                  job_status.status_name as job_status,
                  (SELECT COUNT(*) FROM t_ticket_assignment WHERE ticket_id = app_ticket.parent_ticket_id AND assigned_id = ?) as has_assignment,
                  (SELECT id FROM t_ticket_assignment WHERE ticket_id = app_ticket.parent_ticket_id AND assigned_id = ? LIMIT 1) as assignment_id
                FROM t_ticket app_ticket
                LEFT JOIN t_ticket job_ticket ON job_ticket.ticket_id = app_ticket.parent_ticket_id
                LEFT JOIN m_service_status app_status ON app_status.status_id = app_ticket.status_id
                LEFT JOIN m_service_status job_status ON job_status.status_id = job_ticket.status_id
                WHERE app_ticket.created_by = ?
                  AND app_ticket.parent_ticket_id IS NOT NULL
                  AND app_ticket.service_id = 19
                ORDER BY app_ticket.submitted_at DESC
            `, [user_id, user_id, user_id]);

            console.log(`✅ [MY_APPS] Found ${applications.length} applications`);

            return res.json({
                ok: true,
                applications: applications
            });

        } catch (e) {
            console.error('❌ [MY_APPS] Error:', e);
            return res.status(500).json({ ok: false, error: e.message });
        }
    },

    // =========================================================================
    // TASK MANAGEMENT
    // =========================================================================

    /**
     * GET /engine/assignment/:assignmentId/tasks
     * Get tasks and their steps for an assignment
     */
    getTasks: async (req, res) => {
        try {
            const { assignmentId } = req.params;

            // Verify assignment exists and get service_id
            const [assignment] = await dbHots.promise().query(
                `SELECT ta.id, ta.ticket_id, t.service_id 
                 FROM t_ticket_assignment ta
                 LEFT JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignment.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const { service_id } = assignment[0];

            // Fetch tasks (Hybrid logic)
            const [taskRows] = await dbHots.promise().query(`
                SELECT wd.entity_id, wd.field_name, wd.field_value, wd.created_at, wd.created_by, wd.id,
                       e.depth, e.parent_entity_id as parent_task_id, e.sort_order as \`order\`, e.status, e.report
                FROM t_ticket_work_data wd
                LEFT JOIN t_ticket_work_data_env e ON wd.entity_id COLLATE utf8mb4_unicode_ci = e.entity_id COLLATE utf8mb4_unicode_ci
                WHERE wd.assignment_id = ? AND wd.data_type = 'task'
                ORDER BY e.sort_order ASC, wd.id ASC
            `, [assignmentId]);

            // Fetch task steps
            const [stepRows] = await dbHots.promise().query(`
                SELECT entity_id, field_name, field_value, created_at, id
                FROM t_ticket_work_data
                WHERE assignment_id = ? AND data_type = 'task_step'
                ORDER BY id ASC
            `, [assignmentId]);

            // Group tasks by entity_id
            const tasksMap = {};
            taskRows.forEach(row => {
                if (!tasksMap[row.entity_id]) {
                    tasksMap[row.entity_id] = {
                        entity_id: row.entity_id,
                        created_at: row.created_at,
                        created_by: row.created_by,
                        depth: row.depth || 1,
                        parent_task_id: row.parent_task_id,
                        order: row.order || 0,
                        status: row.status || 'todo',
                        report: row.report,
                        steps: [],
                        subtasks: []
                    };
                }

                // Skip legacy structural EAV fields so they don't override the environment table
                if (['parent_task_id', 'order', 'status'].includes(row.field_name)) return;

                // Parse JSON array/objects
                if ((row.field_name === 'blocked_by' || row.field_name === 'custom_fields') && row.field_value) {
                    try {
                        tasksMap[row.entity_id][row.field_name] = JSON.parse(row.field_value);
                    } catch (e) {
                        tasksMap[row.entity_id][row.field_name] = row.field_name === 'blocked_by' ? [row.field_value] : row.field_value; // Fallback
                    }
                } else {
                    tasksMap[row.entity_id][row.field_name] = row.field_value;
                }
            });

            // Group steps by entity_id, then attach to parent task
            const stepsMap = {};
            stepRows.forEach(row => {
                if (!stepsMap[row.entity_id]) {
                    stepsMap[row.entity_id] = { entity_id: row.entity_id };
                }
                stepsMap[row.entity_id][row.field_name] = row.field_value;
            });

            // Attach steps to tasks
            Object.values(stepsMap).forEach(step => {
                const parentTaskId = step.task_id;
                if (tasksMap[parentTaskId]) {
                    tasksMap[parentTaskId].steps.push(step);
                }
            });

            // Parse resource usages from reports
            const [reportRows] = await dbHots.promise().query(`
                SELECT entity_id as task_id, content 
                FROM t_ticket_work_data_report 
                WHERE assignment_id = ?
            `, [assignmentId]);

            reportRows.forEach(row => {
                const taskId = row.task_id;
                if (tasksMap[taskId]) {
                    if (!tasksMap[taskId].usages) tasksMap[taskId].usages = {};

                    // Method 1: Parse [USAGE:{"resource":"Wood","qty":5}] text tokens (new format)
                    const tokenMatches = [...row.content.matchAll(/\[USAGE:({[^}]+})\]/g)];
                    for (const match of tokenMatches) {
                        try {
                            const usage = JSON.parse(match[1]);
                            if (usage.resource && usage.qty) {
                                tasksMap[taskId].usages[usage.resource] = (tasksMap[taskId].usages[usage.resource] || 0) + Number(usage.qty);
                            }
                        } catch (e) { }
                    }

                    // Method 2: Parse data-usage HTML attribute (old format fallback)
                    // Matches: data-usage='{"resource":"...","qty":N}' or data-usage="{"resource":"...","qty":N}"
                    const attrMatches = [...row.content.matchAll(/data-usage=['"]({[^'"]+})['"]/g)];
                    for (const match of attrMatches) {
                        const raw = match[1];
                        if (!raw) continue;
                        try {
                            const usage = JSON.parse(raw);
                            if (usage.resource && usage.qty) {
                                tasksMap[taskId].usages[usage.resource] = (tasksMap[taskId].usages[usage.resource] || 0) + Number(usage.qty);
                            }
                        } catch (e) { }
                    }
                }
            });

            // Propagate resource-typed custom_fields from parent tasks → children
            // so subtasks show the LOG USAGE dropdown in their report timeline.
            const propagateResourceFields = (taskList, ancestorResources = {}) => {
                for (const task of taskList) {
                    let ownFields = task.custom_fields || {};
                    if (typeof ownFields === 'string') { try { ownFields = JSON.parse(ownFields); } catch (e) { ownFields = {}; } }

                    // Extract resource fields from this task to pass to children
                    const ownResources = {};
                    Object.entries(ownFields).forEach(([key, meta]) => {
                        const m = typeof meta === 'object' && meta !== null ? meta : {};
                        if (m.type === 'resource') ownResources[key] = m;
                    });

                    // Merge ancestor resources into this task (ancestor wins ONLY if child doesn't define it)
                    if (Object.keys(ancestorResources).length > 0) {
                        task.custom_fields = { ...ancestorResources, ...ownFields };
                    }

                    // Resources to pass to children = grandfather's + parent's own
                    const forChildren = { ...ancestorResources, ...ownResources };
                    if (task.subtasks && task.subtasks.length > 0) {
                        propagateResourceFields(task.subtasks, forChildren);
                    }
                }
            };


            // Build recursive task tree
            const rootTasks = [];
            Object.values(tasksMap).forEach(task => {
                // Sort steps of each task
                task.steps.sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));

                if (task.parent_task_id && tasksMap[task.parent_task_id]) {
                    tasksMap[task.parent_task_id].subtasks.push(task);
                } else {
                    rootTasks.push(task);
                }
            });

            // Recursively bubble subtask usages up into parent for resource-typed custom_fields
            // so the badge ledger (remaining / total) reflects ALL consumption in the tree.
            const bubbleUsages = (taskList) => {
                for (const task of taskList) {
                    if (task.subtasks && task.subtasks.length > 0) {
                        bubbleUsages(task.subtasks);
                        // For each resource key defined on the parent, sum child usages
                        if (task.custom_fields) {
                            let parsed = task.custom_fields;
                            if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch (e) { parsed = {}; } }
                            for (const [key, meta] of Object.entries(parsed)) {
                                const m = typeof meta === 'object' && meta !== null ? meta : {};
                                if (m.type === 'resource') {
                                    if (!task.usages) task.usages = {};
                                    // Accumulate usage from all direct and nested subtasks
                                    const sumSubtask = (subs) => {
                                        let total = 0;
                                        for (const sub of subs) {
                                            if (sub.usages && sub.usages[key]) total += sub.usages[key];
                                            if (sub.subtasks && sub.subtasks.length > 0) total += sumSubtask(sub.subtasks);
                                        }
                                        return total;
                                    };
                                    const childSum = sumSubtask(task.subtasks);
                                    if (childSum > 0) {
                                        task.usages[key] = (task.usages[key] || 0) + childSum;
                                    }
                                }
                            }
                        }
                    }
                }
            };
            bubbleUsages(rootTasks);
            // Propagate parent resource custom_fields down to subtasks
            propagateResourceFields(rootTasks);

            // Recursively sort tasks using order field
            const sortTasks = (taskList) => {
                taskList.sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));
                taskList.forEach(t => {
                    if (t.subtasks && t.subtasks.length > 0) {
                        sortTasks(t.subtasks);
                    }
                });
            };

            sortTasks(rootTasks);
            const tasks = rootTasks;

            console.log(`📋 [TASKS] Found ${tasks.length} tasks for assignment ${assignmentId}`);

            res.json({
                ok: true,
                debug_version: '1.0.7', // Deep delete hierarchy fix mar 02 1545
                assignment_id: assignmentId,
                service_id,
                tasks
            });

        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/assignment/:assignmentId/tasks
     * Create a new task
     */
    createTask: async (req, res) => {
        try {
            const { assignmentId } = req.params;
            const { title, description, start_date, due_date, priority, steps, blocked_by, parent_task_id, custom_fields, estimated_hours, actual_hours, difficulty_level, primary_assignee_id } = req.body;
            const user_id = req.dataToken.user_id;

            if (!title) {
                return res.status(400).json({ ok: false, error: 'Task title is required' });
            }

            // Get assignment and service_id
            const [assignment] = await dbHots.promise().query(
                `SELECT ta.id, ta.ticket_id, t.service_id 
                 FROM t_ticket_assignment ta
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignment.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const { ticket_id, service_id } = assignment[0];
            const taskEntityId = `TASK_${Date.now()}`;

            // Compute depth from t_ticket_work_data_env (fast, relational)
            let depth = 1;
            if (parent_task_id) {
                const [parentEnv] = await dbHots.promise().query(
                    'SELECT depth FROM t_ticket_work_data_env WHERE entity_id = ? LIMIT 1',
                    [parent_task_id]
                );

                if (parentEnv.length) {
                    depth = (parentEnv[0].depth || 1) + 1;
                }

                if (depth > 4) {
                    return res.status(400).json({ ok: false, error: 'Maximum task nesting limit (4 levels) reached' });
                }
            }

            // Get max order for THIS PARENT's children (from t_ticket_work_data_env)
            const [orderResult] = await dbHots.promise().query(`
                SELECT MAX(sort_order) as max_order 
                FROM t_ticket_work_data_env 
                WHERE ticket_id = ? AND 
                      (parent_entity_id = ? OR (parent_entity_id IS NULL AND ? IS NULL))
            `, [ticket_id, parent_task_id || null, parent_task_id || null]);
            const nextOrder = (orderResult[0]?.max_order || 0) + 1;

            // Insert into environment table
            await dbHots.promise().query(`
                INSERT INTO t_ticket_work_data_env 
                (entity_id, ticket_id, root_ticket_id, parent_entity_id, depth, sort_order, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [taskEntityId, ticket_id, ticket_id, parent_task_id || null, typeof depth !== 'undefined' ? depth : 1, nextOrder, 'todo']);

            // Insert task fields
            const taskFields = {
                title,
                description: description || '',
                start_date: start_date || null,
                due_date: due_date || null,
                priority: priority || 'medium',
                blocked_by: blocked_by ? JSON.stringify(blocked_by) : null,
                custom_fields: custom_fields ? JSON.stringify(custom_fields) : null,
                estimated_hours: estimated_hours || null,
                actual_hours: actual_hours || null,
                difficulty_level: difficulty_level || null,
                primary_assignee_id: primary_assignee_id || null
            };

            const insertPromises = [];
            for (const [field_name, field_value] of Object.entries(taskFields)) {
                if (field_value !== null) {
                    insertPromises.push(
                        dbHots.promise().query(`
                            INSERT INTO t_ticket_work_data 
                            (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by)
                            VALUES (?, ?, ?, 'task', ?, ?, ?, ?)
                        `, [ticket_id, assignmentId, service_id, taskEntityId, field_name, field_value, user_id])
                    );
                }
            }

            await Promise.all(insertPromises);

            // Insert steps if provided
            if (steps && Array.isArray(steps) && steps.length > 0) {
                const stepPromises = [];
                steps.forEach((step, idx) => {
                    const stepEntityId = `STEP_${Date.now()}_${idx}`;
                    const stepFields = {
                        task_id: taskEntityId,
                        label: step.label || `Step ${idx + 1}`,
                        checked: 'false',
                        order: (idx + 1).toString()
                    };

                    for (const [field_name, field_value] of Object.entries(stepFields)) {
                        stepPromises.push(
                            dbHots.promise().query(`
                                INSERT INTO t_ticket_work_data 
                                (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by)
                                VALUES (?, ?, ?, 'task_step', ?, ?, ?, ?)
                            `, [ticket_id, assignmentId, service_id, stepEntityId, field_name, field_value, user_id])
                        );
                    }
                });
                await Promise.all(stepPromises);
            }

            console.log(`✅ [TASKS] Created task ${taskEntityId} for assignment ${assignmentId}`);

            // 🆕 SSE Notify
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: 'task_created',
                taskId: taskEntityId,
                title: title
            }).catch(() => { });

            res.json({
                ok: true,
                task_id: taskEntityId,
                message: 'Task created successfully'
            });

        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    updateTask: async (req, res) => {
        try {
            const { assignmentId, taskId } = req.params;
            const updates = req.body; // { status, sort_order, title, priority, ... }
            const user_id = req.dataToken.user_id;

            if (!updates || Object.keys(updates).length === 0) {
                return res.status(400).json({ ok: false, error: 'No updates provided' });
            }

            // Verify task exists
            const [taskInfo] = await dbHots.promise().query(`
                SELECT wd.ticket_id, wd.service_id FROM t_ticket_work_data wd
                WHERE wd.assignment_id = ? AND wd.entity_id = ? AND wd.data_type = 'task'
                LIMIT 1
            `, [assignmentId, taskId]);

            if (!taskInfo.length) {
                return res.status(404).json({ ok: false, error: 'Task not found' });
            }

            const { ticket_id, service_id } = taskInfo[0];

            // ── Structural fields → t_ticket_work_data_env ──
            const ENV_FIELDS = ['status', 'sort_order', 'report', 'parent_entity_id', 'depth'];
            const envUpdates = {};
            const eavUpdates = {};

            for (const [k, v] of Object.entries(updates)) {
                if (ENV_FIELDS.includes(k)) {
                    envUpdates[k] = v;
                } else {
                    eavUpdates[k] = v;
                }
            }

            // Update t_ticket_work_data_env
            if (Object.keys(envUpdates).length > 0) {
                const setClauses = Object.keys(envUpdates).map(k => `${k} = ?`).join(', ');
                const values = [...Object.values(envUpdates), taskId];
                await dbHots.promise().query(
                    `UPDATE t_ticket_work_data_env SET ${setClauses}, updated_at = NOW() WHERE entity_id = ?`,
                    values
                );
            }

            // Update EAV content fields
            const updatePromises = [];
            for (const [field_name, raw_field_value] of Object.entries(eavUpdates)) {
                if (raw_field_value !== undefined && raw_field_value !== null) {
                    const field_value = ((field_name === 'blocked_by' || field_name === 'custom_fields') && typeof raw_field_value === 'object' && raw_field_value !== null)
                        ? JSON.stringify(raw_field_value)
                        : raw_field_value;

                    updatePromises.push((async () => {
                        const [existingRow] = await dbHots.promise().query(`
                            SELECT id FROM t_ticket_work_data 
                            WHERE assignment_id = ? AND entity_id = ? AND field_name = ? AND data_type = 'task'
                            LIMIT 1
                        `, [assignmentId, taskId, field_name]);

                        if (existingRow.length > 0) {
                            return dbHots.promise().query(`
                                UPDATE t_ticket_work_data 
                                SET field_value = ?, updated_at = NOW() 
                                WHERE id = ?
                            `, [field_value, existingRow[0].id]);
                        } else {
                            return dbHots.promise().query(`
                                INSERT INTO t_ticket_work_data 
                                (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by, updated_at)
                                VALUES (?, ?, ?, 'task', ?, ?, ?, ?, NOW())
                            `, [ticket_id, assignmentId, service_id, taskId, field_name, field_value, user_id]);
                        }
                    })());
                }
            }

            await Promise.all(updatePromises);

            console.log(`✅ [TASKS] Updated task ${taskId} with:`, Object.keys(updates));

            // SSE Notify
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: updates.status ? 'task_status_change' : 'task_updated',
                taskId,
                updates
            }, {
                notify: !!updates.status,
                title: updates.status ? '📌 Task Update' : undefined,
                message: updates.status ? `Task moved to ${updates.status}` : undefined
            }).catch(() => { });

            res.json({
                ok: true,
                task_id: taskId,
                updated_fields: Object.keys(updates)
            });

        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/assignment/:assignmentId/tasks/reorder
     * Bulk update sort_order after Drag-and-Drop reordering
     * Body: { ordered_ids: ['TASK_1', 'TASK_2', ...] }
     * All IDs must share the same parent_entity_id (or all be root)
     */
    reorderTasks: async (req, res) => {
        try {
            const { assignmentId } = req.params;
            const { ordered_ids } = req.body;

            if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
                return res.status(400).json({ ok: false, error: 'ordered_ids array required' });
            }

            // Bulk update sort_order in t_ticket_work_data_env using a single transaction
            const conn = await dbHots.promise().getConnection();
            try {
                await conn.beginTransaction();

                for (let i = 0; i < ordered_ids.length; i++) {
                    await conn.query(
                        'UPDATE t_ticket_work_data_env SET sort_order = ?, updated_at = NOW() WHERE entity_id = ?',
                        [i + 1, ordered_ids[i]]
                    );
                }

                await conn.commit();
                console.log(`✅ [TASKS] Reordered ${ordered_ids.length} tasks for assignment ${assignmentId}`);
                res.json({ ok: true, message: 'Tasks reordered' });
            } catch (e) {
                await conn.rollback();
                throw e;
            } finally {
                conn.release();
            }

        } catch (error) {
            console.error('Error reordering tasks:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * PATCH /engine/assignment/:assignmentId/tasks/:taskId/report
     * Save or update the per-card report in t_ticket_work_data_env
     * Body: { report: 'HTML content from WYSIWYG' }
     */
    updateTaskReport: async (req, res) => {
        try {
            const { assignmentId, taskId } = req.params;
            const { report } = req.body;
            const user_id = req.dataToken.user_id;

            if (report === undefined || report === null) {
                return res.status(400).json({ ok: false, error: 'report content required' });
            }

            // Enforce 1000 char limit
            const trimmedReport = String(report).slice(0, 1000);

            const [result] = await dbHots.promise().query(
                'UPDATE t_ticket_work_data_env SET report = ?, updated_at = NOW() WHERE entity_id = ?',
                [trimmedReport, taskId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ ok: false, error: 'Task environment record not found' });
            }

            console.log(`📝 [TASKS] Report saved for task ${taskId} by user ${user_id}`);

            // Optional: also post a brief timeline note
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: 'task_report_updated',
                taskId
            }).catch(() => { });

            res.json({ ok: true, message: 'Report saved', task_id: taskId });

        } catch (error) {
            console.error('Error saving task report:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/assignment/:assignmentId/tasks/:taskId/steps
     * Create a task step
     */
    createTaskStep: async (req, res) => {
        try {
            const { assignmentId, taskId } = req.params;
            const { label } = req.body;
            const user_id = req.dataToken.user_id;

            if (!label) {
                return res.status(400).json({ ok: false, error: 'Step label is required' });
            }

            // Get assignment info
            const [assignment] = await dbHots.promise().query(
                `SELECT ta.ticket_id, t.service_id 
                 FROM t_ticket_assignment ta
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignment.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const { ticket_id, service_id } = assignment[0];

            // Get max step order for this task
            const [orderResult] = await dbHots.promise().query(`
                SELECT MAX(CAST(field_value AS UNSIGNED)) as max_order 
                FROM t_ticket_work_data 
                WHERE assignment_id = ? AND data_type = 'task_step' AND field_name = 'order'
                  AND entity_id IN (
                    SELECT entity_id FROM t_ticket_work_data 
                    WHERE assignment_id = ? AND data_type = 'task_step' 
                      AND field_name = 'task_id' AND field_value = ?
                  )
            `, [assignmentId, assignmentId, taskId]);
            const nextOrder = (orderResult[0]?.max_order || 0) + 1;

            const stepEntityId = `STEP_${Date.now()}`;
            const stepFields = {
                task_id: taskId,
                label,
                checked: 'false',
                order: nextOrder.toString()
            };

            const insertPromises = [];
            for (const [field_name, field_value] of Object.entries(stepFields)) {
                insertPromises.push(
                    dbHots.promise().query(`
                        INSERT INTO t_ticket_work_data 
                        (ticket_id, assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by)
                        VALUES (?, ?, ?, 'task_step', ?, ?, ?, ?)
                    `, [ticket_id, assignmentId, service_id, stepEntityId, field_name, field_value, user_id])
                );
            }

            await Promise.all(insertPromises);

            console.log(`✅ [TASKS] Created step ${stepEntityId} for task ${taskId}`);

            // 🆕 SSE Notify
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: 'step_created',
                taskId,
                stepId: stepEntityId
            }).catch(() => { });

            res.json({
                ok: true,
                step_id: stepEntityId,
                task_id: taskId
            });

        } catch (error) {
            console.error('Error creating task step:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * PATCH /engine/assignment/:assignmentId/tasks-steps/:stepId
     * Toggle or update a task step (checked, label)
     */
    toggleTaskStep: async (req, res) => {
        try {
            const { assignmentId, stepId } = req.params;
            const { checked, label } = req.body;

            // Verify step exists — query by entity_id only (not gated on assignmentId)
            // because subtask steps are created under parent assignment but share same entity_id format
            const [stepCheck] = await dbHots.promise().query(`
                SELECT field_value FROM t_ticket_work_data 
                WHERE entity_id = ? AND data_type = 'task_step' AND field_name = 'task_id'
                LIMIT 1
            `, [stepId]);

            if (!stepCheck.length) {
                return res.status(404).json({ ok: false, error: 'Step not found' });
            }

            const taskId = stepCheck[0].field_value;

            const updatePromises = [];

            if (checked !== undefined) {
                updatePromises.push(
                    dbHots.promise().query(`
                        UPDATE t_ticket_work_data 
                        SET field_value = ?, updated_at = NOW()
                        WHERE entity_id = ? AND data_type = 'task_step' AND field_name = 'checked'
                    `, [checked ? 'true' : 'false', stepId])
                );
            }

            if (label !== undefined) {
                updatePromises.push(
                    dbHots.promise().query(`
                        UPDATE t_ticket_work_data 
                        SET field_value = ?, updated_at = NOW()
                        WHERE entity_id = ? AND data_type = 'task_step' AND field_name = 'label'
                    `, [label, stepId])
                );
            }

            await Promise.all(updatePromises);

            console.log(`✅ [TASKS] Updated step ${stepId}: checked=${checked}, label=${label}`);

            // 🆕 SSE Notify
            const user_id = req.dataToken.user_id;
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: 'step_updated',
                taskId,
                stepId,
                updates: { checked, label }
            }).catch(() => { });

            res.json({
                ok: true,
                step_id: stepId,
                checked: checked ? 'true' : 'false',
                label
            });

        } catch (error) {
            console.error('Error toggling task step:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * DELETE /engine/assignment/:assignmentId/tasks-steps/:stepId
     * Delete an individual checklist step
     */
    deleteTaskStep: async (req, res) => {
        try {
            const { assignmentId, stepId } = req.params;
            const user_id = req.dataToken.user_id;

            // Get taskId before deleting — query by entity_id only (not gated on assignmentId)
            const [stepCheck] = await dbHots.promise().query(`
                SELECT field_value FROM t_ticket_work_data 
                WHERE entity_id = ? AND data_type = 'task_step' AND field_name = 'task_id'
                LIMIT 1
            `, [stepId]);
            const taskId = stepCheck.length ? stepCheck[0].field_value : null;

            await dbHots.promise().query(`
                DELETE FROM t_ticket_work_data 
                WHERE entity_id = ? AND data_type = 'task_step'
            `, [stepId]);

            console.log(`🗑️ [STEPS] Deleted step ${stepId}`);

            // 🆕 SSE Notify
            if (taskId) {
                notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                    action: 'step_deleted',
                    taskId,
                    stepId
                }).catch(() => { });
            }

            res.json({ ok: true });
        } catch (error) {
            console.error('Error deleting task step:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * DELETE /engine/assignment/:assignmentId/tasks/:taskId
     * Delete a task, all its subtasks (recursively), their steps, and associated reports.
     */
    deleteTask: async (req, res) => {
        try {
            const { assignmentId, taskId } = req.params;
            const user_id = req.dataToken.user_id;

            // 1. Recursively find ALL descendant task IDs
            // Hierarchy is stored in t_ticket_work_data_env.parent_entity_id
            const [allTasks] = await dbHots.promise().query(`
                SELECT entity_id, parent_entity_id 
                FROM t_ticket_work_data_env 
                WHERE ticket_id = (SELECT ticket_id FROM t_ticket_work_data_env WHERE entity_id = ? LIMIT 1)
            `, [taskId]);

            const childMap = {};
            allTasks.forEach(row => {
                const parentId = row.parent_entity_id;
                if (parentId) {
                    if (!childMap[parentId]) childMap[parentId] = [];
                    childMap[parentId].push(row.entity_id);
                }
            });

            const idsToDelete = [taskId];
            const collectIds = (id) => {
                if (childMap[id]) {
                    childMap[id].forEach(childId => {
                        idsToDelete.push(childId);
                        collectIds(childId);
                    });
                }
            };
            collectIds(taskId);

            console.log(`🧹 [TASKS] Preparing deep delete for IDs: ${idsToDelete.join(', ')}`);

            // 2. Delete checklist steps for all these tasks
            // Steps are linked via field_name='task_id' and field_value='[TASK_ID]'
            await dbHots.promise().query(`
                DELETE FROM t_ticket_work_data 
                WHERE assignment_id = ? AND data_type = 'task_step' 
                  AND entity_id IN (
                    SELECT entity_id FROM (
                        SELECT DISTINCT entity_id FROM t_ticket_work_data 
                        WHERE assignment_id = ? AND data_type = 'task_step' 
                        AND field_name = 'task_id' AND field_value IN (?)
                    ) as sub
                  )
            `, [assignmentId, assignmentId, idsToDelete]);

            // 3. Delete Task Environment / Card Metadata (t_ticket_work_data_env)
            await dbHots.promise().query(`
                DELETE FROM t_ticket_work_data_env WHERE entity_id IN (?)
            `, [idsToDelete]);

            // 4. Delete associated Report Entries (t_ticket_work_data_report)
            // This prevents "Untitled" ghost entries in summary reports
            await dbHots.promise().query(`
                DELETE FROM t_ticket_work_data_report WHERE entity_id IN (?)
            `, [idsToDelete]);

            // 5. Delete the Task definitions themselves (t_ticket_work_data)
            const [result] = await dbHots.promise().query(`
                DELETE FROM t_ticket_work_data 
                WHERE assignment_id = ? AND entity_id IN (?) AND data_type = 'task'
            `, [assignmentId, idsToDelete]);

            console.log(`🗑️ [TASKS] Recursively deleted ${idsToDelete.length} tasks and associated data`);

            // 🆕 SSE Notify
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: 'task_deleted',
                taskId,
                recursive_count: idsToDelete.length
            }).catch(() => { });

            res.json({
                ok: true,
                deleted_task_id: taskId,
                recursive_count: idsToDelete.length,
                affected_rows: result.affectedRows
            });

        } catch (error) {
            console.error('Error deleting task recursively:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * GET /engine/assignment/:assignmentId/active-users
     * Get list of actively involved users for @mentions
     */
    getActiveUsers: async (req, res) => {
        try {
            const { assignmentId } = req.params;

            // Per user request: active users mean users that are assigned to the current assignment
            const [users] = await dbHots.promise().query(`
                SELECT DISTINCT u.user_id, u.firstname, u.lastname, u.email
                FROM user u 
                JOIN t_ticket_assignment ta ON ta.assigned_id = u.user_id
                WHERE ta.id = ? AND ta.assignment_status = 'active'
            `, [assignmentId]);

            res.json({
                ok: true,
                users: users.map(u => ({
                    id: String(u.user_id),
                    display: `${u.firstname} ${u.lastname}`.trim(),
                    email: u.email
                }))
            });

        } catch (error) {
            console.error('Error fetching active users:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    // =========================================================================
    // DATA EXECUTION TOOLS
    // =========================================================================

    /**
     * GET /engine/assignment/:assignmentId/data-rows
     * Get all data rows for a ticket
     */
    getDataRows: async (req, res) => {
        try {
            const { assignmentId } = req.params;

            // Get ticket_id from assignment
            const [assignment] = await dbHots.promise().query(
                'SELECT ticket_id FROM t_ticket_assignment WHERE id = ?',
                [assignmentId]
            );

            if (!assignment.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const ticket_id = assignment[0].ticket_id;

            // Get data rows from t_ticket_detail
            const [rows] = await dbHots.promise().query(
                `SELECT id, cstm_col as field_key, lbl_col as label, value, 
                        field_type, revision, created_at
                 FROM t_ticket_detail 
                 WHERE ticket_id = ? 
                 AND (revision IS NULL OR revision = (SELECT MAX(revision) FROM t_ticket_detail WHERE ticket_id = ?))
                 ORDER BY order_col ASC, id ASC`,
                [ticket_id, ticket_id]
            );

            // Get edit history from t_ticket_work_data
            const [history] = await dbHots.promise().query(
                `SELECT entity_id, field_name, field_value, created_at, created_by,
                        (SELECT CONCAT(u.firstname, ' ', u.lastname) FROM user u WHERE u.user_id = w.created_by) as user_name
                 FROM t_ticket_work_data w
                 WHERE assignment_id = ? AND data_type = 'data_edit_log'
                 ORDER BY created_at DESC
                 LIMIT 20`,
                [assignmentId]
            );

            // Group history by entity_id
            const historyGrouped = {};
            history.forEach(h => {
                if (!historyGrouped[h.entity_id]) {
                    historyGrouped[h.entity_id] = { changes: [], created_at: h.created_at, user_name: h.user_name };
                }
                historyGrouped[h.entity_id].changes.push({ field: h.field_name, value: h.field_value });
            });

            res.json({
                ok: true,
                debug_version: '1.0.4', // March 02, 15:15 Fix
                rows,
                history: Object.entries(historyGrouped).map(([id, data]) => ({
                    id,
                    ...data
                })),
                ticket_id
            });

        } catch (error) {
            console.error('Error getting data rows:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * POST /engine/assignment/:assignmentId/data-row
     * Add a new data row
     */
    addDataRow: async (req, res) => {
        try {
            const { assignmentId } = req.params;
            const { label, value, field_type } = req.body;
            const user_id = req.dataToken.user_id;

            if (!label) {
                return res.status(400).json({ ok: false, error: 'Label is required' });
            }

            // Get ticket_id and service_id from assignment
            const [assignment] = await dbHots.promise().query(
                `SELECT ta.ticket_id, t.service_id 
                 FROM t_ticket_assignment ta
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignment.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const { ticket_id, service_id } = assignment[0];

            // Get next order
            const [orderRow] = await dbHots.promise().query(
                'SELECT COALESCE(MAX(order_col), 0) + 1 as next_order FROM t_ticket_detail WHERE ticket_id = ?',
                [ticket_id]
            );
            const order_col = orderRow[0].next_order;

            // Generate field key from label
            const field_key = label.toLowerCase().replace(/[^a-z0-9_]/g, '_');

            // Insert new row
            const [result] = await dbHots.promise().query(
                `INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, value, field_type, order_col)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [ticket_id, field_key, label, value || '', field_type || 'text', order_col]
            );

            // Log the addition to t_ticket_work_data
            const logEntityId = `ADD_${Date.now()}`;
            await dbHots.promise().query(
                `INSERT INTO t_ticket_work_data (assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by)
                 VALUES (?, ?, 'data_edit_log', ?, 'action', 'add', ?),
                        (?, ?, 'data_edit_log', ?, 'after', ?, ?)`,
                [assignmentId, service_id, logEntityId, user_id,
                    assignmentId, service_id, logEntityId, JSON.stringify({ label, value, field_type }), user_id]
            );

            console.log(`✅ [DATA-ROW] Added row ${result.insertId} for ticket ${ticket_id}`);

            // 🆕 SSE Notify
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: 'data_row_added',
                label,
                value
            }).catch(() => { });

            res.json({
                ok: true,
                message: 'Data row added successfully',
                row_id: result.insertId
            });

        } catch (error) {
            console.error('Error adding data row:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * PUT /engine/assignment/:assignmentId/data-row/:rowId
     * Update a data row (logs original data before update)
     */
    updateDataRow: async (req, res) => {
        try {
            const { assignmentId, rowId } = req.params;
            const { label, value, field_type } = req.body;
            const user_id = req.dataToken.user_id;

            // Get current row data (for logging)
            const [currentRow] = await dbHots.promise().query(
                'SELECT * FROM t_ticket_detail WHERE id = ?',
                [rowId]
            );

            if (!currentRow.length) {
                return res.status(404).json({ ok: false, error: 'Row not found' });
            }

            const original = currentRow[0];

            // Get service_id from assignment
            const [assignment] = await dbHots.promise().query(
                `SELECT t.service_id 
                 FROM t_ticket_assignment ta
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignment.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const service_id = assignment[0].service_id;

            // Build update fields
            const updates = [];
            const params = [];

            if (label !== undefined) {
                updates.push('lbl_col = ?');
                params.push(label);
            }
            if (value !== undefined) {
                updates.push('value = ?');
                params.push(value);
            }
            if (field_type !== undefined) {
                updates.push('field_type = ?');
                params.push(field_type);
            }

            if (updates.length === 0) {
                return res.status(400).json({ ok: false, error: 'No fields to update' });
            }

            params.push(rowId);

            // Update the row
            await dbHots.promise().query(
                `UPDATE t_ticket_detail SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            // Log the edit to t_ticket_work_data
            const logEntityId = `EDIT_${Date.now()}`;
            const afterData = { label: label ?? original.lbl_col, value: value ?? original.value, field_type: field_type ?? original.field_type };

            await dbHots.promise().query(
                `INSERT INTO t_ticket_work_data (assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by)
                 VALUES (?, ?, 'data_edit_log', ?, 'action', 'edit', ?),
                        (?, ?, 'data_edit_log', ?, 'row_id', ?, ?),
                        (?, ?, 'data_edit_log', ?, 'before', ?, ?),
                        (?, ?, 'data_edit_log', ?, 'after', ?, ?)`,
                [
                    assignmentId, service_id, logEntityId, user_id,
                    assignmentId, service_id, logEntityId, String(rowId), user_id,
                    assignmentId, service_id, logEntityId, JSON.stringify({ label: original.lbl_col, value: original.value, field_type: original.field_type }), user_id,
                    assignmentId, service_id, logEntityId, JSON.stringify(afterData), user_id
                ]
            );

            console.log(`✅ [DATA-ROW] Updated row ${rowId} by user ${user_id}`);

            // 🆕 SSE Notify
            notifyAssignmentStakeholders(assignmentId, user_id, 'assignment_update', {
                action: 'data_row_updated',
                rowId,
                label,
                value
            }).catch(() => { });

            res.json({
                ok: true,
                message: 'Data row updated successfully'
            });

        } catch (error) {
            console.error('Error updating data row:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PER-CARD MULTI-ENTRY REPORT CRUD  (uses t_ticket_work_data_report)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /engine/assignment/:assignmentId/tasks/:taskId/reports
     * Return all report entries for a task card, newest first.
     */
    getTaskReports: async (req, res) => {
        try {
            const { taskId } = req.params;
            const [rows] = await dbHots.promise().query(
                `SELECT r.id, r.content, r.created_at, r.updated_at,
                        CONCAT(u.firstname, ' ', u.lastname) as author_name
                 FROM t_ticket_work_data_report r
                 LEFT JOIN user u ON u.user_id = r.created_by
                 WHERE r.entity_id = ? AND r.deleted_at IS NULL
                 ORDER BY r.created_at DESC`,
                [taskId]
            );
            res.json({ ok: true, reports: rows });
        } catch (e) {
            console.error('[TASK_REPORT][GET]', e);
            res.status(500).json({ ok: false, error: e.message });
        }
    },

    /**
     * POST /engine/assignment/:assignmentId/tasks/:taskId/reports
     * Add a new report entry for a task card.
     * Body: { content: string }
     */
    addTaskReport: async (req, res) => {
        const { assignmentId, taskId } = req.params;
        const { content } = req.body;
        const user_id = req.dataToken.user_id;

        if (!content || !content.trim()) {
            return res.status(400).json({ ok: false, error: 'content required' });
        }

        const conn = await dbHots.promise().getConnection();
        try {
            await conn.beginTransaction();

            // 1. Get ticket_id from the task env record
            const [[envRow]] = await conn.query(
                'SELECT ticket_id, status FROM t_ticket_work_data_env WHERE entity_id = ? LIMIT 1',
                [taskId]
            );
            if (!envRow) {
                await conn.rollback();
                return res.status(404).json({ ok: false, error: 'Task env record not found' });
            }

            // 2. Get task title from EAV
            const [[titleRow]] = await conn.query(
                `SELECT field_value as title FROM t_ticket_work_data
                 WHERE entity_id = ? AND field_name = 'title' AND data_type = 'task' LIMIT 1`,
                [taskId]
            );
            const taskTitle = titleRow?.title || 'Untitled';

            // 3. Insert report entry
            const [insert] = await conn.query(
                `INSERT INTO t_ticket_work_data_report (entity_id, ticket_id, assignment_id, content, created_by)
                 VALUES (?, ?, ?, ?, ?)`,
                [taskId, envRow.ticket_id, assignmentId, content.trim(), user_id]
            );

            await conn.commit();

            console.log(`📝 [TASK_REPORT] Entry added for task ${taskId} (${taskTitle}) by user ${user_id}`);

            // SSE: notify all clients to refresh timeline
            if (global.sseManager) {
                global.sseManager.broadcast('assignment_update', {
                    assignment_id: assignmentId,
                    action: 'report_added',
                    task_id: taskId
                });
            }

            res.json({
                ok: true,
                report: {
                    id: insert.insertId,
                    entity_id: taskId,
                    task_title: taskTitle,
                    status: envRow.status,
                    content: content.trim(),
                    created_at: new Date().toISOString()
                }
            });
        } catch (e) {
            await conn.rollback();
            console.error('[TASK_REPORT][ADD]', e);
            res.status(500).json({ ok: false, error: e.message });
        } finally {
            conn.release();
        }
    },

    /**
     * PATCH /engine/assignment/:assignmentId/tasks/:taskId/reports/:reportId
     * Edit an existing report entry.
     * Body: { content: string }
     */
    editTaskReport: async (req, res) => {
        const { taskId, reportId } = req.params;
        const { content } = req.body;
        const user_id = req.dataToken.user_id;

        if (!content || !content.trim()) {
            return res.status(400).json({ ok: false, error: 'content required' });
        }

        const conn = await dbHots.promise().getConnection();
        try {
            await conn.beginTransaction();
            const [result] = await conn.query(
                `UPDATE t_ticket_work_data_report SET content = ?, updated_at = NOW()
                 WHERE id = ? AND entity_id = ? AND deleted_at IS NULL`,
                [content.trim(), reportId, taskId]
            );
            if (result.affectedRows === 0) {
                await conn.rollback();
                return res.status(404).json({ ok: false, error: 'Report entry not found' });
            }
            await conn.commit();
            console.log(`✏️ [TASK_REPORT] Entry ${reportId} edited by user ${user_id}`);

            // SSE: notify all clients to refresh timeline
            if (global.sseManager) {
                global.sseManager.broadcast('assignment_update', {
                    assignment_id: req.params.assignmentId,
                    action: 'report_edited',
                    report_id: reportId
                });
            }

            res.json({ ok: true, message: 'Report entry updated' });
        } catch (e) {
            await conn.rollback();
            console.error('[TASK_REPORT][EDIT]', e);
            res.status(500).json({ ok: false, error: e.message });
        } finally {
            conn.release();
        }
    },

    /**
     * DELETE /engine/assignment/:assignmentId/tasks/:taskId/reports/:reportId
     * Soft-delete a report entry.
     */
    deleteTaskReport: async (req, res) => {
        const { taskId, reportId } = req.params;
        const user_id = req.dataToken.user_id;

        const conn = await dbHots.promise().getConnection();
        try {
            await conn.beginTransaction();
            const [result] = await conn.query(
                `UPDATE t_ticket_work_data_report SET deleted_at = NOW()
                 WHERE id = ? AND entity_id = ? AND deleted_at IS NULL`,
                [reportId, taskId]
            );
            if (result.affectedRows === 0) {
                await conn.rollback();
                return res.status(404).json({ ok: false, error: 'Report entry not found' });
            }
            await conn.commit();
            console.log(`🗑️ [TASK_REPORT] Entry ${reportId} deleted by user ${user_id}`);

            // SSE: notify all clients to refresh timeline
            if (global.sseManager) {
                global.sseManager.broadcast('assignment_update', {
                    assignment_id: req.params.assignmentId,
                    action: 'report_deleted',
                    report_id: reportId
                });
            }

            res.json({ ok: true, message: 'Report entry deleted' });
        } catch (e) {
            await conn.rollback();
            console.error('[TASK_REPORT][DELETE]', e);
            res.status(500).json({ ok: false, error: e.message });
        } finally {
            conn.release();
        }
    }
};

/**
 * Helper: Check if user is member of team
 */
async function checkTeamMembership(user_id, team_id) {
    const [rows] = await dbHots.promise().query(
        'SELECT 1 FROM m_team_member WHERE user_id = ? AND team_id = ? LIMIT 1',
        [user_id, team_id]
    );
    return rows.length > 0;
}
