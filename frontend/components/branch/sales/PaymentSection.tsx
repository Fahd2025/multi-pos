/**
 * Payment Section Component
 * Handle payment method, invoice type selection, and sale completion
 */

"use client";

import { useState } from "react";
import { InvoiceType, PaymentMethod } from "@/types/enums";

interface PaymentSectionProps {
  subtotal: number;
  taxRate: number;
  onCompleteSale: (
    paymentMethod: PaymentMethod,
    invoiceType: InvoiceType,
    paymentReference?: string
  ) => void;
  processing: boolean;
  isOnline: boolean;
}

export default function PaymentSection({
  subtotal,
  taxRate,
  onCompleteSale,
  processing,
  isOnline,
}: PaymentSectionProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(InvoiceType.Touch);
  const [paymentReference, setPaymentReference] = useState("");
  const [showPaymentRef, setShowPaymentRef] = useState(false);

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Show payment reference field for non-cash payments
    setShowPaymentRef(method !== PaymentMethod.Cash);
    if (method === PaymentMethod.Cash) {
      setPaymentReference("");
    }
  };

  const handleCompleteSale = () => {
    onCompleteSale(paymentMethod, invoiceType, showPaymentRef ? paymentReference : undefined);
  };

  const isFormValid = () => {
    if (subtotal <= 0) return false;
    if (showPaymentRef && !paymentReference.trim()) return false;
    return true;
  };

  return (
    <div className="bg-white dark:bg-gray-800  border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment</h3>

      {/* Invoice Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setInvoiceType(InvoiceType.Touch)}
            className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-colors ${
              invoiceType === InvoiceType.Touch
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl mb-1">📱</div>
            <div>Touch Invoice</div>
            <div className="text-xs text-gray-500 mt-1">Quick sale</div>
          </button>
          <button
            onClick={() => setInvoiceType(InvoiceType.Standard)}
            className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-colors ${
              invoiceType === InvoiceType.Standard
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl mb-1">📄</div>
            <div>Standard Invoice</div>
            <div className="text-xs text-gray-500 mt-1">With details</div>
          </button>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
        <div className="space-y-2">
          <button
            onClick={() => handlePaymentMethodChange(PaymentMethod.Cash)}
            className={`w-full px-4 py-3 border-2 rounded-lg text-left transition-colors ${
              paymentMethod === PaymentMethod.Cash
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💵</span>
                <div>
                  <div className="font-medium">Cash</div>
                  <div className="text-xs text-gray-500">Physical currency</div>
                </div>
              </div>
              {paymentMethod === PaymentMethod.Cash && <span className="text-green-600">✓</span>}
            </div>
          </button>

          <button
            onClick={() => handlePaymentMethodChange(PaymentMethod.Card)}
            className={`w-full px-4 py-3 border-2 rounded-lg text-left transition-colors ${
              paymentMethod === PaymentMethod.Card
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div>
                  <div className="font-medium">Card</div>
                  <div className="text-xs text-gray-500">Credit/Debit card</div>
                </div>
              </div>
              {paymentMethod === PaymentMethod.Card && <span className="text-blue-600">✓</span>}
            </div>
          </button>

          <button
            onClick={() => handlePaymentMethodChange(PaymentMethod.DigitalWallet)}
            className={`w-full px-4 py-3 border-2 rounded-lg text-left transition-colors ${
              paymentMethod === PaymentMethod.DigitalWallet
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <div className="font-medium">Digital Wallet</div>
                  <div className="text-xs text-gray-500">Apple Pay, Google Pay, etc.</div>
                </div>
              </div>
              {paymentMethod === PaymentMethod.DigitalWallet && (
                <span className="text-purple-600">✓</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Payment Reference (for non-cash payments) */}
      {showPaymentRef && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Reference
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Transaction ID, last 4 digits, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      )}

      {/* Total Calculation */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax ({taxRate}%):</span>
          <span className="font-medium">${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Offline Warning */}
      {!isOnline && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800 font-medium">
            ⚠️ Offline mode - Sale will be queued for sync
          </p>
        </div>
      )}

      {/* Complete Sale Button */}
      <button
        onClick={handleCompleteSale}
        disabled={processing || !isFormValid()}
        className={`w-full mt-6 px-6 py-4 rounded-lg font-semibold text-white text-lg transition-all ${
          processing || !isFormValid()
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>💳</span>
            Complete Sale - ${total.toFixed(2)}
          </span>
        )}
      </button>

      {/* Quick Tips */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>
          💡 <strong>Touch Invoice:</strong> Quick sale without customer details
        </p>
        <p>
          💡 <strong>Standard Invoice:</strong> Includes customer and detailed breakdown
        </p>
      </div>
    </div>
  );
}
