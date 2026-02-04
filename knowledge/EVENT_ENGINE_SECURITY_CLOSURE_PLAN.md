# Security Closure Plan: Event Engine

## Executive Summary
This document defines the architectural strategy to strictly secure the Event Engine API (`/api/event-engine/*`).
Currently, the API is **Fail-Open** (defaulting to accessible). The goal is to shift to **Fail-Closed** (defaulting to denied) and ensure `req.user` availability.

---

## 1. The "Fail-Closed" Architecture

### A. Root-Level Protection (The Iron Gate)
Instead of applying middleware to individual routes (which developers might forget), we force authentication at the **Router Mounting Level**.

**Process Change:**
In `index.js` (or `routers/index.js`), the Event Engine router must **NEVER** be mounted directly. It must always be wrapped:

```javascript
// ❌ BAD: Implicitly relies on route-level auth
App.use("/api/event-engine", eventEngineRouter);

// ✅ GOOD: The Platform Gatekeeper
App.use("/api/event-engine", 
    AuthMiddleware.normalizeUser, // 1. Extract Token & Normalize Logic (HOTS/IOD)
    AuthMiddleware.requireUser,   // 2. HARD STOP if no user (401 Unauthorized)
    eventEngineRouter             // 3. Only then proceed to routing
);
```

**Why this works:**
*   It protects *future* endpoints automatically. If a dev adds `GET /api/event-engine/secret-data` and forgets auth, it is **already protected** by the parent mount.

### B. The "Require User" Guard
The `requireUser` middleware is a dumb, strict gate:
*   Input: `req.user`
*   Logic: `if (!req.user) throw new AuthenticationError();`
*   Output: 401 response and **halt**.

This ensures that no request ever reaches the Controller layer without a populated identity.

---

## 2. Preventing `undefined` req.user (Controller Safety)

Even with middleware, we need defense-in-depth to catch misconfigurations during development.

### A. Controller Assertion Pattern
All controllers must assume the environment is hostile. We introduce a helper `assertIdentity(req)` to be used at the start of critical actions.

*   **Logic**: If `req.user` is missing, this throws a **500 Internal Server Error** (Configuration Error), NOT a 401.
*   **Reasoning**: A missing user in a controller means the *Architecture Failed* (Middleware didn't run), not that the user is wrong. This alerts the dev immediately.

### B. Standardized Context Interface
Do not use raw `req.user` in business logic (`EventEngineService`).
*   **Create**: `permissions/Context.js`
*   **Usage**: Controllers instantiate context: `const ctx = new Context(req.user)`.
*   **Benefit**: The `Context` constructor throws if `req.user` is invalid, protecting the Service layer from bad data.

---

## 3. Developer Guardrails (Stopping Future Leaks)

How do we stop a junior dev from bypassing the system?

### A. Automated "Open Door" Scanner (CI/CD)
Implement a simple integration test suite that runs on every Pull Request.
1.  **Scanner**: Fetch ALL registered routes under `/api/event-engine`.
2.  **Attack**: Send a request to *every single route* with **NO HEADERS**.
3.  **Assertion**: Every response MUST be `401 Unauthorized`.
4.  **Failure**: If any route returns `200`, `404`, or `500`, the **Build Fails**.

### B. Linter/Static Analysis
Add a custom lint rule or pre-commit hook that scans `routers/eventEngine.js`.
*   **Rule**: deny `route.get(...)` calls that do not include a standard middleware if we decide to use route-level auth (though Root-Level is preferred).
*   **Deprecation**: Flag any direct usage of `App.use('/api/event-engine')` without the specific auth wrapper.

---

## 4. Implementation Checklist

1.  [ ] **Create `middleware/eventAuth.js`**: Use the "Identity Bridge" logic (HOTS+IOD normalization).
2.  [ ] **Mount Securely**: Update `index.js` to wrap the event router.
3.  [ ] **Add Scanner Test**: `test/security/route_scanner.js`.
4.  [ ] **Audit Controllers**: Verify failure modes.

## 5. Risk Assessment
*   **Risk**: Public endpoints (e.g., `submitEntry`) will break with Root-Level auth.
*   **Mitigation**: Split the router.
    *   `/api/event-engine/private` -> Protected by Root Middleware.
    *   `/api/event-engine/public` -> Open, but strictly rate-limited and validated.
