/**
 * ActionCard Component
 *
 * Reusable card component for clickable action items with icon, title, and description.
 * Can be rendered as a button or Link.
 *
 * @example
 * ```tsx
 * <ActionCard
 *   title="Manage Inventory"
 *   description="View and update stock"
 *   icon="📦"
 *   iconBgColor="bg-green-100"
 *   onClick={() => router.push('/inventory')}
 * />
 *
 * <ActionCard
 *   title="View Reports"
 *   description="Analytics and insights"
 *   icon={<ChartIcon />}
 *   iconBgColor="bg-purple-100"
 *   href="/reports"
 * />
 * ```
 */

import React from "react";
import Link from "next/link";

export interface ActionCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Icon (emoji or React node) */
  icon?: React.ReactNode;
  /** Background color class for icon container (e.g., "bg-blue-100") */
  iconBgColor?: string;
  /** Icon container shape */
  iconShape?: "circle" | "rounded" | "square";
  /** Border color when hovered (e.g., "border-blue-500") */
  hoverBorderColor?: string;
  /** Background color for the whole card (e.g., "bg-blue-50") */
  bgColor?: string;
  /** Click handler (use this OR href, not both) */
  onClick?: () => void;
  /** Link href (use this OR onClick, not both) */
  href?: string;
  /** Additional CSS classes */
  className?: string;
  /** Layout direction */
  layout?: "horizontal" | "vertical";
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  iconBgColor = "bg-blue-100 dark:bg-blue-900/20",
  iconShape = "rounded",
  hoverBorderColor = "border-blue-500 dark:border-blue-400",
  bgColor = "bg-white dark:bg-gray-800 ",
  onClick,
  href,
  className = "",
  layout = "horizontal",
}) => {
  const shapeClass = {
    circle: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none",
  }[iconShape];

  const content = (
    <>
      {layout === "vertical" && icon && (
        <div className="text-3xl mb-3">
          {typeof icon === "string" ? icon : <div className="text-4xl">{icon}</div>}
        </div>
      )}
      <div className={`flex items-center ${layout === "horizontal" ? "gap-4" : "flex-col"}`}>
        {layout === "horizontal" && icon && (
          <div
            className={`w-12 h-12 ${iconBgColor} ${shapeClass} flex items-center justify-center flex-shrink-0`}
          >
            {typeof icon === "string" ? <span className="text-2xl">{icon}</span> : icon}
          </div>
        )}
        <div className={layout === "vertical" ? "text-center" : ""}>
          <h3
            className={`font-semibold text-gray-900 dark:text-gray-100 ${
              layout === "vertical" ? "text-lg mb-2" : ""
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-sm text-gray-600 dark:text-gray-400 ${
              layout === "vertical" ? "" : "mt-1"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </>
  );

  const baseClasses = `${bgColor} border-2 border-gray-200 dark:border-gray-700 hover:${hoverBorderColor} rounded-lg p-6 hover:shadow-md transition-all ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} text-left w-full touch-manipulation active:scale-95`}
    >
      {content}
    </button>
  );
};
