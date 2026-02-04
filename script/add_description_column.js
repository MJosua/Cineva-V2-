require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

async function migrate() {
    console.log("Adding description column to EVENT_t_campaign...");
    try {
        const sql = "ALTER TABLE EVENT_t_campaign ADD COLUMN description TEXT AFTER name";
        await dbQueryHots(sql);
        console.log("Migration successful: Added description column.");
        process.exit(0);
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'description' already exists.");
            process.exit(0);
        }
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrate();
