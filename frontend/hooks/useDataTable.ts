/**
 * useDataTable Hook
 *
 * Custom hook for managing DataTable state including pagination, sorting, filtering, and selection.
 * This hook provides a clean API for DataTable operations and reduces boilerplate code.
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   paginationConfig,
 *   sortConfig,
 *   filters,
 *   selectedRows,
 *   handlePageChange,
 *   handleSort,
 *   handleFilter,
 *   handleSelectionChange,
 *   resetFilters
 * } = useDataTable(initialData, { pageSize: 10, sortable: true });
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { SortConfig, FilterConfig, PaginationConfig } from '@/types/data-table.types';

interface UseDataTableOptions<T> {
  /** Initial page size */
  pageSize?: number;
  /** Enable client-side sorting */
  sortable?: boolean;
  /** Enable client-side filtering */
  filterable?: boolean;
  /** Enable pagination */
  pagination?: boolean;
  /** Initial sort configuration */
  initialSort?: SortConfig<T>;
}

interface UseDataTableReturn<T> {
  /** Processed data (filtered, sorted, paginated) */
  data: T[];
  /** Pagination configuration */
  paginationConfig: PaginationConfig;
  /** Current sort configuration */
  sortConfig: SortConfig<T> | null;
  /** Current filters */
  filters: FilterConfig<T>[];
  /** Selected row keys */
  selectedRows: Set<string | number>;
  /** Handle page change */
  handlePageChange: (page: number) => void;
  /** Handle page size change */
  handlePageSizeChange: (pageSize: number) => void;
  /** Handle sort change */
  handleSort: (key: keyof T | string) => void;
  /** Handle filter change */
  handleFilter: (filter: FilterConfig<T>) => void;
  /** Remove a filter */
  removeFilter: (key: keyof T | string) => void;
  /** Reset all filters */
  resetFilters: () => void;
  /** Handle selection change */
  handleSelectionChange: (rowKey: string | number) => void;
  /** Select all rows */
  selectAll: () => void;
  /** Deselect all rows */
  deselectAll: () => void;
  /** Check if all rows are selected */
  isAllSelected: boolean;
}

export function useDataTable<T>(
  rawData: T[],
  options: UseDataTableOptions<T> = {}
): UseDataTableReturn<T> {
  const {
    pageSize = 10,
    sortable = true,
    filterable = true,
    pagination = true,
    initialSort = null
  } = options;

  // State
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialSort);
  const [filters, setFilters] = useState<FilterConfig<T>[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  // Apply filters
  const filteredData = useMemo(() => {
    if (!filterable || filters.length === 0) return rawData;

    return rawData.filter(row => {
      return filters.every(filter => {
        const value = (row as any)[filter.key];
        const filterValue = filter.value;

        if (value === undefined || value === null) return false;

        switch (filter.operator || 'contains') {
          case 'equals':
            return value === filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'gt':
            return Number(value) > Number(filterValue);
          case 'lt':
            return Number(value) < Number(filterValue);
          default:
            return true;
        }
      });
    });
  }, [rawData, filters, filterable]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, sortConfig, sortable]);

  // Apply pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = currentPage * currentPageSize;
    const end = start + currentPageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, currentPageSize, pagination]);

  // Pagination config
  const paginationConfig: PaginationConfig = useMemo(() => ({
    currentPage,
    pageSize: currentPageSize,
    totalItems: sortedData.length
  }), [currentPage, currentPageSize, sortedData.length]);

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    setCurrentPage(0); // Reset to first page
  }, []);

  const handleSort = useCallback((key: keyof T | string) => {
    setSortConfig(prevSort => {
      if (prevSort?.key === key) {
        // Toggle direction or clear sort
        if (prevSort.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null; // Clear sort
        }
      } else {
        // New sort column
        return { key, direction: 'asc' };
      }
    });
  }, []);

  const handleFilter = useCallback((filter: FilterConfig<T>) => {
    setFilters(prevFilters => {
      const existingIndex = prevFilters.findIndex(f => f.key === filter.key);
      if (existingIndex >= 0) {
        // Update existing filter
        const newFilters = [...prevFilters];
        newFilters[existingIndex] = filter;
        return newFilters;
      } else {
        // Add new filter
        return [...prevFilters, filter];
      }
    });
    setCurrentPage(0); // Reset to first page
  }, []);

  const removeFilter = useCallback((key: keyof T | string) => {
    setFilters(prevFilters => prevFilters.filter(f => f.key !== key));
    setCurrentPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters([]);
    setCurrentPage(0);
  }, []);

  const handleSelectionChange = useCallback((rowKey: string | number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    // Select all rows in current view
    const allKeys = paginatedData.map((_, index) => index);
    setSelectedRows(new Set(allKeys));
  }, [paginatedData]);

  const deselectAll = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const isAllSelected = useMemo(() => {
    return paginatedData.length > 0 && paginatedData.every((_, index) => selectedRows.has(index));
  }, [paginatedData, selectedRows]);

  return {
    data: pagination ? paginatedData : sortedData,
    paginationConfig,
    sortConfig,
    filters,
    selectedRows,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    removeFilter,
    resetFilters,
    handleSelectionChange,
    selectAll,
    deselectAll,
    isAllSelected
  };
}
