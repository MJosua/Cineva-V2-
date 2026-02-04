const { dbQueryHots } = require('../config/db');

async function debugAccess() {
    console.log("Debugging Team Access...");

    // 1. Find User ID for 'Farhan Nada'
    // I'll search loosely
    const users = await dbQueryHots(`SELECT * FROM user WHERE firstname LIKE '%Farhan%' OR lastname LIKE '%Nada%'`);
    console.log("Found Users:", users.length);
    users.forEach(u => console.log(`- [${u.user_id}] ${u.firstname} ${u.lastname} (${u.email})`));

    if (users.length === 0) {
        console.log("❌ User 'Farhan Nada' not found in DB.");
        process.exit(0);
    }

    // 2. Check Relations for these users
    for (const u of users) {
        const relations = await dbQueryHots(`SELECT * FROM EVENT_r_campaign_admin WHERE user_id = ?`, [u.user_id]);
        console.log(`\nRelations for User ${u.user_id}: ${relations.length}`);

        if (relations.length > 0) {
            relations.forEach(r => console.log(`  - Campaign ID: ${r.campaign_id}, Role: ${r.role}`));

            // 3. Check Campaign Details
            const campaigns = await dbQueryHots(`SELECT * FROM EVENT_t_campaign WHERE campaign_id = ?`, [relations[0].campaign_id]);
            if (campaigns.length > 0) {
                console.log(`    -> Slug: ${campaigns[0].slug}, Name: ${campaigns[0].name}`);
            } else {
                console.log(`    -> ❌ Campaign ID ${relations[0].campaign_id} NOT FOUND in EVENT_t_campaign`);
            }
        }
    }

    process.exit(0);
}

debugAccess();
