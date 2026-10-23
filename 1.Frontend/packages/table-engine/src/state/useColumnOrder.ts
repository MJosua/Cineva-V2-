import React, { useState } from 'react';
import type { ReusableTableEngineProps } from '../types';

/** Controlled/local order, drag lifecycle and report-scoped browser persistence. */
export function useColumnOrder<T extends Record<string, any>>({
  reportKey, columns, columnOrder: propColumnOrder, onColumnOrderChange,
}: Pick<ReusableTableEngineProps<T>, 'reportKey' | 'columns' | 'columnOrder' | 'onColumnOrderChange'>) {
  // Column Ordering (Drag & Drop)
  const ORDER_STORAGE_KEY = reportKey ? `report-table:${reportKey}:column-order` : null;
  const [internalColumnOrder, setInternalColumnOrder] = useState<string[]>(() => {
    if (ORDER_STORAGE_KEY) {
      try {
        const saved = localStorage.getItem(ORDER_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (_e) {}
    }
    return columns.map((c) => String(c.key));
  });

  const columnOrder = propColumnOrder || internalColumnOrder;
  const [draggedColKey, setDraggedColKey] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  // Drag & Drop Column Reordering Handlers
  const handleDragStart = (e: React.DragEvent, colKey: string) => {
    setDraggedColKey(colKey);
    e.dataTransfer.setData('text/plain', colKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColKey !== colKey) setDragOverColKey(colKey);
  };

  const handleDrop = (e: React.DragEvent, targetColKey: string) => {
    e.preventDefault();
    if (!draggedColKey || draggedColKey === targetColKey) {
      setDraggedColKey(null);
      setDragOverColKey(null);
      return;
    }
    const currentOrder = [...columnOrder];
    const fromIdx = currentOrder.indexOf(draggedColKey);
    const toIdx = currentOrder.indexOf(targetColKey);
    if (fromIdx !== -1 && toIdx !== -1) {
      currentOrder.splice(fromIdx, 1);
      currentOrder.splice(toIdx, 0, draggedColKey);
      setInternalColumnOrder(currentOrder);
      if (onColumnOrderChange) onColumnOrderChange(currentOrder);
      if (ORDER_STORAGE_KEY) {
        try {
          localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(currentOrder));
        } catch (_e) {}
      }
    }
    setDraggedColKey(null);
    setDragOverColKey(null);
  };

  const handleDragEnd = () => {
    setDraggedColKey(null);
    setDragOverColKey(null);
  };

  return { ORDER_STORAGE_KEY, internalColumnOrder, setInternalColumnOrder, columnOrder,
    draggedColKey, setDraggedColKey, dragOverColKey, setDragOverColKey,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}
