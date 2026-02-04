const axios = require('axios');

const BASE_URL = 'http://localhost:9999/api/event-engine';
const CAMPAIGN_SLUG = 'tw-2024';

async function runReportsVerification() {
    console.log("🚀 Starting Phase 3.2 Verification (Reports)...");

    try {
        // 1. Daily Submission Stats
        console.log("\n1. Fetching Daily Submission Stats...");
        const dailyRes = await axios.get(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/submissions/daily?days=30`);

        if (!dailyRes.data.success) throw new Error("Daily Stats Failed");
        const dailyStats = dailyRes.data.data;
        console.log(`   ✅ Daily Stats Retrieved! Rows: ${dailyStats.length}`);
        if (dailyStats.length > 0) {
            console.log(`   📅 Sample Data: [${dailyStats[0].date}: ${dailyStats[0].count}]`);
        }

        // 2. Winners List
        console.log("\n2. Fetching Winners List...");
        const winnersRes = await axios.get(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/winners`);

        if (!winnersRes.data.success) throw new Error("Winners List Failed");
        const winners = winnersRes.data.data;
        console.log(`   ✅ Winners Retrieved! Count: ${winners.length}`);
        if (winners.length > 0) {
            console.log(`   🏆 Sample Winner: ${winners[0].pool_name} - Prize: ${winners[0].prize_value}`);
        }

        console.log("\n✅ Phase 3.2 Verification Logic Completed.");

    } catch (error) {
        console.error("\n❌ Verification Failed:", error.message);
        if (error.response) {
            console.error("   Response Data:", error.response.data);
        }
    }
}

runReportsVerification();
