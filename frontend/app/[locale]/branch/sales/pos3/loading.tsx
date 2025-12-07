/**
 * POS Page Loading State
 * Shows skeleton while POS is initializing
 */

import { ProductGridSkeleton, Skeleton } from "@/components/shared";

export default function POSLoading() {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* Top Bar Skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Skeleton width={40} height={40} variant="circular" />
            <Skeleton width={200} height={28} />
          </div>
          <Skeleton width={400} height={40} className="hidden md:block" />
          <div className="flex gap-2">
            <Skeleton width={40} height={40} variant="circular" />
            <Skeleton width={40} height={40} variant="circular" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Skeleton */}
        <div className="hidden md:block w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={48} className="w-full" />
          ))}
        </div>

        {/* Product Grid Skeleton */}
        <div className="flex-1 p-4">
          <ProductGridSkeleton items={12} />
        </div>

        {/* Cart Skeleton */}
        <div className="hidden md:block w-96 bg-white dark:bg-gray-800 border-l border-gray-200 p-4 space-y-4">
          <Skeleton height={32} width={150} />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={80} className="w-full" />
            ))}
          </div>
          <Skeleton height={60} className="w-full mt-auto" />
        </div>
      </div>
    </div>
  );
}
