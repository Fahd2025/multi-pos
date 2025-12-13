/**
 * useModal Hook
 *
 * Custom hook for managing modal state and operations.
 * Provides a clean API for opening, closing, and managing modal data.
 *
 * @example
 * ```tsx
 * const modal = useModal<Product>();
 *
 * // Open modal with data
 * modal.open(product, 'edit');
 *
 * // Close modal
 * modal.close();
 *
 * // Use in component
 * <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *   {modal.data && <div>{modal.data.name}</div>}
 * </Modal>
 * ```
 */

import { useState, useCallback } from "react";

export type ModalMode = "create" | "edit" | "view" | "delete" | "custom";

interface UseModalState<T> {
  /** Whether modal is open */
  isOpen: boolean;
  /** Current modal data */
  data: T | null;
  /** Current modal mode */
  mode: ModalMode;
}

interface UseModalReturn<T> {
  /** Whether modal is open */
  isOpen: boolean;
  /** Current modal data */
  data: T | null;
  /** Current modal mode */
  mode: ModalMode;
  /** Open modal with optional data and mode */
  open: (data?: T, mode?: ModalMode) => void;
  /** Close modal and clear data */
  close: () => void;
  /** Update modal data without closing */
  setData: (data: T | null) => void;
  /** Update modal mode without closing */
  setMode: (mode: ModalMode) => void;
}

/**
 * Hook for managing modal state
 */
export function useModal<T = any>(initialMode: ModalMode = "create"): UseModalReturn<T> {
  const [state, setState] = useState<UseModalState<T>>({
    isOpen: false,
    data: null,
    mode: initialMode,
  });

  const open = useCallback(
    (data?: T, mode: ModalMode = initialMode) => {
      setState({
        isOpen: true,
        data: data || null,
        mode,
      });
    },
    [initialMode]
  );

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
    // Clear data after animation completes
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        data: null,
      }));
    }, 300); // Match modal animation duration
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({
      ...prev,
      data,
    }));
  }, []);

  const setMode = useCallback((mode: ModalMode) => {
    setState((prev) => ({
      ...prev,
      mode,
    }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    mode: state.mode,
    open,
    close,
    setData,
    setMode,
  };
}
