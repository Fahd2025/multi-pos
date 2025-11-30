/**
 * useApiError Hook
 * Manages API error state and provides user-friendly error handling
 */

"use client";

import { useState, useCallback } from "react";

export interface ApiErrorState {
  error: any | null;
  isError: boolean;
  errorMessage: string | null;
}

export function useApiError() {
  const [errorState, setErrorState] = useState<ApiErrorState>({
    error: null,
    isError: false,
    errorMessage: null,
  });

  /**
   * Set an error
   */
  const setError = useCallback((error: any) => {
    const message = getErrorMessage(error);
    setErrorState({
      error,
      isError: true,
      errorMessage: message,
    });
  }, []);

  /**
   * Clear the error
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: null,
    });
  }, []);

  /**
   * Execute an async function with error handling
   */
  const executeWithErrorHandling = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        clearError();
        const result = await fn();
        return result;
      } catch (error) {
        setError(error);
        return null;
      }
    },
    [setError, clearError]
  );

  return {
    ...errorState,
    setError,
    clearError,
    executeWithErrorHandling,
  };
}

/**
 * Extract user-friendly error message from error object
 */
function getErrorMessage(error: any): string {
  // Network error
  if (error?.request && !error?.response) {
    return "Unable to connect to the server. Please check your internet connection.";
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
    return "The requested resource was not found. The backend service may not be running.";
  }

  if (error?.response?.status === 401) {
    return "Authentication required. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to access this resource.";
  }

  if (error?.response?.status >= 500) {
    return "A server error occurred. Please try again later.";
  }

  // Generic error
  if (error?.message) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}
