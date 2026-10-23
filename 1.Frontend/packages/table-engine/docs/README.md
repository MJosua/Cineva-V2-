---
app: @hots/table-engine
purpose: Shared package @hots/table-engine: reusable report/table engine decoupled from the HOTS ReusableTableEngine
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: []
writes_tables: []  # shared tables this app also writes
emits: []
listens: []
depends_on: [2.Backend/Integrated-API, "@hots/app-core", "@hots/ui-kit"]
must_not: ["write:*"]
---

# @hots/table-engine

Reusable report table: search, filter tags, column filters, sort, group, saved views, colors, inline edit, selection, pagination, Excel export.

- **Version:** 0.2.0 · **Source:** copied from `HOTS/src/components/report/ReusableTableEngine.tsx` on 2026-10-05 (HOTS unchanged)
- **Depends on:** `@hots/app-core`, `@hots/ui-kit`, `lucide-react`, `xlsx` (lazy-loaded)

## Usage
```tsx
import { ReusableTableEngine } from '@hots/table-engine';

<ReusableTableEngine
  title="Stores"
  reportKey="mapit_stores"
  rows={rows}
  columns={columns}
  visibleColumns={visible}
  page={page}
  totalPages={totalPages}
  pageSize={50}            // server-side, limit ≤ 100
  onPageChange={setPage}
/>
```

## Differences from the HOTS original
| HOTS | Package |
|---|---|
| `axios` + `API_URL` + `Bearer getAuthToken()` for saved views | `savedViewsAdapter` prop; default uses `useOptionalHotsCore().http` (cookie auth) against `/hotsprefs/report_table/<reportKey>_saved_views` |
| Saved views only when a token exists | Saved views only when a provider or adapter exists; `savedViewsAdapter={null}` disables |
| `import * as XLSX` eagerly | `exportRowsToXlsx` lazy `import('xlsx')`; same file name pattern |
| `@/components/ui/*` | `@hots/ui-kit` |

All other props and behavior are identical (additive change only: new optional `savedViewsAdapter`).

## File structure (0.2.0)
Head + parts. Every file starts with a header naming its head and the monolith line range it came from.

```
src/
  ReusableTableEngine.tsx        HEAD — assembles all parts; public entry (≈55 lines)
  types.ts                       public types (columns, filters, saved views, props)
  state/useTableEngine.ts        all state, effects, handlers — no JSX
  parts/header/HeaderBar.tsx     title, total badge, saved-view tabs
  parts/toolbar/Toolbar.tsx      search, tag filters, group-by, styling, active tags
  parts/table/TableSection.tsx   table head + grouped/plain rows
  parts/footer/PaginationBar.tsx row count, paging, page size
  parts/menus/                   CellContextMenu, ViewContextMenu, RenameViewDialog
  cells/EditableCell.tsx         inline edit cell
  controls/                      HexRoundColorPicker, ColumnFilterInput, ColumnSelectFilterInput
  export.ts                      xlsx export helpers
  index.ts                       package exports
```

How parts talk: the head calls `useTableEngine(props)` once and passes the result as `ctx` to every part; a part destructures only what it uses. To change one area (e.g. the toolbar), edit only that part; to add state, add it to the hook and return it.
