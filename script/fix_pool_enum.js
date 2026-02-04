require('dotenv').config();
const { dbQueryHots } = require('../config/db');

async function fixEnum() {
    try {
        console.log("Fixing EVENT_m_pool type ENUM...");

        // Add WHITELIST to ENUM
        await dbQueryHots(`
            ALTER TABLE EVENT_m_pool 
            MODIFY COLUMN type ENUM('VOUCHER', 'SERIAL', 'EMAIL', 'WHITELIST') DEFAULT 'SERIAL'
        `);

        console.log("✅ Successfully updated type column to include WHITELIST.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Failed to update schema:", e);
        process.exit(1);
    }
}

fixEnum();
