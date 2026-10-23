/**
 * @hots/table-engine — right-click menu on saved views (portal)
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 2341–2424 (split 2026-10-06).
 */

import { createPortal } from 'react-dom';
import { Badge } from '@hots/ui-kit';
import { Copy, Edit2, Save, Trash2 } from 'lucide-react';

import type { TableEngineCtx } from '../../state/useTableEngine';

type T = Record<string, any>;

export function ViewContextMenu({ ctx }: { ctx: TableEngineCtx<T> }) {
  const {
    handleDuplicateView,
    handleUpdateCurrentView,
    handleDeleteView,
    viewContextMenu,
    setViewContextMenu,
    setRenamingView,
    setRenameInputVal,
  } = ctx;

  return (
    <>
      {/* View Presets Context Menu on Right-Click */}
      {viewContextMenu.visible && viewContextMenu.view && typeof document !== 'undefined'
        ? createPortal(
            <div
              id="reusable-table-view-context-menu-portal"
              style={{
                position: 'fixed',
                left: `${viewContextMenu.x}px`,
                top: `${viewContextMenu.y}px`,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-56 bg-white rounded-xl border border-slate-200 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 text-slate-800 text-xs"
            >
              <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 truncate">{viewContextMenu.view.name}</span>
                {viewContextMenu.view.isDefault && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200">
                    Default
                  </Badge>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (viewContextMenu.view) handleDuplicateView(viewContextMenu.view);
                  setViewContextMenu((prev) => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors text-left font-medium text-slate-700"
              >
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Duplicate View</span>
              </button>
              {!viewContextMenu.view.isDefault ? (
                <button
                  type="button"
                  onClick={() => {
                    if (viewContextMenu.view) {
                      setRenamingView(viewContextMenu.view);
                      setRenameInputVal(viewContextMenu.view.name);
                    }
                    setViewContextMenu((prev) => ({ ...prev, visible: false }));
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors text-left font-medium text-slate-700"
                >
                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Rename View</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (viewContextMenu.view) handleUpdateCurrentView(viewContextMenu.view.id);
                  setViewContextMenu((prev) => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors text-left font-medium text-blue-700"
              >
                <Save className="h-3.5 w-3.5 text-blue-600" />
                <span>Update with Current State</span>
              </button>
              {!viewContextMenu.view.isDefault ? (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      if (viewContextMenu.view) handleDeleteView(viewContextMenu.view.id);
                      setViewContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition-colors text-left font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete View</span>
                  </button>
                </>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
