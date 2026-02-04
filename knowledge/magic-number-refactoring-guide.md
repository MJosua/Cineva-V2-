# Magic Number Refactoring Guide

This document tracks the refactoring of hardcoded magic numbers to use the centralized constants library.

## 📚 One Source Library: `script/Utility/hotsConstants.js`

### Categories Available:

| Category | Description | Example Usage |
|---|---|---|
| `SERVICE_IDS` | Service ID mappings | `SERVICE_IDS.SRF` // 6 |
| `STATUS_IDS` | Ticket lifecycle status | `STATUS_IDS.SUBMITTED` // 0 |
| `APPROVAL_STATUS` | Approval event status | `APPROVAL_STATUS.PENDING` // 0 |
| `EVENT_TYPES` | Workflow event types | `EVENT_TYPES.APPROVAL` // 'approval' |
| `ASSIGNMENT_TYPES` | Assignment target types | `ASSIGNMENT_TYPES.TEAM` // 'team' |
| `ENTITY_TYPES` | File upload entity types | `ENTITY_TYPES.TICKET` // 'ticket' |
| `DATA_TYPES` | Work data types | `DATA_TYPES.REPORT` // 'report' |
| `FIELD_VISIBILITY` | Data visibility levels | `FIELD_VISIBILITY.ADMIN` // 'admin' |
| `APPROVAL_LEVELS` | Workflow complexity | `APPROVAL_LEVELS.SUPERIOR_ONLY` // 1 |
| `PRIORITY_LEVELS` | Priority labels | `PRIORITY_LEVELS.HIGH` // 'high' |
| `PRIORITY_THRESHOLDS` | Days for priority calc | `PRIORITY_THRESHOLDS.HIGH_DAYS` // 7 |
| `USER_ROLES` | Role ID mappings | `USER_ROLES.ADMIN` // 2 |
| `SPECIAL_USERS` | Known system user IDs | `SPECIAL_USERS.IT_ADMIN` // 1001 |

---

## ✅ Completed Refactoring

### Priority System
- [x] `getMyTickets` - Priority logic added
- [x] `getAllTickets` - Priority logic added
- [x] `getTaskList` - Priority logic added

### Magic Number Replacement
- [x] `addTicketITSupport` - STATUS_IDS.SUBMITTED
- [x] `addTicketPCRequest` - STATUS_IDS.SUBMITTED (x2)
- [x] `setTicket` case 11 (Pricing) - SERVICE_IDS + STATUS_IDS
- [x] `setTicket` case 10 (Data Update) - STATUS_IDS.SUBMITTED
- [x] `setTicket` case 6 (SRF) - SERVICE_IDS.SRF + STATUS_IDS.SUBMITTED

---

## 📋 Remaining Work (Optional)

There may be additional magic numbers in:
1. Other `setTicket` switch cases (need to identify all service types)
2. Approval status checks (`approval_status = 0/1/2`)
3. Status comparisons in queries (`status_id NOT IN (6, 7, 99)`)

These can be refactored incrementally as needed.
