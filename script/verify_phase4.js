const axios = require('axios');
const path = require('path');
// Load env before requiring db config
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { dbQueryHots } = require('../config/db');

const BASE_URL = 'http://localhost:9999/api/event-engine';
const CAMPAIGN_SLUG = 'tw-2024';

async function verifyPhase4() {
    console.log("🚀 Starting Phase 4.1 Verification (Publishing & Scoping)...");

    try {
        // 1. SETUP: Ensure Campaign Exists and is Draft
        console.log("\n1. [SETUP] Resetting Campaign to Draft...");
        await dbQueryHots("UPDATE EVENT_t_campaign SET status = 'draft', published_at = NULL WHERE slug = ?", [CAMPAIGN_SLUG]);
        console.log("   ✅ Campaign reset to Draft.");

        // 2. VERIFY: Public API should fail (404)
        console.log("\n2. [TEST] Accessing Public API (Expected: 404)...");
        try {
            await axios.get(`${BASE_URL}/public/campaigns/${CAMPAIGN_SLUG}`);
            throw new Error("❌ Public API should have returned 404!");
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log("   ✅ Correctly returned 404 (Not Published).");
            } else {
                throw e;
            }
        }

        // 3. ACTION: Publish Campaign
        console.log("\n3. [ACTION] Publishing Campaign (Admin)...");
        const publishRes = await axios.post(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/publish`, { publish: true });
        if (publishRes.data.success && publishRes.data.data.status === 'active') {
            console.log("   ✅ Campaign Published via API.");
        } else {
            throw new Error("Failed to publish campaign");
        }

        // 4. VERIFY: Public API should succeed
        console.log("\n4. [TEST] Accessing Public API (Expected: 200)...");
        const publicRes = await axios.get(`${BASE_URL}/public/campaigns/${CAMPAIGN_SLUG}`);
        if (publicRes.data.success && publicRes.data.data.slug === CAMPAIGN_SLUG) {
            console.log("   ✅ Public API access successful!");
            console.log("      - Published At:", publicRes.data.data.published_at);
        } else {
            throw new Error("Public API failed after publishing");
        }

        // 5. ACTION: Unpublish Config
        console.log("\n5. [ACTION] Unpublishing Campaign...");
        await axios.post(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/publish`, { publish: false });
        console.log("   ✅ Campaign Unpublished.");

        // 6. VERIFY: Public API 404 again
        console.log("\n6. [TEST] Accessing Public API (Expected: 404)...");
        try {
            await axios.get(`${BASE_URL}/public/campaigns/${CAMPAIGN_SLUG}`);
            throw new Error("❌ Public API should have returned 404!");
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log("   ✅ Correctly returned 404 (Unpublished).");
            } else {
                throw e;
            }
        }

        console.log("\n🎉 Phase 4.1 Verification Logic Completed.");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Phase 4 Verification Failed:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

verifyPhase4();
