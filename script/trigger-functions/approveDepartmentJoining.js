/**
 * trigger-functions/approveDepartmentJoining.js
 * 
 * This function is called by the trigger engine when a new user approval ticket is approved.
 * It updates the user record with proper department info, superior, and activates the account.
 * 
 * @param {Object} params
 * @param {string} params.ticketId - The ticket ID
 * @param {Object} params.context - The trigger context
 * @param {Function} params.dbQuery - Database query function
 * @returns {Promise<Object>} Result object { ok: boolean, ... }
 */

module.exports = async function approveDepartmentJoining({ ticketId, context, dbQuery }) {
    console.log(`👤 [DJA] Approving department joining for ticket: ${ticketId}`);

    if (!ticketId) {
        console.error(`❌ [DJA] No ticketId provided`);
        return { ok: false, error: 'Missing ticketId' };
    }

    try {
        // Step 1: Get created_by (user_id) from t_ticket
        const ticketRows = await dbQuery(
            `SELECT created_by FROM t_ticket WHERE ticket_id = ?`,
            [ticketId]
        );

        if (!ticketRows || ticketRows.length === 0) {
            console.error(`❌ [DJA] Ticket not found: ${ticketId}`);
            return { ok: false, error: 'Ticket not found' };
        }

        const userId = ticketRows[0].created_by;
        console.log(`👤 [DJA] Found user_id from ticket: ${userId}`);

        // Step 2: Get user_draft data for this user
        const draftRows = await dbQuery(
            `SELECT ud.department_id, md.department_head, md.department_name
             FROM user_draft ud
             LEFT JOIN m_company_department md ON ud.department_id = md.department_id
             WHERE ud.user_id = ?`,
            [userId]
        );

        if (!draftRows || draftRows.length === 0) {
            console.error(`❌ [DJA] No user_draft found for user_id: ${userId}`);
            return { ok: false, error: 'User draft not found' };
        }

        const draft = draftRows[0];
        const departmentId = draft.department_id;
        const departmentHead = draft.department_head;

        console.log(`📋 [DJA] Draft data: department_id=${departmentId}, department_head=${departmentHead}`);

        // Step 3: Update user record with all required fields
        await dbQuery(
            `UPDATE user SET 
                department_id = ?,
                superior_id = ?,
                plant_id = 1,
                final_superior_id = 1147,
                headcount_id = 1,
                status = 'approved'
             WHERE user_id = ?`,
            [departmentId, departmentHead, userId]
        );

        console.log(`✅ [DJA] User ${userId} updated successfully`);
        console.log(`   - department_id: ${departmentId}`);
        console.log(`   - superior_id: ${departmentHead}`);
        console.log(`   - plant_id: 1`);
        console.log(`   - final_superior_id: 1147`);
        console.log(`   - headcount_id: 1`);
        console.log(`   - status: approved`);

        return {
            ok: true,
            message: `User ${userId} approved and assigned to department ${draft.department_name || departmentId}`,
            userId: userId,
            departmentId: departmentId,
            superiorId: departmentHead
        };

    } catch (error) {
        console.error(`❌ [DJA] Error:`, error);
        return {
            ok: false,
            error: error.message
        };
    }
};
