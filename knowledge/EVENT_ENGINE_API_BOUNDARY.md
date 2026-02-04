# Event Engine: Public vs Private API Boundary Design

## Executive Summary
This document defines the architectural boundary between the **Public Facing API** (Participant access) and the **Private Core API** (Admin/System access).
To ensure security while maintaining accessibility, these two worlds must be **physically and logically separated**.

---

## 1. Classification Criteria

### A. PUBLIC API (The "Storefront")
Endpoints intended for anonymous or transient users (participants).
*   **Access**: Unauthenticated OR Transient Token (e.g., temporal OTP).
*   **Scope**: strictly scoped to "One Campaign" context.
*   **Allowed Operations**:
    *   `GET` Campaign Details (Theme, Blocks) - *Only if status='active'*
    *   `POST` Submission / Entry - *With Rate Limit*
    *   `GET` Public Winner List - *If enabled by config*
    *   `GET` Own Submission Status - *Via temporal token*

### B. PRIVATE API (The "Control Room")
Endpoints intended for System Administrators, Operations, and Business Logic.
*   **Access**: Strict Authentication (HOTS/IOD Token).
*   **Scope**: Global or Permission-based.
*   **Allowed Operations**:
    *   CRUD Campaigns
    *   Manage Pools / Codes
    *   Approve/Reject Submissions
    *   Draw Winners
    *   View Analytics / Reports

### C. NEVER PUBLIC (The "Toxic Zone")
Data that must **NEVER** be reachable via a public route, even read-only:
*   **Pool Items (Unused)**: Raw voucher codes or serial numbers.
*   **Participant PII**: List of all emails/phones (GDPR/Privacy risk).
*   **Internal Config**: Budget limits, algorithm seeds, or draft campaign details.

---

## 2. Router Separation Strategy (The Firewall)

We will use **Physical Separation** of routers to prevent accidental "bleed-over".

### Current (Risky) Structure
`routers/eventEngine.js` mixes both:
```javascript
route.get('/campaigns', ...);       // Admin
route.post('/submit', ...);         // Public
route.delete('/pools/:id', ...);    // Admin
```

### Proposed (Secure) Structure
Split into two distinct files mounted at different root paths.

**1. `routers/eventEngine/private.js`**
*   **Mount Path**: `/api/event-engine/admin`
*   **Middleware**: `[AuthMiddleware.requireUser]` (The Iron Gate)
*   **Content**: All CRUD, Reports, Review actions.

**2. `routers/eventEngine/public.js`**
*   **Mount Path**: `/api/event-engine/public`
*   **Middleware**: `[PublicGuard.limiter, PublicGuard.validator]` (No Auth, but protected)
*   **Content**: `submitEntry`, `getPublicCampaign`.

**Index.js Mounting Rule**:
```javascript
// Strict Admin Gate
App.use("/api/event-engine/admin", Auth.requireUser, adminRouter);

// Public Firewall
App.use("/api/event-engine/public", PublicGuard.defaults, publicRouter);
```

---

## 3. Public Endpoint Protection (The Moat)

Since Public APIs cannot rely on "Who you are", they must rely on "How you behave".

1.  **Strict Rate Limiting (429 Too Many Requests)**
    *   By IP Address + User Agent fingerprint.
    *   Policy: `10 requests / minute` for Submissions. `100 / minute` for Reads.

2.  **Campaign State Validation**
    *   Middleware: `requireActiveCampaign(slug)`
    *   Logic: If Campaign is `DRAFT`, `PAUSED`, or `ENDED`, return `404 Not Found` immediately. Do not leak that it exists but is hidden.

3.  **Anti-Abuse / Spam**
    *   **CAPTCHA Integration**: Optional config per campaign.
    *   **Idempotency Key**: Prevent double-submission on network lag.

---

## 4. Internal Service Isolation Risks

**The Risk**: A public controller accidentally calling a "Privileged Service Method" without filters.
*   *Example*: A public `getStats` controller calls `EventService.getStats()` which returns *cost* and *budget* info, and the controller dumps the whole JSON to the user.

**The Solution**: **DTO (Data Transfer Object) Pattern**
*   Public Controllers must NEVER return raw Database Objects.
*   They must map to a strict DTO:
    ```javascript
    function toPublicCampaignDTO(dbRecord) {
        return {
            name: dbRecord.name,
            theme: dbRecord.theme_config,
            // EXPLICITLY OMIT: settings_config, created_by, budget
        };
    }
    ```

## 5. Summary of Rules

| Feature | Public API | Private API |
| :--- | :--- | :--- |
| **Mount Point** | `/api/event-engine/public/*` | `/api/event-engine/admin/*` |
| **Auth** | None / Temporal | Bearer Token (Strict) |
| **Visibility** | Active Campaigns Only | All (Draft/Archived) |
| **Data Output** | Sanatized DTOs | Full Models |
| **Rate Limit** | Aggressive (Defense) | Lenient (Operational) |

This boundary ensures that even if a developer makes a coding error in a public controller, the *Architecture* prevents access to sensitive administrative functions.
