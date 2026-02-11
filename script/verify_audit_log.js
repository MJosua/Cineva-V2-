require('dotenv').config();
const { dbHots } = require('../config/db');
const eventEngineService = require('../service/eventEngineService');

async function testAuditLogs() {
    console.log('🧪 Starting Audit Log Verification...');

    const testSlug = `test-audit-${Date.now()}`;
    const userId = 999; // Mock admin user

    try {
        // 1. Create Campaign
        console.log(`1. Creating Campaign: ${testSlug}`);
        const campaign = await eventEngineService.createCampaign({
            slug: testSlug,
            name: 'Audit Log Test Campaign',
            created_by: userId
        });
        const campaignId = campaign.campaign_id;
        console.log(`   > Created Campaign ID: ${campaignId}`);

        // 2. Update Campaign
        console.log(`2. Updating Campaign...`);
        await eventEngineService.updateCampaign(testSlug, {
            name: 'Audit Log Test Campaign (Updated)',
            updatedBy: userId
        });

        // 3. Publish Campaign
        console.log(`3. Publishing Campaign...`);
        await eventEngineService.publishCampaign(testSlug, true, userId);

        // 4. Verify Logs
        console.log(`4. Verifying EVENT_t_log entries...`);
        const [logs] = await dbHots.promise().query(
            `SELECT * FROM EVENT_t_log WHERE campaign_id = ? ORDER BY log_id ASC`,
            [campaignId]
        );

        console.table(logs.map(l => ({
            id: l.log_id,
            action: l.action_type,
            user: l.user_id,
            details: JSON.stringify(l.details).substring(0, 50) + '...'
        })));

        if (logs.length >= 3) {
            console.log('✅ Audit Logs captured successfully!');
        } else {
            console.log('❌ Missing Audit Logs! Expected at least 3.');
        }

        // Cleanup
        console.log('🧹 Cleaning up...');
        await eventEngineService.deleteCampaign(testSlug);
        await dbHots.promise().query(`DELETE FROM EVENT_t_log WHERE campaign_id = ?`, [campaignId]);

    } catch (err) {
        console.error('❌ Test Failed:', err);
    } finally {
        process.exit();
    }
}

testAuditLogs();
