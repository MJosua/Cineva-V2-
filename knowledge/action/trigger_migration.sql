-- =====================================================
-- TRIGGER SYSTEM MIGRATION SCRIPT
-- Date: 2026-01-02
-- Purpose: Create m_service_trigger_function table
--          and migrate from legacy custom functions
-- =====================================================

USE hots;

-- =====================================================
-- Step 1: Create new m_service_trigger_function table
-- =====================================================

CREATE TABLE IF NOT EXISTS m_service_trigger_function (
    function_id INT AUTO_INCREMENT PRIMARY KEY,
    function_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique identifier for calling, e.g., srf_document_generator',
    function_name VARCHAR(255) NOT NULL COMMENT 'Human readable name',
    function_type ENUM('sql', 'handler', 'template') NOT NULL COMMENT 'Type: sql=stored query, handler=JS function, template=HTML template',
    description TEXT COMMENT 'Documentation and description',
    
    -- For SQL type functions
    sql_query TEXT COMMENT 'Editable SQL query for frontend UI',
    sql_params JSON COMMENT 'Parameter definitions: [{name, type, required, default}]',
    
    -- For handler type functions
    handler_path VARCHAR(255) COMMENT 'Path to JS handler, e.g., script/trigger-functions/srf_document_generator',
    handler_params JSON COMMENT 'Expected parameters for the handler',
    
    -- For template type
    template_content TEXT COMMENT 'HTML/Mustache template content',
    
    -- Metadata
    category VARCHAR(100) DEFAULT 'general' COMMENT 'Category for grouping: document, email, query, etc.',
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_function_key (function_key),
    INDEX idx_function_type (function_type),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Reusable function library for trigger engine - stores SQL, handlers, templates';

-- =====================================================
-- Step 2: Insert existing trigger functions (handlers)
-- =====================================================

INSERT IGNORE INTO m_service_trigger_function 
(function_key, function_name, function_type, handler_path, description, category) 
VALUES 
('srf_document_generator', 'SRF Document Generator', 'handler', 'script/trigger-functions/srf_document_generator.js', 
 'Generates Sample Request Form (SRF) PDF document from ticket data', 'document'),

('publishJobListing', 'Publish Job Listing', 'handler', 'script/trigger-functions/publishJobListing.js', 
 'Publishes job listing to external job board', 'integration');

-- =====================================================
-- Step 3: Migrate useful functions from m_custom_functions
-- =====================================================

INSERT IGNORE INTO m_service_trigger_function 
(function_key, function_name, function_type, handler_path, description, category, created_by)
SELECT 
    LOWER(REPLACE(REPLACE(name, ' ', '_'), '-', '_')) as function_key,
    name as function_name,
    'handler' as function_type,
    CONCAT('legacy/', handler) as handler_path,
    CONCAT('Migrated from m_custom_functions. Type: ', type, '. Handler: ', handler) as description,
    CASE 
        WHEN type = 'document_generation' THEN 'document'
        WHEN type = 'email_notification' THEN 'email'
        WHEN type = 'excel_processing' THEN 'excel'
        WHEN type = 'api_integration' THEN 'integration'
        ELSE 'general'
    END as category,
    created_by
FROM m_custom_functions 
WHERE is_active = 1 
  AND (is_deleted = 0 OR is_deleted IS NULL)
  AND name NOT IN (SELECT function_name FROM m_service_trigger_function);

-- =====================================================
-- Step 4: Deactivate legacy t_service_custom_functions
-- (Don't delete yet - keep for rollback)
-- =====================================================

UPDATE t_service_custom_functions SET is_active = 0;

-- =====================================================
-- Step 5: Verify migration
-- =====================================================

SELECT '=== New m_service_trigger_function table ===' as info;
SELECT function_key, function_name, function_type, category FROM m_service_trigger_function;

SELECT '=== Legacy t_service_custom_functions (now inactive) ===' as info;
SELECT id, service_id, function_id, trigger_event, is_active FROM t_service_custom_functions;

SELECT '=== m_service_triggers (Core Engine - Active) ===' as info;
SELECT trigger_id, service_id, trigger_name, trigger_type, active FROM m_service_triggers WHERE active = 1;
