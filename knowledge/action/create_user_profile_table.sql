-- Migration: Create user_profile table for HOTS
-- Date: 2026-01-05
-- Purpose: Store EAV data for user profiles including digital signature paths

CREATE TABLE IF NOT EXISTS hots.user_profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  attribute_name VARCHAR(100) NOT NULL,
  attribute_value TEXT,
  is_active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  UNIQUE KEY uq_user_attr (user_id, attribute_name),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example usage:
-- INSERT INTO hots.user_profile (user_id, attribute_name, attribute_value, created_by)
-- VALUES (123, 'default_signature', '/hots/signatures/123_sig.png', 123);
