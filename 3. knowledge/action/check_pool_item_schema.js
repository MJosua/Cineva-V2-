
const { dbQueryHots } = require('../config/db');
require('dotenv').config();

async function checkSchema() {
    try {
        console.log("Checking EVENT_m_pool_item schema...");
        const result = await dbQueryHots("DESCRIBE EVENT_m_pool_item");
        console.table(result);
    } catch (e) {
        console.error(e);
    }
}

checkSchema();
