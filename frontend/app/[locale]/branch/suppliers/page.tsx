/**
 * Suppliers Management Page
 *
 * Branch managers can manage their suppliers with full CRUD operations
 * Displays supplier list with statistics, purchase history, and contact information
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { FeaturedDialog, ConfirmationDialog } from "@/components/modals";
import { useDataTable } from "@/hooks/useDataTable";
import { useModal, useConfirmation } from "@/hooks/useModal";
import { DataTableColumn, DataTableAction, DisplayField } from "@/types/data-table.types";
import { SupplierDto } from "@/types/api.types";
import supplierService from "@/services/supplier.service";
import SupplierFormModal from "@/components/suppliers/SupplierFormModal";
import { useAuth } from "@/hooks/useAuth";

export default function SuppliersPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { branch } = useAuth();

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDto | undefined>(undefined);

  // Initialize hooks
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(suppliers, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

  const viewModal = useModal<SupplierDto>();
  const confirmation = useConfirmation();

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await supplierService.getSuppliers({
        includeInactive: false,
        pageSize: 1000, // Load all for client-side filtering
      });
      setSuppliers(response.data);
    } catch (err) {
      setError("Failed to load suppliers. Please try again.");
      console.error("Error loading suppliers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof SupplierDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  // Define table columns
  const columns: DataTableColumn<SupplierDto>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      width: "100px",
      render: (value) => (
        <span className="font-mono text-sm font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: "nameEn",
      label: "Supplier Name",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.nameAr && <div className="text-sm text-gray-500">{row.nameAr}</div>}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Contact",
      render: (value, row) => (
        <div className="text-sm">
          {value && <div className="text-gray-900">{value}</div>}
          {row.email && <div className="text-gray-500">{row.email}</div>}
        </div>
      ),
    },
    {
      key: "totalPurchases",
      label: "Purchases",
      sortable: true,
      width: "100px",
      render: (value) => <span className="font-medium text-blue-600">{value}</span>,
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      sortable: true,
      width: "120px",
      render: (value) => (
        <span className="font-semibold text-gray-900">
          ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "lastPurchaseDate",
      label: "Last Purchase",
      sortable: true,
      width: "130px",
      render: (value) => {
        if (!value) return <span className="text-gray-400">Never</span>;
        const date = new Date(value);
        const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="text-sm">
            <div className="text-gray-900">{date.toLocaleDateString()}</div>
            <div className="text-gray-500">{daysSince} days ago</div>
          </div>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      width: "100px",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  // Define row actions
  const actions: DataTableAction<SupplierDto>[] = [
    {
      label: "View",
      onClick: (row) => viewModal.open(row, "view"),
      variant: "secondary",
    },
    {
      label: "Edit",
      onClick: (row) => {
        setSelectedSupplier(row);
        setIsModalOpen(true);
      },
      variant: "primary",
    },
    {
      label: "Delete",
      onClick: (row) => handleDeleteClick(row),
      variant: "danger",
    },
  ];

  // Define display fields
  const displayFields: DisplayField<SupplierDto>[] = [
    { key: "code", label: "Supplier Code" },
    { key: "nameEn", label: "Name (English)" },
    { key: "nameAr", label: "Name (Arabic)" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "addressEn", label: "Address (English)" },
    { key: "addressAr", label: "Address (Arabic)" },
    { key: "paymentTerms", label: "Payment Terms" },
    { key: "deliveryTerms", label: "Delivery Terms" },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "totalPurchases",
      label: "Total Purchases",
      render: (value) => <span className="font-medium text-blue-600">{value}</span>,
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      render: (value) => (
        <span className="font-semibold text-gray-900">
          ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "lastPurchaseDate",
      label: "Last Purchase Date",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "Never"),
    },
    {
      key: "createdAt",
      label: "Created Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  // Handlers
  const handleCreate = () => {
    setSelectedSupplier(undefined);
    setIsModalOpen(true);
  };

  const handleSuccess = async () => {
    await loadSuppliers();
    setIsModalOpen(false);
    setSelectedSupplier(undefined);
  };

  const handleDeleteClick = (supplier: SupplierDto) => {
    const hasHistory = supplier.totalPurchases > 0;
    const message = hasHistory
      ? `"${supplier.nameEn}" has ${
          supplier.totalPurchases
        } purchase(s) worth $${supplier.totalSpent.toFixed(
          2
        )}. The supplier will be marked as inactive instead of being permanently deleted.`
      : `Are you sure you want to delete "${supplier.nameEn}"? This action cannot be undone.`;

    confirmation.ask(
      "Delete Supplier",
      message,
      async () => {
        try {
          await supplierService.deleteSupplier(supplier.id);
          await loadSuppliers();
        } catch (err: any) {
          setError(err.message || "Failed to delete supplier");
          console.error("Error deleting supplier:", err);
        }
      },
      "danger"
    );
  };

  // Calculate statistics
  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.isActive).length,
    totalSpent: suppliers.reduce((sum, s) => sum + s.totalSpent, 0),
    totalPurchases: suppliers.reduce((sum, s) => sum + s.totalPurchases, 0),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Management</h1>
          <p className="text-gray-600">Manage your suppliers and track purchase history</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Suppliers</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Active Suppliers</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Purchases</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalPurchases}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-purple-600">
              $
              {stats.totalSpent.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Showing {displayData.length} of {suppliers.length} suppliers
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Supplier
          </button>
        </div>

        {/* DataTable */}
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
          emptyMessage="No suppliers found. Click 'Add Supplier' to create one."
        />
      </div>

      {/* Modals */}
      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(undefined);
        }}
        onSuccess={handleSuccess}
        supplier={selectedSupplier}
        branchName={branch?.branchCode || ""}
      />

      <FeaturedDialog
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        title="Supplier Details"
        data={viewModal.data || ({} as SupplierDto)}
        fields={displayFields}
        actions={[
          {
            label: "Edit",
            onClick: (data) => {
              viewModal.close();
              setSelectedSupplier(data);
              setIsModalOpen(true);
            },
            variant: "primary",
          },
          {
            label: "Delete",
            onClick: (data) => {
              viewModal.close();
              handleDeleteClick(data);
            },
            variant: "danger",
          },
        ]}
        size="lg"
      />

      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmation.confirm}
        isProcessing={confirmation.isProcessing}
      />
    </div>
  );
}
