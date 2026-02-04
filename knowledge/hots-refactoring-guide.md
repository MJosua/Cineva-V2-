# HOTS Refactoring Knowledge Base

**Last Updated:** 2025-12-30
**Status:** Complete (Reorganized Folder Structure)

---

## 📍 Quick Reference: Where Things Are

| Component | Location |
|-----------|----------|
| **Ticket Controller** | `controller/hots_controller/ticketing/controllers/ticketController.js` |
| **Notifications** | `controller/hots_controller/notification/notificationController.js` |
| **Team Management** | `routers/project_manager/team_routes.js` (and frontend `pages/admin/TeamManagement.tsx`) |
| **Constants** | `script/Utility/hotsConstants.js` |
| **ID Generator** | `script/Utility/idGenerator.js` |
| **Email Templates** | `controller/hots_controller/ticketing/notifications/templates.js` |
| **Backup Controller** | `controller/hots_controller/hotsTicket.js` (still functional) |
| **Documentation** | `knowledge/` folder |

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
```

### `generateCustomTicketID(db, service_id, user_id)`
**Purpose:** Generate custom ticket ID with running number from database.
**Format:** `YY` + `service_id (2 digits)` + `user_id (4 digits)` + `running (4 digits)`

---

## 🔄 How to Use Utilities

### In Controllers:
```javascript
// Import constants
const { SERVICE_IDS, STATUS_IDS } = require("../../script/Utility/hotsConstants");

// Import ID generators
const { generateID } = require("../../script/Utility/idGenerator");

// Usage
let service_id = SERVICE_IDS.IT_SUPPORT;  // Instead of: service_id = 7
let ticketId = generateID(user_id, service_id, rowNumber);
```

---

## ⚠️ Rollback Instructions

### If Issues Arise:

**Option 1: Git Revert**
```bash
git revert HEAD
```

**Option 2: Use Backup Controller**
1. Edit `controller/index.js`
2. Change line 20 from:
   ```javascript
   const hotsTicket = require('./hots_controller/ticketing/controllers/ticketController');
   ```
   To:
   ```javascript
   const hotsTicket = require('./hots_controller/hotsTicket');
   ```

---

## 🗂️ Final Folder Structure

```
controller/
└── hots_controller/
    ├── hotsTicket.js                 # BACKUP (still works)
    ├── hotscustomfunctionController.js
    ├── hotsAdmin.js
    ├── hotsAuth.js
    ├── hotsSettingsController.js
    └── ticketing/                    # NEW STRUCTURE
        ├── controllers/
        │   └── ticketController.js   # MAIN CONTROLLER
        └── notifications/
            └── templates.js          # Email templates

script/
└── Utility/
    ├── hotsConstants.js              # All magic numbers
    ├── idGenerator.js                # ID generation functions
    └── ... (other utilities)

knowledge/
├── hots-refactoring-guide.md         # This file
└── docs/
    ├── architecture/                 # Architecture docs
    └── domain/                       # Domain knowledge
```

---

## 📈 What's Next (Future Work)

1. **Production Testing** - Deploy and verify all ticket endpoints work
2. **Phase 5** - Apply same pattern to other HOTS controllers (hotsAdmin, hotsSettings)
3. **Phase 6** - Create Inventory module following same structure
4. **Phase 7** - Consolidate workflow-engine as the single approval source
5. **Phase 8 (Completed)** - Implement Actionable Notification System (`user_notification`)
6. **Phase 9 (Completed)** - Refactor Team Management to dedicated page
