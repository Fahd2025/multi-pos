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
import { StatCard } from "@/components/shared";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/constants";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/RadixDialog";

export default function CustomersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { branch } = useAuth();

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerDto[]>([]); // For stats calculation
  const [loading, setLoading] = useState(true);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  // Filter states (input values)
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Applied filters (what's actually being used in the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    isActive: true,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | undefined>(undefined);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedCustomerImage, setSelectedCustomerImage] = useState<string>("");

  // Modal hooks
  const viewModal = useModal<CustomerDto>();
  const confirmation = useConfirmation();

  // DataTable hook (disabled client-side pagination since we use server-side)
  const {
    data: displayData,
    sortConfig,
    handleSort,
  } = useDataTable(customers, {
    pageSize: 20,
    sortable: true,
    pagination: false, // Disable client-side pagination
  });

  /**
   * Count active filters (based on applied filters, not input values)
   */
  const getActiveFilterCount = () => {
    let count = 0;
    if (!appliedFilters.isActive) count++; // Count if "show all" is active
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  /**
   * Check if any filters are active (based on applied filters, not input values)
   */
  const hasActiveFilters = activeFilterCount > 0 || !!appliedFilters.search;

  /**
   * Get active filter labels for display (based on applied filters)
   */
  const getActiveFilters = () => {
    const filters: { type: string; label: string; value: string }[] = [];

    if (appliedFilters.search) {
      filters.push({ type: "search", label: "Search", value: appliedFilters.search });
    }
    if (!appliedFilters.isActive) {
      filters.push({ type: "isActive", label: "Status", value: "All (Active & Inactive)" });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  /**
   * Load customers with server-side filtering and pagination
   */
  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /**
   * Load all customers for statistics (without filters)
   */
  useEffect(() => {
    loadAllCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCustomers = async () => {
    setLoading(true);

    const result = await executeWithErrorHandling(async () => {
      const response = await customerService.getCustomers({
        page: currentPage,
        pageSize,
        search: appliedFilters.search || undefined,
        isActive: appliedFilters.isActive ? true : undefined,
      });

      return response;
    });

    if (result) {
      setCustomers(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    }

    setLoading(false);
  };

  /**
   * Fetch all customers for statistics (without filters)
   */
  const loadAllCustomers = async () => {
    const result = await executeWithErrorHandling(async () => {
      const response = await customerService.getCustomers({ page: 1, pageSize: 10000 });
      return response;
    });

    if (result) {
      setAllCustomers(result.data || []);
    }
  };

  /**
   * Apply filters (called by Apply Filters button)
   */
  const handleApplyFilters = () => {
    // Save the current filter values as applied filters
    setAppliedFilters({
      search: searchTerm,
      isActive: showActiveOnly,
    });
    setCurrentPage(1);
    // Will trigger loadCustomers via useEffect
    setTimeout(() => loadCustomers(), 0);
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = async () => {
    // Reset all filter states
    setSearchTerm("");
    setShowActiveOnly(true);
    setAppliedFilters({
      search: "",
      isActive: true,
    });
    setCurrentPage(1);

    // Fetch with empty filters
    setLoading(true);
    const result = await executeWithErrorHandling(async () => {
      const response = await customerService.getCustomers({ page: 1, pageSize });
      return response;
    });

    if (result) {
      setCustomers(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    }

    setLoading(false);
  };

  /**
   * Remove individual filter
   */
  const handleRemoveFilter = async (filterType: string) => {
    // Reset the specific filter in both input and applied states
    switch (filterType) {
      case "search":
        setSearchTerm("");
        setAppliedFilters((prev) => ({ ...prev, search: "" }));
        break;
      case "isActive":
        setShowActiveOnly(true);
        setAppliedFilters((prev) => ({ ...prev, isActive: true }));
        break;
    }

    // Reset to first page and trigger refetch
    setCurrentPage(1);

    // Build updated filters for immediate fetch
    const updatedFilters = {
      page: 1,
      pageSize,
      search: filterType === "search" ? undefined : searchTerm || undefined,
      isActive: filterType === "isActive" ? true : showActiveOnly ? true : undefined,
    };

    // Fetch with updated filters immediately
    setLoading(true);
    const result = await executeWithErrorHandling(async () => {
      const response = await customerService.getCustomers(updatedFilters);
      return response;
    });

    if (result) {
      setCustomers(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    }

    setLoading(false);
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
          loadAllCustomers(); // Update stats
        }
      },
      "danger"
    );
  };

  /**
   * Handle page change (convert from 0-based to 1-based)
   */
  const handlePageChangeWrapper = (page: number) => {
    setCurrentPage(page + 1); // Convert back to 1-based
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
      label: "Customer Name",
      sortable: true,

      render: (value, row) => (
        <Link
          href={`/${locale}/branch/customers/${row.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
          {row.nameAr && <div className="text-sm text-gray-500">{row.nameAr}</div>}
        </Link>
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
    // {
    //   key: "email",
    //   label: "Email",
    //   sortable: true,
    //   render: (value) => value || "-",
    // },
    // {
    //   key: "phone",
    //   label: "Phone",
    //   sortable: true,
    //   render: (value) => value || "-",
    // },
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Customers"
          value={allCustomers.length}
          icon="👥"
          iconBgColor="bg-blue-100 dark:bg-blue-900/20"
        />
        <StatCard
          title="Active Customers"
          value={allCustomers.filter((c) => c.isActive).length}
          icon="✅"
          iconBgColor="bg-green-100 dark:bg-green-900/20"
          valueColor="text-green-600 dark:text-green-500"
        />
        <StatCard
          title="Total Purchases"
          value={`$${allCustomers.reduce((sum, c) => sum + c.totalPurchases, 0).toFixed(2)}`}
          icon="💰"
          iconBgColor="bg-purple-100 dark:bg-purple-900/20"
          valueColor="text-purple-600 dark:text-purple-500"
        />
        <StatCard
          title="Avg. Loyalty Points"
          value={allCustomers.length > 0
            ? Math.round(allCustomers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0) / allCustomers.length)
            : 0
          }
          icon="⭐"
          iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
          valueColor="text-yellow-600 dark:text-yellow-500"
        />
      </div>

      {/* Active Filters Display - Full Width */}
      {!loading && !isError && activeFilters.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-5 py-3 mb-6">
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
          loading={loading}
          pagination
          paginationConfig={{
            currentPage: currentPage - 1, // Convert to 0-based for DataTable
            totalPages,
            pageSize,
            totalItems,
          }}
          onPageChange={handlePageChangeWrapper}
          sortable
          sortConfig={sortConfig ?? undefined}
          onSortChange={handleSortChange}
          emptyMessage="No customers found. Click 'Add Customer' to create one."
          showRowNumbers
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
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <div className="flex items-center h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showActiveOnly}
                        onChange={(e) => setShowActiveOnly(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                        Show Active Only
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          }
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
        onSuccess={() => {
          loadCustomers();
          loadAllCustomers(); // Update stats
        }}
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
