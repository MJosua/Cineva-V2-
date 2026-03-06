const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbHots } = require('../config/db');

async function checkJsonSnapshot() {
    try {
        const [rows] = await dbHots.promise().query(
            'SELECT ticket_id, json_snapshot FROM t_ticket WHERE service_id = 23 LIMIT 5'
        );

        rows.forEach(r => {
            console.log(`--- Ticket: ${r.ticket_id} ---`);
            try {
                const data = typeof r.json_snapshot === 'string' ? JSON.parse(r.json_snapshot) : r.json_snapshot;
                console.log(JSON.stringify(data, null, 2));
            } catch (e) {
                console.log('JSON Parse Error:', e.message);
                console.log('Raw:', r.json_snapshot);
            }
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkJsonSnapshot();
