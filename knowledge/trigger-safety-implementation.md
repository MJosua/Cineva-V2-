# Trigger Safety Features - Database Schema & Examples

> **Created**: 2024-12-14  
> **Purpose**: Reference document for new trigger safety features implementation

---

## Database Schema Changes

### New Table: t_trigger_warnings

**Purpose**: Logs infinite loop detections and other trigger warnings

```sql
CREATE TABLE IF NOT EXISTS t_trigger_warnings (
  warning_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NULL COMMENT 'Associated ticket if applicable',
  warning_type VARCHAR(50) NOT NULL COMMENT 'e.g., infinite_loop, validation_error',
  trigger_chain TEXT NULL COMMENT 'JSON array of trigger execution chain',
  created_at DATETIME NOT NULL,
  
  INDEX idx_ticket (ticket_id),
  INDEX idx_created (created_at),
  INDEX idx_type (warning_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores warnings from trigger engine including infinite loop detections';
```

**Verification Query**:
```sql
-- Check if table exists
SELECT TABLE_NAME, TABLE_COMMENT 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'hots' 
  AND TABLE_NAME = 't_trigger_warnings';

-- View recent warnings
SELECT 
  warning_id,
  ticket_id,
  warning_type,
  JSON_PRETTY(trigger_chain) as chain,
  created_at
FROM t_trigger_warnings
ORDER BY created_at DESC
LIMIT 10;
```

---

## Existing Table: m_service_triggers

**No schema changes required** - this table already exists and stores trigger configurations.

**Structure** (for reference):
```sql
-- Existing table structure
CREATE TABLE IF NOT EXISTS m_service_triggers (
  trigger_id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  trigger_name VARCHAR(100) NOT NULL COMMENT 'Event name: on_submit, on_approve, etc.',
  trigger_type VARCHAR(50) DEFAULT 'event',
  trigger_config JSON COMMENT 'Contains actions array with conditions',
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_service (service_id),
  INDEX idx_active (active)
);
```

---

## Example Trigger Configurations

### Example 1: Leave Request Auto-Logging

**Scenario**: When leave request is approved, automatically log it to attendance table

```json
{
  "trigger_name": "on_approve",
  "trigger_type": "event",
  "active": 1,
  "trigger_config": {
    "actions": [
      {
        "action": "create_record",
        "condition": {
          "type": "field_value",
          "value": {
            "field": "leave_days",
            "operator": ">",
            "value": 0
          }
        },
        "params": {
          "table": "t_attendance_log",
          "mapping": {
            "user_id": ":created_by",
            "leave_type": ":leave_type",
            "days_taken": ":leave_days",
            "ticket_id": ":ticketId",
            "status": "approved",
            "logged_at": "NOW()"
          }
        }
      },
      {
        "action": "send_email",
        "params": {
          "template": "leave_approved",
          "to": ":created_by"
        }
      }
    ]
  }
}
```

**SQL to insert**:
```sql
INSERT INTO m_service_triggers 
  (service_id, trigger_name, trigger_type, trigger_config, active)
VALUES 
  (
    5,  -- Replace with your leave request service_id
    'on_approve',
    'event',
    '{
      "actions": [
        {
          "action": "create_record",
          "condition": {
            "type": "field_value",
            "value": { "field": "leave_days", "operator": ">", "value": 0 }
          },
          "params": {
            "table": "t_attendance_log",
            "mapping": {
              "user_id": ":created_by",
              "leave_type": ":leave_type",
              "days_taken": ":leave_days",
              "ticket_id": ":ticketId",
              "status": "approved",
              "logged_at": "NOW()"
            }
          }
        }
      ]
    }',
    1
  );
```

---

### Example 2: Purchase Request Workflow

**Scenario**: Multi-step approval with different actions based on amount

```json
{
  "trigger_name": "on_submit",
  "trigger_type": "event",
  "active": 1,
  "trigger_config": {
    "actions": [
      {
        "action": "create_record",
        "condition": {
          "type": "field_value",
          "value": {
            "field": "total_amount",
            "operator": ">",
            "value": 10000000
          }
        },
        "params": {
          "table": "t_high_value_requests",
          "mapping": {
            "ticket_id": ":ticketId",
            "amount": ":total_amount",
            "requester": ":created_by",
            "requires_cfo": 1,
            "created_at": "NOW()"
          }
        }
      },
      {
        "action": "send_email",
        "condition": {
          "type": "field_value",
          "value": {
            "field": "total_amount",
            "operator": ">=",
            "value": 5000000
          }
        },
        "params": {
          "template": "high_value_alert",
          "to": "finance@company.com"
        }
      }
    ]
  }
}
```

