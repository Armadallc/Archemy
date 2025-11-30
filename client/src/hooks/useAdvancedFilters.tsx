import { useState, useCallback, useMemo } from 'react';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'checkbox' | 'number';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  multiple?: boolean;
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  [key: string]: any;
}

export function useAdvancedFilters<T>(
  data: T[],
  filters: FilterOption[],
  sortOptions: SortOption[],
  searchFields: (keyof T)[]
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({});
  const [sortState, setSortState] = useState<SortOption | null>(null);

  // Filter data based on search term
  const filteredBySearch = useMemo(() => {
    if (!searchTerm.trim()) return data;

    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });
    });
  }, [data, searchTerm, searchFields]);

  // Filter data based on filter state
  const filteredData = useMemo(() => {
    return filteredBySearch.filter((item) => {
      return Object.entries(filterState).every(([key, filterValue]) => {
        if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
          return true;
        }

        const itemValue = (item as any)[key];
        
        if (Array.isArray(filterValue)) {
          // Multiple selection (checkbox)
          return filterValue.includes(itemValue);
        }

        if (typeof filterValue === 'string') {
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(filterValue.toLowerCase());
          }
          if (typeof itemValue === 'number') {
            return itemValue.toString().includes(filterValue);
          }
          return false;
        }

        if (typeof filterValue === 'object' && filterValue.from && filterValue.to) {
          // Date range filter
          const itemDate = new Date(itemValue);
          return itemDate >= filterValue.from && itemDate <= filterValue.to;
        }

        return itemValue === filterValue;
      });
    });
  }, [filteredBySearch, filterState]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortState) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortState.key];
      const bValue = (b as any)[sortState.key];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortState]);

  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  const handleFiltersChange = useCallback((filters: FilterState) => {
    setFilterState(filters);
  }, []);

  const handleSortChange = useCallback((sort: SortOption | null) => {
    setSortState(sort);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilterState({});
    setSortState(null);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    const activeFilters = Object.entries(filterState)
      .filter(([key, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== '' && value !== null && value !== undefined;
      });
    
    return activeFilters.length + (searchTerm ? 1 : 0);
  }, [filterState, searchTerm]);

  return {
    data: sortedData,
    searchTerm,
    filterState,
    sortState,
    handleSearchChange,
    handleFiltersChange,
    handleSortChange,
    resetFilters,
    getActiveFiltersCount,
    hasActiveFilters: getActiveFiltersCount() > 0
  };
}







