"use client";

import { useState, useEffect } from "react";
import { MigrationResult } from "@/types/migrations";
import {
  applyBranchMigrations,
  applyAllBranchMigrations,
  getPendingMigrations,
} from "@/lib/migrations";
import { FeaturedDialog } from "@/components/shared/FeaturedDialog";

interface ApplyMigrationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchId?: string;
  branchName?: string;
  isAllBranches?: boolean;
  pendingCount?: number;
  branches?: { id: string; name: string }[];
}

export function ApplyMigrationsDialog({
  isOpen,
  onClose,
  onSuccess,
  branchId,
  branchName,
  isAllBranches = false,
  pendingCount,
  branches = [],
}: ApplyMigrationsDialogProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedPendingCount, setFetchedPendingCount] = useState<number | undefined>(undefined);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isAllBranches && branches.length > 0) {
        fetchAllPendingCount();
      } else if (branchId && !isAllBranches) {
        fetchPendingCount();
      } else {
        setFetchedPendingCount(undefined);
      }
    }
  }, [isOpen, branchId, isAllBranches, branches.length]);

  const fetchPendingCount = async () => {
    if (!branchId) return;
    setIsLoadingPending(true);
    try {
      const data = await getPendingMigrations(branchId);
      setFetchedPendingCount(data.count);
    } catch (err) {
      console.error("Failed to fetch pending migrations count", err);
      // Fallback: don't set fetchedPendingCount, UI will show warning as default
    } finally {
      setIsLoadingPending(false);
    }
  };

  const fetchAllPendingCount = async () => {
    setIsLoadingPending(true);
    try {
      // Fetch pending count for all branches in parallel
      const promises = branches.map((b) => getPendingMigrations(b.id));
      const results = await Promise.all(promises);

      const totalPending = results.reduce((sum, res) => sum + res.count, 0);
      setFetchedPendingCount(totalPending);
    } catch (err) {
      console.error("Failed to fetch pending migrations for all branches", err);
      setFetchedPendingCount(undefined); // Fallback to warning on error
    } finally {
      setIsLoadingPending(false);
    }
  };

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
    setFetchedPendingCount(undefined);
    onClose();
  };

  // Determine the effective pending count.
  // Priority: 1. Locally fetched (most accurate), 2. Prop (from list), 3. Undefined
  const finalPendingCount = fetchedPendingCount !== undefined ? fetchedPendingCount : pendingCount;

  // If success, we hide the Apply button and change Cancel to Close
  const showApplyButton =
    !result?.success &&
    (finalPendingCount === undefined || finalPendingCount > 0) &&
    !isLoadingPending;
  const cancelButtonLabel =
    result?.success || (finalPendingCount !== undefined && finalPendingCount === 0)
      ? "Close"
      : "Cancel";

  return (
    <FeaturedDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isAllBranches ? "Apply Migrations to All Branches" : `Apply Migrations - ${branchName}`
      }
      mode="edit" // Just to denote action
      fields={[]}
      onSubmit={handleApply}
      isSubmitting={isApplying}
      submitLabel="Apply Migrations"
      cancelLabel={cancelButtonLabel}
      showSubmitButton={showApplyButton}
      size="md"
      additionalContent={
        <div className="space-y-4">
          {isLoadingPending && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {!result && !error && !isApplying && !isLoadingPending && (
            <div>
              {finalPendingCount !== undefined && finalPendingCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <svg
                    className="w-12 h-12 text-green-500 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    No pending migrations
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {isAllBranches
                      ? "All active branches are up to date."
                      : "This branch is up to date."}
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}
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
      }
    />
  );
}
