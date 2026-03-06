/**
 * 3. knowledge/cleanup_temp_files.js
 * Script to clean up unused temporary uploads older than 7 days.
 * 
 * Usage: node "3. knowledge/cleanup_temp_files.js"
 * Recommended: Schedule with cron or run manually.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST_HT,
    user: process.env.DB_USER_HT,
    password: process.env.DB_PASSWORD_HT,
    database: process.env.DB_NAME_HT,
};

async function cleanup() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database for cleanup.');

        // 1. Identify unused files older than 7 days
        // We look for is_used = 0 and upload_date < 7 days ago
        const [rows] = await connection.execute(
            `SELECT upload_id, file_path, filename 
             FROM t_temp_upload 
             WHERE is_used = 0 
               AND upload_date < DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        console.log(`Found ${rows.length} unused temporary files to delete.`);

        for (const row of rows) {
            const absolutePath = path.join(process.cwd(), 'public', row.file_path);

            // Delete from disk
            if (fs.existsSync(absolutePath)) {
                try {
                    fs.unlinkSync(absolutePath);
                    console.log(`Deleted file: ${absolutePath}`);
                } catch (err) {
                    console.error(`Failed to delete file from disk: ${absolutePath}`, err.message);
                }
            } else {
                console.log(`File not found on disk (skipping unlink): ${absolutePath}`);
            }

            // Delete from database
            await connection.execute('DELETE FROM t_temp_upload WHERE upload_id = ?', [row.upload_id]);
            console.log(`Deleted record from DB: ${row.upload_id}`);
        }

        console.log('Cleanup process completed.');
    } catch (error) {
        console.error('Cleanup error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

cleanup();
