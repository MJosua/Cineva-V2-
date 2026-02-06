/**
 * core/sse-helper.js
 * 
 * Helper for calculating and pushing real-time counters to users.
 * Used by Engine to update sidebar badges (Approvals & Assignments).
 */

const { dbHots } = require('../config/db');
const { APPROVAL_STATUS, EVENT_TYPES } = require('../script/Utility/hotsConstants');

// Count pending approvals for a user
async function getApprovalsCount(userId) {
    try {
        // query 
        const sql = `
            SELECT COUNT(*) AS total 
            FROM t_ticket_event e 
            INNER JOIN t_ticket t ON t.ticket_id = e.ticket_id 
            WHERE e.approver_id = ? 
              AND e.approval_status = 0 
              AND e.approval_order = t.workflow_step
        `;
        const [rows] = await dbHots.promise().query(sql, [userId]);

        console.log(`🔍 [SSE-HELPER] getApprovalsCount(${userId})`);
        console.log(`   Running Query: ${sql.replace(/\s+/g, ' ').trim()}`);
        console.log(`   Params: [${userId}]`);
        console.log(`   Result:`, rows[0]);

        return rows[0]?.total || 0;
    } catch (error) {
        console.error(`❌ [SSE-HELPER] Error counting approvals for ${userId}:`, error.message);
        return 0;
    }
}

// Count active assignments for a user (direct + team + engine tasks)
async function getAssignmentsCount(userId) {
    try {
        // 1. Legacy Assignments
        const [legacyRows] = await dbHots.promise().query(`
            SELECT COUNT(*) as total
            FROM t_ticket_assignment ta
            WHERE (ta.assignment_status = 'pending' OR ta.assignment_status = 'active')
              AND (
                (ta.assigned_id = ? AND ta.assigned_type = 'user')
                OR (ta.assigned_type = 'team' AND ta.assigned_id IN (
                  SELECT team_id FROM m_team_member WHERE user_id = ?
                ))
              )
        `, [userId, userId]);

        // 2. Engine Tasks / Assignments
        const [eventRows] = await dbHots.promise().query(`
            SELECT COUNT(*) as total
            FROM t_ticket_event
            WHERE approver_id = ?
              AND approval_status = ?
              AND event_type IN (?, 'task')
        `, [userId, APPROVAL_STATUS.PENDING, EVENT_TYPES.ASSIGNMENT]);

        return (legacyRows[0]?.total || 0) + (eventRows[0]?.total || 0);
    } catch (error) {
        console.error(`❌ [SSE-HELPER] Error counting assignments for ${userId}:`, error.message);
        return 0;
    }
}

// Push updated counters to a user via SSE
async function pushCountersToUser(userId) {
    if (!global.sseManager) return;

    // 1. Get current counts
    const approvals = await getApprovalsCount(userId);
    const assignments = await getAssignmentsCount(userId);

    // 2. Emit event
    global.sseManager.emitToUser(userId, 'counter_update', {
        approvals,
        assignments,
        timestamp: Date.now()
    }, { persist: false }); // No need to persist counters, they are ephemeral state

    console.log(`📡 [SSE-HELPER] Pushed counters to user ${userId}: Approvals=${approvals}, Assignments=${assignments}`);
}

// Push updated counters to all members of a team
async function pushCountersToTeam(teamId) {
    if (!global.sseManager) return;

    try {
        // Get all team members
        const [members] = await dbHots.promise().query(
            'SELECT user_id FROM m_team_member WHERE team_id = ?',
            [teamId]
        );

        if (members.length > 0) {
            console.log(`👥 [SSE-HELPER] Pushing counters to team ${teamId} (${members.length} members)`);

            // Push to each member individually (since each has different approval counts)
            const promises = members.map(m => pushCountersToUser(m.user_id));
            await Promise.all(promises);
        }
    } catch (error) {
        console.error(`❌ [SSE-HELPER] Error pushing to team ${teamId}:`, error.message);
    }
}

module.exports = {
    getApprovalsCount,
    getAssignmentsCount,
    pushCountersToUser,
    pushCountersToTeam
};
