const { dbQueryHots, dbHots } = require('../config/db');

async function createTable() {
    console.log("Initializing Team Management Table...");

    const sql = `
        CREATE TABLE IF NOT EXISTS EVENT_r_campaign_admin (
            relation_id INT AUTO_INCREMENT PRIMARY KEY,
            campaign_id INT NOT NULL,
            user_id INT NOT NULL,
            role VARCHAR(20) DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_campaign_user (campaign_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await dbQueryHots(sql);
        console.log("✅ Table EVENT_r_campaign_admin created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create table:", err);
        process.exit(1);
    }
}

createTable();
