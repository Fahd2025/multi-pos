/**
 * Multi-Branch Analytics Page
 * Consolidated analytics and reports across all branches
 */

'use client';

import { use } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Multi-Branch Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Consolidated performance metrics across all branches
        </p>
      </div>

      {/* Placeholder for Analytics */}
      <EmptyState
        icon="📈"
        title="Analytics Coming Soon"
        message="Multi-branch analytics with consolidated sales, inventory, and revenue charts will be available once User Story 1 (Sales) and User Story 2 (Inventory) data is available across branches."
      />

      {/* Preview of Future Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Analytics Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Sales Analytics
            </h3>
            <span className="text-2xl">💳</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track sales performance across all branches with real-time metrics
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <li>• Total sales by branch</li>
            <li>• Revenue trends over time</li>
            <li>• Top-performing products</li>
            <li>• Payment method breakdowns</li>
          </ul>
        </div>

        {/* Inventory Analytics Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Inventory Analytics
            </h3>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor inventory levels and movements across branches
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <li>• Stock levels by branch</li>
            <li>• Low stock alerts</li>
            <li>• Product turnover rates</li>
            <li>• Inventory value totals</li>
          </ul>
        </div>

        {/* Financial Analytics Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Financial Analytics
            </h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive financial reporting and analysis
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <li>• Revenue vs expenses</li>
            <li>• Profit margins by branch</li>
            <li>• Tax calculations</li>
            <li>• Cost breakdowns</li>
          </ul>
        </div>

        {/* Customer Analytics Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Customer Analytics
            </h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customer behavior and loyalty insights
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <li>• Total customers by branch</li>
            <li>• Customer acquisition trends</li>
            <li>• Average transaction value</li>
            <li>• Repeat customer rates</li>
          </ul>
        </div>

        {/* Branch Performance Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Branch Performance
            </h3>
            <span className="text-2xl">🏢</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Compare performance metrics across branches
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <li>• Sales rankings</li>
            <li>• Efficiency metrics</li>
            <li>• User activity levels</li>
            <li>• Growth trends</li>
          </ul>
        </div>

        {/* Reports & Exports Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Reports & Exports
            </h3>
            <span className="text-2xl">📄</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate and export detailed reports
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <li>• PDF report generation</li>
            <li>• Excel export options</li>
            <li>• CSV data exports</li>
            <li>• Scheduled reports</li>
          </ul>
        </div>
      </div>

      {/* Implementation Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📌 Implementation Note
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          These analytics features will be implemented in Phase 11 (Reporting & Analytics) after
          the core user stories are complete. The analytics will aggregate data from:
        </p>
        <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
          <li>User Story 1: Sales Operations (Phase 3)</li>
          <li>User Story 2: Inventory Management (Phase 4)</li>
          <li>User Story 3: Customer Management (Phase 5)</li>
          <li>User Story 4: Expense Tracking (Phase 6)</li>
        </ul>
      </div>
    </div>
  );
}
