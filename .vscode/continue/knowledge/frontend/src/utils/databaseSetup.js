
const dbHots = require('../config/database');

const createTablesIfNotExist = () => {
    // Create custom function logs table
    const createLogsTable = `
        CREATE TABLE IF NOT EXISTS t_custom_function_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            service_id INT,
            function_name VARCHAR(255) NOT NULL,
            trigger_event VARCHAR(100),
            status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
            result_data JSON,
            error_message TEXT,
            execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INT,
            INDEX idx_ticket_id (ticket_id),
            INDEX idx_status (status)
        )
    `;

    // Create generated documents table
    const createDocumentsTable = `
        CREATE TABLE IF NOT EXISTS t_generated_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            document_type VARCHAR(100),
            file_path VARCHAR(500) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            template_used VARCHAR(255),
            INDEX idx_ticket_id (ticket_id)
        )
    `;

    dbHots.execute(createLogsTable, (err) => {
        if (err) {
            console.error('Error creating logs table:', err);
        } else {
            console.log('Custom function logs table ready');
        }
    });

    dbHots.execute(createDocumentsTable, (err) => {
        if (err) {
            console.error('Error creating documents table:', err);
        } else {
            console.log('Generated documents table ready');
        }
    });
};

module.exports = { createTablesIfNotExist };
