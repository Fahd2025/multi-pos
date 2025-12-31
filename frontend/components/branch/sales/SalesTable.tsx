/**
 * Sales Table Component
 * Display sales transactions with search, filters, and pagination
 * Uses generic DataTable with ExpansionTile for mobile-friendly view
 */

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useTableFilters } from "@/hooks/useTableFilters";
import { ActiveFiltersBadge, SearchInput, Button } from "@/components/shared";

interface SalesTableProps {
  onSaleSelect?: (sale: SaleDto) => void;
  onReturnClick?: (sale: SaleDto) => void;
  refreshTrigger?: number;
}

export default function SalesTable({ onSaleSelect, onReturnClick, refreshTrigger }: SalesTableProps) {
  const router = useRouter();
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table filters using new hook
  const filters = useTableFilters({
    filterDefinitions: [
      { type: "search", label: "Search", defaultValue: "" },
      {
        type: "startDate",
        label: "From",
        defaultValue: "",
        getDisplayValue: (val: string) => val ? new Date(val).toLocaleDateString() : "",
      },
      {
        type: "endDate",
        label: "To",
        defaultValue: "",
        getDisplayValue: (val: string) => val ? new Date(val).toLocaleDateString() : "",
      },
      {
        type: "paymentMethod",
        label: "Payment",
        defaultValue: "",
        getDisplayValue: (val: string) => val ? getPaymentMethodName(parseInt(val)) : "All Methods",
      },
      {
        type: "invoiceType",
        label: "Type",
        defaultValue: "",
        getDisplayValue: (val: string) => val ? getInvoiceTypeName(parseInt(val)) : "All Types",
      },
      {
        type: "status",
        label: "Status",
        defaultValue: "",
        getDisplayValue: (val: string) => val === "voided" ? "Voided" : val === "active" ? "Active" : "All Statuses",
      },
    ],
    onFiltersChange: () => setCurrentPage(1),
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;


  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: GetSalesParams = {
        page: currentPage,
        pageSize,
        search: filters.appliedFilters.search || undefined,
        dateFrom: filters.appliedFilters.startDate || undefined,
        dateTo: filters.appliedFilters.endDate || undefined,
        paymentMethod: filters.appliedFilters.paymentMethod ? parseInt(filters.appliedFilters.paymentMethod) : undefined,
        invoiceType: filters.appliedFilters.invoiceType ? parseInt(filters.appliedFilters.invoiceType) : undefined,
        isVoided: filters.appliedFilters.status === "voided" ? true : filters.appliedFilters.status === "active" ? false : undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, refreshTrigger, filters.appliedFilters]);


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
          <StatusBadge variant="neutral">Active</StatusBadge>
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
    {
      label: "Return Invoice",
      onClick: (row) => onReturnClick?.(row),
      variant: "danger",
      condition: (row) => !row.isVoided && row.status !== "returned",
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
      {!loading && !error && (
        <div className="m-4 md:m-6 mb-0">
          <ActiveFiltersBadge
            filters={filters.activeFilters}
            onRemove={filters.removeFilter}
            onClearAll={filters.resetFilters}
          />
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
          activeFilterCount={filters.activeFilterCount}
          showResetButton={filters.hasActiveFilters}
          onResetFilters={filters.resetFilters}
          searchBar={
            <SearchInput
              value={filters.filterValues.search}
              onChange={(val) => filters.setFilterValue("search", val)}
              onSearch={filters.applyFilters}
              placeholder="Transaction ID, invoice number, customer..."
            />
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
                    value={filters.filterValues.startDate}
                    onChange={(e) => filters.setFilterValue("startDate", e.target.value)}
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
                    value={filters.filterValues.endDate}
                    onChange={(e) => filters.setFilterValue("endDate", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={filters.filterValues.paymentMethod}
                    onChange={(e) => filters.setFilterValue("paymentMethod", e.target.value)}
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
                    value={filters.filterValues.invoiceType}
                    onChange={(e) => filters.setFilterValue("invoiceType", e.target.value)}
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
                    value={filters.filterValues.status}
                    onChange={(e) => filters.setFilterValue("status", e.target.value)}
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
                <Button variant="primary" onClick={filters.applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
