# E-Order Frontend Refactor Execution Plan (Phased, Regression-Safe)

## Scope
- In scope: `fontend/E-Order` React frontend only.
- Out of scope: all other folders in the monorepo/worktree.

## Constraints (Non-Negotiable)
- Preserve all production URLs and access gating (public/user/admin/blog admin/event).
- Event routes are reachable in production but may be dormant (time-boxed + tenant-gated).
- `CheckToken` is the authoritative auth/session gate.
- `KeepLogin` is legacy and treated as deprecated unless proven otherwise.
- Mixed API usage exists (direct Axios + helpers). Transition toward a centralized API boundary is allowed, but legacy must remain functional during transition.
- No "big bang" restructure. Every phase must be deployable and reversible.

## Refactor Principles
- Non-breaking: no behavior change unless explicitly planned and validated.
- Incremental: move one slice at a time.
- Reversible: keep compatibility paths until proven unused.
- Deployable: each phase ends in a shippable state.

## Phase P0 — Baseline & Guardrails (Low Risk)
### Goal
Create a shared truth map of routes, ownership, and boundaries to prevent accidental breakage during cleanup.

### Allowed Actions
- Produce a route catalog from `src/App.js` grouped by persona and feature.
- Document tenant/event activation model for `/event/*`.
- Document auth/session authority and storage keys used by `CheckToken`.
- Identify candidate dead code (inventory only; no removals yet).

### Forbidden Actions
- No deletions, moves, or import rewrites.

### Stop / Rollback Conditions
- Uncertainty about whether a route/module is dormant (event/tenant) vs dead.

### Validation Checklist
- Route catalog reviewed by stakeholder/owner.
- Persona matrix validated:
  - public
  - user
  - admin (type_id=9)
  - blog admin (type_id=8)

## Phase P1 — Safe Cleanup (Low Risk)
### Goal
Remove only confirmed non-runtime artifacts and confirmed dead modules.

### Allowed Actions
- Remove OS/editor artifacts and confirmed unused non-code files.
- Remove confirmed unused legacy copies after evidence:
  - no references in repo
  - no active route points to it
  - owner confirms not used by tenant/event reactivation

### Forbidden Actions
- No auth/session changes.
- No routing changes.
- No behavioral changes.

### Stop / Rollback Conditions
- Any candidate is "probably unused" but not proven.

### Validation Checklist
- `npm run build` succeeds.
- Manual smoke checks for:
  - login/session refresh
  - admin + blog admin access
  - IndofoodPO
  - container tracking
  - CSV order
  - event pages still reachable by direct URL

## Phase P2 — Boundary Introduction (Medium Risk)
### Goal
Introduce preferred boundaries (API + layout) without breaking legacy behavior.

### Allowed Actions
- Introduce centralized API boundary as "preferred for new work".
- Keep direct Axios calls working (do not mass-migrate).
- Normalize layout usage by converging on `CheckToken` as authenticated shell.

### Forbidden Actions
- No auth rewrite.
- No mass API migration.

### Stop / Rollback Conditions
- Token refresh loops, unexpected logouts, or modal re-auth regressions.

### Validation Checklist
- Token expiry and 401 handling work across personas.
- No duplicated global interceptors.

## Phase P3 — Feature-Slice Folder Restructure (Medium Risk)
### Goal
Move toward a scalable structure one feature at a time.

### Strategy
- Add new folders in parallel (additive).
- Keep legacy import paths functional until retirement.
- Migrate in this order (recommended):
  1. blog (shared, bounded)
  2. events (dormant capable; isolate)
  3. CSV order (internal)
  4. IndofoodPO
  5. container tracking (business-critical; migrate last)

### Stop / Rollback Conditions
- Any loss of reachability for event routes or tenant-specific flows.

## Phase P4 — Deprecation & Retirement (Medium–High Risk)
### Goal
Remove deprecated legacy paths after proving zero usage across tenants/events.

### Required Evidence Before Removal
- Zero imports/references in repo.
- Stakeholder sign-off for dormant event routes.
- At least one stable release cycle post-migration.

