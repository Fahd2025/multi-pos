"use client";

import { useState, useCallback } from "react";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDrivers } from "@/hooks/useDrivers";
import DriverCard from "@/components/branch/drivers/DriverCard";
import DriverFormModal from "@/components/branch/drivers/DriverFormModal";
import DriverStatsCard from "@/components/branch/drivers/DriverStatsCard";
import { DriverDto } from "@/types/api.types";

export default function DriversPage() {

  // State management
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [isAvailableFilter, setIsAvailableFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12); // Grid layout works well with 12 items
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverDto | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Fetch drivers with filters
  const { drivers, isLoading, isError, mutate } = useDrivers({
    search: search || undefined,
    isActive: isActiveFilter,
    isAvailable: isAvailableFilter,
    page,
    pageSize,
  });

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  }, []);

  const handleFilterChange = useCallback((filter: string, value: boolean | undefined) => {
    if (filter === "active") {
      setIsActiveFilter(value);
    } else if (filter === "available") {
      setIsAvailableFilter(value);
    }
    setPage(1); // Reset to first page on filter change
  }, []);

  const handleCreateDriver = useCallback(() => {
    setSelectedDriver(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditDriver = useCallback((driver: DriverDto) => {
    setSelectedDriver(driver);
    setIsFormModalOpen(true);
  }, []);

  const handleViewStats = useCallback((driver: DriverDto) => {
    setSelectedDriver(driver);
    setIsStatsModalOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setIsFormModalOpen(false);
    setSelectedDriver(null);
    mutate(); // Refresh the list
  }, [mutate]);

  const handleStatsClose = useCallback(() => {
    setIsStatsModalOpen(false);
    setSelectedDriver(null);
  }, []);

  const handleDriverUpdate = useCallback(() => {
    mutate(); // Refresh the list after any update
  }, [mutate]);

  // Calculate summary stats
  const totalDrivers = drivers?.length || 0;
  const activeDrivers = drivers?.filter(d => d.isActive).length || 0;
  const availableDrivers = drivers?.filter(d => d.isAvailable && d.isActive).length || 0;
  const busyDrivers = drivers?.filter(d => d.isActive && !d.isAvailable).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                Driver Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage delivery drivers and track performance
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                type="button"
                onClick={handleCreateDriver}
                className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 min-h-[48px]"
              >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                New Driver
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Drivers
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">{totalDrivers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Active Drivers
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">{activeDrivers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      Available
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">{availableDrivers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      On Delivery
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">{busyDrivers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full rounded-md border-0 py-3 pl-10 pr-3 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 min-h-[48px]"
              placeholder="Search drivers..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange("active", isActiveFilter === true ? undefined : true)}
              className={`inline-flex items-center rounded-md px-4 py-2.5 text-sm font-medium min-h-[48px] ${
                isActiveFilter === true
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Active Only
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("available", isAvailableFilter === true ? undefined : true)}
              className={`inline-flex items-center rounded-md px-4 py-2.5 text-sm font-medium min-h-[48px] ${
                isAvailableFilter === true
                  ? "bg-green-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Available Only
            </button>
          </div>
        </div>

        {/* Drivers Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : isError ? (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Failed to load drivers
                </h3>
              </div>
            </div>
          </div>
        ) : !drivers || drivers.length === 0 ? (
          <div className="text-center py-12">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
              No drivers found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new driver.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCreateDriver}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 min-h-[48px]"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                New Driver
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onEdit={handleEditDriver}
                onViewStats={handleViewStats}
                onUpdate={handleDriverUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Driver Form Modal */}
      {isFormModalOpen && (
        <DriverFormModal
          driver={selectedDriver}
          isOpen={isFormModalOpen}
          onClose={handleFormClose}
        />
      )}

      {/* Driver Stats Modal */}
      {isStatsModalOpen && selectedDriver && (
        <DriverStatsCard
          driverId={selectedDriver.id}
          driverName={selectedDriver.nameEn}
          isOpen={isStatsModalOpen}
          onClose={handleStatsClose}
        />
      )}
    </div>
  );
}
