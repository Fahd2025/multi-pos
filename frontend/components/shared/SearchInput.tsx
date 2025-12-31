"use client";

import React from "react";
import { Search } from "lucide-react";
import { Button } from "./Button";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  showSearchButton?: boolean;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * SearchInput Component
 *
 * A reusable search input with an icon and optional search button.
 * Supports Enter key to trigger search and dark mode.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   onSearch={handleSearch}
 *   placeholder="Search by name, code, or SKU..."
 *   showSearchButton
 * />
 * ```
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  showSearchButton = true,
  className = "",
  disabled = false,
  autoFocus = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Search"
        />
      </div>
      {showSearchButton && onSearch && (
        <Button
          onClick={onSearch}
          disabled={disabled}
          variant="primary"
          className="px-4 py-2 whitespace-nowrap"
          aria-label="Search"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};
