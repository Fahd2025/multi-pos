import { SidebarDialog } from "@/components/shared/SidebarDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import CashCalculator from "@/components/pos/pos-v2/CashCalculator";
import { TableWithStatusDto, SaleDto } from "@/types/api.types";
import {
  MapPin,
  Users,
  Clock,
  X,
  ArrowLeftRight,
  CheckCircle,
  Receipt,
  Banknote,
  CreditCard,
  Printer,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";

interface TableSidebarProps {
  selectedTable: TableWithStatusDto;
  selectedSale: SaleDto | null;
  loadingSale: boolean;
  guestCount: number;
  setGuestCount: (count: number) => void;
  showPaymentMode: boolean;
  setShowPaymentMode: (show: boolean) => void;
  showTransferMode: boolean;
  setShowTransferMode: (show: boolean) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  discountType: "percentage" | "amount";
  setDiscountType: (type: "percentage" | "amount") => void;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  amountPaid: number;
  paymentCalculations: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    tax: number;
    total: number;
    change: number;
  };
  paymentStatus: Record<string, boolean>;
  selectedTargetTable: TableWithStatusDto | null;
  setSelectedTargetTable: (table: TableWithStatusDto | null) => void;
  availableTablesForTransfer: TableWithStatusDto[];
  processingPayment: boolean;
  processingTransfer: boolean;
  onClose: () => void;
  onViewOrder: () => void;
  onPrintInvoice: () => void;
  onProcessPayment: () => void;
  onTransfer: () => void;
  onCompleteOrder: () => void;
  onClearTable: (e: React.MouseEvent) => void;
  handleCashAmount: (amount: number) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export function TableSidebar({
  selectedTable,
  selectedSale,
  loadingSale,
  guestCount,
  setGuestCount,
  showPaymentMode,
  setShowPaymentMode,
  showTransferMode,
  setShowTransferMode,
  paymentMethod,
  setPaymentMethod,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  amountPaid,
  paymentCalculations,
  paymentStatus,
  selectedTargetTable,
  setSelectedTargetTable,
  availableTablesForTransfer,
  processingPayment,
  processingTransfer,
  onClose,
  onViewOrder,
  onPrintInvoice,
  onProcessPayment,
  onTransfer,
  onCompleteOrder,
  onClearTable,
  handleCashAmount,
  getStatusColor,
  getStatusText,
}: TableSidebarProps) {
  return (
    <SidebarDialog
      isOpen={true}
      onClose={onClose}
      title={`${selectedTable.name} - Table #${selectedTable.number}`}
      titleBadge={
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold",
            getStatusColor(selectedTable.status)
          )}
        >
          {getStatusText(selectedTable.status)}
        </span>
      }
      showBackButton={true}
      showCloseButton={true}
      headerActions={
        selectedTable.status === "occupied" &&
        selectedSale && (
          <button
            onClick={onPrintInvoice}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Print Invoice"
          >
            <Printer size={18} />
          </button>
        )
      }
      width="lg"
    >
      <div className="space-y-4">
        {/* Table Information */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Table Information</h3>

          {/* <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
            <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", getStatusColor(selectedTable.status))}>
              {getStatusText(selectedTable.status)}
            </span>
          </div> */}

          {selectedTable.zoneName && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Zone:</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedTable.zoneName}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Capacity:</span>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{selectedTable.capacity} guests</span>
            </div>
          </div>

          {/* Guest Count Input (if available) */}
          {selectedTable.status === "available" && (
            <div className="space-y-2">
              <label
                htmlFor="guestCount"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Number of Guests:
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={guestCount <= 1}
                >
                  <span className="text-lg font-bold">-</span>
                </button>
                <input
                  id="guestCount"
                  type="number"
                  min="1"
                  max={selectedTable.capacity}
                  value={guestCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= selectedTable.capacity) {
                      setGuestCount(value);
                    }
                  }}
                  className="flex-1 text-center text-lg font-semibold py-2 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setGuestCount(Math.min(selectedTable.capacity, guestCount + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={guestCount >= selectedTable.capacity}
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Maximum capacity: {selectedTable.capacity} guests
              </p>
            </div>
          )}

          {/* Guest Count (if occupied) */}
          {selectedTable.status === "occupied" && selectedTable.guestCount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Guests:</span>
              <span className="text-sm font-medium">{selectedTable.guestCount}</span>
            </div>
          )}

          {/* Order Time (if occupied) */}
          {selectedTable.status === "occupied" && selectedTable.orderTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Order Time:</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedTable.orderTime}</span>
              </div>
            </div>
          )}
        </div>

        {/* Order Details or Forms */}
        {selectedTable.status === "occupied" && (
          <>
            {loadingSale && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" text="Loading order..." />
              </div>
            )}

            {!loadingSale && selectedSale && showPaymentMode && (
              <PaymentForm
                selectedSale={selectedSale}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                amountPaid={amountPaid}
                paymentCalculations={paymentCalculations}
                processingPayment={processingPayment}
                onCancel={() => setShowPaymentMode(false)}
                onSubmit={onProcessPayment}
                handleCashAmount={handleCashAmount}
              />
            )}

            {!loadingSale && selectedSale && showTransferMode && (
              <TransferForm
                selectedTable={selectedTable}
                selectedSale={selectedSale}
                selectedTargetTable={selectedTargetTable}
                setSelectedTargetTable={setSelectedTargetTable}
                availableTablesForTransfer={availableTablesForTransfer}
                processingTransfer={processingTransfer}
                onCancel={() => setShowTransferMode(false)}
                onSubmit={onTransfer}
              />
            )}

            {!loadingSale && selectedSale && !showPaymentMode && !showTransferMode && (
              <OrderDetails selectedSale={selectedSale} paymentStatus={paymentStatus} />
            )}

            {!loadingSale && !selectedSale && (
              <div className="text-center py-8 text-gray-500">
                <p>No order details available</p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        {!showPaymentMode && !showTransferMode && (
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-row gap-1">
            {selectedTable.status === "occupied" && (
              <>
                {selectedTable.saleId && paymentStatus[selectedTable.saleId] ? (
                  <button
                    onClick={onClearTable}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Clear Table
                  </button>
                ) : (
                  <button
                    onClick={onCompleteOrder}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Complete Payment
                  </button>
                )}

                <button
                  onClick={() => setShowTransferMode(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                  Transfer Order
                </button>
              </>
            )}

            <button
              onClick={onViewOrder}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Receipt className="w-5 h-5" />
              {selectedTable.status === "occupied" ? "View Order" : "Start Order"}
            </button>
          </div>
        )}
      </div>
    </SidebarDialog>
  );
}

// Sub-components

interface PaymentFormProps {
  selectedSale: SaleDto;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  discountType: "percentage" | "amount";
  setDiscountType: (type: "percentage" | "amount") => void;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  amountPaid: number;
  paymentCalculations: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    tax: number;
    total: number;
    change: number;
  };
  processingPayment: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  handleCashAmount: (amount: number) => void;
}

function PaymentForm({
  selectedSale,
  paymentMethod,
  setPaymentMethod,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  amountPaid,
  paymentCalculations,
  processingPayment,
  onCancel,
  onSubmit,
  handleCashAmount,
}: PaymentFormProps) {
  return (
    <div className="space-y-4">
      {/* Sale Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between mb-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Invoice Number:</span>
          <span className="text-gray-700 dark:text-gray-300">{selectedSale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Items:</span>
          <span className="text-gray-700 dark:text-gray-300">
            {selectedSale.lineItems?.length || 0} items
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Original Total:</span>
          <span className="text-lg font-bold text-blue-600">${selectedSale.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "cash" as const, icon: <Banknote size={20} />, label: "Cash" },
            { value: "credit-card" as const, icon: <CreditCard size={20} />, label: "Credit Card" },
            { value: "debit-card" as const, icon: <CreditCard size={20} />, label: "Debit Card" },
            {
              value: "mobile-payment" as const,
              icon: <CreditCard size={20} />,
              label: "Mobile Pay",
            },
          ].map((method) => (
            <button
              key={method.value}
              className={cn(
                "flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all",
                paymentMethod === method.value
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700"
                  : "border-gray-300 hover:border-gray-400 text-gray-700"
              )}
              onClick={() => setPaymentMethod(method.value)}
            >
              {method.icon}
              <span className="text-sm font-medium">{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Percent size={18} />
          Discount
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percentage" | "amount")}
          >
            <option value="percentage">Percentage (%)</option>
            <option value="amount">Amount ($)</option>
          </select>
          <input
            type="number"
            placeholder="0"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            value={discountValue || ""}
            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Transaction Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Subtotal:</span>
            <span>${paymentCalculations.subtotal.toFixed(2)}</span>
          </div>
          {paymentCalculations.discountAmount > 0 && (
            <>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Discount:</span>
                <span className="text-red-600">
                  -${paymentCalculations.discountAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Amount After Discount:</span>
                <span>${paymentCalculations.taxableAmount.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Tax (15%):</span>
            <span>${paymentCalculations.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-300 dark:border-gray-600">
            <span>Total:</span>
            <span>${paymentCalculations.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Cash Calculator */}
      {paymentMethod === "cash" && (
        <CashCalculator
          total={paymentCalculations.total}
          amountPaid={amountPaid}
          onAmountChange={handleCashAmount}
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          disabled={processingPayment}
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={processingPayment}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
        >
          {processingPayment ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-r-transparent"></div>
              Processing...
            </>
          ) : (
            `Complete Payment - $${paymentCalculations.total.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}

interface TransferFormProps {
  selectedTable: TableWithStatusDto;
  selectedSale: SaleDto;
  selectedTargetTable: TableWithStatusDto | null;
  setSelectedTargetTable: (table: TableWithStatusDto | null) => void;
  availableTablesForTransfer: TableWithStatusDto[];
  processingTransfer: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function TransferForm({
  selectedTable,
  selectedSale,
  selectedTargetTable,
  setSelectedTargetTable,
  availableTablesForTransfer,
  processingTransfer,
  onCancel,
  onSubmit,
}: TransferFormProps) {
  return (
    <div className="space-y-4">
      {/* Current Table Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Transferring From:</h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {selectedTable.name} - Table #{selectedTable.number}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedSale.lineItems?.length || 0} items • ${selectedSale.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Available Tables */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Select Target Table ({availableTablesForTransfer.length} available)
        </h3>

        {availableTablesForTransfer.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No available tables for transfer</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto scrollbar-hide">
            {availableTablesForTransfer.map((table, index) => (
              <button
                key={table.id}
                onClick={() => setSelectedTargetTable(table)}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all duration-200",
                  "animate-in fade-in slide-in-from-bottom-2",
                  selectedTargetTable?.id === table.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{table.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Table #{table.number}
                  </div>
                  {table.zoneName && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {table.zoneName}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Capacity: {table.capacity} guests
                  </div>
                </div>
                {selectedTargetTable?.id === table.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={onCancel}
          disabled={processingTransfer}
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={processingTransfer || !selectedTargetTable}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
        >
          {processingTransfer ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-r-transparent"></div>
              Transferring...
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-5 h-5" />
              Confirm Transfer
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface OrderDetailsProps {
  selectedSale: SaleDto;
  paymentStatus: Record<string, boolean>;
}

function OrderDetails({ selectedSale, paymentStatus }: OrderDetailsProps) {
  return (
    <div className="space-y-4">
      {/* Invoice Info */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Details</h3>

        {selectedSale.invoiceNumber && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Invoice #:</span>
            <span className="text-sm font-medium">{selectedSale.invoiceNumber}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
          <span className="text-sm font-mono">{selectedSale.transactionId}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Payment Status:</span>
          <span
            className={cn(
              "px-2 py-1 rounded text-xs font-semibold",
              selectedSale.id && paymentStatus[selectedSale.id]
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            )}
          >
            {selectedSale.id && paymentStatus[selectedSale.id] ? "Paid" : "Unpaid"}
          </span>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Items</h3>
        <div className="space-y-2">
          {selectedSale.lineItems.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500">
                  ${item.unitPrice.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ${item.lineTotal.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium">${selectedSale.subtotal.toFixed(2)}</span>
          </div>
          {selectedSale.totalDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Discount:</span>
              <span className="font-medium text-red-600">
                -${selectedSale.totalDiscount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tax:</span>
            <span className="font-medium">${selectedSale.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total:</span>
            <span className="text-blue-600">${selectedSale.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
