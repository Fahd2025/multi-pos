/**
 * Sales Page Loading State
 * Shows skeleton while sales data is being fetched
 */

import { PageHeaderSkeleton, TableSkeleton, StatsCardSkeleton } from "@/components/shared";

export default function SalesLoading() {
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

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <TableSkeleton rows={10} columns={6} />
      </div>
    </div>
  );
}
