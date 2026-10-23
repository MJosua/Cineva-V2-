# Cineva table engine decomposition — 18 October 2026

## Scope and compatibility

User requirement: maximum 1,000 lines per code file. Refactor the local reusable table by responsibility before it approaches that limit. HOTS in `D:/Kantor` remains read-only; no database is used.

Local fork: `@hots/table-engine` **0.2.0-cineva.2**, based on upstream 0.2.0 and the previously recorded Cineva .1 changes. Upstream provenance remains in `scripts/package_upgrade_2026_10_14/snapshot.json`.

- `src/state/useTableEngine.ts`: composition, filters, saved views, menus and export.
- `src/state/useColumnOrder.ts`: controlled/local column order, browser persistence and drag lifecycle.
- `src/state/useTableSelection.ts`: current-page selection and existing callback/key behavior.
- `src/state/useTableGrouping.ts`: controlled/local grouping, collapse state and grouped row derivation.

Public props, `useTableEngine` export, context fields, default behavior, EAV host payloads and vendor styles are preserved. These hooks are internal implementation details. Existing selection semantics for unloaded rows are retained; this refactor does not introduce a new cross-page row cache.

The previous composing hook is archived at `_archive/table_refactor_2026_10_18/useTableEngine.ts.before.txt`. Restore that snapshot and revert the three hook imports/calls together if rollback is needed; do not restore older upstream code that lacks Cineva compatibility fixes.

## Validation and maintenance

`npm.cmd run check:table-size` checks all `.ts`/`.tsx` files under table-engine `src` and fails above 1,000 physical lines (blank and comment lines included; trailing empty lines ignored). It runs before `npm.cmd run test:packages`. This guard covers this package; it is not a claim that all legacy app files satisfy the limit.

`npm.cmd run test:components` includes browser checks for preserving off-page selection keys, partial selection, local group counts/collapse reset, controlled grouping delegation, column drag order and persistence across reload. Its existing edit/cancel/rejected-save/filter/search/export checks remain. All data and API responses are synthetic. No database, real account or remote service is involved.

Current evidence is in `reports/table_refactor_2026_10_18/`: line counts, scoped lint, TypeScript diagnostic filtering, browser results and Excel report. Full-app TypeScript diagnostics remain a separate existing limitation; a production build does not prove live backend compatibility.

Verified: composing hook 818 to 674 lines; all 19 package source files below 1,000. 17 contract tests and 19 component browser checks pass. Production build passes. Scoped lint: zero errors and one function-length warning on the composing hook (150-line advisory, distinct from the user 1,000-line file limit). No table-engine TypeScript diagnostics; full app still reports 101 diagnostics.
