/**
 * HOTS Constants - One Source Library
 * 
 * This file centralizes ALL magic numbers and enums 
 * used across the HOTS application.
 * 
 * USAGE: 
 *   const { SERVICE_IDS, STATUS_IDS } = require("../../script/Utility/hotsConstants");
 * 
 * @module hotsConstants
 */

// ============================================================
// 1️⃣ SERVICE IDS - Maps to m_service table
// ============================================================
const SERVICE_IDS = {
    // IT Services
    PC_REQUEST: 1,              // PC/Laptop Request
    IT_SUPPORT: 7,              // IT Support Request

    // Business Services
    SRF: 6,                     // Sample Request Form
    DATA_UPDATE: 9,             // Data Update Request (actual DB value)
    DATA_CHANGE_REQUEST: 10,    // Data Change Request (DCR)
    PRICING_STRUCTURE: 11,      // Pricing Structure

    // HR/Admin Services  
    USER_APPROVAL: 21,          // New User Approval Request
    MEETING_ROOM: 22,           // Meeting Room Booking

    // Add more as discovered...
};

// ============================================================
// 2️⃣ TICKET STATUS IDS - Maps to m_service_status table
// Lifecycle: Submitted → Waiting Approval → In Progress → Fulfilled/Rejected → Closed
// ============================================================
const STATUS_IDS = {
    SUBMITTED: 0,               // Initial state - DarkTurquoise (#D6D6D6)
    FULFILLED: 1,               // Work completed - DeepSkyBlue (#C5ECFC)
    WAITING_APPROVAL: 2,        // Pending approval - ForestGreen (#C6F6D5)
    IN_PROGRESS: 3,             // Being worked on - DarkOrange (#C5D1FC)
    REJECTED: 4,                // Rejected by approver - Red (#FFADAD)
    PENDING: 5,                 // Waiting for something - DarkOrange (#FFE9AD)
    CLOSED: 6,                  // Closed by admin - DarkGray (#C5D1FC)
    CANCELLED: 7,               // Cancelled by user - DarkGray (#C5D1FC)

    // Special statuses
    DELETED: 99,              // Internal use
};

// ============================================================
// 3️⃣ APPROVAL STATUS - Used in t_ticket_event.approval_status
// ============================================================
const APPROVAL_STATUS = {
    PENDING: 0,                 // Not yet reviewed
    APPROVED: 1,                // Approved by this approver
    REJECTED: 2,                // Rejected by this approver
    SKIPPED: 3,                 // Skipped (auto-approved or N/A)
};

// ============================================================
// 4️⃣ EVENT TYPES - Used in t_ticket_event.event_type
// ============================================================
const EVENT_TYPES = {
    APPROVAL: 'approval',           // Standard approval step
    ASSIGNMENT: 'assignment',       // Task assignment to team/user
    NOTIFICATION: 'notification',   // Notification only (no action)
    TRIGGER: 'trigger',             // Automated trigger execution
    COMMENT: 'comment',             // User comment/note
    STATUS_CHANGE: 'status_change', // Manual status override
};

// ============================================================
// 5️⃣ ASSIGNMENT TYPES - Used in t_ticket_assignment.assigned_type
// ============================================================
const ASSIGNMENT_TYPES = {
    USER: 'user',
    TEAM: 'team',
    DEPARTMENT: 'department',
};

// ============================================================
// 6️⃣ ENTITY TYPES - Used in t_file_upload for polymorphic relations
// ============================================================
const ENTITY_TYPES = {
    TICKET: 'ticket',
    USER: 'user',
    DOCUMENT: 'document',
    ORDER: 'order',
    SIGNATURE: 'signature',
};

// ============================================================
// 7️⃣ APPROVAL LEVELS - Defines approval workflow complexity
// ============================================================
const APPROVAL_LEVELS = {
    NO_APPROVAL: 0,                     // Direct to team
    SUPERIOR_ONLY: 1,                   // Only superior approves
    TEAM_LEADER_ONLY: 2,                // Only team leader approves
    SUPERIOR_THEN_TEAM: 3,              // Superior → Team Leader
    SUPERIOR_THEN_TEAM_THEN_HEAD: 4,    // Superior → Team Leader → Dept Head
};

