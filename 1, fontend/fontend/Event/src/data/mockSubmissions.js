/**
 * Mock Submissions Data
 * Schema Source: EVENT_t_submission (from event_cms_schema.sql)
 * 
 * FIELD MAPPING (Old -> New):
 * - id -> submission_id
 * - event_id -> campaign_id (INT, links to EVENT_t_campaign.campaign_id)
 * - guest.name -> participant_name
 * - guest.phone / guest.email -> participant_contact
 * - form_data.receipt_no -> receipt_codes
 * - form_data (store, amount) + images -> extra_data (JSON)
 * - reviewed_by -> updated_by (INT, FK to user.user_id)
 * - reviewed_at -> updated_at
 * - review_notes -> rejection_reason (only for rejected status)
 * 
 * REMOVED FIELDS:
 * - guest (replaced by flat columns)
 * - form_data (merged into receipt_codes + extra_data)
 * - images (moved into extra_data.images)
 * - review_notes (renamed to rejection_reason, only for rejected)
 * 
 * NEW FIELDS:
 * - ip_address
 * - user_agent
 */

// Campaign ID mapping (slug -> id for FK compliance)
const CAMPAIGN_IDS = {
    "tw-2024": 1,
    "tw-2025": 2,
    "maldives-2025": 3
};

export const MOCK_SUBMISSIONS = [
    {
        submission_id: 1,
        campaign_id: CAMPAIGN_IDS["tw-2024"],
        participant_name: "王小明",
        participant_contact: "0912-345-678",
        receipt_codes: "AB-12345678",
        extra_data: {
            store: "7-11 台北信義店",
            amount: 450,
            images: ["/uploads/receipt-001.jpg"]
        },
        status: "pending",
        rejection_reason: null,
        ip_address: "203.145.92.10",
        user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)",
        submitted_at: "2025-01-30T08:15:00Z",
        updated_by: null,
        updated_at: null
    },
    {
        submission_id: 2,
        campaign_id: CAMPAIGN_IDS["tw-2024"],
        participant_name: "李美玲",
        participant_contact: "0923-456-789",
        receipt_codes: "CD-87654321",
        extra_data: {
            store: "全家 新北板橋店",
            amount: 680,
            images: ["/uploads/receipt-002.jpg"]
        },
        status: "approved",
        rejection_reason: null,
        ip_address: "118.163.55.23",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        submitted_at: "2025-01-29T14:30:00Z",
        updated_by: 1,
        updated_at: "2025-01-29T16:00:00Z"
    },
    {
        submission_id: 3,
        campaign_id: CAMPAIGN_IDS["tw-2024"],
        participant_name: "張大偉",
        participant_contact: "0934-567-890",
        receipt_codes: "EF-11223344",
        extra_data: {
            store: "萊爾富 台中中港店",
            amount: 320,
            images: ["/uploads/receipt-003.jpg"]
        },
        status: "rejected",
        rejection_reason: "Receipt date outside campaign period",
        ip_address: "61.220.132.88",
        user_agent: "Mozilla/5.0 (Android 13; Mobile)",
        submitted_at: "2025-01-28T10:45:00Z",
        updated_by: 1,
        updated_at: "2025-01-28T11:20:00Z"
    },
    {
        submission_id: 4,
        campaign_id: CAMPAIGN_IDS["tw-2024"],
        participant_name: "陳怡君",
        participant_contact: "0945-678-901",
        receipt_codes: "GH-55667788",
        extra_data: {
            store: "全聯 高雄三民店",
            amount: 890,
            images: ["/uploads/receipt-004.jpg", "/uploads/receipt-004b.jpg"]
        },
        status: "pending",
        rejection_reason: null,
        ip_address: "114.32.78.199",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        submitted_at: "2025-01-30T09:00:00Z",
        updated_by: null,
        updated_at: null
    },
    {
        submission_id: 5,
        campaign_id: CAMPAIGN_IDS["maldives-2025"],
        participant_name: "Ahmed Hassan",
        participant_contact: "+960-7123456",
        receipt_codes: "MDV-001",
        extra_data: {
            store: "Male Supermarket",
            amount: 150,
            images: []
        },
        status: "pending",
        rejection_reason: null,
        ip_address: "27.114.128.55",
        user_agent: "Mozilla/5.0 (Linux; Android 12)",
        submitted_at: "2025-01-30T07:30:00Z",
        updated_by: null,
        updated_at: null
    }
];

/**
 * Helper: Get submissions by campaign slug
 * @param {string} eventSlug - The campaign slug (e.g., "tw-2024")
 * @returns {Array} Filtered submissions
 */
export function getSubmissionsByEvent(eventSlug) {
    const campaignId = CAMPAIGN_IDS[eventSlug];
    if (!campaignId) return [];
    return MOCK_SUBMISSIONS.filter(s => s.campaign_id === campaignId);
}

/**
 * Helper: Get submission statistics for a campaign
 * @param {string} eventSlug - The campaign slug
 * @returns {Object} Stats object with total, pending, approved, rejected counts
 */
export function getSubmissionStats(eventSlug) {
    const subs = getSubmissionsByEvent(eventSlug);
    return {
        total: subs.length,
        pending: subs.filter(s => s.status === "pending").length,
        approved: subs.filter(s => s.status === "approved").length,
        rejected: subs.filter(s => s.status === "rejected").length
    };
}

// Export campaign ID lookup for components that need it
export { CAMPAIGN_IDS };
