"use client";

import { useState } from "react";
import { BranchMigrationStatus } from "@/types/migrations";
import { MigrationStatusBadge } from "./MigrationStatusBadge";

interface BranchMigrationCardProps {
  migration: BranchMigrationStatus;
  onApplyMigrations: (branchId: string) => void;
  onViewHistory: (branchId: string) => void;
  onViewPending: (branchId: string) => void;
  onValidate: (branchId: string) => void;
}

export function BranchMigrationCard({
  migration,
  onApplyMigrations,
  onViewHistory,
  onViewPending,
  onValidate,
}: BranchMigrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {migration.branchName}
              </h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                {migration.branchCode}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <MigrationStatusBadge status={migration.status} />
              {migration.isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-medium rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Locked
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Summary Info */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Last Migration:</span>
            <p
              className="font-medium text-gray-900 dark:text-white truncate"
              title={migration.lastMigrationApplied}
            >
              {migration.lastMigrationApplied || "None"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Last Attempt:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(migration.lastAttemptAt)}
            </p>
          </div>
        </div>

        {migration.retryCount > 0 && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm">
            <span className="font-medium text-amber-800 dark:text-amber-300">
              Retry Count: {migration.retryCount}
            </span>
          </div>
        )}

        {migration.errorDetails && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
              Error Details:
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">{migration.errorDetails}</p>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onApplyMigrations(migration.branchId)}
              disabled={migration.isLocked || migration.status === "InProgress"}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Apply Migrations
            </button>

            <button
              onClick={() => onViewHistory(migration.branchId)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
            >
              View History
            </button>

            <button
              onClick={() => onViewPending(migration.branchId)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
            >
              Pending Migrations
            </button>

            <button
              onClick={() => onValidate(migration.branchId)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              Validate Schema
            </button>
          </div>

          {migration.lockExpiresAt && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Lock expires at: {formatDate(migration.lockExpiresAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
