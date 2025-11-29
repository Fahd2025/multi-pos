/**
 * Sale Line Items List Component
 * Display and manage sale line items with quantity and discount controls
 */

'use client';

import { useState } from 'react';
import { ProductDto } from '@/types/api.types';
import { DiscountType } from '@/types/enums';

export interface SaleLineItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  productImage?: string; // Add product image URL
}

interface SaleLineItemsListProps {
  items: SaleLineItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateDiscount: (index: number, discountType: DiscountType, discountValue: number) => void;
  onRemoveItem: (index: number) => void;
}

export default function SaleLineItemsList({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
}: SaleLineItemsListProps) {
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null);

  const calculateLineTotal = (item: SaleLineItem): number => {
    let discountedPrice = item.unitPrice;

    if (item.discountType === DiscountType.Percentage) {
      discountedPrice = item.unitPrice * (1 - item.discountValue / 100);
    } else if (item.discountType === DiscountType.FixedAmount) {
      discountedPrice = item.unitPrice - item.discountValue;
    }

    return discountedPrice * item.quantity;
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const newQuantity = Math.max(1, items[index].quantity + delta);
    onUpdateQuantity(index, newQuantity);
  };

  const handleDiscountTypeChange = (index: number, type: DiscountType) => {
    onUpdateDiscount(index, type, 0);
  };

  const handleDiscountValueChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const item = items[index];

    // Validate discount value
    if (item.discountType === DiscountType.Percentage && numValue > 100) {
      return;
    }
    if (item.discountType === DiscountType.FixedAmount && numValue > item.unitPrice) {
      return;
    }

    onUpdateDiscount(index, item.discountType, numValue);
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <span className="text-6xl">🛒</span>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No items yet</h3>
        <p className="mt-2 text-gray-600">Search and add products to start a sale</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Cart Items ({items.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {items.map((item, index) => {
          const lineTotal = calculateLineTotal(item);
          const isEditingThisDiscount = editingDiscount === index;

          return (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              {/* Product Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                  <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                  <p className="text-sm text-gray-600">
                    ${item.unitPrice.toFixed(2)} per unit
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-4 mb-3">
                <label className="text-sm font-medium text-gray-700 w-20">
                  Quantity:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(index, -1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-md font-bold"
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateQuantity(index, parseInt(e.target.value) || 1)
                    }
                    min="1"
                    className="w-16 text-center border border-gray-300 rounded-md py-1"
                  />
                  <button
                    onClick={() => handleQuantityChange(index, 1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-md font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Discount Controls */}
              <div className="flex items-center gap-4 mb-3">
                <label className="text-sm font-medium text-gray-700 w-20">
                  Discount:
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={item.discountType}
                    onChange={(e) =>
                      handleDiscountTypeChange(index, Number(e.target.value))
                    }
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value={DiscountType.None}>None</option>
                    <option value={DiscountType.Percentage}>Percentage (%)</option>
                    <option value={DiscountType.FixedAmount}>Fixed Amount ($)</option>
                  </select>

                  {item.discountType !== DiscountType.None && (
                    <input
                      type="number"
                      value={item.discountValue}
                      onChange={(e) => handleDiscountValueChange(index, e.target.value)}
                      min="0"
                      max={
                        item.discountType === DiscountType.Percentage
                          ? 100
                          : item.unitPrice
                      }
                      step={item.discountType === DiscountType.Percentage ? 1 : 0.01}
                      className="w-20 border border-gray-300 rounded-md px-3 py-1 text-sm"
                      placeholder="0"
                    />
                  )}

                  {item.discountType !== DiscountType.None &&
                    item.discountValue > 0 && (
                      <span className="text-sm text-green-600 font-medium">
                        Save: $
                        {item.discountType === DiscountType.Percentage
                          ? ((item.unitPrice * item.discountValue) / 100).toFixed(2)
                          : item.discountValue.toFixed(2)}{' '}
                        per unit
                      </span>
                    )}
                </div>
              </div>

              {/* Line Total */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-600">Line Total:</span>
                <div className="text-right">
                  {item.discountType !== DiscountType.None &&
                    item.discountValue > 0 && (
                      <p className="text-sm text-gray-400 line-through">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </p>
                    )}
                  <p className="text-lg font-bold text-blue-600">
                    ${lineTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Subtotal ({items.length} item{items.length !== 1 ? 's' : ''}):
          </span>
          <span className="text-xl font-bold text-gray-900">
            ${items.reduce((sum, item) => sum + calculateLineTotal(item), 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
