const axios = require('axios');

const BASE_URL = 'http://localhost:9999/api/event-engine';
const CAMPAIGN_SLUG = 'tw-2024';

async function runPhase3Verification() {
    console.log("🚀 Starting Phase 3.1 Verification (Coupon Management)...");

    try {
        // 1. Create Pool
        console.log("\n1. Creating Pool...");
        const createRes = await axios.post(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/pools`, {
            name: "Phase 3 Verification Pool",
            description: "Created via verification script",
            type: "SERIAL",
            config: {
                uses_per_user: 1,
                valid_until: "2025-12-31"
            },
            status: "draft"
        });

        if (!createRes.data.success) throw new Error("Create Failed");
        const newPool = createRes.data.data;
        console.log(`   ✅ Pool Created! ID: ${newPool.pool_id} | Name: ${newPool.name} | Status: ${newPool.config.status}`);

        // 2. Edit Pool (Update Metadata + Toggle Status)
        console.log("\n2. Updating Pool (Description + Activation)...");
        const updateRes = await axios.put(`${BASE_URL}/pools/${newPool.pool_id}`, {
            description: "Updated description",
            status: "active"
        });

        if (!updateRes.data.success) throw new Error("Update Failed");
        const updatedPool = updateRes.data.data;
        console.log(`   ✅ Pool Updated! Status: ${updatedPool.config.status} | Description: ${updatedPool.description}`);

        // 3. Add Items
        console.log("\n3. Adding Items...");
        const items = ["VERIFY-001", "VERIFY-002", "VERIFY-003"];
        const addItemsRes = await axios.post(`${BASE_URL}/pools/${newPool.pool_id}/items`, { items });

        if (!addItemsRes.data.success) throw new Error("Add Items Failed");
        console.log(`   ✅ Added ${addItemsRes.data.data.count} items.`);

        // 4. Verify Items via API
        const itemsRes = await axios.get(`${BASE_URL}/pools/${newPool.pool_id}/items`);
        console.log(`   ✅ Verified ${itemsRes.data.data.length} items exist.`);

        // 5. Draw Winner (End-to-End)
        console.log("\n4. Drawing Winner...");
        const drawRes = await axios.post(`${BASE_URL}/pools/${newPool.pool_id}/draw`, {
            count: 1,
            strategy: "RANDOM"
        });

        if (!drawRes.data.success) throw new Error("Draw Failed");
        console.log(`   ✅ Draw Successful! Winner: ${drawRes.data.data.winners[0].content}`);
        console.log(`   ✅ Remaining Items: ${drawRes.data.data.metadata.remaining_count}`);

        console.log("\n✅ Phase 3.1 Verification Logic Completed.");

    } catch (error) {
        console.error("\n❌ Verification Failed:", error.message);
        if (error.response) {
            console.error("   Response Data:", error.response.data);
        }
    }
}

runPhase3Verification();
