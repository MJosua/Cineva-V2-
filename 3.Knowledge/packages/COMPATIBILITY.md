# Cineva compatibility boundary

- UI: 53 import adapters retain old named/default exports; implementation lives in ui-kit.
- Forms: shared builder/readonly preview, stable JSON IDs and unknown fields retained; primary domain submit runtime remains legacy.
- Reports: shared renderer, host-controlled full-loaded-dataset query/pagination; legacy EAV/custom endpoint bodies and PDF/XLSX behavior retained.
- Table-engine Cineva .2: internal column-order, selection and grouping hooks extracted; public context/props retained. Package tests enforce 1,000 lines per source file.
- Workflow: raw shared body wrapped as `{ data }` for existing pages.
- Trigger: local engine-client fork owns canonical function_type/search/is_active filters and typed category/count responses; deprecated type alias remains supported. Hook keeps active=true default.
- Builder: local dynamic-form fork owns consistent whitelist policy; existing unsupported types/metadata round-trip. Host registry workaround removed.
- Preferences: shared client with old app cache/lifecycle.
- Auth: app-owned Bearer transport injected into shared Provider; cookie-only shared factory is not adopted blindly.
- Backend: transaction-kit snapshot only, no runtime wiring or schema changes.

Detailed unresolved work and evidence: [integration](../architecture/reusable_packages_2026_10_14.md).
