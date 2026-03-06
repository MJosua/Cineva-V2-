const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbHots } = require('../config/db');

async function checkTicketDetail() {
    try {
        const [rows] = await dbHots.promise().query(
            "SELECT lbl_col, value FROM t_ticket_detail WHERE ticket_id = '26030001'"
        );
        console.log('--- Ticket 26030001 Detail ---');
        console.table(rows);

        const [allDates] = await dbHots.promise().query(
            "SELECT ticket_id, lbl_col, value FROM t_ticket_detail WHERE lbl_col LIKE '%date%' OR lbl_col LIKE '%target%' LIMIT 20"
        );
        console.log('--- Sample Dates in Detail ---');
        console.table(allDates);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkTicketDetail();
