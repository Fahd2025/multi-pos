/**
 * Expense Categories Management Page
 * Manage expense categories with budget allocations
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import expenseService from "@/services/expense.service";
import { ExpenseCategoryDto } from "@/types/api.types";
import { Button } from "@/components/shared/Button";
import { DataTable } from "@/components/data-table";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumn } from "@/types/data-table.types";

export default function ExpenseCategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);

  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [showInactive, setShowInactive] = useState(false);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    nameEn: "",
    nameAr: "",
    budgetAllocation: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  // DataTable hook
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(categories, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

  /**
   * Load expense categories
   */
  useEffect(() => {
    loadCategories();
  }, [showInactive]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await expenseService.getExpenseCategories(showInactive);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to load expense categories");
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = "Category code is required";
    } else if (formData.code.length > 20) {
      errors.code = "Code cannot exceed 20 characters";
    }

    if (!formData.nameEn.trim()) {
      errors.nameEn = "English name is required";
    } else if (formData.nameEn.length > 100) {
      errors.nameEn = "Name cannot exceed 100 characters";
    }

    if (!formData.nameAr.trim()) {
      errors.nameAr = "Arabic name is required";
    } else if (formData.nameAr.length > 100) {
      errors.nameAr = "Name cannot exceed 100 characters";
    }

    if (
      formData.budgetAllocation &&
      (isNaN(Number(formData.budgetAllocation)) || Number(formData.budgetAllocation) < 0)
    ) {
      errors.budgetAllocation = "Budget must be a positive number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      await expenseService.createExpenseCategory({
        code: formData.code,
        nameEn: formData.nameEn,
        nameAr: formData.nameAr,
        budgetAllocation: formData.budgetAllocation ? Number(formData.budgetAllocation) : undefined,
      });

      // Reset form and reload categories
      setFormData({ code: "", nameEn: "", nameAr: "", budgetAllocation: "" });
      setIsFormOpen(false);
      loadCategories();
    } catch (err: any) {
      setError(err.message || "Failed to create expense category");
    } finally {
      setFormLoading(false);
    }
  };

  const getBudgetStatus = (category: ExpenseCategoryDto) => {
    if (!category.budgetAllocation || !category.totalExpenses) {
      return null;
    }

    const usedPercent = (category.totalExpenses / category.budgetAllocation) * 100;

    if (usedPercent >= 100) {
      return (
        <span className="text-red-600 font-semibold">Over budget ({usedPercent.toFixed(0)}%)</span>
      );
    } else if (usedPercent >= 80) {
      return (
        <span className="text-orange-600 font-semibold">
          Near limit ({usedPercent.toFixed(0)}%)
        </span>
      );
    } else {
      return <span className="text-green-600">Within budget ({usedPercent.toFixed(0)}%)</span>;
    }
  };

  // Define columns
  const columns: DataTableColumn<ExpenseCategoryDto>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (value) => <div className="font-medium">{value}</div>,
    },
    {
      key: "nameEn",
      label: "Name (EN)",
      sortable: true,
    },
    {
      key: "nameAr",
      label: "Name (AR)",
      sortable: true,
      render: (value) => <div dir="rtl">{value}</div>,
    },
    {
      key: "budgetAllocation",
      label: "Budget",
      sortable: true,
      render: (value) => (value ? `$${value.toFixed(2)}` : "No budget"),
    },
    {
      key: "totalExpenses",
      label: "Total Expenses",
      sortable: true,
      render: (value) => <div className="font-medium">${(value ?? 0).toFixed(2)}</div>,
    },
    {
      key: "expenseCount",
      label: "Count",
      sortable: true,
      render: (value) => `${value ?? 0} expenses`,
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value, row) => (
        <div>
          {value ? (
            <span className="text-green-600">Active</span>
          ) : (
            <span className="text-gray-500">Inactive</span>
          )}
          {row.budgetAllocation && <div className="mt-1">{getBudgetStatus(row)}</div>}
        </div>
      ),
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof ExpenseCategoryDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 ">
            Expense Category Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Organize expenses into categories with budget allocations
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/branch/expenses`}>
            <Button variant="secondary" size="md">
              ← Back to Expenses
            </Button>
          </Link>
          <Button variant="primary" size="md" onClick={() => setIsFormOpen(true)}>
            ➕ Add Category
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="mr-2"
          />
          Show Inactive Categories
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <div className="text-center py-8">Loading categories...</div>}

      {/* Categories DataTable */}
      {!loading && (
        <DataTable
          data={displayData}
          columns={columns}
          getRowKey={(row) => row.id}
          pagination
          paginationConfig={paginationConfig}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          sortable
          sortConfig={sortConfig ?? undefined}
          onSortChange={handleSortChange}
          emptyMessage="No expense categories found. Add your first category to get started."
        />
      )}

      {/* Create Category Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Add Expense Category</h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setFormData({ code: "", nameEn: "", nameAr: "", budgetAllocation: "" });
                  setValidationErrors({});
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="RENT"
                    className={`w-full border rounded px-3 py-2 ${
                      validationErrors.code ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors.code && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.code}</p>
                  )}
                </div>

                {/* Name (English) */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="Rent & Utilities"
                    className={`w-full border rounded px-3 py-2 ${
                      validationErrors.nameEn ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors.nameEn && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.nameEn}</p>
                  )}
                </div>

                {/* Name (Arabic) */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name (Arabic) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="إيجار ومرافق"
                    dir="rtl"
                    className={`w-full border rounded px-3 py-2 ${
                      validationErrors.nameAr ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors.nameAr && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.nameAr}</p>
                  )}
                </div>

                {/* Budget Allocation */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monthly Budget Allocation
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budgetAllocation}
                    onChange={(e) => setFormData({ ...formData, budgetAllocation: e.target.value })}
                    placeholder="1000.00"
                    className={`w-full border rounded px-3 py-2 ${
                      validationErrors.budgetAllocation ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors.budgetAllocation && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.budgetAllocation}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Optional budget limit for this category
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({ code: "", nameEn: "", nameAr: "", budgetAllocation: "" });
                    setValidationErrors({});
                  }}
                  disabled={formLoading}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {formLoading ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
