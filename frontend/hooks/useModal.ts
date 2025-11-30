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

import { useState, useCallback } from 'react';

export type ModalMode = 'create' | 'edit' | 'view' | 'delete' | 'custom';

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
export function useModal<T = any>(initialMode: ModalMode = 'create'): UseModalReturn<T> {
  const [state, setState] = useState<UseModalState<T>>({
    isOpen: false,
    data: null,
    mode: initialMode
  });

  const open = useCallback((data?: T, mode: ModalMode = initialMode) => {
    setState({
      isOpen: true,
      data: data || null,
      mode
    });
  }, [initialMode]);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false
    }));
    // Clear data after animation completes
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        data: null
      }));
    }, 300); // Match modal animation duration
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data
    }));
  }, []);

  const setMode = useCallback((mode: ModalMode) => {
    setState(prev => ({
      ...prev,
      mode
    }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    mode: state.mode,
    open,
    close,
    setData,
    setMode
  };
}

/**
 * useConfirmation Hook
 *
 * Specialized hook for confirmation dialogs.
 *
 * @example
 * ```tsx
 * const confirmation = useConfirmation();
 *
 * const handleDelete = async (item) => {
 *   confirmation.ask(
 *     'Delete Item',
 *     `Are you sure you want to delete ${item.name}?`,
 *     async () => {
 *       await deleteItem(item.id);
 *     }
 *   );
 * };
 * ```
 */
interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => Promise<void> | void) | null;
  variant: 'danger' | 'warning' | 'info' | 'success';
}

interface UseConfirmationReturn {
  /** Whether confirmation dialog is open */
  isOpen: boolean;
  /** Confirmation title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirmation variant */
  variant: 'danger' | 'warning' | 'info' | 'success';
  /** Ask for confirmation */
  ask: (
    title: string,
    message: string,
    onConfirm: () => Promise<void> | void,
    variant?: 'danger' | 'warning' | 'info' | 'success'
  ) => void;
  /** Confirm and execute action */
  confirm: () => Promise<void>;
  /** Cancel and close */
  cancel: () => void;
  /** Whether action is processing */
  isProcessing: boolean;
}

export function useConfirmation(): UseConfirmationReturn {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'info'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const ask = useCallback((
    title: string,
    message: string,
    onConfirm: () => Promise<void> | void,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'info'
  ) => {
    setState({
      isOpen: true,
      title,
      message,
      onConfirm,
      variant
    });
  }, []);

  const confirm = useCallback(async () => {
    if (state.onConfirm) {
      setIsProcessing(true);
      try {
        await state.onConfirm();
        setState(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error('Confirmation action failed:', error);
        // Keep dialog open on error
      } finally {
        setIsProcessing(false);
      }
    }
  }, [state.onConfirm]);

  const cancel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    variant: state.variant,
    ask,
    confirm,
    cancel,
    isProcessing
  };
}