// ============================================================
// 8️⃣ PRIORITY LEVELS - Calculated based on ticket age
// ============================================================
const PRIORITY_LEVELS = {
    LOW: 'low',         // < 3 days old
    MEDIUM: 'medium',   // 3-7 days old
    HIGH: 'high',       // > 7 days old
};

const PRIORITY_THRESHOLDS = {
    MEDIUM_DAYS: 3,     // Days until medium priority
    HIGH_DAYS: 7,       // Days until high priority
};

// ============================================================
// 9️⃣ USER ROLES - Maps to user_role table
// ============================================================
const USER_ROLES = {
    SUPER_ADMIN: 1,
    ADMIN: 2,
    MANAGER: 3,
    TEAM_LEADER: 4,
    STAFF: 5,
    VIEWER: 6,
};

// ============================================================
// 🔟 SPECIAL USER IDS - Known system users
// ============================================================
const SPECIAL_USERS = {
    SYSTEM: 0,          // System-generated actions
    IT_ADMIN: 1001,     // IT Department Admin
    HR_ADMIN: 1078,     // HR Department Admin
};

// ============================================================
// 1️⃣1️⃣ DATA TYPES - Used in t_ticket_work_data.data_type
// ============================================================
const DATA_TYPES = {
    REPORT: 'report',           // Report/tracking data
    ORIGINAL: 'original',       // Original value before change
    CHANGED: 'changed',         // Changed value
    METADATA: 'metadata',       // Additional metadata
};

// ============================================================
// 1️⃣2️⃣ FIELD TYPES - Used in t_ticket_work_data.field_type (visibility)
// ============================================================
const FIELD_VISIBILITY = {
    PUBLIC: 'public',           // Visible to all
    ADMIN: 'admin',             // Visible to admins only
    INTERNAL: 'internal',       // Internal use only
};

// ============================================================
// 1️⃣3️⃣ RESOURCE CATEGORIES - Maps to m_resource_category
// These are used in resource_m_data.resource_category
// ============================================================
const RESOURCE_CATEGORIES = {
    UOM: 'uom',                         // Unit of Measure
    ALLOWANCE: 'allowance',             // Allowance rules
    BT_TYPE: 'bt_type',                 // Business Trip Type
    BT_SUBTYPE: 'bt_subtype',           // Business Trip Sub-type
    EXPENDITURE: 'expenditure',         // Expenditure category
    FLIGHT_CLASS: 'flight_class',       // Airline Class
    HOTEL_STAR: 'hotel_star',           // Hotel rating
    LAPTOP_SPEC: 'laptop_spec',         // IT Asset specifications
    SRF_PURPOSE: 'srf_purpose',         // Purpose of Sample Request
    SUPPORT_TYPE: 'support_type',       // IT Support Category
    SAMPLE_CATEGORY: 'sample_category', // SRF Sample Category
    MEETING_ROOM: 'meeting_room',       // Admin Meeting Room
};

/**
 * ⚠️ LEGACY MASTER TABLES (DEPRECATED)
 * These tables are now READ-ONLY. Use resource_m_data instead.
 * - m_allowance
 * - m_bt_type
 * - m_bt_subtype
 * - m_expenditure
 * - m_flight_class
 * - m_hotel_star
 * - m_laptop_spec
 * - m_srf_purpose
 * - m_support_type
 * - m_sample_category
 * - m_uom
 */

// ============================================================
// EXPORT - All constants in one place
// ============================================================
module.exports = {
    // IDs
    SERVICE_IDS,
    STATUS_IDS,
    APPROVAL_STATUS,
    USER_ROLES,
    SPECIAL_USERS,

    // Types/Enums
    EVENT_TYPES,
    ASSIGNMENT_TYPES,
    ENTITY_TYPES,
    DATA_TYPES,
    FIELD_VISIBILITY,
    RESOURCE_CATEGORIES,

    // Workflow
    APPROVAL_LEVELS,
    PRIORITY_LEVELS,
    PRIORITY_THRESHOLDS,
};
