/**
 * @hots/table-engine — rename saved view modal (portal)
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 2426–2483 (split 2026-10-06).
 */

import { createPortal } from 'react-dom';
import { Button } from '@hots/ui-kit';
import { Input } from '@hots/ui-kit';
import { Edit2, Save, X } from 'lucide-react';

import type { TableEngineCtx } from '../../state/useTableEngine';

type T = Record<string, any>;

export function RenameViewDialog({ ctx }: { ctx: TableEngineCtx<T> }) {
  const {
    handleRenameView,
    renamingView,
    setRenamingView,
    renameInputVal,
    setRenameInputVal,
  } = ctx;

  return (
    <>
      {/* Rename View Modal */}
      {renamingView && typeof document !== 'undefined'
        ? createPortal(
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 999999 }}
              className="bg-black/30 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-100"
              onClick={() => setRenamingView(null)}
            >
              <div
                className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl p-4 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Edit2 className="h-4 w-4 text-blue-600" /> Rename View
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRenamingView(null)}
                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">View Name</label>
                  <Input
                    value={renameInputVal}
                    onChange={(e) => setRenameInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRenameView(renamingView.id, renameInputVal);
                      }
                    }}
                    autoFocus
                    placeholder="Enter new view name..."
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setRenamingView(null)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!renameInputVal.trim()}
                    onClick={() => handleRenameView(renamingView.id, renameInputVal)}
                    className="h-8 text-xs font-semibold"
                  >
                    Save Name
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
