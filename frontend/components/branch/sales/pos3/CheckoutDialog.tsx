/**
 * Checkout Dialog Component
 * Display order summary and collect order type and payment information
 */

"use client";

import { useState } from "react";
import { SaleLineItem } from "../SaleLineItemsList";
import { InvoiceType, PaymentMethod, DiscountType } from "@/types/enums";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: SaleLineItem[];
  onConfirmCheckout: (orderType: InvoiceType, paymentMethod: PaymentMethod) => void;
  processing?: boolean;
}

export default function CheckoutDialog({
  isOpen,
  onClose,
  items,
  onConfirmCheckout,
  processing = false,
}: CheckoutDialogProps) {
  const [orderType, setOrderType] = useState<InvoiceType>(InvoiceType.Touch);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);

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
    const tax = subtotal * 0.15;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  const handleConfirm = () => {
    onConfirmCheckout(orderType, paymentMethod);
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
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
          style={{ animation: "fadeIn 0.3s ease" }}
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-gray-800  rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            style={{
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              animation: "slideUpScale 0.3s ease",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Checkout</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review your order and select payment method
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={processing}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Order Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Order Summary
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const lineTotal = calculateLineTotal(item);
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {item.productName}
                            </span>
                            <span className="text-gray-600 ml-2">× {item.quantity}</span>
                            <div className="text-xs text-gray-500">
                              ${item.unitPrice.toFixed(2)} each
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            ${lineTotal.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Type Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Order Type
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOrderType(InvoiceType.Touch)}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation active:scale-95 ${
                      orderType === InvoiceType.Touch
                        ? "border-blue-600 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-800  hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">🛍️</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Take-Out</div>
                      <div className="text-xs text-gray-600 mt-1">Quick service</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setOrderType(InvoiceType.Standard)}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation active:scale-95 ${
                      orderType === InvoiceType.Standard
                        ? "border-blue-600 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-800  hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">🚚</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Delivery</div>
                      <div className="text-xs text-gray-600 mt-1">With details</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod(PaymentMethod.Cash)}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation active:scale-95 ${
                      paymentMethod === PaymentMethod.Cash
                        ? "border-green-600 bg-green-50 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-800  hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">💵</div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        Cash
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod(PaymentMethod.Card)}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation active:scale-95 ${
                      paymentMethod === PaymentMethod.Card
                        ? "border-green-600 bg-green-50 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-800  hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">💳</div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        Card
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod(PaymentMethod.DigitalWallet)}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation active:scale-95 ${
                      paymentMethod === PaymentMethod.DigitalWallet
                        ? "border-green-600 bg-green-50 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-800  hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📱</div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        Wallet
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod(PaymentMethod.BankTransfer)}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation active:scale-95 ${
                      paymentMethod === PaymentMethod.BankTransfer
                        ? "border-green-600 bg-green-50 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-800  hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🏦</div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        Bank
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod(PaymentMethod.Check)}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation active:scale-95 ${
                      paymentMethod === PaymentMethod.Check
                        ? "border-green-600 bg-green-50 shadow-md"
                        : "border-gray-200 bg-white dark:bg-gray-800  hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📝</div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        Check
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Tax (15%):</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ${tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t-2 border-blue-300 pt-2">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Confirm Payment - $${total.toFixed(2)}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
