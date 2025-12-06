"use client";

import { useState } from "react";
import { MigrationResult } from "@/types/migrations";
import { applyBranchMigrations, applyAllBranchMigrations } from "@/lib/migrations";

interface ApplyMigrationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchId?: string;
  branchName?: string;
  isAllBranches?: boolean;
}

export function ApplyMigrationsDialog({
  isOpen,
  onClose,
  onSuccess,
  branchId,
  branchName,
  isAllBranches = false,
}: ApplyMigrationsDialogProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    setIsApplying(true);
    setError(null);
    setResult(null);

    try {
      let migrationResult: MigrationResult;

      if (isAllBranches) {
        migrationResult = await applyAllBranchMigrations();
      } else if (branchId) {
        migrationResult = await applyBranchMigrations(branchId);
      } else {
        throw new Error("No branch specified");
      }

      setResult(migrationResult);

      if (migrationResult.success) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply migrations");
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={!isApplying ? handleClose : undefined}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isAllBranches
                ? "Apply Migrations to All Branches"
                : `Apply Migrations - ${branchName}`}
            </h3>
            {!isApplying && (
              <button
                onClick={handleClose}
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
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {!result && !error && !isApplying && (
              <div>
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                  <svg
                    className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Warning
                    </p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      {isAllBranches
                        ? "This will apply pending migrations to all active branches. This operation cannot be undone."
                        : "This will apply all pending migrations to this branch. This operation cannot be undone."}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to continue?
                </p>
              </div>
            )}

            {isApplying && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Applying migrations...
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This may take a few moments
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-red-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Migration Failed
                    </p>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div>
                {result.success ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Migrations Applied Successfully
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-green-700 dark:text-green-400">
                          <p>Branches Processed: {result.branchesProcessed}</p>
                          <p>Succeeded: {result.branchesSucceeded}</p>
                          <p>Failed: {result.branchesFailed}</p>
                          <p>Duration: {result.duration}</p>
                          {result.appliedMigrations.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Applied Migrations:</p>
                              <ul className="mt-1 list-disc list-inside">
                                {result.appliedMigrations.map((migration, index) => (
                                  <li key={index} className="text-xs truncate">
                                    {migration}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                      Partial Success
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">{result.errorMessage}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p>Succeeded: {result.branchesSucceeded}</p>
                      <p>Failed: {result.branchesFailed}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {!result && !isApplying && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Migrations
                </button>
              </>
            )}
            {(result || error) && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
