/**
 * Trial Resource Query - Verification Script
 * 
 * This script tests the new ResourceEngine to fetch data from resource_m_data.
 * Goal: Verify UOM (Units of Measure) migration and querying.
 */
const resourceEngine = require("./core/resource-engine");
const { RESOURCE_CATEGORIES } = require("./script/Utility/hotsConstants");

async function runTrial() {
    console.log("🚀 Starting Trial Resource Query...");

    try {
        // 1. Fetch all Units of Measure
        console.log(`\n--- Fetching Category: ${RESOURCE_CATEGORIES.UOM} ---`);
        const uoms = await resourceEngine.getResourcesByCategory(RESOURCE_CATEGORIES.UOM);

        if (uoms.length === 0) {
            console.warn("⚠️ No UOM data found in resource_m_data. Did the migration run?");
        } else {
            console.log(`✅ Found ${uoms.length} Units of Measure:`);
            uoms.forEach(u => {
                console.log(` - [${u.value}] ${u.label} (Attributes: ${JSON.stringify(u.attributes)})`);
            });
        }

        // 2. Fetch Sample Categories (as another test)
        console.log(`\n--- Fetching Category: ${RESOURCE_CATEGORIES.SAMPLE_CATEGORY} ---`);
        const categories = await resourceEngine.getResourcesByCategory(RESOURCE_CATEGORIES.SAMPLE_CATEGORY);

        if (categories.length === 0) {
            console.warn("⚠️ No Sample Categories found in resource_m_data.");
        } else {
            console.log(`✅ Found ${categories.length} Sample Categories:`);
            categories.forEach(c => {
                console.log(` - [${c.value}] ${c.label}`);
            });
        }

    } catch (err) {
        console.error("❌ Trial Query Failed:", err.message);
    }
}

// Note: In a real environment, you'd run this with a DB connection.
// I'm providing this script for you to run or for me to run via node if I had a test runner.
runTrial();
