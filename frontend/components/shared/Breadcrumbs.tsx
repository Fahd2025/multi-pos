/**
 * Breadcrumbs Component
 * Navigation breadcrumbs for showing current location in the app hierarchy
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Dashboard', href: '/branch', icon: Home },
 *     { label: 'Inventory', href: '/branch/inventory', icon: Package },
 *     { label: 'Products' }
 *   ]}
 * />
 * ```
 */

import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

export interface Breadcrumb {
  /** Label text for the breadcrumb */
  label: string;
  /** Optional link href (if not provided, renders as plain text) */
  href?: string;
  /** Optional icon (Lucide icon component) */
  icon?: LucideIcon;
}

export interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: Breadcrumb[];
  /** Additional CSS classes */
  className?: string;
  /** Separator icon - defaults to ChevronRight */
  separator?: React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = "",
  separator,
}) => {
  const Separator = separator || <ChevronRight className="w-4 h-4 text-muted-foreground" />;

  return (
    <nav
      className={`flex items-center gap-2 text-sm mb-4 ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center gap-2">
              {/* Breadcrumb item */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors touch-target-sm rounded px-2 py-1 -mx-2 -my-1"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast ? "text-foreground font-medium" : "text-muted-foreground"
                  } px-2 py-1 -mx-2 -my-1`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </span>
              )}

              {/* Separator (not after last item) */}
              {!isLast && <span aria-hidden="true">{Separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
