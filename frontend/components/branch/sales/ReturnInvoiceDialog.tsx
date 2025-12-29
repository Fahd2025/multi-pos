/**
 * Return Invoice Dialog Component
 * Touch-optimized interface for processing full or partial returns
 * Features:
 * - Responsive design (mobile, tablet, desktop)
 * - Large touch targets (56x56px minimum)
 * - Multi-item selection with quantity controls
 * - Return reason selection
 * - Real-time refund calculation
 * - Print options (return invoice, original invoice, combined invoice)
 */

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Minus, Plus, ArrowLeft, Printer, FileText } from "lucide-react";
import {
  SaleDto,
  SaleLineItemDto,
  CreateReturnDto,
  ReturnItemDto,
  ReturnResponseDto,
} from "@/types/api.types";
import salesService from "@/services/sales.service";
import { formatCurrency } from "@/lib/utils";

interface ReturnInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDto | null;
  onSuccess?: (returnResponse: ReturnResponseDto) => void;
}

interface ReturnItem extends ReturnItemDto {
  productName: string;
  originalQuantity: number;
  availableQuantity: number; // originalQuantity - alreadyReturned
  alreadyReturned: number;
}

const RETURN_REASONS = [
  { value: "damaged", label: "Damaged Item" },
  { value: "wrong_item", label: "Wrong Item" },
  { value: "customer_request", label: "Customer Request" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "expired", label: "Expired Product" },
  { value: "other", label: "Other" },
];

