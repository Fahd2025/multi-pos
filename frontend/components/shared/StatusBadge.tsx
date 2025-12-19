/**
 * StatusBadge Component
 *
 * Reusable status badge component with predefined color variants.
 * Used for displaying status indicators throughout the application.
 *
 * @example
 * ```tsx
 * <StatusBadge variant="success">Active</StatusBadge>
 * <StatusBadge variant="danger">Out of Stock</StatusBadge>
 * <StatusBadge variant="warning">Low Stock</StatusBadge>
 * <StatusBadge variant="info">Pending</StatusBadge>
 * ```
 */

import React from 'react';

export interface StatusBadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  children,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

/**
 * Helper function to get stock status badge variant
 */
export const getStockStatusVariant = (
  stockLevel: number,
  minThreshold: number
): 'success' | 'warning' | 'danger' => {
  if (stockLevel <= 0) return 'danger';
  if (stockLevel <= minThreshold) return 'warning';
  return 'success';
};

/**
 * Helper function to get approval status badge variant
 */
export const getApprovalStatusVariant = (
  status: number
): 'warning' | 'success' | 'danger' | 'neutral' => {
  switch (status) {
    case 0: return 'warning'; // Pending
    case 1: return 'success'; // Approved
    case 2: return 'danger';  // Rejected
    default: return 'neutral';
  }
};

/**
 * Helper function to get delivery status badge variant
 */
export const getDeliveryStatusVariant = (
  status: number
): 'success' | 'warning' | 'info' | 'danger' | 'neutral' => {
  switch (status) {
    case 0: return 'neutral';  // Pending
    case 1: return 'info';     // Assigned
    case 2: return 'warning';  // PickedUp
    case 3: return 'warning';  // OutForDelivery
    case 4: return 'success';  // Delivered
    case 5: return 'danger';   // Failed
    case 6: return 'danger';   // Cancelled
    default: return 'neutral';
  }
};
