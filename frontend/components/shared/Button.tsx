/**
 * Custom Button Component
 * Supports loading states, icons, and custom styling
 */

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "warning" | "ghost" | "outline" | "default" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "default";
  isFullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isFullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Base styles
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // Variant styles - using theme CSS custom properties
  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
    default: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
    success: "bg-success text-white hover:bg-success/90 focus:ring-success",
    warning: "bg-warning text-white hover:bg-warning/90 focus:ring-warning",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };

  // Size styles
  const sizeStyles = {
    sm: "text-sm px-3 py-1.5 h-8",
    md: "text-sm px-4 py-2 h-10",
    default: "text-sm px-4 py-2 h-10",
    lg: "text-base px-6 py-3 h-12",
  };

  const widthStyle = isFullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div
          className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"
          aria-hidden="true"
        />
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}
