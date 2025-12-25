/**
 * Payment Dialog Component
 * Simplified payment dialog for completing unpaid orders from the tables page
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Banknote,
  Percent,
  DollarSign,
} from "lucide-react";
import { SaleDto } from "@/types/api.types";
import salesService from "@/services/sales.service";
import { useToast } from "@/hooks/useToast";
import CashCalculator from "../pos-v2/CashCalculator";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  tableNumber: number;
  onSuccess: () => void;
}

type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";
type DiscountType = "percentage" | "amount";

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  saleId,
  tableNumber,
  onSuccess,
}) => {
  const toast = useToast();

  // State Management
  const [sale, setSale] = useState<SaleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);

  // Load sale details
  useEffect(() => {
    if (isOpen && saleId) {
      loadSale();
    }
  }, [isOpen, saleId]);

  const loadSale = async () => {
    setLoading(true);
    setError(null);

    try {
      const saleData = await salesService.getSaleById(saleId);
      setSale(saleData);

      // Set initial amount paid to the total (for non-cash payments)
      const total = calculateTotal(saleData.subtotal, 0);
      setAmountPaid(total);
    } catch (err: any) {
      console.error("Error loading sale:", err);
      setError(err.message || "Failed to load sale details");
      toast.error("Error", "Failed to load sale details");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotal = (subtotal: number, discount: number) => {
    const taxRate = 0.15; // 15% tax
    const discountAmount =
      discountType === "percentage" ? (subtotal * discount) / 100 : discount;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;
    return total;
  };

  const subtotal = sale?.subtotal || 0;
  const discountAmount =
    discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = 0.15;
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;
  const change = amountPaid - total;

  // Update amount paid when payment method or total changes
  useEffect(() => {
    if (paymentMethod !== "cash") {
      setAmountPaid(total);
    }
  }, [paymentMethod, total]);

  // Cash Amount Handler
  const handleCashAmount = (amount: number) => {
    setAmountPaid(amount);
  };

  // Validation
  const validatePayment = (): string | null => {
    if (!sale) {
      return "Sale not loaded";
    }

    if (paymentMethod === "cash" && amountPaid < total) {
      return `Insufficient payment. Amount paid ($${amountPaid.toFixed(
        2
      )}) is less than total ($${total.toFixed(2)})`;
    }

    if (amountPaid < 0) {
      return "Amount paid cannot be negative";
    }

    return null;
  };

  // Process Payment
  const handleProcessPayment = async () => {
    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      toast.warning("Validation Error", validationError);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Map payment method
      const paymentMethodMap: Record<PaymentMethod, number> = {
        cash: 0,
        "credit-card": 1,
        "debit-card": 2,
        "mobile-payment": 3,
      };

      // Update sale with payment information
      const updateData = {
        paymentMethod: paymentMethodMap[paymentMethod],
        amountPaid: paymentMethod === "cash" ? amountPaid : total,
        changeReturned: paymentMethod === "cash" ? Math.max(0, amountPaid - total) : 0,
        discountType: discountValue > 0 ? (discountType === "percentage" ? 1 : 2) : 0,
        discountValue: discountValue,
      };

      // Call API to update payment
      await salesService.updateSalePayment(saleId, updateData);

      toast.success(
        "Payment completed!",
        `Invoice #${sale?.invoiceNumber || 'N/A'} | Total: $${total.toFixed(2)} | Paid: $${amountPaid.toFixed(2)}${paymentMethod === "cash" ? ` | Change: $${change.toFixed(2)}` : ""}`,
        7000
      );

      // Close dialog and trigger success callback
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Error processing payment:", err);
      const errorMessage = err.message || "Failed to process payment";
      toast.error("Payment failed", errorMessage, 8000);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-2xl transform transition-all w-full max-w-2xl"
          style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Complete Payment - Table #{tableNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading sale details...</p>
            </div>
          ) : error && !sale ? (
            <div className="text-center py-10">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadSale}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : sale ? (
            <>
              {/* Sale Info */}
              <div style={{
                padding: "16px",
                background: "rgba(59, 130, 246, 0.05)",
                borderRadius: "8px",
                marginBottom: "24px",
                border: "1px solid rgba(59, 130, 246, 0.2)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "600" }}>Invoice Number:</span>
                  <span>{sale.invoiceNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "600" }}>Items:</span>
                  <span>{sale.lineItems?.length || 0} items</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "600" }}>Original Total:</span>
                  <span style={{ fontSize: "1.125rem", fontWeight: "700", color: "rgb(59, 130, 246)" }}>
                    ${sale.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      paymentMethod === "cash"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <Banknote size={20} />
                    <span className="text-sm font-medium">Cash</span>
                  </button>
                  <button
                    className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      paymentMethod === "credit-card"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("credit-card")}
                  >
                    <CreditCard size={20} />
                    <span className="text-sm font-medium">Credit Card</span>
                  </button>
                  <button
                    className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      paymentMethod === "debit-card"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("debit-card")}
                  >
                    <CreditCard size={20} />
                    <span className="text-sm font-medium">Debit Card</span>
                  </button>
                  <button
                    className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      paymentMethod === "mobile-payment"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("mobile-payment")}
                  >
                    <CreditCard size={20} />
                    <span className="text-sm font-medium">Mobile Pay</span>
                  </button>
                </div>
              </div>

              {/* Discount */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Percent size={18} />
                  Discount
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Amount ($)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="0"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={discountValue || ""}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Transaction Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>Discount:</span>
                        <span className="text-red-600 dark:text-red-400">-${discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>Amount After Discount:</span>
                        <span>${taxableAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Tax (15%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Cash Calculator */}
              {paymentMethod === "cash" && (
                <CashCalculator
                  total={total}
                  amountPaid={amountPaid}
                  onAmountChange={handleCashAmount}
                />
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
            </>
          ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={processing || loading || !sale}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-r-transparent"></div>
                  Processing...
                </>
              ) : (
                `Complete Payment - $${total.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
