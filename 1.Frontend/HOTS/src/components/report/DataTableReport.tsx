import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ReusableTableEngine, exportRowsToXlsx, type FilterTag, type ReusableColumn, type ReusableSortDirection } from '@hots/table-engine';
import { Button, Checkbox, Popover, PopoverContent, PopoverTrigger } from '@hots/ui-kit';
import { FileText, Filter, PaintBucket } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cinevaHttp } from '@/platform/clients';
import { API_URL } from '@/config/sourceConfig';
import { buildReportUpdate, getReportValue, persistReportUpdate, prepareReportRows, updateMatchingReportRows, type LegacyReportColumn } from './reportAdapter';

export function DataTableReportPro<T extends object>({ title = 'Report', data, setData, columns, searchKeys = [], ticketKey, detailKey, updateUrl, externalSearch }: {
  title?: string; data: T[]; setData?: Dispatch<SetStateAction<T[]>>; columns: LegacyReportColumn<T>[];
  searchKeys?: (keyof T | string)[]; ticketKey?: keyof T | string; detailKey?: keyof T | string; updateUrl?: string; externalSearch?: string;
}) {
  const [search, setSearch] = useState(''), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const [exactFilters, setExactFilters] = useState<Record<string, string[]>>({}), [tags, setTags] = useState<FilterTag[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null), [sortDirection, setSortDirection] = useState<ReusableSortDirection>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(() => Object.fromEntries(columns.map(c => [String(c.accessor), true])));
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const term = externalSearch ?? search;
  const filtered = useMemo(() => prepareReportRows(data, { search: term, searchKeys, exactFilters, tags, sortKey, sortDirection }), [data, term, searchKeys, exactFilters, tags, sortKey, sortDirection]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setPage(1), [term, exactFilters, tags, sortKey, sortDirection, pageSize]);
  useEffect(() => setVisible(previous => Object.fromEntries(columns.map(c => [String(c.accessor), previous[String(c.accessor)] ?? true]))), [columns]);
  const rowKey = (row: T) => `${ticketKey ? String(getReportValue(row, ticketKey)) : 'row'}:${detailKey ? String(getReportValue(row, detailKey)) : ''}:${data.indexOf(row)}`;

  const saveCell = useCallback(async (row: T, field: string, value: string, color?: string) => {
    if (!ticketKey) throw new Error('A report row identifier is required for editing');
    const ticket = String(getReportValue(row, ticketKey) ?? ''), detail = detailKey ? String(getReportValue(row, detailKey) ?? 'null') : '';
    const column = columns.find(c => String(c.accessor) === field);
    const rawColor = color ?? (column?.colorField ? getReportValue(row, column.colorField) : undefined);
    const cellColor = rawColor == null ? undefined : String(rawColor);
    setSaving(true); setError('');
    try {
      await persistReportUpdate(cinevaHttp, updateUrl || `${API_URL}/hotsdashboard/report_detail/upsert`, buildReportUpdate(ticket, detail, field, value, cellColor, Boolean(updateUrl)));
      setData?.(previous => updateMatchingReportRows(previous, ticketKey, detailKey, ticket, detail, field, value, cellColor));
    } catch (failure) { const problem = failure as { response?: { data?: { message?: string } }; message?: string }; setError(problem.response?.data?.message || problem.message || 'Save failed'); throw failure; }
    finally { setSaving(false); }
  }, [ticketKey, detailKey, columns, updateUrl, setData]);
  const sharedColumns = useMemo<ReusableColumn<T>[]>(() => columns.map(c => ({
    key: String(c.accessor), label: c.header, mode: c.editable && ticketKey && c.accessor !== 'Color' ? 'editable' : 'readonly',
    widthClass: [c.align ? `text-${c.align}` : '', c.sticky ? `sticky ${c.sticky} bg-white z-10 border-r` : ''].join(' '),
    filterable: c.filterable, sortable: c.sortable, filterType: 'select',
    filterOptions: [...new Set(data.map(row => String(getReportValue(row, c.accessor) ?? '')))].filter(Boolean).map(value => ({ label: value, value })),
    ...(c.accessor === 'Color' ? { formatter: (row: T) => <div className="flex items-center gap-2"><span className="h-6 w-6 rounded border" style={{ backgroundColor: String(getReportValue(row, 'Color') || '#ffffff') }} />{ticketKey && <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Change row color"><PaintBucket className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="flex flex-wrap gap-2 w-44">{['#fff59d','#c8e6c9','#bbdefb','#ffcdd2','#f0f0f0'].map(color => <button key={color} type="button" className="h-6 w-6 border rounded" style={{ backgroundColor: color }} aria-label={`Use color ${color}`} onClick={() => { void saveCell(row, 'Color', String(getReportValue(row, 'Remarks') ?? ''), color).catch(() => undefined); }} />)}</PopoverContent></Popover>}</div> } : {}),
  })), [columns, data, ticketKey, saveCell]);
  const rowColors = Object.fromEntries(data.filter(row => getReportValue(row, 'Color')).map(row => [rowKey(row), String(getReportValue(row, 'Color'))]));
  const visibleColumns = columns.filter(c => visible[String(c.accessor)] !== false);
  const exportData = () => filtered.map(row => Object.fromEntries(visibleColumns.map(c => [c.header, getReportValue(row, c.accessor)])));
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' }); doc.text(title, 14, 10);
    autoTable(doc, { head: [visibleColumns.map(c => c.header)], body: filtered.map(row => visibleColumns.map(c => String(getReportValue(row, c.accessor) ?? ''))), startY: 20, styles: { fontSize: 8 } });
    doc.save(`${title}.pdf`);
  };
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      {columns.filter(c => c.filterable).map(c => <Popover key={String(c.accessor)}><PopoverTrigger asChild><Button variant="outline" size="sm"><Filter className="mr-2 h-3 w-3" />{c.header}: exact values</Button></PopoverTrigger><PopoverContent className="max-h-64 overflow-auto space-y-2">{[...new Set(data.map(row => String(getReportValue(row, c.accessor) ?? '')))].filter(v => v.trim()).map(value => <label key={value} className="flex items-center gap-2 text-sm"><Checkbox checked={(exactFilters[String(c.accessor)] || []).includes(value)} onCheckedChange={checked => setExactFilters(previous => { const key = String(c.accessor), selected = previous[key] || []; return { ...previous, [key]: checked ? [...selected.filter(v => v !== value), value] : selected.filter(v => v !== value) }; })} />{value}</label>)}<Button variant="ghost" size="sm" onClick={() => setExactFilters(previous => ({ ...previous, [String(c.accessor)]: [] }))}>Clear</Button></PopoverContent></Popover>)}
    </div>
    <ReusableTableEngine title={title} rows={pageRows} totalRows={filtered.length} columns={sharedColumns} visibleColumns={visible} onVisibleColumnsChange={setVisible}
      getRowKey={rowKey} rowColors={rowColors} saving={saving} errorMessage={error} onCellSave={saveCell}
      searchValue={term} hideSearch={externalSearch !== undefined} onSearchChange={setSearch} sortKey={sortKey} sortDirection={sortDirection} onSortChange={(key, direction) => { setSortKey(key); setSortDirection(direction); }}
      filterTags={tags} onFilterTagsChange={setTags} page={currentPage} totalPages={totalPages} pageSize={pageSize} onPageSizeChange={value => setPageSize(Math.max(1, Math.min(100, value)))}
      onPrevPage={() => setPage(p => Math.max(1, p - 1))} onNextPage={() => setPage(p => Math.min(totalPages, p + 1))} onPageChange={setPage}
      savedViewsAdapter={null} enableExport={false}
      headerActions={<><Button variant="outline" size="sm" onClick={() => { void exportRowsToXlsx(exportData(), title, 'Report'); }}>Export Excel</Button><Button variant="outline" size="sm" onClick={exportPdf}><FileText className="mr-2 h-4 w-4" />Export PDF</Button></>} />
  </div>;
}
