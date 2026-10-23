# HOTS Kantor follow-ups — notes only

Date: 2026-10-14. These notes belong to Cineva. The Office project owner may review them later; this task never edits HOTS Kantor.

Authoritative machine-readable list: `3.Knowledge/scripts/package_upgrade_2026_10_14/gaps.json`, reference section. Evidence is current source, copied package metadata and mock browser reproduction; live deployment impact is not verified.

## Priority findings

1. **Escape cancellation saves the draft (P0):** table-engine EditableCell sets state then immediately blurs, causing the prior closure to save. Reproduced; fixed only in the Cineva 0.2.0-cineva.1 fork with a skip-blur ref. Add a keyboard cancellation regression check in the Office package.
2. **Builder inspector ignores allowedFieldTypes (P1):** creation catalog is restricted but the field-type editor enumerates all registry entries. Cineva constrains its registry. Add an additive consistent allowed-type policy in the reference builder.
3. **Trigger client types/filter names drift (P1):** backend reads `function_type`/`is_active`, package's list type exposes `type`; categories return `{category,count}` objects but are typed `string[]`. Cineva keeps explicit compatibility mapping. Correct public types/aliases without breaking old callers.
4. **UI source-package peer resolution (P1):** optional-peer components are exported from the barrel and can fail resolution when the peer exists only under the host. Document host/workspace resolution and provide public component subpaths. Cineva adds subpaths and configures Vite/TypeScript host resolution. The preset's plugin dependency also requires a real shared dependency root.
5. **Missing typed engine clients (P1):** ticket/assignment/document/report-table calls still lack a reusable client surface; package README explicitly lists this gap. Derive clients from actual routes/envelopes rather than copying inline app calls.
6. **Domain inspector hooks (P1):** structured row groups, special CMS/HTML/diagram elements and widget-specific inspectors still need app add-ons. Optional hooks/registries would improve reuse while keeping app store/API out of packages.
7. **Auth contract/documentation conflict (P0):** HOTS authToken comment says memory-only while implementation writes localStorage; app-core drops Bearer headers and expects cookies. Coordinate backend, MFE sharing and docs before a universal transport switch.
8. **HOTS adoption remains partial (P1):** generic UI, table/API/form paths still have app-local implementations even though reusable packages exist. Plan gradual adoption with compatibility and runtime acceptance; package presence is not adoption.
9. **Registry/readme version drift (P2):** app-core and engine-client README versions/status differ from package.json. Generate or validate compatibility/version/status tables against source imports and metadata.
10. **page-engine/app-template readiness (P2):** responsive/CSS helpers do not constitute a complete page renderer; app-template and commerce-kit remain candidates. Do not treat them as completed reusable surfaces.

## Ownership and validation

### Additional Cineva finding, 18 October 2026

Multiple flat dynamic forms on one page can share `hdf-deadline` / `hdf-title` DOM IDs. Browser E2E reproduced a label pointing to a hidden field in another form. Cineva local dynamic-form 0.1.0-cineva.2 adds an opt-in `inputId` for custom renderer labels and its HotsForm uses a unique per-form prefix; schema decoration is memoized to preserve entered values. Office may evaluate additive per-form ID support across its own built-in/custom renderers, row groups and accessibility tests. This is a note only: no Office source was inspected or changed for this finding, and impact there is unverified.

Cineva owns its adapters/forks and acceptance against its own backend. The Office project owns any future change to HOTS/reference packages. Reproduce failures in an isolated test fixture before applying an Office patch. No database SQL should be generated from conceptual schema docs; physical schema and transaction prerequisites remain required for backend adoption.
