/**
 * Unified Transaction Dialog
 * Combines transaction processing and save order functionality with tab navigation
 * Responsive design for all screen sizes and touch devices
 */

"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { ProductDto, SaleDto } from "@/types/api.types";
import { SaveOrderData } from "./PendingOrders/SaveOrderDialog";

interface OrderItem extends ProductDto {
  quantity: number;
}

interface UnifiedTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  subtotal: number;
  onTransactionSuccess: (sale: SaleDto) => void;
  onSaveOrder: (data: SaveOrderData) => Promise<void>;
  initialTableNumber?: string;
  initialGuestCount?: number;
  itemCount: number;
  totalAmount: number;
  // Render props for tab content
  renderPaymentTab: () => React.ReactNode;
  renderSaveOrderTab: () => React.ReactNode;
}

type TabType = "payment" | "save";

export const UnifiedTransactionDialog: React.FC<UnifiedTransactionDialogProps> = ({
  isOpen,
  onClose,
  renderPaymentTab,
  renderSaveOrderTab,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("payment");

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
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .unified-dialog-content {
          overflow-y: auto;
          max-height: calc(95vh - 140px);
        }
        @media (max-width: 640px) {
          .dialog-container {
            max-width: 100vw !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          .unified-dialog-content {
            max-height: calc(100vh - 120px);
          }
        }
        /* Responsive breakpoints for tabs */
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline !important;
          }
          .xs\\:hidden {
            display: none !important;
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

        {/* Dialog Container */}
        <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
          <div
            className="dialog-container relative w-full max-w-5xl max-h-[95vh] bg-white dark:bg-gray-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ animation: "slideUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Tabs */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="hidden sm:inline">Transaction</span>
                  <span className="sm:hidden">Action</span>
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation active:scale-95"
                  aria-label="Close dialog"
                >
                  <X size={20} className="sm:w-6 sm:h-6 text-white" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5 sm:gap-3">
                <button
                  onClick={() => setActiveTab("payment")}
                  className={`flex-1 px-2 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all touch-manipulation active:scale-95 text-xs sm:text-base min-h-[44px] ${
                    activeTab === "payment"
                      ? "bg-white text-emerald-700 shadow-lg"
                      : "bg-emerald-700/50 text-white hover:bg-emerald-700/70"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <span className="hidden xs:inline">Process Payment</span>
                    <span className="xs:hidden">Pay</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("save")}
                  className={`flex-1 px-2 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all touch-manipulation active:scale-95 text-xs sm:text-base min-h-[44px] ${
                    activeTab === "save"
                      ? "bg-white text-emerald-700 shadow-lg"
                      : "bg-emerald-700/50 text-white hover:bg-emerald-700/70"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
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
                    <span className="hidden xs:inline">Save Order</span>
                    <span className="xs:hidden">Save</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="unified-dialog-content flex-1">
              {activeTab === "payment" ? renderPaymentTab() : renderSaveOrderTab()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
