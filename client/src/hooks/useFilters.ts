import { useState, useCallback } from 'react';
import type { FilterValues } from '../types';

const currentDate = new Date();

const defaultFilters: FilterValues = {
  year: currentDate.getFullYear(),
  month: currentDate.getMonth() + 1,
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(defaultFilters);

  const updateFilter = useCallback(<K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, []);

  return {
    filters,
    appliedFilters,
    updateFilter,
    applyFilters,
    resetFilters,
  };
}
