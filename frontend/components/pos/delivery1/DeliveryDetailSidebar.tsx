"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Phone,
  User,
  Clock,
  Package,
  Truck,
  Printer,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { DeliveryOrderDto, DeliveryStatus } from "@/types/api.types";
import { getDeliveryStatusName } from "@/types/enums";
import { SidebarDialog } from "@/components/shared";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { DriverAssignmentDialog } from "./DriverAssignmentDialog";
import {
  DeliveryConfirmationDialog,
  DeliveryConfirmation,
} from "./DeliveryConfirmationDialog";
import deliveryService from "@/services/delivery.service";
import invoiceTemplateService from "@/services/invoice-template.service";
import branchInfoService from "@/services/branch-info.service";
import { InvoiceSchema } from "@/types/invoice-template.types";
import { transformSaleToInvoiceData } from "@/lib/invoice-data-transformer";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@/hooks/useToast";

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string;
  createdAt: string;
  userId: string;
}

interface DeliveryDetailSidebarProps {
  delivery: DeliveryOrderDto | null;
  onClose: () => void;
  onStatusUpdate: () => void;
}

export function DeliveryDetailSidebar({
  delivery,
  onClose,
  onStatusUpdate,
}: DeliveryDetailSidebarProps) {
  const toast = useToast();
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [showFailureForm, setShowFailureForm] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [updating, setUpdating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showDriverSelection, setShowDriverSelection] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Predefined failure reasons
  const quickFailureReasons = [
    { key: "customerNotHome", label: "Customer not home" },
    { key: "wrongAddress", label: "Wrong/Incomplete address" },
    { key: "customerRefused", label: "Customer refused order" },
    { key: "weatherConditions", label: "Bad weather conditions" },
    { key: "vehicleIssue", label: "Vehicle breakdown" },
    { key: "other", label: "Other reason" },
  ];

  // Invoice printing state
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  useEffect(() => {
    if (delivery) {
      fetchStatusHistory();
      fetchDrivers();
    }
  }, [delivery?.id]);

  const fetchStatusHistory = async () => {
    try {
      setLoadingHistory(true);
      // This would need an API endpoint on the backend to get status history
      // For now, we'll use an empty array
      setStatusHistory([]);
    } catch (error) {
      console.error("Failed to fetch status history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const response = await deliveryService.getDrivers({
        isActive: true,
        isAvailable: true,
      });
      setDrivers(response.data);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Set up print handler using react-to-print (must be before early return)
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber || delivery?.orderId || "Delivery"}`,
  });

  if (!delivery) return null;

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.Pending:
        return "bg-yellow-100 text-yellow-800";
      case DeliveryStatus.Assigned:
        return "bg-blue-100 text-blue-800";
      case DeliveryStatus.OutForDelivery:
        return "bg-purple-100 text-purple-800";
      case DeliveryStatus.Delivered:
        return "bg-green-100 text-green-800";
      case DeliveryStatus.Failed:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNextAction = (currentStatus: DeliveryStatus) => {
    const actions: Record<
      DeliveryStatus,
      { status: DeliveryStatus; label: string; action: () => void; requiresDriver?: boolean } | null
    > = {
      [DeliveryStatus.Pending]: {
        status: DeliveryStatus.Assigned,
        label: "Assign Driver",
        action: () => setShowDriverSelection(true),
        requiresDriver: true,
      },
      [DeliveryStatus.Assigned]: {
        status: DeliveryStatus.OutForDelivery,
        label: "Out for Delivery",
        action: () => handleSimpleStatusUpdate(DeliveryStatus.OutForDelivery),
      },
      [DeliveryStatus.OutForDelivery]: {
        status: DeliveryStatus.Delivered,
        label: "Confirm Delivery",
        action: () => setConfirmDialogOpen(true),
      },
      [DeliveryStatus.Delivered]: null,
      [DeliveryStatus.Failed]: null,
    };
    return actions[currentStatus];
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      alert("Please select a driver");
      return;
    }
    try {
      setUpdating(true);
      await deliveryService.assignDriverToDeliveryOrder(delivery.id, selectedDriverId);
      await deliveryService.updateDeliveryStatus(delivery.id, DeliveryStatus.Assigned);
      setShowDriverSelection(false);
      setSelectedDriverId("");
      onStatusUpdate();
      fetchStatusHistory();
    } catch (error) {
      console.error("Failed to assign driver:", error);
      alert("Failed to assign driver");
    } finally {
      setUpdating(false);
    }
  };

  const getPreviousStatus = (currentStatus: DeliveryStatus): DeliveryStatus | null => {
    const previousStatusMap: Record<DeliveryStatus, DeliveryStatus | null> = {
      [DeliveryStatus.Pending]: null,
      [DeliveryStatus.Assigned]: DeliveryStatus.Pending,
      [DeliveryStatus.OutForDelivery]: DeliveryStatus.Assigned,
      [DeliveryStatus.Delivered]: DeliveryStatus.OutForDelivery,
      // Failed can revert to OutForDelivery or Assigned (depending on when it failed)
      [DeliveryStatus.Failed]: DeliveryStatus.OutForDelivery,
    };
    return previousStatusMap[currentStatus];
  };

  const handleSimpleStatusUpdate = async (
    newStatus: DeliveryStatus,
    notes?: string
  ) => {
    try {
      setUpdating(true);
      await deliveryService.updateDeliveryStatus(delivery.id, newStatus);
      onStatusUpdate();
      fetchStatusHistory();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDriverAssignment = async (
    driverId: string,
    driverName: string
  ) => {
    try {
      setUpdating(true);
      await deliveryService.assignDriverToDeliveryOrder(delivery.id, driverId);
      await deliveryService.updateDeliveryStatus(delivery.id, DeliveryStatus.Assigned);
      onStatusUpdate();
      fetchStatusHistory();
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliveryConfirmation = async (
    confirmation: DeliveryConfirmation
  ) => {
    try {
      setUpdating(true);
      await deliveryService.updateDeliveryStatus(delivery.id, DeliveryStatus.Delivered);
      onStatusUpdate();
      fetchStatusHistory();
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickReasonSelect = (quickReason: typeof quickFailureReasons[0]) => {
    if (quickReason.key === selectedQuickReason) {
      setSelectedQuickReason(null);
      setFailureReason("");
    } else {
      setSelectedQuickReason(quickReason.key);
      setFailureReason(quickReason.label);
    }
  };

  const handleMarkFailed = async () => {
    if (!failureReason.trim()) {
      toast.error("Reason required", "Please provide a reason for the failure");
      return;
    }

    try {
      setUpdating(true);
      await handleSimpleStatusUpdate(DeliveryStatus.Failed, `Delivery failed: ${failureReason}`);
      setShowFailureForm(false);
      setFailureReason("");
      setSelectedQuickReason(null);
      toast.success("Order marked as failed", "The delivery order has been marked as failed");
    } catch (error) {
      console.error("Failed to mark as failed:", error);
      toast.error("Failed to update", "Could not mark delivery as failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelFailure = () => {
    setShowFailureForm(false);
    setFailureReason("");
    setSelectedQuickReason(null);
  };

  const handlePrintInvoice = async () => {
    if (!delivery?.sale) {
      toast.error("No sale data", "Cannot print invoice without sale data");
      return;
    }

    try {
      setPrinting(true);
      console.log("Starting invoice preparation...");

      // Load active template
      const template = await invoiceTemplateService.getActiveTemplate();
      console.log("Active template loaded:", template?.name);

      if (!template) {
        console.warn("No active template found");
        toast.warning(
          "No invoice template",
          "No active invoice template found. Please activate a template in Settings.",
          6000
        );
        return;
      }

      // Parse schema
      const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;
      console.log("Schema parsed successfully");

      // Load branch info
      const branchInfo = await branchInfoService.getBranchInfo();
      console.log("Branch info loaded:", branchInfo?.nameEn);

      // Transform sale data to invoice data format using shared utility
      const transformedData = transformSaleToInvoiceData(delivery.sale, branchInfo);

      // Set invoice data and trigger print
      setInvoiceSchema(parsedSchema);
      setInvoiceData(transformedData);

      // Trigger print after a short delay to ensure rendering
      setTimeout(() => {
        console.log("Attempting to print, invoiceRef.current:", invoiceRef.current);
        if (invoiceRef.current && handlePrint) {
          console.log("Triggering print...");
          try {
            handlePrint();
            toast.success("Invoice sent to printer", "Invoice is being printed");
          } catch (printErr) {
            console.error("Error calling handlePrint:", printErr);
            toast.error("Print failed", "Failed to trigger print");
          }
        } else {
          console.error("Cannot print - invoiceRef.current:", invoiceRef.current);
          toast.error("Print failed", "Invoice component not ready");
        }
      }, 500);
    } catch (error) {
      console.error("Failed to print invoice:", error);
      toast.error("Print failed", "Failed to prepare invoice for printing");
    } finally {
      setPrinting(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Parse special instructions to extract customer info if needed
  const parseSpecialInstructions = (instructions?: string) => {
    if (!instructions) return { name: "", phone: "" };

    // Try to parse format: "Customer: name | Phone: phone"
    const customerMatch = instructions.match(/Customer:\s*([^|]+)/i);
    const phoneMatch = instructions.match(/Phone:\s*(.+)/i);

    return {
      name: customerMatch ? customerMatch[1].trim() : "",
      phone: phoneMatch ? phoneMatch[1].trim() : ""
    };
  };

  const parsedInstructions = parseSpecialInstructions(delivery.specialInstructions);

  // Get customer info - prioritize DTO level properties, then parse special instructions
  const customerName =
    delivery.customerName ||
    delivery.sale?.customerName ||
    delivery.customer?.nameEn ||
    parsedInstructions.name ||
    "";

  const customerPhone =
    delivery.customer?.phone ||
    parsedInstructions.phone ||
    "";

  const deliveryAddress = delivery.deliveryAddress || "";

  // Filter out customer info from special instructions display
  const cleanSpecialInstructions = delivery.specialInstructions &&
    (parsedInstructions.name || parsedInstructions.phone)
    ? null // Don't show special instructions if it only contains customer info
    : delivery.specialInstructions;

  // Only show customer section if we have customer data
  const hasCustomerInfo = customerName || customerPhone;

  // Calculate next action and previous status dynamically
  const nextAction = getNextAction(delivery.deliveryStatus);
  const previousStatus = getPreviousStatus(delivery.deliveryStatus);

  return (
    <>
      <SidebarDialog
        isOpen={true}
        onClose={showFailureForm ? handleCancelFailure : onClose}
        title={
          showFailureForm
            ? "Mark Delivery as Failed"
            : `Order #${delivery.orderId?.substring(0, 8) || delivery.id.substring(0, 8)}`
        }
        titleBadge={
          !showFailureForm && (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                delivery.deliveryStatus
              )}`}
            >
              {getDeliveryStatusName(delivery.deliveryStatus)}
            </span>
          )
        }
        width="lg"
        showBackButton={showFailureForm}
        headerActions={
          !showFailureForm && (
            <button
              className="px-3 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
              onClick={handlePrintInvoice}
              disabled={printing}
              title="Print Invoice"
            >
              <Printer className="h-4 w-4" />
            </button>
          )
        }
        footer={
          showFailureForm ? (
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                onClick={handleCancelFailure}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                onClick={handleMarkFailed}
                disabled={!failureReason.trim() || updating}
              >
                {updating ? "Marking as Failed..." : "Confirm Failed"}
              </button>
            </div>
          ) : delivery.deliveryStatus === DeliveryStatus.Failed ? (
            // Failed orders can be reverted
            <div className="flex gap-2 flex-wrap">
              <button
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 min-w-[150px]"
                onClick={() => handleSimpleStatusUpdate(DeliveryStatus.OutForDelivery)}
                disabled={updating}
                title="Retry delivery by reverting to Out for Delivery"
              >
                {updating ? "Reverting..." : "Retry Delivery"}
              </button>
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                onClick={() => handleSimpleStatusUpdate(DeliveryStatus.Pending)}
                disabled={updating}
                title="Revert to Pending to reassign"
              >
                Revert to Pending
              </button>
            </div>
          ) : delivery.deliveryStatus === DeliveryStatus.Delivered ? (
            // Delivered orders are final - no actions available
            <div className="text-center py-2 text-gray-500">
              Order is in final status: {getDeliveryStatusName(delivery.deliveryStatus)}
            </div>
          ) : (
            // Active orders (Pending, Assigned, OutForDelivery)
            <div className="flex gap-2 flex-wrap">
              {showDriverSelection ? (
                <>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
                    disabled={updating || loadingDrivers}
                  >
                    <option value="">
                      {loadingDrivers ? "Loading drivers..." : "Select Driver"}
                    </option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.nameEn}
                      </option>
                    ))}
                  </select>
                  <button
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    onClick={handleAssignDriver}
                    disabled={updating || !selectedDriverId}
                  >
                    {updating ? "Assigning..." : "Confirm"}
                  </button>
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    onClick={() => {
                      setShowDriverSelection(false);
                      setSelectedDriverId("");
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                </>
              ) : nextAction ? (
                <button
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 min-w-[150px]"
                  onClick={nextAction.action}
                  disabled={updating}
                >
                  {updating ? "Updating..." : nextAction.label}
                </button>
              ) : (
                <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-center">
                  No next action available
                </div>
              )}
              {!showDriverSelection && previousStatus !== null && (
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={() => handleSimpleStatusUpdate(previousStatus)}
                  disabled={updating}
                  title={`Revert to ${getDeliveryStatusName(previousStatus)}`}
                >
                  Revert to {getDeliveryStatusName(previousStatus)}
                </button>
              )}
              {!showDriverSelection && (
                <button
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  onClick={() => setShowFailureForm(true)}
                  disabled={updating}
                >
                  Mark Failed
                </button>
              )}
            </div>
          )
        }
      >
        {showFailureForm ? (
          /* Failure Form Content */
          <div className="space-y-4">
            {/* Order Info */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-mono font-semibold">
                #{delivery.orderId?.substring(0, 8) || delivery.id.substring(0, 8)}
              </p>
            </div>

            {/* Warning Message */}
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Important</p>
                <p className="text-xs text-yellow-800 mt-1">
                  This action cannot be undone. The order status will be permanently marked as failed.
                </p>
              </div>
            </div>

            {/* Quick Reasons */}
            <div>
              <label className="text-sm font-semibold block mb-2">Select a reason</label>
              <div className="grid grid-cols-2 gap-2">
                {quickFailureReasons.map((quickReason) => (
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
                value={failureReason}
                onChange={(e) => {
                  setFailureReason(e.target.value);
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
        ) : (
          /* Normal Order Details Content */
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
            <h3 className="font-semibold mb-3 text-lg">Customer Information</h3>
            <div className="space-y-2 rounded-lg border p-4 bg-gray-50">
              {hasCustomerInfo ? (
                <>
                  {customerName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{customerName}</span>
                    </div>
                  )}
                  {customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a
                        href={`tel:${customerPhone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {customerPhone}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="h-4 w-4" />
                  <span>Walk-in Customer</span>
                </div>
              )}
              {deliveryAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span>{deliveryAddress}</span>
                </div>
              )}
              {cleanSpecialInstructions && (
                <div className="mt-3 rounded bg-yellow-50 border border-yellow-200 p-3">
                  <p className="text-xs font-semibold text-yellow-900 mb-1">
                    Special Instructions
                  </p>
                  <p className="text-sm text-yellow-800">
                    {cleanSpecialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Driver Info (only show if status is Assigned or later and driver is assigned) */}
          {delivery.driverName && delivery.deliveryStatus !== DeliveryStatus.Pending && (
            <div>
              <h3 className="font-semibold mb-3 text-lg">Driver Information</h3>
              <div className="flex items-center gap-2 text-sm bg-purple-50 rounded-lg p-4 border border-purple-100">
                <Truck className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">
                  {delivery.driverName}
                </span>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Order Items</h3>
            <div className="space-y-2 rounded-lg border p-4">
              {delivery.sale?.lineItems && delivery.sale.lineItems.length > 0 ? (
                <>
                  {delivery.sale.lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{item.productName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600">{item.quantity}x</span>
                        <span className="ml-2 font-semibold">
                          {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">
                      {formatCurrency(delivery.sale.total)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">No items found</p>
              )}
            </div>
          </div>

          {/* Delivery Times */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Delivery Schedule</h3>
            <div className="space-y-2 rounded-lg border p-4 bg-gray-50">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatTime(delivery.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Estimated:</span>
                <span className="font-medium">{formatTime(delivery.estimatedDeliveryTime)}</span>
              </div>
              {delivery.actualDeliveryTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">Delivered:</span>
                  <span className="font-medium text-green-700">
                    {formatTime(delivery.actualDeliveryTime)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Order Progress</h3>
            {loadingHistory ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : (
              <OrderStatusTimeline
                statusHistory={statusHistory}
                currentStatus={delivery.deliveryStatus}
              />
            )}
          </div>
        </div>
        )}
      </SidebarDialog>

      {/* Driver Assignment Dialog */}
      <DriverAssignmentDialog
        open={driverDialogOpen}
        onOpenChange={setDriverDialogOpen}
        orderId={delivery.id}
        orderNumber={delivery.orderId || delivery.id}
        onAssign={handleDriverAssignment}
      />

      {/* Delivery Confirmation Dialog */}
      <DeliveryConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        orderId={delivery.id}
        orderNumber={delivery.orderId || delivery.id}
        orderTotal={delivery.sale?.total || 0}
        onConfirm={handleDeliveryConfirmation}
      />

      {/* Hidden invoice for printing */}
      {invoiceSchema && invoiceData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <InvoicePreview ref={invoiceRef} schema={invoiceSchema} data={invoiceData} />
        </div>
      )}
    </>
  );
}
