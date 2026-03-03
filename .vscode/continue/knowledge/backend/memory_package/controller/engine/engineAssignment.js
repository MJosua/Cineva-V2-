// controller/engine/engineAssignment.js
const { dbHots } = require('../../config/db');
const triggerEngine = require('../../core/trigger-engine');

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
        WHERE ta.assignment_status = 'active'
          AND (
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

            // Get assignment details
            const [assignments] = await dbHots.promise().query(
                'SELECT * FROM t_ticket_assignment WHERE id = ?',
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

            // If no more active assignments, update ticket status to completed
            if (remaining[0].count === 0) {
                await dbHots.promise().query(
                    'UPDATE t_ticket SET status_id = 6 WHERE ticket_id = ?',
                    [assignment.ticket_id]
                );
            }

            console.log(`✅ [ASSIGNMENT] Assignment ${assignmentId} completed by user ${user_id}`);

            res.json({
                ok: true,
                message: 'Assignment completed successfully',
                all_assignments_complete: remaining[0].count === 0
            });

        } catch (error) {
            console.error('Error completing assignment:', error);
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
