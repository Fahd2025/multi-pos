"use client";

import React from "react";
import { X } from "lucide-react";

export interface ActiveFilter {
  type: string;
  label: string;
  value: string;
}

interface ActiveFiltersBadgeProps {
  filters: ActiveFilter[];
  onRemove: (filterType: string) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * ActiveFiltersBadge Component
 *
 * Displays active filters as removable badges with a clear all button.
 * Used across data table pages for consistent filter display.
 *
 * @example
 * ```tsx
 * <ActiveFiltersBadge
 *   filters={[
 *     { type: "category", label: "Category", value: "Electronics" },
 *     { type: "search", label: "Search", value: "laptop" }
 *   ]}
 *   onRemove={(type) => handleRemoveFilter(type)}
 *   onClearAll={() => handleResetFilters()}
 * />
 * ```
 */
export const ActiveFiltersBadge: React.FC<ActiveFiltersBadgeProps> = ({
  filters,
  onRemove,
  onClearAll,
  className = "",
}) => {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div
      className={`bg-primary/10 border border-primary/30 rounded-lg px-5 py-3 ${className}`}
    >
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-sm font-medium text-foreground">
          Active Filters:
        </span>
        {filters.map((filter) => (
          <span
            key={filter.type}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-foreground rounded-full text-sm font-medium"
          >
            <span className="font-semibold">{filter.label}:</span>
            <span>{filter.value}</span>
            <button
              onClick={() => onRemove(filter.type)}
              className="ml-1 hover:bg-primary/30 rounded-full p-0.5 transition-colors"
              title={`Remove ${filter.label} filter`}
              aria-label={`Remove ${filter.label} filter`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <button
          onClick={onClearAll}
          className="ml-2 text-sm text-primary hover:text-primary/80 font-medium underline"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};
