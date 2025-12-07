/**
 * Customers Page Loading State
 * Shows skeleton while customer data is being fetched
 */

import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared";

export default function CustomersLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header Skeleton */}
      <PageHeaderSkeleton />

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <TableSkeleton rows={10} columns={5} />
      </div>
    </div>
  );
}
