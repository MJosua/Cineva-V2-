const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbQuery } = require('../config/db');

const migrateData = async () => {
    try {
        console.log('Migrating data...');

        // Migrate mst_condition -> special_m_condition
        console.log('Migrating mst_condition...');
        await dbQuery('TRUNCATE TABLE special_m_condition');
        await dbQuery('INSERT INTO special_m_condition SELECT * FROM mst_condition');
        console.log('Migrated mst_condition');

        // Migrate m_config_new -> special_t_condition
        console.log('Migrating m_config_new...');
        await dbQuery('TRUNCATE TABLE special_t_condition');
        await dbQuery('INSERT INTO special_t_condition SELECT * FROM m_config_new');
        console.log('Migrated m_config_new');

        console.log('Data migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateData();
