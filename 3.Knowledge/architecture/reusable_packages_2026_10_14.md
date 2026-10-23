# Cineva reusable package integration

Date: 2026-10-14 Asia/Jakarta. HOTS Kantor is read-only reference. This task changes Cineva only.

## Architectural impact

Frontend now uses an npm workspace rooted at `1.Frontend`: HOTS host, dynamic-form, service-form-runtime and `packages/*`. Fourteen package snapshots exist locally (13 frontend and transaction-kit backend). Seven frontend packages are consumed by app/tooling; the other six are available without invented business call sites. Backend transaction-kit is a catalog baseline only.

Generic components are owned by packages. Legacy imports remain thin compatibility entries; business behavior is injected from the app. Old implementations were retained in `3.Knowledge/_archive/package_upgrade_2026_10_14`. Reference package source snapshots/hashes are in `scripts/package_upgrade_2026_10_14/snapshot.json`; actual versions/status and current gap inventory are in `integration.json` and the Excel report.

## Changes implemented

- 53 generic UI modules now forward to `@hots/ui-kit/components/*`, including default exports where needed. `cn` and `useIsMobile` are shared. No generic implementation remains duplicated in those wrappers.
- `UnifiedFormStructureEditor` uses the shared visual builder, shared readonly renderer and service-form normalization. Stable IDs, unknown JSON properties, section children, structured rows and special metadata are retained by adapters. Legacy field/row-group/CMS/diagram settings stay optional advanced controls; unsupported new runtime field types cannot be created or selected through the shared inspector.
- `DataTableReportPro` uses the shared report renderer with host-controlled search, exact filters, shared include/exclude tags, numeric sorting and pagination. Filtering happens before paging. XLSX export includes all filtered loaded rows; PDF export stays compatible. Existing default/custom update request bodies are preserved, and failures propagate so editable cells restore their previous values.
- Added `HotsCoreProvider` with an explicitly injected app-owned transport. It resolves current API base and token per request and rejects cross-origin credential destinations. The shared cookie-only factory is not altered. Legacy auth remains until frontend/backend contracts are migrated together.
- Workflow, trigger and preference requests use typed engine-client APIs. Workflow responses preserve the existing `{ data }` wrapper; trigger list uses the backend's `function_type` and `is_active` parameters; preference cache/lifecycle remains app-owned.
- PDF wrapper consumes ui-kit media while retaining its download action. Optional peer resolution is configured in Vite and TypeScript. Tailwind scans shared packages and uses the shared preset while retaining app tokens.
- Shared eslint rules apply to new platform/form/report adapters. New files follow the modular engine/adapter separation; no new DB write or SQL migration was added.

## Explicit local forks

`ui-kit` 0.2.0-cineva.1 adds additive package export subpaths only. `table-engine` 0.2.0-cineva.1 fixes Escape → blur → save: the old draft was saved despite cancellation because state updates are asynchronous. A ref suppresses that blur save. It also adds optional `hideSearch` (default false) to preserve host-owned external search without an ignored internal input. The Office reference remains unchanged. Future synchronization must compare hashes and carry forward or retire these explicit patches; never overwrite forks blindly.

## Installation, indexing and retention

```powershell
npm.cmd --prefix 1.Frontend ci
npm.cmd run build:frontend
npm.cmd run dev:frontend
npm.cmd run knowledge:index
npm.cmd run knowledge:search -- EditableCell
```

One canonical frontend lockfile lives at `1.Frontend/package-lock.json`; the intermediate standalone HOTS lockfile was archived. Backend keeps its independent package/lock/environment. Vite peers are deduped from the host and TypeScript paths resolve host/workspace optional peers, including when npm leaves them inside HOTS/node_modules. No runtime package path points to Kantor.

## Remaining work

See [Cineva gaps](../reports/package_upgrade_2026_10_14/Cineva_Reusable_Packages.xlsx) and the per-file static inventory in `scripts/package_upgrade_2026_10_14/integration.json`. The primary legacy service submit/field/rule runtime, several specialized tables and widgets, legacy toast lifecycle, auth/SSE, inline APIs and backend transaction package are not fully migrated. A flagged file is a migration candidate, not necessarily a confirmed defect; business adapters may deliberately remain local.

The shared builder preview represents generic/shared fields. QR, CMS, rule interpretation, structured row execution and other service-specific widgets still require real runtime parity tests. Form preview does not replace live service acceptance. No claim is made that every installed package is production-ready or consumed.

## Verification boundary

Clean frontend workspace install and production build pass. Fifteen contract tests pass for schema retention, scoped updates, full-dataset filtering/sorting, both report payload variants, business rejection on HTTP 200, live token/base resolution, credential origin isolation and engine client contracts. New adapter lint passes. Full frontend typecheck is still not clean: 101 diagnostics in app legacy areas, zero in the edited adapters, report consumers and copied UI source after peer-path corrections. These are recorded separately in `typecheck.json`; a before/after baseline for every legacy diagnostic was not established, so they are not all claimed as pre-existing.

Browser fixture verified label editing with stable backend name/custom metadata, adding a field, draft save/reload, supported field-type constraints, search beyond page one, exact filtering, successful save isolation, failed-save rollback UI and Escape cancellation. A filtered export contains all 11 data rows across two UI pages. All fixture requests were mocked. No real login, backend, database, role scope, upload/Bridge, SSE, remote PDF or deployment was exercised.

Reference hash comparison and backend source comparison are recorded in integration.json. Only Cineva fork files differ from their copied upstream baselines. [Future HOTS notes](hots_reference_followups_2026_10_14.md) are informational records in Cineva; no Office code, knowledge, DB or deployment was changed.
