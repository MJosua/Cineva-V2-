-- Engine module schema (create these tables)
CREATE TABLE IF NOT EXISTS m_engine_modules (
  module_id INT AUTO_INCREMENT PRIMARY KEY,
  module_key VARCHAR(150) NOT NULL UNIQUE,
  module_name VARCHAR(255) NOT NULL,
  description TEXT,
  module_type VARCHAR(50) DEFAULT 'form',
  form_json JSON DEFAULT NULL,
  workflow_json JSON DEFAULT NULL,
  triggers_json JSON DEFAULT NULL,
  document_html LONGTEXT DEFAULT NULL,
  theme_json JSON DEFAULT NULL,
  settings_json JSON DEFAULT NULL,
  version INT DEFAULT 1,
  active TINYINT(1) DEFAULT 1,
  created_by INT DEFAULT NULL,
  updated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS m_engine_module_revisions (
  revision_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  version INT NOT NULL,
  form_json JSON,
  workflow_json JSON,
  triggers_json JSON,
  document_html LONGTEXT,
  theme_json JSON,
  metadata JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES m_engine_modules(module_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS t_engine_module_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  module_id INT,
  event_type VARCHAR(100),
  payload JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(module_id)
);

CREATE TABLE IF NOT EXISTS m_engine_module_storage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  table_name VARCHAR(255),
  mapping_json JSON,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS m_engine_module_acl (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  role_id INT NOT NULL,
  permissions_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
