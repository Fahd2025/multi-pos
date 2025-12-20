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
}

export function OrderStatusTimeline({
  statusHistory,
  currentStatus,
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

  if (failedStatus || isFailed) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <div className="rounded-full bg-red-100 p-2">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-900">Delivery Failed</p>
            <p className="text-sm text-red-700">
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
    );
  }

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

  const currentStatusOrder = getStatusOrder(currentStatus);

  return (
    <div className="space-y-1">
      {statusConfig.map((statusItem, index) => {
        const historyItem = statusHistory.find((h) => h.status === statusItem.key.toString());
        const statusOrder = getStatusOrder(statusItem.key);
        const isCompleted = statusOrder < currentStatusOrder || !!historyItem;
        const isCurrent = currentStatus === statusItem.key;
        const Icon = statusItem.icon;

        return (
          <div key={statusItem.key} className="relative">
            {/* Connector line */}
            {index < statusConfig.length - 1 && (
              <div
                className={`absolute left-[19px] top-10 h-8 w-0.5 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}

            <div
              className={`flex items-start gap-3 rounded-lg p-3 ${
                isCurrent ? "bg-blue-50 border-2 border-blue-200" : ""
              }`}
            >
              {/* Status Icon */}
              <div
                className={`relative rounded-full p-2 ${
                  isCompleted
                    ? "bg-green-100"
                    : isCurrent
                    ? statusItem.color
                    : "bg-gray-100"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-green-600" />
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
                      isCompleted
                        ? "text-green-900"
                        : isCurrent
                        ? "text-blue-900"
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

                {!historyItem && isCompleted && (
                  <p className="mt-1 text-xs text-green-600">Completed</p>
                )}

                {!isCompleted && !isCurrent && (
                  <p className="mt-1 text-xs text-gray-400">Not reached yet</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
