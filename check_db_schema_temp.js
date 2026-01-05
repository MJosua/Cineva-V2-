require('dotenv').config();
const { dbConf, dbQuery } = require("./config/db");

async function checkSchema() {
    try {
        console.log("--- Checking user_draft ---");
        const tables = await dbQuery("SHOW TABLES LIKE 'user_draft'");
        console.log("user_draft exists:", tables.length > 0);

        // Also check if t_request_user_registration exists as alternate name
        const tables2 = await dbQuery("SHOW TABLES LIKE 't_request_user_registration'");
        console.log("t_request_user_registration exists:", tables2.length > 0);

        console.log("\n--- Checking m_department structure ---");
        const depts = await dbQuery("SELECT * FROM m_department LIMIT 1");
        if (depts.length > 0) {
            console.log("Columns:", Object.keys(depts[0]));
            console.log("Sample:", depts[0]);
        } else {
            const cols = await dbQuery("SHOW COLUMNS FROM m_department");
            console.log("Columns:", cols.map(c => c.Field));
        }

        console.log("\n--- Checking m_workflow structure ---");
        const workflows = await dbQuery("SELECT * FROM m_workflow LIMIT 1");
        if (workflows.length > 0) {
            console.log("Columns:", Object.keys(workflows[0]));
            // console.log("Sample:", workflows[0]);
        } else {
            const cols = await dbQuery("SHOW COLUMNS FROM m_workflow");
            console.log("Columns:", cols.map(c => c.Field));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
