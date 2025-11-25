/**
 * Expense Form Modal Component
 * Create or edit expense with validation
 */

'use client';

import { useState, useEffect } from 'react';
import expenseService from '@/services/expense.service';
import { ExpenseDto, CreateExpenseDto, ExpenseCategoryDto } from '@/types/api.types';

interface ExpenseFormModalProps {
  expense?: ExpenseDto;
  categories: ExpenseCategoryDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseFormModal({
  expense,
  categories,
  onClose,
  onSuccess,
}: ExpenseFormModalProps) {
  const isEditMode = !!expense;

  const [formData, setFormData] = useState<CreateExpenseDto>({
    expenseCategoryId: expense?.expenseCategoryId || '',
    amount: expense?.amount || 0,
    expenseDate: expense?.expenseDate
      ? new Date(expense.expenseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    descriptionEn: expense?.descriptionEn || '',
    descriptionAr: expense?.descriptionAr || '',
    paymentMethod: expense?.paymentMethod ?? 0,
    paymentReference: expense?.paymentReference || '',
    receiptImagePath: expense?.receiptImagePath || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.expenseCategoryId) {
      errors.expenseCategoryId = 'Expense category is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.expenseDate) {
      errors.expenseDate = 'Expense date is required';
    }

    if (!formData.descriptionEn.trim()) {
      errors.descriptionEn = 'Description (English) is required';
    }

    if (formData.descriptionEn.length > 500) {
      errors.descriptionEn = 'Description cannot exceed 500 characters';
    }

    if (formData.descriptionAr && formData.descriptionAr.length > 500) {
      errors.descriptionAr = 'Description (Arabic) cannot exceed 500 characters';
    }

    if (formData.paymentReference && formData.paymentReference.length > 200) {
      errors.paymentReference = 'Payment reference cannot exceed 200 characters';
    }

    if (formData.receiptImagePath && formData.receiptImagePath.length > 500) {
      errors.receiptImagePath = 'Receipt image path cannot exceed 500 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode && expense) {
        await expenseService.updateExpense(expense.id, formData);
      } else {
        await expenseService.createExpense(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} expense`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditMode ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.expenseCategoryId}
                onChange={(e) =>
                  setFormData({ ...formData, expenseCategoryId: e.target.value })
                }
                className={`w-full border rounded px-3 py-2 ${
                  validationErrors.expenseCategoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameEn} / {cat.nameAr}
                  </option>
                ))}
              </select>
              {validationErrors.expenseCategoryId && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.expenseCategoryId}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                className={`w-full border rounded px-3 py-2 ${
                  validationErrors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.amount && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
              )}
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className={`w-full border rounded px-3 py-2 ${
                  validationErrors.expenseDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.expenseDate && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.expenseDate}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: parseInt(e.target.value) })
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value={0}>Cash</option>
                <option value={1}>Card</option>
                <option value={2}>Bank Transfer</option>
                <option value={3}>Other</option>
              </select>
            </div>

            {/* Payment Reference */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Payment Reference</label>
              <input
                type="text"
                value={formData.paymentReference}
                onChange={(e) =>
                  setFormData({ ...formData, paymentReference: e.target.value })
                }
                placeholder="Transaction ID, check number, etc."
                className={`w-full border rounded px-3 py-2 ${
                  validationErrors.paymentReference ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.paymentReference && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.paymentReference}</p>
              )}
            </div>

            {/* Description (English) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description (English) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                rows={3}
                className={`w-full border rounded px-3 py-2 ${
                  validationErrors.descriptionEn ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.descriptionEn && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.descriptionEn}</p>
              )}
            </div>

            {/* Description (Arabic) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description (Arabic)
              </label>
              <textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows={3}
                dir="rtl"
                className={`w-full border rounded px-3 py-2 ${
                  validationErrors.descriptionAr ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.descriptionAr && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.descriptionAr}</p>
              )}
            </div>

            {/* Receipt Image Path */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Receipt Image Path</label>
              <input
                type="text"
                value={formData.receiptImagePath}
                onChange={(e) =>
                  setFormData({ ...formData, receiptImagePath: e.target.value })
                }
                placeholder="/uploads/receipts/expense-001.jpg"
                className={`w-full border rounded px-3 py-2 ${
                  validationErrors.receiptImagePath ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.receiptImagePath && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.receiptImagePath}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Path to uploaded receipt image (file upload feature coming soon)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Expense' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
