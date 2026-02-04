# Event Engine: Hostile Threat Model & Risk Assessment

## Executive Summary
This document assumes the role of a **Hostile Reviewer**. It ignores "Good Intentions" and focuses on **Human Error, Laziness, and Misconfiguration**.
Despite the "Fail-Closed" architecture, the following vectors remain viable for exploitation due to developer error.

---

## 1. The "Shadow Router" Attack (Mounting Bypass)
**Scenario**: A developer creates a new feature (e.g., "Event Analytics V2") and decides it's "cleaner" to mount it separately in `index.js`, bypassing the main Event Engine gatekeeper.
*   **The Code**: `App.use('/api/event-analytics', analyticsRouter);` (Forgot `requireUser` wrapper).
*   **The Failure**: The entire V2 API is now publicly accessible. The "Fail-Closed" logic only protects `/api/event-engine`, not new roots.
*   **Guardrail**:
    *   **Architecture**: **Single Root Mount Policy**. Ban multiple mount points for the same domain.
    *   **Process**: CI/CD Scanner that lists ALL registered Express routes and flags any route starting with `/api/` that does NOT have an `auth` middleware layer in its stack.

## 2. The "DTO Amnesia" (Data Leakage)
**Scenario**: A public endpoint `GET /public/campaigns/:slug` works fine. A junior dev adds a new feature to the *Shared Service* `getCampaignBySlug` to include `budget_limit` for an Admin report.
*   **The Failure**: Since the Public Controller calls the *Same Service Method* and (carelessly) returns `res.json(serviceResult)`, the Public API now leaks the `budget_limit`.
*   **Guardrail**:
    *   **Architecture**: **Strict Layer Separation**. Public Controllers MUST NOT import the "Admin Service". They should use a "Public Service" or "Reader Service" that *physically cannot select* sensitive columns (e.g., using a specific DB View or strictly typed query).
    *   **Linter**: Ban `res.json(rawObject)` in public controllers. Force usage of `res.json(toPublicDTO(rawObject))`.

## 3. The "Blind IDOR" (Insecure Direct Object Reference)
**Scenario**: Public endpoint `GET /public/submissions/:id/status` allows a user to check their status using a tempoary token.
*   **The Failure**: The system validates the token is valid, but *forgets* to check if `token.submission_id == params.id`. An attacker iterates `:id` and assumes the identity of other users.
*   **Guardrail**:
    *   **Architecture**: **Token-Bound Access**. Public APIs should NEVER accept IDs in the URL for self-resources.
    *   **Correction**: Use `GET /public/me/submission`. The ID is derived *only* from the token, making IDOR impossible.

## 4. The "Shared Utility" Trojan
**Scenario**: The system uses a global `FileExportService` to generate CSVs. This utility has its own auth check (e.g., "Must be Admin"). The Event Engine Admin Controller calls this service.
*   **The Failure**: A dev mistakenly thinks "The Service checks Auth" and removes the router-level auth for the "Export" route to "debug" something. The Service's check is weaker (e.g., just checks for existence of user, not specific permission) or is buggy.
*   **Guardrail**:
    *   **Architecture**: **Never Trust Downstream Auth**. Authenticate at the Edge (Router). Downstream services should assume they are in a trusted context (or re-verify), but the Edge MUST verify.
    *   **Process**: "Defense in Depth" - The Service should THROW if no user context is passed, crashing the request safely (500 Error) rather than proceeding unsafely.

## 5. The "Regex DoS" (ReDoS) on Public Forms
**Scenario**: The `POST /submit` endpoint accepts a `receipt_code` string. The Code Validator uses a complex Regex to ensure format.
*   **The Failure**: An attacker sends a 1MB string of "AAAAAAAAAAAAAAAA..." constructed to trigger catastrophic backtracking in the Regex engine, freezing the Node.js event loop.
*   **Guardrail**:
    *   **Architecture**: **Input Sanitation Layer**. All public inputs must be truncated (e.g., `str.slice(0, 100)`) *BEFORE* any Regex or Logic touches them.
    *   **Process**: Use `joi` or `zod` with strict `.max()` length limits on ALL strings.

---

## 6. Summary of Hardened Rules

| Risk | Hardened Guardrail |
| :--- | :--- |
| **Bypassed Mount** | CI scanner for Unprotected Routes. Single Root Policy. |
| **Service Leak** | Separate "Public Reader" Service (SQL View). |
| **IDOR** | `GET /me` pattern (No IDs in URLs). |
| **ReDoS** | Hard length limits on ALL public inputs (max 255 chars). |

This threat model confirms that "Architecture" alone is insufficient. It must be paired with **Automated Verification (CI/CD)** to survive human error.
