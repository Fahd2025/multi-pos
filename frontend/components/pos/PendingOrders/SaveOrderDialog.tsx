"use client";

import React, { useState } from "react";
import { PendingOrderStatus } from "@/types/api.types";

export interface SaveOrderData {
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  guestCount?: number;
  orderType: number;
  status: PendingOrderStatus;
  notes?: string;
}

interface SaveOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveOrderData) => Promise<void>;
  itemCount: number;
  totalAmount: number;
  currentTableNumber?: string;
  currentGuestCount?: number;
}

export function SaveOrderDialog({
  isOpen,
  onClose,
  onSave,
  itemCount,
  totalAmount,
  currentTableNumber,
  currentGuestCount,
}: SaveOrderDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<number>(0); // 0 = Touch (Dine In)
  const [tableNumber, setTableNumber] = useState(currentTableNumber || "");
  const [guestCount, setGuestCount] = useState(currentGuestCount || 1);
  const [status, setStatus] = useState<PendingOrderStatus>(PendingOrderStatus.Parked);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        tableNumber: orderType === 0 ? tableNumber || undefined : undefined,
        guestCount: orderType === 0 ? guestCount : undefined,
        orderType,
        status,
        notes: notes || undefined,
      });
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      onClose();
    } catch (error) {
      console.error("Error saving order:", error);
    } finally {
      setSaving(false);
    }
  };

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
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.2s ease" }}
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            style={{
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              animation: "scaleUp 0.2s ease",
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    💾 Save Pending Order
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {itemCount} item{itemCount !== 1 ? "s" : ""} • ${totalAmount.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Customer Information (Optional)
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Order Type */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Order Type
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrderType(0)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      orderType === 0
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Dine In
                  </button>
                  <button
                    onClick={() => setOrderType(1)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      orderType === 1
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Take Away
                  </button>
                  <button
                    onClick={() => setOrderType(2)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      orderType === 2
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Delivery
                  </button>
                </div>
              </div>

              {/* Table Info (Dine In Only) */}
              {orderType === 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Table Information
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Table number"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Guests"
                      min="1"
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Status
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus(PendingOrderStatus.Parked)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      status === PendingOrderStatus.Parked
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Parked
                  </button>
                  <button
                    onClick={() => setStatus(PendingOrderStatus.OnHold)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      status === PendingOrderStatus.OnHold
                        ? "bg-amber-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    On Hold
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Notes (Optional)
                </h3>
                <textarea
                  placeholder="Add notes about this order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Info Tip */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 Tip: Pending orders expire after 24 hours
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    Save Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
