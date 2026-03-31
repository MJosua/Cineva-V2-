# Event Engine API Contract

> **Version:** 1.0  
> **Status:** Draft  
> **Last Updated:** 2026-02-02  
> **Authors:** Backend Architecture Team

This document defines the complete API contract for the Event Engine. Frontend and backend teams must adhere to these specifications. Breaking changes require versioning.

---

## Overview

### Base URL
```
/api/event-engine
```

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.
User must have appropriate role permissions (see Core Engine RBAC).

### Response Format
All responses follow this envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-02-02T10:00:00Z",
    "request_id": "uuid"
  }
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": { ... }
}
```

---

## A. CAMPAIGNS

### A1. List All Campaigns
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/campaigns` |
| **Type** | READ |
| **Purpose** | List all event campaigns for dashboard |
| **DB Tables** | `EVENT_t_campaign` |
| **Frontend Consumer** | `Dashboard.jsx`, `EventSelector.jsx` |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter by status: `draft`, `active`, `paused`, `ended` |
| `limit` | int | No | Max results (default: 50) |
| `offset` | int | No | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "campaign_id": 1,
        "ticket_id": "EVT-2024-001",
        "slug": "tw-2024",
        "name": "Taiwan New Year 2024",
        "status": "active",
        "theme_config": { "primary_color": "#FF0000" },
        "settings_config": { "start_date": "2024-01-01", "end_date": "2024-02-15" },
        "created_by": 5,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-10T12:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### A2. Get Campaign by Slug
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/campaigns/:slug` |
| **Type** | READ |
| **Purpose** | Get single campaign details |
| **DB Tables** | `EVENT_t_campaign`, `cms_m_page` (joined) |
| **Frontend Consumer** | `EventDashboard.jsx`, `EventEditor.jsx` |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `slug` | string | Campaign URL slug |

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign_id": 1,
    "ticket_id": "EVT-2024-001",
    "slug": "tw-2024",
    "name": "Taiwan New Year 2024",
    "status": "active",
    "theme_config": {
      "primary_color": "#FF0000",
      "font_family": "Inter"
    },
    "block_schema": [
      { "type": "hero", "props": { "title": "Win Big!" } }
    ],
    "settings_config": {
      "start_date": "2024-01-01",
      "end_date": "2024-02-15",
      "max_submissions_per_user": 5,
      "require_approval": true
    },
    "created_by": 5,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-10T12:00:00Z"
  }
}
```

---

## B. SUBMISSIONS

### B1. List Submissions
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/campaigns/:slug/submissions` |
| **Type** | READ |
| **Purpose** | List all submissions for a campaign |
| **DB Tables** | `EVENT_t_submission` |
| **Frontend Consumer** | `SubmissionsPage.jsx` |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter: `pending`, `approved`, `rejected` |
| `search` | string | No | Search participant_name or participant_contact |
| `limit` | int | No | Max results (default: 50) |
| `offset` | int | No | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "submission_id": 1,
        "campaign_id": 1,
        "participant_name": "王小明",
        "participant_contact": "0912-345-678",
        "receipt_codes": "AB-12345678",
        "extra_data": {
          "store": "7-11 台北信義店",
          "amount": 450,
          "images": ["/uploads/receipt-001.jpg"]
        },
        "status": "pending",
        "rejection_reason": null,
        "ip_address": "203.145.92.10",
        "user_agent": "Mozilla/5.0...",
        "submitted_at": "2025-01-30T08:15:00Z",
        "updated_by": null,
        "updated_at": null
      }
    ],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

---

### B2. Get Submission Stats
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/campaigns/:slug/submissions/stats` |
| **Type** | READ |
| **Purpose** | Get aggregated submission statistics |
| **DB Tables** | `EVENT_t_submission` (aggregated) |
| **Frontend Consumer** | `ReportsPage.jsx`, `EventDashboard.jsx` |

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 156,
    "pending": 45,
    "approved": 100,
    "rejected": 11
  }
}
```

---

### B3. Update Submission Status
| Property | Value |
|----------|-------|
| **Method** | `PATCH` |
| **Path** | `/api/event-engine/submissions/:id` |
| **Type** | WRITE |
| **Purpose** | Approve or reject a submission |
| **DB Tables** | `EVENT_t_submission` |
| **Frontend Consumer** | `SubmissionsPage.jsx` (approve/reject buttons) |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | int | submission_id |

**Request Body:**
```json
{
  "status": "approved",
  "rejection_reason": null
}
```
OR
```json
{
  "status": "rejected",
  "rejection_reason": "Receipt date outside campaign period"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": 3,
    "status": "rejected",
    "rejection_reason": "Receipt date outside campaign period",
    "updated_by": 1,
    "updated_at": "2025-01-30T10:00:00Z"
  }
}
```

---

## C. REWARD POOLS

### C1. List Pools for Campaign
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/campaigns/:slug/pools` |
| **Type** | READ |
| **Purpose** | List all reward pools for a campaign |
| **DB Tables** | `EVENT_m_pool`, `EVENT_m_pool_item` (count aggregation) |
| **Frontend Consumer** | `CouponsPage.jsx`, `WinnerGeneratorPage.jsx` |

