/**
 * HOTS Constants
 * 
 * This file centralizes all magic numbers and enums 
 * previously hardcoded across controllers.
 * 
 * @module hotsConstants
 */

// ============================================================
// SERVICE IDS - Maps to m_service table
// ============================================================
const SERVICE_IDS = {
    PC_REQUEST: 1,          // PC/Laptop Request
    IT_SUPPORT: 7,          // IT Support Request
    DATA_UPDATE: 10,        // Data Update Request (previously referenced as 9 in some places)
    PRICING_STRUCTURE: 11,  // Pricing Structure
};

// ============================================================
// STATUS IDS - Maps to m_status table (Ticket lifecycle)
// ============================================================
const STATUS_IDS = {
    DRAFT: 0,               // Initial state on creation
    PENDING: 1,             // Waiting for approval
    APPROVED: 2,            // Approved by all approvers
    REJECTED: 3,            // Rejected by any approver
    COMPLETED: 4,           // Work completed
    CANCELLED: 5,           // Cancelled by requester
};

// ============================================================
// ENTITY TYPES - Used in t_file_upload for polymorphic relations
// ============================================================
const ENTITY_TYPES = {
    TICKET: 'ticket',
    USER: 'user',
    DOCUMENT: 'document',
};

// ============================================================
// APPROVAL LEVELS - Defines who needs to approve
// ============================================================
const APPROVAL_LEVELS = {
    SUPERIOR_ONLY: 1,
    TEAM_LEADER_ONLY: 2,
    SUPERIOR_THEN_TEAM: 3,
    SUPERIOR_THEN_TEAM_THEN_HEAD: 4,
};

// ============================================================
// EXPORT
// ============================================================
module.exports = {
    SERVICE_IDS,
    STATUS_IDS,
    ENTITY_TYPES,
    APPROVAL_LEVELS,
};
