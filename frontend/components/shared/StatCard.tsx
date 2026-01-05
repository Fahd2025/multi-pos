/**
 * StatCard Component
 *
 * Enhanced reusable card component for displaying statistics with icon, title, value, and description.
 * Now supports feature-based color variants for consistent visual organization.
 *
 * @example
 * ```tsx
 * // New variant-based approach (recommended)
 * <StatCard
 *   title="Today's Sales"
 *   value="$12,345.67"
 *   variant="sales"
 *   trend="+12%"
 * />
 *
 * // Legacy approach (still supported)
 * <StatCard
 *   title="Total Sales"
 *   value="$12,345.67"
 *   description="This month"
 *   icon="💵"
 *   iconBgColor="bg-green-100"
 * />
 * ```
 */

import React from "react";
import type { LucideIcon } from "lucide-react";

export type StatCardVariant =
  | "sales"
  | "inventory"
  | "customers"
  | "expenses"
  | "purchases"
  | "reports"
  | "users"
  | "settings"
  | "tables"
  | "default";

export interface StatCardProps {
  /** Card title/label */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional description text */
  description?: string;
  /** Icon (emoji, React node, or Lucide icon component) */
  icon?: React.ReactNode | LucideIcon;
  /** Feature variant for automatic color theming (replaces iconBgColor/iconColor) */
  variant?: StatCardVariant;
  /** Background color class for icon container (legacy - use variant instead) */
  iconBgColor?: string;
  /** Icon color class (legacy - auto-calculated from variant) */
  iconColor?: string;
  /** Trend indicator (e.g., "+12%", "-5%") - auto-colored based on positive/negative */
  trend?: string;
  /** Custom trend color (overrides auto-calculation) */
  trendColor?: string;
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
  /** Loading state - shows skeleton */
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  variant = "default",
  iconBgColor,
  iconColor,
  trend,
  trendColor,
  footer,
  onClick,
  className = "",
  valueColor = "text-gray-900 dark:text-gray-100",
  valueSize = "md",
  loading = false,
}) => {
  const Component = onClick ? "button" : "div";
  const valueSizeClass = valueSize === "lg" ? "text-3xl" : "text-2xl";

  // Variant-based styling (automatic color theming)
  const variantStyles: Record<StatCardVariant, { bg: string; text: string }> = {
    sales: { bg: "bg-sales/10", text: "text-sales" },
    inventory: { bg: "bg-inventory/10", text: "text-inventory" },
    customers: { bg: "bg-customers/10", text: "text-customers" },
    expenses: { bg: "bg-expenses/10", text: "text-expenses" },
    purchases: { bg: "bg-purchases/10", text: "text-purchases" },
    reports: { bg: "bg-reports/10", text: "text-reports" },
    users: { bg: "bg-users/10", text: "text-users" },
    settings: { bg: "bg-settings/10", text: "text-settings" },
    tables: { bg: "bg-tables/10", text: "text-tables" },
    default: { bg: "bg-primary/10", text: "text-primary" },
  };

  // Use variant styles if no legacy colors provided
  const iconBg = iconBgColor || variantStyles[variant].bg;
  const iconTextColor = iconColor || variantStyles[variant].text;

  // Auto-calculate trend color based on positive/negative
  const calculatedTrendColor =
    trendColor ||
    (trend?.startsWith("+")
      ? "text-success"
      : trend?.startsWith("-")
      ? "text-danger"
      : "text-muted-foreground");

  // Render icon (support for Lucide icons, React nodes, and emojis)
  const renderIcon = () => {
    if (!icon) return null;

    // Check if it's a string (emoji)
    if (typeof icon === "string") {
      return <span className="text-2xl">{icon}</span>;
    }

    // Check if it's already a rendered React element
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        className: `w-6 h-6 ${iconTextColor}`,
      });
    }

    // Check if it's a Lucide icon component or ForwardRef component
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={`w-6 h-6 ${iconTextColor}`} />;
    }

    // Fallback for any other type
    return <span className="text-2xl">{String(icon)}</span>;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-6 shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-muted rounded w-1/3 animate-shimmer"></div>
            <div className="h-8 bg-muted rounded w-2/3 animate-shimmer"></div>
            {description && <div className="h-3 bg-muted rounded w-1/2 animate-shimmer"></div>}
          </div>
          <div className="w-12 h-12 bg-muted rounded-full animate-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <Component
      onClick={onClick}
      className={`
        glass rounded-xl p-6 shadow-sm
        transition-all duration-300
        ${
          onClick
            ? "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 cursor-pointer active:scale-95"
            : ""
        }
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
          <p className={`${valueSizeClass} font-bold ${valueColor} mb-1`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>

          {/* Trend indicator */}
          {trend && (
            <div className={`text-sm font-medium ${calculatedTrendColor} flex items-center gap-1`}>
              {trend.startsWith("+") && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              )}
              {trend.startsWith("-") && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              <span>{trend}</span>
            </div>
          )}

          {/* Description (if no trend) */}
          {description && !trend && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Icon container */}
        {icon && (
          <div
            className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0 ml-4`}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 flex items-center text-sm border-t border-border pt-3">{footer}</div>
      )}
    </Component>
  );
};
