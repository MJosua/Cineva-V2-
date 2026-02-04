const { dbHots } = require('../config/db');

async function run() {
    console.log("Creating EVENT_r_campaign_admin table...");
    const sql = `
    CREATE TABLE IF NOT EXISTS EVENT_r_campaign_admin (
        relation_id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        user_id INT NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_access (campaign_id, user_id)
    );
    `;

    try {
        await dbHots.execute(sql);
        console.log("Success!");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit();
}

run();
