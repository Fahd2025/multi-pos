"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Filter, Truck, Search, X, Calendar } from "lucide-react";
import { DeliveryOrderDto, DeliveryStatus, DriverDto } from "@/types/api.types";
import { DeliveryCard } from "./DeliveryCard";
import { DeliveryForm } from "./DeliveryForm";
import { Select, Input } from "@/components/shared";
import styles from "../Pos2.module.css";
import { useDeliveries, useDrivers } from "@/hooks/useDelivery";

export function DeliveryManagement() {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | null>(null);

  // New filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [driverFilter, setDriverFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRangePreset, setDateRangePreset] = useState<string>("today");
  const [showFilters, setShowFilters] = useState(false);

  // Use SWR hooks for data fetching
  const { deliveries, isLoading: loadingDeliveries, mutate: mutateDeliveries } = useDeliveries({
    status: statusFilter,
    search: searchQuery,
    driverId: driverFilter,
    dateFrom,
    dateTo,
  });

  const { drivers, isLoading: loadingDrivers } = useDrivers({
    isActive: true,
  });

  // Date range presets
  const dateRangePresets = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    // { value: "lastMonth", label: "Last Month" },
    // { value: "lastYear", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ];


  // Calculate date range based on preset
  const calculateDateRange = (preset: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (preset) {
      case "today":
        setDateFrom(todayStr);
        setDateTo(todayStr);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        setDateFrom(yesterdayStr);
        setDateTo(yesterdayStr);
        break;
      case "last7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        setDateFrom(sevenDaysAgo.toISOString().split("T")[0]);
        setDateTo(todayStr);
        break;
      case "last30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setDateFrom(thirtyDaysAgo.toISOString().split("T")[0]);
        setDateTo(todayStr);
        break;
      case "lastMonth":
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const firstDayLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const lastDayLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        setDateFrom(firstDayLastMonth.toISOString().split("T")[0]);
        setDateTo(lastDayLastMonth.toISOString().split("T")[0]);
        break;
      case "lastYear":
        const lastYear = new Date(today);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        const firstDayLastYear = new Date(lastYear.getFullYear(), 0, 1);
        const lastDayLastYear = new Date(lastYear.getFullYear(), 11, 31);
        setDateFrom(firstDayLastYear.toISOString().split("T")[0]);
        setDateTo(lastDayLastYear.toISOString().split("T")[0]);
        break;
      case "custom":
        // Don't change dates for custom range
        break;
      default:
        break;
    }
  };

  // Handle preset change
  const handlePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    calculateDateRange(preset);
  };

  // Initialize with today's date on mount
  useEffect(() => {
    calculateDateRange("today"); // Set today as default
  }, []);

  const handleStatusUpdate = () => {
    mutateDeliveries(); // Revalidate deliveries data
  };

  const resetFiltersToDefaults = () => {
    setDriverFilter("");
    setDateRangePreset("today");
    calculateDateRange("today");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDriverFilter("");
    setDateFrom("");
    setDateTo("");
    setDateRangePreset("today");
    setStatusFilter(null);
    calculateDateRange("today"); // Reset to today
  };

  // Handle filter toggle - reset to defaults when hiding
  const handleToggleFilters = () => {
    if (showFilters) {
      // Hiding filters - reset to defaults
      resetFiltersToDefaults();
    }
    setShowFilters(!showFilters);
  };

  // Handle manual date changes - switch to custom mode
  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setDateRangePreset("custom");
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setDateRangePreset("custom");
  };

  const deliveriesData = deliveries ?? [];

  const filteredDeliveries =
    statusFilter === null
      ? deliveriesData
      : deliveriesData.filter((d) => d.deliveryStatus === statusFilter);

  const pendingCount = deliveriesData.filter((d) => d.deliveryStatus === DeliveryStatus.Pending).length;
  const assignedCount = deliveriesData.filter(
    (d) => d.deliveryStatus === DeliveryStatus.Assigned
  ).length;
  const outForDeliveryCount = deliveriesData.filter(
    (d) => d.deliveryStatus === DeliveryStatus.OutForDelivery
  ).length;
  const deliveredCount = deliveriesData.filter(
    (d) => d.deliveryStatus === DeliveryStatus.Delivered
  ).length;
  const failedCount = deliveriesData.filter((d) => d.deliveryStatus === DeliveryStatus.Failed).length;

  // Calculate total for filtered deliveries
  const totalAmount = filteredDeliveries.reduce((sum, delivery) => {
    return sum + (delivery.sale?.total || 0);
  }, 0);

  // Check if any filters are active (not default values)
  const hasActiveFilters = searchQuery || driverFilter || dateRangePreset !== "today";

  // Prepare driver options for Select component
  const driverOptions = useMemo(() => {
    const driversData = drivers ?? [];
    const options = driversData.map((driver) => ({
      value: driver.id,
      label: driver.nameEn,
    }));
    // Add "All Drivers" as the first option
    return [{ value: "", label: "All Drivers" }, ...options];
  }, [drivers]);

  // Prepare date range preset options for Select component
  const dateRangeOptions = dateRangePresets.map((preset) => ({
    value: preset.value,
    label: preset.label,
  }));

  // Navigation handlers
  const handleBackToPos = () => {
    router.push("/pos");
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/pos")}
            className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Truck size={28} className="text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">Delivery Management</h1>
            <p className="text-sm text-gray-500">Track and manage delivery orders</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={handleToggleFilters}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && !showFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white text-emerald-600 rounded text-xs font-medium">
                •
              </span>
            )}
          </button>

          {/* <button
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Delivery Order
          </button> */}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b bg-white px-6 py-4">
          <div className="space-y-4">
            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Driver Filter */}
              <Select
                label="Driver"
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                options={driverOptions}
              />

              {/* Date Range Preset */}
              <Select
                label="Date Range"
                value={dateRangePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                options={dateRangeOptions}
              />

              {/* Date From */}
              <Input
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                leftIcon={<Calendar className="h-4 w-4" />}
                disabled={dateRangePreset !== "custom"}
              />

              {/* Date To */}
              <Input
                type="date"
                label="To Date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                min={dateFrom}
                leftIcon={<Calendar className="h-4 w-4" />}
                disabled={dateRangePreset !== "custom"}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {/* {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </button>
            </div>
          )} */}
        </div>
      )}

      {/* Status Filter */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === null
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(null)}
            >
              All ({deliveriesData.length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.Pending
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.Pending)}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.Assigned
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.Assigned)}
            >
              Assigned ({assignedCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.OutForDelivery
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.OutForDelivery)}
            >
              Out for Delivery ({outForDeliveryCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.Delivered
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.Delivered)}
            >
              Delivered ({deliveredCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.Failed
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.Failed)}
            >
              Failed ({failedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Deliveries Grid */}
      <div className="flex-1 overflow-auto p-6 pb-20">
        {loadingDeliveries ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading deliveries...</p>
            </div>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">No delivery orders found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Total Orders:</span>
              <span className="text-lg font-bold text-gray-900">{filteredDeliveries.length}</span>
            </div>
            {hasActiveFilters && (
              <span className="text-xs text-gray-500">
                (filtered from {deliveriesData.length} total)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Total Amount:</span>
            <span className="text-2xl font-bold text-emerald-600">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* New Delivery Order Dialog */}
      <DeliveryForm
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          mutateDeliveries();
          setAddDialogOpen(false);
        }}
      />
    </div>
  );
}
