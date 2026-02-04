# Event Engine: Platform Security Policy

> **Target Audience**: All Backend Engineers & Tech Leads
> **Enforcement**: CI Pipeline & Code Review
> **Version**: 1.0

This document defines the **NON-NEGOTIABLE** engineering standards for the Event Engine (`/api/event-engine`).
Failure to adhere to these rules will result in **Automatic PR Rejection**.

---

## 1. The Golden Rules (Must Follow)

### Rule #1: Single Mount Policy (The Iron Gate)
*   **Requirement**: The Event Engine is mounted **ONCE** in `index.js`.
*   **Requirement**: It **MUST** be wrapped in the standard Auth Middleware.
*   **Why**: To prevent "Shadow Routes" (backdoors) effectively bypassing security.
*   **Code**:
    ```javascript
    // ✅ PERMITTED
    App.use("/api/event-engine", Auth.requireUser, eventRouter);
    ```

### Rule #2: Context-Driven Ownership
*   **Requirement**: Never pass User IDs manually in Service calls.
*   **Requirement**: Controllers must instantiate a `Context` object from `req.user` and pass that.
*   **Why**: Prevents Admin functions from running with `undefined` user or wrong privileges.

### Rule #3: Public "Storefront" Separation
*   **Requirement**: Public endpoints (`submit`, `campaign-view`) MUST live in `routers/eventEngine/public.js`.
*   **Requirement**: Private endpoints (`create`, `delete`, `reports`) MUST live in `routers/eventEngine/private.js`.
*   **Why**: Physical file separation prevents accidental exposure of admin routes.

### Rule #4: DTO-Only Public Responses
*   **Requirement**: Public Controllers MUST map DB results to a strict DTO (Data Transfer Object).
*   **Requirement**: `res.json(dbRecord)` is strictly forbidden in Public Controllers.
*   **Why**: Prevents accidental leakage of internal fields (Budget, Limits, CreatedBy).

---

## 2. Forbidden Patterns (Do Not Merge)

| Pattern | Verdict | Reason |
| :--- | :--- | :--- |
| `App.use('/api/v2/events', ...)` | **REJECT** | Violates Single Mount Policy. Keep everything under `/api/event-engine`. |
| `route.get('/submissions/:id')` | **REJECT** | **IDOR Risk**. Public routes must not accept IDs. Use `/me` or token-derived IDs. |
| `const userId = req.query.userId` | **REJECT** | **Spoofing Risk**. Never trust client-supplied IDs for identity. |
| `import { adminService } from ...` | **REJECT** | **Leakage Risk**. Public Controllers must not import Admin Services. |
| `WHERE 1=1` (in Public Query) | **REJECT** | **Visibility Risk**. Public queries must ALWAYS enforce `status = 'active'`. |

---

## 3. PR Review Checklist (For Reviewers)

Before approving any PR touching `eventEngine`, verify:

- [ ] **Router Check**: Does this PR add a new `App.use` in `index.js`? -> **Request Changes**.
- [ ] **Public API Check**:
    - [ ] Is it in `routers/public.js`?
    - [ ] Does it take an ID in the URL? (If yes, is it *strictly* validated against the token?)
    - [ ] Does it return a raw DB object?
- [ ] **Service Check**:
    - [ ] Does the Service method accept a `Context` object?
    - [ ] If it's a "Reader", does it select `*` or specific columns?
- [ ] **Regex Check**: Are strict length limits configured *before* the RexEx runs?

---

## 4. Automated Reject Criteria (The Bot)

The CI/CD pipeline will **FAIL THE BUILD** if:

1.  **Scanner**: Detects any route starting with `/api/event-engine` that returns a `200 OK` or `404 Not Found` when called *without headers*. (Must return `401`).
2.  **Linter**: Detects `req.query.user_id` usage in `controller/eventEngineController.js`.
3.  **Linter**: Detects `App.use(...)` calls in `index.js` involving `event`.

---

## 5. Violation Protocol

If a security incident occurs due to a violation of these rules:
1.  **Immediate Revert** of the offending commit.
2.  **Post-Mortem** required: Why did the reviewer miss it?
3.  **Policy Update**: Add a new automated check to prevent recurrence.
