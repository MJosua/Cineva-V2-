/**
 * trigger-functions/srf_document_generator.js
 * 
 * VIRTUAL DOCUMENT PATTERN
 * ========================
 * This function is called by the trigger engine when SRF workflow approval happens.
 * It saves document snapshot data to t_document for on-demand rendering.
 * NO physical PDF files are created - PDF is generated only when user downloads.
 * 
 * @param {Object} params
 * @param {string} params.ticketId - The ticket ID
 * @param {Object} params.context - The trigger context (includes workflow_step, note, actor)
 * @param {Function} params.dbQuery - Database query function
 * @returns {Promise<Object>} Result object { ok: true, documentId } - Returns immediately
 */

const path = require('path');
const documentEngine = require('../../core/document-engine');
const { createNotification, updateNotification } = require('../../controller/hots_controller/notification/notificationController');
const { prepareSRFData } = require('../../core/document-data-preparer');
const { dbHots } = require('../../config/db'); // Ensure correct db connection import

module.exports = async function srf_document_generator({ ticketId, context, dbQuery }) {
    console.log(`📄 [SRF_DOC_GEN] Starting VIRTUAL document generation for ticket ${ticketId}, step ${context?.workflow_step}`);

    if (!ticketId) {
        console.error(`❌ [SRF_DOC_GEN] No ticketId provided`);
        return { ok: false, error: 'No ticketId provided' };
    }

    const actorId = context?.actor?.user_id;

    // Step 1: Create "Processing" notification immediately
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
                url: `/ticket/${ticketId}`
            }
        });
        console.log(`📄 [SRF_DOC_GEN] Created processing notification: ${notificationId}`);

        // Broadcast SSE for doc_generation_started
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
    }

    // Step 2: Collect snapshot data (Fire-and-Forget pattern)
    (async () => {
        try {
            console.log(`📄 [SRF_DOC_GEN][ASYNC] Capturing pure event state for ticket ${ticketId}`);

            // Fetch live approval events - this is the ONLY "frozen" part stored in the snapshot
            const approvalSql = `
                SELECT approval_order, approver_id, approval_status, approve_date, remark, approver_leader
                FROM t_ticket_event 
                WHERE ticket_id = ? AND event_type = "approve"
                ORDER BY approval_order ASC
            `;
            const approvalEvents = await dbQuery(approvalSql, [ticketId]);

            // NEW: Capture Workflow Definition (Freeze step labels like "Supervisor", etc.)
            let workflowDefinition = null;
            try {
                const [ticket] = await dbQuery('SELECT service_id FROM t_ticket WHERE ticket_id = ?', [ticketId]);
                if (ticket?.service_id) {
                    const [workflow] = await dbQuery('SELECT definition FROM m_service_workflow WHERE workflow_id = ? AND is_active = 1', [ticket.service_id]);
                    if (workflow?.definition) {
                        workflowDefinition = typeof workflow.definition === 'string' ? JSON.parse(workflow.definition) : workflow.definition;
                    }
                }
            } catch (wfErr) {
                console.warn(`⚠️ [SRF_DOC_GEN] Failed to capture workflow definition snapshot:`, wfErr.message);
            }

            // NEW: Capture Ticket Details (Freeze all values like purpose, deliver_to, items, etc.)
            let ticketDetails = [];
            try {
                ticketDetails = await dbQuery('SELECT lbl_col, value, cstm_col, order_col, field_type FROM t_ticket_detail WHERE ticket_id = ?', [ticketId]);
            } catch (detailErr) {
                console.warn(`⚠️ [SRF_DOC_GEN] Failed to capture ticket details snapshot:`, detailErr.message);
            }

            const snapshotData = {
                events: approvalEvents,
                workflow_definition: workflowDefinition, // FREEZE: Save step labels here
                detail_rows: ticketDetails,             // FREEZE: Save all field values here
                generated_at: new Date().toISOString(),
                generated_by: actorId,
                trigger_step: context?.workflow_step
            };

            console.log(`📄 [SRF_DOC_GEN][ASYNC] Captured ${approvalEvents.length} events, creating document entry...`);

            // Step 3: Create virtual document in t_document
            const result = await documentEngine.createDocument({
                entityType: 'ticket',
                entityId: ticketId,
                templateName: 'srf',
                data: snapshotData,
                actionOrigin: 'trigger',
                generatedBy: actorId || 0,
                fileExtension: 'html'
            });

            if (result.id) {
                // Success - assign ID
                result.documentId = result.id;
                console.log(`✅ [SRF_DOC_GEN][ASYNC] Virtual document created: id=${result.documentId}`);

                // Update notification to SUCCESS
                if (notificationId) {
                    try {
                        await updateNotification(notificationId, {
                            type: 'doc_generation_complete',
                            title: '✅ SRF Document Ready',
                            message: `Document for ticket ${ticketId} is ready`,
                            data_payload: {
                                ticket_id: ticketId,
                                status: 'success',
                                document_id: result.documentId,
                                view_url: `/hots_settings/document/${result.documentId}/view`,
                                download_url: `/hots_settings/document/${result.documentId}/download`,
                                step: context?.workflow_step,
                                url: `/ticket/${ticketId}`
                            }
                        });
                    } catch (updateErr) {
                        console.error(`⚠️ [SRF_DOC_GEN][ASYNC] Failed to update notification:`, updateErr.message);
                    }
                }

                // Broadcast SSE
                if (global.sseManager) {
                    global.sseManager.broadcast('doc_generation_complete', {
                        ticket_id: ticketId,
                        document_id: result.documentId,
                        view_url: `/hots_settings/document/${result.documentId}/view`,
                        download_url: `/hots_settings/document/${result.documentId}/download`,
                        status: 'success',
                        message: `SRF document generated for step ${context?.workflow_step}`
                    });
                    console.log(`📄 [SRF_DOC_GEN][ASYNC] Broadcasted doc_generation_complete for ticket ${ticketId}`);
                }

            } else {
                console.error(`❌ [SRF_DOC_GEN][ASYNC] Failed to create virtual document:`, result.error);

                // Update notification to FAILED
                if (notificationId) {
                    try {
                        await updateNotification(notificationId, {
                            type: 'doc_generation_failed',
                            title: '❌ Document Generation Failed',
                            message: result.error || 'Unknown error',
                            data_payload: {
                                ticket_id: ticketId,
                                status: 'error',
                                error: result.error,
                                url: `/ticket/${ticketId}`
                            }
                        });
                    } catch (updateErr) {
                        console.error(`⚠️ [SRF_DOC_GEN][ASYNC] Failed to update notification:`, updateErr.message);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ [SRF_DOC_GEN][ASYNC] Error in background task:`, error.message);
            if (notificationId) {
                try {
                    await updateNotification(notificationId, {
                        type: 'doc_generation_failed',
                        title: '❌ Document Generation Failed',
                        message: error.message,
                        data_payload: { ticket_id: ticketId, status: 'error', error: error.message }
                    });
                } catch (updateErr) {
                    console.error(`⚠️ [SRF_DOC_GEN][ASYNC] Failed to update notification:`, updateErr.message);
                }
            }
        }
    })(); // <-- NO await: Fire-and-Forget

    // Step 4: Return immediately
    console.log(`📄 [SRF_DOC_GEN] Returning immediately - snapshot collection continues in background`);
    return {
        ok: true,
        async: true,
        message: `Virtual document creation started for ticket ${ticketId}. User will be notified on completion.`,
        ticketId: ticketId,
        step: context?.workflow_step,
        notificationId: notificationId
    };
};
