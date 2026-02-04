-- User Notification System (Actionable Inbox)
-- Run this script on your HOTS database

CREATE TABLE IF NOT EXISTS user_notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Recipient user ID',
    type VARCHAR(50) COMMENT 'Event type: approval_needed, ticket_update, new_comment, assignment',
    title VARCHAR(255) COMMENT 'User-facing title',
    message TEXT COMMENT 'Detailed message body',
    data_payload JSON COMMENT 'Action data: { url, ticket_id, etc. }',
    is_read TINYINT(1) DEFAULT 0 COMMENT '0=Unread, 1=Read',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

