const { dbHots } = require("../../../../config/db");

const MaintenanceController = {
    /**
     * GET /hots_admin/system/repair-db
     * Runs SQL fixes to align the schema with Job Marketplace requirements.
     * Includes Views, Tables, and missing Columns.
     */
    repairDatabase: async (req, res) => {
        console.log("🛠️  Starting System Schema Repair...");
        
        const sqlSteps = [
            // 1. Core Views and Tables (Legacy Compatibility)
            "ALTER TABLE m_user ADD COLUMN registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            "DROP VIEW IF EXISTS user;",
            "CREATE VIEW user AS SELECT * FROM m_user;",
            "DROP VIEW IF EXISTS user_role;",
            "CREATE VIEW user_role AS SELECT * FROM m_user_role;",
            "DROP VIEW IF EXISTS m_company_department;",
            "CREATE VIEW m_company_department AS SELECT * FROM m_department;",
            "DROP VIEW IF EXISTS m_service_status;",
            "CREATE VIEW m_service_status AS SELECT id as status_id, status_name, status_color FROM m_status;",
            
            // 2. Preferences and Notifications
            `CREATE TABLE IF NOT EXISTS user_preferences (
                pref_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                pref_category VARCHAR(50) NOT NULL,
                pref_key VARCHAR(100) NOT NULL,
                pref_value LONGTEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, pref_category, pref_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
            `CREATE TABLE IF NOT EXISTS user_notification (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255),
                message TEXT,
                data_payload TEXT,
                is_read TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_read (user_id, is_read)
            ) ENGINE=InnoDB;`,
            
            // 3. Operational Tables (Job Marketplace)
            `CREATE TABLE IF NOT EXISTS data_job_content_log (
                content_log_id INT AUTO_INCREMENT PRIMARY KEY,
                assignment_id INT,
                draft_link VARCHAR(500),
                preview_link VARCHAR(500),
                feedback_client TEXT,
                revision_link VARCHAR(500),
                content_status VARCHAR(50) DEFAULT 'draft',
                posting_link VARCHAR(500),
                boosting_code VARCHAR(100),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;`,

            // 4. Missing Master Tables
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
            ) ENGINE=InnoDB;`,
            "ALTER TABLE m_dashboard_menu ADD COLUMN card_config TEXT DEFAULT NULL",

            // Phase 6: Dual Mode Schema Extended Meta
            "ALTER TABLE t_job_list ADD COLUMN categories_json TEXT NULL;",
            "ALTER TABLE data_job_campaign ADD COLUMN platforms_json TEXT NULL;",
            "ALTER TABLE data_job_campaign ADD COLUMN tasks_json TEXT NULL;",
            "ALTER TABLE data_job_campaign ADD COLUMN start_date DATE NULL;",
            "ALTER TABLE data_job_campaign MODIFY COLUMN content_type TEXT NULL;",

            // Phase 6: Brand Master Registry
            `CREATE TABLE IF NOT EXISTS data_m_brand (
                brand_id INT AUTO_INCREMENT PRIMARY KEY,
                brand_name VARCHAR(200) NOT NULL UNIQUE,
                brand_code VARCHAR(100) NULL,
                industry VARCHAR(120) NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_by INT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            // Phase 6: Content Type Master Registry
            `CREATE TABLE IF NOT EXISTS data_m_job_content_type (
                type_id INT AUTO_INCREMENT PRIMARY KEY,
                type_name VARCHAR(120) NOT NULL UNIQUE,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            // Seed default brands from existing seed campaigns
            "INSERT IGNORE INTO data_m_brand (brand_name, brand_code, industry) VALUES ('GlowLab','GLOWLAB','Beauty'),('SnackTown','SNACKTOWN','Food & Beverage'),('PlayZone','PLAYZONE','Gaming'),('FitPro','FITPRO','Sports'),('SoundX','SOUNDX','Music'),('HomeJoy','HOMEJOY','Lifestyle'),('CloudNine','CLOUDNINE','Vaping'),('MoveIt','MOVEIT','Dance & Entertainment'),('BuzzLine','BUZZLINE','Social Media'),('MoodPlace','MOODPLACE','Lifestyle');",
            
            // Seed Platforms & Content Types
            "INSERT IGNORE INTO data_m_job_platform (platform_name) VALUES ('Instagram'),('TikTok'),('YouTube'),('Facebook'),('Twitter'),('Threads'),('Google Maps'),('Web/Blog');",
            "INSERT IGNORE INTO data_m_job_content_type (type_name) VALUES ('Photo'),('Video'),('Review'),('Livestream'),('Shorts/Reels'),('Story'),('Article');"
        ];

        const results = [];
        for (const sql of sqlSteps) {
            try {
                await dbHots.promise().query(sql);
                results.push({ sql: sql.substring(0, 50) + "...", status: "✅ OK" });
            } catch (err) {
                console.error(`❌ SQL Error: ${err.message}`);
                results.push({ sql: sql.substring(0, 50) + "...", status: `❌ Error: ${err.message}` });
            }
        }

        res.json({
            success: true,
            message: "Database repair process completed.",
            steps: results
        });
    }
};

module.exports = MaintenanceController;
