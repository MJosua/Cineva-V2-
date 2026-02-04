const axios = require('axios');
const path = require('path');
// Load env before requiring db config
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

const BASE_URL = 'http://localhost:9999/api/event-engine';
const CAMPAIGN_SLUG = 'tw-2024';

async function runE2E() {
    console.log("🚀 Starting Final E2E Verification...");
    console.log("   DB Host Config (Debug):", process.env.DB_HOST || 'N/A', "| Dev:", process.env.DEV_DB_HOST || 'N/A');

    try {
        // 1. SETUP: Create a Mock Submission via SQL (Simulating public user)
        console.log("\n1. [SETUP] Inserting Mock Submission...");

        // Get Campaign ID
        const campRows = await dbQueryHots('SELECT campaign_id FROM EVENT_t_campaign WHERE slug = ?', [CAMPAIGN_SLUG]);
        if (!campRows.length) throw new Error("Campaign not found");
        const campaignId = campRows[0].campaign_id;

        // Insert Submission (Simulate Frontend)
        const subRes = await dbQueryHots(
            `INSERT INTO EVENT_t_submission 
            (campaign_id, participant_name, participant_contact, receipt_codes, status, submitted_at) 
            VALUES (?, 'E2E User', 'e2e@test.com', '["E2E-RECEIPT"]', 'pending', NOW())`,
            [campaignId]
        );
        const submissionId = subRes.insertId;
        console.log(`   ✅ Submission Created! ID: ${submissionId}`);

        // 2. APPROVE Submission (API)
        console.log("\n2. [API] Approving Submission...");
        const approveRes = await axios.patch(`${BASE_URL}/submissions/${submissionId}`, {
            status: 'approved'
        });
        if (!approveRes.data.success) throw new Error("Approval Failed");
        console.log("   ✅ Submission Approved via API.");

        // 3. CREATE Pool (API)
        console.log("\n3. [API] Creating Reward Pool...");
        const poolRes = await axios.post(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/pools`, {
            name: "E2E Final Pool",
            type: "SERIAL",
            status: "active",
            config: { valid_until: "2029-12-31" }
        });
        if (!poolRes.data.success) throw new Error("Pool Creation Failed");
        const poolId = poolRes.data.data.pool_id;
        console.log(`   ✅ Pool Created! ID: ${poolId}`);

        // 4. ADD Items (API)
        console.log("\n4. [API] Adding Pool Items...");
        const itemVal = `PRIZE-${Date.now()}`;
        const itemRes = await axios.post(`${BASE_URL}/pools/${poolId}/items`, {
            items: [itemVal]
        });
        if (!itemRes.data.success) throw new Error("Add Items Failed");
        console.log(`   ✅ Added Item: ${itemVal}`);

        // 5. DRAW Winner (API)
        console.log("\n5. [API] Executing Draw...");
        const drawRes = await axios.post(`${BASE_URL}/pools/${poolId}/draw`, {
            count: 1, strategy: 'RANDOM'
        });
        if (!drawRes.data.success) throw new Error("Draw Failed");
        console.log("   ✅ Draw Executed Successfully.");

        // 6. VERIFY Reports (API)
        console.log("\n6. [API] Verifying via Reports...");
        const winnersRes = await axios.get(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/winners`);
        const winners = winnersRes.data.data;

        const myWinner = winners.find(w => w.prize_value === itemVal);
        if (!myWinner) throw new Error("Winner not found in Reports!");

        console.log(`   ✅ Found Winner in Reports!`);
        console.log(`      - Drawn At: ${myWinner.drawn_at}`);
        console.log(`      - Prize: ${myWinner.prize_value}`);
        console.log(`      - Status: ${myWinner.claimed ? 'Claimed' : 'Unclaimed'}`);

        console.log("\n🎉 FINAL E2E VERIFICATION PASSED! SYSTEM IS READY.");

    } catch (error) {
        console.error("\n❌ E2E Failed:", error.message);
        if (error.response) console.error(error.response.data);
    } finally {
        process.exit(0);
    }
}

runE2E();
