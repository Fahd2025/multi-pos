"use client";

import React, { Suspense, useState } from "react";
import { useTablesWithStatus } from "@/hooks/useTables";
import { useZones } from "@/hooks/useZones";
import { TableWithStatusDto } from "@/types/api.types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Select } from "@/components/shared/Select";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { MapPin, Users, Clock, DollarSign, ArrowRight, X, ArrowLeftRight, CheckCircle, MoreVertical, Receipt, UtensilsCrossed, ArrowLeft, Banknote, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import tableService from "@/services/table.service";
import { useToast } from "@/hooks/useToast";
import salesService from "@/services/sales.service";
import { PaymentDialog } from "@/components/pos/PaymentDialog";

type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";

/**
 * POS Tables Page - For cashiers to view and select tables during order taking
 * This is a simplified, read-only view focused on table selection and status
 */
export default function POSTablesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>();
  const { tables, isLoading, error, mutate } = useTablesWithStatus(selectedZoneId);
  const { zones } = useZones();

  // Dialog states
  const [clearDialog, setClearDialog] = useState<{ isOpen: boolean; table?: TableWithStatusDto }>({ isOpen: false });
  const [transferDialog, setTransferDialog] = useState<{ isOpen: boolean; table?: TableWithStatusDto }>({ isOpen: false });
  const [transferTargetNumber, setTransferTargetNumber] = useState("");
  const [processingDialog, setProcessingDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<{ isOpen: boolean; saleId?: string; tableNumber?: number }>({ isOpen: false });
  const [clearAllDialog, setClearAllDialog] = useState(false);
  const [clearAllPaymentMethod, setClearAllPaymentMethod] = useState<PaymentMethod>("cash");

  // Track payment status for each table (saleId -> isPaid)
  const [paymentStatus, setPaymentStatus] = useState<Record<string, boolean>>({});

  // Check payment status for all occupied tables
  React.useEffect(() => {
    if (!tables || tables.length === 0) return;

    const checkPaymentStatus = async () => {
      const statusMap: Record<string, boolean> = {};

      for (const table of tables) {
        if (table.status === "occupied" && table.saleId) {
          try {
            const sale = await salesService.getSaleById(table.saleId);
            // Check if paid: amountPaid >= total
            const isPaid = sale.total > 0 && (sale as any).amountPaid && (sale as any).amountPaid >= sale.total;
            statusMap[table.saleId] = isPaid;
          } catch (error) {
            console.error(`Failed to check payment status for sale ${table.saleId}:`, error);
            // Default to unpaid if we can't determine
            statusMap[table.saleId] = false;
          }
        }
      }

      setPaymentStatus(statusMap);
    };

    checkPaymentStatus();
  }, [tables]);

  // Check if we just completed a payment and need to auto-clear
  React.useEffect(() => {
    const autoCleanTable = searchParams.get("autoCleanTable");
    if (autoCleanTable) {
      const tableNumber = parseInt(autoCleanTable);
      if (!isNaN(tableNumber)) {
        handleClearTableDirect(tableNumber);
        // Clean up URL parameter
        router.replace("/pos/tables");
      }
    }
  }, [searchParams]);

  const handleTableSelect = (table: TableWithStatusDto) => {
    if (table.status === "occupied") {
      // Navigate to the existing sale
      router.push(`/pos?saleId=${table.saleId}`);
    } else {
      // Navigate to POS with table pre-selected
      router.push(`/pos?tableNumber=${table.number}&guestCount=1`);
    }
  };

  // Direct clear (for auto-clear after payment)
  const handleClearTableDirect = async (tableNumber: number) => {
    try {
      await tableService.clearTable(tableNumber);
      toast.success("Table cleared", `Table #${tableNumber} is now available`);
      mutate(); // Refresh table list
    } catch (error: any) {
      toast.error("Failed to clear table", error.message || "Could not clear the table");
    }
  };

  // Show clear confirmation dialog
  const handleClearTable = (table: TableWithStatusDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setClearDialog({ isOpen: true, table });
  };

  // Execute clear
  const executeClear = async () => {
    if (!clearDialog.table) return;

    setProcessingDialog(true);
    try {
      await tableService.clearTable(clearDialog.table.number);
      toast.success("Table cleared", `Table #${clearDialog.table.number} is now available`);
      mutate();
      setClearDialog({ isOpen: false });
    } catch (error: any) {
      toast.error("Failed to clear table", error.message || "Could not clear the table");
    } finally {
      setProcessingDialog(false);
    }
  };

  // Handle complete (for unpaid orders - show payment dialog)
  const handleCompleteOrder = (table: TableWithStatusDto, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!table.saleId) {
      toast.error("No active order", "This table has no order to complete");
      return;
    }

    // Open payment dialog
    setPaymentDialog({
      isOpen: true,
      saleId: table.saleId,
      tableNumber: table.number,
    });
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    // Auto-clear the table after payment
    if (paymentDialog.tableNumber) {
      try {
        await tableService.clearTable(paymentDialog.tableNumber);
        toast.success("Table cleared", `Table #${paymentDialog.tableNumber} is now available`);

        // Refresh table list after clearing
        await mutate();
      } catch (error: any) {
        console.error("Failed to auto-clear table:", error);
        toast.error("Clear failed", error.message || "Could not clear the table after payment");
      }
    }

    // Close payment dialog
    setPaymentDialog({ isOpen: false });
  };

  // Get occupied tables with unpaid orders
  const occupiedTables = tables?.filter(t => t.status === "occupied") || [];
  const unpaidTables = occupiedTables.filter(t => t.saleId && !paymentStatus[t.saleId]);
  const hasUnpaidOrders = unpaidTables.length > 0;

  // Handle clear all tables
  const handleClearAll = async () => {
    if (!tables || tables.length === 0) {
      toast.warning("No tables to clear", "There are no tables to clear");
      return;
    }

    setProcessingDialog(true);
    try {
      // If there are unpaid orders, process payments first
      if (hasUnpaidOrders) {
        const paymentMethodMap: Record<PaymentMethod, number> = {
          cash: 0,
          "credit-card": 1,
          "debit-card": 2,
          "mobile-payment": 3,
        };

        // Process payment for each unpaid order
        for (const table of unpaidTables) {
          if (table.saleId) {
            try {
              const sale = await salesService.getSaleById(table.saleId);
              await salesService.updateSalePayment(table.saleId, {
                paymentMethod: paymentMethodMap[clearAllPaymentMethod],
                amountPaid: sale.total,
                changeReturned: 0,
              });
            } catch (error) {
              console.error(`Failed to process payment for table ${table.number}:`, error);
              toast.error("Payment failed", `Failed to process payment for Table #${table.number}`);
            }
          }
        }
      }

      // Clear all occupied tables
      let clearedCount = 0;
      for (const table of occupiedTables) {
        try {
          await tableService.clearTable(table.number);
          clearedCount++;
        } catch (error) {
          console.error(`Failed to clear table ${table.number}:`, error);
        }
      }

      toast.success(
        "Tables cleared",
        `Successfully cleared ${clearedCount} table${clearedCount !== 1 ? 's' : ''}`,
        5000
      );

      // Refresh table list
      mutate();
      setClearAllDialog(false);
    } catch (error: any) {
      toast.error("Clear all failed", error.message || "Could not clear all tables");
    } finally {
      setProcessingDialog(false);
    }
  };

  // Show transfer dialog
  const handleTransferTable = (table: TableWithStatusDto, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!table.saleId) {
      toast.error("No active order", "This table has no order to transfer");
      return;
    }

    setTransferDialog({ isOpen: true, table });
    setTransferTargetNumber("");
  };

  // Execute transfer
  const executeTransfer = async () => {
    if (!transferDialog.table) return;

    const targetNumber = parseInt(transferTargetNumber);
    if (isNaN(targetNumber) || targetNumber === transferDialog.table.number) {
      toast.error("Invalid table number", "Please enter a valid different table number");
      return;
    }

    setProcessingDialog(true);
    try {
      await tableService.transferOrder({
        saleId: transferDialog.table.saleId!,
        fromTableNumber: transferDialog.table.number,
        toTableNumber: targetNumber,
      });

      toast.success("Order transferred", `Order moved from Table #${transferDialog.table.number} to Table #${targetNumber}`);
      mutate();
      setTransferDialog({ isOpen: false });
      setTransferTargetNumber("");
    } catch (error: any) {
      toast.error("Transfer failed", error.message || "Could not transfer the order");
    } finally {
      setProcessingDialog(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-red-500 text-white";
      case "reserved":
        return "bg-yellow-500 text-white";
      default:
        return "bg-green-500 text-white";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "occupied":
        return "Occupied";
      case "reserved":
        return "Reserved";
      default:
        return "Available";
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load tables</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/pos")}
            className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <UtensilsCrossed size={28} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Restaurant Tables</h1>
            <p className="text-sm text-gray-500">Select a table to start or continue an order</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Zone Filter */}
          {zones && zones.length > 0 && (
            <Select
              value={selectedZoneId?.toString() || "all"}
              onChange={(e) =>
                setSelectedZoneId(e.target.value === "all" ? undefined : Number(e.target.value))
              }
              options={[
                { value: "all", label: "All Zones" },
                ...zones.map((zone) => ({
                  value: zone.id.toString(),
                  label: `${zone.name} (${zone.tableCount || 0} tables)`,
                })),
              ]}
            />
          )}

          {/* Clear All Button - Only show if there are occupied tables */}
          {occupiedTables.length > 0 && (
            <button
              onClick={() => setClearAllDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear All ({occupiedTables.length})
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading tables..." />
          </div>
        )}

        {/* Tables Grid */}
        {!isLoading && tables && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleTableSelect(table)}
                onClear={(e) => handleClearTable(table, e)}
                onTransfer={(e) => handleTransferTable(table, e)}
                onComplete={(e) => handleCompleteOrder(table, e)}
                isPaid={table.saleId ? paymentStatus[table.saleId] || false : false}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tables && tables.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              No tables found
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              {selectedZoneId
                ? "No tables in this zone. Try selecting a different zone."
                : "No tables have been configured yet."}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        {!isLoading && tables && tables.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Tables"
              value={tables.length}
              color="blue"
            />
            <StatCard
              label="Available"
              value={tables.filter((t) => t.status === "available").length}
              color="green"
            />
            <StatCard
              label="Occupied"
              value={tables.filter((t) => t.status === "occupied").length}
              color="red"
            />
            <StatCard
              label="Reserved"
              value={tables.filter((t) => t.status === "reserved").length}
              color="yellow"
            />
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={clearDialog.isOpen}
        onClose={() => setClearDialog({ isOpen: false })}
        title="Clear Table"
        message={`Are you sure you want to clear Table #${clearDialog.table?.number}? This will mark it as available.`}
        confirmLabel="Clear Table"
        variant="warning"
        onConfirm={executeClear}
        isProcessing={processingDialog}
      />

      {/* Transfer Dialog */}
      {transferDialog.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !processingDialog && setTransferDialog({ isOpen: false })}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white dark:bg-gray-800 rounded-2xl transform transition-all w-full max-w-md p-6"
              style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                Transfer Order
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                Transfer order from Table #{transferDialog.table?.number} to:
              </p>
              <div className="mb-6">
                <Input
                  type="number"
                  placeholder="Enter target table number"
                  value={transferTargetNumber}
                  onChange={(e) => setTransferTargetNumber(e.target.value)}
                  disabled={processingDialog}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !processingDialog) {
                      executeTransfer();
                    } else if (e.key === "Escape" && !processingDialog) {
                      setTransferDialog({ isOpen: false });
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTransferDialog({ isOpen: false })}
                  disabled={processingDialog}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeTransfer}
                  disabled={processingDialog || !transferTargetNumber}
                  className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {processingDialog ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Transferring...
                    </>
                  ) : (
                    "Transfer"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {paymentDialog.isOpen && paymentDialog.saleId && paymentDialog.tableNumber && (
        <PaymentDialog
          isOpen={paymentDialog.isOpen}
          onClose={() => setPaymentDialog({ isOpen: false })}
          saleId={paymentDialog.saleId}
          tableNumber={paymentDialog.tableNumber}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Clear All Dialog */}
      {clearAllDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !processingDialog && setClearAllDialog(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white dark:bg-gray-800 rounded-2xl transform transition-all w-full max-w-md p-6"
              style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 text-orange-600 mb-4">
                <X className="w-6 h-6" />
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

              {/* Payment Method Selection - Only show if there are unpaid orders */}
              {hasUnpaidOrders && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select payment method for unpaid orders:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all",
                        clearAllPaymentMethod === "cash"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400 text-gray-700"
                      )}
                      onClick={() => setClearAllPaymentMethod("cash")}
                    >
                      <Banknote size={20} />
                      <span className="text-sm font-medium">Cash</span>
                    </button>
                    <button
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all",
                        clearAllPaymentMethod === "credit-card"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400 text-gray-700"
                      )}
                      onClick={() => setClearAllPaymentMethod("credit-card")}
                    >
                      <CreditCard size={20} />
                      <span className="text-sm font-medium">Credit</span>
                    </button>
                    <button
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all",
                        clearAllPaymentMethod === "debit-card"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400 text-gray-700"
                      )}
                      onClick={() => setClearAllPaymentMethod("debit-card")}
                    >
                      <CreditCard size={20} />
                      <span className="text-sm font-medium">Debit</span>
                    </button>
                    <button
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all",
                        clearAllPaymentMethod === "mobile-payment"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400 text-gray-700"
                      )}
                      onClick={() => setClearAllPaymentMethod("mobile-payment")}
                    >
                      <CreditCard size={20} />
                      <span className="text-sm font-medium">Mobile</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setClearAllDialog(false)}
                  disabled={processingDialog}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={processingDialog}
                  className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {processingDialog ? (
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
      )}
    </div>
  );
}

