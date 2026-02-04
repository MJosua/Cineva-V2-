
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

async function debugCampaign() {
    try {
        const slug = 'test2';
        const rows = await dbQueryHots("SELECT block_schema FROM EVENT_t_campaign WHERE slug = ?", [slug]);

        if (rows.length === 0) {
            console.log(`Campaign '${slug}' not found.`);
        } else {
            const raw = rows[0].block_schema;
            console.log("Raw block_schema type:", typeof raw);
            console.log("Raw block_schema value:", raw);

            try {
                if (typeof raw === 'string') {
                    console.log("Parsed JSON:", JSON.stringify(JSON.parse(raw), null, 2));
                } else if (typeof raw === 'object') {
                    console.log("Object (already parsed):", JSON.stringify(raw, null, 2));
                }
            } catch (e) {
                console.log("JSON Parse Error:", e.message);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debugCampaign();
