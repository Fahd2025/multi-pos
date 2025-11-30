/**
 * Checkbox Component
 * Reusable checkbox input with label
 */

import React, { forwardRef } from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    // Base checkbox styles
    const baseStyles = 'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    // State styles
    const stateStyles = hasError ? 'border-red-300' : '';

    const checkboxStyles = `${baseStyles} ${stateStyles} ${className}`;

    return (
      <div>
        <div className="flex items-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={checkboxStyles}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${checkboxId}-error`
                : helperText
                ? `${checkboxId}-helper`
                : undefined
            }
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
        </div>

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${checkboxId}-helper`} className="mt-1 ml-6 text-sm text-gray-500">
            {helperText}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p id={`${checkboxId}-error`} className="mt-1 ml-6 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
