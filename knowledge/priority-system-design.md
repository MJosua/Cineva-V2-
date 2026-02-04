# Priority System Design

## Design Principles
1. **Default: Age-Based** - If service has no `priority_config`, use ticket age
2. **Per-Service Override** - Services can define custom rules in `form_json`
3. **Higher Age = Higher Priority** - Older tickets get escalated

## Default Age-Based Priority (Fallback)

| Age (days) | Priority |
|------------|----------|
| < 3 | Low |
| 3 - 7 | Medium |
| > 7 | High |

**SQL:**
```sql
SELECT 
  ticket_id,
  CASE 
    WHEN DATEDIFF(NOW(), creation_date) > 7 THEN 'high'
    WHEN DATEDIFF(NOW(), creation_date) >= 3 THEN 'medium'
    ELSE 'low'
  END AS priority
FROM t_ticket
```

## Per-Service Config (Optional Override)

In `m_service.form_json`:
```json
{
  "priority_config": {
    "type": "deadline_field",
    "field": "Week Delivery",
    "rules": [
      { "weeks_remaining": 0, "priority": "high" },
      { "weeks_remaining": 1, "priority": "medium" },
      { "weeks_remaining": 2, "priority": "low" }
    ]
  }
}
```

## Implementation Options

### Option A: Backend Calculates
- API returns `priority` in ticket list response
- Frontend just displays
- **Pros:** Consistent, faster frontend
- **Cons:** Extra backend logic

### Option B: Frontend Calculates (Current)
- Frontend has priority logic
- **Pros:** Quick to implement
- **Cons:** Logic duplicated if backend needs it

### Option C: Hybrid
- Backend provides raw data (`creation_date`, `Week Delivery`)
- Frontend calculates using shared utility
- **Pros:** Flexible
- **Cons:** Still frontend-heavy

## Recommendation
**Option A** - Backend calculates priority and includes it in API response. Frontend just displays the badge.
