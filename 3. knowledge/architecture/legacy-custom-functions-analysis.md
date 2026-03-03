# Legacy Custom Functions Analysis

**Date:** 2026-01-02  
**Purpose:** Identify all usages of `t_service_custom_functions` for migration decision

---

## Summary

| Table | Purpose | Used By | Recommendation |
|-------|---------|---------|----------------|
| `m_custom_functions` | Function library (SRF generator, etc.) | Legacy HOTS | **KEEP** - but route through Core Engine |
| `t_service_custom_functions` | Links functions to services | Legacy HOTS | **MIGRATE** to `m_service_triggers` |
| `m_service_triggers` | Core Engine triggers | New HOTS | **KEEP** - Primary system |

---

## Files Using `t_service_custom_functions`

### 1. hotsTicket.js (Legacy Ticket Controller)
**Path:** `controller/hots_controller/hotsTicket.js`

| Line | Function | Purpose | Action |
|------|----------|---------|--------|
| 3457-3550 | `callexecuteCustomFunctions()` | Executes on_created functions | 🔴 **MIGRATE** to Core Engine trigger |
| 5335-5400 | `executeCustomFunctionsByTrigger()` | Executes functions by trigger event | 🔴 **MIGRATE** to Core Engine trigger |

**Code:**
```javascript
// Line 3459-3465 - Query that uses t_service_custom_functions
const customFunctionQuery = `
    SELECT cf.*, csa.trigger_event, csa.execution_order
    FROM m_custom_functions cf
    INNER JOIN t_service_custom_functions csa ON cf.id = csa.function_id
    WHERE csa.service_id = ? AND csa.trigger_event = 'on_created' AND csa.is_active = 1
    ORDER BY csa.execution_order
`;
```

---

### 2. ticketController.js (Refactored Copy)
**Path:** `controller/hots_controller/ticketing/controllers/ticketController.js`

Same as above - this is a duplicate/copy of hotsTicket.js in the new folder structure.

| Line | Function | Action |
|------|----------|--------|
| 3462 | `callexecuteCustomFunctions()` | 🔴 **SAME CODE - DELETE DUPLICATE** |
| 5342 | `executeCustomFunctionsByTrigger()` | 🔴 **SAME CODE - DELETE DUPLICATE** |

---

### 3. hotscustomfunctionController.js (OLD)
**Path:** `controller/hots_controller/hotscustomfunctionController.js`

| Line | Function | Purpose | Action |
|------|----------|---------|--------|
| 39 | `getCustomFunctions()` | Lists all functions with usage count | ⚪ **OPTIONAL** - Admin view only |
| 73-77 | `getServiceCustomFunctions()` | Gets functions for a service | 🔴 **MIGRATE** - Use m_service_triggers instead |
| 204 | `assignFunctionToService()` | INSERT into t_service_custom_functions | 🔴 **DELETE** - Use trigger admin UI |
| 493, 523 | `updateServiceFunctionAssignment()` | UPDATE assignments | 🔴 **DELETE** - Use trigger admin UI |

---

### 4. customfunctionController.js (NEW Folder)
**Path:** `controller/hots_controller/customfunction/controllers/customfunctionController.js`

Same as #3 - Duplicate in new folder structure.

---

### 5. Frontend customFunctionController.js
**Path:** `fontend/HOTS/src/controllers/customFunctionController.js`

| Line | Function | Purpose | Action |
|------|----------|---------|--------|
| 51-55 | `getServiceCustomFunctions()` | Gets functions for service (frontend) | ⚪ **DELETE** - Not used by new frontend |

---

## Migration Path

### Step 1: Convert Legacy Function Calls to Core Engine Triggers

**BEFORE (Legacy):** 
```javascript
// In hotsTicket.js createTicket()
await module.exports.callexecuteCustomFunctions(service_id, ticket_id);
```

**AFTER (Core Engine):**
```javascript
// Already implemented in Core Engine
await triggerEngine.runTriggersForEvent(moduleKey, 'on_submit', context);
```

### Step 2: Configure in `m_service_triggers`

**Example trigger config:**
```json
{
  "trigger_name": "on_submit",
  "trigger_type": "event",
  "trigger_config": {
    "actions": [
      {
        "action": "execute_function",
        "params": {
          "function": "srf_document_generator",
          "args": { "ticketId": ":ticketId" }
        }
      }
    ]
  }
}
```

---

## Functions in `m_custom_functions` to Keep/Migrate

| Handler | Type | Used For | Migration Status |
|---------|------|----------|------------------|
| `srf_document_generator` | document_generation | SRF PDF generation | ✅ Already in `script/trigger-functions/` |
| `executeDocumentGeneration` | document_generation | Generic PDF | ⚪ Move to trigger-functions |
| `executeExcelProcessing` | excel_processing | Excel import | ⚪ Move to trigger-functions |
| `executeEmailNotification` | email_notification | Email sending | ✅ Use Core Engine `send_email` action |
| `executeApiIntegration` | api_integration | External API calls | ⚪ Move to trigger-functions |

---

## Files to DELETE (Duplicates)

| File | Reason |
|------|--------|
| `controller/hots_controller/hotsTicket.js` | OLD - use ticketing/controllers/ticketController.js |
| `controller/hots_controller/hotscustomfunctionController.js` | OLD - use customfunction/controllers/ |
| `fontend/HOTS/src/controllers/customFunctionController.js` | NOT USED by React frontend |

---

## Decision Matrix

| Question | Answer |
|----------|--------|
| Keep `m_custom_functions` table? | ✅ YES - It's a function library, useful for reuse |
| Keep `t_service_custom_functions` table? | ❌ NO - Migrate to `m_service_triggers` |
| Keep legacy `callexecuteCustomFunctions()`? | ❌ NO - Use Core Engine `runTriggersForEvent()` |
| Keep `srf_document_generator`? | ✅ YES - Already migrated to `script/trigger-functions/` |

---

## Recommended Actions

1. **[DONE]** `srf_document_generator.js` exists in `script/trigger-functions/`
2. **[TODO]** Remove `callexecuteCustomFunctions()` calls from ticket creation
3. **[TODO]** Configure services to use `m_service_triggers` for `on_submit` event
4. **[TODO]** Delete duplicate controller files (old folder structure)
5. **[TODO]** Eventually drop `t_service_custom_functions` table

---

## SQL: Find Active Usages

```sql
-- Check which services still use legacy t_service_custom_functions
SELECT 
    s.service_id,
    s.service_name,
    scf.function_id,
    cf.name as function_name,
    cf.handler,
    scf.trigger_event
FROM t_service_custom_functions scf
JOIN m_custom_functions cf ON scf.function_id = cf.id
JOIN m_service s ON scf.service_id = s.service_id
WHERE scf.is_active = 1
ORDER BY s.service_name;
```

---

## Next Steps

- [ ] Run SQL above to see which services use legacy functions
- [ ] For each service, create equivalent `m_service_triggers` entry
- [ ] Test trigger-based execution
- [ ] Remove legacy function calls from ticket controller
