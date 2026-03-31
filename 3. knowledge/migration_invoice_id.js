/**
 * SeaRates Source of Truth Migration
 * Goal: Add invoice_id to sea_rates.shipments to allow grouping by Invoice/BL.
 * Part of transition from so_id to invoice_id SoT.
 */
const dotenv = require('dotenv');
dotenv.config();
const { dbQuery } = require('../config/db');

async function runMigration() {
    console.log("🚀 Starting SeaRates SoT Migration: adding invoice_id to sea_rates.shipments...");
    try {
        // We use fully qualified name sea_rates.shipments as dbQuery is pointing to IOD by default
        await dbQuery(`ALTER TABLE sea_rates.shipments ADD COLUMN invoice_id INT AFTER shipment_id, ADD INDEX (invoice_id)`);
        console.log("✅ Successfully added invoice_id column and index to sea_rates.shipments.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("⚠️ invoice_id column already exists. Skipping ALTER.");
        } else if (err.message.includes("deny") || err.message.includes("permission") || err.message.includes("command denied")) {
            console.error("❌ Permission Denied: The DB user used in .env does not have ALTER permissions.");
            console.error("   Please run this manually: ALTER TABLE sea_rates.shipments ADD COLUMN invoice_id INT AFTER shipment_id, ADD INDEX (invoice_id);");
        } else {
            console.error("❌ Migration failed:", err.message);
        }
    }
    process.exit(0);
}

runMigration();
