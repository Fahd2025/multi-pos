/**
 * Expense Service
 * Frontend service for expense management and approval operations
 */

import api from './api';
import { ExpenseDto, CreateExpenseDto, ExpenseCategoryDto, PaginationResponse, ApiResponse } from '@/types/api.types';

/**
 * Expense filter parameters
 */
export interface ExpenseFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  approvalStatus?: number; // 0=Pending, 1=Approved, 2=Rejected
}

/**
 * Expense category creation parameters
 */
export interface CreateExpenseCategoryDto {
  code: string;
  nameEn: string;
  nameAr: string;
  budgetAllocation?: number;
}

/**
 * Expense approval request
 */
export interface ApproveExpenseRequest {
  approved: boolean;
}

/**
 * Expense Service
 * Handles all expense-related API operations
 */
class ExpenseService {
  /**
   * Get expenses with filtering and pagination
   */
  async getExpenses(filters: ExpenseFilters = {}): Promise<PaginationResponse<ExpenseDto>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.approvalStatus !== undefined) {
      params.append('approvalStatus', filters.approvalStatus.toString());
    }
    if (filters.search) params.append('search', filters.search);

    const response = await api.get<PaginationResponse<ExpenseDto>>(
      `/api/v1/expenses?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<ExpenseDto> {
    const response = await api.get<ExpenseDto>(`/api/v1/expenses/${id}`);
    return response.data;
  }

  /**
   * Create a new expense
   */
  async createExpense(expense: CreateExpenseDto): Promise<ExpenseDto> {
    const response = await api.post<ApiResponse<ExpenseDto>>('/api/v1/expenses', expense);
    return response.data.data!;
  }

  /**
   * Update an existing expense (only pending expenses can be updated)
   */
  async updateExpense(id: string, expense: CreateExpenseDto): Promise<ExpenseDto> {
    const response = await api.put<ApiResponse<ExpenseDto>>(`/api/v1/expenses/${id}`, expense);
    return response.data.data!;
  }

  /**
   * Delete an expense (only pending expenses can be deleted)
   */
  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/api/v1/expenses/${id}`);
  }

  /**
   * Approve or reject an expense (Manager only)
   */
  async approveExpense(id: string, approved: boolean): Promise<ExpenseDto> {
    const response = await api.post<ApiResponse<ExpenseDto>>(
      `/api/v1/expenses/${id}/approve`,
      { approved }
    );
    return response.data.data!;
  }

  /**
   * Get all expense categories
   */
  async getExpenseCategories(includeInactive: boolean = false): Promise<ExpenseCategoryDto[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await api.get<ApiResponse<ExpenseCategoryDto[]>>(`/api/v1/expense-categories${params}`);
    return response.data.data || [];
  }

  /**
   * Create a new expense category
   */
  async createExpenseCategory(category: CreateExpenseCategoryDto): Promise<ExpenseCategoryDto> {
    const response = await api.post<ApiResponse<ExpenseCategoryDto>>('/api/v1/expense-categories', category);
    return response.data.data!;
  }

  /**
   * Get pending expenses count
   * Convenience method for dashboard widgets
   */
  async getPendingExpensesCount(): Promise<number> {
    const response = await this.getExpenses({
      approvalStatus: 0, // Pending
      pageSize: 1,
    });

    return response.pagination.totalItems;
  }

  /**
   * Get expenses by approval status
   * Convenience method for filtering by status
   */
  async getExpensesByStatus(
    status: 'pending' | 'approved' | 'rejected',
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginationResponse<ExpenseDto>> {
    const statusMap = {
      pending: 0,
      approved: 1,
      rejected: 2,
    };

    return this.getExpenses({
      approvalStatus: statusMap[status],
      page,
      pageSize,
    });
  }
}

// Export singleton instance
const expenseService = new ExpenseService();
export default expenseService;
