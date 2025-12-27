import { TableWithStatusDto } from "@/types/api.types";
import { Banknote, CreditCard, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";

interface ClearAllDialogProps {
  isOpen: boolean;
  onClose: () => void;
  occupiedTables: TableWithStatusDto[];
  unpaidTables: TableWithStatusDto[];
  hasUnpaidOrders: boolean;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function ClearAllDialog({
  isOpen,
  onClose,
  occupiedTables,
  unpaidTables,
  hasUnpaidOrders,
  paymentMethod,
  setPaymentMethod,
  onConfirm,
  isProcessing,
}: ClearAllDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => !isProcessing && onClose()}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-2xl transform transition-all w-full max-w-md p-6"
          style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-orange-600 mb-4">
            <TriangleAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
            Clear All Tables
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
            Are you sure you want to clear all {occupiedTables.length} occupied table{occupiedTables.length !== 1 ? 's' : ''}?
            {hasUnpaidOrders && (
              <span className="block mt-2 text-orange-600 font-medium">
                {unpaidTables.length} table{unpaidTables.length !== 1 ? 's have' : ' has'} unpaid orders
              </span>
            )}
          </p>

          {/* Payment Method Selection */}
          {hasUnpaidOrders && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select payment method for unpaid orders:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <PaymentMethodButton
                  icon={<Banknote size={20} />}
                  label="Cash"
                  isSelected={paymentMethod === "cash"}
                  onClick={() => setPaymentMethod("cash")}
                />
                <PaymentMethodButton
                  icon={<CreditCard size={20} />}
                  label="Credit"
                  isSelected={paymentMethod === "credit-card"}
                  onClick={() => setPaymentMethod("credit-card")}
                />
                <PaymentMethodButton
                  icon={<CreditCard size={20} />}
                  label="Debit"
                  isSelected={paymentMethod === "debit-card"}
                  onClick={() => setPaymentMethod("debit-card")}
                />
                <PaymentMethodButton
                  icon={<CreditCard size={20} />}
                  label="Mobile"
                  isSelected={paymentMethod === "mobile-payment"}
                  onClick={() => setPaymentMethod("mobile-payment")}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Clearing...
                </>
              ) : (
                "Clear All"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PaymentMethodButtonProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function PaymentMethodButton({ icon, label, isSelected, onClick }: PaymentMethodButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all",
        isSelected
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-gray-300 hover:border-gray-400 text-gray-700"
      )}
      onClick={onClick}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