**Response:**
```json
{
  "success": true,
  "data": {
    "pools": [
      {
        "pool_id": 1,
        "campaign_id": 1,
        "name": "New Year Welcome Coupon",
        "description": "Get 50 points on your first submission",
        "type": "VOUCHER",
        "config": {
          "uses_per_user": 1,
          "valid_from": "2024-11-25T00:00:00Z",
          "valid_until": "2025-01-31T23:59:59Z",
          "rules": [],
          "effects": [{ "type": "points", "config": { "points": 50 } }]
        },
        "total_items": 1000,
        "used_items": 156,
        "status": "active"
      }
    ]
  }
}
```

---

### C2. Get Pool Items
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/pools/:id/items` |
| **Type** | READ |
| **Purpose** | List individual items in a pool |
| **DB Tables** | `EVENT_m_pool_item` |
| **Frontend Consumer** | `WinnerGeneratorPage.jsx` (available items) |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `is_used` | int | No | Filter: `0` (available) or `1` (used) |
| `limit` | int | No | Max results (default: 100) |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "item_id": 1,
        "pool_id": 3,
        "value": "LUCKY-001",
        "is_used": 0,
        "used_at": null,
        "used_by_submission_id": null
      }
    ],
    "total": 100
  }
}
```

---

### C3. Get Pool Stats
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/pools/:id/stats` |
| **Type** | READ |
| **Purpose** | Get pool usage statistics |
| **DB Tables** | `EVENT_m_pool`, `EVENT_m_pool_item` |
| **Frontend Consumer** | `WinnerGeneratorPage.jsx` (getPoolDrawStats) |

**Response:**
```json
{
  "success": true,
  "data": {
    "pool_id": 3,
    "pool_name": "First 100 Lucky Draw",
    "pool_type": "SERIAL",
    "total_items": 100,
    "used_items": 45,
    "available_items": 55,
    "exhausted": false
  }
}
```

---

## D. WINNER GENERATOR

### D1. Preview Draw
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/pools/:id/draw/preview` |
| **Type** | READ |
| **Purpose** | Preview which items would be selected (no state change) |
| **DB Tables** | `EVENT_m_pool_item` |
| **Frontend Consumer** | `WinnerGeneratorPage.jsx` (previewDraw) |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `count` | int | Yes | Number of items to preview |
| `strategy` | string | No | `RANDOM` (default) or `FIRST_N` |

**Response:**
```json
{
  "success": true,
  "data": {
    "preview_items": [
      { "item_id": 10, "value": "LUCKY-010" },
      { "item_id": 25, "value": "LUCKY-025" }
    ],
    "metadata": {
      "pool_id": 3,
      "pool_name": "First 100 Lucky Draw",
      "strategy": "RANDOM",
      "requested_count": 2,
      "available_count": 55,
      "preview_count": 2
    }
  }
}
```

---

### D2. Execute Draw
| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/event-engine/pools/:id/draw` |
| **Type** | WRITE |
| **Purpose** | Execute draw, mark items as used, record winners |
| **DB Tables** | `EVENT_m_pool_item` (update), `EVENT_t_winner` (insert) |
| **Frontend Consumer** | `WinnerGeneratorPage.jsx` (drawWinners) |

**Request Body:**
```json
{
  "count": 5,
  "strategy": "RANDOM"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "winner_items": [
      {
        "item_id": 10,
        "pool_id": 3,
        "value": "LUCKY-010",
        "is_used": 1,
        "used_at": "2026-02-02T10:30:00Z"
      }
    ],
    "metadata": {
      "pool_id": 3,
      "pool_name": "First 100 Lucky Draw",
      "drawn_at": "2026-02-02T10:30:00Z",
      "strategy": "RANDOM",
      "requested_count": 5,
      "actual_count": 5,
      "remaining_count": 50
    }
  }
}
```

**Side Effects:**
1. `EVENT_m_pool_item.is_used = 1` for selected items
2. `EVENT_m_pool_item.used_at = NOW()`
3. Insert record into `EVENT_t_winner` (see schema below)

---

### D3. Get Winner History
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/campaigns/:slug/winners` |
| **Type** | READ |
| **Purpose** | List all winners for a campaign |
| **DB Tables** | `EVENT_t_winner`, `EVENT_m_pool_item` |
| **Frontend Consumer** | `ReportsPage.jsx` (winner export) |

**Response:**
```json
{
  "success": true,
  "data": {
    "winners": [
      {
        "winner_id": 1,
        "campaign_id": 1,
        "pool_id": 3,
        "item_id": 10,
        "value": "LUCKY-010",
        "submission_id": 45,
        "participant_name": "王小明",
        "participant_contact": "0912-345-678",
        "drawn_at": "2026-02-02T10:30:00Z",
        "drawn_by": 1,
        "claimed": false,
        "claimed_at": null
      }
    ],
    "total": 50
  }
}
```

---

## E. REPORTS

