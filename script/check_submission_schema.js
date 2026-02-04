
const { dbQueryHots } = require('../config/db');
require('dotenv').config();

async function checkSchema() {
    try {
        console.log("Checking EVENT_t_submission schema...");
        const result = await dbQueryHots("DESCRIBE EVENT_t_submission");
        console.table(result);
    } catch (e) {
        console.error(e);
    }
}

checkSchema();
