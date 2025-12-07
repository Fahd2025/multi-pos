/**
 * Purchases Management Page
 * Track purchase orders, suppliers, and inventory receiving
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import inventoryService, { PurchaseFilters } from "@/services/inventory.service";
import { PurchaseDto } from "@/types/api.types";
import PurchaseFormModal from "@/components/branch/inventory/PurchaseFormModal";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirmation } from "@/hooks/useModal";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ApiErrorAlert, InlineApiError } from "@/components/shared/ApiErrorAlert";
import { StatCard } from "@/components/shared";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { useApiOperation } from "@/hooks/useApiOperation";

export default function PurchasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const { canManage } = usePermission();

  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [allPurchases, setAllPurchases] = useState<PurchaseDto[]>([]); // For stats calculation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  // Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDto | undefined>(undefined);
  const [purchaseMode, setPurchaseMode] = useState<'create' | 'edit' | 'view'>('create');

  // Filter states (input values)
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");

  // Applied filters (what's actually being used in the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
    supplier: "all",
    status: "all",
    paymentStatus: "all",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  // Hooks
  const confirmation = useConfirmation();
  const { execute } = useApiOperation();

  /**
   * Get payment status variant and label
   */
  const getPaymentStatus = (status: number, amountPaid: number, totalCost: number) => {
    if (status === 2 || amountPaid >= totalCost) {
      return { variant: "success" as const, label: "Paid" };
    } else if (amountPaid > 0) {
      return { variant: "warning" as const, label: "Partial" };
    } else {
      return { variant: "danger" as const, label: "Unpaid" };
    }
  };

  /**
   * Get received status variant and label
   */
  const getReceivedStatus = (receivedDate?: string) => {
    if (receivedDate) {
      return { variant: "info" as const, label: "Received" };
    } else {
      return { variant: "neutral" as const, label: "Pending" };
    }
  };

  // DataTable hook for client-side display (pagination handled server-side)
  const { paginationConfig, handlePageChange: handleDataTablePageChange } = useDataTable(
    purchases,
    {
      pageSize,
      sortable: false,
      pagination: true,
    }
  );

  /**
   * Get unique suppliers for filter dropdown (from all purchases for stats)
   */
  const uniqueSuppliers = Array.from(new Set(allPurchases.map((p) => p.supplierName))).sort();

  /**
   * Reset all filters
   */
  const handleResetFilters = async () => {
    // Reset all filter states
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setSelectedSupplier("all");
    setSelectedStatus("all");
    setSelectedPaymentStatus("all");
    setAppliedFilters({
      search: "",
      startDate: "",
      endDate: "",
      supplier: "all",
      status: "all",
      paymentStatus: "all",
    });
    setCurrentPage(1);

    // Fetch with empty filters
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryService.getPurchases({ page: 1, pageSize });
      setPurchases(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      setError(err);
      console.error("Failed to load purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Count active filters (based on applied filters, not input values)
   */
  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.startDate) count++;
    if (appliedFilters.endDate) count++;
    if (appliedFilters.supplier !== "all") count++;
    if (appliedFilters.status !== "all") count++;
    if (appliedFilters.paymentStatus !== "all") count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  /**
   * Check if any filters are active (based on applied filters, not input values)
   */
  const hasActiveFilters = activeFilterCount > 0 || !!appliedFilters.search;

  /**
   * Fetch purchases with server-side filtering and pagination
   */
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: PurchaseFilters = {
        page: currentPage,
        pageSize,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplierName: selectedSupplier !== "all" ? selectedSupplier : undefined,
        status: selectedStatus !== "all" ? (selectedStatus as "received" | "pending") : undefined,
        paymentStatus:
          selectedPaymentStatus !== "all"
            ? (selectedPaymentStatus as "paid" | "partial" | "unpaid")
            : undefined,
      };

      const response = await inventoryService.getPurchases(filters);
      setPurchases(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      setError(err);
      console.error("Failed to load purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all purchases for statistics (without filters)
   */
  const fetchAllPurchases = async () => {
    try {
      const response = await inventoryService.getPurchases({ page: 1, pageSize: 10000 });
      setAllPurchases(response.data || []);
    } catch (err: any) {
      console.error("Failed to load all purchases for stats:", err);
    }
  };

  /**
   * Load data on mount and when filters/pagination change
   */
  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /**
   * Load all purchases for stats on mount
   */
  useEffect(() => {
    fetchAllPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Apply filters (called by Apply Filters button)
   */
  const handleApplyFilters = () => {
    // Save the current filter values as applied filters
    setAppliedFilters({
      search: searchQuery,
      startDate: startDate,
      endDate: endDate,
      supplier: selectedSupplier,
      status: selectedStatus,
      paymentStatus: selectedPaymentStatus,
    });
    setCurrentPage(1);
    fetchPurchases();
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
      case "supplier":
        setSelectedSupplier("all");
        setAppliedFilters((prev) => ({ ...prev, supplier: "all" }));
        break;
      case "status":
        setSelectedStatus("all");
        setAppliedFilters((prev) => ({ ...prev, status: "all" }));
        break;
      case "paymentStatus":
        setSelectedPaymentStatus("all");
        setAppliedFilters((prev) => ({ ...prev, paymentStatus: "all" }));
        break;
    }

    // Reset to first page and trigger refetch
    setCurrentPage(1);

    // Build updated filters for immediate fetch
    const updatedFilters: PurchaseFilters = {
      page: 1,
      pageSize,
      search: filterType === "search" ? undefined : searchQuery || undefined,
      startDate: filterType === "startDate" ? undefined : startDate || undefined,
      endDate: filterType === "endDate" ? undefined : endDate || undefined,
      supplierName:
        filterType === "supplier"
          ? undefined
          : selectedSupplier !== "all"
          ? selectedSupplier
          : undefined,
      status:
        filterType === "status"
          ? undefined
          : selectedStatus !== "all"
          ? (selectedStatus as "received" | "pending")
          : undefined,
      paymentStatus:
        filterType === "paymentStatus"
          ? undefined
          : selectedPaymentStatus !== "all"
          ? (selectedPaymentStatus as "paid" | "partial" | "unpaid")
          : undefined,
    };

    // Fetch with updated filters immediately
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryService.getPurchases(updatedFilters);
      setPurchases(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      setError(err);
      console.error("Failed to load purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get active filter labels for display (based on applied filters, not current inputs)
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
    if (appliedFilters.supplier !== "all") {
      filters.push({ type: "supplier", label: "Supplier", value: appliedFilters.supplier });
    }
    if (appliedFilters.status !== "all") {
      filters.push({
        type: "status",
        label: "Status",
        value: appliedFilters.status.charAt(0).toUpperCase() + appliedFilters.status.slice(1),
      });
    }
    if (appliedFilters.paymentStatus !== "all") {
      filters.push({
        type: "paymentStatus",
        label: "Payment",
        value:
          appliedFilters.paymentStatus.charAt(0).toUpperCase() +
          appliedFilters.paymentStatus.slice(1),
      });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  /**
   * Handle receive purchase
   */
  const handleReceivePurchase = async (id: string, purchaseOrderNumber: string) => {
    confirmation.ask(
      "Receive Purchase Order",
      `Mark purchase ${purchaseOrderNumber} as received? This will update inventory stock levels.`,
      async () => {
        await execute({
          operation: () => inventoryService.receivePurchase(id),
          successMessage: "Purchase received",
          successDetail: `Purchase ${purchaseOrderNumber} has been marked as received and inventory updated`,
          onSuccess: async () => {
            await fetchPurchases(); // Reload list
            await fetchAllPurchases(); // Update stats
          },
        });
      },
      "success"
    );
  };

  /**
   * Handle page change (convert from 0-based to 1-based)
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page + 1); // Convert back to 1-based
  };

  // Define table columns
  const columns: DataTableColumn<PurchaseDto>[] = [
    {
      key: "purchaseOrderNumber",
      label: "PO Number",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
          {row.notes && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {row.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "supplierName",
      label: "Supplier",
      sortable: true,
    },
    {
      key: "purchaseDate",
      label: "Purchase Date",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {new Date(value).toLocaleDateString()}
          </div>
          {row.receivedDate && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Received: {new Date(row.receivedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "totalCost",
      label: "Total Cost",
      sortable: true,
      render: (value, row) => (
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${value.toFixed(2)}
          </div>
          {row.amountPaid > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Paid: ${row.amountPaid.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment Status",
      sortable: true,
      render: (value, row) => {
        const status = getPaymentStatus(value, row.amountPaid, row.totalCost);
        return <StatusBadge variant={status.variant}>{status.label}</StatusBadge>;
      },
    },
    {
      key: "receivedDate",
      label: "Received Status",
      sortable: true,
      render: (value) => {
        const status = getReceivedStatus(value);
        return <StatusBadge variant={status.variant}>{status.label}</StatusBadge>;
      },
    },
  ];

  /**
   * Handle edit purchase
   */
  const handleEditPurchase = (purchase: PurchaseDto) => {
    setSelectedPurchase(purchase);
    setPurchaseMode('edit');
    setIsPurchaseModalOpen(true);
  };

  /**
   * Handle delete purchase
   */
  const handleDeletePurchase = async (id: string, purchaseOrderNumber: string) => {
    confirmation.ask(
      "Delete Purchase Order",
      `Are you sure you want to delete purchase order ${purchaseOrderNumber}? This action cannot be undone.`,
      async () => {
        await execute({
          operation: () => inventoryService.deletePurchase(id),
          successMessage: "Purchase deleted",
          successDetail: `Purchase order ${purchaseOrderNumber} has been deleted`,
          onSuccess: async () => {
            await fetchPurchases(); // Reload list
            await fetchAllPurchases(); // Update stats
          },
        });
      },
      "danger"
    );
  };

  // Define row actions
  const actions: DataTableAction<PurchaseDto>[] = [
    {
      label: "✓ Receive",
      onClick: (row) => handleReceivePurchase(row.id, row.purchaseOrderNumber),
      variant: "success",
      condition: (row) => !row.receivedDate, // Only show if not received
    },
    {
      label: "✏️ Edit",
      onClick: (row) => handleEditPurchase(row),
      variant: "primary",
      condition: (row) => !row.receivedDate, // Only show if not received
    },
    {
      label: "🗑️ Delete",
      onClick: (row) => handleDeletePurchase(row.id, row.purchaseOrderNumber),
      variant: "danger",
      condition: (row) => !row.receivedDate, // Only show if not received
    },
    {
      label: "👁️ View",
      onClick: (row) => {
        setSelectedPurchase(row);
        setPurchaseMode('view');
        setIsPurchaseModalOpen(true);
      },
      variant: "secondary",
    },
  ];

  return (
    <RoleGuard
      requireRole={UserRole.Manager}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Only Managers can access Purchase Management.
          </p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>Go to Dashboard</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Purchase Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track and manage inventory purchases from suppliers
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setSelectedPurchase(undefined);
              setPurchaseMode('create');
              setIsPurchaseModalOpen(true);
            }}
          >
            ➕ New Purchase Order
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <ApiErrorAlert error={error} onRetry={fetchPurchases} onDismiss={() => setError(null)} />
        )}

        {/* Loading State */}
        {loading && <LoadingSpinner size="lg" text="Loading purchases..." />}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Purchase Orders"
            value={allPurchases.length}
            icon="📦"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
          />
          <StatCard
            title="Pending Receipt"
            value={allPurchases.filter((p) => !p.receivedDate).length}
            icon="⏳"
            iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
            valueColor="text-yellow-600 dark:text-yellow-500"
          />
          <StatCard
            title="Received"
            value={allPurchases.filter((p) => p.receivedDate).length}
            icon="✅"
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            valueColor="text-green-600 dark:text-green-500"
          />
          <StatCard
            title="Total Value"
            value={`$${allPurchases.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)}`}
            icon="💰"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
          />
        </div>

        {/* Active Filters Display - Full Width */}
        {!loading && !error && activeFilters.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-5 py-3">
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
                onClick={handleResetFilters}
                className="ml-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Purchases DataTable or Error */}
        {!loading && !error && (
          <DataTable
            data={purchases}
            columns={columns}
            actions={actions}
            getRowKey={(row) => row.id}
            loading={loading}
            pagination
            paginationConfig={paginationConfig}
            onPageChange={handlePageChange}
            emptyMessage="No purchase orders found. Click 'New Purchase Order' to create one."
            showFilterButton
            activeFilterCount={activeFilterCount}
            showResetButton={hasActiveFilters}
            onResetFilters={handleResetFilters}
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
                    placeholder="Search purchases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  />
                </div>
                <button
                  onClick={handleApplyFilters}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Supplier
                    </label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                    >
                      <option value="all">All Suppliers</option>
                      {uniqueSuppliers.map((supplier) => (
                        <option key={supplier} value={supplier}>
                          {supplier}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="received">Received</option>
                    </select>
                  </div>

                  {/* Payment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment
                    </label>
                    <select
                      value={selectedPaymentStatus}
                      onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                    >
                      <option value="all">All Payment Statuses</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-end gap-2">
                  {/* <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
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
                      Clear Filters
                    </div>
                  </button> */}
                  <button
                    onClick={handleApplyFilters}
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Purchase Form Modal */}
        <PurchaseFormModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setSelectedPurchase(undefined);
            setPurchaseMode('create');
          }}
          onSuccess={() => {
            fetchPurchases();
            fetchAllPurchases();
          }}
          purchase={selectedPurchase}
          mode={purchaseMode}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          onClose={confirmation.cancel}
          onConfirm={confirmation.confirm}
          title={confirmation.title}
          message={confirmation.message}
          variant={confirmation.variant}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          isProcessing={confirmation.isProcessing}
        />
      </div>
    </RoleGuard>
  );
}
