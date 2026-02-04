/**
 * trigger-functions/srf_document_generator.js
 * 
 * ASYNC LAUNCHER PATTERN (Fire-and-Forget)
 * =========================================
 * This function is called by the trigger engine when SRF workflow approval happens.
 * It returns IMMEDIATELY and runs document generation in the background.
 * 
 * WHY: The "Approve" button should not wait 3-5 seconds for PDF generation.
 * HOW: We create a "Processing" notification, then launch the async task.
 * 
 * @param {Object} params
 * @param {string} params.ticketId - The ticket ID
 * @param {Object} params.context - The trigger context (includes workflow_step, note, actor)
 * @param {Function} params.dbQuery - Database query function
 * @returns {Promise<Object>} Result object { ok: true, async: true } - Returns immediately
 */

const hotscustomfunctionController = require('../../controller/hots_controller/customfunction/controllers/customfunctionController');
const { createNotification, updateNotification } = require('../../controller/hots_controller/notification/notificationController');

module.exports = async function srf_document_generator({ ticketId, context, dbQuery }) {
    console.log(`📄 [SRF_DOC_GEN] Starting ASYNC document generation for ticket ${ticketId}, step ${context?.workflow_step}`);

    // Validate input
    if (!ticketId) {
        console.error(`❌ [SRF_DOC_GEN] No ticketId provided`);
        return { ok: false, error: 'No ticketId provided' };
    }

    const actorId = context?.actor?.user_id;

    // 🆕 Step 1: Create "Processing" notification immediately
    let notificationId = null;
    try {
        notificationId = await createNotification({
            user_id: actorId,
            type: 'doc_generation_started',
            title: '📄 Generating SRF Document...',
            message: `Document for ticket ${ticketId} is being generated`,
            data_payload: {
                ticket_id: ticketId,
                status: 'processing',
                step: context?.workflow_step,
                url: `/hots/ticket/${ticketId}`
            }
        });
        console.log(`📄 [SRF_DOC_GEN] Created processing notification: ${notificationId}`);

        // 🆕 Broadcast SSE for doc_generation_started so ALL users viewing this ticket see loading card
        // Frontend will filter by ticket_id to only show card for the specific ticket
        if (global.sseManager) {
            global.sseManager.broadcast('doc_generation_started', {
                ticket_id: ticketId,
                status: 'processing',
                message: `Generating SRF document for ticket ${ticketId}...`
            });
            console.log(`📄 [SRF_DOC_GEN] Broadcasted doc_generation_started for ticket ${ticketId}`);
        }
    } catch (notifErr) {
        console.error(`⚠️ [SRF_DOC_GEN] Failed to create notification:`, notifErr.message);
        // Don't fail the trigger, just log
    }

    // 🆕 Step 2: Launch background task (Fire-and-Forget)
    // We do NOT await this - it runs in the background
    (async () => {
        try {
            console.log(`📄 [SRF_DOC_GEN][ASYNC] Background task started for ticket ${ticketId}`);

            // Build function config object (mimics m_custom_functions format)
            const funcConfig = {
                config: JSON.stringify({
                    template: 'srf_document',
                    documentType: 'SRF'
                })
            };

            // Fetch requester data
            const requesterData = await dbQuery(`
                SELECT CONCAT(u.firstname, ' ', u.lastname) as requester_name, u.email as requester_email
                FROM t_ticket t
                JOIN user u ON t.created_by = u.user_id
                WHERE t.ticket_id = ?
            `, [ticketId]);

            // Build params with context info
            const params = {
                workflow_step: context?.workflow_step,
                note: context?.note,
                actor_id: actorId,
                trigger_step: context?.workflow_step,
                requester_name: requesterData[0]?.requester_name || 'Unknown',
                requester_email: requesterData[0]?.requester_email || '',
                manual_trigger: true
            };

            // Call the existing executeDocumentGeneration function
            const result = await hotscustomfunctionController.executeDocumentGeneration(
                funcConfig,
                ticketId,
                params
            );

            if (result.success) {
                console.log(`✅ [SRF_DOC_GEN][ASYNC] Document generated successfully:`, result.documentPath);

                // 🆕 Step 3a: Update notification to SUCCESS
                if (notificationId) {
                    try {
                        await updateNotification(notificationId, {
                            type: 'doc_generation_complete',
                            title: '✅ SRF Document Ready',
                            message: `Document for ticket ${ticketId} is ready`,
                            data_payload: {
                                ticket_id: ticketId,
                                status: 'success',
                                file_path: result.documentPath,
                                step: context?.workflow_step,
                                url: `/hots/ticket/${ticketId}`
                            }
                        });
                    } catch (updateErr) {
                        console.error(`⚠️ [SRF_DOC_GEN][ASYNC] Failed to update notification:`, updateErr.message);
                    }
                }

                // 🆕 Broadcast SSE so ALL users viewing this ticket see document refresh
                if (global.sseManager) {
                    global.sseManager.broadcast('doc_generation_complete', {
                        ticket_id: ticketId,
                        document_path: result.documentPath,
                        status: 'success',
                        message: `SRF document generated for step ${context?.workflow_step}`
                    });
                    console.log(`📄 [SRF_DOC_GEN][ASYNC] Broadcasted doc_generation_complete for ticket ${ticketId}`);
                }

            } else {
                console.error(`❌ [SRF_DOC_GEN][ASYNC] Document generation failed:`, result.message);

                // 🆕 Step 3b: Update notification to FAILED
                if (notificationId) {
                    try {
                        await updateNotification(notificationId, {
                            type: 'doc_generation_failed',
                            title: '❌ Document Generation Failed',
                            message: result.message || 'Unknown error',
                            data_payload: {
                                ticket_id: ticketId,
                                status: 'error',
                                error: result.message,
                                url: `/hots/ticket/${ticketId}`
                            }
                        });
                    } catch (updateErr) {
                        console.error(`⚠️ [SRF_DOC_GEN][ASYNC] Failed to update notification:`, updateErr.message);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ [SRF_DOC_GEN][ASYNC] Error in background task:`, error.message);

            // Update notification to FAILED
            if (notificationId) {
                try {
                    await updateNotification(notificationId, {
                        type: 'doc_generation_failed',
                        title: '❌ Document Generation Failed',
                        message: error.message,
                        data_payload: {
                            ticket_id: ticketId,
                            status: 'error',
                            error: error.message,
                            url: `/hots/ticket/${ticketId}`
                        }
                    });
                } catch (updateErr) {
                    console.error(`⚠️ [SRF_DOC_GEN][ASYNC] Failed to update notification:`, updateErr.message);
                }
            }
        }
    })(); // <-- Note: NO await here! This is the key to Fire-and-Forget

    // 🆕 Step 4: Return immediately (don't wait for PDF)
    console.log(`📄 [SRF_DOC_GEN] Returning immediately - generation continues in background`);
    return {
        ok: true,
        async: true,
        message: `Document generation started for ticket ${ticketId}. User will be notified on completion.`,
        ticketId: ticketId,
        step: context?.workflow_step,
        notificationId: notificationId
    };
};
