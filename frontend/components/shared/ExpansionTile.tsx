/**
 * ExpansionTile Component
 *
 * A mobile-friendly expandable card component for displaying data rows.
 * Designed to replace data tables on small screens with a more touch-friendly interface.
 *
 * Features:
 * - Collapsible/expandable card view
 * - Displays summary information when collapsed
 * - Shows detailed information when expanded
 * - Actions menu for row operations
 * - Image support for visual data
 * - Responsive and touch-friendly
 *
 * @example
 * ```tsx
 * <ExpansionTile
 *   title="Product Name"
 *   subtitle="Category Name"
 *   imageUrl="/path/to/image.jpg"
 *   details={[
 *     { label: 'Price', value: '$99.99' },
 *     { label: 'Stock', value: '50 units' }
 *   ]}
 *   actions={[
 *     { label: 'Edit', onClick: handleEdit, variant: 'primary' },
 *     { label: 'Delete', onClick: handleDelete, variant: 'danger' }
 *   ]}
 * />
 * ```
 */

"use client";

import React, { useState } from "react";

export interface ExpansionTileDetail {
  label: string;
  value: React.ReactNode;
}

export interface ExpansionTileAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  icon?: React.ReactNode;
  condition?: boolean;
}

export interface ExpansionTileProps {
  /** Main title displayed when collapsed */
  title: string;
  /** Subtitle displayed below title */
  subtitle?: string;
  /** Badge or status indicator */
  badge?: React.ReactNode;
  /** Image URL or image URLs array */
  imageUrl?: string | string[];
  /** Alt text for image */
  imageAlt?: string;
  /** Detailed key-value pairs shown when expanded */
  details?: ExpansionTileDetail[];
  /** Actions available for this item */
  actions?: ExpansionTileAction[];
  /** Additional content shown when expanded */
  children?: React.ReactNode;
  /** Whether the tile is initially expanded */
  defaultExpanded?: boolean;
  /** Click handler for image */
  onImageClick?: (images: string[]) => void;
  /** Row number */
  rowNumber?: number;
  /** Default icon/emoji to show when no image is available */
  defaultIcon?: React.ReactNode;
}

export function ExpansionTile({
  title,
  subtitle,
  badge,
  imageUrl,
  imageAlt = "",
  details = [],
  actions = [],
  children,
  defaultExpanded = false,
  onImageClick,
  rowNumber,
  defaultIcon = "🖼️",
}: ExpansionTileProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const images = imageUrl ? (Array.isArray(imageUrl) ? imageUrl : [imageUrl]) : [];
  const firstImage = images[0];
  const hasMultipleImages = images.length > 1;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onImageClick) {
      onImageClick(images);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800  border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-start gap-3">
          {/* Row Number */}
          {rowNumber !== undefined && (
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
              {rowNumber}
            </div>
          )}

          {/* Image */}
          {(imageUrl || images.length > 0) && (
            <div className="flex-shrink-0">
              <div
                className={`w-16 h-16 relative ${
                  onImageClick && firstImage ? "cursor-pointer" : ""
                }`}
                onClick={onImageClick && firstImage ? handleImageClick : undefined}
              >
                {firstImage ? (
                  <>
                    <img
                      src={firstImage}
                      alt={imageAlt}
                      className="w-full h-full object-cover rounded border border-gray-200 dark:border-gray-600"
                    />
                    {hasMultipleImages && (
                      <div className="absolute bottom-1 right-1 bg-black/70 dark:bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        +{images.length - 1}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center text-3xl">
                    {defaultIcon}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Badge */}
              {badge && <div className="flex-shrink-0">{badge}</div>}
            </div>

            {/* Preview Details (first 2 when collapsed) */}
            {!isExpanded && details.length > 0 && (
              <div className="mt-2 space-y-1">
                {details.slice(0, 2).map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{detail.label}:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expand Icon */}
          <div className="flex-shrink-0 ml-2">
            <svg
              className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {/* All Details */}
          {details.length > 0 && (
            <div className="px-4 py-3 space-y-2">
              {details.map((detail, index) => (
                <div key={index} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium min-w-[100px]">
                    {detail.label}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 text-right flex-1">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Custom Children */}
          {children && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              {children}
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-3">
              {actions.map((action, index) => {
                // Check if action should be shown
                if (action.condition === false) {
                  return null;
                }

                // Icon-based color variants with improved contrast
                const iconVariantClasses = {
                  primary:
                    "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30",
                  secondary:
                    "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700",
                  danger:
                    "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30",
                  success:
                    "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30",
                };

                // Get default icon based on label if no icon provided
                const getDefaultIcon = (label: string) => {
                  const lowerLabel = label.toLowerCase();
                  if (lowerLabel.includes("view") || lowerLabel.includes("see") || lowerLabel.includes("show")) {
                    return (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    );
                  }
                  if (lowerLabel.includes("edit") || lowerLabel.includes("update") || lowerLabel.includes("modify")) {
                    return (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    );
                  }
                  if (lowerLabel.includes("delete") || lowerLabel.includes("remove")) {
                    return (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    );
                  }
                  if (lowerLabel.includes("stock") || lowerLabel.includes("inventory")) {
                    return (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    );
                  }
                  // Default icon for other actions
                  return action.icon || label;
                };

                const displayIcon = action.icon || getDefaultIcon(action.label);

                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={`${
                      iconVariantClasses[action.variant || "primary"]
                    } p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 active:scale-95`}
                    aria-label={action.label}
                    title={action.label}
                  >
                    {displayIcon}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
