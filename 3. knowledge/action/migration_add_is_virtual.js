const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbHots } = require('../config/db');

async function runMigration() {
    try {
        console.log('🔄 Starting migration: Adding is_virtual to t_document...');

        // Check if column exists first
        const [columns] = await dbHots.promise().query(`
            SHOW COLUMNS FROM t_document LIKE 'is_virtual'
        `);

        if (columns.length > 0) {
            console.log('⚠️ Column is_virtual already exists. Skipping.');
        } else {
            await dbHots.promise().query(`
                ALTER TABLE t_document 
                ADD COLUMN is_virtual TINYINT(1) DEFAULT 0 AFTER snapshot_data
            `);
            console.log('✅ Successfully added column is_virtual to t_document');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
