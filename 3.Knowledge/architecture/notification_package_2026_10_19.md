# Notification/SSE package extraction and adoption — 19 October 2026

## Scope and user authorization

The user explicitly extended the earlier read-only rule to permit upgrading frontend packages in **D:/Kantor/1.Frontend/packages**. This task changes only `app-core` there: additive source API, export subpaths, tests, package version/script and package-local documentation. It does not authorize changing Kantor applications, backend, database, deployments, knowledge indices or unrelated files. All audit/report/index outputs remain in Cineva. General historical read-only statements should be read with this explicit exception for this task.

## Architecture

Existing HOTS already has persistent notifications, unread/read endpoints, server SSE management, named events and frontend SSE helpers. This work packages those responsibilities through adapters rather than claiming the feature did not previously exist.

Frontend HOTS `@hots/app-core` is upgraded from 0.5.1 to **0.6.0**. New APIs: `createNotificationClient`, `subscribeNotificationEvents`; source subpaths `/notifications` and `/sse`. Existing root exports and `connectSSE`/`useSSE` options are retained. The existing upstream exact-origin HTTP credential fix remains untouched. Cineva app-core becomes **0.6.0-cineva.1**, including that HTTP fix and the same notification addon. Other upstream packages were not changed. The package-local docs describe behavior and tests; no upstream knowledge writers were run because authorization is restricted to frontend packages.

Backend Cineva adds `2.Backend/packages/notification-kit` **0.1.0-cineva.1**:

- Generic JSON SSE framing, Node writable backpressure, bounded frame queue, cleanup and explicit scoped connection hub.
- Notification inbox engine with injected identity/clock/format/authorization, transaction repository and transport ports.
- No SQL/schema assumptions or environment/database/credential imports.

`core/sse-manager.js` adopts the package writer for user events, legacy broadcast and filtered admin logs. Existing singleton methods, persistence controller, event policy and message envelopes remain. The original is archived at `3.Knowledge/_archive/notification_package_2026_10_19/sse-manager.before.js`; restore that source to roll back the writer adapter. The new generic repository engine is tested through an isolated transaction fixture; it is **not** mounted as a new production service or physical DB migration.

## Cineva frontend adoption

- `src/hooks/notificationAdapter.ts`: legacy API routes, response envelope and authentication stay in the host; generic package owns inbox request operations and response guards.
- `src/components/layout/NotificationBell.tsx`: uses the package client, preserving the existing UI and vendor theme.
- `src/hooks/useSSE.tsx`: subscribes to named notification events through the package helper, forwarding a local host signal to the bell and cleaning up listeners.

Observed defect: the bell formerly read `window.__sseConnection`, but no Cineva source assigned it. It also only replaced `onmessage`; named SSE events require named listeners. The new path no longer depends on that absent global and does not replace other subscribers. Existing legacy token-in-query auth is retained, not certified or silently replaced with an incompatible cookie/ticket contract.

## Boundaries

The scoped generic hub uses an explicit tenant/user tuple, with authorization supplied by the host. Dummy tests prove the configured adapter isolates scopes; they do not prove existing HOTS/Cineva production tenant isolation. The legacy singleton still targets its existing user IDs and is not converted into SaaS multi-tenancy here.

`write() === false` means a frame was accepted into the Node buffer. Subsequent frames wait for drain without closing or duplicating that frame. Queue overflow closes a slow consumer. Accepted frames are not confirmed browser delivery. Hosts must bound payload byte size, coordinate heartbeats, authenticate stream connections, and provide process-shared pub/sub for multiple workers if required. Durable replay/outbox/retry after process failure is pending.

The repository port requires transaction/commit/rollback semantics and full scoped lookups. No real DB adapter is added; the user deferred database work. Existing legacy DB writes and auth routes are not audited as transaction-safe by this change.

## Verification

- 14 backend/legacy contract tests, plus 3 frontend tests against each of the Kantor and Cineva package sources: 20 test executions.
- Six browser E2E scenarios use the real Cineva bell, actual loopback HTTP/SSE and a synthetic in-memory transaction repository: inbox/badge, mark-read/reload, named event update, foreign tenant isolation, failed-write/retry, mobile history.
- New frontend API strict TypeScript: zero diagnostics in both source locations. Cineva full-app baseline remains 101 diagnostics, with none newly introduced by this task; production build passed.
- Existing package regressions: 17 passed; product domain regressions: 9 passed. No real user/workbook/DB fixtures.
- New package source files and modified source remain below 1,000 lines.

Commands: `npm.cmd run test:notifications`, `npm.cmd run test:notifications:e2e`; upstream package supports `npm.cmd --prefix D:/Kantor/1.Frontend/packages/app-core run test:notifications` under Node 24+ (native TypeScript test support).

Evidence: `3.Knowledge/reports/notification_package_2026_10_19/{checks.json,e2e-results.json,backend-tests.txt,kantor-client-tests.txt,cineva-client-tests.txt}` and Excel report. Future Kantor backend extraction/adoption remains owned by that project.
