# Data Separation: Revised Implementation Plan (v2 - Explicit Config)

## Summary
Route auto-save ID fields to `t_ticket_work_data` using the **explicit `autoSaveId` config** from the service JSON. Only fields marked with `autoSaveId.enabled = true` in the form builder will be routed.

## Approach: Backend-Only (Config-Driven)
The backend already fetches the service definition (form JSON). We parse it to identify auto-save fields explicitly.

## Proposed Change

### [MODIFY] [ticketController.js](file:///d:/GIT-Based-Backend/Integrated-API.worktrees/AntiGravityWorktree/controller/hots_controller/ticketing/controllers/ticketController.js)

**Location:** `createTicket` function.

**Step 1: Parse service JSON to build auto-save field list**
```javascript
// After fetching service (line ~3728)
const serviceItems = JSON.parse(service.items || '[]');
const autoSaveFieldNames = new Set();

// Recursively find fields with autoSaveId.enabled
function collectAutoSaveFields(items) {
    for (const item of items) {
        if (item.data?.autoSaveId?.enabled) {
            const fieldName = item.data.name || item.data.label?.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const suffix = item.data.autoSaveId.suffix || '_id';
            autoSaveFieldNames.add(`${fieldName}${suffix}`);
        }
        // Check section fields
        if (item.data?.fields) {
            for (const f of item.data.fields) {
                if (f.autoSaveId?.enabled) {
                    const suffix = f.autoSaveId.suffix || '_id';
                    autoSaveFieldNames.add(`${f.name}${suffix}`);
                }
            }
        }
    }
}
collectAutoSaveFields(serviceItems);
console.log('Auto-save fields:', [...autoSaveFieldNames]);
```

**Step 2: Route fields based on the set**
```javascript
// Inside the insert loop
const isAutoSaveField = autoSaveFieldNames.has(label) || autoSaveFieldNames.has(fieldName);

if (isAutoSaveField) {
    // Route to t_ticket_work_data
    detailInsertPromises.push(
        dbHots.promise().execute(
            `INSERT INTO hots.t_ticket_work_data (ticket_id, service_id, field_name, field_value, data_type, entity_id) 
             VALUES (?, ?, ?, ?, 'auto_save', 'form_submission')`,
            [ticket_id, service_id, label, value]
        )
    );
} else {
    // Route to t_ticket_detail (existing logic)
    ...
}
```

## Why This is Better
- **Explicit:** Only fields you mark with `autoSaveId.enabled` are affected.
- **Flexible Suffix:** Respects the `suffix` config (not hardcoded to `_id`).
- **No Frontend Changes:** Backend reads the same JSON the frontend uses.

## Verification
1.  Submit SRF with "Sample Category" (autoSaveId enabled, suffix `_id`).
2.  `t_ticket_detail`: Contains "Sample Category" = "Noodle".
3.  `t_ticket_work_data`: Contains "Sample Category_id" = "15", `data_type` = 'auto_save'.
4.  Ticket Detail page: "Sample Category_id" NOT visible.
