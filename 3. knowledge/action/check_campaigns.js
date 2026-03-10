require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

async function check() {
    console.log("Checking EVENT_t_campaign...");
    try {
        const rows = await dbQueryHots("SELECT * FROM EVENT_t_campaign");
        console.log(`Found ${rows.length} campaigns in DB.`);
        rows.forEach(r => console.log(`[DB] ${r.name} (${r.slug})`));
        process.exit(0);
    } catch (e) {
        console.error("Error querying DB:", e);
        process.exit(1);
    }
}

check();
