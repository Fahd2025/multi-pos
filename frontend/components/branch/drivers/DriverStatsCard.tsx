"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/20/solid";
import { useDriverStats, useDriverPerformanceHistory } from "@/hooks/useDrivers";

interface DriverStatsCardProps {
  driverId: string;
  driverName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverStatsCard({ driverId, driverName, isOpen, onClose }: DriverStatsCardProps) {
  

  // Date range state
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch statistics
  const { stats, isLoading: isStatsLoading, isError: isStatsError } = useDriverStats(
    driverId,
    dateRange.from,
    dateRange.to
  );

  // Fetch performance history
  const {
    performances,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
  } = useDriverPerformanceHistory(driverId, 1, 10);

  // Handle date range change
  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined = now;

    switch (range) {
      case "today":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "all":
        from = undefined;
        to = undefined;
        break;
    }

    setDateRange({ from, to });
    setShowDatePicker(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  // Render star rating
  const renderRating = (rating?: number) => {
    if (!rating) {
      return <span className="text-sm text-gray-400">-</span>;
    }

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            key={index}
            className={`h-4 w-4 ${
              index < Math.floor(rating) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
        <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Get color for metric
  const getMetricColor = (value: number, type: "percentage" | "rating") => {
    if (type === "percentage") {
      if (value >= 90) return "text-green-600 dark:text-green-400";
      if (value >= 70) return "text-yellow-600 dark:text-yellow-400";
      return "text-red-600 dark:text-red-400";
    } else {
      // rating
      if (value >= 4.5) return "text-green-600 dark:text-green-400";
      if (value >= 3.5) return "text-yellow-600 dark:text-yellow-400";
      return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden bg-white dark:bg-gray-800 text-left shadow-xl transition-all w-full sm:my-8 sm:w-full sm:max-w-3xl sm:rounded-lg">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                        "Driver Performance"
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{driverName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[48px] min-w-[48px] flex items-center justify-center"
                    >
                      <span className="sr-only">"Close"</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Date Range Selector */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDateRangeChange("today")}
                      className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium min-h-[48px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      "Today"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDateRangeChange("week")}
                      className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium min-h-[48px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      "Last 7 Days"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDateRangeChange("month")}
                      className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium min-h-[48px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      "This Month"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDateRangeChange("all")}
                      className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium min-h-[48px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      "All Time"
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-6 sm:px-6 max-h-[calc(100vh-16rem)] sm:max-h-[500px] overflow-y-auto">
                  {isStatsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                    </div>
                  ) : isStatsError ? (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                      <p className="text-sm text-red-800 dark:text-red-400">
                        "Failed to load statistics"
                      </p>
                    </div>
                  ) : stats ? (
                    <div className="space-y-6">
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            "Total Deliveries"
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                            {stats.totalDeliveries}
                          </dd>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            "Completion Rate"
                          </dt>
                          <dd className={`mt-1 text-3xl font-semibold ${getMetricColor(stats.onTimePercentage, "percentage")}`}>
                            {stats.totalDeliveries > 0
                              ? Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100)
                              : 0}
                            %
                          </dd>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            "Average Rating"
                          </dt>
                          <dd className={`mt-1 text-3xl font-semibold ${getMetricColor(stats.averageRating, "rating")}`}>
                            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}
                          </dd>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            "On-Time Rate"
                          </dt>
                          <dd className={`mt-1 text-3xl font-semibold ${getMetricColor(stats.onTimePercentage, "percentage")}`}>
                            {Math.round(stats.onTimePercentage)}%
                          </dd>
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <dt className="text-sm font-medium text-green-800 dark:text-green-300">
                            "Completed"
                          </dt>
                          <dd className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-200">
                            {stats.completedDeliveries}
                          </dd>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                          <dt className="text-sm font-medium text-red-800 dark:text-red-300">
                            "Failed"
                          </dt>
                          <dd className="mt-1 text-2xl font-semibold text-red-900 dark:text-red-200">
                            {stats.failedDeliveries}
                          </dd>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <dt className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            "Avg Delivery Time"
                          </dt>
                          <dd className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-200">
                            {stats.averageDeliveryTimeMinutes} "min"
                          </dd>
                        </div>
                      </div>

                      {/* Performance History */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          "Recent Deliveries"
                        </h3>

                        {isHistoryLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                          </div>
                        ) : isHistoryError ? (
                          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                            <p className="text-sm text-red-800 dark:text-red-400">
                              Failed to load delivery history
                            </p>
                          </div>
                        ) : !performances || performances.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No delivery history found
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {performances.map((performance) => (
                              <div
                                key={performance.id}
                                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        "Order" #{performance.orderNumber}
                                      </span>
                                      {performance.onTime ? (
                                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                                          "On Time"
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-800 dark:text-red-300">
                                          "Late"
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {formatDate(performance.recordedAt)}
                                    </p>
                                  </div>
                                  <div className="ml-4 flex flex-col items-end">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {performance.deliveryTimeMinutes} "min"
                                    </div>
                                    <div className="mt-1">{renderRating(performance.customerRating)}</div>
                                  </div>
                                </div>
                                {performance.customerFeedback && (
                                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                    "{performance.customerFeedback}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        "No statistics available"
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex justify-center rounded-md bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px]"
                  >
                    "Close"
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
