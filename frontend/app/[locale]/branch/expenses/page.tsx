/**
 * Expense Management Page
 * Expense list with filtering, approval workflow, and CRUD operations
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import expenseService from "@/services/expense.service";
import { ExpenseDto, ExpenseCategoryDto } from "@/types/api.types";
import ExpenseFormModal from "@/components/branch/expenses/ExpenseFormModal";
import { ConfirmationDialog } from "@/components/shared";
import { useConfirmation } from "@/hooks/useModal";
import { Button } from "@/components/shared/Button";
import { StatusBadge, getApprovalStatusVariant } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { StatCard } from "@/components/shared";
import { DataTable } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/constants";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/RadixDialog";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";

export default function ExpensesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const { branch } = useAuth();
  const { canManage } = usePermission();

  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseDto[]>([]); // For stats calculation
  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states (input values)
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Applied filters (what's actually being used in the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    category: "",
    status: undefined as number | undefined,
    startDate: "",
    endDate: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDto | undefined>(undefined);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedExpenseImage, setSelectedExpenseImage] = useState<string>("");

  // Hooks
  const confirmation = useConfirmation();

  // DataTable hook (disabled client-side pagination since we use server-side)
  const {
    data: displayData,
    sortConfig,
    handleSort,
  } = useDataTable(expenses, {
    pageSize: 20,
    sortable: true,
    pagination: false, // Disable client-side pagination
  });

  /**
   * Count active filters (based on applied filters, not input values)
   */
  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.category) count++;
    if (appliedFilters.status !== undefined) count++;
    if (appliedFilters.startDate) count++;
    if (appliedFilters.endDate) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  /**
   * Check if any filters are active (based on applied filters, not input values)
   */
  const hasActiveFilters = activeFilterCount > 0;

  /**
   * Get active filter labels for display (based on applied filters)
   */
  const getActiveFilters = () => {
    const filters: { type: string; label: string; value: string }[] = [];

    if (appliedFilters.category) {
      const category = categories.find((c) => c.id === appliedFilters.category);
      filters.push({
        type: "category",
        label: "Category",
        value: category?.nameEn || appliedFilters.category,
      });
    }
    if (appliedFilters.status !== undefined) {
      filters.push({
        type: "status",
        label: "Status",
        value: getStatusLabel(appliedFilters.status),
      });
    }
    if (appliedFilters.startDate) {
      filters.push({
        type: "startDate",
        label: "From",
        value: new Date(appliedFilters.startDate).toLocaleDateString(),
      });
    }
    if (appliedFilters.endDate) {
      filters.push({
        type: "endDate",
        label: "To",
        value: new Date(appliedFilters.endDate).toLocaleDateString(),
      });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  /**
   * Load expenses with server-side filtering and pagination
   */
  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /**
   * Load categories on mount
   */
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load all expenses for statistics (without filters)
   */
  useEffect(() => {
    loadAllExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await expenseService.getExpenseCategories();
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseService.getExpenses({
        page: currentPage,
        pageSize,
        categoryId: appliedFilters.category || undefined,
        approvalStatus: appliedFilters.status,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });

      setExpenses(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all expenses for statistics (without filters)
   */
  const loadAllExpenses = async () => {
    try {
      const response = await expenseService.getExpenses({ page: 1, pageSize: 10000 });
      setAllExpenses(response.data || []);
    } catch (err: any) {
      console.error("Failed to load all expenses for stats:", err);
    }
  };

  /**
   * Apply filters (called by Apply Filters button)
   */
  const handleApplyFilters = () => {
    // Save the current filter values as applied filters
    setAppliedFilters({
      category: categoryFilter,
      status: statusFilter,
      startDate: startDate,
      endDate: endDate,
    });
    setCurrentPage(1);
    // Will trigger loadExpenses via useEffect
    setTimeout(() => loadExpenses(), 0);
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = async () => {
    // Reset all filter states
    setCategoryFilter("");
    setStatusFilter(undefined);
    setStartDate("");
    setEndDate("");
    setAppliedFilters({
      category: "",
      status: undefined,
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);

    // Fetch with empty filters
    try {
      setLoading(true);
      setError(null);
      const response = await expenseService.getExpenses({ page: 1, pageSize });
      setExpenses(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove individual filter
   */
  const handleRemoveFilter = async (filterType: string) => {
    // Reset the specific filter in both input and applied states
    switch (filterType) {
      case "category":
        setCategoryFilter("");
        setAppliedFilters((prev) => ({ ...prev, category: "" }));
        break;
      case "status":
        setStatusFilter(undefined);
        setAppliedFilters((prev) => ({ ...prev, status: undefined }));
        break;
      case "startDate":
        setStartDate("");
        setAppliedFilters((prev) => ({ ...prev, startDate: "" }));
        break;
      case "endDate":
        setEndDate("");
        setAppliedFilters((prev) => ({ ...prev, endDate: "" }));
        break;
    }

    // Reset to first page and trigger refetch
    setCurrentPage(1);

    // Build updated filters for immediate fetch
    const updatedFilters = {
      page: 1,
      pageSize,
      categoryId:
        filterType === "category" ? undefined : categoryFilter || undefined,
      approvalStatus: filterType === "status" ? undefined : statusFilter,
      startDate: filterType === "startDate" ? undefined : startDate || undefined,
      endDate: filterType === "endDate" ? undefined : endDate || undefined,
    };

    // Fetch with updated filters immediately
    try {
      setLoading(true);
      setError(null);
      const response = await expenseService.getExpenses(updatedFilters);
      setExpenses(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: ExpenseDto) => {
    if (!branch || !branch.branchCode) {
      alert("Branch information is not available. Please refresh the page.");
      return;
    }
    // Only allow editing of pending expenses
    if (expense.approvalStatus !== 0) {
      setError("Only pending expenses can be edited");
      return;
    }
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async (expenseId: string, expense: ExpenseDto) => {
    // Only allow deleting of pending expenses
    if (expense.approvalStatus !== 0) {
      setError("Only pending expenses can be deleted");
      return;
    }

    confirmation.ask(
      "Delete Expense",
      "Are you sure you want to delete this expense? This action cannot be undone.",
      async () => {
        try {
          await expenseService.deleteExpense(expenseId);
          loadExpenses();
          loadAllExpenses(); // Update stats
        } catch (err: any) {
          setError(err.message || "Failed to delete expense");
        }
      },
      "danger"
    );
  };

  const handleApprove = async (expenseId: string, approved: boolean) => {
    confirmation.ask(
      approved ? "Approve Expense" : "Reject Expense",
      `Are you sure you want to ${approved ? "approve" : "reject"} this expense?`,
      async () => {
        try {
          await expenseService.approveExpense(expenseId, approved);
          loadExpenses();
          loadAllExpenses(); // Update stats
        } catch (err: any) {
          setError(err.message || `Failed to ${approved ? "approve" : "reject"} expense`);
        }
      },
      approved ? "success" : "warning"
    );
  };

  /**
   * Handle page change (convert from 0-based to 1-based)
   */
  const handlePageChangeWrapper = (page: number) => {
    setCurrentPage(page + 1); // Convert back to 1-based
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Approved";
      case 2:
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const getPaymentMethodLabel = (method: number) => {
    switch (method) {
      case 0:
        return "Cash";
      case 1:
        return "Card";
      case 2:
        return "Bank Transfer";
      case 3:
        return "Other";
      default:
        return "Unknown";
    }
  };

  /**
   * Construct image URL for expense receipt images
   */
  const getExpenseImageUrl = (
    imageId: string,
    expenseId: string,
    size: "thumb" | "medium" | "large" | "original" = "thumb"
  ) => {
    const branchCode = branch?.branchCode || "B001";
    return `${API_BASE_URL}/api/v1/images/${branchCode}/expenses/${imageId}/${size}`;
  };

  // Define columns
  const columns: DataTableColumn<ExpenseDto>[] = [
    {
      key: "expenseDate",
      label: "Date",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "categoryNameEn",
      label: "Category",
      sortable: true,
      render: (value, row) => (locale === "ar" ? row.categoryNameAr : value),
    },
    {
      key: "descriptionEn",
      label: "Description",
      sortable: true,
      render: (value, row) => (
        <div className="max-w-xs truncate">
          {locale === "ar" && row.descriptionAr ? row.descriptionAr : value}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value) => <span className="font-medium">${value.toFixed(2)}</span>,
    },
    {
      key: "paymentMethod",
      label: "Payment",
      sortable: true,
      render: (value) => getPaymentMethodLabel(value),
    },
    {
      key: "approvalStatus",
      label: "Status",
      sortable: true,
      render: (value, row) => (
        <div>
          <StatusBadge variant={getApprovalStatusVariant(value)}>
            {getStatusLabel(value)}
          </StatusBadge>
          {value !== 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {value === 1 ? "Approved" : "Rejected"} on{" "}
              {row.approvedAt ? new Date(row.approvedAt).toLocaleDateString() : "N/A"}
            </div>
          )}
        </div>
      ),
    },
  ];

  // Define actions
  const actions: DataTableAction<ExpenseDto>[] = [
    {
      label: "✏️ Edit",
      onClick: (row) => handleEdit(row),
      variant: "primary",
      condition: (row) => row.approvalStatus === 0,
    },
    {
      label: "✓ Approve",
      onClick: (row) => handleApprove(row.id, true),
      variant: "success",
      condition: (row) => row.approvalStatus === 0,
    },
    {
      label: "✗ Reject",
      onClick: (row) => handleApprove(row.id, false),
      variant: "secondary", // Using secondary for reject to distinguish from delete
      condition: (row) => row.approvalStatus === 0,
    },
    {
      label: "🗑️ Delete",
      onClick: (row) => handleDelete(row.id, row),
      variant: "danger",
      condition: (row) => row.approvalStatus === 0,
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof ExpenseDto | string;
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
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Only Managers can access Expense Management.</p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>
            Go to Dashboard
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Expense Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage business expenses with approval workflow
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/branch/expense-categories`}>
            <Button variant="secondary" size="md">
              📁 Manage Categories
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (!branch || !branch.branchCode) {
                alert("Branch information is not available. Please refresh the page.");
                return;
              }
              setSelectedExpense(undefined);
              setIsModalOpen(true);
            }}
          >
            ➕ Add Expense
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Expenses"
          value={allExpenses.length}
          icon="💸"
          iconBgColor="bg-red-100 dark:bg-red-900/20"
        />
        <StatCard
          title="Pending Approval"
          value={allExpenses.filter((e) => e.approvalStatus === 0).length}
          icon="⏳"
          iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
          valueColor="text-yellow-600 dark:text-yellow-500"
        />
        <StatCard
          title="Approved"
          value={allExpenses.filter((e) => e.approvalStatus === 1).length}
          icon="✅"
          iconBgColor="bg-green-100 dark:bg-green-900/20"
          valueColor="text-green-600 dark:text-green-500"
        />
        <StatCard
          title="Total Amount"
          value={`$${allExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}`}
          icon="💰"
          iconBgColor="bg-purple-100 dark:bg-purple-900/20"
          valueColor="text-purple-600 dark:text-purple-500"
        />
      </div>

      {/* Active Filters Display - Full Width */}
      {!loading && !error && activeFilters.length > 0 && (
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
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading expenses..." className="py-8" />}

      {/* Expenses DataTable */}
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
          emptyMessage="No expenses found. Add your first expense to get started."
          showRowNumbers
          showFilterButton
          activeFilterCount={activeFilterCount}
          showResetButton={hasActiveFilters}
          onResetFilters={handleResetFilters}
          filterSection={
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {locale === "ar" ? cat.nameAr : cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter ?? ""}
                    onChange={(e) =>
                      setStatusFilter(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="0">Pending</option>
                    <option value="1">Approved</option>
                    <option value="2">Rejected</option>
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  />
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
              row.receiptImagePath ? getExpenseImageUrl(row.receiptImagePath, row.id, "large") : "",
            getAltText: (row) => `Receipt for ${row.descriptionEn}`,
            onImageClick: (row, images) => {
              if (images[0]) {
                setSelectedExpenseImage(images[0]);
                setIsImageCarouselOpen(true);
              }
            },
            size: 64,
            defaultIcon: "🧾",
          }}
        />
      )}

      {/* Expense Form Modal */}
      {isModalOpen && branch && branch.branchCode && (
        <ExpenseFormModal
          isOpen={isModalOpen}
          expense={selectedExpense}
          categories={categories}
          branchName={branch.branchCode}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedExpense(undefined);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedExpense(undefined);
            loadExpenses();
            loadAllExpenses(); // Update stats
          }}
        />
      )}

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
          <DialogTitle className="sr-only">Expense Receipt</DialogTitle>
          <ImageCarousel
            images={[selectedExpenseImage]}
            alt="Expense receipt"
            className="w-full h-[600px]"
          />
        </DialogContent>
      </Dialog>
      </div>
    </RoleGuard>
  );
}
