"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { XCircle, AlertTriangle } from "lucide-react";

interface FailureReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  onConfirm: (reason: string) => Promise<void>;
}

export function FailureReasonDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onConfirm,
}: FailureReasonDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(
    null
  );

  // Predefined failure reasons
  const quickReasons = [
    { key: "customerNotHome", label: "Customer not home" },
    { key: "wrongAddress", label: "Wrong/Incomplete address" },
    { key: "customerRefused", label: "Customer refused order" },
    { key: "weatherConditions", label: "Bad weather conditions" },
    { key: "vehicleIssue", label: "Vehicle breakdown" },
    { key: "other", label: "Other reason" },
  ];

  const handleQuickReasonSelect = (
    quickReason: (typeof quickReasons)[0]
  ) => {
    if (quickReason.key === selectedQuickReason) {
      setSelectedQuickReason(null);
      setReason("");
    } else {
      setSelectedQuickReason(quickReason.key);
      setReason(quickReason.label);
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for the failure");
      return;
    }

    try {
      setConfirming(true);
      await onConfirm(reason);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Failed to mark as failed:", error);
      alert("Failed to update status");
    } finally {
      setConfirming(false);
    }
  };

  const resetForm = () => {
    setReason("");
    setSelectedQuickReason(null);
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
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-full bg-red-100 p-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <span>Mark Delivery as Failed</span>
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Please provide a reason for the failed delivery
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="font-mono font-semibold">
              #{orderNumber.substring(0, 8)}
            </p>
          </div>

          {/* Warning Message */}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">
                Important
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                This action cannot be undone. The order status will be
                permanently marked as failed.
              </p>
            </div>
          </div>

          {/* Quick Reasons */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Select a reason
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickReasons.map((quickReason) => (
                <button
                  key={quickReason.key}
                  type="button"
                  onClick={() => handleQuickReasonSelect(quickReason)}
                  className={`rounded-lg border p-3 text-left text-sm transition-all hover:border-red-300 hover:bg-red-50 ${
                    selectedQuickReason === quickReason.key
                      ? "border-red-500 bg-red-50 font-semibold text-red-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {quickReason.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Textarea */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Provide details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setSelectedQuickReason(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              rows={4}
              placeholder="Describe why the delivery failed..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Be as specific as possible to help improve future deliveries
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
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
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!reason.trim() || confirming}
          >
            {confirming ? "Marking as Failed..." : "Confirm Failed"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
