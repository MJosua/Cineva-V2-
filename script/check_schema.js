require('dotenv').config();
const { dbHots } = require('../config/db');

async function checkSchema() {
    const connection = await dbHots.promise().getConnection();
    try {
        const [rows] = await connection.query('DESCRIBE t_ticket_work_data');
        console.log("t_ticket_work_data columns:", rows.map(r => r.Field));

        const [rows2] = await connection.query('DESCRIBE t_ticket');
        console.log("t_ticket columns:", rows2.map(r => r.Field));
    } finally {
        connection.release();
        process.exit();
    }
}

checkSchema();
