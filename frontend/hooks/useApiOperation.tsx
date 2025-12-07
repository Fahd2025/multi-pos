/**
 * useApiOperation Hook
 *
 * Standardized hook for handling API operations with automatic toast notifications
 * and error handling. Combines useApiError and useToast for comprehensive feedback.
 *
 * @example
 * ```tsx
 * const { execute, isLoading, error } = useApiOperation();
 *
 * const handleSubmit = async (data) => {
 *   await execute({
 *     operation: () => productService.createProduct(data),
 *     successMessage: "Product created successfully",
 *     errorMessage: "Failed to create product",
 *     onSuccess: () => {
 *       router.push("/products");
 *     }
 *   });
 * };
 * ```
 */

"use client";

import { useState, useCallback } from "react";
import { useToast } from "./useToast";

export interface ApiOperationOptions<T> {
  /** The async operation to execute */
  operation: () => Promise<T>;

  /** Success message (title) to display in toast */
  successMessage?: string;

  /** Optional success message detail */
  successDetail?: string;

  /** Error message (title) to display in toast. If not provided, uses extracted error message */
  errorMessage?: string;

  /** Callback to execute on success (receives operation result) */
  onSuccess?: (result: T) => void | Promise<void>;

  /** Callback to execute on error (receives error object) */
  onError?: (error: any) => void | Promise<void>;

  /** Whether to show toast notifications (default: true) */
  showToast?: boolean;

  /** Custom success toast duration in ms (default: 5000) */
  successDuration?: number;

  /** Custom error toast duration in ms (default: 8000) */
  errorDuration?: number;
}

export interface ApiOperationResult {
  /** Execute an API operation with automatic error handling and toast notifications */
  execute: <T>(options: ApiOperationOptions<T>) => Promise<T | null>;

  /** Whether an operation is currently executing */
  isLoading: boolean;

  /** Current error (if any) */
  error: any | null;

  /** User-friendly error message */
  errorMessage: string | null;

  /** Clear the current error */
  clearError: () => void;
}

export function useApiOperation(): ApiOperationResult {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setErrorMessage(null);
  }, []);

  const execute = useCallback(
    async <T,>(options: ApiOperationOptions<T>): Promise<T | null> => {
      const {
        operation,
        successMessage,
        successDetail,
        errorMessage: customErrorMessage,
        onSuccess,
        onError,
        showToast = true,
        successDuration = 5000,
        errorDuration = 8000,
      } = options;

      setIsLoading(true);
      clearError();

      try {
        // Execute the operation
        const result = await operation();

        // Show success toast if message provided
        if (showToast && successMessage) {
          toast.success(successMessage, successDetail, successDuration);
        }

        // Execute success callback
        if (onSuccess) {
          await onSuccess(result);
        }

        return result;
      } catch (err: any) {
        console.error("API Operation Error:", err);

        // Extract error message
        const extractedMessage = extractErrorMessage(err);
        const displayMessage = customErrorMessage || extractedMessage;

        // Set error state
        setError(err);
        setErrorMessage(displayMessage);

        // Show error toast
        if (showToast) {
          // For specific error types, provide more context
          const errorDetail = getErrorDetail(err);
          toast.error(displayMessage, errorDetail, errorDuration);
        }

        // Execute error callback
        if (onError) {
          await onError(err);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, clearError]
  );

  return {
    execute,
    isLoading,
    error,
    errorMessage,
    clearError,
  };
}

/**
 * Extract user-friendly error message from error object
 */
function extractErrorMessage(error: any): string {
  // Network error
  if (error?.request && !error?.response) {
    return "Unable to connect to server";
  }

  // API error with custom message
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // HTTP status errors
  if (error?.response?.status === 404) {
    return "Resource not found";
  }

  if (error?.response?.status === 401) {
    return "Authentication required";
  }

  if (error?.response?.status === 403) {
    return "Access denied";
  }

  if (error?.response?.status >= 500) {
    return "Server error occurred";
  }

  // Generic error
  if (error?.message) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Get additional error detail for toast notification
 */
function getErrorDetail(error: any): string | undefined {
  // Network error
  if (error?.request && !error?.response) {
    return "Please check your internet connection and try again.";
  }

  // 404 - Not Found
  if (error?.response?.status === 404) {
    return "The backend service may not be running. Please contact support.";
  }

  // 401 - Unauthorized
  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  // 403 - Forbidden
  if (error?.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  // 500 - Server Error
  if (error?.response?.status >= 500) {
    return "Please try again later. If the problem persists, contact support.";
  }

  // Return API error details if available
  if (error?.response?.data?.error?.details) {
    return error.response.data.error.details;
  }

  return undefined;
}

/**
 * Quick helper hook for simple operations that only need success toast
 */
export function useQuickOperation() {
  const { execute } = useApiOperation();

  const executeQuick = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      successMessage: string,
      errorMessage?: string
    ): Promise<T | null> => {
      return execute({
        operation,
        successMessage,
        errorMessage,
      });
    },
    [execute]
  );

  return executeQuick;
}

/**
 * Helper hook for operations that need custom error handling but still want toast
 */
export function useApiOperationWithCallback() {
  const { execute, isLoading, error, errorMessage, clearError } = useApiOperation();

  return {
    execute,
    isLoading,
    error,
    errorMessage,
    clearError,
  };
}
