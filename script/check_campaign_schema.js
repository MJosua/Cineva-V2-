
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

async function checkSchema() {
    try {
        const rows = await dbQueryHots("DESCRIBE EVENT_t_campaign");
        console.log("Schema for EVENT_t_campaign:");
        rows.forEach(row => {
            console.log(`${row.Field}: ${row.Type}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSchema();
