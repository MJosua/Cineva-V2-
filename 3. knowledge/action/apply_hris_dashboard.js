const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { dbHots } = require('../../config/db');

async function run() {
    const sqlPath = path.join(__dirname, '../sql/dashboard_hris_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('--- Executing SQL from dashboard_hris_setup.sql ---');

    // Split by statement if possible, or just exact logic. 
    // Mysql driver .query usually handles multiple statements if enabled, 
    // but let's just split by double newline or semicolon manually if simplest,
    // or just try to run it. safest is splitting.

    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    try {
        for (const stmt of statements) {
            console.log('Running:', stmt.substring(0, 50) + '...');
            // using dbHots.promise() if available or mostly callbacks
            // config/db.js usually exports a pool.
            // let's wrap in promise
            await new Promise((resolve, reject) => {
                dbHots.query(stmt, (err, res) => {
                    if (err) {
                        // If duplicate entry, we might ignore
                        if (err.code === 'ER_DUP_ENTRY') {
                            console.warn('Skipping duplicate entry.');
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        console.log('Success. Affected rows:', res.affectedRows);
                        resolve(res);
                    }
                });
            });
        }
        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error('Error executing SQL:', err);
        process.exit(1);
    }
}

run();
