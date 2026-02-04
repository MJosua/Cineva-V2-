const { dbHots } = require('./config/db');

async function test() {
    try {
        console.log("Testing DB Connection...");
        const [rows] = await dbHots.promise().query(`SELECT count(*) as count FROM m_dashboard_menu WHERE is_active=1`);
        console.log("Active Dashboard Functions Count:", rows[0].count);

        // Also check if any functions exist at all
        const [allRows] = await dbHots.promise().query(`SELECT count(*) as count FROM m_dashboard_menu`);
        console.log("Total Dashboard Functions Count:", allRows[0].count);

        process.exit(0);
    } catch (e) {
        console.error("DB Error:", e);
        process.exit(1);
    }
}

test();
