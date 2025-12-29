"use client";

/**
 * Input Component
 * Enhanced reusable input field with validation states and touch optimization
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   required
 * />
 *
 * <Input
 *   label="Price"
 *   type="number"
 *   stepperButtons
 *   clearButton
 * />
 *
 * <Input
 *   label="Search"
 *   leftIcon={<Search />}
 *   clearButton
 * />
 * ```
 */

import React, { forwardRef, useState } from "react";
import { X, Plus, Minus } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFullWidth?: boolean;
  /** Show clear button (X) for text inputs */
  clearButton?: boolean;
  /** Show +/- stepper buttons for number inputs */
  stepperButtons?: boolean;
  /** Touch optimization - ensures 48px height on mobile */
  touchOptimized?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isFullWidth = true,
      className = "",
      id,
      type = "text",
      clearButton = false,
      stepperButtons = false,
      touchOptimized = true,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = !!error;
    const [internalValue, setInternalValue] = useState(value || "");

    // Handle value changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    // Clear input
    const handleClear = () => {
      const syntheticEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      setInternalValue("");
      onChange?.(syntheticEvent);
    };

    // Number stepper functions
    const handleIncrement = () => {
      if (type !== "number") return;
      const currentValue = Number(internalValue || 0);
      const step = Number(props.step || 1);
      const max = props.max ? Number(props.max) : undefined;
      const newValue = currentValue + step;

      if (max === undefined || newValue <= max) {
        const syntheticEvent = {
          target: { value: String(newValue) },
        } as React.ChangeEvent<HTMLInputElement>;
        setInternalValue(String(newValue));
        onChange?.(syntheticEvent);
      }
    };

    const handleDecrement = () => {
      if (type !== "number") return;
      const currentValue = Number(internalValue || 0);
      const step = Number(props.step || 1);
      const min = props.min ? Number(props.min) : undefined;
      const newValue = currentValue - step;

      if (min === undefined || newValue >= min) {
        const syntheticEvent = {
          target: { value: String(newValue) },
        } as React.ChangeEvent<HTMLInputElement>;
        setInternalValue(String(newValue));
        onChange?.(syntheticEvent);
      }
    };

    // Base input styles with touch optimization
    const baseStyles = `
      block rounded-lg border px-4 text-sm
      transition-colors
      focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
      bg-card text-foreground
      ${touchOptimized ? "py-3 phone:text-base min-h-touch-target" : "py-2"}
    `;

    // State styles
    const stateStyles = hasError
      ? "border-danger text-danger placeholder-danger/50 focus:ring-danger/50 focus:border-danger"
      : "border-border placeholder-muted-foreground focus:ring-primary/50 focus:border-primary";

    // Width styles
    const widthStyles = isFullWidth ? "w-full" : "";

    // Icon padding adjustments
    const leftPadding = leftIcon ? "pl-10" : "";
    const rightPadding = (rightIcon || clearButton || stepperButtons) ? "pr-10" : "";

    const inputStyles = `${baseStyles} ${stateStyles} ${widthStyles} ${leftPadding} ${rightPadding} ${className}`;

    // Show clear button only if there's a value and clearButton is true
    const showClearButton = clearButton && internalValue && !props.disabled;

    return (
      <div className={isFullWidth ? "w-full" : ""}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={inputStyles}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            value={value !== undefined ? value : internalValue}
            onChange={handleChange}
            {...props}
          />

          {/* Right side controls */}
          <div className="absolute inset-y-0 right-0 flex items-center">
            {/* Clear button */}
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-muted-foreground hover:text-foreground touch-target-sm focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Number stepper buttons */}
            {stepperButtons && type === "number" && !props.disabled && (
              <div className="flex flex-col border-l border-border">
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-secondary touch-target-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-b border-border"
                  aria-label="Increment value"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-secondary touch-target-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Decrement value"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Right icon (if no clear button or stepper) */}
            {rightIcon && !showClearButton && !(stepperButtons && type === "number") && (
              <div className="pr-3 pointer-events-none text-muted-foreground">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-2 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-sm text-danger flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
