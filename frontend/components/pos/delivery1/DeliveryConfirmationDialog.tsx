"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Circle, DollarSign } from "lucide-react";

interface DeliveryConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  onConfirm: (confirmation: DeliveryConfirmation) => Promise<void>;
}

export interface DeliveryConfirmation {
  cashReceived: boolean;
  amountReceived: number;
  customerSigned: boolean;
  itemsDelivered: boolean;
  notes?: string;
  completedAt: string;
}

export function DeliveryConfirmationDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  orderTotal,
  onConfirm,
}: DeliveryConfirmationDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const [checklist, setChecklist] = useState({
    cashReceived: false,
    customerSigned: false,
    itemsDelivered: false,
  });
  const [amountReceived, setAmountReceived] = useState<string>(
    orderTotal.toFixed(2)
  );
  const [notes, setNotes] = useState("");

  const allChecked =
    checklist.cashReceived &&
    checklist.customerSigned &&
    checklist.itemsDelivered;
  const amountMatch = parseFloat(amountReceived || "0") === orderTotal;

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const handleConfirm = async () => {
    if (!allChecked) {
      alert("Please complete all checklist items");
      return;
    }

    if (!amountMatch) {
      const proceed = confirm(
        `Amount received (${formatCurrency(
          amountReceived
        )}) doesn't match order total (${formatCurrency(
          orderTotal
        )}). Proceed anyway?`
      );
      if (!proceed) return;
    }

    try {
      setConfirming(true);
      const confirmation: DeliveryConfirmation = {
        ...checklist,
        amountReceived: parseFloat(amountReceived || "0"),
        notes,
        completedAt: new Date().toISOString(),
      };
      await onConfirm(confirmation);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Failed to confirm delivery:", error);
      alert("Failed to confirm delivery");
    } finally {
      setConfirming(false);
    }
  };

  const resetForm = () => {
    setChecklist({
      cashReceived: false,
      customerSigned: false,
      itemsDelivered: false,
    });
    setAmountReceived(orderTotal.toFixed(2));
    setNotes("");
  };

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Delivery</DialogTitle>
          <p className="text-sm text-gray-500">
            Confirm delivery for order #{orderNumber.substring(0, 8)}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Delivery Checklist */}
          <div>
            <p className="text-sm font-semibold mb-3">Delivery Checklist</p>
            <div className="space-y-2">
              <div
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleChecklistItem("itemsDelivered")}
              >
                {checklist.itemsDelivered ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      checklist.itemsDelivered
                        ? "text-green-900"
                        : "text-gray-700"
                    }`}
                  >
                    All items delivered
                  </p>
                  <p className="text-xs text-gray-500">
                    Verify all items from the order are delivered
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleChecklistItem("cashReceived")}
              >
                {checklist.cashReceived ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      checklist.cashReceived
                        ? "text-green-900"
                        : "text-gray-700"
                    }`}
                  >
                    Cash received
                  </p>
                  <p className="text-xs text-gray-500">
                    Confirm payment received from customer
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleChecklistItem("customerSigned")}
              >
                {checklist.customerSigned ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      checklist.customerSigned
                        ? "text-green-900"
                        : "text-gray-700"
                    }`}
                  >
                    Customer acknowledged
                  </p>
                  <p className="text-xs text-gray-500">
                    Customer confirmed receipt of order
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Received */}
          <div>
            <label className="text-sm font-semibold">Amount Received</label>
            <div className="mt-2 relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className={`w-full rounded-lg border pl-9 pr-3 py-2 ${
                  amountMatch ? "border-green-500" : "border-orange-500"
                }`}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Order total: {formatCurrency(orderTotal)}
              </p>
              {amountMatch && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Amount matches
                </p>
              )}
              {!amountMatch && parseFloat(amountReceived || "0") > 0 && (
                <p className="text-xs text-orange-600 font-medium">
                  ⚠ Amount differs
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold">
              Delivery Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2"
              rows={2}
              placeholder="Any issues or special notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!allChecked || confirming}
          >
            {confirming ? "Confirming..." : "Confirm Delivered"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
