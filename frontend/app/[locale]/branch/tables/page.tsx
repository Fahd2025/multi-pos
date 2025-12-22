"use client";

import React, { Suspense, useState } from "react";
import TableManagement from "@/components/branch/tables/TableManagement";
import ZoneManagement from "@/components/branch/tables/ZoneManagement";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function TablesPage() {
  const [activeTab, setActiveTab] = useState<"tables" | "zones">("tables");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Table Management
        </h1>
        <p className="text-gray-600">Manage restaurant tables, zones, and seating arrangements</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("tables")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "tables"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            Table Layout
          </button>
          <button
            onClick={() => setActiveTab("zones")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "zones"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            Zone Management
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
          {activeTab === "tables" && <TableManagement />}
          {activeTab === "zones" && <ZoneManagement />}
        </Suspense>
      </div>
    </div>
  );
}
