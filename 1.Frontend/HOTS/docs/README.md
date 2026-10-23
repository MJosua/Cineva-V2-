# Cineva HOTS app

Owner: Cineva project. Reference: HOTS Kantor, read-only.

## Dependency and implementation ownership

Install at `1.Frontend` with `npm ci`; canonical lockfile is `1.Frontend/package-lock.json`. Root commands `dev:frontend` and `build:frontend` target this app through the frontend workspace. Local `file:` dependencies point to sibling packages, never to Kantor.

- Generic UI: `@hots/ui-kit`; 53 legacy import files forward to component subpaths.
- Visual structure builder and readonly preview: `@hots/dynamic-form`; preview normalization: `@hots/service-form-runtime`.
- Domain field/row-group/CMS/diagram editors and legacy service submit runtime remain app adapters.
- Generic report rendering: `@hots/table-engine`; old `DataTableReportPro` is a compatibility adapter for search/paging/EAV update and PDF export.
- HTTP context: `@hots/app-core` Provider with an explicitly injected legacy transport.
- Workflow, trigger and preferences requests: `@hots/engine-client`.
- PDF: `@hots/ui-kit/media` with legacy download action.
- Shared lint rules: new platform/forms/report adapters only. Whole legacy lint/type cleanup is separate.

Vite dedupes React and optional UI peers from the host. TypeScript paths mirror host/workspace peer lookup. Tailwind scans shared source; the existing app tokens/brand remain authoritative.

## Verification

Contract checks: `node 3.Knowledge/scripts/package_upgrade_2026_10_14/run-contracts.mjs` from workspace root. Browser fixture: `node 3.Knowledge/scripts/package_upgrade_2026_10_14/serve-preview.mjs`; all fixture requests are mocked. This does not prove login, DB writes, uploads or live workflows. Detailed results and gaps are in `3.Knowledge/architecture/reusable_packages_2026_10_14.md`.
