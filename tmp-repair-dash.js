require('dotenv').config();
const { dbHots } = require('./config/db');

async function repair() {
  console.log('--- Database Repair: Phase 6 Master Registry ---');
  const conn = await dbHots.promise().getConnection();
  try {
    const queries = [
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

      // Seed default brands
      "INSERT IGNORE INTO data_m_brand (brand_name, brand_code, industry) VALUES ('GlowLab','GLOWLAB','Beauty'),('SnackTown','SNACKTOWN','Food & Beverage'),('PlayZone','PLAYZONE','Gaming'),('FitPro','FITPRO','Sports'),('SoundX','SOUNDX','Music'),('HomeJoy','HOMEJOY','Lifestyle'),('CloudNine','CLOUDNINE','Vaping'),('MoveIt','MOVEIT','Dance & Entertainment'),('BuzzLine','BUZZLINE','Social Media'),('MoodPlace','MOODPLACE','Lifestyle');",
      
      // Seed Platforms & Content Types
      "INSERT IGNORE INTO data_m_job_platform (platform_name) VALUES ('Instagram'),('TikTok'),('YouTube'),('Facebook'),('Twitter'),('Threads'),('Google Maps'),('Web/Blog');",
      "INSERT IGNORE INTO data_m_job_content_type (type_name) VALUES ('Photo'),('Video'),('Review'),('Livestream'),('Shorts/Reels'),('Story'),('Article');"
    ];

    for (const q of queries) {
      console.log(`Executing: ${q.substring(0, 50)}...`);
      await conn.query(q);
    }

    console.log('✅ Master Registry tables and seed data ready.');
  } catch (error) {
    console.error('❌ Error during repair:', error);
  } finally {
    conn.release();
    process.exit();
  }
}

repair();
