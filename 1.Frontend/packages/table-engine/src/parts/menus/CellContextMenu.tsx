/**
 * @hots/table-engine — right-click menu on cells/headers (portal)
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 2160–2339 (split 2026-10-06).
 */

import { createPortal } from 'react-dom';
import { Button } from '@hots/ui-kit';
import { Check, Copy, EyeOff, Filter, FilterX, Palette, Save, X } from 'lucide-react';

import { HexRoundColorPicker } from '../../controls/HexRoundColorPicker';

import type { TableEngineCtx } from '../../state/useTableEngine';

type T = Record<string, any>;

export function CellContextMenu({ ctx }: { ctx: TableEngineCtx<T> }) {
  const {
    title,
    onVisibleColumnsChange,
    columnColors,
    onColumnColorsChange,
    onSavePreferences,
    savingPreferences,
    handleAddTag,
    changeVisibility,
    contextMenu,
    setContextMenu,
    copiedCell,
    setCopiedCell,
  } = ctx;

  return (
    <>
      {/* Precision Floating Context Menu rendered via ReactDOM.createPortal */}
      {contextMenu.visible && contextMenu.column && typeof document !== 'undefined'
        ? createPortal(
            <div
              id="reusable-table-context-menu-portal"
              style={{
                position: 'fixed',
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-80 bg-white rounded-xl border border-slate-200 shadow-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100 text-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    style={{
                      backgroundColor:
                        columnColors?.[String(contextMenu.column.key)] ||
                        contextMenu.column.color ||
                        '#ffffff',
                    }}
                    className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                  />
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {contextMenu.column.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Cell Actions: Copy Value & Filter In / Out */}
              {contextMenu.cellValue !== null && contextMenu.cellValue !== undefined && String(contextMenu.cellValue).trim() !== '' ? (
                <div className="space-y-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Cell:</span>
                      <span className="font-semibold text-slate-700 truncate" title={String(contextMenu.cellValue)}>
                        "{String(contextMenu.cellValue)}"
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(String(contextMenu.cellValue));
                        setCopiedCell(true);
                        setTimeout(() => setCopiedCell(false), 1500);
                      }}
                      title="Copy cell value"
                      className="text-slate-500 hover:text-blue-600 p-1 rounded hover:bg-white transition-colors shrink-0 flex items-center gap-1"
                    >
                      {copiedCell ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-medium">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!contextMenu.column) return;
                        handleAddTag({
                          key: String(contextMenu.column.key),
                          label: contextMenu.column.label,
                          operator: 'include',
                          value: String(contextMenu.cellValue),
                        });
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                      }}
                      className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
                    >
                      <Filter className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Filter In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!contextMenu.column) return;
                        handleAddTag({
                          key: String(contextMenu.column.key),
                          label: contextMenu.column.label,
                          operator: 'exclude',
                          value: String(contextMenu.cellValue),
                        });
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                      }}
                      className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
                    >
                      <FilterX className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">Filter Out</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Column Color Customization */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Column Color Palette
                </p>
                <HexRoundColorPicker
                  value={
                    columnColors?.[String(contextMenu.column.key)] ||
                    contextMenu.column.color ||
                    ''
                  }
                  onChange={(hex) => {
                    if (!contextMenu.column) return;
                    onColumnColorsChange?.({
                      ...columnColors,
                      [String(contextMenu.column.key)]: hex,
                    });
                  }}
                  onClear={() => {
                    if (!contextMenu.column) return;
                    const next = { ...columnColors };
                    delete next[String(contextMenu.column.key)];
                    onColumnColorsChange?.(next);
                  }}
                />
              </div>

              {/* Footer: Hide Column & Save Preference */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                {contextMenu.column.hideable !== false && onVisibleColumnsChange ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!contextMenu.column) return;
                      changeVisibility(String(contextMenu.column.key), false);
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Column</span>
                  </button>
                ) : <div />}

                {onSavePreferences ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      void onSavePreferences();
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    disabled={savingPreferences}
                    className="h-7 text-xs font-semibold px-2.5 gap-1"
                  >
                    <Save className="h-3 w-3" />
                    <span>{savingPreferences ? 'Saving...' : 'Save Color'}</span>
                  </Button>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
