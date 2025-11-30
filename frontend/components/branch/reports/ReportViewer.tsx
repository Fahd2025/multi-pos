'use client';

import React from 'react';
import {
  SalesReport,
  InventoryReport,
  FinancialReport,
  reportService,
} from '@/services/report.service';

interface ReportViewerProps {
  reportType: 'sales' | 'inventory' | 'financial';
  reportData: SalesReport | InventoryReport | FinancialReport | null;
  loading?: boolean;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
}

export default function ReportViewer({
  reportType,
  reportData,
  loading = false,
  onExport,
}: ReportViewerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Generating report...</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center p-12 text-gray-500">
        <p>No report data available. Please select filters and generate a report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {reportType} Report
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Generated: {new Date(reportData.generatedAt).toLocaleString()}
            </p>
          </div>

          {onExport && (
            <div className="flex gap-2">
              <button
                onClick={() => onExport('pdf')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={() => onExport('excel')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Excel
              </button>
              <button
                onClick={() => onExport('csv')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'sales' && <SalesReportContent report={reportData as SalesReport} />}
      {reportType === 'inventory' && (
        <InventoryReportContent report={reportData as InventoryReport} />
      )}
      {reportType === 'financial' && (
        <FinancialReportContent report={reportData as FinancialReport} />
      )}
    </div>
  );
}

// ============================================
// Sales Report Component
// ============================================

function SalesReportContent({ report }: { report: SalesReport }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Sales" value={report.summary.totalSales.toString()} />
        <SummaryCard
          label="Total Revenue"
          value={`$${report.summary.totalRevenue.toFixed(2)}`}
        />
        <SummaryCard
          label="Total Tax"
          value={`$${report.summary.totalTax.toFixed(2)}`}
        />
        <SummaryCard
          label="Average Sale"
          value={`$${report.summary.averageSaleValue.toFixed(2)}`}
        />
      </div>

      {/* Time Series Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sales Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg Sale
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.timeSeriesData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.salesCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.totalRevenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.averageSaleValue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      {report.topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {report.topProducts.map((product, idx) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{product.productName}</p>
                  <p className="text-sm text-gray-500">Sold: {product.quantitySold} units</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${product.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Customers */}
      {report.topCustomers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <div className="space-y-3">
            {report.topCustomers.map((customer, idx) => (
              <div
                key={customer.customerId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{customer.customerName}</p>
                  <p className="text-sm text-gray-500">
                    {customer.purchaseCount} purchases
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${customer.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Inventory Report Component
// ============================================

function InventoryReportContent({ report }: { report: InventoryReport }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Products" value={report.summary.totalProducts.toString()} />
        <SummaryCard
          label="Stock Value"
          value={`$${report.summary.totalStockValue.toFixed(2)}`}
        />
        <SummaryCard label="Low Stock" value={report.summary.lowStockCount.toString()} alert />
        <SummaryCard
          label="Negative Stock"
          value={report.summary.negativeStockCount.toString()}
          alert={report.summary.negativeStockCount > 0}
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Products</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.products.map((product) => (
                <tr key={product.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.stockValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={product.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Financial Report Component
// ============================================

function FinancialReportContent({ report }: { report: FinancialReport }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Revenue"
          value={`$${report.summary.totalRevenue.toFixed(2)}`}
        />
        <SummaryCard
          label="Total Expenses"
          value={`$${report.summary.totalExpenses.toFixed(2)}`}
        />
        <SummaryCard
          label="Gross Profit"
          value={`$${report.summary.grossProfit.toFixed(2)}`}
        />
        <SummaryCard
          label="Profit Margin"
          value={`${report.summary.profitMargin.toFixed(2)}%`}
        />
      </div>

      {/* Time Series */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Financial Trend</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.timeSeriesData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.expenses.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.profit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.profitMargin.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Breakdown */}
      {report.expenseBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            {report.expenseBreakdown.map((expense, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{expense.categoryName}</p>
                  <p className="text-sm text-gray-500">{expense.percentage.toFixed(2)}%</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${expense.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Reusable Components
// ============================================

function SummaryCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-6 border ${
        alert ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}
    >
      <p className={`text-sm ${alert ? 'text-red-600' : 'text-gray-600'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-2 ${alert ? 'text-red-900' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'In Stock': 'bg-green-100 text-green-800',
    'Low Stock': 'bg-yellow-100 text-yellow-800',
    'Out of Stock': 'bg-red-100 text-red-800',
    'Negative Stock': 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        colors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
}
