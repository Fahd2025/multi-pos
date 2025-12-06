/**
 * Customer Details Page
 * Shows customer profile, statistics, and purchase history
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import customerService from "@/services/customer.service";
import { CustomerDto, SaleDto } from "@/types/api.types";
import Link from "next/link";
import CustomerFormModal from "@/components/branch/customers/CustomerFormModal";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirmation } from "@/hooks/useModal";
import { DataTableColumn } from "@/types/data-table.types";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";

export default function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const router = useRouter();
  const { branch } = useAuth();

  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Hooks
  const confirmation = useConfirmation();

  // DataTable hook for purchase history
  const {
    data: displayHistory,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(purchaseHistory, {
    pageSize: 10,
    sortable: true,
    pagination: true,
  });

  /**
   * Load customer details
   */
  useEffect(() => {
    loadCustomer();
  }, [id]);

  /**
   * Load purchase history
   */
  useEffect(() => {
    loadPurchaseHistory();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomerById(id);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || "Failed to load customer details");
      console.error("Error loading customer:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      setHistoryLoading(true);
      // Note: We are loading all history or a page. The API supports pagination.
      // To work with client-side DataTable, we might want to load more or adapt.
      // Previous code: await customerService.getCustomerPurchaseHistory(id, { page: currentPage, pageSize });
      // Let's fetch the first page or a reasonable amount for now, similar to purchases page decision.
      const response = await customerService.getCustomerPurchaseHistory(id, {
        page: 1,
        pageSize: 100, // Fetch more for client-side table
      });
      setPurchaseHistory(response.data);
    } catch (err: any) {
      console.error("Error loading purchase history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    confirmation.ask(
      "Delete Customer",
      `Are you sure you want to delete "${customer.nameEn}"? This action cannot be undone.`,
      async () => {
        try {
          await customerService.deleteCustomer(id);
          router.push(`/${locale}/branch/customers`);
        } catch (err: any) {
          setError(`Failed to delete customer: ${err.message}`);
        }
      },
      "danger"
    );
  };

  // Define columns for purchase history
  const historyColumns: DataTableColumn<SaleDto>[] = [
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (value, row) => (
        <Link
          href={`/${locale}/branch/sales/${row.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {value}
        </Link>
      ),
    },
    {
      key: "lineItems",
      label: "Items",
      sortable: false, // Array not sortable by default
      render: (value) => `${value?.length || 0} items`,
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      key: "paymentMethod",
      label: "Payment",
      sortable: true,
      render: (value) => (value === 0 ? "Cash" : value === 1 ? "Card" : "Other"),
    },
    {
      key: "isVoided",
      label: "Status",
      sortable: true,
      render: (value) => (
        <StatusBadge variant={value ? "danger" : "success"}>
          {value ? "Voided" : "Completed"}
        </StatusBadge>
      ),
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: { key: keyof SaleDto | string; direction: "asc" | "desc" }) => {
    handleSort(config.key);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner size="lg" text="Loading customer details..." />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <ErrorAlert message={error || "Customer not found"} />
        <Link href={`/${locale}/branch/customers`}>
          <Button variant="secondary" size="md" className="mt-4">
            ← Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {customer.nameEn}
            </h1>
            <StatusBadge variant={customer.isActive ? "success" : "danger"}>
              {customer.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          </div>
          {customer.nameAr && <p className="text-lg text-gray-600">{customer.nameAr}</p>}
          <p className="text-gray-500 font-mono mt-1">{customer.code}</p>
        </div>

        <button
          onClick={() => router.push(`/${locale}/branch/customers`)}
          className="px-4 py-2 text-gray-700 bg-white dark:bg-gray-800  border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ← Back to Customers
        </button>

        {/* <div className="flex gap-2">
          <Button variant="primary" size="md" onClick={() => setIsEditModalOpen(true)}>
            Edit
          </Button>
          <Button variant="danger" size="md" onClick={handleDelete}>
            Delete
          </Button>
        </div> */}
      </div>

      {/* Customer Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Profile Information */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800  rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            )}
            {customer.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            )}
            {customer.addressEn && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address (English)</p>
                <p className="font-medium">{customer.addressEn}</p>
              </div>
            )}
            {customer.addressAr && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address (Arabic)</p>
                <p className="font-medium" dir="rtl">
                  {customer.addressAr}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium">{new Date(customer.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white dark:bg-gray-800  rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Customer Statistics</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-green-600">
                ${customer.totalPurchases.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Visit Count</p>
              <p className="text-2xl font-bold text-blue-600">{customer.visitCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loyalty Points</p>
              <p className="text-2xl font-bold text-purple-600">{customer.loyaltyPoints}</p>
            </div>
            {customer.lastVisitAt && (
              <div>
                <p className="text-sm text-gray-600">Last Visit</p>
                <p className="font-medium">{new Date(customer.lastVisitAt).toLocaleDateString()}</p>
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
        ) : purchaseHistory.length > 0 ? (
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
            emptyMessage="This customer has not made any purchases yet."
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
              No sales orders
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a sales order with this customer.
            </p>
            <div className="mt-6">
              <Link
                href={`/${locale}/branch/sales`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Sales
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <CustomerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          loadCustomer();
          setIsEditModalOpen(false);
        }}
        customer={customer}
        branchName={branch?.branchCode || ""}
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
