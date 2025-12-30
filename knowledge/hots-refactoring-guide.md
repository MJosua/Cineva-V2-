# HOTS Refactoring Knowledge Base

**Last Updated:** 2025-12-30
**Status:** Phase 3 Complete (Utility Extraction & Function Swap)

---

## 📍 Quick Reference: Where Things Are

| Component | Old Location | New Location |
|-----------|--------------|--------------|
| ID Generation | `hotsTicket.js` (lines 35-70) | `src/shared/utils/idGenerator.js` |
| Constants | Hardcoded in controllers | `src/shared/constants/hotsConstants.js` |
| Email Templates | Inline in `hotsTicket.js` | `src/modules/ticketing/notifications/templates.js` |

---

## 🔢 Constants Reference

### Service IDs (Maps to `m_service` table)
```javascript
const SERVICE_IDS = {
    PC_REQUEST: 1,          // PC/Laptop Request
    IT_SUPPORT: 7,          // IT Support Request
    DATA_UPDATE: 10,        // Data Update Request
    PRICING_STRUCTURE: 11,  // Pricing Structure
};
```

### Status IDs (Maps to `m_status` table)
```javascript
const STATUS_IDS = {
    DRAFT: 0,               // Initial state on creation
    PENDING: 1,             // Waiting for approval
    APPROVED: 2,            // Approved by all approvers
    REJECTED: 3,            // Rejected by any approver
    COMPLETED: 4,           // Work completed
    CANCELLED: 5,           // Cancelled by requester
};
```

### Entity Types (For `t_file_upload`)
```javascript
const ENTITY_TYPES = {
    TICKET: 'ticket',
    USER: 'user',
    DOCUMENT: 'document',
};
```

---

## 🆔 ID Generation Functions

### `generateID(user_id, service_id, row_number)`
**Purpose:** Generate legacy ticket ID.
**Format:** `YYYYMMDD` + `user_id` + `service_id (2 digits)` + `row_number + 1`

```javascript
// Example
generateID(1001, 7, 5);  // Returns: 202512301001076
//          ↑     ↑  ↑              ↑       ↑   ↑ ↑
//        user  svc row           date   user svc row+1
```

### `generateCustomTicketID(db, service_id, user_id)`
**Purpose:** Generate custom ticket ID with running number from database.
**Format:** `YY` + `service_id (2 digits)` + `user_id (4 digits)` + `running (4 digits)`

```javascript
// Example
await generateCustomTicketID(dbHots, 7, 1001);  // Returns: "2507100010001"
//                                                         ↑↑ ↑  ↑    ↑
//                                                        YY svc user running
```

---

## 📧 Email Templates

Located in: `src/modules/ticketing/notifications/templates.js`

| Function | Purpose |
|----------|---------|
| `ticketCreatedITSupport({ fullName, timestamp })` | IT Support ticket creation email |
| `ticketSubmitted({ fullName, service_id, ticketId, ... })` | General ticket submission confirmation |
| `approvalRequired({ approverName, ticketId, ... })` | Email to approvers requesting action |
| `subjects.ticketCreated(ticketId)` | Subject line for ticket creation |
| `subjects.approvalRequired(ticketId)` | Subject line for approval request |

---

## 🔄 How to Use New Utilities

### In Controllers:
```javascript
// Import constants
const { SERVICE_IDS, STATUS_IDS } = require("../../src/shared/constants/hotsConstants");

// Import ID generators
const { generateID, generateCustomTicketID } = require("../../src/shared/utils/idGenerator");

// Usage
let service_id = SERVICE_IDS.IT_SUPPORT;  // Instead of: let service_id = 7;
let status_id = STATUS_IDS.DRAFT;         // Instead of: status_id = 0
let ticketId = generateID(user_id, service_id, rowNumber);
```

---

## ⚠️ Rollback Instructions

If something breaks after refactoring:

### Quick Rollback (Git):
```bash
git revert HEAD
```

### Manual Rollback (hotsTicket.js):
1. Find the commented block: `/* === ORIGINAL FUNCTIONS (Kept for rollback reference) ===`
2. Uncomment the original functions
3. Comment out or delete the wrapper lines:
   ```javascript
   // Comment these out:
   // const generateID = sharedGenerateID;
   // const generateCustomTicketID = sharedGenerateCustomTicketID;
   ```

---

## 📊 Verification Tests

To verify ID generation still works correctly:
```bash
node -e "
const { generateID } = require('./src/shared/utils/idGenerator');
console.log('Test:', generateID(1001, 7, 5));
// Expected: 202512301001076 (date-dependent)
"
```

---

## 🗂️ Folder Structure After Refactoring

```
src/
├── modules/
│   └── ticketing/
│       └── notifications/
│           └── templates.js       # Email templates
└── shared/
    ├── constants/
    │   └── hotsConstants.js       # All magic numbers
    └── utils/
        └── idGenerator.js         # ID generation functions

docs/
├── architecture/                  # Architecture docs (future)
└── domain/                        # Domain knowledge (future)
```

---

## 🎯 What's Next (Phase 4 - Not Yet Executed)

Phase 4 involves moving `hotsTicket.js` entirely to `src/modules/ticketing/controllers/`.
This is a **high-risk** structural change and should only be done after Phase 3 is stable in production.
