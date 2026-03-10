const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

async function migrate() {
    console.log("🚀 Starting Phase 4.1 Migration...");

    try {
        // 1. Add published_at column
        console.log("1. Adding 'published_at' column...");
        try {
            await dbQueryHots(`
                ALTER TABLE EVENT_t_campaign 
                ADD COLUMN published_at DATETIME NULL AFTER status;
            `);
            console.log("   ✅ 'published_at' added.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("   ⚠️ 'published_at' already exists. Skipping.");
            } else {
                throw e;
            }
        }

        // 2. Add is_locked column
        console.log("2. Adding 'is_locked' column...");
        try {
            await dbQueryHots(`
                ALTER TABLE EVENT_t_campaign 
                ADD COLUMN is_locked TINYINT(1) DEFAULT 0 AFTER published_at;
            `);
            console.log("   ✅ 'is_locked' added.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("   ⚠️ 'is_locked' already exists. Skipping.");
            } else {
                throw e;
            }
        }

        console.log("\n✅ Migration Phase 4.1 Complete.");
        process.exit(0);
    } catch (e) {
        console.error("\n❌ Migration Failed:", e);
        process.exit(1);
    }
}

migrate();
