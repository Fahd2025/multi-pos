"use client";

/**
 * NumberPad Component
 * Touch-optimized number input pad for POS and other numeric entry scenarios
 *
 * @example
 * ```tsx
 * <NumberPad
 *   value={quantity}
 *   onChange={setQuantity}
 *   max={100}
 *   onConfirm={() => handleSubmit()}
 *   variant="sales"
 * />
 * ```
 */

import React, { useState, useEffect } from "react";
import { Check, X, Delete } from "lucide-react";
import { playSuccessBeep, playErrorBeep } from "@/lib/utils";

export interface NumberPadProps {
  /** Current value */
  value?: number | string;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Maximum allowed value */
  max?: number;
  /** Minimum allowed value */
  min?: number;
  /** Callback when confirm button is pressed */
  onConfirm?: () => void;
  /** Callback when cancel button is pressed */
  onCancel?: () => void;
  /** Color variant */
  variant?: "sales" | "inventory" | "default";
  /** Touch optimization - ensures larger buttons on mobile */
  touchOptimized?: boolean;
  /** Show decimal point button */
  showDecimal?: boolean;
  /** Label for the input */
  label?: string;
  /** Show the current value display */
  showDisplay?: boolean;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  value = 0,
  onChange,
  max,
  min = 0,
  onConfirm,
  onCancel,
  variant = "sales",
  touchOptimized = true,
  showDecimal = false,
  label = "Enter quantity",
  showDisplay = true,
}) => {
  const [internalValue, setInternalValue] = useState<string>(String(value));

  // Sync external value changes
  useEffect(() => {
    setInternalValue(String(value));
  }, [value]);

  // Handle number button press
  const handleNumberPress = (num: string) => {
    const newValue = internalValue === "0" ? num : internalValue + num;
    const numericValue = parseFloat(newValue);

    // Validate against max
    if (max !== undefined && numericValue > max) {
      playErrorBeep();
      return;
    }

    setInternalValue(newValue);
    onChange(numericValue);
    playSuccessBeep();
  };

  // Handle clear
  const handleClear = () => {
    setInternalValue("0");
    onChange(0);
    playErrorBeep();
  };

  // Handle backspace
  const handleBackspace = () => {
    const newValue = internalValue.length > 1 ? internalValue.slice(0, -1) : "0";
    const numericValue = parseFloat(newValue);
    setInternalValue(newValue);
    onChange(numericValue);
  };

  // Handle decimal
  const handleDecimal = () => {
    if (!internalValue.includes(".")) {
      const newValue = internalValue + ".";
      setInternalValue(newValue);
      playSuccessBeep();
    } else {
      playErrorBeep();
    }
  };

  // Handle confirm
  const handleConfirm = () => {
    const numericValue = parseFloat(internalValue);

    // Validate
    if (min !== undefined && numericValue < min) {
      playErrorBeep();
      return;
    }

    if (max !== undefined && numericValue > max) {
      playErrorBeep();
      return;
    }

    playSuccessBeep();
    onConfirm?.();
  };

  // Variant colors
  const variantColors = {
    sales: "bg-sales hover:bg-sales/90 text-white",
    inventory: "bg-inventory hover:bg-inventory/90 text-white",
    default: "bg-primary hover:bg-primary/90 text-white",
  };

  const confirmColor = variantColors[variant];

  // Button size classes
  const buttonSize = touchOptimized
    ? "min-w-[60px] min-h-[60px] phone:min-w-[72px] phone:min-h-[72px] text-xl"
    : "min-w-[48px] min-h-[48px] text-lg";

  return (
    <div className="flex flex-direction: column gap-4">
      {/* Display */}
      {showDisplay && (
        <div className="flex flex-col gap-2">
          {label && (
            <label className="text-sm font-medium text-foreground">{label}</label>
          )}
          <div className="bg-muted rounded-lg px-4 py-3 text-right">
            <div className="text-3xl font-bold text-foreground tabular-nums">
              {internalValue}
            </div>
            {max !== undefined && (
              <div className="text-xs text-muted-foreground mt-1">
                Max: {max}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Number pad grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberPress(String(num))}
            className={`
              ${buttonSize}
              flex items-center justify-center
              bg-card hover:bg-secondary
              border border-border rounded-lg
              font-semibold text-foreground
              transition-all duration-150
              touch-feedback
              active:scale-95
            `}
            type="button"
          >
            {num}
          </button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          onClick={handleClear}
          className={`
            ${buttonSize}
            flex items-center justify-center
            bg-destructive/10 hover:bg-destructive/20
            border border-destructive/30 rounded-lg
            font-semibold text-destructive
            transition-all duration-150
            touch-feedback
            active:scale-95
          `}
          type="button"
          title="Clear"
        >
          C
        </button>

        <button
          onClick={() => handleNumberPress("0")}
          className={`
            ${buttonSize}
            flex items-center justify-center
            bg-card hover:bg-secondary
            border border-border rounded-lg
            font-semibold text-foreground
            transition-all duration-150
            touch-feedback
            active:scale-95
          `}
          type="button"
        >
          0
        </button>

        {showDecimal ? (
          <button
            onClick={handleDecimal}
            className={`
              ${buttonSize}
              flex items-center justify-center
              bg-card hover:bg-secondary
              border border-border rounded-lg
              font-semibold text-foreground
              transition-all duration-150
              touch-feedback
              active:scale-95
            `}
            type="button"
          >
            .
          </button>
        ) : (
          <button
            onClick={handleBackspace}
            className={`
              ${buttonSize}
              flex items-center justify-center
              bg-card hover:bg-secondary
              border border-border rounded-lg
              font-semibold text-foreground
              transition-all duration-150
              touch-feedback
              active:scale-95
            `}
            type="button"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Action buttons */}
      {(onConfirm || onCancel) && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className={`
                ${buttonSize}
                flex items-center justify-center gap-2
                bg-secondary hover:bg-secondary/80
                border border-border rounded-lg
                font-semibold text-foreground
                transition-all duration-150
                touch-feedback
                active:scale-95
              `}
              type="button"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          )}
          {onConfirm && (
            <button
              onClick={handleConfirm}
              className={`
                ${buttonSize}
                flex items-center justify-center gap-2
                ${confirmColor}
                rounded-lg shadow-sm
                font-semibold
                transition-all duration-150
                touch-feedback
                active:scale-95
                ${!onCancel ? 'col-span-2' : ''}
              `}
              type="button"
            >
              <Check className="w-5 h-5" />
              Confirm
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NumberPad;
