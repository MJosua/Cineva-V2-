import type { FilterTag, ReusableSortDirection } from '@hots/table-engine';
import type { AxiosInstance } from 'axios';

export interface LegacyReportColumn<T> {
  header: string; accessor: keyof T | string; align?: 'left' | 'center' | 'right'; filterable?: boolean;
  sortable?: boolean; editable?: boolean; colorField?: keyof T | string; sticky?: string;
}

export const getReportValue = (row: object, field: PropertyKey): unknown => (row as Record<PropertyKey, unknown>)[field];

export async function persistReportUpdate(http: AxiosInstance, url: string, body: unknown): Promise<void> {
  const response = await http.post(url, body);
  if (response.data?.success === false) throw new Error(response.data.message || 'Report update was rejected');
}

export function prepareReportRows<T extends object>(rows: T[], options: {
  search: string; searchKeys: (keyof T | string)[]; exactFilters: Record<string, string[]>; tags: FilterTag[];
  sortKey: string | null; sortDirection: ReusableSortDirection;
}): T[] {
  const term = options.search.toLowerCase();
  const tags = options.tags.reduce<Record<string, FilterTag[]>>((all, tag) => { (all[tag.key] ||= []).push(tag); return all; }, {});
  const selected = rows.filter(row => {
    if (term && options.searchKeys.length && !options.searchKeys.some(key => String(getReportValue(row, key)).toLowerCase().includes(term))) return false;
    if (!Object.entries(options.exactFilters).every(([key, values]) => !values.length || values.includes(String(getReportValue(row, key))))) return false;
    return Object.entries(tags).every(([key, conditions]) => {
      const value = String(getReportValue(row, key) ?? '').toLowerCase();
      const include = conditions.filter(t => t.operator === 'include'), exclude = conditions.filter(t => t.operator === 'exclude');
      return (!include.length || include.some(t => value.includes(t.value.toLowerCase()))) && exclude.every(t => !value.includes(t.value.toLowerCase()));
    });
  });
  if (options.sortKey && options.sortDirection) {
    const key = options.sortKey, direction = options.sortDirection === 'asc' ? 1 : -1;
    selected.sort((a, b) => direction * String(getReportValue(a, key)).localeCompare(String(getReportValue(b, key)), undefined, { numeric: true }));
  }
  return selected;
}

export function buildReportUpdate(ticketId: string, detailId: string, field: string, value: string, color: string | undefined, hasCustomUrl: boolean) {
  return hasCustomUrl ? { ticket_id: ticketId, field_name: field, value, service_id: null, detail_id: detailId && detailId !== 'null' ? detailId : null }
    : { ticket_id: ticketId, detail_id: detailId, lbl_col: field, cstm_col: value, color_code: color || null, visible_to: 'admin' };
}

export function updateMatchingReportRows<T extends object>(rows: T[], ticketKey: keyof T | string, detailKey: keyof T | string | undefined, ticketId: string, detailId: string, field: string, value: string, color?: string): T[] {
  return rows.map(row => String(getReportValue(row, ticketKey) ?? '') === ticketId && (!detailId || detailId === 'null' || String(detailKey ? getReportValue(row, detailKey) ?? 'null' : 'null') === detailId)
    ? { ...row, [field]: value, Color: color ?? getReportValue(row, 'Color') } : row);
}
