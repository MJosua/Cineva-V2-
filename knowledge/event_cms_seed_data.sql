-- ============================================================================
-- Event Engine Seed Data (Mock)
-- Version: 1.0
-- Date: 2026-02-02
-- 
-- PURPOSE: Populate tables with realistic test data for "Taiwan 2024 Event"
-- DEPENDENCIES: Core tables (m_service, t_ticket) are referenced but not inserted 
--               to avoid breaking core. We use placeholder IDs.
-- ============================================================================

-- 1. CAMPAIGN: Taiwan 2024 Event
-- Ticket ID 'EVT-2024-001' mimics a Core Engine ticket
INSERT INTO EVENT_t_campaign 
(ticket_id, slug, name, status, theme_config, settings_config, created_by)
VALUES 
('EVT-2024-001', 'tw-2024', 'Taiwan New Year 2024', 'active', 
 '{
    "primary_color": "#E53E3E", 
    "font_family": "Inter", 
    "background_url": "/uploads/bg-cny.jpg"
  }', 
 '{
    "start_date": "2024-01-01T00:00:00Z", 
    "end_date": "2024-02-28T23:59:59Z", 
    "require_receipt": true,
    "max_submissions_user": 5
  }', 
 1
);

SET @campaign_id = LAST_INSERT_ID(); -- Get the ID for foreign keys

-- 2. REWARD POOLS

-- Pool A: Vouchers (Unlimited use, low value)
INSERT INTO EVENT_m_pool (campaign_id, name, description, type, config)
VALUES (@campaign_id, 'Welcome Voucher', 'Get 50 points on first submission', 'VOUCHER', 
'{
    "uses_per_user": 1,
    "valid_until": "2025-01-31T23:59:59Z",
    "effects": [{"type": "points", "config": {"points": 50}}]
}');
SET @pool_voucher = LAST_INSERT_ID();

-- Pool B: Serial Codes (High value, unique, limited)
INSERT INTO EVENT_m_pool (campaign_id, name, description, type, config)
VALUES (@campaign_id, 'Golden Ticket Draw', 'Grand Prize Serial Numbers', 'SERIAL', 
'{
    "uses_per_user": 1,
    "valid_until": "2024-02-28T23:59:59Z"
}');
SET @pool_serial = LAST_INSERT_ID();

-- 3. POOL ITEMS (for Serial Pool)
-- Insert 50 serial codes
INSERT INTO EVENT_m_pool_item (pool_id, value, is_used) VALUES 
(@pool_serial, 'GOLD-001', 0), (@pool_serial, 'GOLD-002', 0), (@pool_serial, 'GOLD-003', 0),
(@pool_serial, 'GOLD-004', 0), (@pool_serial, 'GOLD-005', 0), (@pool_serial, 'GOLD-006', 0),
(@pool_serial, 'GOLD-007', 0), (@pool_serial, 'GOLD-008', 0), (@pool_serial, 'GOLD-009', 0),
(@pool_serial, 'GOLD-010', 0), (@pool_serial, 'GOLD-011', 0), (@pool_serial, 'GOLD-012', 0),
(@pool_serial, 'GOLD-013', 0), (@pool_serial, 'GOLD-014', 0), (@pool_serial, 'GOLD-015', 0),
(@pool_serial, 'GOLD-016', 0), (@pool_serial, 'GOLD-017', 0), (@pool_serial, 'GOLD-018', 0),
(@pool_serial, 'GOLD-019', 0), (@pool_serial, 'GOLD-020', 0), (@pool_serial, 'GOLD-021', 0),
(@pool_serial, 'GOLD-022', 0), (@pool_serial, 'GOLD-023', 0), (@pool_serial, 'GOLD-024', 0),
(@pool_serial, 'GOLD-025', 0), (@pool_serial, 'GOLD-026', 0), (@pool_serial, 'GOLD-027', 0),
(@pool_serial, 'GOLD-028', 0), (@pool_serial, 'GOLD-029', 0), (@pool_serial, 'GOLD-030', 0),
(@pool_serial, 'GOLD-031', 0), (@pool_serial, 'GOLD-032', 0), (@pool_serial, 'GOLD-033', 0),
(@pool_serial, 'GOLD-034', 0), (@pool_serial, 'GOLD-035', 0), (@pool_serial, 'GOLD-036', 0),
(@pool_serial, 'GOLD-037', 0), (@pool_serial, 'GOLD-038', 0), (@pool_serial, 'GOLD-039', 0),
(@pool_serial, 'GOLD-040', 0), (@pool_serial, 'GOLD-041', 0), (@pool_serial, 'GOLD-042', 0),
(@pool_serial, 'GOLD-043', 0), (@pool_serial, 'GOLD-044', 0), (@pool_serial, 'GOLD-045', 0),
(@pool_serial, 'GOLD-046', 0), (@pool_serial, 'GOLD-047', 0), (@pool_serial, 'GOLD-048', 0),
(@pool_serial, 'GOLD-049', 0), (@pool_serial, 'GOLD-050', 0);

