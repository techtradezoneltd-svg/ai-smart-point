import { useState, useCallback, useMemo } from "react";

export const useBulkSelection = <T extends { id: string }>(items: T[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  );

  const isSomeSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds.size]
  );

  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  }, [isAllSelected, items]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isAllSelected,
    isSomeSelected,
    toggleOne,
    toggleAll,
    clearSelection,
    isSelected,
  };
};