### E1. Campaign Summary Report
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/campaigns/:slug/reports/summary` |
| **Type** | READ |
| **Purpose** | Aggregated metrics for dashboard and reports |
| **DB Tables** | All EVENT tables (aggregated) |
| **Frontend Consumer** | `ReportsPage.jsx` |

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign_slug": "tw-2024",
    "submissions": {
      "total": 500,
      "pending": 50,
      "approved": 420,
      "rejected": 30
    },
    "pools": {
      "total_pools": 4,
      "total_items": 1000,
      "used_items": 350,
      "available_items": 650
    },
    "winners": {
      "total_drawn": 100,
      "claimed": 45,
      "unclaimed": 55
    },
    "daily_submissions": [
      { "date": "2026-01-28", "count": 45 },
      { "date": "2026-01-29", "count": 62 },
      { "date": "2026-01-30", "count": 38 }
    ]
  }
}
```

---

### E2. Export Winners
| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/event-engine/campaigns/:slug/reports/winners/export` |
| **Type** | READ |
| **Purpose** | Export winner list as CSV |
| **DB Tables** | `EVENT_t_winner`, `EVENT_m_pool_item`, `EVENT_t_submission` |
| **Frontend Consumer** | `ReportsPage.jsx` (Export button) |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `format` | string | No | `csv` (default) or `json` |

**Response (format=csv):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="winners-tw-2024.csv"

winner_id,participant_name,participant_contact,prize_code,drawn_at,claimed
1,王小明,0912-345-678,LUCKY-010,2026-02-02T10:30:00Z,false
```

---

## F. CORE ENGINE INTEGRATION

### Pseudo-Service Registration

For campaigns to use the Core Ticketing Engine for approvals:

```javascript
// Service Registration (in m_service)
{
  service_id: 100,
  service_name: "EVENT_CAMPAIGN",
  service_code: "EVT",
  description: "Event Campaign Lifecycle Management"
}
```

### Ticket Creation Flow
When a new campaign is created:
1. Create record in `EVENT_t_campaign` with `status='draft'`
2. Call Core Engine: `POST /api/ticket/create`
3. Store returned `ticket_id` in `EVENT_t_campaign.ticket_id`
4. Campaign status follows ticket workflow

### Ticket Mapping
| Campaign Status | Ticket Status |
|-----------------|---------------|
| `draft` | `PENDING` |
| `active` | `APPROVED` |
| `paused` | `ON_HOLD` |
| `ended` | `COMPLETED` |

---

## G. ADDITIONAL TABLES (Proposed)

### EVENT_t_winner
```sql
CREATE TABLE EVENT_t_winner (
    winner_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    pool_id INT NOT NULL,
    item_id BIGINT NOT NULL,
    submission_id INT NULL COMMENT 'Link to winning submission if applicable',
    
    drawn_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    drawn_by INT COMMENT 'FK to user.user_id',
    draw_strategy VARCHAR(20),
    
    claimed TINYINT DEFAULT 0,
    claimed_at DATETIME NULL,
    claim_notes TEXT NULL,
    
    FOREIGN KEY (campaign_id) REFERENCES EVENT_t_campaign(campaign_id),
    FOREIGN KEY (pool_id) REFERENCES EVENT_m_pool(pool_id),
    FOREIGN KEY (item_id) REFERENCES EVENT_m_pool_item(item_id),
    INDEX idx_campaign_pool (campaign_id, pool_id)
);
```

---

## H. IMPLEMENTATION CHECKLIST

| Endpoint | Priority | Status |
|----------|----------|--------|
| GET /campaigns | P1 | ⬜ |
| GET /campaigns/:slug | P1 | ⬜ |
| GET /campaigns/:slug/submissions | P1 | ⬜ |
| GET /campaigns/:slug/submissions/stats | P1 | ⬜ |
| PATCH /submissions/:id | P1 | ⬜ |
| GET /campaigns/:slug/pools | P1 | ⬜ |
| GET /pools/:id/items | P2 | ⬜ |
| GET /pools/:id/stats | P2 | ⬜ |
| GET /pools/:id/draw/preview | P2 | ⬜ |
| POST /pools/:id/draw | P2 | ⬜ |
| GET /campaigns/:slug/winners | P2 | ⬜ |
| GET /campaigns/:slug/reports/summary | P3 | ⬜ |
| GET /campaigns/:slug/reports/winners/export | P3 | ⬜ |

---

## I. FRONTEND SERVICE MAPPING

| Frontend Function | API Endpoint |
|-------------------|--------------|
| `getSubmissionsByEvent(slug)` | `GET /campaigns/:slug/submissions` |
| `getSubmissionStats(slug)` | `GET /campaigns/:slug/submissions/stats` |
| `getPoolsByEvent(slug)` | `GET /campaigns/:slug/pools` |
| `getPoolDrawStats(poolId)` | `GET /pools/:id/stats` |
| `getAvailablePoolItems(poolId)` | `GET /pools/:id/items?is_used=0` |
| `previewDraw(poolId, count, strategy)` | `GET /pools/:id/draw/preview` |
| `drawWinners(poolId, count, strategy)` | `POST /pools/:id/draw` |
