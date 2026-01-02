"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/20/solid";
import { DeliveryOrderDto, DriverDto } from "@/types/api.types";
import deliveryService from "@/services/delivery.service";
import { useDriverActiveCount } from "@/hooks/useDrivers";

interface AssignmentModalProps {
  delivery: DeliveryOrderDto;
  availableDrivers: DriverDto[];
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete: () => void;
}

function DriverSelectionItem({ driver, isSelected, onSelect }: {
  driver: DriverDto;
  isSelected: boolean;
  onSelect: () => void;
}) {

  // Fetch active deliveries count
  const { count: activeCount, isLoading: isCountLoading } = useDriverActiveCount(driver.id);

  // Render star rating
  const renderRating = () => {
    if (!driver.averageRating || driver.averageRating === 0) {
      return <span className="text-sm text-gray-400">-</span>;
    }

    const rating = driver.averageRating;
    const fullStars = Math.floor(rating);

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon
              key={index}
              className={`h-4 w-4 ${
                index < fullStars ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Format vehicle info
  const formatVehicleInfo = () => {
    const parts = [];
    if (driver.vehicleType) parts.push(driver.vehicleType);
    if (driver.vehicleNumber) parts.push(driver.vehicleNumber);
    return parts.length > 0 ? parts.join(" - ") : "No vehicle";
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center space-x-3 rounded-lg border-2 px-4 py-4 text-left transition-all duration-200 min-h-[72px] touch-manipulation ${
        isSelected
          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600"
          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {driver.profileImagePath ? (
          <img
            src={driver.profileImagePath}
            alt={driver.nameEn}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-green-500"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 ring-2 ring-green-500">
            <span className="text-xl font-semibold text-white">
              {driver.nameEn.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Driver Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {driver.nameEn}
          </p>
          {isSelected && (
            <CheckCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 ml-2" />
          )}
        </div>

        <div className="mt-1 flex items-center gap-3">
          {renderRating()}
        </div>

        <div className="mt-2 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="truncate">{formatVehicleInfo()}</span>
          {!isCountLoading && activeCount !== undefined && (
            <>
              <span className="text-gray-400">•</span>
              <span className={activeCount === 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-orange-600 dark:text-orange-400 font-medium"}>
                {activeCount === 0
                  ? "Free"
                  : activeCount === 1
                  ? "1 active"
                  : `${activeCount} active`
                }
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export default function AssignmentModal({
  delivery,
  availableDrivers,
  isOpen,
  onClose,
  onAssignmentComplete,
}: AssignmentModalProps) {

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sort drivers by rating and workload
  const sortedDrivers = [...availableDrivers].sort((a, b) => {
    const ratingA = a.averageRating || 0;
    const ratingB = b.averageRating || 0;
    return ratingB - ratingA; // Highest rating first
  });

  // Handle assignment
  const handleAssign = async () => {
    if (!selectedDriverId) {
      setError("Please select a driver");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deliveryService.assignDriver(delivery.id, selectedDriverId);
      onAssignmentComplete();
    } catch (err: any) {
      console.error("Failed to assign driver:", err);
      setError(err.message || "Failed to assign driver. Please try again.");
    } finally {
      setIsSubmitting(false);
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
              <Dialog.Panel className="relative transform overflow-hidden bg-white dark:bg-gray-800 text-left shadow-xl transition-all w-full sm:my-8 sm:w-full sm:max-w-2xl sm:rounded-lg">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                        "Assign Driver"
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        "Order" #{delivery.orderTransactionId || delivery.id.substring(0, 8)}
                      </p>
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
                </div>

                {/* Delivery Info Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 sm:px-6 border-b border-blue-200 dark:border-blue-800">
                  <div className="text-sm space-y-1">
                    {delivery.customerName && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>"Customer:"</strong> {delivery.customerName}
                      </p>
                    )}
                    {delivery.deliveryAddress && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>"Address:"</strong> {delivery.deliveryAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Driver Selection */}
                <div className="px-4 py-6 sm:px-6 max-h-[calc(100vh-20rem)] sm:max-h-[500px] overflow-y-auto">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    "Select a driver"
                  </h3>

                  {sortedDrivers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        "No available drivers"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedDrivers.map((driver) => (
                        <DriverSelectionItem
                          key={driver.id}
                          driver={driver}
                          isSelected={selectedDriverId === driver.id}
                          onSelect={() => setSelectedDriverId(driver.id)}
                        />
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                      <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 sm:px-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="inline-flex justify-center rounded-md bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:w-auto w-full"
                  >
                    "Cancel"
                  </button>
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={isSubmitting || !selectedDriverId}
                    className="inline-flex justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:w-auto w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        "Assigning..."
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        "Assign Driver"
                      </>
                    )}
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
