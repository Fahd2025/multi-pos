/**
 * Supplier Details Page
 * Shows supplier profile, statistics, and purchase history
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import supplierService from "@/services/supplier.service";
import { SupplierDto, PurchaseDto } from "@/types/api.types";
import Link from "next/link";
import { DataTable } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumn } from "@/types/data-table.types";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";

export default function SupplierDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const router = useRouter();
  const { branch } = useAuth();
  const { canManage } = usePermission();

  const [supplier, setSupplier] = useState<SupplierDto | null>(null);
  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DataTable hook for purchase history
  const {
    data: displayHistory,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(purchases, {
    pageSize: 10,
    sortable: true,
    pagination: true,
  });

  /**
   * Load supplier details
   */
  useEffect(() => {
    if (canManage()) {
      loadSupplier();
    }
  }, [id, canManage]);

  /**
   * Load purchase history
   */
  useEffect(() => {
    if (canManage()) {
      loadPurchaseHistory();
    }
  }, [id, canManage]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.getSupplierById(id);
      setSupplier(data);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier details");
      console.error("Error loading supplier:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await supplierService.getSupplierPurchaseHistory(id, {
        page: 1,
        pageSize: 100, // Fetch more for client-side table
      });
      setPurchases(data);
    } catch (err: any) {
      console.error("Error loading purchase history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Define columns for purchase history
  const historyColumns: DataTableColumn<PurchaseDto>[] = [
    {
      key: "purchaseDate",
      label: "Date",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "purchaseOrderNumber",
      label: "PO Number",
      sortable: true,
      render: (value, row) => (
        <Link
          href={`/${locale}/branch/purchases/${row.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {value}
        </Link>
      ),
    },
    {
      key: "receivedDate",
      label: "Received",
      sortable: true,
      render: (value) =>
        value ? (
          new Date(value).toLocaleDateString()
        ) : (
          <span className="text-gray-400">Pending</span>
        ),
    },
    {
      key: "lineItems",
      label: "Items",
      sortable: false,
      render: (value) => `${value?.length || 0} items`,
    },
    {
      key: "totalCost",
      label: "Total Cost",
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      key: "paymentStatus",
      label: "Payment",
      sortable: true,
      render: (value) => {
        const statuses = ["Pending", "Partial", "Completed", "Cancelled"];
        const colors = ["warning", "info", "success", "neutral"] as const;
        return (
          <StatusBadge variant={colors[value] || "neutral"}>
            {statuses[value] || "Unknown"}
          </StatusBadge>
        );
      },
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof PurchaseDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner size="lg" text="Loading supplier details..." />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto p-6">
        <ErrorAlert message={error || "Supplier not found"} />
        <Link href={`/${locale}/branch/suppliers`}>
          <Button variant="secondary" size="md" className="mt-4">
            ← Back to Suppliers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <RoleGuard
      requireRole={UserRole.Manager}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Only Managers can access Supplier Details.</p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>
            Go to Dashboard
          </Button>
        </div>
      }
    >
      <div className="container mx-auto">
        {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {supplier.nameEn}
            </h1>
            <StatusBadge variant={supplier.isActive ? "success" : "danger"}>
              {supplier.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          </div>
          {supplier.nameAr && <p className="text-lg text-gray-600">{supplier.nameAr}</p>}
          <p className="text-gray-500 font-mono mt-1">{supplier.code}</p>
        </div>

        <button
          onClick={() => router.push(`/${locale}/branch/suppliers`)}
          className="px-4 py-2 text-gray-700 bg-white dark:bg-gray-800  border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ← Back to Suppliers
        </button>
      </div>

      {/* Supplier Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Profile Information */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800  rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{supplier.email}</p>
              </div>
            )}
            {supplier.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{supplier.phone}</p>
              </div>
            )}
            {supplier.addressEn && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address (English)</p>
                <p className="font-medium">{supplier.addressEn}</p>
              </div>
            )}
            {supplier.addressAr && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address (Arabic)</p>
                <p className="font-medium" dir="rtl">
                  {supplier.addressAr}
                </p>
              </div>
            )}
            {supplier.paymentTerms && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Payment Terms</p>
                <p className="font-medium">{supplier.paymentTerms}</p>
              </div>
            )}
            {supplier.deliveryTerms && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Delivery Terms</p>
                <p className="font-medium">{supplier.deliveryTerms}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="font-medium">{new Date(supplier.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium">{new Date(supplier.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white dark:bg-gray-800  rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Supplier Statistics</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-blue-600">{supplier.totalPurchases}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-purple-600">
                ${supplier.totalSpent.toFixed(2)}
              </p>
            </div>
            {supplier.lastPurchaseDate && (
              <div>
                <p className="text-sm text-gray-600">Last Purchase</p>
                <p className="font-medium">
                  {new Date(supplier.lastPurchaseDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {Math.floor(
                    (Date.now() - new Date(supplier.lastPurchaseDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days ago
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white dark:bg-gray-800  rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">Purchase History</h2>

        {historyLoading ? (
          <LoadingSpinner size="md" text="Loading purchase history..." />
        ) : purchases.length > 0 ? (
          <DataTable
            data={displayHistory}
            columns={historyColumns}
            getRowKey={(row) => row.id}
            pagination
            paginationConfig={paginationConfig}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            sortable
            sortConfig={sortConfig ?? undefined}
            onSortChange={handleSortChange}
            emptyMessage="This supplier has no purchase history yet."
          />
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No purchase orders
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a purchase order with this supplier.
            </p>
            <div className="mt-6">
              <Link
                href={`/${locale}/branch/purchases`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Purchases
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </RoleGuard>
  );
}
