/**
 * Category Form Modal
 * Modal for adding/editing categories with hierarchical support
 */

'use client';

import { useState, useEffect } from 'react';
import { CategoryDto } from '@/types/api.types';
import inventoryService from '@/services/inventory.service';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: CategoryDto; // If provided, edit mode; otherwise, add mode
  categories: CategoryDto[];
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  categories,
}: CategoryFormModalProps) {
  const isEditMode = !!category;

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    parentCategoryId: '',
    displayOrder: '1',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with category data in edit mode
  useEffect(() => {
    if (category) {
      setFormData({
        code: category.code,
        nameEn: category.nameEn,
        nameAr: category.nameAr || '',
        descriptionEn: category.descriptionEn || '',
        descriptionAr: category.descriptionAr || '',
        parentCategoryId: category.parentCategoryId || '',
        displayOrder: category.displayOrder.toString(),
      });
    } else {
      // Reset form for add mode
      setFormData({
        code: '',
        nameEn: '',
        nameAr: '',
        descriptionEn: '',
        descriptionAr: '',
        parentCategoryId: '',
        displayOrder: '1',
      });
    }
    setError(null);
    setValidationErrors({});
  }, [category, isOpen]);

  /**
   * Get available parent categories (exclude self and children in edit mode)
   */
  const getAvailableParentCategories = () => {
    if (!isEditMode) {
      return categories;
    }

    // Exclude the current category and its children
    return categories.filter((c) => {
      if (c.id === category.id) return false; // Can't be parent of itself
      if (c.parentCategoryId === category.id) return false; // Can't be parent of its child
      return true;
    });
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) errors.code = 'Code is required';
    if (!formData.nameEn.trim()) errors.nameEn = 'English name is required';
    if (!formData.displayOrder || parseInt(formData.displayOrder) < 0) {
      errors.displayOrder = 'Display order must be 0 or greater';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const categoryData = {
        code: formData.code.trim(),
        nameEn: formData.nameEn.trim(),
        nameAr: formData.nameAr.trim() || undefined,
        descriptionEn: formData.descriptionEn.trim() || undefined,
        descriptionAr: formData.descriptionAr.trim() || undefined,
        parentCategoryId: formData.parentCategoryId || undefined,
        displayOrder: parseInt(formData.displayOrder),
      };

      if (isEditMode && category) {
        await inventoryService.updateCategory(category.id, categoryData);
      } else {
        await inventoryService.createCategory(categoryData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save category');
      console.error('Failed to save category:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Category' : 'Add New Category'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                ⚠️ {error}
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., ELEC, FOOD, CLOTH"
                  />
                  {validationErrors.code && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.code}</p>
                  )}
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.displayOrder ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1"
                  />
                  {validationErrors.displayOrder && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.displayOrder}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first
                  </p>
                </div>

                {/* Name (English) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nameEn"
                    value={formData.nameEn}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.nameEn ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Electronics"
                  />
                  {validationErrors.nameEn && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.nameEn}</p>
                  )}
                </div>

                {/* Name (Arabic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Arabic)
                  </label>
                  <input
                    type="text"
                    name="nameAr"
                    value={formData.nameAr}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="مثال: إلكترونيات"
                    dir="rtl"
                  />
                </div>

                {/* Parent Category */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    name="parentCategoryId"
                    value={formData.parentCategoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- None (Root Category) --</option>
                    {getAvailableParentCategories().map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to create a root category, or select a parent to create a subcategory
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Description (English) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    name="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Category description..."
                  />
                </div>

                {/* Description (Arabic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    name="descriptionAr"
                    value={formData.descriptionAr}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="وصف الفئة..."
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isEditMode ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