export default function ReturnInvoiceDialog({
  isOpen,
  onClose,
  sale,
  onSuccess,
}: ReturnInvoiceDialogProps) {
  // State
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Initialize return items when sale changes
  useEffect(() => {
    if (sale && sale.lineItems) {
      const items: ReturnItem[] = sale.lineItems.map((item) => ({
        saleItemId: item.id,
        productId: item.productId,
        productName: item.productName || `Product ${item.productId}`,
        returnQuantity: 0,
        unitPrice: item.unitPrice,
        originalQuantity: item.quantity,
        alreadyReturned: item.returnQuantity || 0,
        availableQuantity: item.quantity - (item.returnQuantity || 0),
      }));
      setReturnItems(items);
    }
  }, [sale]);

  // Reset dialog when closed
  useEffect(() => {
    if (!isOpen) {
      setReturnReason("");
      setReturnNotes("");
      setShowSummary(false);
    }
  }, [isOpen]);

  // Calculate totals
  const selectedItems = returnItems.filter((item) => item.returnQuantity > 0);
  const refundSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.returnQuantity * item.unitPrice,
    0
  );

  // Proportional tax and discount calculation
  const originalSubtotal = sale?.subtotal || 1;
  const taxRate = originalSubtotal > 0 ? (sale?.taxAmount || 0) / originalSubtotal : 0;
  const discountRate = originalSubtotal > 0 ? (sale?.totalDiscount || 0) / originalSubtotal : 0;

  const refundTax = refundSubtotal * taxRate;
  const refundDiscount = refundSubtotal * discountRate;
  const totalRefund = refundSubtotal - refundDiscount + refundTax;

  // Handlers
  const handleQuantityChange = (itemId: string, delta: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.saleItemId === itemId) {
          const newQuantity = Math.max(
            0,
            Math.min(item.availableQuantity, item.returnQuantity + delta)
          );
          return { ...item, returnQuantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleSelectAll = () => {
    setReturnItems((prev) =>
      prev.map((item) => ({
        ...item,
        returnQuantity: item.availableQuantity,
      }))
    );
  };

  const handleClearAll = () => {
    setReturnItems((prev) =>
      prev.map((item) => ({
        ...item,
        returnQuantity: 0,
      }))
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    if (!returnReason) {
      toast.error("Please select a return reason");
      return;
    }

    if (!sale) {
      toast.error("Sale data not available");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare return data
      const returnData: CreateReturnDto = {
        originalSaleId: sale.id,
        returnReason,
        returnNotes: returnNotes || undefined,
        items: selectedItems.map((item) => ({
          saleItemId: item.saleItemId,
          productId: item.productId,
          returnQuantity: item.returnQuantity,
          unitPrice: item.unitPrice,
        })),
      };

      // Process return
      const response = await salesService.processReturn(returnData);

      toast.success(
        `Return processed successfully! Refund: ${formatCurrency(response.refundAmount)}`
      );

      onSuccess?.(response);
      onClose();
    } catch (error: any) {
      console.error("Return error:", error);
      toast.error(error.message || "Failed to process return");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReturnInvoice = () => {
    toast.info("Print return invoice (Coming soon)");
  };

  const handlePrintOriginalInvoice = async () => {
    if (!sale) return;
    try {
      await salesService.printInvoice(sale.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to print original invoice");
    }
  };

  const handlePrintCombinedInvoice = () => {
    toast.info("Print combined invoice (Coming soon)");
  };

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Dialog Container - Responsive Sizing */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b flex items-center justify-between">
          {showSummary && (
            <button
              onClick={() => setShowSummary(false)}
              className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-semibold">
              {showSummary ? "Return Summary" : "Return Invoice"}
            </h2>
            <p className="text-sm text-gray-600">
              Order #{sale.invoiceNumber || sale.transactionId} • {new Date(sale.saleDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          {!showSummary ? (
            <>
              {/* Item Selection Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-base md:text-lg">Select Items to Return</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 touch-manipulation min-h-[44px]"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 touch-manipulation min-h-[44px]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Items Grid - Responsive */}
                <div className="space-y-3">
                  {returnItems.map((item) => (
                    <div
                      key={item.saleItemId}
                      className={`border rounded-lg p-3 md:p-4 transition-colors ${
                        item.returnQuantity > 0
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm md:text-base truncate">
                            {item.productName}
                          </h4>
                          <p className="text-xs md:text-sm text-gray-600">
                            Available: {item.availableQuantity} of {item.originalQuantity}
                            {item.alreadyReturned > 0 && (
                              <span className="text-amber-600 ml-2">
                                ({item.alreadyReturned} already returned)
                              </span>
                            )}
                          </p>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {formatCurrency(item.unitPrice)} each
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls - Touch Optimized */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3">
                          <button
                            onClick={() => handleQuantityChange(item.saleItemId, -1)}
                            disabled={item.returnQuantity === 0}
                            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg touch-manipulation transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-5 h-5" />
                          </button>

                          <span className="w-16 md:w-20 text-center text-lg md:text-xl font-semibold">
                            {item.returnQuantity}
                          </span>

                          <button
                            onClick={() => handleQuantityChange(item.saleItemId, 1)}
                            disabled={item.returnQuantity >= item.availableQuantity}
                            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg touch-manipulation transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Item Subtotal */}
                        {item.returnQuantity > 0 && (
                          <div className="text-right">
                            <p className="text-xs md:text-sm text-gray-600">Subtotal</p>
                            <p className="text-base md:text-lg font-semibold text-blue-700">
                              {formatCurrency(item.returnQuantity * item.unitPrice)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Reason Section */}
              <div className="mb-6">
                <label className="block font-medium mb-2 text-sm md:text-base">
                  Return Reason <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {RETURN_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setReturnReason(reason.value)}
                      className={`px-3 py-3 md:py-4 text-sm md:text-base rounded-lg border-2 transition-colors touch-manipulation min-h-[56px] ${
                        returnReason === reason.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              <div className="mb-6">
                <label className="block font-medium mb-2 text-sm md:text-base">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Enter any additional information about the return..."
                  className="w-full px-4 py-3 border rounded-lg resize-none touch-manipulation text-sm md:text-base"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{returnNotes.length}/500 characters</p>
              </div>
            </>
          ) : (
            /* Summary View */
            <div className="space-y-6">
              {/* Return Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Return Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{sale.invoiceNumber || sale.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return Reason:</span>
                    <span className="font-medium">
                      {RETURN_REASONS.find((r) => r.value === returnReason)?.label}
                    </span>
                  </div>
                  {returnNotes && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 block mb-1">Notes:</span>
                      <p className="text-gray-900">{returnNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Returned Items */}
              <div>
                <h3 className="font-medium mb-3">Returned Items ({selectedItems.length})</h3>
                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <div key={item.saleItemId} className="flex justify-between text-sm py-2 border-b">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-gray-600">
                          {item.returnQuantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.returnQuantity * item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Summary */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(refundSubtotal)}</span>
                </div>
                {refundDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(refundDiscount)}</span>
                  </div>
                )}
                {refundTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{formatCurrency(refundTax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-blue-200">
                  <span>Total Refund:</span>
                  <span className="text-blue-700">{formatCurrency(totalRefund)}</span>
                </div>
              </div>

              {/* Print Options */}
              <div>
                <h3 className="font-medium mb-3">Print Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    onClick={handlePrintReturnInvoice}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 touch-manipulation min-h-[56px]"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Return Invoice</span>
                  </button>
                  <button
                    onClick={handlePrintOriginalInvoice}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 touch-manipulation min-h-[56px]"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Original Invoice</span>
                  </button>
                  <button
                    onClick={handlePrintCombinedInvoice}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 touch-manipulation min-h-[56px]"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Combined View</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Touch Optimized Buttons */}
        <div className="px-4 md:px-6 py-4 border-t bg-gray-50 flex flex-col md:flex-row gap-3">
          {/* Refund Amount Display */}
          <div className="flex-1 flex items-center justify-between md:justify-start md:gap-4 bg-white rounded-lg px-4 py-3 border">
            <span className="text-sm text-gray-600">Total Refund:</span>
            <span className="text-xl md:text-2xl font-bold text-blue-700">
              {formatCurrency(totalRefund)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 md:flex-initial px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium touch-manipulation min-h-[56px] min-w-[120px]"
            >
              Cancel
            </button>

            {!showSummary ? (
              <button
                onClick={() => setShowSummary(true)}
                disabled={selectedItems.length === 0 || !returnReason}
                className="flex-1 md:flex-initial px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium touch-manipulation min-h-[56px] min-w-[120px]"
              >
                Review Return
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 md:flex-initial px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium touch-manipulation min-h-[56px] min-w-[140px]"
              >
                {isSubmitting ? "Processing..." : "Confirm Return"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
