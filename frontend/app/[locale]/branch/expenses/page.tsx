/**
 * Expense Management Page
 * Expense list with filtering, approval workflow, and CRUD operations
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import expenseService from "@/services/expense.service";
import { ExpenseDto, ExpenseCategoryDto } from "@/types/api.types";
import ExpenseFormModal from "@/components/expenses/ExpenseFormModal";
import { ConfirmationDialog } from "@/components/modals";
import { useConfirmation } from "@/hooks/useModal";
import { Button } from "@/components/shared/Button";
import { StatusBadge, getApprovalStatusVariant } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { DataTable } from "@/components/data-table";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/constants";
import { ImageCarousel } from "@/components/shared/ui/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/ui/dialog";

export default function ExpensesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { branch } = useAuth();

  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDto | undefined>(undefined);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedExpenseImage, setSelectedExpenseImage] = useState<string>("");

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
  } = useDataTable(expenses, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

  /**
   * Load expenses and categories
   */
  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories (for filter dropdown)
      const categoriesData = await expenseService.getExpenseCategories();
      setCategories(categoriesData);

      // Load expenses
      // Note: API supports pagination. For client-side DataTable, we fetch a larger set or adapt.
      // Previous code used server-side pagination: page: currentPage, pageSize: pageSize
      // Here we will fetch a reasonable amount for client-side handling or we should implement server-side DataTable.
      // Given the "replace with example page" instruction, and example page uses client-side DataTable hook,
      // we'll fetch a larger set (e.g. 1000) or just the first page if we assume limited data.
      // Let's fetch more to be safe for client-side sorting/pagination.
      const response = await expenseService.getExpenses({
        page: 1,
        pageSize: 1000,
        categoryId: categoryFilter || undefined,
        approvalStatus: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setExpenses(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    // Filters are applied via useEffect dependencies
    loadData();
  };

  const handleEdit = (expense: ExpenseDto) => {
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
          loadData();
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
          loadData();
        } catch (err: any) {
          setError(err.message || `Failed to ${approved ? "approve" : "reject"} expense`);
        }
      },
      approved ? "success" : "warning"
    );
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
              setSelectedExpense(undefined);
              setIsModalOpen(true);
            }}
          >
            ➕ Add Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {locale === "ar" ? cat.nameAr : cat.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter ?? ""}
              onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="0">Pending</option>
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            ></input>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            ></input>
          </div>
          <div className="flex items-end">
            <Button onClick={handleApplyFilters} variant="secondary" isFullWidth>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

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
          pagination
          paginationConfig={paginationConfig}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          sortable
          sortConfig={sortConfig ?? undefined}
          onSortChange={handleSortChange}
          emptyMessage="No expenses found. Add your first expense to get started."
          showRowNumbers
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
          }}
        />
      )}

      {/* Expense Form Modal */}
      {isModalOpen && (
        <ExpenseFormModal
          isOpen={isModalOpen}
          expense={selectedExpense}
          categories={categories}
          branchName={branch?.branchCode || ""}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedExpense(undefined);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedExpense(undefined);
            loadData();
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
  );
}
