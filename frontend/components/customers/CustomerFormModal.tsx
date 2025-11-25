/**
 * Customer Form Modal
 * Modal for adding/editing customers with validation
 */

'use client';

import { useState, useEffect } from 'react';
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto } from '@/types/api.types';
import customerService from '@/services/customer.service';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: CustomerDto; // If provided, edit mode; otherwise, add mode
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSuccess,
  customer,
}: CustomerFormModalProps) {
  const isEditMode = !!customer;

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    nameEn: '',
    nameAr: '',
    email: '',
    phone: '',
    addressEn: '',
    addressAr: '',
    loyaltyPoints: '0',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with customer data in edit mode
  useEffect(() => {
    if (customer) {
      setFormData({
        code: customer.code,
        nameEn: customer.nameEn,
        nameAr: customer.nameAr || '',
        email: customer.email || '',
        phone: customer.phone || '',
        addressEn: customer.addressEn || '',
        addressAr: customer.addressAr || '',
        loyaltyPoints: customer.loyaltyPoints.toString(),
        isActive: customer.isActive,
      });
    } else {
      // Reset form for add mode
      setFormData({
        code: '',
        nameEn: '',
        nameAr: '',
        email: '',
        phone: '',
        addressEn: '',
        addressAr: '',
        loyaltyPoints: '0',
        isActive: true,
      });
    }
    setError(null);
    setValidationErrors({});
  }, [customer, isOpen]);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) errors.code = 'Customer code is required';
    if (!formData.nameEn.trim()) errors.nameEn = 'English name is required';

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Loyalty points validation
    const loyaltyPoints = parseInt(formData.loyaltyPoints);
    if (isNaN(loyaltyPoints) || loyaltyPoints < 0) {
      errors.loyaltyPoints = 'Loyalty points must be a non-negative number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
      if (isEditMode && customer) {
        // Update existing customer
        const updateDto: UpdateCustomerDto = {
          code: formData.code,
          nameEn: formData.nameEn,
          nameAr: formData.nameAr || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          addressEn: formData.addressEn || undefined,
          addressAr: formData.addressAr || undefined,
          loyaltyPoints: parseInt(formData.loyaltyPoints),
          isActive: formData.isActive,
        };
        await customerService.updateCustomer(customer.id, updateDto);
      } else {
        // Create new customer
        const createDto: CreateCustomerDto = {
          code: formData.code,
          nameEn: formData.nameEn,
          nameAr: formData.nameAr || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          addressEn: formData.addressEn || undefined,
          addressAr: formData.addressAr || undefined,
          loyaltyPoints: parseInt(formData.loyaltyPoints),
          isActive: formData.isActive,
        };
        await customerService.createCustomer(createDto);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </h2>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Customer Code */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              disabled={isEditMode} // Code cannot be changed in edit mode
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.code ? 'border-red-500' : 'border-gray-300'
              } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., CUST001"
            />
            {validationErrors.code && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.code}</p>
            )}
          </div>

          {/* English Name */}
          <div>
            <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 mb-1">
              Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nameEn"
              name="nameEn"
              value={formData.nameEn}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.nameEn ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Customer name in English"
            />
            {validationErrors.nameEn && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.nameEn}</p>
            )}
          </div>

          {/* Arabic Name */}
          <div>
            <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700 mb-1">
              Name (Arabic)
            </label>
            <input
              type="text"
              id="nameAr"
              name="nameAr"
              value={formData.nameAr}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="اسم العميل بالعربية"
              dir="rtl"
            />
          </div>

          {/* Email and Phone - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="customer@example.com"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* English Address */}
          <div>
            <label htmlFor="addressEn" className="block text-sm font-medium text-gray-700 mb-1">
              Address (English)
            </label>
            <textarea
              id="addressEn"
              name="addressEn"
              value={formData.addressEn}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Street address, city, country"
            />
          </div>

          {/* Arabic Address */}
          <div>
            <label htmlFor="addressAr" className="block text-sm font-medium text-gray-700 mb-1">
              Address (Arabic)
            </label>
            <textarea
              id="addressAr"
              name="addressAr"
              value={formData.addressAr}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="العنوان، المدينة، الدولة"
              dir="rtl"
            />
          </div>

          {/* Loyalty Points and Active Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="loyaltyPoints" className="block text-sm font-medium text-gray-700 mb-1">
                Loyalty Points
              </label>
              <input
                type="number"
                id="loyaltyPoints"
                name="loyaltyPoints"
                value={formData.loyaltyPoints}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.loyaltyPoints ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.loyaltyPoints && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.loyaltyPoints}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active Customer
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
