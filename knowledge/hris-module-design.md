# HRIS Module Design (Hybrid Architecture)

Modul HRIS menggunakan arsitektur hybrid:
- **Core Engine**: Untuk request & approval workflow
- **Tabel Master**: Untuk konfigurasi (max cuti, tipe cuti)
- **Tabel Log**: Untuk reporting (flat, mudah di-aggregate)

---

## 1. Database Schema

### A. Master Tables (Konfigurasi)

```sql
-- Tipe Cuti
CREATE TABLE m_hris_leave_type (
    leave_type_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,           -- 'Cuti Tahunan', 'Sakit', 'Izin Khusus'
    max_days_per_year INT DEFAULT 12,    -- Kuota maksimal per tahun
    carry_over BOOLEAN DEFAULT FALSE,    -- Boleh bawa sisa ke tahun depan?
    requires_attachment BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Konfigurasi Global HRIS
CREATE TABLE m_hris_config (
    config_id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description VARCHAR(255)
);
-- Contoh data:
-- ('attendance_late_threshold', '09:00', 'Jam masuk dianggap terlambat')
-- ('leave_advance_notice_days', '3', 'Minimal hari pengajuan sebelum cuti')
```

### B. Transaction Tables (Saldo & Log)

```sql
-- Saldo Cuti per Karyawan per Tahun
CREATE TABLE t_hris_leave_balance (
    balance_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    year YEAR NOT NULL,
    leave_type_id INT NOT NULL,
    quota INT DEFAULT 12,         -- Jatah awal
    used INT DEFAULT 0,           -- Sudah dipakai
    remaining INT GENERATED ALWAYS AS (quota - used) STORED,
    UNIQUE KEY uk_user_year_type (user_id, year, leave_type_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (leave_type_id) REFERENCES m_hris_leave_type(leave_type_id)
);

-- Log Cuti (Diisi trigger setelah approved)
CREATE TABLE t_hris_leave_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id VARCHAR(50),        -- Link ke t_ticket
    user_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT,
    approved_by INT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (leave_type_id) REFERENCES m_hris_leave_type(leave_type_id)
);

-- Log Koreksi Absensi (Diisi trigger setelah approved)
CREATE TABLE t_hris_attendance_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id VARCHAR(50),
    user_id INT NOT NULL,
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    reason TEXT,
    approved_by INT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
```

---

## 2. Service Definitions (Core Engine)

Tetap menggunakan `m_service` untuk request forms:

| Service ID | Name | Form Fields |
|---|---|---|
| 50 | `HRIS_LEAVE_REQUEST` | leave_type, start_date, end_date, reason, attachment |
| 51 | `HRIS_ATTENDANCE_CORRECTION` | date, clock_in, clock_out, reason |

---

## 3. Trigger Configuration

Setelah approval final, trigger akan:
1. Insert ke `t_hris_leave_log` atau `t_hris_attendance_log`
2. Update `t_hris_leave_balance.used`

```json
{
  "trigger_event": "on_approve",
  "condition": { "isFinal": true },
  "actions": [
    {
      "type": "execute_sql",
      "sql": "INSERT INTO t_hris_leave_log (...) VALUES (...)"
    },
    {
      "type": "execute_sql", 
      "sql": "UPDATE t_hris_leave_balance SET used = used + ${total_days} WHERE user_id = ${user_id} AND year = YEAR(NOW())"
    }
  ]
}
```

---

## 4. Reporting Queries

### Sisa Cuti Karyawan
```sql
SELECT u.firstname, u.lastname, lt.name AS leave_type, 
       lb.quota, lb.used, lb.remaining
FROM t_hris_leave_balance lb
JOIN user u ON lb.user_id = u.user_id
JOIN m_hris_leave_type lt ON lb.leave_type_id = lt.leave_type_id
WHERE lb.year = 2026;
```

### Riwayat Cuti Bulan Ini
```sql
SELECT u.firstname, lt.name AS type, 
       ll.start_date, ll.end_date, ll.total_days
FROM t_hris_leave_log ll
JOIN user u ON ll.user_id = u.user_id
JOIN m_hris_leave_type lt ON ll.leave_type_id = lt.leave_type_id
WHERE MONTH(ll.approved_at) = MONTH(NOW());
```

---

## 5. Implementation Steps

1. **Create Tables**: Run DDL scripts for master & log tables
2. **Insert Master Data**: Populate `m_hris_leave_type` dan `m_hris_config`
3. **Insert Services**: Add rows to `m_service` for Leave and Attendance
4. **Configure Triggers**: Add `on_approve` triggers to sync to log tables
5. **Initialize Balances**: Insert `t_hris_leave_balance` for all employees
