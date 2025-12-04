/**
 * FeaturedDialog Component
 *
 * A versatile modal dialog that supports both display-only and form modes.
 * Can be used for viewing details or creating/editing data entries.
 *
 * Features:
 * - Display mode: Clean, card-based layout for viewing details
 * - Form mode: Dynamic form generation with validation
 * - Customizable field display and rendering
 * - Optional action buttons (Edit, Delete, etc.)
 * - Responsive design with smooth animations
 * - Accessible with ARIA attributes
 * - Support for various data types and input types
 *
 * @example Display Mode
 * ```tsx
 * <FeaturedDialog
 *   isOpen={dialog.isOpen}
 *   onClose={dialog.close}
 *   title="Product Details"
 *   mode="display"
 *   data={product}
 *   fields={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'price', label: 'Price', render: (value) => `$${value}` }
 *   ]}
 *   actions={[
 *     { label: 'Edit', onClick: handleEdit, variant: 'primary' }
 *   ]}
 * />
 * ```
 *
 * @example Form Mode
 * ```tsx
 * <FeaturedDialog
 *   isOpen={modal.isOpen}
 *   onClose={modal.close}
 *   title="Add Product"
 *   mode="create"
 *   formFields={[
 *     { name: 'name', label: 'Name', type: 'text', required: true },
 *     { name: 'price', label: 'Price', type: 'number', required: true }
 *   ]}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */

"use client";

import React, { useState, useEffect } from "react";
import { FeaturedDialogProps, FormField } from "@/types/data-table.types";

