/**
 * Audit Logs Page
 *
 * Admin-only page to view comprehensive audit trail across the entire system.
 * Includes filtering by user, branch, event type, action, and date range.
 */

"use client";

import React, { useState, useEffect } from "react";
import { use } from "react";
import { DataTable } from "@/components/data-table";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumn } from "@/types/data-table.types";
import { AuditLogDto, getAuditLogs } from "@/services/user.service";

export default function AuditLogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [successFilter, setSuccessFilter] = useState<boolean | undefined>(undefined);

  // Initialize DataTable
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(auditLogs, {
    pageSize: 25,
    sortable: true,
    pagination: true,
    initialSort: { key: "timestamp", direction: "desc" },
  });

  useEffect(() => {
    loadAuditLogs();
  }, [eventTypeFilter, actionFilter, successFilter]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getAuditLogs(
        undefined, // userId
        undefined, // branchId
        eventTypeFilter || undefined,
        actionFilter || undefined,
        undefined, // fromDate
        undefined, // toDate
        1,
        1000 // Load more records for client-side pagination
      );

      // Filter by success if needed
      let logs = result.logs;
      if (successFilter !== undefined) {
        logs = logs.filter((log) => log.success === successFilter);
      }

      setAuditLogs(logs);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (config: {
    key: keyof AuditLogDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  const clearFilters = () => {
    setEventTypeFilter("");
    setActionFilter("");
    setSuccessFilter(undefined);
  };

  // Define audit log columns
  const columns: DataTableColumn<AuditLogDto>[] = [
    {
      key: "timestamp",
      label: "Date & Time",
      sortable: true,
      width: "180px",
      render: (value) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{new Date(value).toLocaleDateString()}</div>
          <div className="text-gray-500 text-xs">{new Date(value).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      key: "success",
      label: "Status",
      sortable: true,
      width: "100px",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Success" : "Failed"}
        </span>
      ),
    },
    {
      key: "eventType",
      label: "Event Type",
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: true,
      render: (value) => <span className="font-medium text-gray-700">{value}</span>,
    },
    {
      key: "entityType",
      label: "Entity",
      sortable: true,
      render: (value) => <span className="text-sm text-gray-600">{value || "-"}</span>,
    },
    {
      key: "entityId",
      label: "Entity ID",
      width: "120px",
      render: (value) => (
        <span className="font-mono text-xs text-gray-500">
          {value ? value.substring(0, 8) + "..." : "-"}
        </span>
      ),
    },
    {
      key: "userId",
      label: "User ID",
      width: "120px",
      render: (value) => (
        <span className="font-mono text-xs text-gray-500">
          {value ? value.substring(0, 8) + "..." : "-"}
        </span>
      ),
    },
    {
      key: "branchId",
      label: "Branch ID",
      width: "120px",
      render: (value) => (
        <span className="font-mono text-xs text-gray-500">
          {value ? value.substring(0, 8) + "..." : "-"}
        </span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      width: "140px",
      render: (value) => <span className="font-mono text-xs text-gray-600">{value || "-"}</span>,
    },
  ];

  // Expandable row content showing more details
  const renderExpandedRow = (log: AuditLogDto) => (
    <div className="bg-gray-50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600">Full Entity ID</label>
          <p className="text-sm font-mono text-gray-900">{log.entityId || "-"}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Full User ID</label>
          <p className="text-sm font-mono text-gray-900">{log.userId || "-"}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Full Branch ID</label>
          <p className="text-sm font-mono text-gray-900">{log.branchId || "-"}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">User Agent</label>
          <p className="text-xs text-gray-700 break-all">{log.userAgent || "-"}</p>
        </div>
      </div>

      {log.oldValues && (
        <div>
          <label className="text-xs font-medium text-gray-600">Old Values</label>
          <pre className="mt-1 text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
            {JSON.stringify(JSON.parse(log.oldValues), null, 2)}
          </pre>
        </div>
      )}

      {log.newValues && (
        <div>
          <label className="text-xs font-medium text-gray-600">New Values</label>
          <pre className="mt-1 text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
            {JSON.stringify(JSON.parse(log.newValues), null, 2)}
          </pre>
        </div>
      )}

      {log.errorMessage && (
        <div>
          <label className="text-xs font-medium text-red-600">Error Message</label>
          <p className="mt-1 text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
            {log.errorMessage}
          </p>
        </div>
      )}
    </div>
  );

  // Get unique event types and actions for filters
  const eventTypes = Array.from(new Set(auditLogs.map((log) => log.eventType)));
  const actions = Array.from(new Set(auditLogs.map((log) => log.action)));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading audit logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Error loading audit logs</p>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={loadAuditLogs}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-600">Comprehensive audit trail of all system activities</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Event Type Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Event Types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            {/* Success Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSuccessFilter(undefined)}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    successFilter === undefined
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSuccessFilter(true)}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    successFilter === true
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Success
                </button>
                <button
                  onClick={() => setSuccessFilter(false)}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    successFilter === false
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Failed
                </button>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Successful</p>
            <p className="text-2xl font-bold text-green-600">
              {auditLogs.filter((log) => log.success).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {auditLogs.filter((log) => !log.success).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Unique Event Types</p>
            <p className="text-2xl font-bold text-blue-600">{eventTypes.length}</p>
          </div>
        </div>

        {/* Audit Logs Table */}
        <DataTable
          data={displayData}
          columns={columns}
          getRowKey={(row) => row.id}
          pagination
          paginationConfig={paginationConfig}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          sortable
          sortConfig={sortConfig ?? undefined}
          onSortChange={handleSortChange}
          emptyMessage="No audit logs found. Try adjusting your filters."
        />

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">About Audit Logs</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-start">
              <svg
                className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Audit logs are permanently retained for compliance and security purposes</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                All critical operations are logged including user management, sales, and system
                changes
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Logs include before/after values for data modifications</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>IP addresses and user agents are captured for security tracking</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
