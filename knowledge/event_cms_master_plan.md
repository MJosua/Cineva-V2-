# Event CMS Master Development Plan

**Role:** Senior Technical Lead & Product Manager  
**Date:** 2026-02-02  
**Status:** Living Document  
**Context:** Standalone Event CMS (Frontend-first, Mock-backed)

---

## 1. System Overview

**Product Vision:**  
A lightweight, flexible content management system designed specifically for temporary promotional campaigns (lotteries, coupon redemptions, event pages). It decouples marketing agility from core engineering cycles by allowing non-technical users to build and manage event pages.

**Target Audience:**
| User Persona | Role | Primary Goal |
|--------------|------|--------------|
| **Super Admin** | Engineering/IT | Manage system access, create new event tenants, monitor global health. |
| **Operator** | Marketing/Sales | Build event pages using blocks, configure rules, approve submissions, select winners. |
| **Viewer** | Stakeholders | View reports and read-only dashboards for specific events. |

**Core Goals:**
1.  **No-Code Page Building:** Drag-and-drop or block-based page creation.
2.  **Campaign Autonomy:** Each event is a silo with its own rules, duration, and data.
3.  **Data Integrity:** Secure handling of participant data (PII) and fair winner selection.

**Non-Goals:**
*   **E-Commerce:** This is not a shop. No cart, no checkout (unless simple redirect).
*   **Social Network:** No user profiles, friends, or feeds.
*   **Permanent Content:** Events are ephemeral. Long-term archiving is secondary.

---

## 2. Feature Breakdown

### A. Reports & Analytics (Currently In Progress)
**Purpose:** Provide actionable insights into campaign performance.
*   **User Flow:** Admin selects event -> Dashboard shows high-level KPIs -> Clicks "Reports" for detailed deep dive (time series, sources).
*   **UI Components:** `StatGroup` (quick numbers), `LineChart` (traffic/submissions over time), `PieChart` (status breakdown), `DataTable` (top sources).
*   **Data Structures:**
    *   `SubmissionStats`: { total, approved, rejected, pending }
    *   `DailyVolume`: Array<{ date, count }>
    *   `SourceBreakdown`: Array<{ source: string, count, percent }>
*   **Mock vs Real:**
    *   *Current:* Random `Math.random()` data generated in `ReportsPage.jsx`.
    *   *Real:* Backend aggregation endpoints (SQL `COUNT` / `GROUP BY`).

### B. Winner Generator (Priority 2)
**Purpose:** Fairly and transparently select winners from the pool of approved submissions.
*   **User Flow:**
    1.  Admin defines "Pool" (e.g., date range, specific answer match).
    2.  Admin sets "Prize Count" (e.g., 5 winners).
    3.  System randomly selects IDs.
    4.  System displays animation (suspense).
    5.  Results saved as "Winners" list.
*   **UI Components:** `FilterForm` (criteria), `SpinningWheel` or `SlotMachine` animation, `WinnerTable` (exportable).
*   **Edge Cases:**
    *   Re-drawing (if a winner is disqualified).
    *   Drawing more winners than available participants.
    *   Concurrent draws (locking the pool).

### C. Settings (Priority 3)
**Purpose:** Configure event-wide rules and metadata.
*   **User Flow:** Admin updates generic settings (Title, Slug, SEO) and specific rules (Start/End Date, Submission Limits).
*   **UI Components:** `Tabs` (General, SEO, Limits), `DatePicker`, `Toggle` (Maintenance Mode).
*   **Data Structures:**
    *   `EventConfig`: { slug: string, rules: { one_per_person: boolean, start_date: ISOString }, theme: { ... } }

### D. Admin Management (Priority 4)
**Purpose:** RBAC (Role-Based Access Control) for the platform.
*   **User Flow:** Super Admin invites email -> user clicks link -> sets password -> assigned to specific events or global role.
*   **UI Components:** `UserTable`, `RoleModal` (Checkboxes for permissions).
*   **Edge Cases:** Super Admin locking themselves out.

---

## 3. Frontend Architecture

**Recommendation:** Keep it modular but simple. Smart containers fetch data; dumb components render values.

### Folder Structure
```
src/
├── components/
│   ├── Common/          # Buttons, Cards, Inputs (Dumb)
│   ├── Engine/          # Page Builder Blocks (Header, Hero, Form)
│   ├── Visualizations/  # Charts, Graphs (Recharts or custom)
│   └── Admin/           # Admin-specific widgets (WinnerSelector, FilterBar)
├── layouts/
│   ├── PublicLayout.jsx # For the actual event page
│   └── AdminLayout.jsx  # Sidebar + Header for CMS
├── pages/
│   ├── Public/          # EnginePage (The renderer)
│   └── Admin/           # Dashboard, Reports, Settings
├── hooks/
│   ├── useEventData.js  # Facade for fetching event config
│   └── useSubmissions.js # Facade for submission CRUD
├── services/
│   ├── api.js           # Real Axios implementation
│   └── mockApi.js       # Mock implementation (Switchable via ENV)
└── utils/
    └── blockRegistry.js # Maps block strings to components
```

### State Management
*   **Global Auth:** `AuthContext` (User object, token, role).
*   **Event Context:** `EventProvider` (wraps admin pages). Stores the *current* event being edited so we don't refetch on every tab switch.
*   **Server State:** Use `React Query` (TanStack Query) or keep simple `useEffect` + `useState` if scale is small. *Recommendation: React Query for easier caching/refetching logic.*

