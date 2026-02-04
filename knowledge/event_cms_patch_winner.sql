-- ============================================================================
-- Schema Patch: Fix EVENT_t_winner
-- Run this if you get "Unknown column 'pool_id'" error
-- ============================================================================

-- Option A: Nuke and Recreate (Simplest for dev)
DROP TABLE IF EXISTS EVENT_t_winner;

CREATE TABLE EVENT_t_winner (
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
-- Retry Seed Logic for Winner
-- ============================================================================
-- Note: Re-run your variable setters if doing this in a separate session
-- SET @campaign_id = (SELECT campaign_id FROM EVENT_t_campaign WHERE slug='tw-2024' LIMIT 1);
-- SET @pool_serial = (SELECT pool_id FROM EVENT_m_pool WHERE name='Golden Ticket Draw' LIMIT 1);
-- SET @sub_winner = (SELECT submission_id FROM EVENT_t_submission WHERE participant_name='Wang Xiao Ming' LIMIT 1);

-- INSERT INTO EVENT_t_winner 
-- (campaign_id, pool_id, item_id, submission_id, draw_strategy, claimed)
-- SELECT @campaign_id, @pool_serial, item_id, @sub_winner, 'RANDOM', 0
-- FROM EVENT_m_pool_item WHERE value = 'GOLD-001';
