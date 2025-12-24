/**
 * Branch Dashboard Home Page
 * Overview of branch operations with key metrics
 */

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import salesService from "@/services/sales.service";
import inventoryService from "@/services/inventory.service";
import { SalesStatsDto } from "@/types/api.types";
import {
  LoadingSpinner,
  ErrorAlert,
  StatCard,
  ActionCard,
  PageHeader,
  Button,
} from "@/components/shared";

export default function BranchHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<SalesStatsDto | null>(null);
  const [inventoryStats, setInventoryStats] = useState({
    lowStock: 0,
    totalProducts: 0,
    totalCategories: 0,
  });
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

      const dateFrom = firstDayOfMonth.toISOString().split("T")[0];
      const dateTo = today.toISOString().split("T")[0];

      //console.log("Requesting stats with dates:", { dateFrom, dateTo });

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
      console.error("Failed to load stats:", err);
      console.error("Error response:", err.response?.data);
      const errorMsg =
        err.response?.data?.error?.message || err.message || "Failed to load statistics";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error} />
        <Button onClick={loadStats} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Branch Dashboard"
        description={`Welcome back, ${user?.fullNameEn || user?.username}`}
        actions={
          <Button
            onClick={() => router.push(`/${locale}/branch/sales`)}
            variant="primary"
            size="lg"
          >
            💳 New Sale
          </Button>
        }
        className="mb-6"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Sales"
          value={`$${stats?.todayRevenue?.toFixed(2) || "0.00"}`}
          description={`${stats?.todaySales || 0} transactions`}
          icon="💵"
          iconBgColor="bg-green-100 dark:bg-green-900/20"
        />

        <StatCard
          title="This Month"
          value={`$${stats?.totalRevenue?.toFixed(2) || "0.00"}`}
          description={`${stats?.totalSales || 0} transactions`}
          icon="📊"
          iconBgColor="bg-blue-100 dark:bg-blue-900/20"
        />

        <StatCard
          title="Avg. Order Value"
          value={`$${stats?.averageOrderValue?.toFixed(2) || "0.00"}`}
          description="per transaction"
          icon="📈"
          iconBgColor="bg-purple-100 dark:bg-purple-900/20"
        />

        <StatCard
          title="Top Product"
          value={stats?.topProducts?.[0]?.productName || "No data"}
          description={`${stats?.topProducts?.[0]?.quantitySold || 0} sold`}
          icon="🏆"
          iconBgColor="bg-orange-100 dark:bg-orange-900/20"
          valueSize="md"
        />
      </div>

      {/* Inventory Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Inventory Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Low Stock Alerts"
            value={inventoryStats.lowStock}
            description="products need attention"
            icon="⚠️"
            iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
            valueColor="text-yellow-600 dark:text-yellow-400"
          />

          <StatCard
            title="Total Products"
            value={inventoryStats.totalProducts}
            description="in inventory"
            icon="📦"
            iconBgColor="bg-green-100 dark:bg-green-900/20"
          />

          <StatCard
            title="Categories"
            value={inventoryStats.totalCategories}
            description="product groups"
            icon="🏷️"
            iconBgColor="bg-indigo-100 dark:bg-indigo-900/20"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Process Sale"
          description="Create new transaction"
          icon="💳"
          iconBgColor="bg-blue-100 dark:bg-blue-900/20"
          onClick={() => router.push(`/${locale}/branch/sales`)}
        />

        <ActionCard
          title="Manage Inventory"
          description="View and update stock"
          icon="📦"
          iconBgColor="bg-green-100 dark:bg-green-900/20"
          onClick={() => router.push(`/${locale}/branch/inventory`)}
        />

        <ActionCard
          title="View Reports"
          description="Analytics and insights"
          icon="📈"
          iconBgColor="bg-purple-100 dark:bg-purple-900/20"
          onClick={() => router.push(`/${locale}/branch/reports`)}
        />
      </div>
    </div>
  );
}