---

## 4. Backend Integration Plan (Future-Ready)

**Strategy:** Build a clear "Service Layer" in frontend (`services/api.js`). This layer currently calls `mockApi.js`, but will eventually call `axios.get()`.

### API Specification (Draft)

| Context | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| **Auth** | POST | `/auth/login` | Returns JWT + User Profile |
| **Event** | GET | `/events/:slug` | Public event config (JSON) |
| **Event** | POST | `/events/:slug/submit` | Public form submission |
| **Admin** | GET | `/admin/events` | List all events for user |
| **Admin** | GET | `/admin/events/:slug/stats` | Aggregated report data |
| **Admin** | POST | `/admin/events/:slug/draw` | Server-side winner generation |

**Mock to Real Migration:**
1.  Define interface `IEventService` (getEvent, saveEvent, etc.).
2.  Implement `MockEventService` (reads from `mockEvents.js`).
3.  Later, implement `RemoteEventService` (calls API).
4.  Use environment variable `VITE_USE_MOCK=true` to switch.

---

## 5. Data Model

### Event (Collection/Table)
```json
{
  "_id": "uuid",
  "slug": "taiwan-2024",
  "name": "Taiwan 2024 Campaign",
  "status": "active", // draft, active, ended
  "config": {
    "start_date": "2024-01-01",
    "end_date": "2024-02-01"
  },
  "blocks": [ ...JSON_BLOCK_ARRAY... ],
  "theme": { ... }
}
```

### Submission (Collection/Table)
```json
{
  "_id": "uuid",
  "event_slug": "taiwan-2024",
  "user_data": {
    "name": "John Doe",
    "phone": "+886...",
    "receipt": "AB-12345678"
  },
  "status": "approved", // pending, approved, rejected
  "submitted_at": "2024-01-15T10:00:00Z",
  "ip_address": "1.2.3.4",
  "images": ["url1.jpg"]
}
```

### Winner (Collection/Table)
```json
{
  "_id": "uuid",
  "event_slug": "taiwan-2024",
  "batch_id": "draw-001", // To group winners from same draw
  "submission_id": "uuid-of-submission",
  "prize_tier": "Grand Prize",
  "drawn_at": "2024-02-02T12:00:00Z",
  "drawn_by": "admin-id"
}
```

---

## 6. Milestone Roadmap

### Phase 1: Stabilize Frontend (Current)
*   **Goal:** Fully clickable prototype with persistent mock data (in-memory or local storage).
*   **Tasks:**
    1.  Finish `ReportsPage` (replace random math with structured mock data logic).
    2.  Implement `WinnerGeneratorPage` (mock draw logic).
    3.  Implement `SettingsPage` (form UI).

### Phase 2: Backend Integration (Complete)
*   **Goal:** Connect to real database and file storage.
*   **Tasks:**
    1.  [x] Setup Node.js/Express or existing backend routes.
    2.  [x] Create DB Schemas (`t_events`, `t_event_submissions`).
    3.  [x] Implement Image Upload API (S3/Disk).
    4.  [x] Replace `MockService` with `ApiService`.

### Phase 3: Automation & Export (In Progress)
*   **Goal:** Reduce manual admin work.
*   **Tasks:**
    1.  Excel Export for Submissions/Winners.
    2.  Automated email notifications (Winner alert).

### Phase 4: Production Hardening
*   **Goal:** Security and Scale.
*   **Tasks:**
    1.  Rate Limiting (prevent spam submissions).
    2.  Input Sanitization.
    3.  Audit Logs (who approved what?).

---

## 7. Technical Debt & Risks

| Risk Area | Severity | Mitigation Strategy |
|-----------|----------|---------------------|
| **Mock Logic Drift** | High | Mock logic often gets complex. **Stop making mocks smart.** Keep mocks returning static successful responses. Don't re-implement SQL in JS. |
| **Block Schema Versioning** | Medium | If we change `hero` block structure, old events might break. **Strategy:** Use version number in blocks or strict validation. |
| **Image Hosting** | Medium | Users will upload big images. **Strategy:** Need strictly validation on size/type early on frontend. |
| **Security** | Critical | Public form = Spam magnet. **Strategy:** Plan for reCAPTCHA integration early. |

---

## 8. Clear NEXT ACTIONS

**Immediate Focus:** Finish the **Reports Page** logic to look "real" without random math, then move to **Winner Generator**.

1.  **Refactor ReportsPage:**
    *   *Action:* Modify `ReportsPage.jsx`.
    *   *Detail:* Stop using `Math.random()`. Instead, write a helper in `mockSubmissions.js` that generates a static, consistent list of 20-30 fake submissions with real dates. Aggregate *that* data. This proves the logic is ready for the backend.
2.  **Build Winner Generator:**
    *   *Action:* Create `WinnerGeneratorPage.jsx`.
    *   *Detail:* Simple UI: Button "Draw Winner", Input "How many?". Result: List of names from `mockSubmissions`.
3.  **Define Service Layer:**
    *   *Action:* Create `services/submissionService.js`.
    *   *Detail:* Move `getSubmissionsByEvent` there. This prepares for the backend switch.

**First File to Touch:** `fontend/Event/src/data/mockSubmissions.js` (Make the data structure robust).
