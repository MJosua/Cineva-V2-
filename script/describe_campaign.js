require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

async function check() {
    console.log("Describing EVENT_t_campaign...");
    try {
        const rows = await dbQueryHots("DESCRIBE EVENT_t_campaign");
        rows.forEach(r => console.log(`${r.Field} | ${r.Type} | ${r.Null} | ${r.Default}`));
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

check();
