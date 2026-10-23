/**
 * @hots/table-engine — row count, page navigation, page size
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 2095–2158 (split 2026-10-06).
 */

import { Button } from '@hots/ui-kit';
import { Input } from '@hots/ui-kit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hots/ui-kit';

import type { TableEngineCtx } from '../../state/useTableEngine';

type T = Record<string, any>;

export function PaginationBar({ ctx }: { ctx: TableEngineCtx<T> }) {
  const {
    rows,
    totalRows,
    page,
    totalPages,
    onPrevPage,
    onNextPage,
    onPageChange,
    pageSize,
    onPageSizeChange,
    jumpToPageVal,
    setJumpToPageVal,
    displayRows,
  } = ctx;

  return (
    <>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground flex-wrap">
        <div>
          Showing {displayRows.length} of {totalRows ?? rows.length} rows
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" disabled={page <= 1} onClick={onPrevPage}>
            Prev
          </Button>
          <span>Page {page} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={onNextPage}>
            Next
          </Button>

          {/* Jump to Page Input */}
          {totalPages > 1 && onPageChange ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Go to:</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={jumpToPageVal}
                placeholder={String(page)}
                onChange={(e) => setJumpToPageVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const target = parseInt(jumpToPageVal, 10);
                    if (!isNaN(target) && target >= 1 && target <= totalPages) {
                      onPageChange(target);
                      setJumpToPageVal('');
                    }
                  }
                }}
                className="h-8 w-14 text-xs text-center bg-white px-1 shadow-2xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = parseInt(jumpToPageVal, 10);
                  if (!isNaN(target) && target >= 1 && target <= totalPages) {
                    onPageChange(target);
                    setJumpToPageVal('');
                  }
                }}
                disabled={!jumpToPageVal || isNaN(parseInt(jumpToPageVal, 10)) || parseInt(jumpToPageVal, 10) < 1 || parseInt(jumpToPageVal, 10) > totalPages}
                className="h-8 px-2 text-xs font-semibold"
              >
                Go
              </Button>
            </div>
          ) : null}

          {typeof pageSize !== 'undefined' && onPageSizeChange ? (
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}/page</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>
    </>
  );
}
