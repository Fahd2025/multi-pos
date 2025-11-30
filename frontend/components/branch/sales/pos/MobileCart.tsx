/**
 * Mobile Shopping Cart Component
 * Bottom sheet/drawer implementation for mobile devices
 */

'use client';

import { useEffect, useRef } from 'react';
import { SaleLineItem } from '../SaleLineItemsList';
import { DiscountType } from '@/types/enums';

interface MobileCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: SaleLineItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  onClearCart: () => void;
  lastUpdatedIndex?: number;
}

export default function MobileCart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart,
  lastUpdatedIndex,
}: MobileCartProps) {
  const cartContentRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Auto-scroll to updated item
  useEffect(() => {
    if (isOpen && lastUpdatedIndex !== undefined && itemRefs.current[lastUpdatedIndex]) {
      setTimeout(() => {
        itemRefs.current[lastUpdatedIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
    }
  }, [isOpen, lastUpdatedIndex]);

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in backdrop-blur-mobile"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up-from-bottom mobile-safe-bottom"
        style={{ maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Handle Bar for swipe indicator */}
        <div className="flex justify-center py-3 border-b border-gray-200">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-2 rounded-lg hover:bg-red-50 touch-manipulation active:scale-95"
                aria-label="Clear all items from cart"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-lg transition-all touch-manipulation active:scale-95 min-w-touch-target min-h-touch-target"
              aria-label="Close cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div
          ref={cartContentRef}
          className="overflow-y-auto custom-scrollbar"
          style={{ maxHeight: 'calc(90vh - 280px)' }}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="text-7xl mb-4">🛒</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cart is empty
              </h3>
              <p className="text-base text-gray-600">
                Add products from the grid to start a sale
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 p-4 space-y-4">
              {items.map((item, index) => {
                const lineTotal = calculateLineTotal(item);

                return (
                  <div
                    key={index}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    className="pt-4 first:pt-0"
                  >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        {/* Product Name & Price */}
                        <div className="mb-3">
                          <h4 className="font-semibold text-base text-gray-900 leading-tight mb-1">
                            {item.productName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            ${item.unitPrice.toFixed(2)} each
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                              className="
                                w-12 h-12
                                bg-gray-200 hover:bg-gray-300 active:bg-gray-400
                                rounded-xl
                                font-bold text-gray-700 text-2xl
                                touch-manipulation active:scale-95
                                transition-all duration-150
                                flex items-center justify-center
                                min-w-touch-target min-h-touch-target
                              "
                              aria-label={`Decrease quantity of ${item.productName}`}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                              min="1"
                              className="
                                w-20 h-12
                                text-center
                                border-2 border-gray-300
                                rounded-xl
                                font-semibold text-lg
                                transition-all duration-200
                                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                              "
                              aria-label={`Quantity of ${item.productName}`}
                            />
                            <button
                              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                              className="
                                w-12 h-12
                                bg-gray-200 hover:bg-gray-300 active:bg-gray-400
                                rounded-xl
                                font-bold text-gray-700 text-2xl
                                touch-manipulation active:scale-95
                                transition-all duration-150
                                flex items-center justify-center
                                min-w-touch-target min-h-touch-target
                              "
                              aria-label={`Increase quantity of ${item.productName}`}
                            >
                              +
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => onRemoveItem(index)}
                            className="
                              text-red-600 hover:text-red-800
                              p-3
                              hover:bg-red-50
                              rounded-xl
                              transition-all duration-200
                              touch-manipulation active:scale-95
                              min-w-touch-target min-h-touch-target
                              flex items-center justify-center
                            "
                            aria-label={`Remove ${item.productName} from cart`}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="mt-2 text-right">
                          <p className="text-xl font-bold text-blue-600">
                            ${lineTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Summary & Checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 sticky bottom-0">
            {/* Totals */}
            <div className="px-4 py-4 space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-600">Tax (15%):</span>
                <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-3 mt-2">
                <span>Total:</span>
                <span className="text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  onCheckout();
                  onClose();
                }}
                className="
                  w-full
                  bg-gradient-to-r from-blue-600 to-blue-700
                  hover:from-blue-700 hover:to-blue-800
                  active:from-blue-800 active:to-blue-900
                  text-white
                  py-5
                  rounded-2xl
                  font-bold text-xl
                  shadow-lg hover:shadow-xl active:shadow-md
                  transition-all duration-200
                  touch-manipulation
                  active:scale-98
                  min-h-[60px]
                  flex items-center justify-center gap-2
                "
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Proceed to Checkout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
