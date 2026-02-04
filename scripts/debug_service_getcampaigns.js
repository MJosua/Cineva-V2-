const eventEngineService = require('../service/eventEngineService');

async function debugService() {
    const adminUser = {
        id: 1185,
        role: 'event_admin'
    };

    console.log("Simulating getCampaigns for user 1185...");
    try {
        const campaigns = await eventEngineService.getCampaigns({}, adminUser);
        console.log("Resulting Campaigns:", campaigns.length);
        if (campaigns.length > 0) {
            campaigns.forEach(c => console.log(`- [${c.campaign_id}] ${c.slug}: ${c.name}`));
        } else {
            console.log("❌ No campaigns returned.");
        }
    } catch (e) {
        console.error("Service Error:", e);
    }
    process.exit(0);
}

debugService();
