"use client";

import { ClockIcon, MapPinIcon, PhoneIcon, UserIcon } from "@heroicons/react/24/outline";
import { DeliveryOrderDto } from "@/types/api.types";

interface DeliveryQueueProps {
  deliveries: DeliveryOrderDto[] | undefined;
  isLoading: boolean;
  isError: any;
  onAssign: (delivery: DeliveryOrderDto) => void;
}

export default function DeliveryQueue({ deliveries, isLoading, isError, onAssign }: DeliveryQueueProps) {

  // Sort deliveries by creation time (oldest first) and priority
  const sortedDeliveries = deliveries ? [...deliveries].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB; // Oldest first
  }) : [];

  // Calculate wait time
  const calculateWaitTime = (createdAt: string): { minutes: number; isUrgent: boolean } => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    return {
      minutes,
      isUrgent: minutes > 30,
    };
  };

  // Format wait time display
  const formatWaitTime = (minutes: number): string => {
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format address for display
  const formatAddress = (delivery: DeliveryOrderDto): string => {
    return delivery.deliveryAddress || "Address not provided";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
              "Failed to load deliveries"
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (!sortedDeliveries || sortedDeliveries.length === 0) {
    return (
      <div className="text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          "No pending deliveries"
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          "All deliveries have been assigned to drivers."
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDeliveries.map((delivery) => {
        const waitTime = calculateWaitTime(delivery.createdAt);

        return (
          <div
            key={delivery.id}
            className={`relative flex flex-col overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200 ${
              waitTime.isUrgent ? "ring-2 ring-red-500" : ""
            }`}
          >
            {/* Urgent Badge */}
            {waitTime.isUrgent && (
              <div className="absolute top-2 right-2 z-10">
                <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white">
                  URGENT
                </span>
              </div>
            )}

            {/* Delivery Info */}
            <div className="p-4 space-y-3">
              {/* Order Number and Wait Time */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Order #{delivery.orderTransactionId || delivery.id.substring(0, 8)}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4" />
                    <span className={waitTime.isUrgent ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                      Waiting {formatWaitTime(waitTime.minutes)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {delivery.customerName && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{delivery.customerName}</span>
                </div>
              )}

              {/* Delivery Address */}
              <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{formatAddress(delivery)}</span>
              </div>

              {/* Special Instructions */}
              {delivery.specialInstructions && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-300 italic">
                    <strong>Instructions:</strong> {delivery.specialInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
              <button
                type="button"
                onClick={() => onAssign(delivery)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 min-h-[48px] touch-manipulation"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                Assign Driver
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
