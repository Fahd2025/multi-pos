/**
 * Expense Analytics Widget Component
 * Dashboard widget showing expense metrics and pending approvals
 */

"use client";

import { useState, useEffect } from "react";
import expenseService from "@/services/expense.service";
import { ExpenseDto, ExpenseCategoryDto } from "@/types/api.types";
import Link from "next/link";

export default function ExpenseAnalyticsWidget() {
  const [pendingCount, setPendingCount] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [topCategories, setTopCategories] = useState<ExpenseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExpenseAnalytics();
  }, []);

  const loadExpenseAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Load pending expenses count
      const pendingCountValue = await expenseService.getPendingExpensesCount();
      setPendingCount(pendingCountValue);

      // Load current month expenses (approved only)
      const monthlyExpenses = await expenseService.getExpenses({
        startDate: startOfMonth.toISOString().split("T")[0],
        endDate: endOfMonth.toISOString().split("T")[0],
        approvalStatus: 1, // Approved only
        pageSize: 1000, // Get all for calculation
      });

      // Calculate monthly total
      const total = monthlyExpenses.data.reduce((sum, expense) => sum + expense.amount, 0);
      setMonthlyTotal(total);

      // Load all categories with totals
      const categories = await expenseService.getExpenseCategories();

      // Sort by total expenses and take top 5
      const sorted = categories
        .filter((cat) => cat.totalExpenses && cat.totalExpenses > 0)
        .sort((a, b) => (b.totalExpenses ?? 0) - (a.totalExpenses ?? 0))
        .slice(0, 5);

      setTopCategories(sorted);
    } catch (err: any) {
      setError(err.message || "Failed to load expense analytics");
      console.error("Error loading expense analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800  rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800  rounded-lg shadow p-6">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800  rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Expense Overview</h3>
        <Link href="/en/branch/expenses" className="text-sm text-blue-600 hover:text-blue-800">
          View All →
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Pending Approvals */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm text-yellow-800 font-medium">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">{pendingCount}</div>
          <div className="text-xs text-yellow-700 mt-1">
            {pendingCount === 1 ? "expense" : "expenses"}
          </div>
        </div>

        {/* Monthly Total */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-800 font-medium">This Month</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">${monthlyTotal.toFixed(2)}</div>
          <div className="text-xs text-blue-700 mt-1">Approved expenses</div>
        </div>
      </div>

      {/* Top Categories */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Expense Categories</h4>

        {topCategories.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No expense data available yet</p>
        )}

        {topCategories.length > 0 && (
          <div className="space-y-3">
            {topCategories.map((category, index) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 w-4">#{index + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {category.nameEn}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.expenseCount ?? 0}{" "}
                      {category.expenseCount === 1 ? "expense" : "expenses"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    ${(category.totalExpenses ?? 0).toFixed(2)}
                  </div>
                  {category.budgetAllocation && (
                    <div className="text-xs text-gray-500">
                      of ${category.budgetAllocation.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/en/branch/expenses"
            className="text-center px-3 py-2 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
          >
            Manage Expenses
          </Link>
          <Link
            href="/en/branch/expense-categories"
            className="text-center px-3 py-2 bg-gray-50 text-gray-700 rounded text-sm hover:bg-gray-100"
          >
            Categories
          </Link>
        </div>
      </div>
    </div>
  );
}
