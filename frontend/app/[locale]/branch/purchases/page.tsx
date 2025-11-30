/**
 * Purchases Management Page
 * Track purchase orders, suppliers, and inventory receiving
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
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

export default function PurchasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);

  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  // Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDto | undefined>(undefined);

  // Hooks
  const confirmation = useConfirmation();

  // DataTable hook
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(purchases, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

  /**
   * Load purchases
   */
  useEffect(() => {
    loadData();
  }, []);

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

  // Define table columns
  const columns: DataTableColumn<PurchaseDto>[] = [
    {
      key: "purchaseOrderNumber",
      label: "PO Number",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.notes && <div className="text-sm text-gray-500 truncate max-w-xs">{row.notes}</div>}
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
          <div className="text-sm text-gray-900">{new Date(value).toLocaleDateString()}</div>
          {row.receivedDate && (
            <div className="text-sm text-gray-500">
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
          <div className="text-sm font-semibold text-gray-900">${value.toFixed(2)}</div>
          {row.amountPaid > 0 && (
            <div className="text-xs text-gray-500">Paid: ${row.amountPaid.toFixed(2)}</div>
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Purchase Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
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
      {error && <ApiErrorAlert error={error} onRetry={loadData} onDismiss={() => setError(null)} />}

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
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Total Purchase Orders</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{purchases.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Pending Receipt</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {purchases.filter((p) => !p.receivedDate).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Received</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {purchases.filter((p) => p.receivedDate).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ${purchases.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)}
          </div>
        </div>
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
  );
}
