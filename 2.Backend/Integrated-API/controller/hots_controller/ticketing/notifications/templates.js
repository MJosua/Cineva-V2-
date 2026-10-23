/**
 * Ticketing Email Templates
 * 
 * Centralized email template functions extracted from hotsTicket.js.
 * Templates are pure functions that return HTML strings.
 * 
 * @module ticketingTemplates
 */

/**
 * Base email wrapper with consistent styling
 * @param {string} content - The inner HTML content
 * @returns {string} Wrapped HTML
 */
const baseWrapper = (content) => `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    ${content}
</div>
`;

/**
 * Generate "Ticket Created" email for IT Support
 * @param {object} params
 * @param {string} params.fullName - Recipient's full name
 * @param {string} params.timestamp - Creation timestamp
 * @returns {string} HTML email body
 */
const ticketCreatedITSupport = ({ fullName, timestamp }) => baseWrapper(`
    <p>Dear ${fullName},</p>
    <p>Your IT Support ticket has just been created! Our team will review it and get back to you shortly.</p>
    <p>Best regards,</p>
    <p>IT Support Team</p>
    <p><small>Generated on: ${timestamp}</small></p>
`);

/**
 * Generate "Ticket Submitted" confirmation email
 * @param {object} params
 * @param {string} params.fullName - Requester's full name
 * @param {number} params.service_id - Service type ID
 * @param {string} params.ticketId - The ticket ID
 * @param {string} params.analyst_name - Analyst name (for pricing structure)
 * @param {string} params.proposal_no - Proposal number
 * @param {string} params.sku_id - SKU ID / Matcode
 * @param {string} params.proposal_date - Proposal date
 * @returns {string} HTML email body
 */
const ticketSubmitted = ({ fullName, service_id, ticketId, analyst_name, proposal_no, sku_id, proposal_date }) => baseWrapper(`
    <p>Dear ${fullName},</p>
    <p>Thank you for submitting your ticket. Below are the details of your request:</p>
    <p><strong>Service</strong>: ${service_id}</p>
    <p>IT Support Team</p>
    <p><strong>Ticket Details:</strong></p>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <thead>
            <tr style="background-color: #f2f2f2;">
                <td>Ticket ID</td>
                <td>Analyst Name</td>
                <td>Proposal No</td>
                <td>Matcode</td>
                <td>Proposal Date</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${ticketId}</td>
                <td>${analyst_name || '-'}</td>
                <td>${proposal_no || '-'}</td>
                <td>${sku_id || '-'}</td>
                <td>${proposal_date || '-'}</td>
            </tr>
        </tbody>
    </table>
    <p>Your ticket has been successfully received and is currently awaiting processing.</p>
    <p><strong>Approval List:</strong></p>
    <p>For additional details or to track your request, please visit your ticket in the helpdesk system.</p>
    <p>Thank you</p>
`);

/**
 * Generate "Approval Required" email for approvers
 * @param {object} params
 * @param {string} params.approverName - Approver's full name
 * @param {number} params.service_id - Service type ID
 * @param {string} params.ticketId - The ticket ID
 * @param {string} params.requesterName - The person who submitted the ticket
 * @param {string} params.department - Requester's department
 * @param {string} params.submissionDate - Ticket submission date
 * @param {string} params.analyst_name - Analyst name
 * @param {string} params.proposal_no - Proposal number
 * @param {string} params.sku_id - SKU ID / Matcode
 * @param {string} params.proposal_date - Proposal date
 * @returns {string} HTML email body
 */
const approvalRequired = ({
    approverName,
    service_id,
    ticketId,
    requesterName,
    department = 'IOD',
    submissionDate,
    analyst_name,
    proposal_no,
    sku_id,
    proposal_date
}) => baseWrapper(`
    <p>Dear ${approverName},</p>
    <p>A new ticket has been submitted and requires your approval. Please review the details below:</p>
    <p><strong>Service</strong>: ${service_id}</p>
    <p><strong>Ticket ID</strong>: ${ticketId}</p>
    <br/>
    <p>Requester Information:</p>
    <p><strong>Requested by</strong>: ${requesterName}</p>
    <p><strong>Department</strong>: ${department}</p>
    <p><strong>Submission Date</strong>: ${submissionDate}</p>
    <br/>
    <p><strong>Ticket Details</strong>:</p>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <thead>
            <tr style="background-color: #f2f2f2;">
                <td>Ticket ID</td>
                <td>Analyst Name</td>
                <td>Proposal No</td>
                <td>Matcode</td>
                <td>Proposal Date</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${ticketId}</td>
                <td>${analyst_name || '-'}</td>
                <td>${proposal_no || '-'}</td>
                <td>${sku_id || '-'}</td>
                <td>${proposal_date || '-'}</td>
            </tr>
        </tbody>
    </table>
    <p>Please log in to the helpdesk system to approve or reject this request.</p>
    <p>Thank you</p>
`);

/**
 * Generate subject lines for emails
 */
const subjects = {
    ticketCreated: (ticketId) => `[No-Reply] [Ticket ID: ${ticketId}] Your Ticket Has Been Submitted`,
    approvalRequired: (ticketId) => `[No-Reply] [Ticket ID: ${ticketId}] Approval Required`,
    itSupportCreated: () => `Your IT Support ticket has been created!`,
};

module.exports = {
    baseWrapper,
    ticketCreatedITSupport,
    ticketSubmitted,
    approvalRequired,
    subjects,
};
