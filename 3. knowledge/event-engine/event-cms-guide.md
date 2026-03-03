# Event CMS - Standalone Module Guide

> **Standalone Frontend Project** - Separate from HOTS and E-Order  
> **Path:** `fontend/Event/`

---

## Overview

A visual event page builder and admin system for promotional campaigns (e.g., coupon submission events, lottery campaigns). It enables marketing teams to create high-conversion landing pages without waiting for engineering cycles.

## Core Philosophy

1.  **Marketing Agility:** Decouple campaign management from core platform deployments.
2.  **No-Code Empowerment:** Operators use a block-based "Page Builder" to assemble UI.
3.  **Data Isolation:** Each event is a secure silo with dedicated rules and participant data.
4.  **Backend-Ready Mocks:** Rapid frontend development using a robust service layer that maps to future (or existing) API contracts.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| UI | Chakra UI v2 + Vanilla CSS |
| Routing | React Router v6 |
| State | React Context (AuthContext) |
| Backend | [In Progress] Integrated API (Node.js) |
| Patterns | Modular Engine, Service-Layer Facade |

---

## Architecture

```
fontend/Event/
├── src/
│   ├── components/Engine/     # Block rendering engine
│   │   ├── EngineRenderer.jsx
│   │   ├── Registry.jsx       # Block type registry
│   │   └── Blocks/            # Individual block components
│   ├── context/
│   │   └── AuthContext.jsx    # Login + event permissions
│   ├── data/
│   │   ├── mockEvents.js      # Event configurations
│   │   ├── mockSubmissions.js # Form submission data
│   │   └── mockCoupons.js     # Coupon definitions
│   ├── layouts/
│   │   ├── EngineLayout.jsx   # Public page layout
│   │   └── EventAdminLayout.jsx # Admin sidebar layout
│   ├── pages/
│   │   ├── Public/EnginePage.jsx
│   │   └── Admin/
│   │       ├── Login.jsx
│   │       ├── EventSelector.jsx
│   │       ├── EventDashboard.jsx
│   │       ├── EventEditor.jsx     # Visual page builder
│   │       ├── SubmissionsPage.jsx # Form data management
│   │       └── CouponsPage.jsx     # Coupon CRUD
│   └── Router.jsx
```

---

## Block System

### Available Block Types

| Block | Usage |
|-------|-------|
| `header` | Logo + menu links |
| `hero` | Title, subtitle, background image |
| `card` | Container with title + nested blocks |
| `section` | Full-height container |
| `flip` | Image carousel with flip animation |
| `text` | WYSIWYG rich text |
| `list` | Bullet point list |
| `couponForm` | Dynamic form with image upload |
| `customHtml` | Raw HTML embedding |

### Block Props Support
- **Colors:** RGBA with opacity slider
- **Custom CSS:** JSON object for advanced styling
- **Nested Blocks:** Cards and Sections can contain child blocks

---

## Admin System

### Flow
```
/admin/login → /admin/events → /admin/event/{slug}/dashboard
```

### Sidebar Navigation
| Path | Feature | Description |
|------|---------|-------------|
| `/dashboard` | Dashboard | Stats and recent submissions |
| `/editor` | Page Builder | Visual block editor |
| `/coupons` | Coupons | CRUD with rule engine |
| `/submissions` | Submissions | Approve/reject workflow |
| `/winners` | Winners | Random draw generator |
| `/reports` | Reports | Charts and analytics |
| `/settings` | Settings | Event config and theme |
| `/admins` | Admins | User management (superadmin only) |

### Permissions
| Role | Access |
|------|--------|
| `superadmin` | All events, all features, admin management |
| `admin` | Only permitted events, no admin management |
| `viewer` | Read-only access to permitted events |

### Demo Accounts
| Email | Password | Access |
|-------|----------|--------|
| `super@example.com` | `admin123` | All |
| `taiwan@example.com` | `taiwan123` | TW events |
| `maldives@example.com` | `maldives123` | Maldives |

---

## Coupon Rule Engine

### Rule Types (Conditions)
```javascript
{ type: "date_range", config: { start: "2025-01-01", end: "2025-01-31" } }
{ type: "min_spend", config: { amount: 500, currency: "TWD" } }
{ type: "first_n_users", config: { limit: 100 } }
```

### Effect Types (Rewards)
```javascript
{ type: "points", config: { points: 50 } }
{ type: "points_multiplier", config: { multiplier: 2 } }
{ type: "discount_percent", config: { percent: 10, max_discount: 100 } }
```

---

## Form Submissions

### Features
- Guest-based (no user registration)
- Image upload field type
- EAV data structure for dynamic fields
- Admin approval workflow

### Status Flow
```
pending → approved
        ↘ rejected
```

---

## Running the Project

```bash
cd fontend/Event
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Future Integration Points

### Backend API Needed
| Endpoint | Purpose |
|----------|---------|
| `POST /api/admin/login` | JWT authentication |
| `GET /api/admin/events` | List permitted events |
| `GET/PATCH /api/admin/submissions` | Submission management |
| `POST /api/public/submit` | Guest form submission |
| `POST /api/public/upload-image` | Image upload |

### Database Tables
See: `event_coupon_system_design.md` in artifacts directory

---

## Related Files

| Type | Path |
|------|------|
| System Design | `~/.gemini/.../event_coupon_system_design.md` |
| Block Components | `fontend/Event/src/components/Engine/Blocks/` |
| Admin Pages | `fontend/Event/src/pages/Admin/` |
