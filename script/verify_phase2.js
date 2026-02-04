const axios = require('axios');

const BASE_URL = 'http://localhost:9999/api/event-engine';
const CAMPAIGN_SLUG = 'tw-2024';

async function runVerification() {
    console.log("🚀 Starting Phase 2 Verification...");

    try {
        // 1. Get Submissions
        console.log("\n1. Fetching Submissions...");
        const submissionsRes = await axios.get(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/submissions?limit=1`);
        const submissionsData = submissionsRes.data;

        if (!submissionsData.success) {
            throw new Error(`Failed to fetch submissions: ${submissionsData.error?.message}`);
        }

        const submissions = submissionsData.data.submissions;
        console.log(`   ✅ Found ${submissions.length} submissions (Total: ${submissionsData.data.total})`);

        if (submissions.length === 0) {
            console.log("   ⚠️ No submissions found to test approval. Please create a submission first.");
        } else {
            // 2. Test Approval
            const targetSub = submissions[0];
            console.log(`\n2. Testing Approval on Submission: ${targetSub.submission_id} (Current: ${targetSub.status})`);

            const approveRes = await axios.patch(`${BASE_URL}/submissions/${targetSub.submission_id}`, { status: 'approved' });
            const approveData = approveRes.data;

            if (approveData.success && approveData.data.status === 'approved') {
                console.log("   ✅ Approval Successful on API!");
            } else {
                console.error("   ❌ Approval Failed:", approveData);
            }
        }

        // 3. Get Pools
        console.log("\n3. Fetching Pools...");
        const poolsRes = await axios.get(`${BASE_URL}/campaigns/${CAMPAIGN_SLUG}/pools`);
        const poolsData = poolsRes.data;
        const pools = poolsData.data.pools;
        console.log(`   ✅ Found ${pools.length} pools.`);

        // 4. Test Draw (Dry Run / Safe Check)
        const activePool = pools.find(p => p.status === 'active' && (p.total_items - p.used_items) > 0);

        if (!activePool) {
            console.log("   ⚠️ No active pools with items available for Draw test.");
        } else {
            console.log(`\n4. Testing Draw on Pool: ${activePool.name} (ID: ${activePool.pool_id})`);
            console.log(`   Available Items: ${activePool.total_items - activePool.used_items}`);

            const drawRes = await axios.post(`${BASE_URL}/pools/${activePool.pool_id}/draw`, { count: 1, strategy: 'RANDOM' });
            const drawData = drawRes.data;

            if (drawData.success) {
                console.log(`   ✅ Draw Successful! Winner: ${drawData.data.winners[0].content}`);
                console.log(`   Items Remaining: ${drawData.data.metadata.remaining_count}`);
            } else {
                console.error("   ❌ Draw Failed:", drawData);
            }
        }

        console.log("\n✅ Verification Logic Completed.");

    } catch (error) {
        console.error("\n❌ Verification Failed:", error.message);
        if (error.response) {
            console.error("   Response Data:", error.response.data);
        }
    }
}

runVerification();
