const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbQuery } = require('../config/db');

const runMigration = async () => {
    try {
        const sqlPath = path.join(__dirname, '../knowledge/sql/20260205_rename_tables.sql');
        const sqlInfo = fs.statSync(sqlPath);
        if (!sqlInfo.isFile()) {
            throw new Error(`SQL file not found at ${sqlPath}`);
        }
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Executing SQL migration...');
        console.log(sql);

        // Execute the SQL
        // db.js is configured with multipleStatements: true, so this should work
        const result = await dbQuery(sql);
        console.log('Migration committed successfully.');
        console.log('Result:', result);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
