"use client";

import React, { Suspense, useState } from "react";
import { useTablesWithStatus } from "@/hooks/useTables";
import { useZones } from "@/hooks/useZones";
import { TableWithStatusDto } from "@/types/api.types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Select } from "@/components/shared/Select";
import { Button } from "@/components/shared/Button";
import { MapPin, Users, Clock, DollarSign, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

/**
 * POS Tables Page - For cashiers to view and select tables during order taking
 * This is a simplified, read-only view focused on table selection and status
 */
export default function POSTablesPage() {
  const router = useRouter();
  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>();
  const { tables, isLoading, error } = useTablesWithStatus(selectedZoneId);
  const { zones } = useZones();

  const handleTableSelect = (table: TableWithStatusDto) => {
    if (table.status === "occupied") {
      // Navigate to the existing sale
      router.push(`/pos?saleId=${table.saleId}`);
    } else {
      // Navigate to POS with table pre-selected
      router.push(`/pos?tableNumber=${table.number}&guestCount=1`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-red-500 text-white";
      case "reserved":
        return "bg-yellow-500 text-white";
      default:
        return "bg-green-500 text-white";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "occupied":
        return "Occupied";
      case "reserved":
        return "Reserved";
      default:
        return "Available";
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load tables</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Restaurant Tables
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select a table to start or continue an order
        </p>
      </div>

      {/* Zone Filter */}
      {zones && zones.length > 0 && (
        <div className="mb-6 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Zone
          </label>
          <Select
            value={selectedZoneId?.toString() || "all"}
            onChange={(e) =>
              setSelectedZoneId(e.target.value === "all" ? undefined : Number(e.target.value))
            }
            options={[
              { value: "all", label: "All Zones" },
              ...zones.map((zone) => ({
                value: zone.id.toString(),
                label: `${zone.name} (${zone.tableCount || 0} tables)`,
              })),
            ]}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading tables..." />
        </div>
      )}

      {/* Tables Grid */}
      {!isLoading && tables && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onClick={() => handleTableSelect(table)}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tables && tables.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
            No tables found
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            {selectedZoneId
              ? "No tables in this zone. Try selecting a different zone."
              : "No tables have been configured yet."}
          </p>
        </div>
      )}

      {/* Quick Stats */}
      {!isLoading && tables && tables.length > 0 && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Tables"
            value={tables.length}
            color="blue"
          />
          <StatCard
            label="Available"
            value={tables.filter((t) => t.status === "available").length}
            color="green"
          />
          <StatCard
            label="Occupied"
            value={tables.filter((t) => t.status === "occupied").length}
            color="red"
          />
          <StatCard
            label="Reserved"
            value={tables.filter((t) => t.status === "reserved").length}
            color="yellow"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Individual table card component
 */
function TableCard({
  table,
  onClick,
  getStatusColor,
  getStatusText,
}: {
  table: TableWithStatusDto;
  onClick: () => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200",
        "border-2 border-transparent hover:border-blue-500",
        "p-4 text-left w-full group"
      )}
    >
      {/* Status Badge */}
      <div
        className={cn(
          "absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold",
          getStatusColor(table.status)
        )}
      >
        {getStatusText(table.status)}
      </div>

      {/* Table Info */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {table.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Table #{table.number}
        </p>
      </div>

      {/* Zone */}
      {table.zoneName && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          {table.zoneName}
        </div>
      )}

      {/* Capacity */}
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
        <Users className="w-4 h-4 mr-1" />
        Capacity: {table.capacity} guests
      </div>

      {/* Occupied Details */}
      {table.status === "occupied" && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {table.invoiceNumber && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Invoice: {table.invoiceNumber}
            </p>
          )}
          {table.guestCount && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <Users className="w-3 h-3 mr-1" />
              {table.guestCount} {table.guestCount === 1 ? "guest" : "guests"}
            </div>
          )}
          {table.orderTime && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {table.orderTime}
            </div>
          )}
          {table.orderTotal && (
            <div className="flex items-center text-xs font-semibold text-gray-900 dark:text-gray-100">
              <DollarSign className="w-3 h-3 mr-1" />
              ${table.orderTotal.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Action Hint */}
      <div className="mt-3 flex items-center justify-between text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>
          {table.status === "occupied" ? "View Order" : "Start Order"}
        </span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
}

/**
 * Stat card component
 */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "red" | "yellow";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", colorClasses[color])}>{value}</p>
    </div>
  );
}
