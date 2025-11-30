/**
 * InfoBanner Component
 *
 * Reusable banner component for displaying informational messages, tips, or help content.
 *
 * @example
 * ```tsx
 * <InfoBanner
 *   variant="info"
 *   title="Quick Tips"
 *   icon="💡"
 * >
 *   <p>Here are some helpful tips for using this feature...</p>
 * </InfoBanner>
 *
 * <InfoBanner variant="warning" title="Important Notice">
 *   Please backup your data before proceeding.
 * </InfoBanner>
 * ```
 */

import React from 'react';

export interface InfoBannerProps {
  /** Banner variant/type */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Optional title */
  title?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Banner content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Dismissable banner */
  onDismiss?: () => void;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  variant = 'info',
  title,
  icon,
  children,
  className = '',
  onDismiss,
}) => {
  const variantStyles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      title: 'text-blue-900 dark:text-blue-100',
      content: 'text-blue-800 dark:text-blue-300',
      icon: '💡',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      title: 'text-green-900 dark:text-green-100',
      content: 'text-green-800 dark:text-green-300',
      icon: '✅',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      title: 'text-yellow-900 dark:text-yellow-100',
      content: 'text-yellow-800 dark:text-yellow-300',
      icon: '⚠️',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      title: 'text-red-900 dark:text-red-100',
      content: 'text-red-800 dark:text-red-300',
      icon: '❌',
    },
  }[variant];

  const displayIcon = icon || variantStyles.icon;

  return (
    <div
      className={`${variantStyles.bg} border ${variantStyles.border} rounded-lg p-4 md:p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        {displayIcon && (
          <span className="text-2xl flex-shrink-0">
            {typeof displayIcon === 'string' ? displayIcon : displayIcon}
          </span>
        )}
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold ${variantStyles.title} mb-2`}>{title}</h3>
          )}
          <div className={`text-sm ${variantStyles.content}`}>{children}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${variantStyles.title} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
