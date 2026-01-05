/**
 * ActionCard Component
 *
 * Enhanced reusable card component for clickable action items with icon, title, and description.
 * Now supports feature-based color variants for consistent visual organization.
 * Can be rendered as a button or Link with touch-optimized sizing.
 *
 * @example
 * ```tsx
 * // New variant-based approach (recommended)
 * <ActionCard
 *   title="Manage Inventory"
 *   description="View and update stock"
 *   icon={Package}
 *   variant="inventory"
 *   href="/inventory"
 * />
 *
 * // With badge
 * <ActionCard
 *   title="Pending Orders"
 *   description="Review pending transactions"
 *   icon={Clock}
 *   variant="sales"
 *   badge="5"
 *   onClick={() => {}}
 * />
 *
 * // Legacy approach (still supported)
 * <ActionCard
 *   title="View Reports"
 *   description="Analytics and insights"
 *   icon="📊"
 *   iconBgColor="bg-purple-100"
 *   href="/reports"
 * />
 * ```
 */

import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type ActionCardVariant =
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

export interface ActionCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Icon (emoji, React node, or Lucide icon component) */
  icon?: React.ReactNode | LucideIcon;
  /** Feature variant for automatic color theming */
  variant?: ActionCardVariant;
  /** Background color class for icon container (legacy - use variant instead) */
  iconBgColor?: string;
  /** Icon container shape */
  iconShape?: "circle" | "rounded" | "square";
  /** Border color when hovered (legacy - auto-calculated from variant) */
  hoverBorderColor?: string;
  /** Background color for the whole card (legacy) */
  bgColor?: string;
  /** Click handler (use this OR href, not both) */
  onClick?: () => void;
  /** Link href (use this OR onClick, not both) */
  href?: string;
  /** Additional CSS classes */
  className?: string;
  /** Layout direction */
  layout?: "horizontal" | "vertical";
  /** Badge text (e.g., "New", "3 pending") */
  badge?: string;
  /** Disabled state */
  disabled?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  variant = "default",
  iconBgColor,
  iconShape = "rounded",
  hoverBorderColor,
  bgColor,
  onClick,
  href,
  className = "",
  layout = "horizontal",
  badge,
  disabled = false,
}) => {
  // Variant-based styling (automatic color theming)
  const variantStyles: Record<
    ActionCardVariant,
    { bg: string; text: string; border: string; hover: string }
  > = {
    sales: {
      bg: "bg-sales/10",
      text: "text-sales",
      border: "border-sales/20",
      hover: "hover:bg-sales/5 hover:border-sales/40",
    },
    inventory: {
      bg: "bg-inventory/10",
      text: "text-inventory",
      border: "border-inventory/20",
      hover: "hover:bg-inventory/5 hover:border-inventory/40",
    },
    customers: {
      bg: "bg-customers/10",
      text: "text-customers",
      border: "border-customers/20",
      hover: "hover:bg-customers/5 hover:border-customers/40",
    },
    expenses: {
      bg: "bg-expenses/10",
      text: "text-expenses",
      border: "border-expenses/20",
      hover: "hover:bg-expenses/5 hover:border-expenses/40",
    },
    purchases: {
      bg: "bg-purchases/10",
      text: "text-purchases",
      border: "border-purchases/20",
      hover: "hover:bg-purchases/5 hover:border-purchases/40",
    },
    reports: {
      bg: "bg-reports/10",
      text: "text-reports",
      border: "border-reports/20",
      hover: "hover:bg-reports/5 hover:border-reports/40",
    },
    users: {
      bg: "bg-users/10",
      text: "text-users",
      border: "border-users/20",
      hover: "hover:bg-users/5 hover:border-users/40",
    },
    settings: {
      bg: "bg-settings/10",
      text: "text-settings",
      border: "border-settings/20",
      hover: "hover:bg-settings/5 hover:border-settings/40",
    },
    tables: {
      bg: "bg-tables/10",
      text: "text-tables",
      border: "border-tables/20",
      hover: "hover:bg-tables/5 hover:border-tables/40",
    },
    default: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      hover: "hover:bg-primary/5 hover:border-primary/40",
    },
  };

  const shapeClass = {
    circle: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none",
  }[iconShape];

  // Use variant styles if no legacy colors provided
  const iconBg = iconBgColor || variantStyles[variant].bg;
  const iconTextColor = variantStyles[variant].text;
  const borderStyle = variantStyles[variant].border;
  const hoverStyle = hoverBorderColor || variantStyles[variant].hover;

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

  const content = (
    <>
      {/* Badge */}
      {badge && (
        <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full min-w-[1.5rem] text-center">
          {badge}
        </span>
      )}

      {/* Vertical layout */}
      {layout === "vertical" && icon && (
        <div className="text-3xl mb-3 flex justify-center">
          <div className={`w-16 h-16 ${iconBg} ${shapeClass} flex items-center justify-center`}>
            {renderIcon()}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`flex items-start ${layout === "horizontal" ? "gap-4" : "flex-col"}`}>
        {/* Horizontal layout icon */}
        {layout === "horizontal" && icon && (
          <div
            className={`w-12 h-12 ${iconBg} ${shapeClass} flex items-center justify-center flex-shrink-0`}
          >
            {renderIcon()}
          </div>
        )}

        {/* Text content */}
        <div className={`flex-1 ${layout === "vertical" ? "text-center" : ""}`}>
          <h3
            className={`font-semibold text-foreground ${
              layout === "vertical" ? "text-lg mb-2" : "text-base"
            }`}
          >
            {title}
          </h3>
          <p className={`text-sm text-muted-foreground ${layout === "vertical" ? "" : "mt-1"}`}>
            {description}
          </p>
        </div>
      </div>
    </>
  );

  const baseClasses = `
    relative
    glass
    border-2 ${borderStyle}
    rounded-xl
    p-6
    shadow-sm
    transition-all duration-300
    touch-target-lg
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
    ${
      disabled
        ? "opacity-50 cursor-not-allowed"
        : `${hoverStyle} hover:scale-[1.02] hover:shadow-lg active:scale-95`
    }
    ${className}
  `;

  // Render as Link
  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  // Render as button
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} text-left w-full`}>
      {content}
    </button>
  );
};
