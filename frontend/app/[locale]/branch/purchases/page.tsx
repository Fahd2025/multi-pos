/**
 * Purchases Management Page
 * Track purchase orders, suppliers, and inventory receiving
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import inventoryService, { PurchaseFilters } from "@/services/inventory.service";
import { PurchaseDto } from "@/types/api.types";
import PurchaseFormModal from "@/components/branch/inventory/PurchaseFormModal";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirmation } from "@/hooks/useConfirmation";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ApiErrorAlert, InlineApiError } from "@/components/shared/ApiErrorAlert";
import { StatCard } from "@/components/shared";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { useApiOperation } from "@/hooks/useApiOperation";
import { useTableFilters } from "@/hooks/useTableFilters";
import { ActiveFiltersBadge, SearchInput } from "@/components/shared";
import { Image } from "lucide-react";

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
  const [purchaseMode, setPurchaseMode] = useState<"create" | "edit" | "view">("create");

  // Helper function to get unique suppliers for filter dropdown
  const uniqueSuppliers = Array.from(new Set(allPurchases.map((p) => p.supplierName))).sort();

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
        type: "supplier",
        label: "Supplier",
        defaultValue: "all",
        getDisplayValue: (val: string) => val === "all" ? "All Suppliers" : val,
      },
      {
        type: "status",
        label: "Status",
        defaultValue: "all",
        getDisplayValue: (val: string) => val === "all" ? "All Statuses" : val.charAt(0).toUpperCase() + val.slice(1),
      },
      {
        type: "paymentStatus",
        label: "Payment",
        defaultValue: "all",
        getDisplayValue: (val: string) => val === "all" ? "All Payment Statuses" : val.charAt(0).toUpperCase() + val.slice(1),
      },
    ],
    onFiltersChange: () => setCurrentPage(1),
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
   * Fetch purchases with server-side filtering and pagination
   */
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: PurchaseFilters = {
        page: currentPage,
        pageSize,
        search: filters.appliedFilters.search || undefined,
        startDate: filters.appliedFilters.startDate || undefined,
        endDate: filters.appliedFilters.endDate || undefined,
        supplierName: filters.appliedFilters.supplier !== "all" ? filters.appliedFilters.supplier : undefined,
        status: filters.appliedFilters.status !== "all" ? (filters.appliedFilters.status as "received" | "pending") : undefined,
        paymentStatus:
          filters.appliedFilters.paymentStatus !== "all"
            ? (filters.appliedFilters.paymentStatus as "paid" | "partial" | "unpaid")
            : undefined,
      };

      const response = await inventoryService.getPurchases(params);
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
  }, [currentPage, filters.appliedFilters]);

  /**
   * Load all purchases for stats on mount
   */
  useEffect(() => {
    fetchAllPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
            {row.invoiceImagePath && (
              <span
                className="inline-flex items-center text-blue-600 dark:text-blue-400"
                title="Has invoice image"
              >
                <Image className="w-4 h-4" aria-hidden="true" />
              </span>
            )}
          </div>
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
    setPurchaseMode("edit");
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
        setPurchaseMode("view");
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
            variant="default"
            size="default"
            onClick={() => {
              setSelectedPurchase(undefined);
              setPurchaseMode("create");
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
        {!loading && !error && (
          <ActiveFiltersBadge
            filters={filters.activeFilters}
            onRemove={filters.removeFilter}
            onClearAll={filters.resetFilters}
          />
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
            activeFilterCount={filters.activeFilterCount}
            showResetButton={filters.hasActiveFilters}
            onResetFilters={filters.resetFilters}
            searchBar={
              <SearchInput
                value={filters.filterValues.search}
                onChange={(val) => filters.setFilterValue("search", val)}
                onSearch={filters.applyFilters}
                placeholder="Search purchases..."
              />
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
                        value={filters.filterValues.startDate}
                        onChange={(e) => filters.setFilterValue("startDate", e.target.value)}
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
                        value={filters.filterValues.endDate}
                        onChange={(e) => filters.setFilterValue("endDate", e.target.value)}
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
                      value={filters.filterValues.supplier}
                      onChange={(e) => filters.setFilterValue("supplier", e.target.value)}
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
                      value={filters.filterValues.status}
                      onChange={(e) => filters.setFilterValue("status", e.target.value)}
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
                      value={filters.filterValues.paymentStatus}
                      onChange={(e) => filters.setFilterValue("paymentStatus", e.target.value)}
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
                  <Button variant="primary" onClick={filters.applyFilters}>
                    Apply Filters
                  </Button>
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
            setPurchaseMode("create");
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
