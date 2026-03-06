const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbHots } = require('../config/db');

async function checkProjectTickets() {
    try {
        const [rows] = await dbHots.promise().query(
            'SELECT ticket_id, service_id, company_id, title FROM t_ticket WHERE service_id = 23 LIMIT 10'
        );
        console.log('Tickets found for service 23:', rows);

        const [countRows] = await dbHots.promise().query(
            'SELECT COUNT(*) as total FROM t_ticket WHERE service_id = 23'
        );
        console.log('Total tickets for service 23:', countRows[0].total);

        const [allServiceIds] = await dbHots.promise().query(
            'SELECT DISTINCT service_id FROM t_ticket LIMIT 20'
        );
        console.log('Distinct service IDs in t_ticket:', allServiceIds.map(h => h.service_id));

    } catch (err) {
        console.error('Error checking tickets:', err);
    } finally {
        process.exit();
    }
}

checkProjectTickets();
