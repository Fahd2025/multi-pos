/**
 * Button Component
 * Enhanced reusable button component with variants, sizes, loading states, and touch optimization
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Save Changes
 * </Button>
 *
 * <Button variant="danger" size="lg" leftIcon={<Trash />}>
 *   Delete Item
 * </Button>
 *
 * <Button variant="success" isLoading>
 *   Processing...
 * </Button>
 * ```
 */

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "warning" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  /** Enable touch optimization (48px minimum height) - default true */
  touchOptimized?: boolean;
  /** Enable haptic feedback animation - default true */
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  isFullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  touchOptimized = true,
  hapticFeedback = true,
  ...props
}) => {
  // Base styles with touch optimization
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    ${hapticFeedback ? "touch-feedback" : ""}
    ${touchOptimized ? "min-h-touch-target" : ""}
  `;

  // Variant styles
  const variantStyles = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary/50",
    danger:
      "bg-danger text-white hover:bg-danger/90 focus:ring-danger/50",
    success:
      "bg-success text-white hover:bg-success/90 focus:ring-success/50",
    warning:
      "bg-warning text-white hover:bg-warning/90 focus:ring-warning/50",
    ghost:
      "bg-transparent text-foreground hover:bg-secondary focus:ring-primary/50",
  };

  // Size styles (touch-optimized)
  const sizeStyles = {
    sm: touchOptimized ? "px-4 py-2 text-sm gap-2" : "px-3 py-1.5 text-sm gap-1.5",
    md: touchOptimized ? "px-6 py-3 text-base gap-2.5" : "px-4 py-2 text-base gap-2",
    lg: touchOptimized ? "px-8 py-4 text-lg gap-3" : "px-6 py-3 text-lg gap-2.5",
  };

  // Width styles
  const widthStyles = isFullWidth ? "w-full" : "";

  // Combine all styles
  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`;

  return (
    <button className={buttonStyles} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

/**
 * IconButton Component
 * Touch-optimized button variant for icon-only buttons
 *
 * @example
 * ```tsx
 * <IconButton
 *   icon={<X />}
 *   variant="ghost"
 *   aria-label="Close dialog"
 * />
 * ```
 */
export interface IconButtonProps extends Omit<ButtonProps, "children" | "leftIcon" | "rightIcon"> {
  icon: React.ReactNode;
  "aria-label": string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = "ghost",
  size = "md",
  className = "",
  touchOptimized = true,
  hapticFeedback = true,
  isLoading = false,
  disabled,
  ...props
}) => {
  // Base styles for icon buttons with touch optimization
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    ${hapticFeedback ? "touch-feedback" : ""}
    ${touchOptimized ? "min-h-touch-target min-w-touch-target" : ""}
  `;

  // Variant styles
  const variantStyles = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary/50",
    danger:
      "bg-danger text-white hover:bg-danger/90 focus:ring-danger/50",
    success:
      "bg-success text-white hover:bg-success/90 focus:ring-success/50",
    warning:
      "bg-warning text-white hover:bg-warning/90 focus:ring-warning/50",
    ghost:
      "bg-transparent text-foreground hover:bg-secondary focus:ring-primary/50",
  };

  // Size styles (square for icon buttons, touch-optimized)
  const sizeStyles = {
    sm: touchOptimized ? "p-3" : "p-1.5",
    md: touchOptimized ? "p-3" : "p-2",
    lg: touchOptimized ? "p-4" : "p-3",
  };

  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button className={buttonStyles} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
    </button>
  );
};
