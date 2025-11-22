/**
 * Dialog Component
 * Confirmation/alert dialog component built on top of Modal
 */

"use client";

import React from 'react';
import { Modal, ModalBody, ModalFooter } from './Modal';
import { Button } from './Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
  isLoading = false,
}) => {
  // Icon based on dialog type
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        );
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  // Determine confirm button variant
  const getConfirmVariant = (): 'primary' | 'danger' | 'success' => {
    if (type === 'danger') return 'danger';
    if (type === 'success') return 'success';
    return 'primary';
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
    >
      <ModalBody>
        <div className="text-center">
          {getIcon()}
          <p className="mt-4 text-sm text-gray-600">{message}</p>
        </div>
      </ModalBody>

      <ModalFooter>
        {showCancel && (
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        )}
        {onConfirm && (
          <Button
            variant={getConfirmVariant()}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

/**
 * Convenience function to show a confirmation dialog
 */
export const showConfirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  type: 'info' | 'warning' | 'danger' | 'success' = 'warning'
): void => {
  // This would typically be implemented with a global dialog context
  // For now, this is a placeholder for the API
  console.warn('showConfirmDialog requires a DialogProvider. Use Dialog component directly for now.');
};

/**
 * Convenience function to show an alert dialog
 */
export const showAlertDialog = (
  title: string,
  message: string,
  type: 'info' | 'warning' | 'danger' | 'success' = 'info'
): void => {
  // This would typically be implemented with a global dialog context
  // For now, this is a placeholder for the API
  console.warn('showAlertDialog requires a DialogProvider. Use Dialog component directly for now.');
};
