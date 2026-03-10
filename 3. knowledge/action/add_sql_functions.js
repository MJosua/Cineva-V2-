/**
 * Add Example SQL Functions to m_service_trigger_function
 * 
 * Run with: node migrations/add_sql_functions.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function addSqlFunctions() {
    console.log('🚀 Adding example SQL functions...\n');

    const connection = await mysql.createConnection({
        host: process.env.DEV_DB_HOST || '172.16.32.20',
        user: process.env.DEV_DB_USER || 'root',
        password: process.env.DEV_DB_PASSWORD || 'root',
        database: process.env.DEV_DB_NAME_HT || 'hots'
    });

    try {
        // Example 1: Get ticket summary (SELECT only - safe)
        await connection.query(`
            INSERT IGNORE INTO m_service_trigger_function 
            (function_key, function_name, function_type, description, category, sql_query, sql_params)
            VALUES 
            ('get_ticket_summary', 'Get Ticket Summary', 'sql', 
             'Retrieves ticket summary for a given ticket ID. Safe SELECT query.',
             'query',
             'SELECT t.ticket_id, t.status_id, s.service_name, ts.status_name, t.creation_date FROM t_ticket t LEFT JOIN m_service s ON s.service_id = t.service_id LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id WHERE t.ticket_id = ?',
             '[":ticketId"]')
        `);
        console.log('✅ Added: get_ticket_summary');

        // Example 2: Count tickets by service (analytics query)
        await connection.query(`
            INSERT IGNORE INTO m_service_trigger_function 
            (function_key, function_name, function_type, description, category, sql_query, sql_params)
            VALUES 
            ('count_tickets_by_service', 'Count Tickets By Service', 'sql', 
             'Counts open tickets grouped by service. For dashboard analytics.',
             'analytics',
             'SELECT s.service_id, s.service_name, COUNT(t.ticket_id) as ticket_count FROM m_service s LEFT JOIN t_ticket t ON t.service_id = s.service_id WHERE t.status_id NOT IN (4, 5) GROUP BY s.service_id ORDER BY ticket_count DESC',
             '[]')
        `);
        console.log('✅ Added: count_tickets_by_service');

        // Example 3: Update ticket work data (safe UPDATE)
        await connection.query(`
            INSERT IGNORE INTO m_service_trigger_function 
            (function_key, function_name, function_type, description, category, sql_query, sql_params)
            VALUES 
            ('update_work_data_field', 'Update Work Data Field', 'sql', 
             'Updates a specific field in t_ticket_work_data. Uses parameterized values.',
             'update',
             'UPDATE t_ticket_work_data SET field_value = ?, updated_at = NOW() WHERE ticket_id = ? AND field_name = ?',
             '[":newValue", ":ticketId", ":fieldName"]')
        `);
        console.log('✅ Added: update_work_data_field');

        // Example 4: Insert analytics log (safe INSERT)
        await connection.query(`
            INSERT IGNORE INTO m_service_trigger_function 
            (function_key, function_name, function_type, description, category, sql_query, sql_params)
            VALUES 
            ('log_ticket_event', 'Log Ticket Event', 'sql', 
             'Inserts an analytics event for a ticket action.',
             'logging',
             'INSERT INTO t_ticket_analytics (ticket_id, service_id, event_type, ref_key, dim_1, created_by) VALUES (?, ?, ?, ?, ?, ?)',
             '[":ticketId", ":serviceId", ":eventType", ":refKey", ":dimension", ":userId"]')
        `);
        console.log('✅ Added: log_ticket_event');

        // Show all SQL functions
        const [functions] = await connection.query(`
            SELECT function_key, function_name, function_type, category,
                   LEFT(sql_query, 60) as sql_preview
            FROM m_service_trigger_function 
            WHERE function_type = 'sql'
        `);

        console.log('\n=== SQL Functions Available ===');
        console.table(functions);

        console.log('\n🎉 SQL functions added successfully!');
        console.log('\n📖 Usage Example:');
        console.log(`
In m_service_triggers.trigger_config:
{
    "actions": [{
        "action": "execute_function",
        "params": {
            "function": "get_ticket_summary",
            "args": { "ticketId": ":ticketId" }
        }
    }]
}
        `);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

addSqlFunctions().catch(console.error);
