/**
 * Expense Management Page
 * Expense list with filtering, approval workflow, and CRUD operations
 */

'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import expenseService from '@/services/expense.service';
import { ExpenseDto, ExpenseCategoryDto } from '@/types/api.types';
import ExpenseFormModal from '@/components/expenses/ExpenseFormModal';
import { Button } from '@/components/shared/Button';
import { StatusBadge, getApprovalStatusVariant } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog } from '@/components/shared/Dialog';
import { ConfirmationDialog } from '@/components/modals/ConfirmationDialog';
import { useDialog } from '@/hooks/useDialog';
import { useConfirmation } from '@/hooks/useModal';

export default function ExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDto | undefined>(undefined);

  // Dialog hooks
  const dialog = useDialog();
  const confirmation = useConfirmation();

  /**
   * Load expenses and categories
   */
  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories (for filter dropdown)
      const categoriesData = await expenseService.getExpenseCategories();
      setCategories(categoriesData);

      // Load expenses
      const response = await expenseService.getExpenses({
        page: currentPage,
        pageSize,
        categoryId: categoryFilter || undefined,
        approvalStatus: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setExpenses(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadData();
  };

  const handleEdit = (expense: ExpenseDto) => {
    // Only allow editing of pending expenses
    if (expense.approvalStatus !== 0) {
      dialog.warning('Only pending expenses can be edited');
      return;
    }
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async (expenseId: string, expense: ExpenseDto) => {
    // Only allow deleting of pending expenses
    if (expense.approvalStatus !== 0) {
      dialog.warning('Only pending expenses can be deleted');
      return;
    }

    confirmation.ask(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      async () => {
        try {
          await expenseService.deleteExpense(expenseId);
          loadData();
        } catch (err: any) {
          dialog.error(err.message || 'Failed to delete expense');
        }
      },
      'danger'
    );
  };

  const handleApprove = async (expenseId: string, approved: boolean) => {
    confirmation.ask(
      approved ? 'Approve Expense' : 'Reject Expense',
      `Are you sure you want to ${approved ? 'approve' : 'reject'} this expense?`,
      async () => {
        try {
          await expenseService.approveExpense(expenseId, approved);
          loadData();
        } catch (err: any) {
          dialog.error(err.message || `Failed to ${approved ? 'approve' : 'reject'} expense`);
        }
      },
      approved ? 'success' : 'warning'
    );
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getPaymentMethodLabel = (method: number) => {
    switch (method) {
      case 0:
        return 'Cash';
      case 1:
        return 'Card';
      case 2:
        return 'Bank Transfer';
      case 3:
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button
          onClick={() => {
            setSelectedExpense(undefined);
            setIsModalOpen(true);
          }}
          variant="primary"
        >
          + Add Expense
        </Button>
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
                  {locale === 'ar' ? cat.nameAr : cat.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter ?? ''}
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleApplyFilters}
              variant="secondary"
              isFullWidth
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading expenses..." className="py-8" />}

      {/* Empty State */}
      {!loading && expenses.length === 0 && (
        <EmptyState
          title="No expenses found"
          message="Add your first expense to get started."
        />
      )}

      {!loading && expenses.length > 0 && (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {locale === 'ar' ? expense.categoryNameAr : expense.categoryNameEn}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="max-w-xs truncate">
                      {locale === 'ar' && expense.descriptionAr
                        ? expense.descriptionAr
                        : expense.descriptionEn}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getPaymentMethodLabel(expense.paymentMethod)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge variant={getApprovalStatusVariant(expense.approvalStatus)}>
                      {getStatusLabel(expense.approvalStatus)}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {expense.approvalStatus === 0 && (
                        <>
                          <Button
                            onClick={() => handleEdit(expense)}
                            variant="ghost"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(expense.id, expense)}
                            variant="ghost"
                            size="sm"
                          >
                            Delete
                          </Button>
                          <Button
                            onClick={() => handleApprove(expense.id, true)}
                            variant="ghost"
                            size="sm"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleApprove(expense.id, false)}
                            variant="ghost"
                            size="sm"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {expense.approvalStatus !== 0 && (
                        <span className="text-gray-400 text-xs">
                          {expense.approvalStatus === 1 ? 'Approved' : 'Rejected'} on{' '}
                          {expense.approvedAt
                            ? new Date(expense.approvedAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="secondary"
            size="sm"
          >
            Previous
          </Button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {/* Expense Form Modal */}
      {isModalOpen && (
        <ExpenseFormModal
          expense={selectedExpense}
          categories={categories}
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

      {/* Alert Dialog */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={dialog.handleClose}
        onConfirm={dialog.showCancel ? undefined : dialog.handleClose}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel}
        isLoading={dialog.isProcessing}
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
