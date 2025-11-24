/**
 * Branch Dashboard Home Page
 * Overview of branch operations with key metrics
 */

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import salesService from '@/services/sales.service';
import inventoryService from '@/services/inventory.service';
import { SalesStatsDto } from '@/types/api.types';

export default function BranchHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<SalesStatsDto | null>(null);
  const [inventoryStats, setInventoryStats] = useState({ lowStock: 0, totalProducts: 0, totalCategories: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale } = use(params);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
      return;
    }

    if (user) {
      loadStats();
    }
  }, [user, isLoading, router, locale]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const dateFrom = firstDayOfMonth.toISOString().split('T')[0];
      const dateTo = today.toISOString().split('T')[0];

      console.log('Requesting stats with dates:', { dateFrom, dateTo });

      // Load sales stats
      const statsData = await salesService.getSalesStats({
        dateFrom,
        dateTo,
      });

      setStats(statsData);

      // Load inventory stats
      const [lowStockCount, totalProductsCount, totalCategoriesCount] = await Promise.all([
        inventoryService.getLowStockCount(),
        inventoryService.getTotalProductsCount(),
        inventoryService.getTotalCategoriesCount(),
      ]);

      setInventoryStats({
        lowStock: lowStockCount,
        totalProducts: totalProductsCount,
        totalCategories: totalCategoriesCount,
      });

      setError(null);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to load statistics';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.fullNameEn || user?.username}
          </p>
        </div>
        <button
          onClick={() => router.push(`/${locale}/branch/sales`)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
        >
          💳 New Sale
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Sales */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${stats?.todayRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.todaySales || 0} transactions
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💵</span>
            </div>
          </div>
        </div>

        {/* Total Sales (Month) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${stats?.totalRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.totalSales || 0} transactions
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${stats?.averageOrderValue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-1">per transaction</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Top Product</p>
              <p className="text-lg font-bold text-gray-900 mt-2 truncate">
                {stats?.topProducts?.[0]?.productName || 'No data'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.topProducts?.[0]?.quantitySold || 0} sold
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Low Stock Alert */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {inventoryStats.lowStock}
                </p>
                <p className="text-sm text-gray-500 mt-1">products need attention</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {inventoryStats.totalProducts}
                </p>
                <p className="text-sm text-gray-500 mt-1">in inventory</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          {/* Total Categories */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Categories</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {inventoryStats.totalCategories}
                </p>
                <p className="text-sm text-gray-500 mt-1">product groups</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏷️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => router.push(`/${locale}/branch/sales`)}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors text-left shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Process Sale</h3>
              <p className="text-sm text-gray-600 mt-1">Create new transaction</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push(`/${locale}/branch/inventory`)}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors text-left shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Inventory</h3>
              <p className="text-sm text-gray-600 mt-1">View and update stock</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push(`/${locale}/branch/reports`)}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors text-left shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600 mt-1">Analytics and insights</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
