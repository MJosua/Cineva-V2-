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
            console.log("🔍 [REQUEST QUERY STATUS]", req.query.status);

            const { status } = req.query;

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
          s.service_name as service_display_name
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

            res.json({
                ok: true,
                assignments,
                count: assignments.length
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

            // Get assignment details with service_id
            const [assignments] = await dbHots.promise().query(
                `SELECT ta.*, t.service_id 
                 FROM t_ticket_assignment ta
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
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

            // Run completion triggers
            await triggerEngine.runTriggersForEvent(
                assignment.service_id,
                'on_assignment_complete',
                {
                    assignmentId,
                    ticketId: assignment.ticket_id,
                    actor: { user_id },
                    completion_data
                }
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
                    'UPDATE t_ticket SET status_id = 2 WHERE ticket_id = ?',
                    [assignment.ticket_id]
                );
            }

            console.log(`✅ [ASSIGNMENT] Assignment ${assignmentId} completed by user ${user_id}`);

            if (global.io) {
                global.io.emit("message", "assignment_complete_" + assignmentId);
            }

            res.json({
                ok: true,
                message: 'Assignment completed successfully',
                all_assignments_complete: remaining[0].count === 0
            });

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
                'SELECT * FROM t_ticket_assignment WHERE id = ?',
                [assignmentId]
            );

            if (!assignments.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            // Get timeline updates from work_data
            const [workData] = await dbHots.promise().query(`
                SELECT 
                    twd.entity_id,
                    twd.field_name,
                    twd.field_value,
                    twd.created_at,
                    twd.created_by,
                    CONCAT(u.firstname, ' ', u.lastname) as user_name
                FROM t_ticket_work_data twd
                LEFT JOIN user u ON u.user_id = twd.created_by
                WHERE twd.assignment_id = ?
                  AND twd.data_type = 'timeline_update'
                ORDER BY twd.created_at DESC
            `, [assignmentId]);

            // Group by entity_id to reconstruct updates
            const updates = {};
            workData.forEach(row => {
                if (!updates[row.entity_id]) {
                    updates[row.entity_id] = {
                        entity_id: row.entity_id,
                        created_at: row.created_at,
                        created_by: row.created_by,
                        user_name: row.user_name
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
                `SELECT t.service_id 
                 FROM t_ticket_assignment ta
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignments.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const serviceId = assignments[0].service_id;
            const entityId = `UPDATE_${Date.now()}`;

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
                     (assignment_id, service_id, data_type, entity_id, field_name, field_value, created_by)
                     VALUES (?, ?, 'timeline_update', ?, ?, ?, ?)`,
                    [assignmentId, serviceId, entityId, field_name, field_value, user_id]
                );
                insertPromises.push(promise);
            }

            await Promise.all(insertPromises);

            console.log(`✅ [TIMELINE] Update ${entityId} added to assignment ${assignmentId} by user ${user_id}`);

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
                'SELECT service_id, service_name, title FROM t_ticket WHERE ticket_id = ?',
                [ticketId]
            );

            if (!tickets.length) {
                return res.status(404).json({ ok: false, error: 'Job posting not found' });
            }

            const parentTicket = tickets[0];

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
                      submitted_at, creation_date, last_update, title, workflow_step)
                     VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW(), ?, 0)`,
                    [
                        applicationTicketId,
                        ticketId,  // parent_ticket_id
                        parentTicket.service_id,
                        parentTicket.service_name,
                        user_id,
                        `Application for: ${parentTicket.title}`
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
                LEFT JOIN m_ticket_status app_status ON app_status.status_id = app_ticket.status_id
                LEFT JOIN m_ticket_status job_status ON job_status.status_id = job_ticket.status_id
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
                 JOIN t_ticket t ON t.ticket_id = ta.ticket_id
                 WHERE ta.id = ?`,
                [assignmentId]
            );

            if (!assignment.length) {
                return res.status(404).json({ ok: false, error: 'Assignment not found' });
            }

            const { service_id } = assignment[0];

            // Fetch tasks
            const [taskRows] = await dbHots.promise().query(`
                SELECT entity_id, field_name, field_value, created_at, created_by
                FROM t_ticket_work_data
                WHERE assignment_id = ? AND data_type = 'task'
                ORDER BY entity_id, field_name
            `, [assignmentId]);

            // Fetch task steps
            const [stepRows] = await dbHots.promise().query(`
                SELECT entity_id, field_name, field_value, created_at
                FROM t_ticket_work_data
                WHERE assignment_id = ? AND data_type = 'task_step'
                ORDER BY entity_id, field_name
            `, [assignmentId]);

            // Group tasks by entity_id
            const tasksMap = {};
            taskRows.forEach(row => {
                if (!tasksMap[row.entity_id]) {
                    tasksMap[row.entity_id] = {
                        entity_id: row.entity_id,
                        created_at: row.created_at,
                        created_by: row.created_by,
                        steps: []
                    };
                }
                tasksMap[row.entity_id][row.field_name] = row.field_value;
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

            // Sort steps by order
            Object.values(tasksMap).forEach(task => {
                task.steps.sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));
            });

            // Convert to array and sort by order
            const tasks = Object.values(tasksMap).sort((a, b) =>
                (parseInt(a.order) || 0) - (parseInt(b.order) || 0)
            );

            console.log(`📋 [TASKS] Found ${tasks.length} tasks for assignment ${assignmentId}`);

            res.json({
                ok: true,
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
            const { title, description, due_date, priority, steps } = req.body;
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

            // Get max order for this assignment
            const [orderResult] = await dbHots.promise().query(`
                SELECT MAX(CAST(field_value AS UNSIGNED)) as max_order 
                FROM t_ticket_work_data 
                WHERE assignment_id = ? AND data_type = 'task' AND field_name = 'order'
            `, [assignmentId]);
            const nextOrder = (orderResult[0]?.max_order || 0) + 1;

            // Insert task fields
            const taskFields = {
                title,
                description: description || '',
                due_date: due_date || null,
                priority: priority || 'medium',
                status: 'todo',
                order: nextOrder.toString()
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

    /**
     * PATCH /engine/assignment/:assignmentId/tasks/:taskId
     * Update a task (status, title, due_date, etc.)
     */
    updateTask: async (req, res) => {
        try {
            const { assignmentId, taskId } = req.params;
            const updates = req.body; // { status: 'in_progress', title: 'New title', ... }

            if (!updates || Object.keys(updates).length === 0) {
                return res.status(400).json({ ok: false, error: 'No updates provided' });
            }

            // Verify task exists
            const [taskCheck] = await dbHots.promise().query(`
                SELECT 1 FROM t_ticket_work_data 
                WHERE assignment_id = ? AND entity_id = ? AND data_type = 'task'
                LIMIT 1
            `, [assignmentId, taskId]);

            if (!taskCheck.length) {
                return res.status(404).json({ ok: false, error: 'Task not found' });
            }

            // Update each field
            const updatePromises = [];
            for (const [field_name, field_value] of Object.entries(updates)) {
                // Use INSERT ... ON DUPLICATE KEY UPDATE pattern
                updatePromises.push(
                    dbHots.promise().query(`
                        UPDATE t_ticket_work_data 
                        SET field_value = ?, updated_at = NOW()
                        WHERE assignment_id = ? AND entity_id = ? AND data_type = 'task' AND field_name = ?
                    `, [field_value, assignmentId, taskId, field_name])
                );
            }

            await Promise.all(updatePromises);

            console.log(`✅ [TASKS] Updated task ${taskId} with:`, Object.keys(updates));

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
     * PATCH /engine/assignment/:assignmentId/tasks/:taskId/steps/:stepId
     * Toggle or update a task step (checked, label)
     */
    toggleTaskStep: async (req, res) => {
        try {
            const { assignmentId, taskId, stepId } = req.params;
            const { checked, label } = req.body;

            // Verify step exists and belongs to correct task
            const [stepCheck] = await dbHots.promise().query(`
                SELECT field_value FROM t_ticket_work_data 
                WHERE assignment_id = ? AND entity_id = ? AND data_type = 'task_step' AND field_name = 'task_id'
            `, [assignmentId, stepId]);

            if (!stepCheck.length || stepCheck[0].field_value !== taskId) {
                return res.status(404).json({ ok: false, error: 'Step not found for this task' });
            }

            const updatePromises = [];

            if (checked !== undefined) {
                updatePromises.push(
                    dbHots.promise().query(`
                        UPDATE t_ticket_work_data 
                        SET field_value = ?, updated_at = NOW()
                        WHERE assignment_id = ? AND entity_id = ? AND data_type = 'task_step' AND field_name = 'checked'
                    `, [checked ? 'true' : 'false', assignmentId, stepId])
                );
            }

            if (label !== undefined) {
                updatePromises.push(
                    dbHots.promise().query(`
                        UPDATE t_ticket_work_data 
                        SET field_value = ?, updated_at = NOW()
                        WHERE assignment_id = ? AND entity_id = ? AND data_type = 'task_step' AND field_name = 'label'
                    `, [label, assignmentId, stepId])
                );
            }

            await Promise.all(updatePromises);

            console.log(`✅ [TASKS] Updated step ${stepId}: checked=${checked}`);

            res.json({
                ok: true,
                step_id: stepId,
                checked: checked ? 'true' : 'false'
            });

        } catch (error) {
            console.error('Error toggling task step:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    },

    /**
     * DELETE /engine/assignment/:assignmentId/tasks/:taskId
     * Delete a task and its steps
     */
    deleteTask: async (req, res) => {
        try {
            const { assignmentId, taskId } = req.params;

            // Delete task steps first
            await dbHots.promise().query(`
                DELETE FROM t_ticket_work_data 
                WHERE assignment_id = ? AND data_type = 'task_step' 
                  AND entity_id IN (
                    SELECT entity_id FROM (
                      SELECT DISTINCT entity_id FROM t_ticket_work_data 
                      WHERE assignment_id = ? AND data_type = 'task_step' 
                        AND field_name = 'task_id' AND field_value = ?
                    ) as subquery
                  )
            `, [assignmentId, assignmentId, taskId]);

            // Delete task
            const [result] = await dbHots.promise().query(`
                DELETE FROM t_ticket_work_data 
                WHERE assignment_id = ? AND entity_id = ? AND data_type = 'task'
            `, [assignmentId, taskId]);

            console.log(`🗑️ [TASKS] Deleted task ${taskId}`);

            res.json({
                ok: true,
                deleted_task_id: taskId,
                affected_rows: result.affectedRows
            });

        } catch (error) {
            console.error('Error deleting task:', error);
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

            res.json({
                ok: true,
                message: 'Data row updated successfully'
            });

        } catch (error) {
            console.error('Error updating data row:', error);
            res.status(500).json({ ok: false, error: error.message });
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
