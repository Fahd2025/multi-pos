"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Phone,
  User,
  Clock,
  DollarSign,
  Package,
  Truck,
  Printer,
} from "lucide-react";
import { DeliveryOrderDto, DeliveryStatus } from "@/types/api.types";
import { getDeliveryStatusName } from "@/types/enums";
import deliveryService from "@/services/delivery.service";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { DriverAssignmentDialog } from "./DriverAssignmentDialog";
import {
  DeliveryConfirmationDialog,
  DeliveryConfirmation,
} from "./DeliveryConfirmationDialog";
import { FailureReasonDialog } from "./FailureReasonDialog";

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string;
  createdAt: string;
  userId: string;
}

interface DeliveryCardProps {
  delivery: DeliveryOrderDto;
  onStatusUpdate: () => void;
}

export function DeliveryCard({ delivery, onStatusUpdate }: DeliveryCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [failureDialogOpen, setFailureDialogOpen] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [updating, setUpdating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (detailsOpen) {
      fetchStatusHistory();
    }
  }, [detailsOpen, delivery.id]);

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
      { status: DeliveryStatus; label: string; action: () => void } | null
    > = {
      [DeliveryStatus.Pending]: {
        status: DeliveryStatus.Assigned,
        label: "Assign Driver",
        action: () => setDriverDialogOpen(true),
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

  const handleMarkFailed = async (reason: string) => {
    await handleSimpleStatusUpdate(DeliveryStatus.Failed, `Delivery failed: ${reason}`);
  };

  const handlePrintInvoice = async () => {
    try {
      setPrinting(true);
      // This would need an invoice generation endpoint
      // For now, we'll show a placeholder message
      alert("Invoice printing feature to be implemented");
    } catch (error) {
      console.error("Failed to print invoice:", error);
      alert("Failed to print invoice");
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

  // Get customer info from the sale
  const customerName = delivery.sale?.customerName || delivery.customer?.nameEn || "Unknown";
  const customerPhone = delivery.customer?.phone || "";
  const deliveryAddress = delivery.deliveryAddress || "";

  // Calculate next action dynamically
  const nextAction = getNextAction(delivery.deliveryStatus);

  // Debug log
  console.log("Delivery Status:", delivery.deliveryStatus);
  console.log("Next Action:", nextAction);
  console.log("Is Final Status:",
    delivery.deliveryStatus === DeliveryStatus.Delivered ||
    delivery.deliveryStatus === DeliveryStatus.Failed
  );

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setDetailsOpen(true)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono font-bold text-lg">
                #{delivery.orderId?.substring(0, 8) || delivery.id.substring(0, 8)}
              </p>
              <p className="text-sm text-gray-500">
                {formatTime(delivery.createdAt)}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                delivery.deliveryStatus
              )}`}
            >
              {getDeliveryStatusName(delivery.deliveryStatus)}
            </span>
          </div>

          {/* Driver Info (if assigned) */}
          {delivery.driverName && (
            <div className="flex items-center gap-2 text-sm bg-purple-50 rounded-lg p-2">
              <Truck className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-900">
                {delivery.driverName}
              </span>
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{customerName}</span>
            </div>
            {customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{customerPhone}</span>
              </div>
            )}
            {deliveryAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="line-clamp-2">{deliveryAddress}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{formatTime(delivery.estimatedDeliveryTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-bold text-lg">
                {formatCurrency(delivery.sale?.total || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <button
                className="px-3 py-2 border rounded-lg hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintInvoice();
                }}
                disabled={printing}
              >
                <Printer className="h-4 w-4" />
              </button>
              <span>Order #{delivery.orderId?.substring(0, 8) || delivery.id.substring(0, 8)}</span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                  delivery.deliveryStatus
                )}`}
              >
                {getDeliveryStatusName(delivery.deliveryStatus)}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold mb-3">Customer Information</h3>
              <div className="space-y-2 rounded-lg border p-4 bg-gray-50">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{customerName}</span>
                </div>
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
                {deliveryAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span>{deliveryAddress}</span>
                  </div>
                )}
                {delivery.specialInstructions && (
                  <div className="mt-3 rounded bg-yellow-50 border border-yellow-200 p-3">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">
                      Special Instructions
                    </p>
                    <p className="text-sm text-yellow-800">
                      {delivery.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
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

              {/* Status Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Order Progress</h3>
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

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              <div className="text-xs text-gray-500 mb-2">
                Current Status: {getDeliveryStatusName(delivery.deliveryStatus)} ({delivery.deliveryStatus})
              </div>

              {delivery.deliveryStatus !== DeliveryStatus.Delivered &&
                delivery.deliveryStatus !== DeliveryStatus.Failed ? (
                  <div className="flex gap-2 flex-wrap">
                    {nextAction ? (
                      <button
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 min-w-[150px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextAction.action();
                        }}
                        disabled={updating}
                      >
                        {updating ? "Updating..." : nextAction.label}
                      </button>
                    ) : (
                      <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-center">
                        No next action available
                      </div>
                    )}
                    <button
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFailureDialogOpen(true);
                      }}
                      disabled={updating}
                    >
                      Mark Failed
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Order is in final status: {getDeliveryStatusName(delivery.deliveryStatus)}
                  </div>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Failure Reason Dialog */}
      <FailureReasonDialog
        open={failureDialogOpen}
        onOpenChange={setFailureDialogOpen}
        orderId={delivery.id}
        orderNumber={delivery.orderId || delivery.id}
        onConfirm={handleMarkFailed}
      />
    </>
  );
}
