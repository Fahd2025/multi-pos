/**
 * PageHeader Component
 *
 * Reusable page header component with consistent styling for title, description, and actions.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Sales Management"
 *   description="Track sales performance and manage transactions"
 * />
 *
 * <PageHeader
 *   title="Inventory"
 *   description="Manage products and stock levels"
 *   actions={
 *     <Button onClick={handleAdd}>Add Product</Button>
 *   }
 * />
 * ```
 */

import React from 'react';

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action buttons/elements */
  actions?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Title size */
  titleSize?: 'sm' | 'md' | 'lg';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
  titleSize = 'lg',
}) => {
  const titleSizeClasses = {
    sm: 'text-xl md:text-2xl',
    md: 'text-2xl md:text-3xl',
    lg: 'text-2xl md:text-3xl',
  }[titleSize];

  return (
    <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${className}`}>
      <div>
        <h1 className={`${titleSizeClasses} font-bold text-gray-900 dark:text-gray-100`}>
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-col sm:flex-row gap-3">{actions}</div>}
    </div>
  );
};
