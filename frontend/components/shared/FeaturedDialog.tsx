/**
 * FeaturedDialog Component
 *
 * A modal dialog for displaying detailed information about a selected entry.
 * Features customizable field display with optional actions.
 *
 * Features:
 * - Clean, card-based layout for viewing details
 * - Customizable field rendering
 * - Optional action buttons (Edit, Delete, etc.)
 * - Responsive design
 * - Accessible with ARIA attributes
 * - Support for various data types
 *
 * @example
 * ```tsx
 * <FeaturedDialog
 *   isOpen={dialog.isOpen}
 *   onClose={dialog.close}
 *   title="Product Details"
 *   data={product}
 *   fields={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'price', label: 'Price', render: (value) => `$${value}` },
 *     { key: 'stock', label: 'Stock', render: (value) => `${value} units` }
 *   ]}
 *   actions={[
 *     { label: 'Edit', onClick: handleEdit, variant: 'primary' },
 *     { label: 'Delete', onClick: handleDelete, variant: 'danger' }
 *   ]}
 * />
 * ```
 */

'use client';

import React from 'react';
import { FeaturedDialogProps } from '@/types/data-table.types';

export function FeaturedDialog<T = any>({
  isOpen,
  onClose,
  title,
  data,
  fields,
  actions = [],
  size = 'md',
  customContent
}: FeaturedDialogProps<T>) {

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-2xl shadow-xl transform transition-all w-full ${sizeClasses[size]}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 id="dialog-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              {fields.map((field) => {
                const value = (data as any)[field.key];
                const displayValue = field.render ? field.render(value, data) : value;

                return (
                  <div key={String(field.key)} className={`${field.className || ''}`}>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      {field.label}
                    </dt>
                    <dd className="text-base text-gray-900">
                      {displayValue !== null && displayValue !== undefined ? (
                        displayValue
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </div>

            {/* Custom Content */}
            {customContent && (
              <div className="mt-4">
                {customContent}
              </div>
            )}
          </div>

          {/* Footer with Actions */}
          {actions.length > 0 && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              {actions.map((action, index) => {
                const variantClasses = {
                  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
                  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
                  danger: 'bg-red-600 hover:bg-red-700 text-white',
                  success: 'bg-green-600 hover:bg-green-700 text-white'
                };

                return (
                  <button
                    key={index}
                    onClick={() => action.onClick(data)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                      variantClasses[action.variant || 'primary']
                    }`}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
