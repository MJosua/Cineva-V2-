const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbHots, dbQueryHots } = require('../config/db'); // Adjust path to ../config/db
const srfGenerator = require('./trigger-functions/srf_document_generator');

// Mock context and trigger
const manualTrigger = async () => {
    const ticketId = '260611170002'; // The ticket in question
    const notificationId = null;
    const actorId = 0; // System
    const context = { workflow_step: 'Final' };

    console.log(`🚀 Manually triggering SRF Document Generation for Ticket ${ticketId}...`);

    // 1. Delete existing document to force partial refresh if needed, 
    // but the generator creates a NEW entry. 
    // To see the NEW entry, the frontend must pick up the latest one.
    // Let's delete the old one first to avoid confusion if the UI picks the 'first' one.

    await new Promise((resolve) => {
        dbHots.query(`DELETE FROM t_document WHERE entity_id = ? AND template_name = 'srf'`, [ticketId], (err, res) => {
            if (err) {
                console.error('⚠️ Delete old doc failed (could be missing table/conn):', err.message);
            } else {
                console.log(`🗑️ Deleted ${res.affectedRows} existing documents.`);
            }
            resolve();
        });
    });

    // 2. Run Generator
    // We need to pass the dependencies or rely on the require inside the module.
    // The module exports a function: module.exports = async function (ticketId, notificationId, actorId, context)

    try {
        const result = await srfGenerator({
            ticketId,
            context,
            dbQuery: dbQueryHots
        });
        console.log('✅ Generator Result:', result);
        
        if (result.documentId) {
             dbHots.query('SELECT snapshot_data FROM t_document WHERE id = ?', [result.documentId], (err, res) => {
                 if (err) console.error(err);
                 else console.log('📸 SNAPSHOT DATA:', res[0]?.snapshot_data);
                 process.exit(0);
             });
        }
    } catch (e) {
        console.error('❌ Generator Failed:', e);
    }

    // Allow some time for the async fire-and-forget part to complete (logging will show)
    setTimeout(() => {
        console.log('🏁 Script finished waiting.');
        process.exit(0);
    }, 10000);
};

manualTrigger();
