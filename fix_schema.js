require('dotenv').config();
const { dbHots } = require("./config/db");

const sqlSteps = [
    "ALTER TABLE m_user ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
    "DROP VIEW IF EXISTS user;",
    "CREATE VIEW user AS SELECT * FROM m_user;",
    "DROP VIEW IF EXISTS user_role;",
    "CREATE VIEW user_role AS SELECT * FROM m_user_role;",
    "DROP VIEW IF EXISTS m_company_department;",
    "CREATE VIEW m_company_department AS SELECT * FROM m_department;",
    `CREATE TABLE IF NOT EXISTS user_preferences (
        pref_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        pref_category VARCHAR(50) NOT NULL,
        pref_key VARCHAR(100) NOT NULL,
        pref_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY user_pref_unique (user_id, pref_category, pref_key)
    ) ENGINE=InnoDB;`,
    `CREATE TABLE IF NOT EXISTS m_dashboard_menu (
        menu_id INT AUTO_INCREMENT PRIMARY KEY,
        menu_name VARCHAR(100) NOT NULL,
        menu_icon VARCHAR(50),
        menu_path VARCHAR(255),
        parent_id INT DEFAULT 0,
        order_no INT DEFAULT 0,
        is_active TINYINT DEFAULT 1
    ) ENGINE=InnoDB;`,
    `CREATE TABLE IF NOT EXISTS m_dashboard_category (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL,
        category_icon VARCHAR(50),
        order_no INT DEFAULT 0,
        is_active TINYINT DEFAULT 1
    ) ENGINE=InnoDB;`
];

async function runFix() {
    console.log("🚀 Starting Backend Schema Stabilization...");
    for (const sql of sqlSteps) {
        try {
            console.log(`Executing: ${sql.substring(0, 50)}...`);
            await dbHots.promise().query(sql);
            console.log("✅ Success");
        } catch (err) {
            console.error("❌ Error:", err.message);
        }
    }
    console.log("🏁 Done.");
    process.exit(0);
}

runFix();
