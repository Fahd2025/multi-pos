/**
 * Sales Management Page
 * Comprehensive sales dashboard with statistics, transaction management, and quick actions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SalesStatistics from '@/components/sales/SalesStatistics';
import SalesTable from '@/components/sales/SalesTable';
import NewInvoiceModal from '@/components/sales/NewInvoiceModal';
import ProductGridModal from '@/components/sales/ProductGridModal';
import { ProductDto, SaleDto } from '@/types/api.types';

export default function SalesPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();

  // Modal states
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showProductGridModal, setShowProductGridModal] = useState(false);

  // Date filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Refresh trigger for table
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewInvoiceSuccess = (sale: SaleDto) => {
    setShowNewInvoiceModal(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGoToPOS = () => {
    router.push('/branch/sales/pos');
  };

  const handleProductSelect = (product: ProductDto) => {
    // When product is selected from grid, go to POS with the product
    // For now, just navigate to POS
    router.push('/branch/sales/pos');
  };

  const handleDateFilterChange = () => {
    // Trigger statistics refresh when date filter changes
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Sales Management
              </h1>
              <p className="text-gray-600 mt-1">
                Track sales performance and manage transactions
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGoToPOS}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-95"
              >
                <span className="mr-2 text-xl">🛒</span>
                Go to Point of Sale
              </button>
              <button
                onClick={() => setShowNewInvoiceModal(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-95"
              >
                <span className="mr-2 text-xl">📄</span>
                New Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleDateFilterChange}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Sales Statistics */}
        <div className="mb-6 md:mb-8">
          <SalesStatistics
            dateFrom={dateFrom}
            dateTo={dateTo}
            onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </div>

        {/* Quick Actions Cards (Mobile Friendly) */}
        <div className="mb-6 md:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <button
            onClick={handleGoToPOS}
            className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 md:p-5 text-center transition-all hover:shadow-md touch-manipulation active:scale-95"
          >
            <span className="text-3xl md:text-4xl mb-2 block">🏪</span>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Full POS</h3>
            <p className="text-xs text-gray-500 mt-1">Complete interface</p>
          </button>

          <button
            onClick={() => setShowNewInvoiceModal(true)}
            className="bg-white border-2 border-gray-200 hover:border-green-500 rounded-lg p-4 md:p-5 text-center transition-all hover:shadow-md touch-manipulation active:scale-95"
          >
            <span className="text-3xl md:text-4xl mb-2 block">⚡</span>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Quick Invoice</h3>
            <p className="text-xs text-gray-500 mt-1">Fast entry</p>
          </button>

          <button
            onClick={() => setShowProductGridModal(true)}
            className="bg-white border-2 border-gray-200 hover:border-purple-500 rounded-lg p-4 md:p-5 text-center transition-all hover:shadow-md touch-manipulation active:scale-95"
          >
            <span className="text-3xl md:text-4xl mb-2 block">🎯</span>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Product Grid</h3>
            <p className="text-xs text-gray-500 mt-1">Visual selection</p>
          </button>

          <button
            onClick={() => router.push('/branch/reports')}
            className="bg-white border-2 border-gray-200 hover:border-orange-500 rounded-lg p-4 md:p-5 text-center transition-all hover:shadow-md touch-manipulation active:scale-95"
          >
            <span className="text-3xl md:text-4xl mb-2 block">📊</span>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Reports</h3>
            <p className="text-xs text-gray-500 mt-1">Analytics</p>
          </button>
        </div>

        {/* Sales Transactions Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Sales Transactions
            </h2>
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              🔄 Refresh
            </button>
          </div>
          <SalesTable refreshTrigger={refreshTrigger} />
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use <strong>Go to Point of Sale</strong> for full transaction interface with product search</li>
                <li>• Use <strong>New Invoice</strong> for quick sales with barcode scanner or dropdown</li>
                <li>• Use <strong>Product Grid</strong> for visual product selection with images</li>
                <li>• Click on any transaction in the table to view details</li>
                <li>• Use filters to search by date, payment method, and status</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewInvoiceModal
        isOpen={showNewInvoiceModal}
        onClose={() => setShowNewInvoiceModal(false)}
        onSuccess={handleNewInvoiceSuccess}
      />

      <ProductGridModal
        isOpen={showProductGridModal}
        onClose={() => setShowProductGridModal(false)}
        onProductSelect={handleProductSelect}
      />
    </div>
  );
}
