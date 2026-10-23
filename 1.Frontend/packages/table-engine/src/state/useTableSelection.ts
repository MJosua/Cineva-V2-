import React, { useMemo } from 'react';
import type { ReusableTableEngineProps } from '../types';

/** Page selection; preserves the existing key and callback contracts. */
export function useTableSelection<T extends Record<string, any>>(
  displayRows: T[],
  getRowKey: ReusableTableEngineProps<T>['getRowKey'],
  selectedRowKeys: React.Key[],
  onSelectionChange: ReusableTableEngineProps<T>['onSelectionChange'],
) {
  const allCurrentRowKeys = useMemo(() => {
    return displayRows.map((row, idx) => getRowKey ? getRowKey(row, idx) : (row.row_key || row.ticket_id || row.id || idx));
  }, [displayRows, getRowKey]);

  const isAllSelected = useMemo(() => {
    if (displayRows.length === 0) return false;
    const selectedSet = new Set(selectedRowKeys.map(String));
    return allCurrentRowKeys.every((key) => selectedSet.has(String(key)));
  }, [displayRows, allCurrentRowKeys, selectedRowKeys]);

  const isSomeSelected = useMemo(() => {
    if (displayRows.length === 0) return false;
    const selectedSet = new Set(selectedRowKeys.map(String));
    return allCurrentRowKeys.some((key) => selectedSet.has(String(key))) && !isAllSelected;
  }, [displayRows, allCurrentRowKeys, selectedRowKeys, isAllSelected]);

  const handleToggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      const pageKeySet = new Set(allCurrentRowKeys.map(String));
      const remainingKeys = selectedRowKeys.filter((k) => !pageKeySet.has(String(k)));
      const remainingRows = displayRows.filter((r, idx) => {
        const k = getRowKey ? getRowKey(r, idx) : (r.row_key || r.ticket_id || r.id || idx);
        return remainingKeys.includes(k);
      });
      onSelectionChange(remainingKeys, remainingRows);
    } else {
      const currentSelectedMap = new Map();
      for (const k of selectedRowKeys) currentSelectedMap.set(String(k), k);
      for (const k of allCurrentRowKeys) currentSelectedMap.set(String(k), k);
      const newKeys = Array.from(currentSelectedMap.values());
      const selectedRowsMap = new Map();
      for (const r of displayRows) {
        const k = getRowKey ? getRowKey(r, 0) : (r.row_key || r.ticket_id || r.id);
        selectedRowsMap.set(String(k), r);
      }
      onSelectionChange(newKeys, Array.from(selectedRowsMap.values()));
    }
  };

  const handleToggleRowSelect = (key: React.Key, row: T) => {
    if (!onSelectionChange) return;
    const strKey = String(key);
    const exists = selectedRowKeys.some((k) => String(k) === strKey);
    if (exists) {
      const nextKeys = selectedRowKeys.filter((k) => String(k) !== strKey);
      onSelectionChange(nextKeys, displayRows.filter((r, idx) => {
        const k = getRowKey ? getRowKey(r, idx) : (r.row_key || r.ticket_id || r.id || idx);
        return nextKeys.includes(k);
      }));
    } else {
      const nextKeys = [...selectedRowKeys, key];
      onSelectionChange(nextKeys, [...displayRows.filter((r, idx) => {
        const k = getRowKey ? getRowKey(r, idx) : (r.row_key || r.ticket_id || r.id || idx);
        return selectedRowKeys.includes(k);
      }), row]);
    }
  };

  return { allCurrentRowKeys, isAllSelected, isSomeSelected, handleToggleSelectAll, handleToggleRowSelect };
}
