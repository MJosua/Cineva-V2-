/**
 * @hots/table-engine — state, effects and handlers (no JSX)
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 502–1149 (split 2026-10-06).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useColumnOrder } from './useColumnOrder';
import { useTableSelection } from './useTableSelection';
import { useTableGrouping, useGroupedRows } from './useTableGrouping';
import { useOptionalHotsCore } from '@hots/app-core';

import { exportRowsToXlsx } from '../export';
import type { ReusableColumn, FilterTag, SavedViewPreset, SavedViewsAdapter, ReusableTableEngineProps } from '../types';

export function useTableEngine<T extends Record<string, any>>(props: ReusableTableEngineProps<T>) {
  const {
  title,
  description,
  reportKey,
  rows = [],
  totalRows,
  loading,
  saving,
  errorMessage,
  columns = [],
  visibleColumns = {},
  onVisibleColumnsChange,
  columnOrder: propColumnOrder,
  onColumnOrderChange,
  onRefresh,
  onCellSave,
  getRowKey,
  isCellEditable,
  onSearchChange,
  searchValue = '',
  hideSearch = false,
  categoryValue,
  categoryOptions,
  onCategoryChange,
  page = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  sortKey,
  sortDirection,
  onSortChange,
  groupBy,
  onGroupByChange,
  filterTags,
  onFilterTagsChange,
  columnFilters = {},
  onColumnFilterChange,
  onClearColumnFilters,
  columnColors = {},
  onColumnColorsChange,
  rowColors = {},
  onRowColorsChange,
  onSavePreferences,
  onClearPreferences,
  savingPreferences = false,
  enableExport = true,
  onExportExcel,
  maxHeight,
  containerClassName,
  selectable = false,
  selectedRowKeys = [],
  onSelectionChange,
  headerActions,
  savedViewsAdapter,
  } = props;
  const core = useOptionalHotsCore();
  const viewsAdapter = useMemo<SavedViewsAdapter | null>(() => {
    if (savedViewsAdapter !== undefined) return savedViewsAdapter;
    if (!core) return null;
    return {
      load: async (key) => {
        const res = await core.http.get(`/hotsprefs/report_table/${key}_saved_views`);
        return Array.isArray(res.data?.value) ? res.data.value : null;
      },
      save: async (key, views) => {
        await core.http.post(`/hotsprefs/report_table/${key}_saved_views`, { value: views });
      },
    };
  }, [savedViewsAdapter, core]);
  const [localSearch, setLocalSearch] = useState('');
  const [internalFilterTags, setInternalFilterTags] = useState<FilterTag[]>(() => {
    return Object.entries(columnFilters)
      .filter(([, val]) => val && val.trim())
      .map(([key, val], idx) => {
        const isExclude = val.startsWith('!') || val.startsWith('-') || val.startsWith('!=') || val.toLowerCase().startsWith('not:');
        const cleanVal = val.replace(/^(!=|<>|!|-|not:)\s*/i, '');
        return {
          id: `${key}_${idx}_${Date.now()}`,
          key,
          label: columns.find((c) => String(c.key) === key)?.label || key,
          operator: isExclude ? 'exclude' : 'include',
          value: cleanVal,
        };
      });
  });

  const { ORDER_STORAGE_KEY, internalColumnOrder, setInternalColumnOrder, columnOrder,
    draggedColKey, setDraggedColKey, dragOverColKey, setDragOverColKey,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useColumnOrder(props);

  // Saved View Presets
  const [savedViews, setSavedViews] = useState<SavedViewPreset[]>([
    { id: 'default', name: 'Show All', isDefault: true },
  ]);
  const [activeViewId, setActiveViewId] = useState<string>('default');
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [savingViews, setSavingViews] = useState(false);
  const [hoverCopiedCellKey, setHoverCopiedCellKey] = useState<string | null>(null);

  const { internalGroupBy, setInternalGroupBy, activeGroupBy, collapsedGroups,
    setCollapsedGroups, toggleGroupCollapse, handleGroupByChange } = useTableGrouping(groupBy, onGroupByChange);
  const [jumpToPageVal, setJumpToPageVal] = useState<string>('');

  // Load Saved Views from User Preferences
  useEffect(() => {
    if (!reportKey || !viewsAdapter) return;
    async function loadSavedViews() {
      try {
        const value = await viewsAdapter!.load(reportKey!);
        if (value && value.length > 0) {
          const loaded = value.map((v: SavedViewPreset) =>
            v.id === 'default' ? { ...v, name: 'Show All', isDefault: true } : v
          );
          setSavedViews(loaded);
        }
      } catch (_err) {
        // use default fallback
      }
    }
    void loadSavedViews();
  }, [reportKey, viewsAdapter]);

  const saveViewsToDb = async (views: SavedViewPreset[]) => {
    if (!reportKey || !viewsAdapter) return;
    setSavingViews(true);
    try {
      await viewsAdapter.save(reportKey, views);
    } catch (err) {
      console.error('Failed to save view preset to DB', err);
    } finally {
      setSavingViews(false);
    }
  };

  const handleApplyViewPreset = (preset: SavedViewPreset) => {
    setActiveViewId(preset.id);
    if (preset.isDefault || preset.id === 'default') {
      if (onFilterTagsChange) onFilterTagsChange([]);
      else setInternalFilterTags([]);
      onClearColumnFilters?.();
      handleSearchChange('');
      if (onSortChange) onSortChange(null, null);
      if (onVisibleColumnsChange) {
        onVisibleColumnsChange(Object.fromEntries(columns.map((c) => [String(c.key), true])));
      }
      const defaultOrder = columns.map((c) => String(c.key));
      setInternalColumnOrder(defaultOrder);
      if (onColumnOrderChange) onColumnOrderChange(defaultOrder);
      if (ORDER_STORAGE_KEY) {
        try {
          localStorage.removeItem(ORDER_STORAGE_KEY);
        } catch (_e) {}
      }
      if (onColumnColorsChange) onColumnColorsChange({});
      if (onRowColorsChange) onRowColorsChange({});
      return;
    }

    if (preset.filterTags && onFilterTagsChange) onFilterTagsChange(preset.filterTags);
    else if (onFilterTagsChange) onFilterTagsChange([]);
    if (preset.sortKey !== undefined && onSortChange) onSortChange(preset.sortKey, preset.sortDirection || null);
    if (preset.visibleColumns && onVisibleColumnsChange) onVisibleColumnsChange(preset.visibleColumns);
    if (preset.columnOrder) {
      if (onColumnOrderChange) onColumnOrderChange(preset.columnOrder);
      setInternalColumnOrder(preset.columnOrder);
      if (ORDER_STORAGE_KEY) localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(preset.columnOrder));
    }
    if (preset.columnColors && onColumnColorsChange) onColumnColorsChange(preset.columnColors);
    if (preset.rowColors && onRowColorsChange) onRowColorsChange(preset.rowColors);
    if (preset.search !== undefined) handleSearchChange(preset.search);
  };

  const handleCreateViewPreset = () => {
    const trimmed = newViewName.trim();
    if (!trimmed) return;
    const newPreset: SavedViewPreset = {
      id: `view_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      filterTags: activeFilterTags,
      sortKey,
      sortDirection,
      visibleColumns,
      columnOrder,
      columnColors,
      rowColors,
      search,
    };
    const nextViews = [...savedViews, newPreset];
    setSavedViews(nextViews);
    setActiveViewId(newPreset.id);
    setNewViewName('');
    setSaveViewOpen(false);
    void saveViewsToDb(nextViews);
  };

  const handleDuplicateView = (view: SavedViewPreset) => {
    const newPreset: SavedViewPreset = {
      ...view,
      id: `view_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${view.name} (Copy)`,
      isDefault: false,
    };
    const nextViews = [...savedViews, newPreset];
    setSavedViews(nextViews);
    setActiveViewId(newPreset.id);
    void saveViewsToDb(nextViews);
  };

  const handleRenameView = (viewId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const nextViews = savedViews.map((v) => (v.id === viewId ? { ...v, name: trimmed } : v));
    setSavedViews(nextViews);
    void saveViewsToDb(nextViews);
    setRenamingView(null);
  };

  const handleUpdateCurrentView = (viewId: string) => {
    const nextViews = savedViews.map((v) => {
      if (v.id === viewId) {
        return {
          ...v,
          filterTags: activeFilterTags,
          sortKey,
          sortDirection,
          visibleColumns,
          columnOrder,
          columnColors,
          rowColors,
          search,
        };
      }
      return v;
    });
    setSavedViews(nextViews);
    void saveViewsToDb(nextViews);
  };

  const handleDeleteView = (viewId: string) => {
    if (viewId === 'default') return;
    const nextViews = savedViews.filter((v) => v.id !== viewId);
    setSavedViews(nextViews);
    if (activeViewId === viewId) {
      handleApplyViewPreset(savedViews[0] || { id: 'default', name: 'Default View' });
    }
    void saveViewsToDb(nextViews);
  };

  const [viewContextMenu, setViewContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    view: SavedViewPreset | null;
  }>({ visible: false, x: 0, y: 0, view: null });
  const [renamingView, setRenamingView] = useState<SavedViewPreset | null>(null);
  const [renameInputVal, setRenameInputVal] = useState('');

  const handleViewContextMenu = (e: React.MouseEvent, view: SavedViewPreset) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 220;
    const menuHeight = 180;
    const x = Math.max(10, Math.min(e.clientX, window.innerWidth - menuWidth - 16));
    const y = Math.max(10, Math.min(e.clientY, window.innerHeight - menuHeight - 16));
    setViewContextMenu({
      visible: true,
      x,
      y,
      view,
    });
  };

  const isControlledTags = Boolean(filterTags !== undefined && onFilterTagsChange);
  const activeFilterTags = isControlledTags ? (filterTags || []) : internalFilterTags;
  const safeRows = useMemo(() => {
    return Array.isArray(rows)
      ? rows.filter((row): row is T => Boolean(row) && typeof row === 'object')
      : [];
  }, [rows]);

  // Apply in-memory client-side filtering when table is not server-controlled
  const displayRows = useMemo(() => {
    if (isControlledTags) return safeRows;
    if (activeFilterTags.length === 0) return safeRows;

    const tagsByColumn = activeFilterTags.reduce<Record<string, FilterTag[]>>((grouped, tag) => {
      (grouped[tag.key] ||= []).push(tag);
      return grouped;
    }, {});

    return safeRows.filter((row) => {
      return Object.entries(tagsByColumn).every(([key, tags]) => {
        const value = String(row[key] ?? '').toLowerCase();
        const includes = tags.filter((t) => t.operator === 'include');
        const excludes = tags.filter((t) => t.operator === 'exclude');
        const matchesInclude = includes.length === 0 || includes.some((t) => value.includes(t.value.toLowerCase()));
        const matchesExclude = excludes.every((t) => !value.includes(t.value.toLowerCase()));
        return matchesInclude && matchesExclude;
      });
    });
  }, [safeRows, isControlledTags, activeFilterTags]);

  const groupedEntries = useGroupedRows(displayRows, activeGroupBy, onGroupByChange);

  const { allCurrentRowKeys, isAllSelected, isSomeSelected, handleToggleSelectAll, handleToggleRowSelect } =
    useTableSelection(displayRows, getRowKey, selectedRowKeys, onSelectionChange);

  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(() => new Set());
  const [addFilterOpen, setAddFilterOpen] = useState(false);
  const [newFilterCol, setNewFilterCol] = useState<string>('');
  const [newFilterMode, setNewFilterMode] = useState<'include' | 'exclude'>('include');
  const [newFilterVal, setNewFilterVal] = useState<string>('');
  const search = onSearchChange ? searchValue : localSearch;

  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  // Reorder visible columns based on columnOrder
  const visibleList = useMemo(() => {
    const rawVisible = columns.filter((col) => visibleColumns[String(col.key)] !== false);
    if (!columnOrder || columnOrder.length === 0) return rawVisible;
    return [...rawVisible].sort((a, b) => {
      const aIdx = columnOrder.indexOf(String(a.key));
      const bIdx = columnOrder.indexOf(String(b.key));
      const validA = aIdx === -1 ? 999 : aIdx;
      const validB = bIdx === -1 ? 999 : bIdx;
      return validA - validB;
    });
  }, [columns, visibleColumns, columnOrder]);

  const hideableColumns = useMemo(() => columns.filter((col) => col.hideable !== false), [columns]);
  const filterableColumns = useMemo(() => columns.filter((col) => col.filterable !== false), [columns]);

  const setTags = (nextTags: FilterTag[]) => {
    if (onFilterTagsChange) {
      onFilterTagsChange(nextTags);
    } else {
      setInternalFilterTags(nextTags);
      if (onColumnFilterChange) {
        const map: Record<string, string> = {};
        for (const t of nextTags) {
          map[t.key] = t.operator === 'exclude' ? `!${t.value}` : t.value;
        }
        for (const col of columns) {
          const k = String(col.key);
          if (!map[k] && columnFilters[k]) onColumnFilterChange(k, '');
          else if (map[k] && map[k] !== columnFilters[k]) onColumnFilterChange(k, map[k]);
        }
      }
    }
  };

  const handleAddTag = (tag: { key: string; label?: string; operator: 'include' | 'exclude'; value: string }) => {
    const newTag: FilterTag = {
      id: `${tag.key}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      key: tag.key,
      label: tag.label || columns.find((c) => String(c.key) === tag.key)?.label || tag.key,
      operator: tag.operator,
      value: tag.value.trim(),
    };
    setTags([...activeFilterTags, newTag]);
  };

  const handleRemoveTag = (id: string) => {
    setTags(activeFilterTags.filter((t) => t.id !== id));
  };

  const handleToggleTagMode = (id: string) => {
    setTags(
      activeFilterTags.map((t) =>
        t.id === id ? { ...t, operator: t.operator === 'exclude' ? 'include' : 'exclude' } : t
      )
    );
  };

  const handleClearAllTags = () => {
    setTags([]);
    onClearColumnFilters?.();
  };

  const handleAddFilterFromPopover = () => {
    if (!newFilterCol || !newFilterVal.trim()) return;
    handleAddTag({
      key: newFilterCol,
      label: columns.find((c) => String(c.key) === newFilterCol)?.label,
      operator: newFilterMode,
      value: newFilterVal.trim(),
    });
    setNewFilterVal('');
    setAddFilterOpen(false);
  };

  const changeVisibility = (key: string, checked: boolean) => {
    if (!onVisibleColumnsChange) return;
    if (!checked && visibleList.length <= 1) return;
    onVisibleColumnsChange({ ...visibleColumns, [key]: checked });
  };

  const changeSort = (key: string) => {
    if (!onSortChange) return;
    if (sortKey !== key) {
      onSortChange(key, 'asc');
    } else if (sortDirection === 'asc') {
      onSortChange(key, 'desc');
    } else {
      onSortChange(null, null);
    }
  };

  const toggleFilter = (key: string) => {
    setExpandedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    column: ReusableColumn<T> | null;
    row?: T | null;
    rowKey?: string | null;
    cellValue?: unknown;
  }>({ visible: false, x: 0, y: 0, column: null, row: null, rowKey: null, cellValue: null });
  const [copiedCell, setCopiedCell] = useState(false);

  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      setViewContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseMenu();
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleContextMenu = (
    e: React.MouseEvent,
    column: ReusableColumn<T>,
    row?: T | null,
    rowKey?: string | null,
    cellValue?: unknown
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 320;
    const menuHeight = cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== '' ? 410 : 270;
    const x = Math.max(10, Math.min(e.clientX, window.innerWidth - menuWidth - 16));
    const y = Math.max(10, Math.min(e.clientY, window.innerHeight - menuHeight - 16));
    setCopiedCell(false);
    setContextMenu({
      visible: true,
      x,
      y,
      column,
      row: row ?? null,
      rowKey: rowKey ?? null,
      cellValue: cellValue ?? null,
    });
  };

  const handleExportCurrentPage = () => {
    if (!displayRows || displayRows.length === 0) return;
    if (onExportExcel) {
      onExportExcel(displayRows, visibleList);
      return;
    }
    const exportData = displayRows.map((row) => {
      const rowObj: Record<string, any> = {};
      visibleList.forEach((col) => {
        const val = row[col.key as keyof T];
        rowObj[col.label || String(col.key)] = val !== undefined && val !== null ? val : '';
      });
      return rowObj;
    });

    const safeTitle = (title || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    const pageStr = page ? `_Page${page}` : '';
    const dateStr = new Date().toISOString().split('T')[0];
    void exportRowsToXlsx(exportData, `${safeTitle}${pageStr}_${dateStr}.xlsx`, 'ReportData');
  };

  return {
    title,
    description,
    reportKey,
    rows,
    totalRows,
    loading,
    saving,
    errorMessage,
    columns,
    visibleColumns,
    onVisibleColumnsChange,
    propColumnOrder,
    onColumnOrderChange,
    onRefresh,
    onCellSave,
    getRowKey,
    isCellEditable,
    onSearchChange,
    searchValue,
    hideSearch,
    categoryValue,
    categoryOptions,
    onCategoryChange,
    page,
    totalPages,
    onPrevPage,
    onNextPage,
    onPageChange,
    pageSize,
    onPageSizeChange,
    sortKey,
    sortDirection,
    onSortChange,
    groupBy,
    onGroupByChange,
    filterTags,
    onFilterTagsChange,
    columnFilters,
    onColumnFilterChange,
    onClearColumnFilters,
    columnColors,
    onColumnColorsChange,
    rowColors,
    onRowColorsChange,
    onSavePreferences,
    onClearPreferences,
    savingPreferences,
    enableExport,
    onExportExcel,
    maxHeight,
    containerClassName,
    selectable,
    selectedRowKeys,
    onSelectionChange,
    headerActions,
    savedViewsAdapter,
    core,
    viewsAdapter,
    localSearch,
    setLocalSearch,
    internalFilterTags,
    setInternalFilterTags,
    ORDER_STORAGE_KEY,
    internalColumnOrder,
    setInternalColumnOrder,
    columnOrder,
    draggedColKey,
    setDraggedColKey,
    dragOverColKey,
    setDragOverColKey,
    savedViews,
    setSavedViews,
    activeViewId,
    setActiveViewId,
    saveViewOpen,
    setSaveViewOpen,
    newViewName,
    setNewViewName,
    savingViews,
    setSavingViews,
    hoverCopiedCellKey,
    setHoverCopiedCellKey,
    internalGroupBy,
    setInternalGroupBy,
    activeGroupBy,
    collapsedGroups,
    setCollapsedGroups,
    jumpToPageVal,
    setJumpToPageVal,
    toggleGroupCollapse,
    handleGroupByChange,
    saveViewsToDb,
    handleApplyViewPreset,
    handleCreateViewPreset,
    handleDuplicateView,
    handleRenameView,
    handleUpdateCurrentView,
    handleDeleteView,
    viewContextMenu,
    setViewContextMenu,
    renamingView,
    setRenamingView,
    renameInputVal,
    setRenameInputVal,
    handleViewContextMenu,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    isControlledTags,
    activeFilterTags,
    safeRows,
    displayRows,
    groupedEntries,
    allCurrentRowKeys,
    isAllSelected,
    isSomeSelected,
    handleToggleSelectAll,
    handleToggleRowSelect,
    expandedFilters,
    setExpandedFilters,
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
    visibleList,
    hideableColumns,
    filterableColumns,
    setTags,
    handleAddTag,
    handleRemoveTag,
    handleToggleTagMode,
    handleClearAllTags,
    handleAddFilterFromPopover,
    changeVisibility,
    changeSort,
    toggleFilter,
    contextMenu,
    setContextMenu,
    copiedCell,
    setCopiedCell,
    handleContextMenu,
    handleExportCurrentPage,
  };
}

/** Everything the view parts read: props (with defaults) + state + handlers. */
export type TableEngineCtx<T extends Record<string, any> = Record<string, any>> = ReturnType<typeof useTableEngine<T>>;
