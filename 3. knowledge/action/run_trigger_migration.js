/**
 * Trigger Migration Script
 * Run with: node migrations/run_trigger_migration.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    console.log('🚀 Starting Trigger System Migration...\n');

    const connection = await mysql.createConnection({
        host: process.env.DEV_DB_HOST || '172.16.32.20',
        user: process.env.DEV_DB_USER || 'root',
        password: process.env.DEV_DB_PASSWORD || 'root',
        database: process.env.DEV_DB_NAME_HT || 'hots',
        multipleStatements: true
    });

    try {
        // Step 1: Create new table
        console.log('📦 Step 1: Creating m_service_trigger_function table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS m_service_trigger_function (
                function_id INT AUTO_INCREMENT PRIMARY KEY,
                function_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique identifier for calling',
                function_name VARCHAR(255) NOT NULL COMMENT 'Human readable name',
                function_type ENUM('sql', 'handler', 'template') NOT NULL COMMENT 'Type of function',
                description TEXT COMMENT 'Documentation',
                sql_query TEXT COMMENT 'SQL query for sql type',
                sql_params JSON COMMENT 'Parameter definitions',
                handler_path VARCHAR(255) COMMENT 'Path to JS handler',
                handler_params JSON COMMENT 'Handler parameters',
                template_content TEXT COMMENT 'Template content',
                category VARCHAR(100) DEFAULT 'general' COMMENT 'Category for grouping',
                is_active TINYINT(1) DEFAULT 1,
                created_by INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_function_key (function_key),
                INDEX idx_function_type (function_type),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Reusable function library for trigger engine'
        `);
        console.log('✅ Table created successfully\n');

        // Step 2: Insert existing trigger functions
        console.log('📝 Step 2: Inserting known trigger functions...');
        await connection.query(`
            INSERT IGNORE INTO m_service_trigger_function 
            (function_key, function_name, function_type, handler_path, description, category) 
            VALUES 
            ('srf_document_generator', 'SRF Document Generator', 'handler', 
             'script/trigger-functions/srf_document_generator.js', 
             'Generates Sample Request Form (SRF) PDF document from ticket data', 'document'),
            ('publishJobListing', 'Publish Job Listing', 'handler', 
             'script/trigger-functions/publishJobListing.js', 
             'Publishes job listing to external job board', 'integration')
        `);
        console.log('✅ Trigger functions inserted\n');

        // Step 3: Migrate from m_custom_functions
        console.log('🔄 Step 3: Migrating from m_custom_functions...');
        const [migrated] = await connection.query(`
            INSERT IGNORE INTO m_service_trigger_function 
            (function_key, function_name, function_type, handler_path, description, category, created_by)
            SELECT 
                LOWER(REPLACE(REPLACE(name, ' ', '_'), '-', '_')) as function_key,
                name as function_name,
                'handler' as function_type,
                CONCAT('legacy/', handler) as handler_path,
                CONCAT('Migrated from m_custom_functions. Type: ', type) as description,
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
              AND name NOT IN (SELECT function_name FROM m_service_trigger_function)
        `);
        console.log(`✅ Migrated ${migrated.affectedRows} functions from m_custom_functions\n`);

        // Step 4: Deactivate legacy table
        console.log('🔴 Step 4: Deactivating legacy t_service_custom_functions...');
        const [deactivated] = await connection.query(`
            UPDATE t_service_custom_functions SET is_active = 0
        `);
        console.log(`✅ Deactivated ${deactivated.affectedRows} legacy entries\n`);

        // Step 5: Verify
        console.log('📊 Step 5: Verification...\n');

        const [newFunctions] = await connection.query(`
            SELECT function_key, function_name, function_type, category 
            FROM m_service_trigger_function
        `);
        console.log('=== New m_service_trigger_function table ===');
        console.table(newFunctions);

        const [legacyRows] = await connection.query(`
            SELECT id, service_id, function_id, trigger_event, is_active 
            FROM t_service_custom_functions
        `);
        console.log('\n=== Legacy t_service_custom_functions (now inactive) ===');
        console.table(legacyRows);

        const [triggers] = await connection.query(`
            SELECT trigger_id, service_id, trigger_name, trigger_type, active 
            FROM m_service_triggers WHERE active = 1
        `);
        console.log('\n=== m_service_triggers (Core Engine - Active) ===');
        console.table(triggers);

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

runMigration().catch(console.error);
