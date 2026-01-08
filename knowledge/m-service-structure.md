# m_service Table Structure & JSON Architecture

> **IMPORTANT:** This is a critical reference for understanding where form definitions and service configurations are stored.

## m_service Table Columns

| Column | Description |
|--------|-------------|
| `service_id` | Primary key |
| `service_name` | Display name (e.g., "NOODLE Sample Request Form") |
| `category_id` | Service category FK |
| `service_description` | Description text |
| `form_json` | **THE MAIN JSON** - Contains entire service config including `items` array |
| `nav_link` | URL path (e.g., "/sample-request-form") |
| `api_endpoint` | Custom API endpoint |
| `approval_level` | Legacy approval level |
| `team_id` | Assigned team FK |
| `active` | 1 = active, 0 = inactive |
| `widget` | Widget configuration |
| `assignment` / `assignment_type` / `assignment_config` | Assignment settings |

## form_json Structure

The `form_json` column contains a **JSON object** with this structure:

```json
{
  "id": "6",
  "title": "Service Display Name",
  "url": "/nav-link",
  "category": "Category Name",
  "description": "...",
  "apiEndpoint": "/api/...",
  "items": [
    // 👈 THE FORM BUILDER FIELDS ARRAY
    {
      "id": "field-xyz",
      "type": "field",
      "order": 0,
      "data": {
        "label": "Field Label",
        "name": "field_name",
        "type": "text|select|suggestion-insert|...",
        "autoSaveId": {
          "enabled": true,
          "idProperty": "some_id",
          "suffix": "_id"
        }
      }
    }
  ],
  "approval": {...},
  "submit": {...}
}
```

## Key Points

1. **`form_json.items`** is where form builder fields are stored
2. **`autoSaveId`** config lives inside each field's `data` property
3. When accessing items in backend code, always:
   - Query `SELECT form_json FROM m_service`
   - Parse JSON: `JSON.parse(form_json)`
   - Access items: `formJson.items`

## Related Tables

| Table | Purpose |
|-------|---------|
| `m_service_workflow` | Workflow definition (steps, approvers) |
| `m_service_triggers` | Event triggers (on_create, on_approve, etc.) |
| `t_ticket` | Ticket header |
| `t_ticket_detail` | EAV storage for form field values (visible to user) |
| `t_ticket_work_data` | EAV storage for backend/hidden data (not visible to user) |
