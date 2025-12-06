/**
 * useConfirmation Hook
 *
 * Custom hook for managing confirmation dialogs with data.
 * Provides a clean API for opening, closing, and managing confirmation state.
 *
 * @example
 * ```tsx
 * const confirmation = useConfirmation<Product>();
 *
 * // Open confirmation with data
 * confirmation.open(product);
 *
 * // Close confirmation
 * confirmation.close();
 *
 * // Use in component
 * <ConfirmationDialog
 *   isOpen={confirmation.isOpen}
 *   onClose={confirmation.close}
 *   onConfirm={handleDelete}
 *   message={`Delete ${confirmation.data?.name}?`}
 * />
 * ```
 */

import { useState, useCallback } from 'react';

interface UseConfirmationState<T> {
  /** Whether confirmation dialog is open */
  isOpen: boolean;
  /** Current confirmation data */
  data: T | null;
}

interface UseConfirmationReturn<T> {
  /** Whether confirmation dialog is open */
  isOpen: boolean;
  /** Current confirmation data */
  data: T | null;
  /** Open confirmation with optional data */
  open: (data?: T) => void;
  /** Close confirmation and clear data */
  close: () => void;
  /** Update confirmation data without closing */
  setData: (data: T | null) => void;
}

/**
 * Hook for managing confirmation dialog state
 */
export function useConfirmation<T = any>(): UseConfirmationReturn<T> {
  const [state, setState] = useState<UseConfirmationState<T>>({
    isOpen: false,
    data: null,
  });

  const open = useCallback((data?: T) => {
    setState({
      isOpen: true,
      data: data || null,
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
    // Clear data after animation completes
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        data: null,
      }));
    }, 300); // Match dialog animation duration
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
    }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    setData,
  };
}
