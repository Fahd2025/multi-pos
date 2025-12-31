"use client";

import { useState, useCallback, useMemo } from "react";
import { ActiveFilter } from "@/components/shared/ActiveFiltersBadge";

export interface FilterDefinition {
  type: string;
  label: string;
  defaultValue: any;
  getDisplayValue?: (value: any) => string;
}

export interface UseTableFiltersConfig {
  filterDefinitions: FilterDefinition[];
  onFiltersChange?: (filters: Record<string, any>) => void;
}

export interface UseTableFiltersReturn {
  // Filter values (input - what user is typing/selecting)
  filterValues: Record<string, any>;
  setFilterValue: (type: string, value: any) => void;
  setFilterValues: (values: Record<string, any>) => void;

  // Applied filters (what's actually being used in the API call)
  appliedFilters: Record<string, any>;

  // Filter actions
  applyFilters: () => void;
  removeFilter: (type: string) => void;
  resetFilters: () => void;

  // Filter display
  activeFilters: ActiveFilter[];
  activeFilterCount: number;
  hasActiveFilters: boolean;
}

/**
 * useTableFilters Hook
 *
 * Generic hook for managing table filters with separate input and applied states.
 * Provides filter state management, active filter display, and filter actions.
 *
 * @example
 * ```tsx
 * const filters = useTableFilters({
 *   filterDefinitions: [
 *     { type: "search", label: "Search", defaultValue: "" },
 *     { type: "category", label: "Category", defaultValue: "", getDisplayValue: (id) => getCategoryName(id) },
 *     { type: "lowStock", label: "Low Stock", defaultValue: false, getDisplayValue: () => "Yes" }
 *   ],
 *   onFiltersChange: (filters) => setCurrentPage(1)
 * });
 *
 * // In your component:
 * <Input
 *   value={filters.filterValues.search}
 *   onChange={(e) => filters.setFilterValue("search", e.target.value)}
 * />
 *
 * <ActiveFiltersBadge
 *   filters={filters.activeFilters}
 *   onRemove={filters.removeFilter}
 *   onClearAll={filters.resetFilters}
 * />
 * ```
 */
export function useTableFilters(config: UseTableFiltersConfig): UseTableFiltersReturn {
  const { filterDefinitions, onFiltersChange } = config;

  // Create default values object from filter definitions
  const defaultValues = useMemo(() => {
    return filterDefinitions.reduce((acc, def) => {
      acc[def.type] = def.defaultValue;
      return acc;
    }, {} as Record<string, any>);
  }, [filterDefinitions]);

  // Filter states (input values - what user is typing/selecting)
  const [filterValues, setFilterValuesState] = useState<Record<string, any>>(defaultValues);

  // Applied filters (what's actually being used in the API call)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>(defaultValues);

  /**
   * Set a single filter value
   */
  const setFilterValue = useCallback((type: string, value: any) => {
    setFilterValuesState((prev) => ({
      ...prev,
      [type]: value,
    }));
  }, []);

  /**
   * Set multiple filter values at once
   */
  const setFilterValues = useCallback((values: Record<string, any>) => {
    setFilterValuesState((prev) => ({
      ...prev,
      ...values,
    }));
  }, []);

  /**
   * Apply current filter values
   */
  const applyFilters = useCallback(() => {
    setAppliedFilters(filterValues);
    onFiltersChange?.(filterValues);
  }, [filterValues, onFiltersChange]);

  /**
   * Get active filters for display
   */
  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];

    filterDefinitions.forEach((def) => {
      const value = appliedFilters[def.type];

      // Skip if value is empty, false, null, or undefined
      if (!value && value !== 0) return;

      // Get display value
      let displayValue: string;
      if (def.getDisplayValue) {
        displayValue = def.getDisplayValue(value);
      } else if (typeof value === "boolean") {
        displayValue = value ? "Yes" : "No";
      } else {
        displayValue = String(value);
      }

      filters.push({
        type: def.type,
        label: def.label,
        value: displayValue,
      });
    });

    return filters;
  }, [appliedFilters, filterDefinitions]);

  /**
   * Remove a single filter
   */
  const removeFilter = useCallback(
    (filterType: string) => {
      const definition = filterDefinitions.find((def) => def.type === filterType);
      if (!definition) return;

      const newFilterValues = {
        ...filterValues,
        [filterType]: definition.defaultValue,
      };

      const newAppliedFilters = {
        ...appliedFilters,
        [filterType]: definition.defaultValue,
      };

      setFilterValuesState(newFilterValues);
      setAppliedFilters(newAppliedFilters);
      onFiltersChange?.(newAppliedFilters);
    },
    [filterValues, appliedFilters, filterDefinitions, onFiltersChange]
  );

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilterValuesState(defaultValues);
    setAppliedFilters(defaultValues);
    onFiltersChange?.(defaultValues);
  }, [defaultValues, onFiltersChange]);

  const activeFilterCount = activeFilters.length;
  const hasActiveFilters = activeFilterCount > 0;

  return {
    filterValues,
    setFilterValue,
    setFilterValues,
    appliedFilters,
    applyFilters,
    removeFilter,
    resetFilters,
    activeFilters,
    activeFilterCount,
    hasActiveFilters,
  };
}
