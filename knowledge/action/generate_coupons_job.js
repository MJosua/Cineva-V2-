/**
 * Standalone Bulk Coupon Generation Script
 * Usage: node script/generate_coupons_job.js
 */

require('dotenv').config(); // Load env vars first
const { dbConf } = require('../config/db');
const couponService = require('../service/couponService');

async function runGeneration() {
    try {
        console.log('🚀 Starting Bulk Coupon Generation...');
        console.log('Target: 350,000 coupons');

        // Configuration
        const BATCH_SIZE = 350000;
        const EVENT_ID = 1; // Maldives Event
        const FORM_ID = 1;  // Maldives Form

        // 1. Check if Form Exists (Simple check)
        // You might want to skip this if you are sure, or create logic to find it.
        // For this script, we assume the migration has run and ID 1 exists.

        const startTime = Date.now();

        const result = await couponService.generateBatch({
            count: BATCH_SIZE,
            batchName: `Batch 350k - ${new Date().toISOString()}`,
            eventId: EVENT_ID,
            formId: FORM_ID,
            value: 'Maldives Lucky Draw Entry', // Default value/prize
            expiresAt: '2025-12-31 23:59:59',
            country: 'Maldives',
            createdBy: 'script_runner'
        });

        const duration = (Date.now() - startTime) / 1000;

        console.log('✅ Generation Process Finished.');
        console.log(`- Time Taken: ${duration.toFixed(2)}s`);

        // Verification Step
        console.log('🔍 Verifying database records...');
        const countResult = await new Promise((resolve, reject) => {
            dbConf.query('SELECT COUNT(*) as cnt FROM t_coupons WHERE batch_id = ?', [result.batchId], (err, res) => {
                if (err) reject(err);
                else resolve(res[0].cnt);
            });
        });

        console.log(`- Coupons in DB: ${countResult}`);

        if (parseInt(countResult) === BATCH_SIZE) {
            console.log('🎉 SUCCESS: All coupons successfully generated and verified!');
        } else {
            console.log(`⚠️ WARNING: Expected ${BATCH_SIZE} but found ${countResult}. Some chunks may have failed.`);
        }

    } catch (error) {
        console.error('❌ Generation Failed:', error);
    } finally {
        // Close DB Connection
        dbConf.end((err) => {
            if (err) console.error('Error closing DB:', err);
            else console.log('DB Connection closed.');
            process.exit(0);
        });
    }
}

// Run immediately
runGeneration();
