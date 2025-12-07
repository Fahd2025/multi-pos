/**
 * Base Skeleton Component
 * Provides shimmer loading animation
 */

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className = "",
  width,
  height,
  variant = "rectangular",
  animation = "pulse",
}: SkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case "text":
        return "h-4 rounded";
      case "circular":
        return "rounded-full";
      case "rectangular":
      default:
        return "rounded-lg";
    }
  };

  const getAnimationClass = () => {
    switch (animation) {
      case "wave":
        return "animate-shimmer";
      case "pulse":
        return "animate-pulse";
      case "none":
      default:
        return "";
    }
  };

  const style: React.CSSProperties = {
    ...(width && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height && { height: typeof height === "number" ? `${height}px` : height }),
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${getVariantClass()} ${getAnimationClass()} ${className}`}
      style={style}
      aria-label="Loading..."
    />
  );
}

/**
 * Table Skeleton Component
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={20} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={16} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Skeleton Component
 */
interface CardSkeletonProps {
  hasImage?: boolean;
  lines?: number;
}

export function CardSkeleton({ hasImage = true, lines = 3 }: CardSkeletonProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
      {hasImage && <Skeleton height={200} className="w-full" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? "60%" : "100%"}
          variant="text"
        />
      ))}
    </div>
  );
}

/**
 * List Skeleton Component
 */
interface ListSkeletonProps {
  items?: number;
  hasAvatar?: boolean;
}

export function ListSkeleton({ items = 5, hasAvatar = true }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          {hasAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="70%" />
            <Skeleton height={14} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton Component
 */
interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 5 }: FormSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height={14} width={120} variant="text" />
          <Skeleton height={40} className="w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton height={40} width={100} />
        <Skeleton height={40} width={100} />
      </div>
    </div>
  );
}

/**
 * Stats Card Skeleton Component
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
      <Skeleton height={14} width={100} />
      <Skeleton height={32} width={150} />
      <Skeleton height={12} width={80} />
    </div>
  );
}

/**
 * Product Grid Skeleton Component
 */
interface ProductGridSkeletonProps {
  items?: number;
}

export function ProductGridSkeleton({ items = 12 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <Skeleton height={200} className="w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton height={20} width="80%" />
            <Skeleton height={16} width="60%" />
            <Skeleton height={24} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page Header Skeleton Component
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3 mb-6">
      <Skeleton height={32} width={250} />
      <Skeleton height={20} width={400} />
    </div>
  );
}
