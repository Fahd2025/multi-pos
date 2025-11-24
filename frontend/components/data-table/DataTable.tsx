/**
 * DataTable Component
 *
 * A generic, reusable data table component with pagination, sorting, filtering, and row selection.
 * Uses TypeScript generics to work with any data type while maintaining type safety.
 *
 * Features:
 * - Customizable columns with optional render functions
 * - Client-side sorting on sortable columns
 * - Pagination with configurable page sizes
 * - Row selection (single or multiple)
 * - Custom row actions
 * - Loading and empty states
 * - Responsive design with Tailwind CSS
 * - Full accessibility support
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={products}
 *   columns={[
 *     { key: 'name', label: 'Product Name', sortable: true },
 *     { key: 'price', label: 'Price', render: (value) => `$${value}` }
 *   ]}
 *   actions={[
 *     { label: 'Edit', onClick: (row) => handleEdit(row), variant: 'primary' },
 *     { label: 'Delete', onClick: (row) => handleDelete(row), variant: 'danger' }
 *   ]}
 *   getRowKey={(row) => row.id}
 *   pagination
 *   sortable
 * />
 * ```
 */

'use client';

import React from 'react';
import { DataTableProps } from '@/types/data-table.types';

export function DataTable<T>({
  data,
  columns,
  actions = [],
  loading = false,
  pagination = true,
  paginationConfig,
  onPageChange,
  onPageSizeChange,
  sortable = true,
  sortConfig,
  onSortChange,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  getRowKey,
  emptyMessage = 'No data available',
  className = ''
}: DataTableProps<T>) {

  // Handle sort click
  const handleSort = (columnKey: keyof T | string) => {
    if (!sortable || !onSortChange) return;

    if (sortConfig?.key === columnKey) {
      // Toggle direction
      onSortChange({
        key: columnKey,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // New sort
      onSortChange({ key: columnKey, direction: 'asc' });
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedRows.size === data.length) {
      // Deselect all
      data.forEach(row => onSelectionChange(getRowKey(row)));
    } else {
      // Select all
      data.forEach(row => {
        const key = getRowKey(row);
        if (!selectedRows.has(key)) {
          onSelectionChange(key);
        }
      });
    }
  };

  // Render sort icon
  const renderSortIcon = (columnKey: keyof T | string) => {
    if (sortConfig?.key !== columnKey) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Calculate pagination info
  const totalPages = paginationConfig ? Math.ceil(paginationConfig.totalItems / paginationConfig.pageSize) : 0;
  const startItem = paginationConfig ? paginationConfig.currentPage * paginationConfig.pageSize + 1 : 0;
  const endItem = paginationConfig ? Math.min((paginationConfig.currentPage + 1) * paginationConfig.pageSize, paginationConfig.totalItems) : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr role="row">
              {/* Selection Column */}
              {selectable && (
                <th className="px-4 py-3 w-12" role="columnheader">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedRows.size === data.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {/* Data Columns */}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ${column.className || ''}`}
                  style={{ width: column.width }}
                  role="columnheader"
                  aria-sort={sortConfig?.key === column.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {column.sortable !== false && sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center hover:text-gray-900 focus:outline-none focus:text-gray-900 transition-colors"
                      aria-label={`Sort by ${column.label}`}
                    >
                      {column.label}
                      {renderSortIcon(column.key)}
                    </button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </th>
              ))}

              {/* Actions Column */}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider" role="columnheader">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {/* Loading State */}
            {loading && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!loading && data.map((row) => {
              const rowKey = getRowKey(row);
              const isSelected = selectedRows.has(rowKey);

              return (
                <tr
                  key={String(rowKey)}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                  role="row"
                  aria-selected={isSelected}
                >
                  {/* Selection Cell */}
                  {selectable && onSelectionChange && (
                    <td className="px-4 py-4" role="cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectionChange(rowKey)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                        aria-label={`Select row ${rowKey}`}
                      />
                    </td>
                  )}

                  {/* Data Cells */}
                  {columns.map((column) => {
                    const value = (row as any)[column.key];
                    const content = column.render ? column.render(value, row) : value;

                    return (
                      <td
                        key={String(column.key)}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                        role="cell"
                      >
                        {content}
                      </td>
                    );
                  })}

                  {/* Actions Cell */}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" role="cell">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action, index) => {
                          // Check if action should be shown
                          if (action.condition && !action.condition(row)) {
                            return null;
                          }

                          const variantClasses = {
                            primary: 'text-blue-600 hover:text-blue-900',
                            secondary: 'text-gray-600 hover:text-gray-900',
                            danger: 'text-red-600 hover:text-red-900',
                            success: 'text-green-600 hover:text-green-900'
                          };

                          return (
                            <button
                              key={index}
                              onClick={() => action.onClick(row)}
                              className={`${variantClasses[action.variant || 'primary']} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors`}
                              aria-label={`${action.label} row ${rowKey}`}
                            >
                              {action.icon && <span className="mr-1">{action.icon}</span>}
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && paginationConfig && onPageChange && totalPages > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          {/* Pagination Info */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{paginationConfig.totalItems}</span> results
            </p>

            {/* Page Size Selector */}
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="text-sm text-gray-700">
                  Per page:
                </label>
                <select
                  id="page-size"
                  value={paginationConfig.pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(paginationConfig.currentPage - 1)}
              disabled={paginationConfig.currentPage === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous page"
            >
              Previous
            </button>

            <span className="text-sm text-gray-700">
              Page <span className="font-medium">{paginationConfig.currentPage + 1}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </span>

            <button
              onClick={() => onPageChange(paginationConfig.currentPage + 1)}
              disabled={paginationConfig.currentPage >= totalPages - 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
