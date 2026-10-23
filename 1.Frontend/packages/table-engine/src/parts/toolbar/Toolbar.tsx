/**
 * @hots/table-engine — card header: search, tag filters, group-by, styling, active tags
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 1298–1764 (split 2026-10-06).
 */

import { Button } from '@hots/ui-kit';
import { Input } from '@hots/ui-kit';
import { Badge } from '@hots/ui-kit';
import { CardHeader } from '@hots/ui-kit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hots/ui-kit';
import { Table } from '@hots/ui-kit';
import { Checkbox } from '@hots/ui-kit';
import { Popover, PopoverContent, PopoverTrigger } from '@hots/ui-kit';
import { Check, Columns3, FileSpreadsheet, Filter, Folders, Palette, Plus, RefreshCcw, Save, Search, X } from 'lucide-react';
import { cn } from '@hots/ui-kit';

import { HexRoundColorPicker } from '../../controls/HexRoundColorPicker';

import type { TableEngineCtx } from '../../state/useTableEngine';

type T = Record<string, any>;

export function Toolbar({ ctx }: { ctx: TableEngineCtx<T> }) {
  const {
    title,
    rows,
    loading,
    saving,
    errorMessage,
    columns,
    visibleColumns,
    onVisibleColumnsChange,
    onRefresh,
    categoryValue,
    categoryOptions,
    onCategoryChange,
    page,
    columnColors,
    onColumnColorsChange,
    rowColors,
    onSavePreferences,
    onClearPreferences,
    savingPreferences,
    enableExport,
    headerActions,
    activeGroupBy,
    handleGroupByChange,
    activeFilterTags,
    addFilterOpen,
    setAddFilterOpen,
    newFilterCol,
    setNewFilterCol,
    newFilterMode,
    setNewFilterMode,
    newFilterVal,
    setNewFilterVal,
    search,
    handleSearchChange,
    hideSearch,
    visibleList,
    hideableColumns,
    filterableColumns,
    handleRemoveTag,
    handleToggleTagMode,
    handleClearAllTags,
    handleAddFilterFromPopover,
    handleExportCurrentPage,
  } = ctx;

  return (
    <>
        <CardHeader className="p-4 space-y-3">
          {errorMessage ? (
            <div className="rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-700 border border-red-200">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Left: Search Bar & Category Filter */}
            <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap sm:flex-nowrap">
              {!hideSearch && <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search across all data (use ! to exclude)..."
                  className="pl-8 pr-8 h-9 text-sm bg-white"
                />
                {search ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              }{categoryOptions && onCategoryChange ? (
                <Select value={categoryValue} onValueChange={onCategoryChange}>
                  <SelectTrigger className="w-[140px] h-9 shrink-0 bg-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            {/* Right: Actions, Filters, Export, Visibility */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Add Custom Tag Filter Popover */}
              <Popover open={addFilterOpen} onOpenChange={setAddFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Filter</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-3 space-y-3">
                  <div className="border-b pb-2">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Filter className="h-4 w-4 text-blue-600" /> Custom Tag Filter
                    </p>
                    <p className="text-xs text-muted-foreground">Apply multi-tag include or exclude rules.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Column</label>
                      <Select value={newFilterCol} onValueChange={setNewFilterCol}>
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue placeholder="Choose column..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {filterableColumns.map((col) => (
                            <SelectItem key={String(col.key)} value={String(col.key)} className="text-xs">
                              {col.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Mode</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setNewFilterMode('include')}
                          className={cn(
                            "h-7 text-xs font-medium rounded border transition-colors flex items-center justify-center gap-1",
                            newFilterMode === 'include'
                              ? "bg-blue-50 border-blue-400 text-blue-700 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span>= Contains</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewFilterMode('exclude')}
                          className={cn(
                            "h-7 text-xs font-medium rounded border transition-colors flex items-center justify-center gap-1",
                            newFilterMode === 'exclude'
                              ? "bg-rose-50 border-rose-400 text-rose-700 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span>≠ Exclude</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Value</label>
                      {(() => {
                        const selectedColObj = filterableColumns.find((c) => String(c.key) === newFilterCol);
                        if (selectedColObj?.filterType === 'select' && Array.isArray(selectedColObj.filterOptions) && selectedColObj.filterOptions.length > 0) {
                          return (
                            <Select value={newFilterVal} onValueChange={setNewFilterVal}>
                              <SelectTrigger className="h-8 text-xs bg-white">
                                <SelectValue placeholder="Select value..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                {selectedColObj.filterOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        }
                        return (
                          <Input
                            value={newFilterVal}
                            onChange={(e) => setNewFilterVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddFilterFromPopover();
                              }
                            }}
                            placeholder={newFilterMode === 'exclude' ? "Value to exclude..." : "Value to match..."}
                            className="h-8 text-xs bg-white"
                          />
                        );
                      })()}
                    </div>

                    <Button
                      size="sm"
                      disabled={!newFilterCol || !newFilterVal.trim()}
                      onClick={handleAddFilterFromPopover}
                      className="w-full h-8 text-xs font-semibold"
                    >
                      Apply Filter Tag
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Group By Selector Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 gap-1.5 font-medium transition-colors",
                      activeGroupBy
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                    title="Group rows by specific column"
                  >
                    <Folders className="h-3.5 w-3.5 text-indigo-600" />
                    <span>
                      {activeGroupBy
                        ? `Group: ${columns.find((c) => String(c.key) === activeGroupBy)?.label || activeGroupBy}`
                        : 'Group By'}
                    </span>
                    {activeGroupBy && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupByChange(null);
                        }}
                        className="ml-1 hover:bg-indigo-200/60 p-0.5 rounded-full"
                        title="Clear grouping"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-2 space-y-1">
                  <div className="px-2 py-1 border-b text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Group Rows By</span>
                    {activeGroupBy && (
                      <button
                        type="button"
                        onClick={() => handleGroupByChange(null)}
                        className="text-[10px] text-rose-600 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGroupByChange(null)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                      !activeGroupBy ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-slate-100 text-slate-700"
                    )}
                  >
                    <span>None (Flat List)</span>
                    {!activeGroupBy && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                  </button>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                    {columns.map((col) => {
                      const colKey = String(col.key);
                      const isSelected = activeGroupBy === colKey;
                      return (
                        <button
                          key={colKey}
                          type="button"
                          onClick={() => handleGroupByChange(colKey)}
                          className={cn(
                            "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                            isSelected ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-slate-100 text-slate-700"
                          )}
                        >
                          <span className="truncate">{col.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {headerActions}

              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onRefresh}>
                <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                <span>Refresh</span>
              </Button>
              
              <Button variant="secondary" size="sm" className="h-9 gap-1.5" disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Ready'}</span>
              </Button>

              {enableExport !== false ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 font-medium"
                  onClick={handleExportCurrentPage}
                  disabled={!rows || rows.length === 0}
                  title="Export current page data to Excel (.xlsx)"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export Excel</span>
                </Button>
              ) : null}

              {onVisibleColumnsChange ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5">
                      <Columns3 className="h-3.5 w-3.5" />
                      <span>Columns {visibleList.length}/{columns.length}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3">
                    <p className="text-sm font-semibold mb-2">Toggle Column Visibility</p>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {hideableColumns.map((col) => {
                        const colKey = String(col.key);
                        const isVisible = visibleColumns[colKey] !== false;
                        return (
                          <label key={colKey} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 p-1 rounded">
                            <Checkbox
                              checked={isVisible}
                              onCheckedChange={(checked) => onVisibleColumnsChange({ ...visibleColumns, [colKey]: Boolean(checked) })}
                            />
                            <span>{col.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="pt-2 border-t mt-2 flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => onVisibleColumnsChange(Object.fromEntries(columns.map((column) => [String(column.key), true])))}
                      >
                        Show all columns
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null}

              {/* Table Styling: Custom Column & Row Colors */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-slate-600" />
                    <span>Table Styling</span>
                    {(Object.keys(columnColors || {}).length > 0 || Object.keys(rowColors || {}).length > 0) ? (
                      <Badge variant="secondary" className="ml-0.5 px-1 py-0 text-[10px] h-4 bg-amber-100 text-amber-900 border border-amber-300">
                        {Object.keys(columnColors || {}).length + Object.keys(rowColors || {}).length}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-88 p-3 space-y-3">
                  <div className="border-b pb-2">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Palette className="h-4 w-4 text-blue-600" /> Custom Table Colors
                    </p>
                    <p className="text-xs text-muted-foreground">Pick custom colors per column & row and save preference.</p>
                  </div>

                  {/* Section: Column Colors */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Column Colors</p>
                      {Object.keys(columnColors || {}).length > 0 && onColumnColorsChange ? (
                        <button
                          type="button"
                          onClick={() => onColumnColorsChange({})}
                          className="text-[11px] text-slate-400 hover:text-rose-600 underline"
                        >
                          Clear column colors
                        </button>
                      ) : null}
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 p-1.5 border rounded bg-slate-50/50 custom-scrollbar">
                      {visibleList.map((col) => {
                        const colKey = String(col.key);
                        const currentColor = columnColors?.[colKey] || col.color || '';
                        return (
                          <div key={colKey} className="flex items-center justify-between gap-2 p-1.5 rounded bg-white border border-slate-100 shadow-2xs text-xs">
                            <span className="font-medium truncate flex-1">{col.label}</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  title={`Change ${col.label} color`}
                                  style={{ backgroundColor: currentColor || '#ffffff' }}
                                  className="h-5 w-5 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition-transform shrink-0"
                                />
                              </PopoverTrigger>
                              <PopoverContent side="left" align="center" className="w-68 p-2.5 shadow-lg">
                                <div className="text-xs font-semibold pb-1.5 mb-1.5 border-b flex items-center justify-between">
                                  <span>Color for <b>{col.label}</b></span>
                                  {currentColor ? (
                                    <span className="font-mono text-[10px] text-slate-500">{currentColor}</span>
                                  ) : null}
                                </div>
                                <HexRoundColorPicker
                                  value={currentColor}
                                  onChange={(hex) => onColumnColorsChange?.({ ...columnColors, [colKey]: hex })}
                                  onClear={() => {
                                    const next = { ...columnColors };
                                    delete next[colKey];
                                    onColumnColorsChange?.(next);
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section: Actions */}
                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    {onClearPreferences ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onClearPreferences}
                        disabled={savingPreferences}
                        className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        Reset Defaults
                      </Button>
                    ) : <div />}
                    {onSavePreferences ? (
                      <Button
                        size="sm"
                        onClick={onSavePreferences}
                        disabled={savingPreferences}
                        className="h-8 text-xs font-semibold gap-1.5"
                      >
                        <Save className="h-3 w-3" />
                        <span>{savingPreferences ? 'Saving...' : 'Save Preference'}</span>
                      </Button>
                    ) : null}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filter Tags Strip */}
          {activeFilterTags.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 animate-in fade-in duration-150">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="h-3 w-3 text-slate-400" /> Active Filters:
              </span>
              {activeFilterTags.map((tag) => {
                const isExclude = tag.operator === 'exclude';
                return (
                  <span
                    key={tag.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-all",
                      isExclude
                        ? "bg-rose-50 border-rose-200 text-rose-800"
                        : "bg-blue-50 border-blue-200 text-blue-800"
                    )}
                  >
                    <span className="font-semibold">{tag.label || tag.key}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTagMode(tag.id)}
                      title="Click to toggle between Include (=) and Exclude (≠)"
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors",
                        isExclude
                          ? "bg-rose-100 border-rose-300 text-rose-900 hover:bg-rose-200"
                          : "bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200"
                      )}
                    >
                      {isExclude ? '≠ NOT' : '= IS'}
                    </button>
                    <span className="font-mono">{tag.value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      title={`Remove ${tag.label || tag.key} filter`}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
              {activeFilterTags.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAllTags}
                  className="text-xs text-slate-400 hover:text-slate-700 underline pl-1.5 font-medium"
                >
                  Clear all
                </button>
              ) : null}
            </div>
          ) : null}
        </CardHeader>
    </>
  );
}
