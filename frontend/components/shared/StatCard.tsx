/**
 * StatCard Component
 *
 * Reusable card component for displaying statistics with icon, title, value, and description.
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Sales"
 *   value="$12,345.67"
 *   description="This month"
 *   icon="💵"
 *   iconBgColor="bg-green-100"
 * />
 *
 * <StatCard
 *   title="Active Users"
 *   value={125}
 *   description="Currently online"
 *   icon="👥"
 *   iconBgColor="bg-blue-100"
 *   footer={
 *     <>
 *       <span className="text-green-600 font-medium">10 Active</span>
 *       <span className="mx-2 text-gray-400">•</span>
 *       <span className="text-gray-600">5 Inactive</span>
 *     </>
 *   }
 * />
 * ```
 */

import React from "react";

export interface StatCardProps {
  /** Card title/label */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional description text */
  description?: string;
  /** Icon (emoji or React node) */
  icon?: React.ReactNode;
  /** Background color class for icon container (e.g., "bg-blue-100") */
  iconBgColor?: string;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Value color class (default: "text-gray-900 dark:text-gray-100") */
  valueColor?: string;
  /** Value size class (default: "text-2xl" for md, "text-3xl" for lg) */
  valueSize?: "md" | "lg";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  iconBgColor = "bg-gray-100 dark:bg-gray-700",
  footer,
  onClick,
  className = "",
  valueColor = "text-gray-900 dark:text-gray-100",
  valueSize = "md",
}) => {
  const Component = onClick ? "button" : "div";
  const valueSizeClass = valueSize === "lg" ? "text-3xl" : "text-2xl";

  return (
    <Component
      onClick={onClick}
      className={`bg-white dark:bg-gray-800  border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm ${
        onClick ? "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <p className={`${valueSizeClass} font-bold ${valueColor} mt-2`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div
            className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center flex-shrink-0 ml-4`}
          >
            {typeof icon === "string" ? <span className="text-2xl">{icon}</span> : icon}
          </div>
        )}
      </div>
      {footer && <div className="mt-4 flex items-center text-sm">{footer}</div>}
    </Component>
  );
};