export function FeaturedDialog<T = any>({
  isOpen,
  onClose,
  title,
  data,
  fields = [],
  actions = [],
  size = "md",
  customContent,
  mode = "display",
  formFields = [],
  onSubmit,
  isSubmitting = false,
  initialData,
}: FeaturedDialogProps<T>) {
  // Form state (only used in form mode)
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  const isFormMode = mode === "create" || mode === "edit";

  // Initialize form data
  useEffect(() => {
    if (isOpen && isFormMode) {
      if (mode === "edit" && (initialData || data)) {
        setFormData((initialData || data) as Partial<T>);
      } else {
        // Set default values for create mode
        const defaultData: Partial<T> = {};
        formFields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            (defaultData as any)[field.name] = field.defaultValue;
          }
        });
        setFormData(defaultData);
      }
      setErrors({});
      setTouched(new Set());
    }
  }, [isOpen, mode, initialData, data, formFields, isFormMode]);

  // Validate field
  const validateField = (field: FormField<T>, value: any): string | null => {
    // Required validation
    if (field.required && (value === undefined || value === null || value === "")) {
      return `${field.label} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value && !field.required) return null;

    const validation = field.validation;
    if (!validation) return null;

    // Min/Max validation for numbers
    if (field.type === "number" && typeof value === "number") {
      if (validation.min !== undefined && value < validation.min) {
        return `${field.label} must be at least ${validation.min}`;
      }
      if (validation.max !== undefined && value > validation.max) {
        return `${field.label} must be at most ${validation.max}`;
      }
    }

    // Length validation for strings
    if (typeof value === "string") {
      if (validation.minLength !== undefined && value.length < validation.minLength) {
        return `${field.label} must be at least ${validation.minLength} characters`;
      }
      if (validation.maxLength !== undefined && value.length > validation.maxLength) {
        return `${field.label} must be at most ${validation.maxLength} characters`;
      }
    }

    // Pattern validation
    if (validation.pattern && typeof value === "string") {
      if (!validation.pattern.test(value)) {
        return `${field.label} format is invalid`;
      }
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(value);
    }

    return null;
  };

  // Handle input change
  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Validate if field has been touched
    if (touched.has(fieldName)) {
      const field = formFields.find((f) => f.name === fieldName);
      if (field) {
        const error = validateField(field, value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          if (error) {
            newErrors[fieldName] = error;
          } else {
            delete newErrors[fieldName];
          }
          return newErrors;
        });
      }
    }
  };

  // Handle blur
  const handleBlur = (fieldName: string) => {
    setTouched((prev) => new Set(prev).add(fieldName));

    const field = formFields.find((f) => f.name === fieldName);
    if (field) {
      const value = (formData as any)[fieldName];
      const error = validateField(field, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
      }
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    formFields.forEach((field) => {
      // Check condition
      if (field.condition && !field.condition(formData)) {
        return;
      }

      const value = (formData as any)[field.name];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.name as string] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = new Set(formFields.map((f) => f.name as string));
    setTouched(allFields);

    // Validate
    if (!validateForm()) {
      return;
    }

    // Submit
    if (onSubmit) {
      await onSubmit(formData as T);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUpScale {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
          style={{ animation: "fadeIn 0.3s ease" }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Dialog Container */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={`relative bg-white dark:bg-gray-800  rounded-2xl transform transition-all w-full ${sizeClasses[size]}`}
            style={{
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              animation: "slideUpScale 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2
                id="dialog-title"
                className="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded p-1 transition-colors"
                aria-label="Close dialog"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            {isFormMode ? (
              /* Form Mode */
              <form onSubmit={handleFormSubmit} className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {formFields.map((field) => {
                    // Check condition
                    if (field.condition && !field.condition(formData)) {
                      return null;
                    }

                    const fieldName = field.name as string;
                    const value = (formData as any)[fieldName] || "";
                    const error = errors[fieldName];
                    const hasError = touched.has(fieldName) && !!error;

                    return (
                      <div key={fieldName}>
                        <label
                          htmlFor={fieldName}
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 dark:text-red-400 ml-1">*</span>
                          )}
                        </label>

                        {/* Text, Email, Password, Number, Date inputs */}
                        {["text", "email", "password", "number", "date", "datetime-local"].includes(
                          field.type
                        ) && (
                          <input
                            type={field.type}
                            id={fieldName}
                            value={value}
                            onChange={(e) =>
                              handleChange(
                                fieldName,
                                field.type === "number" ? Number(e.target.value) : e.target.value
                              )
                            }
                            onBlur={() => handleBlur(fieldName)}
                            placeholder={field.placeholder}
                            disabled={field.disabled || isSubmitting}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800  dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors ${
                              hasError
                                ? "border-red-500 dark:border-red-400"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                            aria-invalid={hasError}
                            aria-describedby={hasError ? `${fieldName}-error` : undefined}
                          />
                        )}

                        {/* Textarea */}
                        {field.type === "textarea" && (
                          <textarea
                            id={fieldName}
                            value={value}
                            onChange={(e) => handleChange(fieldName, e.target.value)}
                            onBlur={() => handleBlur(fieldName)}
                            placeholder={field.placeholder}
                            disabled={field.disabled || isSubmitting}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800  dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors ${
                              hasError
                                ? "border-red-500 dark:border-red-400"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                            aria-invalid={hasError}
                            aria-describedby={hasError ? `${fieldName}-error` : undefined}
                          />
                        )}

                        {/* Select */}
                        {field.type === "select" && (
                          <select
                            id={fieldName}
                            value={value}
                            onChange={(e) => handleChange(fieldName, e.target.value)}
                            onBlur={() => handleBlur(fieldName)}
                            disabled={field.disabled || isSubmitting}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800  dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors ${
                              hasError
                                ? "border-red-500 dark:border-red-400"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                            aria-invalid={hasError}
                            aria-describedby={hasError ? `${fieldName}-error` : undefined}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Checkbox */}
                        {field.type === "checkbox" && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={fieldName}
                              checked={!!value}
                              onChange={(e) => handleChange(fieldName, e.target.checked)}
                              onBlur={() => handleBlur(fieldName)}
                              disabled={field.disabled || isSubmitting}
                              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            />
                            <label
                              htmlFor={fieldName}
                              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              {field.placeholder || field.label}
                            </label>
                          </div>
                        )}

                        {/* Error Message */}
                        {hasError && (
                          <p
                            id={`${fieldName}-error`}
                            className="mt-1 text-sm text-red-500 dark:text-red-400"
                            role="alert"
                          >
                            {error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Custom Content */}
                {customContent && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {customContent}
                  </div>
                )}

                {/* Form Footer with Submit/Cancel */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800  dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {mode === "create" ? "Creating..." : "Saving..."}
                      </>
                    ) : (
                      <>{mode === "create" ? "Create" : "Save"}</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Display Mode */
              <>
                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-4">
                    {fields.map((field) => {
                      const value = data ? (data as any)[field.key] : undefined;
                      const displayValue = field.render ? field.render(value, data!) : value;

                      return (
                        <div key={String(field.key)} className={`${field.className || ""}`}>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {field.label}
                          </dt>
                          <dd className="text-base text-gray-900 dark:text-gray-100">
                            {displayValue !== null && displayValue !== undefined ? (
                              displayValue
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                Not set
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Content */}
                  {customContent && <div className="mt-4">{customContent}</div>}
                </div>

                {/* Footer with Actions */}
                {actions.length > 0 && (
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                    {actions.map((action, index) => {
                      const variantClasses = {
                        primary:
                          "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white",
                        secondary:
                          "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200",
                        danger:
                          "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white",
                        success:
                          "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white",
                      };

                      return (
                        <button
                          key={index}
                          onClick={() => data && action.onClick(data)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            variantClasses[action.variant || "primary"]
                          }`}
                        >
                          {action.icon && <span className="mr-2">{action.icon}</span>}
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
