"use client";

import { Check, Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { DeliveryStatus } from "@/types/api.types";
import { getDeliveryStatusName } from "@/types/enums";

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string;
  createdAt: string;
  userId: string;
}

interface OrderStatusTimelineProps {
  statusHistory: StatusHistoryItem[];
  currentStatus: DeliveryStatus;
  delivery?: {
    driverId?: string;
    driverName?: string;
    actualDeliveryTime?: string;
  };
}

export function OrderStatusTimeline({
  statusHistory,
  currentStatus,
  delivery,
}: OrderStatusTimelineProps) {
  const statusConfig = [
    {
      key: DeliveryStatus.Pending,
      icon: Clock,
      label: "Pending",
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      key: DeliveryStatus.Assigned,
      icon: Package,
      label: "Assigned",
      color: "text-blue-600 bg-blue-100",
    },
    {
      key: DeliveryStatus.OutForDelivery,
      icon: Truck,
      label: "Out for Delivery",
      color: "text-purple-600 bg-purple-100",
    },
    {
      key: DeliveryStatus.Delivered,
      icon: CheckCircle,
      label: "Delivered",
      color: "text-green-600 bg-green-100",
    },
  ];

  // Check if order failed
  const failedStatus = statusHistory.find((h) => h.status === "Failed");
  const isFailed = currentStatus === DeliveryStatus.Failed;

  // Helper function to determine if a status has been reached
  const getStatusOrder = (status: DeliveryStatus): number => {
    const order = {
      [DeliveryStatus.Pending]: 1,
      [DeliveryStatus.Assigned]: 2,
      [DeliveryStatus.OutForDelivery]: 3,
      [DeliveryStatus.Delivered]: 4,
      [DeliveryStatus.Failed]: 5,
    };
    return order[status] || 0;
  };

  // If failed, find the last successful status before failure
  let lastSuccessfulStatusOrder = getStatusOrder(currentStatus);
  if (isFailed) {
    // Find the highest status that was actually reached (has a history entry)
    // We look through the standard status progression and find the last one with a history entry
    let highestReachedOrder = 0;

    if (statusHistory.length > 0) {
      // Use status history if available
      statusConfig.forEach((config) => {
        const historyEntry = statusHistory.find((h) => {
          // Try to match by enum value or string representation
          return h.status === config.key.toString() ||
                 h.status === config.label ||
                 h.status === String(config.key);
        });

        if (historyEntry) {
          const order = getStatusOrder(config.key);
          if (order > highestReachedOrder) {
            highestReachedOrder = order;
          }
        }
      });
    } else if (delivery) {
      // Fallback: Infer from delivery object when status history is empty
      // Start with Pending (all orders start here)
      highestReachedOrder = getStatusOrder(DeliveryStatus.Pending);

      // If driver is assigned, it must have reached "Assigned" or later
      if (delivery.driverId || delivery.driverName) {
        highestReachedOrder = Math.max(highestReachedOrder, getStatusOrder(DeliveryStatus.Assigned));
      }

      // We can assume if it failed, it was likely at the last known status
      // For most failures, if a driver was assigned, it failed during "Out for Delivery"
      if (delivery.driverId || delivery.driverName) {
        highestReachedOrder = getStatusOrder(DeliveryStatus.OutForDelivery);
      }
    }

    lastSuccessfulStatusOrder = highestReachedOrder > 0 ? highestReachedOrder : 1; // Default to Pending if nothing found
  }

  return (
    <div className="space-y-1">
      {statusConfig.map((statusItem, index) => {
        const historyItem = statusHistory.find((h) => {
          // Try multiple matching strategies
          return h.status === statusItem.key.toString() ||
                 h.status === statusItem.label ||
                 h.status === String(statusItem.key);
        });

        const statusOrder = getStatusOrder(statusItem.key);

        // Determine if this is the failure point
        const isLastBeforeFailure = isFailed && statusOrder === lastSuccessfulStatusOrder;

        // For failed orders, mark as completed (green) if:
        // 1. It's before the failure point, OR
        // 2. Status history is empty and we're inferring - mark all statuses before failure point as completed
        const isCompleted = isFailed
          ? (statusHistory.length === 0 && statusOrder < lastSuccessfulStatusOrder) ||
            (!!historyItem && statusOrder < lastSuccessfulStatusOrder)
          : !!historyItem || statusOrder < getStatusOrder(currentStatus);

        const isCurrent = !isFailed && currentStatus === statusItem.key;
        const Icon = statusItem.icon;

        // If order failed, don't show statuses beyond the failure point
        if (isFailed && statusOrder > lastSuccessfulStatusOrder) {
          return null;
        }

        return (
          <div key={statusItem.key} className="relative">
            {/* Connector line logic */}
            {!isFailed && index < statusConfig.length - 1 && (
              <div
                className={`absolute left-[19px] top-10 h-8 w-0.5 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
            {/* For failed orders: green connectors between completed statuses (not including failure point) */}
            {isFailed && isCompleted && !isLastBeforeFailure && (
              <div className="absolute left-[19px] top-10 h-8 w-0.5 bg-green-500" />
            )}
            {/* Orange connector from failure point to failed status */}
            {isLastBeforeFailure && (
              <div className="absolute left-[19px] top-10 h-8 w-0.5 bg-orange-500" />
            )}

            <div
              className={`flex items-start gap-3 rounded-lg p-3 ${
                isCurrent ? "bg-blue-50 border-2 border-blue-200" :
                isLastBeforeFailure ? "bg-orange-50 border-2 border-orange-200" : ""
              }`}
            >
              {/* Status Icon */}
              <div
                className={`relative rounded-full p-2 ${
                  isCompleted
                    ? "bg-green-100"
                    : isCurrent
                    ? statusItem.color
                    : isLastBeforeFailure
                    ? "bg-orange-100"
                    : "bg-gray-100"
                }`}
              >
                {isCompleted && !isLastBeforeFailure ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : isLastBeforeFailure ? (
                  <Icon className={`h-5 w-5 text-orange-600`} />
                ) : (
                  <Icon
                    className={`h-5 w-5 ${
                      isCurrent
                        ? statusItem.color.split(" ")[0]
                        : "text-gray-400"
                    }`}
                  />
                )}
              </div>

              {/* Status Details */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p
                    className={`font-semibold ${
                      isCompleted && !isLastBeforeFailure
                        ? "text-green-900"
                        : isCurrent
                        ? "text-blue-900"
                        : isLastBeforeFailure
                        ? "text-orange-900"
                        : "text-gray-500"
                    }`}
                  >
                    {statusItem.label}
                  </p>
                  {isCurrent && !isCompleted && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      Current
                    </span>
                  )}
                  {isLastBeforeFailure && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                      Failed Here
                    </span>
                  )}
                </div>

                {historyItem && (
                  <div className="mt-1 space-y-1">
                    {historyItem.notes && (
                      <p className="text-sm text-gray-600">{historyItem.notes}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(historyItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {!historyItem && isCompleted && !isLastBeforeFailure && (
                  <p className="mt-1 text-xs text-green-600">Completed</p>
                )}

                {!isCompleted && !isCurrent && !isLastBeforeFailure && (
                  <p className="mt-1 text-xs text-gray-400">Not reached yet</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Failed Status - Show at the end if order failed */}
      {isFailed && (
        <div className="relative">
          {/* Connector line from last status */}
          <div className="absolute left-[19px] top-0 h-8 w-0.5 bg-orange-500" />

          <div className="flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-3 mt-1">
            <div className="rounded-full bg-red-100 p-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-red-900">Delivery Failed</p>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Failed
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {failedStatus?.notes || "Delivery could not be completed"}
              </p>
              {failedStatus && (
                <p className="mt-1 text-xs text-red-600">
                  {new Date(failedStatus.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
