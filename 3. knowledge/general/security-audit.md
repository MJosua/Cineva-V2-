# Security Audit Report
> **Date**: 2024-12-14
> **Target**: HOTS API & Frontend Authorization
> **Status**: 🟠 Moderate Risk (Auth Handling)

---

## 1. Authentication Storage (The "Tokek" Issue)
**Risk Level**: 🟠 Medium
**Observation**: the Frontend stores the JWT token in `localStorage` (key: `tokek`).
**Vulnerability**: **XSS (Cross-Site Scripting)**. If an attacker injects a malicious script (e.g., via a compromised Widget), they can read `localStorage` and steal the token.
**Recommendation**:
-   Switch to **HTTPOnly Cookies**.
-   The backend code (`hotsAuth.js`) actually *has* commented-out code for this (Lines 155-159). It should be enabled.

## 2. Authorization Logic
**Risk Level**: 🟡 Low/Medium
**Observation**: Role checks are performed *inside* each controller function.
-   Example: `if (req.dataToken.user_type)` in `hotsTicket.js`.
**Vulnerability**: **human Error**. A developer might forget to add this `if` block in a new function, creating an accidental public endpoint.
**Recommendation**:
-   Implement **RBAC Middleware**.
-   Usage: `router.post('/create', verifyToken, requireRole('admin'), createTicket)`.

## 3. SQL Injection
**Risk Level**: 🟢 Safe
**Observation**: The code strictly uses Parameterized Queries (`db.execute(sql, [params])`).
-   `hotsAuth.js`: `dbHots.execute(queryMatchUidPswd, paramMatchUidPswd)`
**Verdict**: Your database interactions are secure against standard SQL injection attacks.

## 4. CORS Policy
**Risk Level**: 🟡 Low
**Observation**: The API allows dynamic origins `callback(null, true)`.
**Implication**: Any website can theoretically make requests to your API if they can guess the correct headers.
**Recommendation**: Restrict `origin` to a specific list of domains (e.g., `indofoodinternational.com`) in Production.

---

## Summary of Action Items
1.  [ ] **Enable HTTPOnly Cookies**: Uncomment the logic in `hotsAuth.js`.
2.  [ ] **Centralize Role Checks**: Create `middleware/checkRole.js`.
3.  [ ] **Review CORS**: Lock down allowed origins in `index.js` for production environment.
