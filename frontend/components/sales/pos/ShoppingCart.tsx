/**
 * Shopping Cart Panel Component
 * Display cart items with quantity controls and order summary
 */

'use client';

import { SaleLineItem } from '../SaleLineItemsList';
import { DiscountType } from '@/types/enums';

interface ShoppingCartProps {
  items: SaleLineItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  onClearCart: () => void;
}

export default function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart,
}: ShoppingCartProps) {
  const calculateLineTotal = (item: SaleLineItem): number => {
    let discountedPrice = item.unitPrice;

    if (item.discountType === DiscountType.Percentage) {
      discountedPrice = item.unitPrice * (1 - item.discountValue / 100);
    } else if (item.discountType === DiscountType.FixedAmount) {
      discountedPrice = item.unitPrice - item.discountValue;
    }

    return discountedPrice * item.quantity;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    const tax = subtotal * 0.15; // 15% tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Shopping Cart</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fadeIn">
            <span className="text-6xl mb-4 animate-scaleIn">🛒</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cart is empty
            </h3>
            <p className="text-sm text-gray-600">
              Add products from the grid to start a sale
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item, index) => {
              const lineTotal = calculateLineTotal(item);

              return (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50 transition-all duration-200 animate-slideDown"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Product Name & Remove Button */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-2">
                      <h4 className="font-semibold text-gray-900 text-base leading-tight">
                        {item.productName}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        ${item.unitPrice.toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
                      title="Remove item"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                        className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 text-xl touch-manipulation active:scale-95 transition-all duration-150 hover:shadow-md"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-16 h-10 text-center border-2 border-gray-300 rounded-lg py-1.5 font-semibold text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 text-xl touch-manipulation active:scale-95 transition-all duration-150 hover:shadow-md"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 transition-all duration-300">
                        ${lineTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Summary */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 animate-fadeIn">
          {/* Subtotal, Tax, Total */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm transition-all duration-300">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm transition-all duration-300">
              <span className="text-gray-600">Tax (15%):</span>
              <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 transition-all duration-300">
              <span>Total:</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="p-4 pt-0">
            <button
              onClick={onCheckout}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation active:scale-95 hover:scale-[1.02] min-h-[60px]"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
