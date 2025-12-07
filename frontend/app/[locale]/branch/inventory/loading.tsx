/**
 * Inventory Page Loading State
 * Shows skeleton while inventory data is being fetched
 */

import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared";

export default function InventoryLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header Skeleton */}
      <PageHeaderSkeleton />

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <TableSkeleton rows={12} columns={7} />
      </div>
    </div>
  );
}
