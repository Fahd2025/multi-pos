/**
 * ErrorAlert Component
 *
 * Reusable error alert component for displaying error messages.
 *
 * @example
 * ```tsx
 * {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
 * <ErrorAlert message="Failed to load data" />
 * ```
 */

import React from 'react';

export interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      className={`bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1">{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 focus:outline-none"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

/**
 * SuccessAlert Component
 *
 * Reusable success alert component for displaying success messages.
 */
export interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({
  message,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      className={`bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1">{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 flex-shrink-0 text-green-400 hover:text-green-600 focus:outline-none"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
