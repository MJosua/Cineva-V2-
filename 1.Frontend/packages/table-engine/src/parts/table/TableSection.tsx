/**
 * @hots/table-engine — card content: table head, grouped/plain rows, cells
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 1765–2092 (split 2026-10-06).
 */

import React from 'react';
import { Badge } from '@hots/ui-kit';
import { CardContent } from '@hots/ui-kit';
import { Select } from '@hots/ui-kit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@hots/ui-kit';
import { Checkbox } from '@hots/ui-kit';
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, ChevronsUpDown, Copy, Filter, Folders, GripVertical } from 'lucide-react';
import { cn } from '@hots/ui-kit';

import { EditableCell } from '../../cells/EditableCell';
import { ColumnSelectFilterInput } from '../../controls/ColumnSelectFilterInput';
import { ColumnFilterInput } from '../../controls/ColumnFilterInput';

import type { TableEngineCtx } from '../../state/useTableEngine';

type T = Record<string, any>;

export function TableSection({ ctx }: { ctx: TableEngineCtx<T> }) {
  const {
    title,
    rows,
    columns,
    onCellSave,
    getRowKey,
    isCellEditable,
    sortKey,
    sortDirection,
    onSortChange,
    columnColors,
    rowColors,
    maxHeight,
    containerClassName,
    selectable,
    selectedRowKeys,
    draggedColKey,
    dragOverColKey,
    hoverCopiedCellKey,
    setHoverCopiedCellKey,
    activeGroupBy,
    collapsedGroups,
    toggleGroupCollapse,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    activeFilterTags,
    displayRows,
    groupedEntries,
    isAllSelected,
    isSomeSelected,
    handleToggleSelectAll,
    handleToggleRowSelect,
    expandedFilters,
    visibleList,
    handleAddTag,
    changeSort,
    toggleFilter,
    handleContextMenu,
  } = ctx;

  return (
    <>
        <CardContent className="p-0">
          {visibleList.length === 0 ? (
            <div className="m-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
              Column configuration is unavailable. Refresh after the backend service has been restarted.
            </div>
          ) : (
          <Table 
            className="min-w-[1600px] border-separate border-spacing-0"
            containerClassName={cn(
              "overflow-auto relative max-h-[calc(100vh-280px)] min-h-[400px] custom-scrollbar rounded-b-lg border-t border-slate-100",
              maxHeight,
              containerClassName
            )}
          >
            <TableHeader className="sticky top-0 z-30 bg-slate-50 shadow-sm border-b border-slate-200">
              <TableRow className="hover:bg-transparent bg-slate-50 border-b-0">
                {selectable ? (
                  <TableHead className="w-12 min-w-12 max-w-12 sticky top-0 left-0 z-40 bg-slate-50/95 backdrop-blur-sm border-b border-r border-slate-200 text-center px-2 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    <div className="flex items-center justify-center py-2">
                      <Checkbox
                        checked={isAllSelected ? true : (isSomeSelected ? 'indeterminate' : false)}
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all rows"
                      />
                    </div>
                  </TableHead>
                ) : null}
                {visibleList.map((col) => {
                  const colKey = String(col.key);
                  const colTags = activeFilterTags.filter((t) => t.key === colKey);
                  const hasExclude = colTags.some((t) => t.operator === 'exclude');
                  const isExpanded = expandedFilters.has(colKey) || colTags.length > 0;
                  const isDragTarget = dragOverColKey === colKey;

                  return (
                  <TableHead 
                    key={colKey} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, colKey)}
                    onDragOver={(e) => handleDragOver(e, colKey)}
                    onDrop={(e) => handleDrop(e, colKey)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, col)}
                    title={`Drag to reorder. Right-click to customize color for ${col.label}`}
                    className={cn(
                      "sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 text-slate-700 shadow-[0_1px_0_0_rgba(226,232,240,1)] select-none cursor-grab active:cursor-grabbing transition-colors",
                      isDragTarget && "border-l-4 border-l-blue-600 bg-blue-50/60",
                      draggedColKey === colKey && "opacity-40",
                      col.widthClass
                    )}
                  >
                    <div className="min-w-32 space-y-2 py-2">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <GripVertical className="h-3 w-3 text-slate-300 group-hover:text-slate-500 shrink-0 cursor-grab" />
                          {col.sortable && onSortChange ? (
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left font-semibold hover:text-slate-950 truncate"
                              onClick={() => changeSort(colKey)}
                              title={`Sort by ${col.label}`}
                            >
                              <span className="truncate">{col.label}</span>
                              {sortKey === colKey && sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 shrink-0" /> : null}
                              {sortKey === colKey && sortDirection === 'desc' ? <ArrowDown className="h-3.5 w-3.5 shrink-0" /> : null}
                              {sortKey !== colKey ? <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : null}
                            </button>
                          ) : (
                            <span className="font-semibold truncate">{col.label}</span>
                          )}
                        </div>

                        {col.filterable ? (
                          <button
                            type="button"
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} ${col.label} filter`}
                            title={`${isExpanded ? 'Hide filter input' : 'Show filter input'} for ${col.label}`}
                            className={cn(
                              "rounded p-1 transition-colors flex items-center gap-0.5 shrink-0",
                              colTags.length > 0
                                ? hasExclude
                                  ? "bg-rose-50 text-rose-600 font-bold"
                                  : "bg-blue-50 text-blue-600 font-bold"
                                : isExpanded
                                ? "bg-slate-100 text-slate-700"
                                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            )}
                            onClick={() => toggleFilter(colKey)}
                          >
                            <Filter className="h-3.5 w-3.5" />
                            {colTags.length > 0 ? (
                              <span className="text-[10px] font-bold leading-none">{colTags.length}</span>
                            ) : null}
                          </button>
                        ) : null}
                      </div>
                      {col.filterable && isExpanded ? (
                        col.filterType === 'select' && Array.isArray(col.filterOptions) && col.filterOptions.length > 0 ? (
                          <ColumnSelectFilterInput
                            columnKey={colKey}
                            label={col.label}
                            options={col.filterOptions}
                            onAddTag={handleAddTag}
                          />
                        ) : (
                          <ColumnFilterInput
                            columnKey={colKey}
                            label={col.label}
                            onAddTag={handleAddTag}
                          />
                        )
                      ) : null}
                    </div>
                  </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(selectable ? 1 : 0) + visibleList.length} className="h-28 text-center text-muted-foreground border-b border-slate-100">
                    No report rows found.
                  </TableCell>
                </TableRow>
              ) : null}
              {groupedEntries ? (
                groupedEntries.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.groupValue);
                  const totalCols = (selectable ? 1 : 0) + visibleList.length;
                  return (
                    <React.Fragment key={`group_${group.groupValue}`}>
                      {/* Group Header Row */}
                      <TableRow className="bg-slate-100/90 hover:bg-slate-200/80 border-b border-slate-200 font-semibold cursor-pointer select-none transition-colors" onClick={() => toggleGroupCollapse(group.groupValue)}>
                        <TableCell colSpan={totalCols} className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                            )}
                            <Folders className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span className="text-xs font-bold text-slate-800">
                              {columns.find((c) => String(c.key) === activeGroupBy)?.label || activeGroupBy}:
                            </span>
                            <span className="font-mono text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
                              {group.groupValue || '(Empty)'}
                            </span>
                            <Badge variant="secondary" className="ml-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {group.count.toLocaleString('id-ID')} {group.count === 1 ? 'item' : 'items'}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Group Child Rows */}
                      {!isCollapsed && group.groupRows.map((row, rowIndex) => {
                        const rowKey = getRowKey ? String(getRowKey(row, rowIndex)) : String(row.row_key || row.ticket_id || row.id || rowIndex);
                        const rowBg = rowColors?.[rowKey];
                        const isSelected = selectedRowKeys.some((k) => String(k) === rowKey);

                        return (
                          <TableRow 
                            key={rowKey} 
                            className={cn("hover:bg-slate-50 transition-colors bg-white", isSelected && "bg-blue-50/40")}
                            style={rowBg ? { backgroundColor: rowBg } : undefined}
                          >
                            {selectable ? (
                              <TableCell className="w-12 min-w-12 max-w-12 sticky left-0 z-20 bg-slate-50/95 border-b border-r border-slate-100 text-center px-2">
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggleRowSelect(rowKey, row)}
                                    aria-label={`Select row ${rowKey}`}
                                  />
                                </div>
                              </TableCell>
                            ) : null}
                            {visibleList.map((col) => {
                              const key = String(col.key);
                              const mode = col.mode || 'readonly';
                              const customColBg = columnColors?.[key];
                              const bg = rowBg || customColBg || col.color || (mode === 'editable' ? '#ffffff' : '#f8fafc');
                              const current = row[col.key as keyof T];
                              const editable = mode === 'editable'
                                && Boolean(onCellSave)
                                && (isCellEditable ? isCellEditable(row, col) : true);
                              const cellKey = `${rowKey}_${key}`;

                              return (
                                <TableCell 
                                  key={key} 
                                  style={{ backgroundColor: bg }} 
                                  onContextMenu={(e) => handleContextMenu(e, col, row, rowKey, current)}
                                  title={`Right-click to filter, copy, or customize "${current ?? col.label}"`}
                                  className={cn(
                                    "align-top border-b border-slate-100 transition-all duration-100 relative group/cell cursor-pointer select-text pl-4",
                                    "hover:!bg-blue-50/70 hover:!ring-2 hover:!ring-inset hover:!ring-blue-400/80 hover:shadow-xs",
                                    col.widthClass
                                  )}
                                >
                                  {String(current ?? '').trim() !== '' && !editable ? (
                                    <button
                                      type="button"
                                      title="Copy cell value"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(String(current));
                                        setHoverCopiedCellKey(cellKey);
                                        setTimeout(() => setHoverCopiedCellKey(null), 1500);
                                      }}
                                      className={cn(
                                        "absolute right-1 top-1 p-1 rounded bg-white/95 border border-slate-200 shadow-2xs opacity-0 group-hover/cell:opacity-100 transition-opacity z-10 hover:bg-slate-100",
                                        hoverCopiedCellKey === cellKey && "opacity-100 bg-emerald-50 border-emerald-300 text-emerald-700"
                                      )}
                                    >
                                      {hoverCopiedCellKey === cellKey ? (
                                        <Check className="h-3 w-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3 w-3 text-slate-500 hover:text-slate-900" />
                                      )}
                                    </button>
                                  ) : null}

                                  {editable && onCellSave ? (
                                    <EditableCell row={row} column={col} current={current} onSave={onCellSave} />
                                  ) : col.formatter ? (
                                    col.formatter(row)
                                  ) : (
                                    <span className="text-sm font-medium">{current ?? '-'}</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                displayRows.map((row, rowIndex) => {
                  const rowKey = getRowKey ? String(getRowKey(row, rowIndex)) : String(row.row_key || row.ticket_id || row.id || rowIndex);
                  const rowBg = rowColors?.[rowKey];
                  const isSelected = selectedRowKeys.some((k) => String(k) === rowKey);

                  return (
                    <TableRow 
                      key={rowKey} 
                      className={cn("hover:bg-slate-50 transition-colors", isSelected && "bg-blue-50/40")}
                      style={rowBg ? { backgroundColor: rowBg } : undefined}
                    >
                      {selectable ? (
                        <TableCell className="w-12 min-w-12 max-w-12 sticky left-0 z-20 bg-slate-50/95 border-b border-r border-slate-100 text-center px-2">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleRowSelect(rowKey, row)}
                              aria-label={`Select row ${rowKey}`}
                            />
                          </div>
                        </TableCell>
                      ) : null}
                      {visibleList.map((col) => {
                        const key = String(col.key);
                        const mode = col.mode || 'readonly';
                        const customColBg = columnColors?.[key];
                        const bg = rowBg || customColBg || col.color || (mode === 'editable' ? '#ffffff' : '#f8fafc');
                        const current = row[col.key as keyof T];
                        const editable = mode === 'editable'
                          && Boolean(onCellSave)
                          && (isCellEditable ? isCellEditable(row, col) : true);
                        const cellKey = `${rowKey}_${key}`;

                        return (
                          <TableCell 
                            key={key} 
                            style={{ backgroundColor: bg }} 
                            onContextMenu={(e) => handleContextMenu(e, col, row, rowKey, current)}
                            title={`Right-click to filter, copy, or customize "${current ?? col.label}"`}
                            className={cn(
                              "align-top border-b border-slate-100 transition-all duration-100 relative group/cell cursor-pointer select-text",
                              "hover:!bg-blue-50/70 hover:!ring-2 hover:!ring-inset hover:!ring-blue-400/80 hover:shadow-xs",
                              col.widthClass
                            )}
                          >
                            {/* Hover Copy Action Icon */}
                            {String(current ?? '').trim() !== '' && !editable ? (
                              <button
                                type="button"
                                title="Copy cell value"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(String(current));
                                  setHoverCopiedCellKey(cellKey);
                                  setTimeout(() => setHoverCopiedCellKey(null), 1500);
                                }}
                                className={cn(
                                  "absolute right-1 top-1 p-1 rounded bg-white/95 border border-slate-200 shadow-2xs opacity-0 group-hover/cell:opacity-100 transition-opacity z-10 hover:bg-slate-100",
                                  hoverCopiedCellKey === cellKey && "opacity-100 bg-emerald-50 border-emerald-300 text-emerald-700"
                                )}
                              >
                                {hoverCopiedCellKey === cellKey ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-slate-500 hover:text-slate-900" />
                                )}
                              </button>
                            ) : null}

                            {editable && onCellSave ? (
                              <EditableCell row={row} column={col} current={current} onSave={onCellSave} />
                            ) : col.formatter ? (
                              col.formatter(row)
                            ) : (
                              <span className="text-sm font-medium">{current ?? '-'}</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
    </>
  );
}
