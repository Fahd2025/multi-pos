"use client";

import { useState, useEffect } from "react";
import { MigrationResult } from "@/types/migrations";
import {
  applyBranchMigrations,
  getPendingMigrations,
} from "@/lib/migrations";
import { FeaturedDialog } from "@/components/shared/FeaturedDialog";

interface BranchWithMigrations {
  id: string;
  name: string;
  pendingMigrations: string[];
  isLoading: boolean;
  selectedUpToIndex: number; // -1 means none selected
  isExpanded: boolean;
}

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
  const [pendingMigrations, setPendingMigrations] = useState<string[]>([]);
  const [selectedUpToIndex, setSelectedUpToIndex] = useState<number>(-1);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [fetchedPendingCount, setFetchedPendingCount] = useState<number | undefined>(undefined);

  // For "All Branches" mode
  const [branchesWithMigrations, setBranchesWithMigrations] = useState<BranchWithMigrations[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());
  const [applyProgress, setApplyProgress] = useState<{
    current: number;
    total: number;
    currentBranch: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset selection when dialog opens
      setSelectedUpToIndex(-1);
      setApplyProgress(null);
      setResult(null);
      setError(null);

      if (isAllBranches && branches.length > 0) {
        loadAllBranchesMigrations();
      } else if (branchId && !isAllBranches) {
        fetchPendingMigrations();
      } else {
        setFetchedPendingCount(undefined);
        setPendingMigrations([]);
      }
    }
  }, [isOpen, branchId, isAllBranches, branches.length]);

  const loadAllBranchesMigrations = async () => {
    setIsLoadingPending(true);

    // Initialize branches
    const branchList: BranchWithMigrations[] = branches.map(b => ({
      id: b.id,
      name: b.name,
      pendingMigrations: [],
      isLoading: true,
      selectedUpToIndex: -1,
      isExpanded: false,
    }));

    setBranchesWithMigrations(branchList);

    // Select all by default
    setSelectedBranchIds(new Set(branches.map(b => b.id)));

    // Fetch pending migrations for each branch
    try {
      const results = await Promise.all(
        branches.map(async (branch) => {
          try {
            const data = await getPendingMigrations(branch.id);
            return {
              id: branch.id,
              name: branch.name,
              pendingMigrations: data.pendingMigrations,
              isLoading: false,
              selectedUpToIndex: data.pendingMigrations.length - 1, // Select all by default
              isExpanded: false,
            };
          } catch (error) {
            console.error(`Failed to fetch migrations for ${branch.name}:`, error);
            return {
              id: branch.id,
              name: branch.name,
              pendingMigrations: [],
              isLoading: false,
              selectedUpToIndex: -1,
              isExpanded: false,
            };
          }
        })
      );

      setBranchesWithMigrations(results);

      // Calculate total pending count
      const totalPending = results.reduce((sum, b) => sum + b.pendingMigrations.length, 0);
      setFetchedPendingCount(totalPending);
    } catch (err) {
      console.error("Failed to fetch migrations for all branches", err);
      setFetchedPendingCount(0);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const fetchPendingMigrations = async () => {
    if (!branchId) return;
    setIsLoadingPending(true);
    try {
      const data = await getPendingMigrations(branchId);
      setPendingMigrations(data.pendingMigrations);
      setFetchedPendingCount(data.count);
    } catch (err) {
      console.error("Failed to fetch pending migrations", err);
      setPendingMigrations([]);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  const handleBranchExpand = (branchId: string) => {
    setBranchesWithMigrations((prev) =>
      prev.map((b) =>
        b.id === branchId ? { ...b, isExpanded: !b.isExpanded } : b
      )
    );
  };

  const handleBranchMigrationClick = (branchId: string, index: number) => {
    setBranchesWithMigrations((prev) =>
      prev.map((b) => {
        if (b.id !== branchId) return b;

        // Toggle selection: if clicking the last selected, deselect it
        // Otherwise, select from 0 to clicked index (sequential selection)
        if (b.selectedUpToIndex === index) {
          return { ...b, selectedUpToIndex: index - 1 };
        } else {
          return { ...b, selectedUpToIndex: index };
        }
      })
    );
  };

  const handleSelectAllBranchMigrations = (branchId: string) => {
    setBranchesWithMigrations((prev) =>
      prev.map((b) => {
        if (b.id !== branchId) return b;

        if (b.selectedUpToIndex === b.pendingMigrations.length - 1) {
          // If all selected, deselect all
          return { ...b, selectedUpToIndex: -1 };
        } else {
          // Select all
          return { ...b, selectedUpToIndex: b.pendingMigrations.length - 1 };
        }
      })
    );
  };

  const handleSelectAllBranches = () => {
    if (selectedBranchIds.size === branchesWithMigrations.length) {
      // Deselect all
      setSelectedBranchIds(new Set());
    } else {
      // Select all
      setSelectedBranchIds(new Set(branchesWithMigrations.map(b => b.id)));
    }
  };

  const handleMigrationClick = (index: number) => {
    // Toggle selection: if clicking the last selected, deselect it
    // Otherwise, select from 0 to clicked index (sequential selection)
    if (selectedUpToIndex === index) {
      setSelectedUpToIndex(index - 1);
    } else {
      setSelectedUpToIndex(index);
    }
  };

  const handleSelectAll = () => {
    if (selectedUpToIndex === pendingMigrations.length - 1) {
      // If all selected, deselect all
      setSelectedUpToIndex(-1);
    } else {
      // Select all
      setSelectedUpToIndex(pendingMigrations.length - 1);
    }
  };

  const handleApply = async () => {
    // Validate selection for single branch mode
    if (!isAllBranches && pendingMigrations.length > 0 && selectedCount === 0) {
      setError("Please select at least one migration to apply");
      return;
    }

    // Validate branch selection for all branches mode
    if (isAllBranches && selectedBranchIds.size === 0) {
      setError("Please select at least one branch");
      return;
    }

    // Validate that selected branches have migrations selected
    if (isAllBranches) {
      const selectedWithNoMigrations = branchesWithMigrations.filter(
        b => selectedBranchIds.has(b.id) && b.selectedUpToIndex < 0 && b.pendingMigrations.length > 0
      );

      if (selectedWithNoMigrations.length > 0) {
        setError(`Please select migrations for: ${selectedWithNoMigrations.map(b => b.name).join(", ")}`);
        return;
      }
    }

    setIsApplying(true);
    setError(null);
    setResult(null);

    try {
      let migrationResult: MigrationResult;

      if (isAllBranches) {
        // Apply to selected branches sequentially
        const selectedBranches = branchesWithMigrations.filter(b =>
          selectedBranchIds.has(b.id) && b.pendingMigrations.length > 0
        );

        const appliedMigrations: string[] = [];
        let successCount = 0;
        let failCount = 0;
        const startTime = Date.now();

        for (let i = 0; i < selectedBranches.length; i++) {
          const branch = selectedBranches[i];

          setApplyProgress({
            current: i + 1,
            total: selectedBranches.length,
            currentBranch: branch.name,
          });

          try {
            // Determine target migration for this branch
            const targetMigration = branch.selectedUpToIndex >= 0
              ? branch.pendingMigrations[branch.selectedUpToIndex]
              : undefined;

            const result = await applyBranchMigrations(branch.id, targetMigration);

            if (result.success) {
              successCount++;
              appliedMigrations.push(...result.appliedMigrations);
            } else {
              failCount++;
            }
          } catch (err) {
            console.error(`Failed to apply migrations for ${branch.name}:`, err);
            failCount++;
          }
        }

        const endTime = Date.now();
        const duration = `${((endTime - startTime) / 1000).toFixed(2)}s`;

        migrationResult = {
          success: failCount === 0,
          appliedMigrations,
          branchesProcessed: selectedBranches.length,
          branchesSucceeded: successCount,
          branchesFailed: failCount,
          duration,
          errorMessage: failCount > 0
            ? `${failCount} branch${failCount > 1 ? 'es' : ''} failed to apply migrations`
            : undefined,
        };
      } else if (branchId) {
        // Single branch mode
        const targetMigration = selectedUpToIndex >= 0
          ? pendingMigrations[selectedUpToIndex]
          : undefined;

        migrationResult = await applyBranchMigrations(branchId, targetMigration);
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
      setApplyProgress(null);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setPendingMigrations([]);
    setSelectedUpToIndex(-1);
    setFetchedPendingCount(undefined);
    setBranchesWithMigrations([]);
    setSelectedBranchIds(new Set());
    setApplyProgress(null);
    onClose();
  };

  // Determine the effective pending count
  const finalPendingCount = fetchedPendingCount !== undefined ? fetchedPendingCount : pendingCount;

  // Calculate how many migrations are selected (single branch mode)
  const selectedCount = selectedUpToIndex + 1;

  // Calculate totals for all branches mode
  const selectedBranchesCount = selectedBranchIds.size;
  const totalMigrationsInSelected = branchesWithMigrations
    .filter(b => selectedBranchIds.has(b.id) && b.selectedUpToIndex >= 0)
    .reduce((sum, b) => sum + (b.selectedUpToIndex + 1), 0);

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
      mode="edit"
      fields={[]}
      onSubmit={handleApply}
      isSubmitting={isApplying}
      submitLabel={
        isAllBranches && totalMigrationsInSelected > 0
          ? `Apply Selected (${totalMigrationsInSelected} migration${totalMigrationsInSelected > 1 ? 's' : ''})`
          : !isAllBranches && selectedCount > 0
          ? `Apply Selected (${selectedCount})`
          : "Apply Migrations"
      }
      cancelLabel={cancelButtonLabel}
      showSubmitButton={showApplyButton}
      size="lg"
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
                          ? totalMigrationsInSelected > 0
                            ? `This will apply ${totalMigrationsInSelected} selected migration${totalMigrationsInSelected > 1 ? 's' : ''} across ${selectedBranchesCount} branch${selectedBranchesCount > 1 ? 'es' : ''}. This operation cannot be undone.`
                            : "Select branches and migrations to apply. Migrations must be applied sequentially and cannot be skipped."
                          : selectedCount > 0
                          ? `This will apply ${selectedCount} selected migration${selectedCount > 1 ? 's' : ''} to this branch. This operation cannot be undone.`
                          : "Select migrations to apply. Migrations must be applied sequentially and cannot be skipped."}
                      </p>
                    </div>
                  </div>

                  {/* All Branches Mode: Branch Selection with Migrations */}
                  {isAllBranches && branchesWithMigrations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Branches ({branchesWithMigrations.length})
                        </h4>
                        <button
                          type="button"
                          onClick={handleSelectAllBranches}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedBranchIds.size === branchesWithMigrations.length
                            ? "Deselect All Branches"
                            : "Select All Branches"}
                        </button>
                      </div>

                      <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        {branchesWithMigrations.map((branch) => {
                          const isSelected = selectedBranchIds.has(branch.id);
                          const hasPending = branch.pendingMigrations.length > 0;
                          const selectedMigrationsCount = branch.selectedUpToIndex + 1;

                          return (
                            <div
                              key={branch.id}
                              className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                                isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                              }`}
                            >
                              {/* Branch Header */}
                              <div className="flex items-start gap-3 p-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => hasPending && handleBranchToggle(branch.id)}
                                  disabled={!hasPending}
                                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {branch.name}
                                      </span>
                                      {hasPending && (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                          {selectedMigrationsCount}/{branch.pendingMigrations.length} selected
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                        hasPending
                                          ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      }`}>
                                        {hasPending ? `${branch.pendingMigrations.length} pending` : "Up to date"}
                                      </span>
                                      {hasPending && (
                                        <button
                                          type="button"
                                          onClick={() => handleBranchExpand(branch.id)}
                                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                          <svg
                                            className={`w-4 h-4 text-gray-500 transition-transform ${
                                              branch.isExpanded ? "rotate-180" : ""
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
                                      )}
                                    </div>
                                  </div>

                                  {/* Expanded Migrations List */}
                                  {branch.isExpanded && hasPending && (
                                    <div className="mt-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                          Select Migrations:
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleSelectAllBranchMigrations(branch.id)}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          {branch.selectedUpToIndex === branch.pendingMigrations.length - 1
                                            ? "Deselect All"
                                            : "Select All"}
                                        </button>
                                      </div>

                                      <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded">
                                        {branch.pendingMigrations.map((migration, idx) => {
                                          const isMigrationSelected = idx <= branch.selectedUpToIndex;
                                          const isDisabled = !isMigrationSelected && idx > branch.selectedUpToIndex + 1;

                                          return (
                                            <label
                                              key={idx}
                                              className={`flex items-start gap-2 p-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors ${
                                                isMigrationSelected
                                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                              } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isMigrationSelected}
                                                onChange={() => !isDisabled && handleBranchMigrationClick(branch.id, idx)}
                                                disabled={isDisabled}
                                                className="mt-0.5 h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                              />
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                    #{idx + 1}
                                                  </span>
                                                  <span className="text-xs text-gray-900 dark:text-white break-all font-mono">
                                                    {migration}
                                                  </span>
                                                </div>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalMigrationsInSelected > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {totalMigrationsInSelected} migration{totalMigrationsInSelected > 1 ? "s" : ""} selected
                          across {selectedBranchesCount} branch{selectedBranchesCount > 1 ? "es" : ""}.
                          Migrations will be applied sequentially for each branch.
                        </p>
                      )}

                      {totalMigrationsInSelected === 0 && selectedBranchesCount > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Please select migrations for the selected branches.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Single Branch Mode: Pending Migrations List */}
                  {!isAllBranches && pendingMigrations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Pending Migrations ({pendingMigrations.length})
                        </h4>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedUpToIndex === pendingMigrations.length - 1
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>

                      <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        {pendingMigrations.map((migration, index) => {
                          const isSelected = index <= selectedUpToIndex;
                          const isDisabled = !isSelected && index > selectedUpToIndex + 1;

                          return (
                            <label
                              key={index}
                              className={`flex items-start gap-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors ${
                                isSelected
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => !isDisabled && handleMigrationClick(index)}
                                disabled={isDisabled}
                                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                    #{index + 1}
                                  </span>
                                  <span className="text-sm text-gray-900 dark:text-white break-all font-mono">
                                    {migration}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {selectedCount > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedCount} migration{selectedCount > 1 ? "s" : ""} selected.
                          Migrations will be applied sequentially from first to last.
                        </p>
                      )}

                      {selectedCount === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Please select at least one migration to apply.
                        </p>
                      )}
                    </div>
                  )}

                  {!isAllBranches && pendingMigrations.length === 0 && finalPendingCount !== 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Are you sure you want to continue?
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {isApplying && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {applyProgress
                  ? `Applying migrations to ${applyProgress.currentBranch}...`
                  : "Applying migrations..."}
              </p>
              {applyProgress && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Branch {applyProgress.current} of {applyProgress.total}
                </p>
              )}
              {!applyProgress && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This may take a few moments
                </p>
              )}
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
                        {isAllBranches && (
                          <>
                            <p>Branches Processed: {result.branchesProcessed}</p>
                            <p>Succeeded: {result.branchesSucceeded}</p>
                            <p>Failed: {result.branchesFailed}</p>
                          </>
                        )}
                        <p>Duration: {result.duration}</p>
                        {result.appliedMigrations.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Applied Migrations ({result.appliedMigrations.length}):</p>
                            <ul className="mt-1 list-disc list-inside max-h-32 overflow-y-auto">
                              {result.appliedMigrations.map((migration, index) => (
                                <li key={index} className="text-xs truncate font-mono">
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
