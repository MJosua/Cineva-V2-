# Generic domain and scheduling packages — 19 October 2026

## Architecture and provenance

Two additive, local packages were created at `1.Frontend/packages/domain-kit` and `scheduling-kit`, both version `0.1.0-cineva.1`. These are new Cineva implementations, not a claim that these versions exist upstream. HOTS in `D:/Kantor` was not modified. The owning Kantor project can review and adopt them additively while retaining existing defaults/features.

Both packages expose pure TypeScript through source exports for TypeScript/bundler consumers. They have no React, SQL, HTTP, storage, vendor labels or runtime logging dependency. They are not precompiled CommonJS packages. Frontend dependencies use the single `1.Frontend/package-lock.json` workspace.

Generic behavior is supplied through collection/field mappings, callback policies, manifests, resource capacities, intervals and injected clocks. Authorization, tenant scoping, timezone conversion, EAV meanings, translation, persistence and transaction boundaries belong to host adapters.

## Capability and adoption

| Capability | Package API | Cineva adoption / boundary |
|---|---|---|
| Object relations | `validateRelations` | Offline document users/campaigns/batches/tickets/assignments, including campaign-scoped batches |
| Cross-object rules | `createRules`, `assertRules` | Source paid amount plus simulation payments cannot exceed fee |
| Typed attributes | `validateAttribute` | Integer/money and actual date-only validation; vendor supplies required/minimum rules |
| Commands | `createCommandRegistry` | Offline `document.update`; full validation before local persistence, stale-render revision rejection |
| AI proposals | `createAIGateway` | Tested JSON allowlist gateway; not connected to a local LLM or exposed as a new API |
| Events/outbox | `createEventBus`, `executeTransactionalCommand`, `drainOutbox` | Contract tests with an in-memory transaction adapter; no deployed durable outbox |
| Module/configuration | `createModuleRegistry`, `mergeConfiguration` | Exact-version dependency and capability snapshots tested; host migration/deployment not implemented |
| Read models | `createProjectionRegistry`, `projectReadModel` | Authorization, redaction and detached output tested; no new server endpoint |
| Scheduling | `checkAvailability`, `intervalsOverlap` | Cineva job crew/gear conflicts use a capacity-one vendor adapter |
| Hotel date-only stay | `stayInterval` | Synthetic reusable example; date ordinals in days, not meeting timestamps in milliseconds |

## Consumer locations

- `1.Frontend/HOTS/src/features/cineva-offline/domainAdapter.ts`: field and relation configuration plus cash rule.
- `cineva-offline/validation.ts`: document shape, EAV and string-ID rules remain in the vendor.
- `cineva-offline/commands.ts`: explicit local demo edit context and document reducer; valid replacement JSON import remains supported.
- `cineva-offline/OfflineDemo.tsx`: commands run before store writes; in-memory revision catches stale callbacks. This is not server authentication or cross-tab concurrency control.
- `cineva-shared/scheduling.ts`: maps named crew/gear to capacity one and preserves existing first-conflict messages, archive and update-exclusion behavior. Done but unarchived jobs retain their prior occupancy. Invalid legacy dates are skipped as before; requested invalid intervals fail closed.
- `cineva-shared/model.ts`: existing draft validation delegates resource overlap policy to the adapter.

Scheduling uses half-open intervals `[start,end)`; adjacent bookings are allowed. The engine checks supplied snapshots only. There is no authoritative reservation, lock, durable idempotency or concurrency guarantee. Future server adoption must load/recheck and commit all allocations under a real transaction with rollback. Event dispatch occurs after commit and is at least once; consumers need durable deduplication.

The offline source document/EAV contract is unchanged. A dangling batch campaign is now rejected even if no assignment points to that batch. Payment source nulls and ambiguous source dates remain unresolved; no new source values are inferred.

## Verification and remaining work

Run `npm.cmd run test:generic-packages`: package contracts plus synthetic Cineva consumer tests, strict ES2020 package typecheck, and per-source-file 1,000-line ceiling. Evidence is written under `3.Knowledge/reports/generic_packages_2026_10_19`. Existing product, booking and portable-demo browser suites verify actual consumer flows with synthetic data only. They do not use the reference workbooks or database.

Verified after adoption: 44 package/consumer tests, 7 existing offline document tests, 9 product domain tests; browser suites passed 19 HQ/Creator, 9 workflow/booking and 10 offline scenarios. Package strict typecheck has zero diagnostics; touched Cineva feature diagnostics and lint errors are zero. The full application still has 101 existing TypeScript diagnostics, so the whole legacy application is not claimed type-clean. Production build passed with existing bundle/dependency warnings. All new package source files are below 1,000 lines (largest 85). The local preview was started at `http://127.0.0.1:48175/hots/cineva-preview.html` for browser verification.

Report: `3.Knowledge/reports/generic_packages_2026_10_19/Cineva_Reusable_Packages_Report.xlsx`. The existing client HTML and ZIP were rebuilt from the unchanged JSON seed; source reference workbooks were not written.

The generic contracts are an initial local release. Still pending: real server authorization/tenant adapters, physical-schema-backed persistence, durable outbox/idempotency, booking lifecycle and recurrence policies, actual LLM provider, upstream Kantor review/release. The broader reusable-module backlog (quote, finance, import, QC and other application capabilities) remains staged; these packages do not claim all of it is complete.

No unused source file was removed. Existing functions were retained as vendor-facing adapters rather than maintaining a duplicate obsolete engine. The client demo HTML/ZIP is rebuilt from its existing authorized JSON seed; tests remain synthetic.
