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
import CustomerFormModal from "@/components/branch/customers/CustomerFormModal";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useModal, useConfirmation } from "@/hooks/useModal";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/constants";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/RadixDialog";

export default function CustomersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { branch } = useAuth();

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

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
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedCustomerImage, setSelectedCustomerImage] = useState<string>("");

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
    setLoading(true);

    const result = await executeWithErrorHandling(async () => {
      const response = await customerService.getCustomers({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        isActive: showActiveOnly ? true : undefined,
      });

      return response;
    });

    if (result) {
      setCustomers(result.data);
      setTotalPages(result.pagination.totalPages);
    }

    setLoading(false);
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
        const result = await executeWithErrorHandling(async () => {
          return await customerService.deleteCustomer(customer.id);
        });

        if (result) {
          loadCustomers();
        }
      },
      "danger"
    );
  };

  /**
   * Construct image URL for customer logos
   */
  const getCustomerImageUrl = (
    imageId: string,
    customerId: string,
    size: "thumb" | "medium" | "large" | "original" = "thumb"
  ) => {
    const branchCode = branch?.branchCode || "B001";
    return `${API_BASE_URL}/api/v1/images/${branchCode}/customers/${imageId}/${size}`;
  };

  // Define table columns
  const columns: DataTableColumn<CustomerDto>[] = [
    // {
    //   key: "code",
    //   label: "Code",
    //   sortable: true,
    //   width: "100px",
    // },
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
    // {
    //   key: "visitCount",
    //   label: "Visit Count",
    //   sortable: true,
    // },
    // {
    //   key: "loyaltyPoints",
    //   label: "Loyalty Points",
    //   sortable: true,
    // },
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
    <div>
      <div className="flex justify-between items-center mb-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Customers Management
          </h1>
          <p className="text-gray-600">Manage your customers and track sales history</p>
        </div>
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
      <div className="bg-white dark:bg-gray-800  p-4 rounded shadow mb-6">
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
      {isError && <ApiErrorAlert error={error} onRetry={loadCustomers} onDismiss={clearError} />}

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
          showRowNumbers
          imageColumn={{
            getImageUrl: (row) =>
              row.logoPath ? getCustomerImageUrl(row.logoPath, row.id, "large") : "",
            getAltText: (row) => row.nameEn,
            onImageClick: (row, images) => {
              if (images[0]) {
                setSelectedCustomerImage(images[0]);
                setIsImageCarouselOpen(true);
              }
            },
            size: 64,
            defaultIcon: "👤",
          }}
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

      {/* View Customer Modal */}
      {viewModal.isOpen && viewModal.data && (
        <Dialog open={viewModal.isOpen} onOpenChange={() => viewModal.close()}>
          <DialogContent className="max-w-2xl">
            <DialogTitle className="text-xl font-bold mb-4">Customer Details</DialogTitle>
            <div className="space-y-4">
              {/* Customer Logo */}
              {viewModal.data.logoPath && (
                <div className="flex justify-center mb-6">
                  <img
                    src={getCustomerImageUrl(viewModal.data.logoPath, viewModal.data.id, "large")}
                    alt={viewModal.data.nameEn}
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
              )}

              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Name (English)
                  </label>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                    {viewModal.data.nameEn}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Name (Arabic)
                  </label>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                    {viewModal.data.nameAr || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Email
                  </label>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {viewModal.data.email || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Phone
                  </label>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {viewModal.data.phone || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Address
                  </label>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {viewModal.data.addressEn || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </label>
                  <div className="mt-1">
                    <StatusBadge variant={viewModal.data.isActive ? "success" : "danger"}>
                      {viewModal.data.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </div>
                </div>
              </div>

              {/* Purchase Statistics */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Purchase Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <label className="block text-xs font-medium text-blue-600 dark:text-blue-400">
                      Total Purchases
                    </label>
                    <p className="mt-1 text-xl font-bold text-blue-900 dark:text-blue-100">
                      ${viewModal.data.totalPurchases.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <label className="block text-xs font-medium text-green-600 dark:text-green-400">
                      Visit Count
                    </label>
                    <p className="mt-1 text-xl font-bold text-green-900 dark:text-green-100">
                      {viewModal.data.visitCount || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                    <label className="block text-xs font-medium text-purple-600 dark:text-purple-400">
                      Loyalty Points
                    </label>
                    <p className="mt-1 text-xl font-bold text-purple-900 dark:text-purple-100">
                      {viewModal.data.loyaltyPoints || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {/* {viewModal.data.notes && (
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Notes</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{viewModal.data.notes}</p>
                </div>
              )} */}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t pt-4 mt-4">
                <Button variant="secondary" size="md" onClick={() => viewModal.close()}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    viewModal.close();
                    handleEdit(viewModal.data!);
                  }}
                >
                  Edit Customer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Carousel Modal */}
      <Dialog open={isImageCarouselOpen} onOpenChange={setIsImageCarouselOpen}>
        <DialogContent className="max-w-4xl p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">Customer Logo</DialogTitle>
          <ImageCarousel
            images={[selectedCustomerImage]}
            alt="Customer logo"
            className="w-full h-[600px]"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
