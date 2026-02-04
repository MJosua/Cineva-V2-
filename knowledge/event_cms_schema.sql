-- ============================================================================
-- Event Engine Database Schema
-- Version: 2.0
-- Date: 2026-02-02
-- ============================================================================
-- 
-- EXECUTION ORDER:
-- 1. EVENT_t_campaign (no dependencies)
-- 2. EVENT_t_submission (depends on campaign)
-- 3. EVENT_m_pool (depends on campaign)
-- 4. EVENT_m_pool_item (depends on pool)
-- 5. EVENT_t_winner (depends on campaign, pool, pool_item)
-- 6. EVENT_t_log (optional, no strict dependencies)
--
-- IDEMPOTENT: Uses CREATE TABLE IF NOT EXISTS
-- ============================================================================

-- Ensure we're in the correct database
-- USE your_database_name;

-- ============================================================================
-- 1. EVENT_t_campaign
-- Campaign/Event master configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS EVENT_t_campaign (
    campaign_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) NULL COMMENT 'Links to t_ticket for Core Engine workflow',
    slug VARCHAR(100) UNIQUE NOT NULL COMMENT 'URL-friendly identifier: tw-2024',
    name VARCHAR(255) NOT NULL,
    status ENUM('draft', 'active', 'paused', 'ended') DEFAULT 'draft',
    
    -- JSON Configuration columns
    theme_config JSON COMMENT 'Colors, fonts, background URLs',
    block_schema JSON COMMENT 'Page builder blocks structure',
    settings_config JSON COMMENT 'Rules: start_date, end_date, limits',
    
    created_by INT NULL COMMENT 'FK to user.user_id',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_ticket (ticket_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. EVENT_t_submission
-- Participant form submissions (high volume)
-- ============================================================================
CREATE TABLE IF NOT EXISTS EVENT_t_submission (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    
    -- Flat columns for common participant data
    participant_name VARCHAR(255),
    participant_contact VARCHAR(255) COMMENT 'Phone or Email',
    receipt_codes TEXT COMMENT 'Comma-separated or JSON array',
    
    -- Dynamic fields for event-specific data
    extra_data JSON COMMENT 'Custom form fields, image URLs, etc.',
    
    -- Approval workflow
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason VARCHAR(255) NULL,
    
    -- Tracking
    ip_address VARCHAR(45),
    user_agent TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    updated_by INT NULL COMMENT 'FK to user.user_id (operator who reviewed)',
    updated_at DATETIME NULL,

    FOREIGN KEY (campaign_id) REFERENCES EVENT_t_campaign(campaign_id) ON DELETE CASCADE,
    INDEX idx_campaign_status (campaign_id, status),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. EVENT_m_pool
-- Reward pool metadata (coupons, serial codes, vouchers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS EVENT_m_pool (
    pool_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    name VARCHAR(255) NOT NULL COMMENT 'Pool display name',
    description TEXT NULL,
    type ENUM('VOUCHER', 'SERIAL', 'EMAIL') DEFAULT 'SERIAL' COMMENT 'Pool type',
    
    -- Configuration as JSON
    config JSON COMMENT 'uses_per_user, valid_from, valid_until, rules, effects',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES EVENT_t_campaign(campaign_id) ON DELETE CASCADE,
    INDEX idx_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. EVENT_m_pool_item
-- Individual items within a pool (codes, serial numbers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS EVENT_m_pool_item (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pool_id INT NOT NULL,
    value VARCHAR(255) NOT NULL COMMENT 'The code/serial/email value',
    
    -- Usage tracking
    is_used TINYINT(1) DEFAULT 0,
    used_at DATETIME NULL,
    used_by_submission_id INT NULL COMMENT 'FK to submission that consumed this item',
    
    FOREIGN KEY (pool_id) REFERENCES EVENT_m_pool(pool_id) ON DELETE CASCADE,
    UNIQUE INDEX idx_pool_value (pool_id, value),
    INDEX idx_is_used (is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. EVENT_t_winner
-- Winner draw results
-- ============================================================================
CREATE TABLE IF NOT EXISTS EVENT_t_winner (
    winner_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    pool_id INT NOT NULL,
    item_id BIGINT NOT NULL COMMENT 'The pool item that was won',
    submission_id INT NULL COMMENT 'FK to winning submission if applicable',
    
    -- Draw metadata
    drawn_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    drawn_by INT NULL COMMENT 'FK to user.user_id',
    draw_strategy VARCHAR(20) COMMENT 'RANDOM, FIRST_N, etc.',
    
    -- Claim tracking
    claimed TINYINT(1) DEFAULT 0,
    claimed_at DATETIME NULL,
    claim_notes TEXT NULL,
    
    FOREIGN KEY (campaign_id) REFERENCES EVENT_t_campaign(campaign_id) ON DELETE CASCADE,
    FOREIGN KEY (pool_id) REFERENCES EVENT_m_pool(pool_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES EVENT_m_pool_item(item_id) ON DELETE CASCADE,
    INDEX idx_campaign_pool (campaign_id, pool_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. EVENT_t_log (Optional - Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS EVENT_t_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NULL,
    user_id INT NULL,
    action_type VARCHAR(50) COMMENT 'CREATE_CAMPAIGN, APPROVE_SUBMISSION, DRAW_WINNER, etc.',
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_campaign (campaign_id),
    INDEX idx_user (user_id),
    INDEX idx_action (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VALIDATION QUERIES (Run after schema creation)
-- ============================================================================

-- Check all tables exist
-- SELECT TABLE_NAME FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'EVENT_%';

-- Check foreign keys
-- SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
-- FROM information_schema.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_NAME LIKE 'EVENT_%';

-- ============================================================================
-- COLUMN NAME → API RESPONSE MAPPING
-- ============================================================================
-- 
-- EVENT_t_campaign:
--   campaign_id     → data.campaign_id
--   ticket_id       → data.ticket_id
--   slug            → data.slug
--   name            → data.name
--   status          → data.status
--   theme_config    → data.theme_config (parsed JSON)
--   block_schema    → data.block_schema (parsed JSON)
--   settings_config → data.settings_config (parsed JSON)
--   created_by      → data.created_by
--   created_at      → data.created_at
--   updated_at      → data.updated_at
--
-- EVENT_t_submission:
--   submission_id      → data.submissions[].submission_id
--   campaign_id        → data.submissions[].campaign_id
--   participant_name   → data.submissions[].participant_name
--   participant_contact→ data.submissions[].participant_contact
--   receipt_codes      → data.submissions[].receipt_codes
--   extra_data         → data.submissions[].extra_data (parsed JSON)
--   status             → data.submissions[].status
--   rejection_reason   → data.submissions[].rejection_reason
--   ip_address         → data.submissions[].ip_address
--   user_agent         → data.submissions[].user_agent
--   submitted_at       → data.submissions[].submitted_at
--   updated_by         → data.submissions[].updated_by
--   updated_at         → data.submissions[].updated_at
--
-- EVENT_m_pool:
--   pool_id     → data.pools[].pool_id
--   campaign_id → data.pools[].campaign_id
--   name        → data.pools[].name
--   description → data.pools[].description
--   type        → data.pools[].type
--   config      → data.pools[].config (parsed JSON)
--   (computed)  → data.pools[].total_items (COUNT from pool_item)
--   (computed)  → data.pools[].used_items (SUM is_used=1)
--   (computed)  → data.pools[].status (logic based on counts)
--
-- EVENT_m_pool_item:
--   item_id                → data.items[].item_id
--   pool_id                → data.items[].pool_id
--   value                  → data.items[].value
--   is_used                → data.items[].is_used
--   used_at                → data.items[].used_at
--   used_by_submission_id  → data.items[].used_by_submission_id
--
-- ============================================================================
