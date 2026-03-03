# Database Schema Reference

Quick reference for commonly used tables and their correct column names.

## User Table (`user`)

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | INT | Primary key |
| `employee_id` | INT | Employee number |
| `firstname` | VARCHAR | First name |
| `lastname` | VARCHAR | Last name |
| `uid` | VARCHAR | Username/Login ID |
| `email` | VARCHAR | Email address |
| `nik` | VARCHAR | NIK (employee ID) |
| `active` | INT | 1 = active, 0 = inactive (**NOT** `is_active`) |
| `role_id` | INT | FK to m_role |
| `jobtitle_id` | INT | FK to m_job_title.jobtitle_id |
| `department_id` | INT | FK to m_department |
| `superior_id` | INT | FK to user (manager) |
| `phone` | VARCHAR | Extension phone |
| `plant_id` | INT | Factory/Plant ID |

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
| `work_data_id` | INT | Primary Key |
| `ticket_id` | VARCHAR | FK to t_ticket |
| `data_key` | VARCHAR | Key for the dynamic form field (e.g., `brand_name`) |
| `data_value` | TEXT | Value entered by the user |
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
