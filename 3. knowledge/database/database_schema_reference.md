# Database Schema Reference

Quick reference for commonly used tables and their correct column names.

## User Table (`user`)

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | INT | Primary key (Auto Increment) |
| `employee_id` | INT | Employee number |
| `firstname` | VARCHAR(64) | First name |
| `lastname` | VARCHAR(64) | Last name |
| `uid` | VARCHAR(30) | Username/Login ID |
| `pswd` | VARCHAR(64) | Password hash |
| `email` | VARCHAR(100) | Email address |
| `nik` | VARCHAR(10) | NIK (employee ID) |
| `active` | INT | 1 = active, 0 = inactive (**NOT** `is_active`) |
| `role_id` | INT | FK to m_role |
| `jobtitle_id` | INT | FK to m_job_title.jobtitle_id |
| `department_id` | INT | FK to m_department |
| `superior_id` | INT | FK to user (manager) |
| `phone` | VARCHAR(100) | Extension phone |
| `plant_id` | INT | Factory/Plant ID |
| `grade_id` | INT | Grade ID |
| `status` | VARCHAR(100) | Employment status |

---

## Job Title Table (`m_job_title`)

| Column | Type | Description |
|--------|------|-------------|
| `jobtitle_id` | INT | Primary key (**NOT** `id`) |
| `job_title` | VARCHAR | Job title name (**NOT** `name`) |
| `department_id` | INT | FK to m_department |
| `is_active` | INT | 1 = active |

**JOIN Example:**
```sql
LEFT JOIN m_job_title jt ON u.jobtitle_id = jt.jobtitle_id
-- SELECT jt.job_title AS job_title_name
```

---

## Department Table (`m_department`)

| Column | Type | Description |
|--------|------|-------------|
| `department_id` | INT | Primary key |
| `department_name` | VARCHAR | Department name |

---

## User Profile Table (`user_profile`)

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | INT | FK to user |
| `attribute_name` | VARCHAR | e.g., 'phone' for cell phone |
| `attribute_value` | VARCHAR | The value |
| `is_active` | INT | 1 = active |

---

## User Notification Table (`user_notification`)

| Column | Type | Description |
|--------|------|-------------|
| `notification_id` | INT | Primary Link |
| `user_id` | INT | Recipient user ID |
| `type` | VARCHAR | Event type: `approval_needed`, `ticket_update`, `new_comment`, `assignment` |
| `title` | VARCHAR | User-facing title |
| `message` | TEXT | Detailed message body |
| `data_payload` | JSON | Action data: `{ url, ticket_id, etc. }` |
| `is_read` | TINYINT | 0=Unread, 1=Read |
| `created_at` | DATETIME | Timestamp |

---

## Work Data Table (`t_ticket_work_data`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary Key (Auto Increment) |
| `ticket_id` | VARCHAR(20) | FK to t_ticket |
| `assignment_id` | INT | FK to t_ticket_assignment |
| `data_type` | VARCHAR(50) | Type of data (e.g., 'form_data') |
| `field_name` | VARCHAR(100) | Key for the dynamic form field (e.g., `brand_name`) |
| `field_value` | TEXT | Value entered by the user |
| `field_type` | ENUM | text, number, date, json, file, report, admin |
| `is_latest` | TINYINT | 1 = current version |
| `updated_at` | DATETIME | Last update timestamp |

---

## Dashboard Tables

| Old Name | New Name |
|----------|----------|
| `m_dashboard_function` | `m_dashboard_menu` |
| `m_dashboard_panel` | `m_dashboard_widget` |
| `dashboard_function_id` | `dashboard_menu_id` |

---

## Workflow Table (`m_service_workflow`)

| Column | Type | Description |
|--------|------|-------------|
| `workflow_id` | INT | Primary key |
| `name` | VARCHAR | Workflow name |
| `definition` | JSON | Workflow steps/logic |
| `category_ids` | JSON | Cat IDs this workflow applies to (e.g., `["7"]`) |
| `is_active` | TINYINT | 1 = active |
| `created_at` | DATETIME | Created timestamp |
| `updated_at` | DATETIME | Updated timestamp |

---

## Triggers Table (`m_service_triggers`)

| Column | Type | Description |
|--------|------|-------------|
| `trigger_id` | INT | Primary key |
| `service_id` | INT | Linked service ID |
| `trigger_name` | VARCHAR | Name of trigger |
| `trigger_type` | VARCHAR | Type (e.g., `notification`) |
| `trigger_config` | JSON | Configuration (e.g., recipient team) |
| `active` | TINYINT | 1 = active |

---

## Ticket Assignment Table (`t_ticket_assignment`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `ticket_id` | VARCHAR | FK to t_ticket |
| `assigned_type` | ENUM | 'user' or 'team' |
| `assigned_id` | BIGINT | ID of the assigned user or team |
| `assigned_by` | BIGINT | User who created the assignment |
| `assigned_at` | DATETIME | Timestamp when assigned |
| `unassigned_at` | DATETIME | Timestamp when unassigned or completed |
| `assignment_status` | ENUM | 'active', 'completed', 'reassigned', 'cancelled' |
| `notes` | TEXT | Additional notes |

---

## Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `u.is_active` | `u.active` |
| `jt.id` | `jt.jobtitle_id` |
| `jt.name` | `jt.job_title` |
| `m_dashboard_function` | `m_dashboard_menu` |
| `m_dashboard_panel` | `m_dashboard_widget` |
