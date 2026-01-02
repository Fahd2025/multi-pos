"use client";

import { useState, useCallback } from "react";
import { useUnassignedDeliveries } from "@/hooks/useDeliveryQueue";
import { useAvailableDrivers } from "@/hooks/useDrivers";
import DeliveryQueue from "@/components/branch/dispatch/DeliveryQueue";
import AvailableDriversList from "@/components/branch/dispatch/AvailableDriversList";
import AssignmentModal from "@/components/branch/dispatch/AssignmentModal";
import { DeliveryOrderDto, DriverDto } from "@/types/api.types";

export default function DispatchPage() {

  // Fetch unassigned deliveries and available drivers
  const { deliveries, isLoading: isDeliveriesLoading, isError: isDeliveriesError, mutate: mutateDeliveries } = useUnassignedDeliveries();
  const { drivers, isLoading: isDriversLoading, isError: isDriversError, mutate: mutateDrivers } = useAvailableDrivers();

  // Assignment modal state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrderDto | null>(null);

  // Handle assignment initiation
  const handleAssignDelivery = useCallback((delivery: DeliveryOrderDto) => {
    setSelectedDelivery(delivery);
    setIsAssignmentModalOpen(true);
  }, []);

  // Handle assignment completion
  const handleAssignmentComplete = useCallback(() => {
    setIsAssignmentModalOpen(false);
    setSelectedDelivery(null);
    mutateDeliveries(); // Refresh deliveries list
    mutateDrivers(); // Refresh drivers list (updates availability)
  }, [mutateDeliveries, mutateDrivers]);

  // Handle assignment cancellation
  const handleAssignmentCancel = useCallback(() => {
    setIsAssignmentModalOpen(false);
    setSelectedDelivery(null);
  }, []);

  // Calculate summary stats
  const totalPending = deliveries?.length || 0;
  const totalAvailableDrivers = drivers?.length || 0;
  const urgentDeliveries = deliveries?.filter((d) => {
    // Consider deliveries created more than 30 minutes ago as urgent
    const createdAt = new Date(d.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes > 30;
  }).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
              Dispatch Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Assign deliveries to available drivers
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Pending Deliveries */}
          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Pending Deliveries
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">{totalPending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Available Drivers */}
          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Available Drivers
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">{totalAvailableDrivers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Deliveries */}
          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Urgent (&gt;30 min)
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">{urgentDeliveries}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Panel Layout */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Panel: Delivery Queue */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Deliveries
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Deliveries waiting for driver assignment
              </p>
            </div>
            <DeliveryQueue
              deliveries={deliveries}
              isLoading={isDeliveriesLoading}
              isError={isDeliveriesError}
              onAssign={handleAssignDelivery}
            />
          </div>

          {/* Right Panel: Available Drivers */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Available Drivers
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Drivers ready to accept deliveries
              </p>
            </div>
            <AvailableDriversList
              drivers={drivers}
              isLoading={isDriversLoading}
              isError={isDriversError}
            />
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {isAssignmentModalOpen && selectedDelivery && (
        <AssignmentModal
          delivery={selectedDelivery}
          availableDrivers={drivers || []}
          isOpen={isAssignmentModalOpen}
          onClose={handleAssignmentCancel}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}
    </div>
  );
}
