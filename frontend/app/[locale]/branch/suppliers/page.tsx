/**
 * Suppliers Management Page
 *
 * Branch managers can manage their suppliers with full CRUD operations
 * Displays supplier list with statistics, purchase history, and contact information
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DataTable,
  StatCard,
  ConfirmationDialog,
  FeaturedDialog,
  ActiveFiltersBadge,
  SearchInput,
} from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useModal } from "@/hooks/useModal";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useApiOperation } from "@/hooks/useApiOperation";
import { useTableFilters } from "@/hooks/useTableFilters";
import { DataTableColumn, DataTableAction, DisplayField } from "@/types/data-table.types";
import { SupplierDto } from "@/types/api.types";
import supplierService from "@/services/supplier.service";
import SupplierFormModal from "@/components/branch/suppliers/SupplierFormModal";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/constants";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/RadixDialog";
import Link from "next/link";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/shared/Button";
import { XCircle, X } from "lucide-react";

export default function SuppliersPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { branch } = useAuth();
  const { canManage } = usePermission();

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<SupplierDto[]>([]); // For stats calculation
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDto | undefined>(undefined);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedSupplierImage, setSelectedSupplierImage] = useState<string>("");

  // Table filters using useTableFilters hook
  const filters = useTableFilters({
    filterDefinitions: [
      { type: "search", label: "Search", defaultValue: "" },
      {
        type: "isActive",
        label: "Status",
        defaultValue: true,
        getDisplayValue: (val: boolean) => (val ? "" : "All (Active & Inactive)"),
      },
    ],
    onFiltersChange: () => setCurrentPage(1),
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  // Initialize hooks
  const {
    data: displayData,
    sortConfig,
    handleSort,
  } = useDataTable(suppliers, {
    pageSize: 20,
    sortable: true,
    pagination: false, // Disable client-side pagination
  });

  const viewModal = useModal<SupplierDto>();
  const confirmation = useConfirmation();
  const { execute } = useApiOperation();

  /**
   * Load suppliers with server-side filtering and pagination
   */
  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.appliedFilters]);

  /**
   * Load all suppliers for statistics (without filters)
   */
  useEffect(() => {
    loadAllSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await supplierService.getSuppliers({
        page: currentPage,
        pageSize,
        searchTerm: filters.appliedFilters.search || undefined,
        includeInactive: !filters.appliedFilters.isActive,
      });
      setSuppliers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError("Failed to load suppliers. Please try again.");
      console.error("Error loading suppliers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch all suppliers for statistics (without filters)
   */
  const loadAllSuppliers = async () => {
    try {
      const response = await supplierService.getSuppliers({ page: 1, pageSize: 10000 });
      setAllSuppliers(response.data || []);
    } catch (err) {
      console.error("Failed to load all suppliers for stats:", err);
    }
  };

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof SupplierDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  /**
   * Construct image URL for supplier logos
   */
  const getSupplierImageUrl = (
    imageId: string,
    supplierId: string,
    size: "thumb" | "medium" | "large" | "original" = "thumb"
  ) => {
    const branchCode = branch?.branchCode || "B001";
    return `${API_BASE_URL}/api/v1/images/${branchCode}/suppliers/${imageId}/${size}`;
  };

  // Define table columns
  const columns: DataTableColumn<SupplierDto>[] = [
    // {
    //   key: "code",
    //   label: "Code",
    //   sortable: true,
    //   width: "100px",
    //   render: (value) => (
    //     <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
    //       {value}
    //     </span>
    //   ),
    // },
    {
      key: "nameEn",
      label: "Supplier Name",
      sortable: true,

      render: (value, row) => (
        <Link
          href={`/${locale}/branch/suppliers/${row.id}`}
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
    {
      key: "totalPurchases",
      label: "Purchases",
      sortable: true,
      width: "100px",
      render: (value) => <span className="font-medium text-blue-600">{value}</span>,
    },
    // {
    //   key: "totalSpent",
    //   label: "Total Spent",
    //   sortable: true,
    //   width: "120px",
    //   render: (value) => (
    //     <span className="font-semibold text-gray-900 dark:text-gray-100">
    //       ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    //     </span>
    //   ),
    // },
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
        <span className="font-semibold text-gray-900 dark:text-gray-100">
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

  /**
   * Handle page change (convert from 0-based to 1-based)
   */
  const handlePageChangeWrapper = (page: number) => {
    setCurrentPage(page + 1); // Convert back to 1-based
  };

  // Handlers
  const handleCreate = () => {
    setSelectedSupplier(undefined);
    setIsModalOpen(true);
  };

  const handleSuccess = async () => {
    await loadSuppliers();
    await loadAllSuppliers(); // Update stats
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
        await execute({
          operation: () => supplierService.deleteSupplier(supplier.id),
          successMessage: "Supplier deleted",
          successDetail: `${supplier.nameEn} has been removed successfully`,
          onSuccess: async () => {
            await loadSuppliers();
            await loadAllSuppliers(); // Update stats
          },
        });
      },
      "danger"
    );
  };

  // Calculate statistics (based on all suppliers, not filtered)
  const stats = {
    total: allSuppliers.length,
    active: allSuppliers.filter((s) => s.isActive).length,
    totalSpent: allSuppliers.reduce((sum, s) => sum + s.totalSpent, 0),
    totalPurchases: allSuppliers.reduce((sum, s) => sum + s.totalPurchases, 0),
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
            Only Managers can access Supplier Management.
          </p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>Go to Dashboard</Button>
        </div>
      }
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Supplier Management
            </h1>
            <p className="text-gray-600">Manage your suppliers and track purchase history</p>
          </div>
          <Button
            variant="default"
            size="default"
            onClick={() => {
              setSelectedSupplier(undefined);
              setIsModalOpen(true);
            }}
          >
            + Add Supplier
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <XCircle
              className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
              aria-label="Dismiss error"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Suppliers"
            value={stats.total}
            icon="🏢"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
          />
          <StatCard
            title="Active Suppliers"
            value={stats.active}
            icon="✅"
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            valueColor="text-green-600 dark:text-green-500"
          />
          <StatCard
            title="Total Purchases"
            value={stats.totalPurchases}
            icon="📦"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            valueColor="text-blue-600 dark:text-blue-500"
          />
          <StatCard
            title="Total Spent"
            value={`$${stats.totalSpent.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon="💵"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            valueColor="text-purple-600 dark:text-purple-500"
          />
        </div>

        {/* Active Filters Display - Full Width */}
        {!isLoading && !error && (
          <div className="mb-6">
            <ActiveFiltersBadge
              filters={filters.activeFilters}
              onRemove={filters.removeFilter}
              onClearAll={filters.resetFilters}
            />
          </div>
        )}

        {/* DataTable */}
        <DataTable
          data={displayData}
          columns={columns}
          actions={actions}
          getRowKey={(row) => row.id}
          loading={isLoading}
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
          emptyMessage="No suppliers found. Click 'Add Supplier' to create one."
          showRowNumbers
          showFilterButton
          activeFilterCount={filters.activeFilterCount}
          showResetButton={filters.hasActiveFilters}
          onResetFilters={filters.resetFilters}
          searchBar={
            <SearchInput
              value={filters.filterValues.search}
              onChange={(val) => filters.setFilterValue("search", val)}
              onSearch={filters.applyFilters}
              placeholder="Search by name, code, email, phone..."
            />
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
                        checked={filters.filterValues.isActive}
                        onChange={(e) => filters.setFilterValue("isActive", e.target.checked)}
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
                <Button variant="primary" onClick={filters.applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          }
          imageColumn={{
            getImageUrl: (row) =>
              row.logoPath ? getSupplierImageUrl(row.logoPath, row.id, "large") : "",
            getAltText: (row) => row.nameEn,
            onImageClick: (row, images) => {
              if (images[0]) {
                setSelectedSupplierImage(images[0]);
                setIsImageCarouselOpen(true);
              }
            },
            size: 64,
            defaultIcon: "🏢",
          }}
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
        mode="edit"
        fields={[]}
        onSubmit={() => {
          if (viewModal.data) {
            viewModal.close();
            setSelectedSupplier(viewModal.data);
            setIsModalOpen(true);
          }
        }}
        submitLabel="Edit"
        showSubmitButton={true}
        cancelLabel="Close"
        size="lg"
        additionalContent={
          <div className="space-y-4">
            {viewModal.data &&
              displayFields.map((field) => (
                <div
                  key={field.key.toString()}
                  className="grid grid-cols-3 gap-4 border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0"
                >
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {field.label}
                  </div>
                  <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">
                    {field.render
                      ? field.render(
                          viewModal.data![field.key as keyof SupplierDto],
                          viewModal.data!
                        )
                      : String(viewModal.data![field.key as keyof SupplierDto] || "-")}
                  </div>
                </div>
              ))}

            {/* Additional actions that were in FeaturedDialog can be placed here as buttons if needed, 
              but Edit is now the primary action. Delete was secondary, we can add a danger button here if really needed. */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-start">
              <button
                type="button"
                onClick={() => {
                  if (viewModal.data) {
                    viewModal.close();
                    handleDeleteClick(viewModal.data);
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
              >
                Delete Supplier
              </button>
            </div>
          </div>
        }
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

      {/* Image Carousel Modal */}
      <Dialog open={isImageCarouselOpen} onOpenChange={setIsImageCarouselOpen}>
        <DialogContent className="max-w-4xl p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">Supplier Logo</DialogTitle>
          <ImageCarousel
            images={[selectedSupplierImage]}
            alt="Supplier logo"
            className="w-full h-[600px]"
          />
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
