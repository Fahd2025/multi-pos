/**
 * Branches Management Page
 * List, search, filter, and manage all branches
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import branchService, { BranchDto } from "@/services/branch.service";
import { BranchFormModal } from "@/components/head-office/BranchFormModal";
import { DataTable } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { useConfirmation } from "@/hooks/useModal";
import { ConfirmationDialog } from "@/components/shared";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/RadixDialog";
import { API_BASE_URL } from "@/lib/constants";

export default function BranchesManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDto | undefined>(undefined);

  // Image carousel states
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedBranchImage, setSelectedBranchImage] = useState<string>("");

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
  } = useDataTable(branches, {
    pageSize: pageSize,
    sortable: true,
    pagination: true,
  });

  useEffect(() => {
    loadBranches();
  }, [currentPage, search, filterActive]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await branchService.getBranches({
        page: currentPage,
        pageSize,
        search: search || undefined,
        isActive: filterActive,
      });

      setBranches(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (err: any) {
      setError(err.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleFilterChange = (active: boolean | undefined) => {
    setFilterActive(active);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleDelete = async (branch: BranchDto) => {
    confirmation.ask(
      "Delete Branch",
      `Are you sure you want to delete branch "${branch.nameEn}"? This action cannot be undone.`,
      async () => {
        try {
          await branchService.deleteBranch(branch.id);
          loadBranches(); // Reload the list
        } catch (err: any) {
          setError(`Failed to delete branch: ${err.message}`);
        }
      },
      "danger"
    );
  };

  /**
   * Construct image URL for branch logos
   */
  const getBranchImageUrl = (
    imageId: string,
    branchCode: string,
    size: "thumb" | "medium" | "large" | "original" = "thumb"
  ) => {
    return `${API_BASE_URL}/api/v1/images/${branchCode}/branches/${imageId}/${size}`;
  };

  // Define table columns
  const columns: DataTableColumn<BranchDto>[] = [
    {
      key: "nameEn",
      label: "Branch",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.loginName}</div>
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (value) => <div className="text-sm text-gray-900 dark:text-gray-100">{value}</div>,
    },
    {
      key: "databaseProvider",
      label: "Database",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {branchService.getDatabaseProviderName(value)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.dbName}</div>
        </div>
      ),
    },
    {
      key: "userCount",
      label: "Users",
      sortable: true,
      render: (value) => <div className="text-sm text-gray-900 dark:text-gray-100">{value}</div>,
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span
          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value
              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  // Define row actions
  const actions: DataTableAction<BranchDto>[] = [
    {
      label: "View",
      onClick: (row) => {
        window.location.href = `/${locale}/head-office/branches/${row.id}`;
      },
      variant: "primary",
    },
    {
      label: "Edit",
      onClick: (row) => {
        setEditingBranch(row);
      },
      variant: "secondary",
    },
    {
      label: "Delete",
      onClick: (row) => handleDelete(row),
      variant: "danger",
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof BranchDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Branch Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage all branches and their configurations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Create Branch
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800  rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by code, name, or login name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800  dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange(undefined)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === undefined
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === true
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleFilterChange(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === false
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {branches.length} of {totalItems} branches
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading branches...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
          <button
            onClick={loadBranches}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Branches DataTable */}
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
          emptyMessage={
            search || filterActive !== undefined
              ? "No branches found. Try adjusting your search or filters."
              : 'No branches found. Click "Create Branch" to create one.'
          }
          showRowNumbers
          imageColumn={{
            getImageUrl: (row) =>
              row.logoPath ? getBranchImageUrl(row.logoPath, row.code, "large") : "",
            getAltText: (row) => row.nameEn,
            onImageClick: (row, images) => {
              if (images[0]) {
                setSelectedBranchImage(images[0]);
                setIsImageCarouselOpen(true);
              }
            },
            size: 64,
            defaultIcon: "🏪",
          }}
        />
      )}

      {/* Create/Edit Modal */}
      <BranchFormModal
        isOpen={showCreateModal || !!editingBranch}
        onClose={() => {
          setShowCreateModal(false);
          setEditingBranch(undefined);
        }}
        onSuccess={() => {
          loadBranches();
          setShowCreateModal(false);
          setEditingBranch(undefined);
        }}
        branch={editingBranch}
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

      {/* Image Carousel Modal */}
      <Dialog open={isImageCarouselOpen} onOpenChange={setIsImageCarouselOpen}>
        <DialogContent className="max-w-4xl p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">Branch Logo</DialogTitle>
          <ImageCarousel
            images={[selectedBranchImage]}
            alt="Branch logo"
            className="w-full h-[600px]"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