-- 4. SUBMISSIONS (Mix of Pending, Approved, Rejected)

-- Approved Submission (Winner)
INSERT INTO EVENT_t_submission 
(campaign_id, participant_name, participant_contact, receipt_codes, extra_data, status, ip_address, submitted_at, updated_by, updated_at)
VALUES 
(@campaign_id, 'Wang Xiao Ming', '0912-345-678', 'INV-2024001', 
 '{"store": "7-11 Xinyi", "amount": 500, "images": ["/uploads/rec1.jpg"]}', 
 'approved', '203.0.113.1', DATE_SUB(NOW(), INTERVAL 5 DAY), 1, NOW());
SET @sub_winner = LAST_INSERT_ID();

-- Approved Submission (Regular)
INSERT INTO EVENT_t_submission 
(campaign_id, participant_name, participant_contact, receipt_codes, extra_data, status, ip_address, submitted_at, updated_by, updated_at)
VALUES 
(@campaign_id, 'Lin Mei Ling', '0922-888-999', 'INV-2024002', 
 '{"store": "FamilyMart Daan", "amount": 120, "images": ["/uploads/rec2.jpg"]}', 
 'approved', '203.0.113.2', DATE_SUB(NOW(), INTERVAL 4 DAY), 1, NOW());

-- Pending Submission
INSERT INTO EVENT_t_submission 
(campaign_id, participant_name, participant_contact, receipt_codes, extra_data, status, ip_address, submitted_at)
VALUES 
(@campaign_id, 'Chen Wei', '0933-777-666', 'INV-2024003', 
 '{"store": "PX Mart", "amount": 800, "images": ["/uploads/rec3.jpg"]}', 
 'pending', '203.0.113.3', DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- Rejected Submission
INSERT INTO EVENT_t_submission 
(campaign_id, participant_name, participant_contact, receipt_codes, extra_data, status, rejection_reason, ip_address, submitted_at, updated_by, updated_at)
VALUES 
(@campaign_id, 'Spam Bot', '0000-000-000', 'INVALID', 
 '{"store": "Fake", "amount": 0}', 
 'rejected', 'Invalid Receipt Image', '192.168.1.1', DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NOW());

-- 4.5 Bulk Insert more Pending Submissions (to show volume)
INSERT INTO EVENT_t_submission (campaign_id, participant_name, participant_contact, receipt_codes, status, submitted_at) VALUES
(@campaign_id, 'User A', '0900-111-111', 'R-004', 'approved', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@campaign_id, 'User B', '0900-222-222', 'R-005', 'approved', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@campaign_id, 'User C', '0900-333-333', 'R-006', 'pending', NOW()),
(@campaign_id, 'User D', '0900-444-444', 'R-007', 'pending', NOW()),
(@campaign_id, 'User E', '0900-555-555', 'R-008', 'pending', NOW());

-- 5. WINNER SELECTION (Simulate a draw)
-- Let's say Wang Xiao Ming won GOLD-001
UPDATE EVENT_m_pool_item SET is_used = 1, used_at = NOW(), used_by_submission_id = @sub_winner
WHERE value = 'GOLD-001';

INSERT INTO EVENT_t_winner 
(campaign_id, pool_id, item_id, submission_id, draw_strategy, claimed)
SELECT @campaign_id, @pool_serial, item_id, @sub_winner, 'RANDOM', 0
FROM EVENT_m_pool_item WHERE value = 'GOLD-001';

-- ============================================================================
-- PSEUDO CORE ENGINE REFERENCES (Documentation only)
-- ============================================================================
-- In a real scenario, we would register the service:
-- INSERT INTO m_service (service_name, service_code, description) VALUES ('EVENT_ENGINE', 'EVT', 'Event Campaign Management');
-- 
-- And the ticket would be verified against t_ticket:
-- SELECT * FROM t_ticket WHERE ticket_id = 'EVT-2024-001';
