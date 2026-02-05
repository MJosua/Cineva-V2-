const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbQuery } = require('../config/db');

const checkTables = async () => {
    try {
        const tables = ['mst_condition', 'm_config_new', 'special_m_condition', 'special_t_condition'];
        const results = {};

        for (const table of tables) {
            try {
                const rows = await dbQuery(`SELECT COUNT(*) as count FROM ${table}`);
                results[table] = rows[0].count;
            } catch (err) {
                results[table] = 'Error: ' + err.message; // Table might not exist
            }
        }

        console.log('Row counts:', results);
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
};

checkTables();
