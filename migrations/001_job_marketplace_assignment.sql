-- =============================================================================
-- Phase 1: Job Marketplace & Assignment System - Database Migration
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create EAV Table for Work Data
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_ticket_work_data (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(20) NULL COMMENT 'NULL for auto-approve assignments',
  assignment_id INT NULL COMMENT 'Link to t_ticket_assignment',
  service_id INT NOT NULL,
  data_type VARCHAR(50) NOT NULL COMMENT 'e.g., application, asset_allocation',
  entity_id VARCHAR(50) COMMENT 'Group related fields (e.g., APP001)',
  
  -- EAV Fields
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT,
  field_type ENUM('text', 'number', 'date', 'json', 'file') DEFAULT 'text',
  
  -- Metadata
  created_by VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (ticket_id) REFERENCES t_ticket(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES t_ticket_assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES m_service(service_id),
  
  -- Indexes
  INDEX idx_ticket_service (ticket_id, service_id),
  INDEX idx_assignment (assignment_id),
  INDEX idx_data_type (data_type),
  INDEX idx_entity (entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='EAV table for service-specific work data across all modules';

-- -----------------------------------------------------------------------------
-- 2. Add Assignment Configuration to m_service
-- -----------------------------------------------------------------------------
ALTER TABLE m_service 
ADD COLUMN IF NOT EXISTS assignment_config JSON NULL 
COMMENT 'Configuration for assignment behavior: mode, max_assignees, etc.';

-- Example: Set Job Marketplace to manual review mode
UPDATE m_service 
SET assignment_config = JSON_OBJECT(
  'mode', 'manual_review',
  'max_assignees', NULL,
  'auto_close_when', 'never'
)
WHERE service_id = 19;

-- -----------------------------------------------------------------------------
-- 3. Verify Table Structure
-- -----------------------------------------------------------------------------
-- Uncomment to verify
-- DESC t_ticket_work_data;
-- SELECT * FROM m_service WHERE service_id = 19;

-- -----------------------------------------------------------------------------
-- 4. Sample Data (Optional - for testing)
-- -----------------------------------------------------------------------------
/*
-- Example: Insert application data for testing
INSERT INTO t_ticket_work_data 
(ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
VALUES 
('TEST001', 19, 'application', 'APP001', 'applicant_id', '1069', 'text', '1069'),
('TEST001', 19, 'application', 'APP001', 'cover_letter', 'I am interested...', 'text', '1069'),
('TEST001', 19, 'application', 'APP001', 'resume_path', '/uploads/resume.pdf', 'file', '1069'),
('TEST001', 19, 'application', 'APP001', 'status', 'pending', 'text', '1069'),
('TEST001', 19, 'application', 'APP001', 'applied_at', '2025-12-03 16:00:00', 'date', '1069');

-- Query to view grouped data
SELECT 
  entity_id,
  JSON_OBJECTAGG(field_name, field_value) as application_data
FROM t_ticket_work_data
WHERE ticket_id = 'TEST001' AND data_type = 'application'
GROUP BY entity_id;
*/

-- =============================================================================
-- Migration Complete
-- =============================================================================
