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

import { useState, useCallback } from "react";

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => Promise<void> | void) | null;
  variant: "danger" | "warning" | "info" | "success";
}

interface UseConfirmationReturn {
  /** Whether confirmation dialog is open */
  isOpen: boolean;
  /** Confirmation title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirmation variant */
  variant: "danger" | "warning" | "info" | "success";
  /** Ask for confirmation */
  ask: (
    title: string,
    message: string,
    onConfirm: () => Promise<void> | void,
    variant?: "danger" | "warning" | "info" | "success"
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
    title: "",
    message: "",
    onConfirm: null,
    variant: "info",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const ask = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => Promise<void> | void,
      variant: "danger" | "warning" | "info" | "success" = "info"
    ) => {
      setState({
        isOpen: true,
        title,
        message,
        onConfirm,
        variant,
      });
    },
    []
  );

  const confirm = useCallback(async () => {
    if (state.onConfirm) {
      setIsProcessing(true);
      try {
        await state.onConfirm();
        setState((prev) => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error("Confirmation action failed:", error);
        // Keep dialog open on error
      } finally {
        setIsProcessing(false);
      }
    }
  }, [state.onConfirm]);

  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    variant: state.variant,
    ask,
    confirm,
    cancel,
    isProcessing,
  };
}
