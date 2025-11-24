/**
 * Stock Adjustment Modal
 * Modal for adjusting product stock levels with reason tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { ProductDto } from '@/types/api.types';
import inventoryService from '@/services/inventory.service';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: ProductDto | null;
}

type AdjustmentType = 'increase' | 'decrease' | 'set';

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('increase');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setAdjustmentType('increase');
      setQuantity('');
      setReason('');
      setError(null);
      setValidationErrors({});
    }
  }, [isOpen, product]);

  /**
   * Calculate new stock level
   */
  const calculateNewStock = (): number => {
    if (!product || !quantity) return product?.stockLevel || 0;

    const qty = parseFloat(quantity);
    const currentStock = product.stockLevel;

    switch (adjustmentType) {
      case 'increase':
        return currentStock + qty;
      case 'decrease':
        return currentStock - qty;
      case 'set':
        return qty;
      default:
        return currentStock;
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!quantity || parseFloat(quantity) <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }

    if (!reason.trim()) {
      errors.reason = 'Reason is required';
    }

    const newStock = calculateNewStock();
    if (newStock < 0) {
      errors.quantity = 'Adjustment would result in negative stock';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const qty = parseFloat(quantity);
      let adjustmentValue: number;

      switch (adjustmentType) {
        case 'increase':
          adjustmentValue = qty;
          break;
        case 'decrease':
          adjustmentValue = -qty;
          break;
        case 'set':
          adjustmentValue = qty - product.stockLevel;
          break;
        default:
          adjustmentValue = 0;
      }

      const adjustment = {
        adjustment: adjustmentValue,
        reason: reason.trim(),
      };

      await inventoryService.adjustStock(product.id, adjustment);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to adjust stock');
      console.error('Failed to adjust stock:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const newStock = calculateNewStock();
  const stockDifference = newStock - product.stockLevel;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Adjust Stock</h2>
              <p className="text-sm text-gray-600 mt-1">{product.nameEn}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Current Stock Display */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {product.stockLevel}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Change</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    stockDifference > 0
                      ? 'text-green-600'
                      : stockDifference < 0
                      ? 'text-red-600'
                      : 'text-gray-400'
                  }`}
                >
                  {stockDifference > 0 && '+'}
                  {stockDifference || '--'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">New Stock</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    newStock < 0
                      ? 'text-red-600'
                      : newStock <= product.minStockThreshold
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {quantity ? newStock : '--'}
                </p>
              </div>
            </div>

            {newStock <= product.minStockThreshold && newStock >= 0 && quantity && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm">
                ⚠️ Warning: New stock level is below minimum threshold (
                {product.minStockThreshold})
              </div>
            )}

            {newStock < 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                ⚠️ Error: New stock level cannot be negative
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                ⚠️ {error}
              </div>
            )}

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('increase')}
                  className={`px-4 py-3 rounded-md border-2 transition-colors ${
                    adjustmentType === 'increase'
                      ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  ➕ Increase
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('decrease')}
                  className={`px-4 py-3 rounded-md border-2 transition-colors ${
                    adjustmentType === 'decrease'
                      ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  ➖ Decrease
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('set')}
                  className={`px-4 py-3 rounded-md border-2 transition-colors ${
                    adjustmentType === 'set'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  🎯 Set To
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (validationErrors.quantity) {
                    setValidationErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.quantity;
                      return newErrors;
                    });
                  }
                }}
                step="1"
                min="0"
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={
                  adjustmentType === 'set'
                    ? 'Enter new stock level'
                    : 'Enter quantity to adjust'
                }
              />
              {validationErrors.quantity && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.quantity}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {adjustmentType === 'increase' && 'Amount to add to current stock'}
                {adjustmentType === 'decrease' && 'Amount to subtract from current stock'}
                {adjustmentType === 'set' && 'New stock level (replaces current stock)'}
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (validationErrors.reason) {
                    setValidationErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.reason;
                      return newErrors;
                    });
                  }
                }}
                rows={3}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Received new shipment, Damaged goods, Stock count correction..."
              />
              {validationErrors.reason && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.reason}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Provide a clear reason for this stock adjustment (for audit trail)
              </p>
            </div>

            {/* Common Reasons Quick Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Reasons
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Received shipment',
                  'Sold in-store',
                  'Damaged goods',
                  'Expired products',
                  'Stock count correction',
                  'Returned by customer',
                  'Transferred to other branch',
                ].map((quickReason) => (
                  <button
                    key={quickReason}
                    type="button"
                    onClick={() => setReason(quickReason)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {quickReason}
                  </button>
                ))}
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
                disabled={loading || newStock < 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Confirm Adjustment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
