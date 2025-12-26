"use client";

import React, { useState, useRef } from "react";
import { usePendingOrders } from "@/hooks/usePendingOrders";
import { PendingOrderDto, PendingOrderStatus } from "@/types/api.types";
import pendingOrdersService from "@/services/pending-orders.service";
import { useToast } from "@/hooks/useToast";
import { useConfirmation } from "@/hooks/useConfirmation";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import invoiceTemplateService from "@/services/invoice-template.service";
import branchInfoService from "@/services/branch-info.service";
import { InvoiceSchema } from "@/types/invoice-template.types";
import { useReactToPrint } from "react-to-print";

interface PendingOrdersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRetrieve: (order: PendingOrderDto, mode: "replace" | "merge") => Promise<void>;
  hasItemsInCart: boolean;
  onCountUpdate?: () => void;
}

export function PendingOrdersPanel({
  isOpen,
  onClose,
  onRetrieve,
  hasItemsInCart,
  onCountUpdate,
}: PendingOrdersPanelProps) {
  const toast = useToast();
  const confirmation = useConfirmation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PendingOrderStatus | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrderDto | null>(null);
  const [showRetrieveDialog, setShowRetrieveDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retrievingId, setRetrievingId] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [clearAllStatus, setClearAllStatus] = useState<PendingOrderStatus | "all">("all");
  const [isClearing, setIsClearing] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Invoice printing state
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Fetch pending orders with filters
  const { pendingOrders, isLoading, error, mutate } = usePendingOrders({
    status: statusFilter,
    search: searchQuery || undefined,
    pageSize: 50,
  });

  // Set up print handler using react-to-print (must be before early return)
  const handlePrintExec = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Pending-Order-${invoiceData?.invoiceNumber || "POS"}`,
    onAfterPrint: () => {
      setPrintingId(null);
      // Clear invoice data after printing
      setInvoiceSchema(null);
      setInvoiceData(null);
    },
  });

  if (!isOpen) return null;

  const handleDelete = async (order: PendingOrderDto) => {
    confirmation.ask(
      "Delete Pending Order",
      `Are you sure you want to delete order ${order.orderNumber}?${
        order.customerName ? `\n\nCustomer: ${order.customerName}` : ""
      }\nTotal: $${order.totalAmount.toFixed(2)}`,
      async () => {
        setDeletingId(order.id);
        try {
          await pendingOrdersService.deletePendingOrder(order.id);
          toast.success("Order deleted", "Pending order deleted successfully");
          mutate(); // Refresh the list
          onCountUpdate?.(); // Refresh badge count
        } catch (error: any) {
          toast.error("Delete failed", error.message || "Could not delete the order");
          throw error; // Re-throw to keep dialog open on error
        } finally {
          setDeletingId(null);
        }
      },
      "danger"
    );
  };

  const handleRetrieveClick = async (order: PendingOrderDto) => {
    setSelectedOrder(order);

    // If cart is empty, directly retrieve without showing dialog
    if (!hasItemsInCart) {
      setRetrievingId(order.id);
      try {
        await onRetrieve(order, "replace");
        setSelectedOrder(null);
        onClose();
      } catch (error) {
        console.error("Failed to retrieve order:", error);
      } finally {
        setRetrievingId(null);
      }
    } else {
      // Cart has items, show dialog to choose replace or merge
      setShowRetrieveDialog(true);
    }
  };

  const handleConfirmRetrieve = async (mode: "replace" | "merge") => {
    if (selectedOrder) {
      try {
        await onRetrieve(selectedOrder, mode);
        setShowRetrieveDialog(false);
        setSelectedOrder(null);
        onClose();
      } catch (error) {
        // Error already handled by onRetrieve, just keep dialog open
        console.error("Failed to retrieve order:", error);
      }
    }
  };

  const handleClearAll = () => {
    setShowClearAllDialog(true);
  };

  const handleConfirmClearAll = async () => {
    if (!pendingOrders || pendingOrders.length === 0) return;

    setIsClearing(true);
    try {
      // Filter orders based on selected status
      const ordersToClear = clearAllStatus === "all"
        ? pendingOrders
        : pendingOrders.filter(order => order.status === clearAllStatus);

      if (ordersToClear.length === 0) {
        toast.error("No orders to clear", `No ${getStatusLabel(clearAllStatus as PendingOrderStatus).toLowerCase()} orders found`);
        setShowClearAllDialog(false);
        setIsClearing(false);
        return;
      }

      // Delete all filtered orders
      const deletePromises = ordersToClear.map(order =>
        pendingOrdersService.deletePendingOrder(order.id)
      );

      await Promise.all(deletePromises);

      toast.success(
        "Orders cleared",
        `Successfully deleted ${ordersToClear.length} ${clearAllStatus === "all" ? "" : getStatusLabel(clearAllStatus as PendingOrderStatus).toLowerCase()} order${ordersToClear.length !== 1 ? "s" : ""}`
      );

      mutate(); // Refresh the list
      onCountUpdate?.(); // Refresh badge count
      setShowClearAllDialog(false);
    } catch (error: any) {
      toast.error("Clear failed", error.message || "Could not clear orders");
    } finally {
      setIsClearing(false);
    }
  };

  const handlePrint = async (order: PendingOrderDto) => {
    setPrintingId(order.id);

    try {
      // Load active template
      const template = await invoiceTemplateService.getActiveTemplate();
      if (!template) {
        toast.warning("No invoice template", "Please activate a template in Settings.");
        setPrintingId(null);
        return;
      }

      // Parse schema
      const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;

      // Load branch info
      const branchInfo = await branchInfoService.getBranchInfo();

      // Transform pending order to invoice data format
      const orderTypeLabel =
        order.orderType === 1 ? "Dine In" :
        order.orderType === 2 ? "Take Away" :
        order.orderType === 3 ? "Delivery" :
        "Unknown";

      const invoiceDataFormatted = {
        // Branch Info
        branchName: branchInfo?.nameEn || "",
        branchNameAr: branchInfo?.nameAr || "",
        logoUrl: branchInfo?.logoPath || undefined,
        vatNumber: branchInfo?.taxNumber || "",
        commercialRegNumber: branchInfo?.crn || "",
        address: branchInfo?.addressEn || "",
        phone: branchInfo?.phone || "",
        email: branchInfo?.email || "",

        // Pending Order Info (instead of Invoice)
        invoiceNumber: order.orderNumber,
        invoiceDate: new Date(order.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        cashierName: order.createdByUsername,

        // Customer Info
        customerName: order.customerName || "Walk-in Customer",
        customerVatNumber: undefined,
        customerPhone: undefined,

        // Additional Pending Order Fields
        pendingOrderStatus: getStatusLabel(order.status),
        orderType: orderTypeLabel,
        tableNumber: order.tableNumber,
        guestCount: order.guestCount,
        isPendingOrder: true,
        notes: order.notes,

        // Invoice Type
        isSimplified: true,

        // Line Items
        items: order.items.map((item) => ({
          name: item.productName,
          barcode: item.productSku || undefined,
          unit: undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice,
          notes: item.notes || undefined,
        })),

        // Totals
        subtotal: order.subtotal,
        discount: 0,
        vatAmount: order.taxAmount,
        total: order.totalAmount,

        // ZATCA QR Code
        zatcaQrCode: branchInfo?.taxNumber
          ? `Seller: ${branchInfo.nameEn}\nVAT: ${branchInfo.taxNumber}\nPending Order: ${order.orderNumber}\nTotal: $${order.totalAmount.toFixed(2)}\nVAT: $${order.taxAmount.toFixed(2)}`
          : undefined,
      };

      // Set invoice data and trigger print
      setInvoiceSchema(parsedSchema);
      setInvoiceData(invoiceDataFormatted);

      // Trigger print after a short delay
      setTimeout(() => {
        if (invoiceRef.current) {
          handlePrintExec();
          toast.success("Printing pending order", `Order ${order.orderNumber} sent to printer`);
        }
      }, 300);
    } catch (error: any) {
      console.error("Failed to print pending order:", error);
      toast.error("Print failed", error.message || "Could not print the pending order");
      setPrintingId(null);
    }
  };

  const getStatusColor = (status: PendingOrderStatus) => {
    switch (status) {
      case PendingOrderStatus.Parked:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case PendingOrderStatus.OnHold:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case PendingOrderStatus.Draft:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case PendingOrderStatus.Retrieved:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: PendingOrderStatus) => {
    switch (status) {
      case PendingOrderStatus.Parked:
        return "Parked";
      case PendingOrderStatus.OnHold:
        return "On Hold";
      case PendingOrderStatus.Draft:
        return "Draft";
      case PendingOrderStatus.Retrieved:
        return "Retrieved";
      default:
        return "Unknown";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <>
      {/* Hidden invoice for printing */}
      {invoiceSchema && invoiceData && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width:
              invoiceSchema.paperSize === "Thermal80mm"
                ? "80mm"
                : invoiceSchema.paperSize === "Thermal58mm"
                ? "58mm"
                : invoiceSchema.paperSize === "A4"
                ? "210mm"
                : "80mm",
            maxWidth:
              invoiceSchema.paperSize === "Thermal80mm"
                ? "80mm"
                : invoiceSchema.paperSize === "Thermal58mm"
                ? "58mm"
                : invoiceSchema.paperSize === "A4"
                ? "210mm"
                : "80mm",
            overflow: "hidden",
          }}
        >
          <InvoicePreview ref={invoiceRef} schema={invoiceSchema} data={invoiceData} />
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.3s ease" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md sm:max-w-lg bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ animation: "slideInRight 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Pending Orders
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {pendingOrders && pendingOrders.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear All
              </button>
            )}
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

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter(undefined)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === undefined
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter(PendingOrderStatus.Parked)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === PendingOrderStatus.Parked
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Parked
            </button>
            <button
              onClick={() => setStatusFilter(PendingOrderStatus.OnHold)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === PendingOrderStatus.OnHold
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              On Hold
            </button>
            <button
              onClick={() => setStatusFilter(PendingOrderStatus.Retrieved)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === PendingOrderStatus.Retrieved
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Retrieved
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-red-300 dark:text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-red-600 dark:text-red-400 font-medium">
                Failed to load pending orders
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                {error.message || "Please try again"}
              </p>
              <button
                onClick={() => mutate()}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading orders...</p>
            </div>
          ) : !pendingOrders || !Array.isArray(pendingOrders) || pendingOrders.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
                No pending orders
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Orders you save will appear here
              </p>
            </div>
          ) : (
            Array.isArray(pendingOrders) && pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-md"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    {order.customerName && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {order.customerName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                  {order.tableNumber && (
                    <p>
                      Table {order.tableNumber} • {order.guestCount || 1} guest(s)
                    </p>
                  )}
                  <p>
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} •{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-xs">
                    Created {formatTimeAgo(order.createdAt)} by {order.createdByUsername}
                  </p>
                  {order.notes && (
                    <p className="text-xs italic mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                      Note: {order.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRetrieveClick(order)}
                    disabled={retrievingId === order.id}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {retrievingId === order.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Retrieve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handlePrint(order)}
                    disabled={printingId === order.id}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                    title="Print order"
                  >
                    {printingId === order.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(order)}
                    disabled={deletingId === order.id || confirmation.isProcessing}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors"
                    title="Delete order"
                  >
                    {deletingId === order.id || confirmation.isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {pendingOrders && Array.isArray(pendingOrders) && pendingOrders.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {pendingOrders.length} pending order{pendingOrders.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Retrieve Dialog */}
      {showRetrieveDialog && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowRetrieveDialog(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Retrieve Pending Order
            </h3>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {selectedOrder.orderNumber}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedOrder.items.length} items • ${selectedOrder.totalAmount.toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              How would you like to retrieve this order?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmRetrieve("replace")}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-colors"
              >
                Replace Current
              </button>
              <button
                onClick={() => handleConfirmRetrieve("merge")}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg font-medium transition-colors"
              >
                Merge with Current
              </button>
            </div>
            <button
              onClick={() => setShowRetrieveDialog(false)}
              className="w-full mt-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {showClearAllDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !isClearing && setShowClearAllDialog(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Clear Pending Orders
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select which orders you want to delete:
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="clearStatus"
                  value="all"
                  checked={clearAllStatus === "all"}
                  onChange={(e) => setClearAllStatus(e.target.value as "all")}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                  All Orders
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pendingOrders?.length || 0} orders
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="clearStatus"
                  value={PendingOrderStatus.Parked}
                  checked={clearAllStatus === PendingOrderStatus.Parked}
                  onChange={(e) => setClearAllStatus(Number(e.target.value) as PendingOrderStatus)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                  Parked Orders
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pendingOrders?.filter(o => o.status === PendingOrderStatus.Parked).length || 0} orders
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="clearStatus"
                  value={PendingOrderStatus.OnHold}
                  checked={clearAllStatus === PendingOrderStatus.OnHold}
                  onChange={(e) => setClearAllStatus(Number(e.target.value) as PendingOrderStatus)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                  On Hold Orders
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pendingOrders?.filter(o => o.status === PendingOrderStatus.OnHold).length || 0} orders
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="clearStatus"
                  value={PendingOrderStatus.Retrieved}
                  checked={clearAllStatus === PendingOrderStatus.Retrieved}
                  onChange={(e) => setClearAllStatus(Number(e.target.value) as PendingOrderStatus)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                  Retrieved Orders
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pendingOrders?.filter(o => o.status === PendingOrderStatus.Retrieved).length || 0} orders
                </span>
              </label>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-6">
              <p className="text-sm text-red-800 dark:text-red-300">
                ⚠️ Warning: This action cannot be undone. Selected orders will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearAllDialog(false)}
                disabled={isClearing}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                disabled={isClearing}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Clearing...
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Clear Orders
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
        onConfirm={confirmation.confirm}
        onClose={confirmation.cancel}
        isProcessing={confirmation.isProcessing}
      />
    </>
  );
}
