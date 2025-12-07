/**
 * Purchases Management Page
 * Track purchase orders, suppliers, and inventory receiving
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import inventoryService from "@/services/inventory.service";
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

export default function PurchasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const { canManage } = usePermission();

  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  // Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDto | undefined>(undefined);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");

  // Hooks
  const confirmation = useConfirmation();

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

  /**
   * Filter purchases based on search and filter criteria
   */
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          purchase.purchaseOrderNumber.toLowerCase().includes(query) ||
          purchase.supplierName.toLowerCase().includes(query) ||
          (purchase.notes && purchase.notes.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (startDate) {
        const purchaseDate = new Date(purchase.purchaseDate);
        const filterStartDate = new Date(startDate);
        if (purchaseDate < filterStartDate) return false;
      }
      if (endDate) {
        const purchaseDate = new Date(purchase.purchaseDate);
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(23, 59, 59, 999); // Include the entire end date
        if (purchaseDate > filterEndDate) return false;
      }

      // Supplier filter
      if (selectedSupplier !== "all" && purchase.supplierName !== selectedSupplier) {
        return false;
      }

      // Status filter (received/pending)
      if (selectedStatus !== "all") {
        const isReceived = !!purchase.receivedDate;
        if (selectedStatus === "received" && !isReceived) return false;
        if (selectedStatus === "pending" && isReceived) return false;
      }

      // Payment status filter
      if (selectedPaymentStatus !== "all") {
        const paymentStatus = getPaymentStatus(
          purchase.paymentStatus,
          purchase.amountPaid,
          purchase.totalCost
        );
        if (selectedPaymentStatus === "paid" && paymentStatus.label !== "Paid") return false;
        if (selectedPaymentStatus === "partial" && paymentStatus.label !== "Partial") return false;
        if (selectedPaymentStatus === "unpaid" && paymentStatus.label !== "Unpaid") return false;
      }

      return true;
    });
  }, [
    purchases,
    searchQuery,
    startDate,
    endDate,
    selectedSupplier,
    selectedStatus,
    selectedPaymentStatus,
  ]);

  // DataTable hook
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(filteredPurchases, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

  /**
   * Get unique suppliers for filter dropdown
   */
  const uniqueSuppliers = Array.from(new Set(purchases.map((p) => p.supplierName))).sort();

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setSelectedSupplier("all");
    setSelectedStatus("all");
    setSelectedPaymentStatus("all");
  };

  /**
   * Count active filters
   */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (selectedSupplier !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedPaymentStatus !== "all") count++;
    return count;
  }, [startDate, endDate, selectedSupplier, selectedStatus, selectedPaymentStatus]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = activeFilterCount > 0 || !!searchQuery;

  /**
   * Load purchases
   */
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - RoleGuard handles permission

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: The API supports pagination, but for the DataTable client-side model we load all or handle server-side
      // For this implementation, we'll stick to the pattern used in other pages (client-side pagination of loaded data)
      // or if the API is strictly server-side, we might need to adjust.
      // Based on previous code, it was fetching with page/pageSize.
      // If we want to use the generic DataTable fully client-side features, we should fetch all or adapt.
      // However, the previous code was: await inventoryService.getPurchases(currentPage, pageSize);
      // Let's assume we fetch a larger set or the first page.
      // To keep it consistent with other pages that seem to load data and then use DataTable:

      const purchasesResponse = await inventoryService.getPurchases(1, 1000); // Fetching more for client-side table
      setPurchases(purchasesResponse.data || []);
    } catch (err: any) {
      setError(err);
      console.error("Failed to load purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle receive purchase
   */
  const handleReceivePurchase = async (id: string, purchaseOrderNumber: string) => {
    confirmation.ask(
      "Receive Purchase Order",
      `Mark purchase ${purchaseOrderNumber} as received? This will update inventory stock levels.`,
      async () => {
        try {
          await inventoryService.receivePurchase(id);
          loadData(); // Reload list
        } catch (err: any) {
          setError(`Failed to receive purchase: ${err.message}`);
        }
      },
      "success"
    );
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

  // Define row actions
  const actions: DataTableAction<PurchaseDto>[] = [
    {
      label: "✓ Receive",
      onClick: (row) => handleReceivePurchase(row.id, row.purchaseOrderNumber),
      variant: "success",
      condition: (row) => !row.receivedDate, // Only show if not received
    },
    {
      label: "👁️ View",
      onClick: (row) => {
        setSelectedPurchase(row);
        setIsPurchaseModalOpen(true);
      },
      variant: "secondary",
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof PurchaseDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

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
              setIsPurchaseModalOpen(true);
            }}
          >
            ➕ New Purchase Order
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <ApiErrorAlert error={error} onRetry={loadData} onDismiss={() => setError(null)} />
        )}

        {/* Loading State */}
        {loading && <LoadingSpinner size="lg" text="Loading purchases..." />}

        {/* Purchases DataTable or Error */}
        {!loading && !error && (
          <DataTable
            data={displayData}
            columns={columns}
            actions={actions}
            getRowKey={(row) => row.id}
            pagination
            paginationConfig={paginationConfig}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            sortable
            sortConfig={sortConfig ?? undefined}
            onSortChange={handleSortChange}
            emptyMessage="No purchase orders found. Click 'New Purchase Order' to create one."
            showFilterButton
            activeFilterCount={activeFilterCount}
            showResetButton={hasActiveFilters}
            onResetFilters={handleResetFilters}
            searchBar={
              <div className="relative">
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                />
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
              </div>
            }
          />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Purchase Orders"
            value={purchases.length}
            icon="📦"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
          />
          <StatCard
            title="Pending Receipt"
            value={purchases.filter((p) => !p.receivedDate).length}
            icon="⏳"
            iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
            valueColor="text-yellow-600 dark:text-yellow-500"
          />
          <StatCard
            title="Received"
            value={purchases.filter((p) => p.receivedDate).length}
            icon="✅"
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            valueColor="text-green-600 dark:text-green-500"
          />
          <StatCard
            title="Total Value"
            value={`$${purchases.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)}`}
            icon="💰"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
          />
        </div>

        {/* Purchase Form Modal */}
        <PurchaseFormModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setSelectedPurchase(undefined);
          }}
          onSuccess={() => {
            loadData();
          }}
          purchase={selectedPurchase}
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
