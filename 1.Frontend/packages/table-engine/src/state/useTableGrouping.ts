import { useMemo, useState } from 'react';
import type { ReusableTableEngineProps } from '../types';

/** Group control and collapse state, with grouping delegated to controlled hosts. */
export function useTableGrouping<T extends Record<string, any>>(
  groupBy: ReusableTableEngineProps<T>['groupBy'],
  onGroupByChange: ReusableTableEngineProps<T>['onGroupByChange'],
) {
  // Group By State (supports controlled or uncontrolled)
  const [internalGroupBy, setInternalGroupBy] = useState<string | null>(null);
  const activeGroupBy = groupBy !== undefined ? groupBy : internalGroupBy;
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());

  const toggleGroupCollapse = (groupValue: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupValue)) next.delete(groupValue);
      else next.add(groupValue);
      return next;
    });
  };

  const handleGroupByChange = (key: string | null) => {
    if (onGroupByChange) {
      onGroupByChange(key);
    } else {
      setInternalGroupBy(key);
    }
    setCollapsedGroups(new Set());
  };

  return { internalGroupBy, setInternalGroupBy, activeGroupBy, collapsedGroups,
    setCollapsedGroups, toggleGroupCollapse, handleGroupByChange };
}

export function useGroupedRows<T extends Record<string, any>>(
  displayRows: T[], activeGroupBy: string | null,
  onGroupByChange: ReusableTableEngineProps<T>['onGroupByChange'],
) {
  // Client-side grouping (if not controlled by onGroupByChange)
  const groupedEntries = useMemo(() => {
    if (!activeGroupBy || onGroupByChange) return null;
    const map = new Map<string, T[]>();
    for (const row of displayRows) {
      const gVal = String(row[activeGroupBy] ?? '-');
      const list = map.get(gVal) || [];
      list.push(row);
      map.set(gVal, list);
    }
    return Array.from(map.entries()).map(([groupValue, groupRows]) => ({
      groupValue,
      groupRows,
      count: groupRows.length,
    }));
  }, [displayRows, activeGroupBy, onGroupByChange]);

  return groupedEntries;
}
