# Cineva fork 0.2.0-cineva.1

Upstream source snapshot: 0.2.0 on 2026-10-14. The local fork fixes `EditableCell` Escape cancellation: a ref suppresses the immediately following blur save before React restores the draft state. The upstream bug was reproduced in the local browser fixture; the Office package was not edited.

Cineva `DataTableReportPro` controls filtering/sorting/pagination on the whole loaded dataset before passing a page to this package. Exact-value legacy filters and shared tags coexist. Export delegates to the shared XLSX helper using all filtered rows; PDF remains an app adapter. Legacy EAV/update URL bodies and detail-row identity are preserved. Saved server views are disabled for this legacy adapter until a persistence contract is accepted. Optional `hideSearch` (default false) preserves callers that own the external search input, without showing an ignored internal field.
