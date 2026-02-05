const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbQuery } = require('../config/db');

const applySql = async () => {
    try {
        const sqlPath = path.join(__dirname, '../knowledge/sql/20260205_dynamic_label_condition.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Applying SQL changes...');
        const result = await dbQuery(sql);
        console.log('SQL applied successfully.', result);
        process.exit(0);
    } catch (err) {
        console.error('SQL execution failed:', err);
        process.exit(1);
    }
};

applySql();
