/**
 * Customer Management Page
 * Customer list with search, filters, and CRUD operations
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import customerService from "@/services/customer.service";
import { CustomerDto } from "@/types/api.types";
import Link from "next/link";
import CustomerFormModal from "@/components/customers/CustomerFormModal";
import { DataTable } from "@/components/data-table";
import { ModalBottomSheet, FeaturedDialog, ConfirmationDialog } from "@/components/modals";
import { useDataTable } from "@/hooks/useDataTable";
import { useModal, useConfirmation } from "@/hooks/useModal";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CustomersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | undefined>(undefined);

  // Modal hooks
  const viewModal = useModal<CustomerDto>();
  const confirmation = useConfirmation();

  // DataTable hook
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(customers, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

  /**
   * Load customers
   */
  useEffect(() => {
    loadCustomers();
  }, [currentPage, showActiveOnly]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await customerService.getCustomers({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        isActive: showActiveOnly ? true : undefined,
      });

      setCustomers(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadCustomers();
  };

  const handleEdit = (customer: CustomerDto) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (customer: CustomerDto) => {
    confirmation.ask(
      "Delete Customer",
      `Are you sure you want to delete "${customer.nameEn}"? This action cannot be undone.`,
      async () => {
        try {
          await customerService.deleteCustomer(customer.id);
          loadCustomers();
        } catch (err: any) {
          setError(`Failed to delete customer: ${err.message}`);
        }
      },
      "danger"
    );
  };

  // Define table columns
  const columns: DataTableColumn<CustomerDto>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      width: "100px",
    },
    {
      key: "nameEn",
      label: "Name",
      sortable: true,
      render: (value, row) => (
        <Link
          href={`/${locale}/branch/customers/${row.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {value}
        </Link>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (value) => value || "-",
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (value) => value || "-",
    },
    {
      key: "totalPurchases",
      label: "Total Purchases",
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      key: "visitCount",
      label: "Visit Count",
      sortable: true,
    },
    {
      key: "loyaltyPoints",
      label: "Loyalty Points",
      sortable: true,
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value) => (
        <StatusBadge variant={value ? "success" : "danger"}>
          {value ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
  ];

  // Define row actions
  const actions: DataTableAction<CustomerDto>[] = [
    {
      label: "View",
      onClick: (row) => viewModal.open(row, "view"),
      variant: "secondary",
    },
    {
      label: "Edit",
      onClick: (row) => handleEdit(row),
      variant: "primary",
    },
    {
      label: "Delete",
      onClick: (row) => handleDelete(row),
      variant: "danger",
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof CustomerDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setSelectedCustomer(undefined);
            setIsModalOpen(true);
          }}
        >
          + Add Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, code, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="mr-2"
              />
              Show Active Only
            </label>
          </div>
          <div>
            <Button variant="secondary" size="md" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading customers..." />}

      {/* Customers DataTable */}
      {!loading && (
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
          emptyMessage="No customers found. Click 'Add Customer' to create one."
        />
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(undefined);
        }}
        onSuccess={loadCustomers}
        customer={selectedCustomer}
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