/**
 * Individual table card component
 */
function TableCard({
  table,
  onClick,
  onClear,
  onTransfer,
  onComplete,
  isPaid,
  getStatusColor,
  getStatusText,
}: {
  table: TableWithStatusDto;
  onClick: () => void;
  onClear: (e: React.MouseEvent) => void;
  onTransfer: (e: React.MouseEvent) => void;
  onComplete: (e: React.MouseEvent) => void;
  isPaid: boolean;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200",
        "border-2 border-transparent hover:border-blue-500",
        "p-4 text-left w-full group cursor-pointer"
      )}
    >
      {/* Status Badge */}
      <div
        className={cn(
          "absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold",
          getStatusColor(table.status)
        )}
      >
        {getStatusText(table.status)}
      </div>

      {/* Table Info */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {table.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Table #{table.number}
        </p>
      </div>

      {/* Zone */}
      {table.zoneName && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          {table.zoneName}
        </div>
      )}

      {/* Capacity */}
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
        <Users className="w-4 h-4 mr-1" />
        Capacity: {table.capacity} guests
      </div>

      {/* Occupied Details */}
      {table.status === "occupied" && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {table.invoiceNumber && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Invoice: {table.invoiceNumber}
            </p>
          )}
          {table.guestCount && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <Users className="w-3 h-3 mr-1" />
              {table.guestCount} {table.guestCount === 1 ? "guest" : "guests"}
            </div>
          )}
          {table.orderTime && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {table.orderTime}
            </div>
          )}
          {table.orderTotal && (
            <div className="flex items-center text-xs font-semibold text-gray-900 dark:text-gray-100">
              <DollarSign className="w-3 h-3 mr-1" />
              ${table.orderTotal.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons for Occupied Tables */}
      {table.status === "occupied" && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Primary action */}
          <button
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <Receipt className="w-3 h-3" />
            View Order
          </button>

          {/* Secondary actions - conditional based on payment status */}
          <div className="flex gap-2">
            <button
              onClick={onTransfer}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
              title="Transfer to another table"
            >
              <ArrowLeftRight className="w-3 h-3" />
              Transfer
            </button>

            {/* Show "Clear" for paid orders, "Complete" for unpaid orders */}
            {isPaid ? (
              <button
                onClick={onClear}
                className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
                title="Clear the table (order is paid)"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
                title="Complete payment and clear table"
              >
                <CheckCircle className="w-3 h-3" />
                Complete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Hint for Available Tables */}
      {table.status === "available" && (
        <div className="mt-3 flex items-center justify-between text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Start Order</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "red" | "yellow";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", colorClasses[color])}>{value}</p>
    </div>
  );
}
