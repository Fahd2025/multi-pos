/**
 * useDialog Hook
 *
 * Custom hook for managing alert and confirmation dialogs.
 * Provides a clean API for showing alerts and getting user confirmation.
 *
 * @example
 * ```tsx
 * const dialog = useDialog();
 *
 * // Show alert
 * dialog.alert('Success', 'Product saved successfully!', 'success');
 *
 * // Show error
 * dialog.error('Failed to save product');
 *
 * // Show confirmation
 * const confirmed = await dialog.confirm(
 *   'Delete Product',
 *   'Are you sure you want to delete this product?'
 * );
 * if (confirmed) {
 *   // Delete the product
 * }
 * ```
 */

import { useState, useCallback } from 'react';

export type DialogType = 'info' | 'warning' | 'danger' | 'success';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: DialogType;
  showCancel: boolean;
  confirmText: string;
  cancelText: string;
  onConfirm: (() => Promise<void> | void) | null;
}

interface UseDialogReturn {
  /** Dialog state */
  isOpen: boolean;
  title: string;
  message: string;
  type: DialogType;
  showCancel: boolean;
  confirmText: string;
  cancelText: string;
  isProcessing: boolean;

  /** Show an alert dialog */
  alert: (title: string, message: string, type?: DialogType) => void;

  /** Show an error alert */
  error: (message: string, title?: string) => void;

  /** Show a success alert */
  success: (message: string, title?: string) => void;

  /** Show a warning alert */
  warning: (message: string, title?: string) => void;

  /** Show a confirmation dialog and return a promise */
  confirm: (
    title: string,
    message: string,
    type?: DialogType,
    confirmText?: string,
    cancelText?: string
  ) => Promise<boolean>;

  /** Handle confirm button click */
  handleConfirm: () => Promise<void>;

  /** Handle cancel/close */
  handleClose: () => void;
}

export function useDialog(): UseDialogReturn {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const alert = useCallback((
    title: string,
    message: string,
    type: DialogType = 'info'
  ) => {
    setState({
      isOpen: true,
      title,
      message,
      type,
      showCancel: false,
      confirmText: 'OK',
      cancelText: 'Cancel',
      onConfirm: null,
    });
  }, []);

  const error = useCallback((message: string, title: string = 'Error') => {
    alert(title, message, 'danger');
  }, [alert]);

  const success = useCallback((message: string, title: string = 'Success') => {
    alert(title, message, 'success');
  }, [alert]);

  const warning = useCallback((message: string, title: string = 'Warning') => {
    alert(title, message, 'warning');
  }, [alert]);

  const confirm = useCallback((
    title: string,
    message: string,
    type: DialogType = 'warning',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title,
        message,
        type,
        showCancel: true,
        confirmText,
        cancelText,
        onConfirm: null,
      });
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (state.onConfirm) {
      setIsProcessing(true);
      try {
        await state.onConfirm();
        setState(prev => ({ ...prev, isOpen: false }));
        if (resolvePromise) {
          resolvePromise(true);
          setResolvePromise(null);
        }
      } catch (error) {
        console.error('Dialog action failed:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Simple confirmation
      setState(prev => ({ ...prev, isOpen: false }));
      if (resolvePromise) {
        resolvePromise(true);
        setResolvePromise(null);
      }
    }
  }, [state.onConfirm, resolvePromise]);

  const handleClose = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    type: state.type,
    showCancel: state.showCancel,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    isProcessing,
    alert,
    error,
    success,
    warning,
    confirm,
    handleConfirm,
    handleClose,
  };
}
