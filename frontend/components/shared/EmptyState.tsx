/**
 * EmptyState Component
 *
 * Reusable empty state component for displaying when no data is available.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<ShoppingCartIcon />}
 *   title="No products found"
 *   message="Add your first product to get started."
 *   action={<Button onClick={handleAdd}>Add Product</Button>}
 * />
 * ```
 */

import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = "",
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon ? (
        <div className="flex justify-center mb-4">{icon}</div>
      ) : (
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      )}
      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
