"use client";

import React, { Suspense, useState, useRef } from "react";
import { useTablesWithStatus } from "@/hooks/useTables";
import { useZones } from "@/hooks/useZones";
import { TableWithStatusDto, SaleDto } from "@/types/api.types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Select } from "@/components/shared/Select";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { SidebarDialog } from "@/components/shared/SidebarDialog";
import CashCalculator from "@/components/pos-v2/CashCalculator";
import { MapPin, Users, Clock, DollarSign, ArrowRight, X, ArrowLeftRight, CheckCircle, MoreVertical, Receipt, UtensilsCrossed, ArrowLeft, Banknote, CreditCard, Printer, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import tableService from "@/services/table.service";
import { useToast } from "@/hooks/useToast";
import salesService from "@/services/sales.service";
import branchInfoService from "@/services/branch-info.service";
import invoiceTemplateService from "@/services/invoice-template.service";
import { InvoiceSchema } from "@/types/invoice-template.types";
import { transformSaleToInvoiceData } from "@/lib/invoice-data-transformer";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useReactToPrint } from "react-to-print";

type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";
type TableStatus = "all" | "available" | "occupied" | "reserved";

/**
 * POS Tables Page - For cashiers to view and select tables during order taking
 * This is a simplified, read-only view focused on table selection and status
 */
