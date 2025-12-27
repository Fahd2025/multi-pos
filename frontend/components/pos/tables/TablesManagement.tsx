"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTablesWithStatus } from "@/hooks/useTables";
import { useZones } from "@/hooks/useZones";
import { useToast } from "@/hooks/useToast";
import { TableWithStatusDto, SaleDto } from "@/types/api.types";
import { InvoiceSchema } from "@/types/invoice-template.types";
import tableService from "@/services/table.service";
import salesService from "@/services/sales.service";
import branchInfoService from "@/services/branch-info.service";
import invoiceTemplateService from "@/services/invoice-template.service";
import { transformSaleToInvoiceData } from "@/lib/invoice-data-transformer";
import { useReactToPrint } from "react-to-print";

// Components
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Select } from "@/components/shared/Select";
import { Button } from "@/components/shared/Button";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { TableCard } from "./TableCard";
import { ClearAllDialog } from "./ClearAllDialog";
import { TableSidebar } from "./TableSidebar";

// Icons
import { MapPin, UtensilsCrossed, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";
type TableStatus = "all" | "available" | "occupied" | "reserved";

/**
 * POS Tables Management - For cashiers to view and select tables during order taking
 * This is a simplified, read-only view focused on table selection and status
 */
export function TablesManagement() {
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
  useEffect(() => {
    if (!tables || tables.length === 0) return;

    const checkPaymentStatus = async () => {
      const statusMap: Record<string, boolean> = {};

      for (const table of tables) {
        if (table.status === "occupied" && table.saleId) {
          try {
            const sale = await salesService.getSaleById(table.saleId);
            const isPaid = sale.total > 0 && sale.amountPaid !== undefined && sale.amountPaid !== null && sale.amountPaid >= sale.total;
            statusMap[table.saleId] = isPaid;
          } catch (error) {
            console.error(`Failed to check payment status for sale ${table.saleId}:`, error);
            statusMap[table.saleId] = false;
          }
        }
      }

      setPaymentStatus(statusMap);
    };

    checkPaymentStatus();
  }, [tables]);

  // Check if we just completed a payment and need to auto-clear
  useEffect(() => {
    const autoCleanTable = searchParams.get("autoCleanTable");
    if (autoCleanTable) {
      const tableNumber = parseInt(autoCleanTable);
      if (!isNaN(tableNumber)) {
        handleClearTableDirect(tableNumber);
        router.replace("/pos/tables");
      }
    }
  }, [searchParams, router]);

  const handleTableSelect = async (table: TableWithStatusDto) => {
    setSelectedTable(table);

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

  const handleCloseSidebar = () => {
    setSelectedTable(null);
    setSelectedSale(null);
    setGuestCount(1);
    setShowPaymentMode(false);
    setPaymentMethod("cash");
    setDiscountValue(0);
    setAmountPaid(0);
    setShowTransferMode(false);
    setSelectedTargetTable(null);
  };

  const handleViewOrder = () => {
    if (selectedTable) {
      if (selectedTable.status === "occupied" && selectedTable.saleId) {
        router.push(`/pos?saleId=${selectedTable.saleId}`);
      } else {
        router.push(`/pos?tableNumber=${selectedTable.number}&guestCount=${guestCount}`);
      }
    }
  };

  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${selectedSale?.invoiceNumber || "Table"}`,
  });

  const handlePrintInvoiceClick = async () => {
    if (!selectedSale) {
      toast.error("No order", "No order data available to print");
      return;
    }

    try {
      const template = await invoiceTemplateService.getActiveTemplate();
      if (!template) {
        toast.error("No active template", "Please activate an invoice template in Settings");
        return;
      }

      const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;
      const branchInfo = await branchInfoService.getBranchInfo();
      const transformedData = transformSaleToInvoiceData(selectedSale, branchInfo);

      setInvoiceSchema(parsedSchema);
      setInvoiceData(transformedData);

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

  const handleClearTableDirect = async (tableNumber: number) => {
    try {
      await tableService.clearTable(tableNumber);
      toast.success("Table cleared", `Table #${tableNumber} is now available`);
      mutate();
    } catch (error: any) {
      toast.error("Failed to clear table", error.message || "Could not clear the table");
    }
  };

  const paymentCalculations = useMemo(() => {
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

  useEffect(() => {
    if (paymentMethod !== "cash" && showPaymentMode) {
      setAmountPaid(paymentCalculations.total);
    }
  }, [paymentMethod, paymentCalculations.total, showPaymentMode]);

  const handleCashAmount = (amount: number) => {
    setAmountPaid(amount);
  };

  const handleProcessPayment = async () => {
    if (!selectedTable || !selectedSale) return;

    if (paymentMethod === "cash" && amountPaid < paymentCalculations.total) {
      toast.error("Insufficient payment", `Amount paid ($${amountPaid.toFixed(2)}) is less than total ($${paymentCalculations.total.toFixed(2)})`);
      return;
    }

    setProcessingPayment(true);

    try {
      const paymentMethodMap: Record<PaymentMethod, number> = {
        cash: 0,
        "credit-card": 1,
        "debit-card": 2,
        "mobile-payment": 3,
      };

      const updateData = {
        paymentMethod: paymentMethodMap[paymentMethod],
        amountPaid: paymentMethod === "cash" ? amountPaid : paymentCalculations.total,
        changeReturned: paymentMethod === "cash" ? Math.max(0, amountPaid - paymentCalculations.total) : 0,
        discountType: discountValue > 0 ? (discountType === "percentage" ? 1 : 2) : 0,
        discountValue: discountValue,
      };

      await salesService.updateSalePayment(selectedSale.id, updateData);

      toast.success(
        "Payment completed!",
        `Invoice #${selectedSale.invoiceNumber || 'N/A'} | Total: $${paymentCalculations.total.toFixed(2)}${paymentMethod === "cash" ? ` | Change: $${paymentCalculations.change.toFixed(2)}` : ""}`,
        7000
      );

      // Immediately update payment status for instant UI feedback
      setPaymentStatus(prev => ({
        ...prev,
        [selectedSale.id]: true
      }));

      await mutate();

      setShowPaymentMode(false);
      setPaymentMethod("cash");
      setAmountPaid(0);
      setDiscountType("percentage");
      setDiscountValue(0);

      handleCloseSidebar();
    } catch (err: any) {
      console.error("Error processing payment:", err);
      toast.error("Payment failed", err.message || "Failed to process payment", 8000);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleClearTable = (table: TableWithStatusDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setClearDialog({ isOpen: true, table });
  };

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

  const handleCompleteOrder = (table: TableWithStatusDto) => {
    if (!table.saleId) {
      toast.error("No active order", "This table has no order to complete");
      return;
    }

    setShowPaymentMode(true);

    if (selectedSale) {
      setAmountPaid(paymentCalculations.total);
    }
  };

  const filteredTables = useMemo(() => {
    if (!tables) return [];
    if (statusFilter === "all") return tables;
    return tables.filter(t => t.status === statusFilter);
  }, [tables, statusFilter]);

  const occupiedTables = tables?.filter(t => t.status === "occupied") || [];
  const unpaidTables = occupiedTables.filter(t => t.saleId && !paymentStatus[t.saleId]);
  const hasUnpaidOrders = unpaidTables.length > 0;

  const statusCounts = useMemo(() => {
    if (!tables) return { all: 0, available: 0, occupied: 0, reserved: 0 };
    return {
      all: tables.length,
      available: tables.filter(t => t.status === "available").length,
      occupied: tables.filter(t => t.status === "occupied").length,
      reserved: tables.filter(t => t.status === "reserved").length,
    };
  }, [tables]);

  const availableTablesForTransfer = useMemo(() => {
    if (!tables || !selectedTable) return [];
    return tables.filter(t => t.status === "available" && t.id !== selectedTable.id);
  }, [tables, selectedTable]);

  const handleClearAll = async () => {
    if (!tables || tables.length === 0) {
      toast.warning("No tables to clear", "There are no tables to clear");
      return;
    }

    setProcessingDialog(true);
    try {
      if (hasUnpaidOrders) {
        const paymentMethodMap: Record<PaymentMethod, number> = {
          cash: 0,
          "credit-card": 1,
          "debit-card": 2,
          "mobile-payment": 3,
        };

        const updatedPayments: Record<string, boolean> = {};
        for (const table of unpaidTables) {
          if (table.saleId) {
            try {
              const sale = await salesService.getSaleById(table.saleId);
              await salesService.updateSalePayment(table.saleId, {
                paymentMethod: paymentMethodMap[clearAllPaymentMethod],
                amountPaid: sale.total,
                changeReturned: 0,
              });
              updatedPayments[table.saleId] = true;
            } catch (error) {
              console.error(`Failed to process payment for table ${table.number}:`, error);
              toast.error("Payment failed", `Failed to process payment for Table #${table.number}`);
            }
          }
        }

        // Immediately update payment status for all successfully paid tables
        setPaymentStatus(prev => ({
          ...prev,
          ...updatedPayments
        }));
      }

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

      mutate();
      setClearAllDialog(false);
    } catch (error: any) {
      toast.error("Clear all failed", error.message || "Could not clear all tables");
    } finally {
      setProcessingDialog(false);
    }
  };

  const handleTransferTable = () => {
    if (!selectedTable || !selectedTable.saleId) {
      toast.error("No active order", "This table has no order to transfer");
      return;
    }

    setShowTransferMode(true);
    setSelectedTargetTable(null);
  };

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
            aria-label="Back to POS"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <UtensilsCrossed size={28} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Tables Management</h1>
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

          {/* Clear All Button */}
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
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "available", "occupied", "reserved"] as const).map((status) => (
            <button
              key={status}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading tables..." />
          </div>
        )}

        {!isLoading && filteredTables && filteredTables.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleTableSelect(table)}
                onClear={(e) => handleClearTable(table, e)}
                isPaid={table.saleId ? paymentStatus[table.saleId] || false : false}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            ))}
          </div>
        )}

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
      </div>

      {/* Dialogs */}
      <ConfirmationDialog
        isOpen={clearDialog.isOpen}
        onClose={() => setClearDialog({ isOpen: false })}
        title="Clear Table"
        message={`Are you sure you want to clear Table #${clearDialog.table?.number}? This will mark it as available.`}
        confirmLabel="Clear Table"
        variant="danger"
        onConfirm={executeClear}
        isProcessing={processingDialog}
      />

      <ClearAllDialog
        isOpen={clearAllDialog}
        onClose={() => setClearAllDialog(false)}
        occupiedTables={occupiedTables}
        unpaidTables={unpaidTables}
        hasUnpaidOrders={hasUnpaidOrders}
        paymentMethod={clearAllPaymentMethod}
        setPaymentMethod={setClearAllPaymentMethod}
        onConfirm={handleClearAll}
        isProcessing={processingDialog}
      />

      {loadingSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <LoadingSpinner size="lg" text="Loading order details..." />
          </div>
        </div>
      )}

      {/* Table Detail Sidebar */}
      {selectedTable && (
        <TableSidebar
          selectedTable={selectedTable}
          selectedSale={selectedSale}
          loadingSale={loadingSale}
          guestCount={guestCount}
          setGuestCount={setGuestCount}
          showPaymentMode={showPaymentMode}
          setShowPaymentMode={setShowPaymentMode}
          showTransferMode={showTransferMode}
          setShowTransferMode={setShowTransferMode}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          amountPaid={amountPaid}
          paymentCalculations={paymentCalculations}
          paymentStatus={paymentStatus}
          selectedTargetTable={selectedTargetTable}
          setSelectedTargetTable={setSelectedTargetTable}
          availableTablesForTransfer={availableTablesForTransfer}
          processingPayment={processingPayment}
          processingTransfer={processingTransfer}
          onClose={handleCloseSidebar}
          onViewOrder={handleViewOrder}
          onPrintInvoice={handlePrintInvoiceClick}
          onProcessPayment={handleProcessPayment}
          onTransfer={executeTransfer}
          onCompleteOrder={() => handleCompleteOrder(selectedTable)}
          onClearTable={(e) => {
            handleCloseSidebar();
            handleClearTable(selectedTable, e);
          }}
          handleCashAmount={handleCashAmount}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
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
