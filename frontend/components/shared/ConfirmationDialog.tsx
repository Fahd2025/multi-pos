/**
 * ConfirmationDialog Component
 *
 * A modal dialog for confirming user actions (delete, save, etc.).
 * Features customizable messages, variants, and async action support.
 *
 * Features:
 * - Visual variants (danger, warning, info, success)
 * - Custom messages and labels
 * - Async action support with loading states
 * - Icon support for visual context
 * - Keyboard shortcuts (Enter to confirm, Esc to cancel)
 * - Accessible with ARIA attributes
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   isOpen={confirmation.isOpen}
 *   onClose={confirmation.close}
 *   title="Delete Product"
 *   message="Are you sure you want to delete this product? This action cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 *   onConfirm={async () => {
 *     await deleteProduct(id);
 *   }}
 * />
 * ```
 */

'use client';

import React, { useEffect } from 'react';
import { ConfirmationDialogProps } from '@/types/data-table.types';

export function ConfirmationDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isProcessing = false,
  variant = 'info',
  icon
}: ConfirmationDialogProps) {

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      } else if (e.key === 'Enter' && !isProcessing) {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose, onConfirm]);

  // Variant styles
  const variantStyles = {
    danger: {
      icon: icon || (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      buttonText: 'text-white'
    },
    warning: {
      icon: icon || (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      buttonText: 'text-white'
    },
    info: {
      icon: icon || (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      buttonText: 'text-white'
    },
    success: {
      icon: icon || (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      buttonText: 'text-white'
    }
  };

  const styles = variantStyles[variant];

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpScale {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
          style={{ animation: "fadeIn 0.3s ease" }}
          onClick={!isProcessing ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Dialog Container */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-gray-800 rounded-2xl transform transition-all w-full max-w-md"
            style={{
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              animation: "slideUpScale 0.3s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} ${styles.iconColor} mb-4`}>
              {styles.icon}
            </div>

            {/* Title */}
            <h3 id="confirmation-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              {title}
            </h3>

            {/* Message */}
            <p id="confirmation-message" className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center ${styles.buttonBg} ${styles.buttonText}`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>

            {/* Keyboard hint */}
            {!isProcessing && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded">Enter</kbd> to confirm or{' '}
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded">Esc</kbd> to cancel
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