export default function POSTablesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<TableStatus>("all");
  const { tables, isLoading, error, mutate } = useTablesWithStatus(selectedZoneId);
  const { zones } = useZones();

  // Dialog states
  const [selectedTable, setSelectedTable] = useState<TableWithStatusDto | null>(null);
  const [selectedSale, setSelectedSale] = useState<SaleDto | null>(null);
  const [loadingSale, setLoadingSale] = useState(false);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [clearDialog, setClearDialog] = useState<{ isOpen: boolean; table?: TableWithStatusDto }>({ isOpen: false });
  const [transferDialog, setTransferDialog] = useState<{ isOpen: boolean; table?: TableWithStatusDto }>({ isOpen: false });
  const [transferTargetNumber, setTransferTargetNumber] = useState("");
  const [processingDialog, setProcessingDialog] = useState(false);
  const [clearAllDialog, setClearAllDialog] = useState(false);
  const [clearAllPaymentMethod, setClearAllPaymentMethod] = useState<PaymentMethod>("cash");

  // Payment mode state
  const [showPaymentMode, setShowPaymentMode] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);

  // Transfer mode state
  const [showTransferMode, setShowTransferMode] = useState(false);
  const [selectedTargetTable, setSelectedTargetTable] = useState<TableWithStatusDto | null>(null);
  const [processingTransfer, setProcessingTransfer] = useState(false);

  // Invoice printing state
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

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

            // Debug logging
            console.log(`[Payment Status Check] Table ${table.number}:`, {
              saleId: sale.id,
              total: sale.total,
              amountPaid: sale.amountPaid,
              changeReturned: sale.changeReturned,
              hasAmountPaid: sale.amountPaid !== undefined && sale.amountPaid !== null,
            });

            // Check if paid: amountPaid >= total
            const isPaid = sale.total > 0 && sale.amountPaid !== undefined && sale.amountPaid !== null && sale.amountPaid >= sale.total;
            statusMap[table.saleId] = isPaid;

            console.log(`[Payment Status] Table ${table.number}: ${isPaid ? 'PAID' : 'UNPAID'}`);
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

  const handleTableSelect = async (table: TableWithStatusDto) => {
    setSelectedTable(table);

    // Load sale details if table is occupied
    if (table.status === "occupied" && table.saleId) {
      setLoadingSale(true);
      try {
        const sale = await salesService.getSaleById(table.saleId);
        setSelectedSale(sale);
      } catch (error: any) {
        console.error("Failed to load sale:", error);
        toast.error("Failed to load order details", error.message || "Could not load order");
        setSelectedSale(null);
      } finally {
        setLoadingSale(false);
      }
    } else {
      setSelectedSale(null);
    }
  };

  // Handle close sidebar
  const handleCloseSidebar = () => {
    setSelectedTable(null);
    setSelectedSale(null);
    setGuestCount(1); // Reset guest count
    setShowPaymentMode(false); // Reset payment mode
    setPaymentMethod("cash");
    setDiscountValue(0);
    setAmountPaid(0);
    setShowTransferMode(false); // Reset transfer mode
    setSelectedTargetTable(null);
  };

  // Handle navigate to POS to edit order
  const handleViewOrder = () => {
    if (selectedTable) {
      if (selectedTable.status === "occupied" && selectedTable.saleId) {
        router.push(`/pos?saleId=${selectedTable.saleId}`);
      } else {
        // For available tables, use the entered guest count
        router.push(`/pos?tableNumber=${selectedTable.number}&guestCount=${guestCount}`);
      }
    }
  };

  // Print invoice handler
  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${selectedSale?.invoiceNumber || "Table"}`,
  });

  // Handle print invoice
  const handlePrintInvoiceClick = async () => {
    if (!selectedSale) {
      toast.error("No order", "No order data available to print");
      return;
    }

    try {
      // Load active template
      const template = await invoiceTemplateService.getActiveTemplate();

      if (!template) {
        toast.error("No active template", "Please activate an invoice template in Settings");
        return;
      }

      // Parse schema
      const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;

      // Load branch info
      const branchInfo = await branchInfoService.getBranchInfo();

      // Transform sale data to invoice data format
      const transformedData = transformSaleToInvoiceData(selectedSale, branchInfo);

      // Set invoice data and trigger print
      setInvoiceSchema(parsedSchema);
      setInvoiceData(transformedData);

      // Trigger print after a short delay
      setTimeout(() => {
        if (invoiceRef.current && handlePrintInvoice) {
          handlePrintInvoice();
          toast.success("Invoice sent to printer");
        }
      }, 500);
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Print failed", "Failed to prepare invoice for printing");
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

  // Payment calculation
  const calculatePaymentTotal = () => {
    if (!selectedSale) return 0;
    const subtotal = selectedSale.subtotal;
    const taxRate = 0.15;
    const discountAmount = discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = taxableAmount * taxRate;
    return taxableAmount + tax;
  };

  const paymentCalculations = React.useMemo(() => {
    if (!selectedSale) return { subtotal: 0, discountAmount: 0, taxableAmount: 0, tax: 0, total: 0, change: 0 };
    const subtotal = selectedSale.subtotal;
    const discountAmount = discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRate = 0.15;
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;
    const change = amountPaid - total;
    return { subtotal, discountAmount, taxableAmount, tax, total, change };
  }, [selectedSale, discountType, discountValue, amountPaid]);

  // Update amount paid when payment method or total changes
  React.useEffect(() => {
    if (paymentMethod !== "cash" && showPaymentMode) {
      setAmountPaid(paymentCalculations.total);
    }
  }, [paymentMethod, paymentCalculations.total, showPaymentMode]);

  // Handle cash amount change
  const handleCashAmount = (amount: number) => {
    setAmountPaid(amount);
  };

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedTable || !selectedSale) return;

    // Validation
    if (paymentMethod === "cash" && amountPaid < paymentCalculations.total) {
      toast.error("Insufficient payment", `Amount paid ($${amountPaid.toFixed(2)}) is less than total ($${paymentCalculations.total.toFixed(2)})`);
      return;
    }

    setProcessingPayment(true);

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
        amountPaid: paymentMethod === "cash" ? amountPaid : paymentCalculations.total,
        changeReturned: paymentMethod === "cash" ? Math.max(0, amountPaid - paymentCalculations.total) : 0,
        discountType: discountValue > 0 ? (discountType === "percentage" ? 1 : 2) : 0,
        discountValue: discountValue,
      };

      // Debug logging
      console.log('[Process Payment] Payment data being sent:', {
        saleId: selectedSale.id,
        paymentMethod: paymentMethod,
        paymentMethodEnum: paymentMethodMap[paymentMethod],
        amountPaidState: amountPaid,
        calculatedTotal: paymentCalculations.total,
        updateData: updateData,
      });

      // Call API to update payment
      const result = await salesService.updateSalePayment(selectedSale.id, updateData);

      console.log('[Process Payment] API Response:', result);

      toast.success(
        "Payment completed!",
        `Invoice #${selectedSale.invoiceNumber || 'N/A'} | Total: $${paymentCalculations.total.toFixed(2)}${paymentMethod === "cash" ? ` | Change: $${paymentCalculations.change.toFixed(2)}` : ""}`,
        7000
      );

      // Refresh table data to show updated payment status
      await mutate();

      // Reset payment form
      setShowPaymentMode(false);
      setPaymentMethod("cash");
      setAmountPaid(0);
      setDiscountType("percentage");
      setDiscountValue(0);

      // Close sidebar
      handleCloseSidebar();
    } catch (err: any) {
      console.error("Error processing payment:", err);
      const errorMessage = err.message || "Failed to process payment";
      toast.error("Payment failed", errorMessage, 8000);
    } finally {
      setProcessingPayment(false);
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

  // Handle complete (for unpaid orders - show payment mode in sidebar)
  const handleCompleteOrder = (table: TableWithStatusDto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!table.saleId) {
      toast.error("No active order", "This table has no order to complete");
      return;
    }

    // Switch to payment mode in sidebar
    setShowPaymentMode(true);

    // Initialize payment amount to the total
    if (selectedSale) {
      const total = calculatePaymentTotal();
      setAmountPaid(total);
    }
  };

  // Filter tables by status
  const filteredTables = React.useMemo(() => {
    if (!tables) return [];
    if (statusFilter === "all") return tables;
    return tables.filter(t => t.status === statusFilter);
  }, [tables, statusFilter]);

  // Get occupied tables with unpaid orders
  const occupiedTables = tables?.filter(t => t.status === "occupied") || [];
  const unpaidTables = occupiedTables.filter(t => t.saleId && !paymentStatus[t.saleId]);
  const hasUnpaidOrders = unpaidTables.length > 0;

  // Status counts
  const statusCounts = React.useMemo(() => {
    if (!tables) return { all: 0, available: 0, occupied: 0, reserved: 0 };
    return {
      all: tables.length,
      available: tables.filter(t => t.status === "available").length,
      occupied: tables.filter(t => t.status === "occupied").length,
      reserved: tables.filter(t => t.status === "reserved").length,
    };
  }, [tables]);

  // Get available tables for transfer (excluding current table)
  const availableTablesForTransfer = React.useMemo(() => {
    if (!tables || !selectedTable) return [];
    return tables.filter(t => t.status === "available" && t.id !== selectedTable.id);
  }, [tables, selectedTable]);

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

  // Show transfer mode in sidebar
  const handleTransferTable = (table?: TableWithStatusDto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const tableToCheck = table || selectedTable;
    if (!tableToCheck || !tableToCheck.saleId) {
      toast.error("No active order", "This table has no order to transfer");
      return;
    }

    // Switch to transfer mode in sidebar
    setShowTransferMode(true);
    setSelectedTargetTable(null);
  };

  // Execute transfer
  const executeTransfer = async () => {
    if (!selectedTable || !selectedTargetTable) {
      toast.error("Invalid selection", "Please select a target table");
      return;
    }

    if (selectedTargetTable.number === selectedTable.number) {
      toast.error("Invalid table", "Cannot transfer to the same table");
      return;
    }

    setProcessingTransfer(true);
    try {
      await tableService.transferOrder({
        saleId: selectedTable.saleId!,
        fromTableNumber: selectedTable.number,
        toTableNumber: selectedTargetTable.number,
      });

      toast.success("Order transferred", `Order moved from Table #${selectedTable.number} to Table #${selectedTargetTable.number}`);
      mutate();
      handleCloseSidebar();
    } catch (error: any) {
      toast.error("Transfer failed", error.message || "Could not transfer the order");
    } finally {
      setProcessingTransfer(false);
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

      {/* Status Filter */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                statusFilter === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => setStatusFilter("all")}
            >
              All ({statusCounts.all})
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                statusFilter === "available"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => setStatusFilter("available")}
            >
              Available ({statusCounts.available})
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                statusFilter === "occupied"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => setStatusFilter("occupied")}
            >
              Occupied ({statusCounts.occupied})
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                statusFilter === "reserved"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => setStatusFilter("reserved")}
            >
              Reserved ({statusCounts.reserved})
            </button>
          </div>
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
        {!isLoading && filteredTables && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
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

        {/* Quick Stats - Disabled */}
        {/* {!isLoading && tables && tables.length > 0 && (
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
        )} */}
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

      {/* Loading Overlay */}
      {loadingSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <LoadingSpinner size="lg" text="Loading order details..." />
          </div>
        </div>
      )}

      {/* Table Detail Sidebar */}
      {selectedTable && (
        <SidebarDialog
          isOpen={true}
          onClose={handleCloseSidebar}
          title={`${selectedTable.name} - Table #${selectedTable.number}`}
          titleBadge={
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              getStatusColor(selectedTable.status)
            )}>
              {getStatusText(selectedTable.status)}
            </span>
          }
          showBackButton={true}
          showCloseButton={true}
          headerActions={
            selectedTable.status === "occupied" && selectedSale && (
              <button
                onClick={handlePrintInvoiceClick}
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

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", getStatusColor(selectedTable.status))}>
                  {getStatusText(selectedTable.status)}
                </span>
              </div>

              {/* Zone */}
              {selectedTable.zoneName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Zone:</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{selectedTable.zoneName}</span>
                  </div>
                </div>
              )}

              {/* Capacity */}
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
                  <label htmlFor="guestCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

            {/* Order Details or Payment Form - Only show if occupied */}
            {selectedTable.status === "occupied" && (
              <>
                {loadingSale && (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" text="Loading order..." />
                  </div>
                )}

                {!loadingSale && selectedSale && showPaymentMode && (
                  <div className="space-y-4">
                    {/* Payment Form */}
                    {/* Sale Info */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">Invoice Number:</span>
                          <span className="text-gray-700 dark:text-gray-300">{selectedSale.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">Items:</span>
                          <span className="text-gray-700 dark:text-gray-300">{selectedSale.lineItems?.length || 0} items</span>
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
                          <button
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all",
                              paymentMethod === "cash"
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700"
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                            )}
                            onClick={() => setPaymentMethod("cash")}
                          >
                            <Banknote size={20} />
                            <span className="text-sm font-medium">Cash</span>
                          </button>
                          <button
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all",
                              paymentMethod === "credit-card"
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700"
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                            )}
                            onClick={() => setPaymentMethod("credit-card")}
                          >
                            <CreditCard size={20} />
                            <span className="text-sm font-medium">Credit Card</span>
                          </button>
                          <button
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all",
                              paymentMethod === "debit-card"
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700"
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                            )}
                            onClick={() => setPaymentMethod("debit-card")}
                          >
                            <CreditCard size={20} />
                            <span className="text-sm font-medium">Debit Card</span>
                          </button>
                          <button
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all",
                              paymentMethod === "mobile-payment"
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700"
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                            )}
                            onClick={() => setPaymentMethod("mobile-payment")}
                          >
                            <CreditCard size={20} />
                            <span className="text-sm font-medium">Mobile Pay</span>
                          </button>
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
                                <span className="text-red-600">-${paymentCalculations.discountAmount.toFixed(2)}</span>
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
                          onClick={() => setShowPaymentMode(false)}
                          disabled={processingPayment}
                          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleProcessPayment}
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
                )}

                {!loadingSale && selectedSale && showTransferMode && (
                  <div className="space-y-4">
                    {/* Transfer Form */}
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
                                "relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105",
                                "animate-in fade-in slide-in-from-bottom-2",
                                selectedTargetTable?.id === table.id
                                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                              )}
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="text-left">
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {table.name}
                                </div>
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
                        onClick={() => setShowTransferMode(false)}
                        disabled={processingTransfer}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={executeTransfer}
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
                )}

                {!loadingSale && selectedSale && !showPaymentMode && !showTransferMode && (
                  <div className="space-y-4">
                    {/* Order Details View */}
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
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-semibold",
                          selectedSale.id && paymentStatus[selectedSale.id]
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        )}>
                          {selectedSale.id && paymentStatus[selectedSale.id] ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Items</h3>
                      <div className="space-y-2">
                        {selectedSale.lineItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
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
                            <span className="font-medium text-red-600">-${selectedSale.totalDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                          <span className="font-medium">${selectedSale.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span>Total:</span>
                          <span className="text-emerald-600">${selectedSale.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!loadingSale && !selectedSale && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No order details available</p>
                  </div>
                )}
              </>
            )}

            {/* Actions - Only show when not in payment or transfer mode */}
            {!showPaymentMode && !showTransferMode && (
              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* View/Start Order */}
                <button
                  onClick={handleViewOrder}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Receipt className="w-5 h-5" />
                  {selectedTable.status === "occupied" ? "View Order" : "Start Order"}
                </button>

                {/* Transfer - Only for occupied tables */}
                {selectedTable.status === "occupied" && (
                  <button
                    onClick={() => handleTransferTable()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <ArrowLeftRight className="w-5 h-5" />
                    Transfer Order
                  </button>
                )}

                {/* Complete/Clear - Only for occupied tables */}
                {selectedTable.status === "occupied" && (
                  <>
                    {selectedTable.saleId && paymentStatus[selectedTable.saleId] ? (
                      <button
                        onClick={(e) => {
                          handleCloseSidebar();
                          handleClearTable(selectedTable, e);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <X className="w-5 h-5" />
                        Clear Table
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteOrder(selectedTable)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Complete Payment
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </SidebarDialog>
      )}

      {/* Hidden invoice for printing */}
      {invoiceSchema && invoiceData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <InvoicePreview ref={invoiceRef} schema={invoiceSchema} data={invoiceData} />
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
      {table.status === "occupied" && false && (
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
      {table.status === "available" && false && (
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
