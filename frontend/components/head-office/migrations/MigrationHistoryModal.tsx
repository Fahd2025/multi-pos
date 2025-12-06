"use client";

import { useEffect, useState } from "react";
import { MigrationHistory } from "@/types/migrations";
import { getMigrationHistory } from "@/lib/migrations";
import { MigrationStatusBadge } from "./MigrationStatusBadge";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Migration History - {branchName}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
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
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
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

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
