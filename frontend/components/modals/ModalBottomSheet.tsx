/**
 * ModalBottomSheet Component
 *
 * A bottom sheet modal component for creating and editing data entries.
 * Features dynamic form generation based on field configuration with built-in validation.
 *
 * Features:
 * - Slides up from bottom on mobile, centered on desktop
 * - Dynamic form generation from field configuration
 * - Built-in validation with custom rules
 * - Support for various input types (text, number, select, textarea, etc.)
 * - Conditional field rendering
 * - Automatic form state management
 * - Loading states during submission
 * - Accessible with ARIA attributes
 *
 * @example
 * ```tsx
 * <ModalBottomSheet
 *   isOpen={modal.isOpen}
 *   onClose={modal.close}
 *   title={modal.mode === 'create' ? 'New Product' : 'Edit Product'}
 *   mode={modal.mode}
 *   initialData={modal.data}
 *   fields={[
 *     { name: 'name', label: 'Product Name', type: 'text', required: true },
 *     { name: 'price', label: 'Price', type: 'number', required: true },
 *     { name: 'category', label: 'Category', type: 'select', options: categories }
 *   ]}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */

"use client";

import React, { useState, useEffect } from "react";
import { ModalBottomSheetProps, FormField } from "@/types/data-table.types";

export function ModalBottomSheet<T = any>({
  isOpen,
  onClose,
  title,
  mode,
  initialData,
  fields,
  onSubmit,
  isSubmitting = false,
  size = "md",
  className = "",
  additionalContent,
}: ModalBottomSheetProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData(initialData);
      } else {
        // Set default values
        const defaultData: Partial<T> = {};
        fields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            (defaultData as any)[field.name] = field.defaultValue;
          }
        });
        setFormData(defaultData);
      }
      setErrors({});
      setTouched(new Set());
    }
  }, [isOpen, mode, initialData, fields]);

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
      const field = fields.find((f) => f.name === fieldName);
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

    const field = fields.find((f) => f.name === fieldName);
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

    fields.forEach((field) => {
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = new Set(fields.map((f) => f.name as string));
    setTouched(allFields);

    // Validate
    if (!validateForm()) {
      return;
    }

    // Submit
    await onSubmit(formData as T);
  };

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-full",
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-end justify-center sm:items-center p-0 sm:p-4">
        <div
          className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl transform transition-all w-full ${sizeClasses[size]} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
              aria-label="Close modal"
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

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            className="px-6 py-4 max-h-[70vh] sm:max-h-[60vh] overflow-y-auto"
          >
            <div className="space-y-4">
              {fields.map((field) => {
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
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
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
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          hasError ? "border-red-500" : "border-gray-300"
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
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          hasError ? "border-red-500" : "border-gray-300"
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
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          hasError ? "border-red-500" : "border-gray-300"
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
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <label htmlFor={fieldName} className="ml-2 text-sm text-gray-700">
                          {field.placeholder || field.label}
                        </label>
                      </div>
                    )}

                    {/* Error Message */}
                    {hasError && (
                      <p
                        id={`${fieldName}-error`}
                        className="mt-1 text-sm text-red-500"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Additional Content Section (e.g., Image Upload) */}
            {additionalContent && (
              <div className="mt-6 pt-6 border-t border-gray-200">{additionalContent}</div>
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
        </div>
      </div>
    </div>
  );
}
