/**
 * API Error Alert Component
 * Displays user-friendly error messages for API failures
 */

"use client";

import React from "react";

export interface ApiErrorAlertProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ApiErrorAlert({ error, onRetry, onDismiss, className = "" }: ApiErrorAlertProps) {
  // Determine error type and message
  const getErrorInfo = () => {
    // Network error (no response)
    if (error?.request && !error?.response) {
      return {
        title: "Connection Error",
        message: "Unable to connect to the server. Please check your internet connection.",
        icon: "🔌",
        variant: "warning" as const,
      };
    }

    // 404 - Not Found
    if (error?.response?.status === 404) {
      return {
        title: "Service Unavailable",
        message: "The requested service is not available. The backend server may not be running.",
        icon: "🔍",
        variant: "warning" as const,
      };
    }

    // 401 - Unauthorized
    if (error?.response?.status === 401) {
      return {
        title: "Authentication Required",
        message: "Your session has expired. Please log in again.",
        icon: "🔒",
        variant: "danger" as const,
      };
    }

    // 403 - Forbidden
    if (error?.response?.status === 403) {
      return {
        title: "Access Denied",
        message: "You do not have permission to access this resource.",
        icon: "⛔",
        variant: "danger" as const,
      };
    }

    // 500 - Server Error
    if (error?.response?.status >= 500) {
      return {
        title: "Server Error",
        message: "An error occurred on the server. Please try again later.",
        icon: "⚠️",
        variant: "danger" as const,
      };
    }

    // Generic error
    return {
      title: "Error",
      message: error?.message || "An unexpected error occurred. Please try again.",
      icon: "❌",
      variant: "danger" as const,
    };
  };

  const errorInfo = getErrorInfo();

  const variantStyles = {
    danger: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[errorInfo.variant]} ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{errorInfo.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{errorInfo.title}</h3>
          <p className="text-sm opacity-90">{errorInfo.message}</p>

          {/* Technical details (collapsible) */}
          {error?.response?.status && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                Technical Details
              </summary>
              <div className="mt-2 text-xs font-mono bg-black bg-opacity-10 p-2 rounded">
                <div>Status: {error.response.status}</div>
                <div>URL: {error.config?.url}</div>
                {error.response?.data?.error?.code && (
                  <div>Code: {error.response.data.error.code}</div>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-xs font-medium rounded bg-white bg-opacity-50 hover:bg-opacity-100 transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline API Error Display
 * Compact error display for inline use
 */
export function InlineApiError({ error, onRetry }: { error: any; onRetry?: () => void }) {
  const isNetworkError = error?.request && !error?.response;
  const is404 = error?.response?.status === 404;

  if (isNetworkError || is404) {
    return (
      <div className="flex items-center justify-center py-8 px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3">{isNetworkError ? "🔌" : "🔍"}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isNetworkError ? "Connection Error" : "Service Unavailable"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {isNetworkError
              ? "Unable to connect to the server."
              : "The backend service is not available."}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8 px-4">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          {error?.message || "An unexpected error occurred."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 * Shows when data is empty (not an error)
 */
export function EmptyState({
  icon = "📭",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
