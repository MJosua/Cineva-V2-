/**
 * trigger-functions/srf_document_generator.js
 * 
 * This function is called by the trigger engine when SRF workflow approval happens.
 * It calls the existing executeDocumentGeneration function which handles the data loading.
 * 
 * @param {Object} params
 * @param {string} params.ticketId - The ticket ID
 * @param {Object} params.context - The trigger context (includes workflow_step, note)
 * @param {Function} params.dbQuery - Database query function
 * @returns {Promise<Object>} Result object { ok: boolean, ... }
 */

const hotscustomfunctionController = require('../../controller/hots_controller/customfunction/controllers/customfunctionController');

module.exports = async function srf_document_generator({ ticketId, context, dbQuery }) {
    console.log(`📄 [SRF_DOC_GEN] Starting document generation for ticket ${ticketId}, step ${context?.workflow_step}`);

    try {
        if (!ticketId) {
            console.error(`❌ [SRF_DOC_GEN] No ticketId provided`);
            return { ok: false, error: 'No ticketId provided' };
        }

        // Build function config object (mimics m_custom_functions format)
        const funcConfig = {
            config: JSON.stringify({
                template: 'srf_document',
                documentType: 'SRF'
            })
        };

        // Build params with context info
        const params = {
            workflow_step: context?.workflow_step,
            note: context?.note,
            actor_id: context?.actor?.user_id,
            trigger_step: context?.workflow_step
        };

        console.log(`📄 [SRF_DOC_GEN] Calling executeDocumentGeneration for ticket ${ticketId}`);

        // Call the existing executeDocumentGeneration function
        // This handles data loading and template selection
        const result = await hotscustomfunctionController.executeDocumentGeneration(
            funcConfig,
            ticketId,
            params
        );

        if (result.success) {
            console.log(`✅ [SRF_DOC_GEN] Document generated successfully:`, result);
            return {
                ok: true,
                message: `SRF document generated for ticket ${ticketId} at step ${context?.workflow_step}`,
                filePath: result.documentPath,
                ticketId: ticketId,
                step: context?.workflow_step
            };
        } else {
            console.error(`❌ [SRF_DOC_GEN] Document generation failed:`, result.message);
            return {
                ok: false,
                error: result.message
            };
        }

    } catch (error) {
        console.error(`❌ [SRF_DOC_GEN] Error generating SRF document for ${ticketId}:`, error);
        return {
            ok: false,
            error: error.message
        };
    }
};