---

### Example 3: All Condition Operators Demo

Shows all 12 supported operators:

```json
{
  "actions": [
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "status", "operator": "==", "value": "urgent" } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "priority", "operator": "!=", "value": "low" } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "amount", "operator": ">", "value": 1000 } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "days", "operator": "<", "value": 30 } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "score", "operator": ">=", "value": 80 } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "age", "operator": "<=", "value": 65 } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "description", "operator": "contains", "value": "urgent" } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "email", "operator": "not_contains", "value": "@test" } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "code", "operator": "starts_with", "value": "REQ" } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "filename", "operator": "ends_with", "value": ".pdf" } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "notes", "operator": "is_empty" } }
    },
    {
      "action": "log_analytics",
      "condition": { "type": "field_value", "value": { "field": "attachment", "operator": "is_not_empty" } }
    }
  ]
}
```

---

## Configuration Reference

### Environment Variables

Add to your `.env` or server configuration:

```bash
# Maximum trigger execution depth (prevents infinite loops)
TRIGGER_MAX_DEPTH=10

# Enable schema validation (default: true)
TRIGGER_VALIDATE_SCHEMA=true

# Enable trigger warning logging (default: true)
TRIGGER_LOG_WARNINGS=true
```

---

## Testing Checklist

After implementation, verify:

- [ ] **Database**
  - [ ] `t_trigger_warnings` table created
  - [ ] Can query warnings successfully
  - [ ] Indexes created properly

- [ ] **Backend API**
  - [ ] `GET /hots_settings/schema` returns table list
  - [ ] `POST /hots_settings/validate_triggers` validates configurations
  - [ ] `GET /hots_settings/triggers/:service_id` loads triggers
  - [ ] `POST /hots_settings/triggers/:service_id` saves triggers

- [ ] **Frontend UI**
  - [ ] Service Editor → Triggers tab appears
  - [ ] Table dropdown shows real database tables
  - [ ] Validation errors show red borders
  - [ ] Toast appears if validation fails

- [ ] **Trigger Engine**
  - [ ] Loop detection stops at depth 10
  - [ ] Warnings logged to `t_trigger_warnings`
  - [ ] `create_record` action inserts successfully
  - [ ] `field_value` conditions work for all operators

---

## Common Issues & Solutions

### Issue: Schema endpoint slow (>2 seconds)

**Cause**: Database has hundreds of tables  
**Solution**: Add caching or filter to specific prefixes

```javascript
// In getSchemaInfo endpoint, add WHERE clause:
WHERE TABLE_SCHEMA = 'hots' 
  AND TABLE_NAME LIKE 't_%'  -- Only ticket-related tables
```

### Issue: Loop detection too aggressive

**Cause**: MAX_DEPTH=10 too low for complex workflows  
**Solution**: Increase in trigger-engine.js

```javascript
this.MAX_TRIGGER_DEPTH = process.env.TRIGGER_MAX_DEPTH || 20;
```

### Issue: Can't save triggers - validation fails

**Cause**: Table/column typo or doesn't exist  
**Solution**: Check error message, verify table exists:

```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'hots' AND TABLE_NAME = 'your_table_name';
```

---

## Migration from Old System

If you have existing triggers in `m_service.trigger_meta` or `trigger_json`:

```sql
-- Check for services with old-style triggers
SELECT 
  service_id,
  service_name,
  trigger_meta,
  trigger_json
FROM m_service
WHERE trigger_meta IS NOT NULL 
   OR trigger_json IS NOT NULL;

-- These will continue to work (fallback support exists)
-- But recommend migrating to m_service_triggers for better management
```

---

## Maintenance Queries

```sql
-- Clean up old warnings (keep last 30 days)
DELETE FROM t_trigger_warnings 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Count warnings by type
SELECT warning_type, COUNT(*) as count
FROM t_trigger_warnings
GROUP BY warning_type;

-- Find services with most loop warnings
SELECT 
  t.ticket_id,
  COUNT(*) as loop_count,
  MAX(t.created_at) as last_loop
FROM t_trigger_warnings t
WHERE t.warning_type = 'infinite_loop'
GROUP BY t.ticket_id
HAVING loop_count > 3
ORDER BY loop_count DESC;
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/hots_settings/schema` | GET | Get database schema for validation |
| `/hots_settings/validate_triggers` | POST | Validate trigger config before save |
| `/hots_settings/triggers/:service_id` | GET | Load triggers for a service |
| `/hots_settings/triggers/:service_id` | POST | Save triggers for a service |

---

**Last Updated**: 2024-12-14  
**Version**: 1.0.0  
**Author**: Trigger Safety Implementation
