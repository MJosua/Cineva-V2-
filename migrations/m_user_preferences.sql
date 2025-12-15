-- User Preferences Table
-- Stores all user preferences in a flexible key-value structure
-- Usage: dashboard pins, theme settings, table preferences, report defaults

CREATE TABLE IF NOT EXISTS hots.m_user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pref_category VARCHAR(50) NOT NULL COMMENT 'dashboard, theme, table, report, notification',
    pref_key VARCHAR(100) NOT NULL COMMENT 'Specific preference key within category',
    pref_value JSON COMMENT 'Flexible JSON value storage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Ensure one preference per user per category+key
    UNIQUE KEY unique_user_pref (user_id, pref_category, pref_key),
    INDEX idx_user (user_id),
    INDEX idx_category (pref_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example data:
-- INSERT INTO m_user_preferences (user_id, pref_category, pref_key, pref_value) VALUES
-- (1117, 'dashboard', 'pinned_ids', '[5, 10, 2]'),
-- (1117, 'dashboard', 'card_preview_10', '{"showTotal": true, "showPending": true}'),
-- (1117, 'theme', 'dark_mode', 'false'),
-- (1117, 'table', 'srf_report_columns', '["SRF No.", "Distributor", "Status", "Color"]'),
-- (1117, 'table', 'srf_report_last_view', '{"page": 1, "filters": {"year": 2025}}');

-- Categories and common keys:
-- ┌──────────────┬─────────────────────────┬────────────────────────────────────┐
-- │ Category     │ Key                     │ Value Type                         │
-- ├──────────────┼─────────────────────────┼────────────────────────────────────┤
-- │ dashboard    │ pinned_ids              │ [5, 10, 2] (array of dashboard IDs)│
-- │ dashboard    │ card_preview_{id}       │ {showTotal, showPending, ...}      │
-- │ theme        │ dark_mode               │ true/false                         │
-- │ theme        │ sidebar_collapsed       │ true/false                         │
-- │ theme        │ compact_mode            │ true/false                         │
-- │ table        │ {report}_columns        │ ["col1", "col2"] (visible columns) │
-- │ table        │ {report}_sort           │ {column, direction}                │
-- │ table        │ {report}_last_view      │ {page, filters, search}            │
-- │ report       │ default_date_range      │ "7" | "30" | "90" | "365"          │
-- │ report       │ default_export_format   │ "xlsx" | "csv" | "pdf"             │
-- │ notification │ email_digest            │ "daily" | "weekly" | "none"        │
-- └──────────────┴─────────────────────────┴────────────────────────────────────┘
