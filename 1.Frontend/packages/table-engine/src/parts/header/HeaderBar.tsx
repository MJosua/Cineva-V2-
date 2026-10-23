/**
 * @hots/table-engine — title, total badge, saved-view tabs
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 1152–1294 (split 2026-10-06).
 */

import { Button } from '@hots/ui-kit';
import { Input } from '@hots/ui-kit';
import { Badge } from '@hots/ui-kit';
import { Popover, PopoverContent, PopoverTrigger } from '@hots/ui-kit';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@hots/ui-kit';
import { Bookmark, BookmarkPlus, Copy, Edit2, MoreVertical, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@hots/ui-kit';

import type { TableEngineCtx } from '../../state/useTableEngine';

type T = Record<string, any>;

export function HeaderBar({ ctx }: { ctx: TableEngineCtx<T> }) {
  const {
    title,
    description,
    reportKey,
    totalRows,
    columns,
    savedViews,
    activeViewId,
    saveViewOpen,
    setSaveViewOpen,
    newViewName,
    setNewViewName,
    savingViews,
    handleApplyViewPreset,
    handleCreateViewPreset,
    handleDuplicateView,
    handleUpdateCurrentView,
    handleDeleteView,
    setRenamingView,
    setRenameInputVal,
    handleViewContextMenu,
  } = ctx;

  return (
    <>
      {/* Top Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{title}</span>
            {totalRows !== undefined ? (
              <Badge variant="secondary" className="font-mono text-xs font-semibold px-2 py-0.5">
                {totalRows.toLocaleString()}
              </Badge>
            ) : null}
          </h2>
          {description ? (
            <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>

        {/* Saved View Presets Tabs */}
        {reportKey ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 shadow-2xs">
              {savedViews.map((view) => {
                const isActive = activeViewId === view.id;
                return (
                  <div key={view.id} className="relative flex items-center group/view">
                    <button
                      type="button"
                      onClick={() => handleApplyViewPreset(view)}
                      onContextMenu={(e) => handleViewContextMenu(e, view)}
                      title={`Switch to "${view.name}". Right-click for options.`}
                      className={cn(
                        "h-7 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 select-none",
                        isActive
                          ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      )}
                    >
                      {view.isDefault ? <Bookmark className="h-3 w-3 text-amber-500 fill-amber-500" /> : <Sparkles className="h-3 w-3 text-blue-500" />}
                      <span>{view.name}</span>
                    </button>
                    {!view.isDefault ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-7 px-1 text-slate-400 hover:text-slate-700 rounded-r-md transition-colors"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs">
                          <DropdownMenuItem onClick={() => handleDuplicateView(view)} className="gap-2">
                            <Copy className="h-3.5 w-3.5 text-slate-600" />
                            <span>Duplicate view</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setRenamingView(view);
                              setRenameInputVal(view.name);
                            }}
                            className="gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                            <span>Rename view</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateCurrentView(view.id)} className="gap-2">
                            <Save className="h-3.5 w-3.5 text-blue-600" />
                            <span>Update with current state</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteView(view.id)} className="gap-2 text-rose-600 focus:text-rose-700">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete view</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-7 px-1 text-slate-400 hover:text-slate-700 rounded-r-md transition-colors"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs">
                          <DropdownMenuItem onClick={() => handleDuplicateView(view)} className="gap-2">
                            <Copy className="h-3.5 w-3.5 text-slate-600" />
                            <span>Duplicate view</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateCurrentView(view.id)} className="gap-2">
                            <Save className="h-3.5 w-3.5 text-blue-600" />
                            <span>Update with current state</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}

              <Popover open={saveViewOpen} onOpenChange={setSaveViewOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 font-semibold">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New View</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-68 p-3 space-y-2.5">
                  <div className="border-b pb-1.5">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <BookmarkPlus className="h-3.5 w-3.5 text-blue-600" /> Add New View Preset
                    </p>
                    <p className="text-[11px] text-muted-foreground">Creates a view preset from current active filters, columns, order, and styling.</p>
                  </div>
                  <Input
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateViewPreset();
                      }
                    }}
                    placeholder="e.g. Active Urgent Issues"
                    className="h-8 text-xs bg-white"
                  />
                  <Button
                    size="sm"
                    disabled={!newViewName.trim() || savingViews}
                    onClick={handleCreateViewPreset}
                    className="w-full h-8 text-xs font-semibold"
                  >
                    {savingViews ? 'Saving...' : 'Add View Preset'}
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
