/**
 * Dashboard Loading State
 * Shows skeleton while dashboard data is being fetched
 */

import { PageHeaderSkeleton, StatsCardSkeleton, CardSkeleton, TableSkeleton } from "@/components/shared";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header Skeleton */}
      <PageHeaderSkeleton />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton hasImage={false} lines={8} />
        <CardSkeleton hasImage={false} lines={8} />
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4">
          <PageHeaderSkeleton />
        </div>
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  );
}
