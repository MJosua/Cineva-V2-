# HOTS User Registration Schemas

## Table: `user_draft`
This table stores user registration requests before they are approved by a Department Leader.

```sql
CREATE TABLE `user_draft` (
  `draft_id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) DEFAULT NULL,
  `firstname` varchar(100) DEFAULT NULL,
  `lastname` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `leader_id` int(11) DEFAULT NULL,
  `jobtitle_id` int(11) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `plant_id` int(11) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `approval_ticket_id` int(11) DEFAULT NULL,
  `registration_token` varchar(255) DEFAULT NULL,
  `approval_status` enum('pending','verified','approved','rejected') DEFAULT 'pending',
  `approval_date` datetime DEFAULT NULL,
  `rejected_reason` text,
  `created_ip` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`draft_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Table: `m_company_department`
Master data for departments, including the department head assignment.

```sql
CREATE TABLE `m_company_department` (
  `department_id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) DEFAULT NULL,
  `department_shortname` varchar(50) DEFAULT NULL,
  `department_head` int(11) DEFAULT NULL,
  `description` text,
  `finished_date` date DEFAULT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Relationships
- `user_draft.department_id` -> `m_company_department.department_id`
- `m_company_department.department_head` -> `user.user_id` (Leader)

## Flow
1. User registers -> Insert into `user_draft`.
2. System looks up `m_company_department.department_head`.
3. Email sent to Header (Leader).
4. Leader approves -> Insert into `user` table -> Update `user_draft.user_id` and `status`.
