/**
 * @hots/table-engine — public types
 * Head (assembles all parts): src/ReusableTableEngine.tsx
 * Source: HOTS/src/components/report/ReusableTableEngine.tsx via the package monolith, lines 57–162 (split 2026-10-06).
 */

import React from 'react';

export type ReusableFieldMode = 'readonly' | 'editable';

export interface ReusableColumn<T> {
  key: keyof T | string;
  label: string;
  mode?: ReusableFieldMode;
  widthClass?: string;
  color?: string;
  formatter?: (row: T) => React.ReactNode;
  onSaveField?: string;
  sortable?: boolean;
  filterable?: boolean;
  hideable?: boolean;
  filterType?: 'text' | 'select' | 'date_range' | string;
  filterOptions?: Array<{ label: string; value: string }>;
}

export type ReusableSortDirection = 'asc' | 'desc' | null;

export interface FilterTag {
  id: string;
  key: string;
  label?: string;
  operator: 'include' | 'exclude';
  value: string;
}

export interface SavedViewPreset {
  id: string;
  name: string;
  isDefault?: boolean;
  filterTags?: FilterTag[];
  sortKey?: string | null;
  sortDirection?: ReusableSortDirection;
  visibleColumns?: Record<string, boolean>;
  columnOrder?: string[];
  columnColors?: Record<string, string>;
  rowColors?: Record<string, string>;
  search?: string;
  pageSize?: number;
}

/** Persists saved view presets. Default (inside HotsCoreProvider): HOTS user prefs `/hotsprefs/report_table/<reportKey>_saved_views`. */
export interface SavedViewsAdapter {
  load: (reportKey: string) => Promise<SavedViewPreset[] | null>;
  save: (reportKey: string, views: SavedViewPreset[]) => Promise<void>;
}

export interface ReusableTableEngineProps<T extends Record<string, any>> {
  /** Optional: override where saved views are stored. Pass `null` to disable persistence. */
  savedViewsAdapter?: SavedViewsAdapter | null;
  title: string;
  description?: string;
  reportKey?: string;
  rows: T[];
  totalRows?: number;
  loading?: boolean;
  saving?: boolean;
  errorMessage?: string;
  columns: ReusableColumn<T>[];
  visibleColumns: Record<string, boolean>;
  onVisibleColumnsChange?: (next: Record<string, boolean>) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (nextOrder: string[]) => void;
  onRefresh?: () => void;
  onCellSave?: (row: T, field: string, value: string) => Promise<void> | void;
  getRowKey?: (row: T, rowIndex: number) => React.Key;
  isCellEditable?: (row: T, column: ReusableColumn<T>) => boolean;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  /** Additive Cineva option: a parent owns search and supplies already filtered rows. */
  hideSearch?: boolean;
  categoryValue?: string;
  categoryOptions?: Array<{ value: string; label: string }>;
  onCategoryChange?: (value: string) => void;
  page?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (value: number) => void;
  sortKey?: string | null;
  sortDirection?: ReusableSortDirection;
  onSortChange?: (key: string | null, direction: ReusableSortDirection) => void;
  groupBy?: string | null;
  onGroupByChange?: (key: string | null) => void;
  filterTags?: FilterTag[];
  onFilterTagsChange?: (tags: FilterTag[]) => void;
  columnFilters?: Record<string, string>;
  onColumnFilterChange?: (key: string, value: string) => void;
  onClearColumnFilters?: () => void;
  columnColors?: Record<string, string>;
  onColumnColorsChange?: (colors: Record<string, string>) => void;
  rowColors?: Record<string, string>;
  onRowColorsChange?: (colors: Record<string, string>) => void;
  onSavePreferences?: () => Promise<void> | void;
  onClearPreferences?: () => Promise<void> | void;
  savingPreferences?: boolean;
  enableExport?: boolean;
  onExportExcel?: (data: T[], visibleColumns: ReusableColumn<T>[]) => void;
  maxHeight?: string;
  containerClassName?: string;
  selectable?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (keys: React.Key[], selectedRows: T[]) => void;
  headerActions?: React.ReactNode;
}
