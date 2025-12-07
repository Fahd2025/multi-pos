/**
 * Sales Table Component
 * Display sales transactions with search, filters, and pagination
 * Uses generic DataTable with ExpansionTile for mobile-friendly view
 */

"use client";

import { useState, useEffect } from "react";
import salesService, { GetSalesParams } from "@/services/sales.service";
import { SaleDto } from "@/types/api.types";
import {
  PaymentMethod,
  InvoiceType,
  getPaymentMethodName,
  getInvoiceTypeName,
} from "@/types/enums";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface SalesTableProps {
  onSaleSelect?: (sale: SaleDto) => void;
  refreshTrigger?: number;
}

export default function SalesTable({ onSaleSelect, refreshTrigger }: SalesTableProps) {
  const router = useRouter();
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states (input values)
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Applied filters (what's actually being used in the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
    paymentMethod: "",
    invoiceType: "",
    status: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  /**
   * Count active filters (based on applied filters, not input values)
   */
  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.startDate) count++;
    if (appliedFilters.endDate) count++;
    if (appliedFilters.paymentMethod) count++;
    if (appliedFilters.invoiceType) count++;
    if (appliedFilters.status) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  /**
   * Check if any filters are active (based on applied filters, not input values)
   */
  const hasActiveFilters = activeFilterCount > 0 || !!appliedFilters.search;

  /**
   * Get active filter labels for display (based on applied filters)
   */
  const getActiveFilters = () => {
    const filters: { type: string; label: string; value: string }[] = [];

    if (appliedFilters.search) {
      filters.push({ type: "search", label: "Search", value: appliedFilters.search });
    }
    if (appliedFilters.startDate) {
      filters.push({
        type: "startDate",
        label: "From",
        value: new Date(appliedFilters.startDate).toLocaleDateString(),
      });
    }
    if (appliedFilters.endDate) {
      filters.push({
        type: "endDate",
        label: "To",
        value: new Date(appliedFilters.endDate).toLocaleDateString(),
      });
    }
    if (appliedFilters.paymentMethod) {
      filters.push({
        type: "paymentMethod",
        label: "Payment",
        value: getPaymentMethodName(parseInt(appliedFilters.paymentMethod)),
      });
    }
    if (appliedFilters.invoiceType) {
      filters.push({
        type: "invoiceType",
        label: "Type",
        value: getInvoiceTypeName(parseInt(appliedFilters.invoiceType)),
      });
    }
    if (appliedFilters.status) {
      filters.push({
        type: "status",
        label: "Status",
        value: appliedFilters.status === "voided" ? "Voided" : "Active",
      });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: GetSalesParams = {
        page: currentPage,
        pageSize,
        search: appliedFilters.search || undefined,
        dateFrom: appliedFilters.startDate || undefined,
        dateTo: appliedFilters.endDate || undefined,
        paymentMethod: appliedFilters.paymentMethod ? parseInt(appliedFilters.paymentMethod) : undefined,
        invoiceType: appliedFilters.invoiceType ? parseInt(appliedFilters.invoiceType) : undefined,
        isVoided: appliedFilters.status === "voided" ? true : appliedFilters.status === "active" ? false : undefined,
      };

      const response = await salesService.getSales(params);
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      console.error("Failed to fetch sales:", err);
      setError(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [currentPage, refreshTrigger]);

  /**
   * Apply filters (called by Apply Filters button)
   */
  const handleSearch = () => {
    // Save the current filter values as applied filters
    setAppliedFilters({
      search: searchQuery,
      startDate: startDate,
      endDate: endDate,
      paymentMethod: paymentMethodFilter,
      invoiceType: invoiceTypeFilter,
      status: statusFilter,
    });
    setCurrentPage(1);
    // Will trigger fetchSales via useEffect
    setTimeout(() => fetchSales(), 0);
  };

  /**
   * Reset all filters
   */
  const handleClearFilters = async () => {
    // Reset all filter states
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPaymentMethodFilter("");
    setInvoiceTypeFilter("");
    setStatusFilter("");
    setAppliedFilters({
      search: "",
      startDate: "",
      endDate: "",
      paymentMethod: "",
      invoiceType: "",
      status: "",
    });
    setCurrentPage(1);

    // Fetch with empty filters
    try {
      setLoading(true);
      setError(null);
      const response = await salesService.getSales({ page: 1, pageSize });
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      console.error("Failed to fetch sales:", err);
      setError(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove individual filter
   */
  const handleRemoveFilter = async (filterType: string) => {
    // Reset the specific filter in both input and applied states
    switch (filterType) {
      case "search":
        setSearchQuery("");
        setAppliedFilters((prev) => ({ ...prev, search: "" }));
        break;
      case "startDate":
        setStartDate("");
        setAppliedFilters((prev) => ({ ...prev, startDate: "" }));
        break;
      case "endDate":
        setEndDate("");
        setAppliedFilters((prev) => ({ ...prev, endDate: "" }));
        break;
      case "paymentMethod":
        setPaymentMethodFilter("");
        setAppliedFilters((prev) => ({ ...prev, paymentMethod: "" }));
        break;
      case "invoiceType":
        setInvoiceTypeFilter("");
        setAppliedFilters((prev) => ({ ...prev, invoiceType: "" }));
        break;
      case "status":
        setStatusFilter("");
        setAppliedFilters((prev) => ({ ...prev, status: "" }));
        break;
    }

    // Reset to first page and trigger refetch
    setCurrentPage(1);

    // Build updated filters for immediate fetch
    const updatedFilters = {
      page: 1,
      pageSize,
      search: filterType === "search" ? undefined : searchQuery || undefined,
      dateFrom: filterType === "startDate" ? undefined : startDate || undefined,
      dateTo: filterType === "endDate" ? undefined : endDate || undefined,
      paymentMethod:
        filterType === "paymentMethod"
          ? undefined
          : paymentMethodFilter
          ? parseInt(paymentMethodFilter)
          : undefined,
      invoiceType:
        filterType === "invoiceType"
          ? undefined
          : invoiceTypeFilter
          ? parseInt(invoiceTypeFilter)
          : undefined,
      isVoided:
        filterType === "status"
          ? undefined
          : statusFilter === "voided"
          ? true
          : statusFilter === "active"
          ? false
          : undefined,
    };

    // Fetch with updated filters immediately
    try {
      setLoading(true);
      setError(null);
      const response = await salesService.getSales(updatedFilters);
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      console.error("Failed to fetch sales:", err);
      setError(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (sale: SaleDto) => {
    if (onSaleSelect) {
      onSaleSelect(sale);
    } else {
      router.push(`/branch/sales/${sale.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  // DataTable hook (disabled client-side pagination since we use server-side)
  const { sortConfig, handleSort } = useDataTable(sales, {
    pageSize,
    sortable: false,
    pagination: false, // Disable client-side pagination
  });

  // Define table columns
  const columns: DataTableColumn<SaleDto>[] = [
    {
      key: "transactionId",
      label: "Transaction ID",
      sortable: false,
      render: (value, row) => (
        <div className="cursor-pointer" onClick={() => handleRowClick(row)}>
          <div className="text-sm font-medium text-blue-600 hover:underline">{value}</div>
          {row.invoiceNumber && <div className="text-xs text-gray-500">{row.invoiceNumber}</div>}
        </div>
      ),
    },
    {
      key: "saleDate",
      label: "Date",
      sortable: false,
      render: (value) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(value)}</div>
          <div className="text-xs text-gray-500">{formatTime(value)}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: false,
      render: (value) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">{value || "Walk-in"}</div>
      ),
    },
    {
      key: "total",
      label: "Total",
      sortable: false,
      render: (value, row) => (
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${value.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Tax: ${row.taxAmount.toFixed(2)}</div>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      label: "Payment",
      sortable: false,
      render: (value) => (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          {getPaymentMethodName(value)}
        </span>
      ),
    },
    {
      key: "invoiceType",
      label: "Type",
      sortable: false,
      render: (value) => <span className="text-sm text-gray-600">{getInvoiceTypeName(value)}</span>,
    },
    {
      key: "isVoided",
      label: "Status",
      sortable: false,
      render: (value) =>
        value ? (
          <StatusBadge variant="danger">Voided</StatusBadge>
        ) : (
          <StatusBadge variant="success">Active</StatusBadge>
        ),
    },
  ];

  // Define row actions
  const actions: DataTableAction<SaleDto>[] = [
    {
      label: "View Details",
      onClick: (row) => handleRowClick(row),
      variant: "primary",
    },
  ];

  // Handle page change (convert from 0-based to 1-based)
  const handlePageChange = (page: number) => {
    setCurrentPage(page + 1); // Convert back to 1-based
  };

  // Adapter for sort change (not actively used, but needed for type compatibility)
  const handleSortChange = (config: { key: keyof SaleDto | string; direction: "asc" | "desc" }) => {
    handleSort(config.key);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Active Filters Display */}
      {!loading && !error && activeFilters.length > 0 && (
        <div className="m-4 md:m-6 mb-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-5 py-3">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Active Filters:
            </span>
            {activeFilters.map((filter) => (
              <span
                key={filter.type}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium"
              >
                <span className="font-semibold">{filter.label}:</span>
                <span>{filter.value}</span>
                <button
                  onClick={() => handleRemoveFilter(filter.type)}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                  title={`Remove ${filter.label} filter`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
            <button
              onClick={handleClearFilters}
              className="ml-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-12 text-center">
          <span className="text-4xl">⚠️</span>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Failed to load sales
          </h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <button
            onClick={fetchSales}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* DataTable with ExpansionTile for mobile */}
      {!error && (
        <DataTable
          data={sales}
          columns={columns}
          actions={actions}
          getRowKey={(row) => row.id}
          loading={loading}
          pagination
          paginationConfig={{
            currentPage: currentPage - 1, // Convert to 0-based for DataTable
            totalPages,
            pageSize,
            totalItems,
          }}
          onPageChange={handlePageChange}
          sortable
          sortConfig={sortConfig ?? undefined}
          onSortChange={handleSortChange}
          emptyMessage="No sales found. Try adjusting your filters or search criteria."
          showRowNumbers
          showFilterButton
          activeFilterCount={activeFilterCount}
          showResetButton={hasActiveFilters}
          onResetFilters={handleClearFilters}
          searchBar={
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Transaction ID, invoice number, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          }
          filterSection={
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  >
                    <option value="">All Methods</option>
                    <option value={PaymentMethod.Cash}>Cash</option>
                    <option value={PaymentMethod.Card}>Card</option>
                    <option value={PaymentMethod.DigitalWallet}>Digital Wallet</option>
                    <option value={PaymentMethod.BankTransfer}>Bank Transfer</option>
                    <option value={PaymentMethod.Check}>Check</option>
                  </select>
                </div>

                {/* Invoice Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Invoice Type
                  </label>
                  <select
                    value={invoiceTypeFilter}
                    onChange={(e) => setInvoiceTypeFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  >
                    <option value="">All Types</option>
                    <option value={InvoiceType.Touch}>Touch Invoice</option>
                    <option value={InvoiceType.Standard}>Standard Invoice</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="voided">Voided</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
