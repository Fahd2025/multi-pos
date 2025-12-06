"use client";

import { useEffect, useState } from "react";
import { MigrationHistory } from "@/types/migrations";
import { getMigrationHistory } from "@/lib/migrations";
import { MigrationStatusBadge } from "./MigrationStatusBadge";
import { FeaturedDialog } from "@/components/shared/FeaturedDialog";

interface MigrationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
}

export function MigrationHistoryModal({
  isOpen,
  onClose,
  branchId,
  branchName,
}: MigrationHistoryModalProps) {
  const [history, setHistory] = useState<MigrationHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && branchId) {
      loadHistory();
    }
  }, [isOpen, branchId]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMigrationHistory(branchId);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load migration history");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <FeaturedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Migration History - ${branchName}`}
      mode="edit"
      fields={[]}
      onSubmit={() => {}}
      showSubmitButton={false}
      cancelLabel="Close"
      size="lg"
      additionalContent={
        <div>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!isLoading && !error && !history && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No migration history available.</p>
            </div>
          )}

          {history && !isLoading && !error && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <div className="mt-1">
                    <MigrationStatusBadge status={history.status} />
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Last Migration Date:
                  </span>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {formatDate(history.lastMigrationDate)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Branch Code:</span>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {history.branchCode}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Retry Count:</span>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {history.retryCount}
                  </p>
                </div>
              </div>

              {history.errorDetails && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                    Error Details:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">{history.errorDetails}</p>
                </div>
              )}

              {/* Applied Migrations */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Applied Migrations ({history.appliedMigrations.length})
                </h4>
                {history.appliedMigrations.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No migrations applied yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {history.appliedMigrations.map((migration, index) => (
                      <li
                        key={index}
                        className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <code className="text-sm text-green-800 dark:text-green-300 font-mono">
                          {migration}
                        </code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Pending Migrations */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pending Migrations ({history.pendingMigrations.length})
                </h4>
                {history.pendingMigrations.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    All migrations are up to date
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {history.pendingMigrations.map((migration, index) => (
                      <li
                        key={index}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                      >
                        <code className="text-sm text-yellow-800 dark:text-yellow-300 font-mono">
                          {migration}
                        </code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
