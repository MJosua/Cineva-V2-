/**
 * @hots/table-engine — HEAD: assembles the table from its parts
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 1–2488 (split 2026-10-06).
 */
import { Card } from '@hots/ui-kit';
import type { ReusableTableEngineProps } from './types';
import { useTableEngine, type TableEngineCtx } from './state/useTableEngine';
import { HeaderBar } from './parts/header/HeaderBar';
import { Toolbar } from './parts/toolbar/Toolbar';
import { TableSection } from './parts/table/TableSection';
import { PaginationBar } from './parts/footer/PaginationBar';
import { CellContextMenu } from './parts/menus/CellContextMenu';
import { ViewContextMenu } from './parts/menus/ViewContextMenu';
import { RenameViewDialog } from './parts/menus/RenameViewDialog';

export type * from './types';
export { useTableEngine } from './state/useTableEngine';
export type { TableEngineCtx } from './state/useTableEngine';

/**
 * Map of parts (edit one part without touching the others):
 *   state/useTableEngine.ts        state, effects, handlers (no JSX)
 *   parts/header/HeaderBar         title + saved-view tabs
 *   parts/toolbar/Toolbar          search, filters, group-by, styling, active tags
 *   parts/table/TableSection       table head + rows
 *   parts/footer/PaginationBar     paging
 *   parts/menus/*                  context menus + rename dialog
 *   cells/, controls/              small reusable pieces
 */
export function ReusableTableEngine<T extends Record<string, any>>(props: ReusableTableEngineProps<T>) {
  // Parts are row-type agnostic: they only render T as Record<string, any>.
  const ctx = useTableEngine(props) as unknown as TableEngineCtx;

  return (
    <div className="space-y-3">
      <HeaderBar ctx={ctx} />

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-sm">
        <Toolbar ctx={ctx} />
        <TableSection ctx={ctx} />
      </Card>

      <PaginationBar ctx={ctx} />
      <CellContextMenu ctx={ctx} />
      <ViewContextMenu ctx={ctx} />
      <RenameViewDialog ctx={ctx} />
    </div>
  );
}

export default ReusableTableEngine;
