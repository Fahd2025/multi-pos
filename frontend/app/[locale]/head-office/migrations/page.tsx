"use client";

import { useEffect, useState } from "react";
import { BranchMigrationStatus } from "@/types/migrations";
import {
  getAllMigrationStatus,
  validateBranchDatabase,
  rollbackLastMigration,
  rollbackAllBranches,
  getPendingMigrations,
} from "@/lib/migrations";
import { BranchMigrationCard } from "@/components/head-office/migrations/BranchMigrationCard";
import { MigrationHistoryModal } from "@/components/head-office/migrations/MigrationHistoryModal";
import { ApplyMigrationsDialog } from "@/components/head-office/migrations/ApplyMigrationsDialog";
import { PendingMigrationsModal } from "@/components/head-office/migrations/PendingMigrationsModal";
import { MigrationsHeader } from "@/components/head-office/migrations/MigrationsHeader";
import { MigrationsStats } from "@/components/head-office/migrations/MigrationsStats";
import { MigrationsFilters } from "@/components/head-office/migrations/MigrationsFilters";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { useToast } from "@/hooks/useToast";
import { useConfirmation } from "@/hooks/useConfirmation";

export default function MigrationsPage() {
  const [migrations, setMigrations] = useState<BranchMigrationStatus[]>([]);
  const [filteredMigrations, setFilteredMigrations] = useState<BranchMigrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hasPendingMigrations, setHasPendingMigrations] = useState(false);
  const [hasAppliedMigrations, setHasAppliedMigrations] = useState(false);

  // Modal states
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isApplyingToAll, setIsApplyingToAll] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isRollingBackAll, setIsRollingBackAll] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  const toast = useToast();
  const rollbackConfirmation = useConfirmation();
  const rollbackAllConfirmation = useConfirmation();
  const [branchForRollback, setBranchForRollback] = useState<BranchMigrationStatus | null>(null);

  useEffect(() => {
    loadMigrations();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMigrations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterMigrations();
  }, [migrations, searchQuery, statusFilter]);

  useEffect(() => {
    // Check if any branch has pending migrations
    checkPendingMigrations();
    // Check if any branch has applied migrations that can be rolled back
    checkAppliedMigrations();
  }, [migrations]);

  const loadMigrations = async () => {
    try {
      const data = await getAllMigrationStatus();
      setMigrations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load migration status");
      toast.error("Load Failed", "Failed to load migration status");
    } finally {
      setIsLoading(false);
    }
  };

  const checkPendingMigrations = async () => {
    try {
      // Check if any branch has pending migrations by querying each
      const pendingChecks = await Promise.all(
        migrations.map(async (m) => {
          try {
            const pending = await getPendingMigrations(m.branchId);
            return pending.count > 0;
          } catch {
            return false;
          }
        })
      );
      setHasPendingMigrations(pendingChecks.some((hasPending) => hasPending));
    } catch (error) {
      console.error("Failed to check pending migrations:", error);
      setHasPendingMigrations(false);
    }
  };

  const checkAppliedMigrations = () => {
    // Check if any branch has applied migrations that can be rolled back
    const hasApplied = migrations.some(
      (m) => m.lastMigrationApplied && m.lastMigrationApplied !== ""
    );
    setHasAppliedMigrations(hasApplied);
  };

  const filterMigrations = () => {
    let filtered = migrations;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.branchCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    setFilteredMigrations(filtered);
  };

  const handleApplyMigrations = (branchId: string) => {
    const branch = migrations.find((m) => m.branchId === branchId);
    if (branch) {
      setSelectedBranch({ id: branch.branchId, name: branch.branchName });
      setIsApplyingToAll(false);
      setApplyDialogOpen(true);
    }
  };

  const handleApplyToAll = () => {
    setIsApplyingToAll(true);
    setSelectedBranch(null);
    setApplyDialogOpen(true);
  };

  const handleViewHistory = (branchId: string) => {
    const branch = migrations.find((m) => m.branchId === branchId);
    if (branch) {
      setSelectedBranch({ id: branch.branchId, name: branch.branchName });
      setHistoryModalOpen(true);
    }
  };

  const handleViewPending = (branchId: string) => {
    const branch = migrations.find((m) => m.branchId === branchId);
    if (branch) {
      setSelectedBranch({ id: branch.branchId, name: branch.branchName });
      setPendingModalOpen(true);
    }
  };

  const handleValidate = async (branchId: string) => {
    const branch = migrations.find((m) => m.branchId === branchId);
    if (!branch) return;

    try {
      const result = await validateBranchDatabase(branchId);
      if (result.isValid) {
        toast.success("Schema Valid", `Database schema for "${branch.branchName}" is valid`);
      } else {
        toast.error(
          "Schema Invalid",
          `Database schema for "${branch.branchName}" has integrity issues`
        );
      }
    } catch (err) {
      toast.error(
        "Validation Failed",
        `Failed to validate: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  const handleRollback = (branchId: string) => {
    const branch = migrations.find((m) => m.branchId === branchId);
    if (!branch) return;

    // Set branch data and open confirmation dialog
    setBranchForRollback(branch);
    rollbackConfirmation.ask(
      "Rollback Migration",
      `Are you sure you want to rollback the last migration for "${branch.branchName}"? This action cannot be undone.`,
      async () => {
        setIsRollingBack(true);
        try {
          const result = await rollbackLastMigration(branch.branchId);
          if (result.success) {
            toast.success(
              "Rollback Successful",
              `Successfully rolled back migration for "${branch.branchName}"`
            );
            loadMigrations();
          } else {
            toast.error("Rollback Failed", result.errorMessage || "Unknown error");
          }
        } catch (err) {
          toast.error("Rollback Failed", err instanceof Error ? err.message : "Unknown error");
        } finally {
          setIsRollingBack(false);
        }
      },
      "danger"
    );
  };

  const handleRollbackAll = () => {
    // Open confirmation dialog
    rollbackAllConfirmation.ask(
      "Rollback All Branches",
      "Are you sure you want to rollback the last migration for ALL active branches? This action cannot be undone and will affect all branches simultaneously.",
      async () => {
        setIsRollingBackAll(true);
        try {
          const result = await rollbackAllBranches();
          if (result.success) {
            toast.success(
              "Rollback Successful",
              "Successfully rolled back migrations for all branches"
            );
            loadMigrations();
          } else {
            toast.error("Rollback Failed", result.errorMessage || "Unknown error");
          }
        } catch (err) {
          toast.error("Rollback Failed", err instanceof Error ? err.message : "Unknown error");
        } finally {
          setIsRollingBackAll(false);
        }
      },
      "danger"
    );
  };

  const handleMigrationSuccess = () => {
    loadMigrations();
    toast.success("Migration Success", "Migrations applied successfully");
  };

  const handleToggleExpand = (branchId: string, isExpanded: boolean) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (isExpanded) {
        next.add(branchId);
      } else {
        next.delete(branchId);
      }
      return next;
    });
  };

  const getStatusCounts = () => {
    return {
      total: migrations.length,
      completed: migrations.filter((m) => m.status === "Completed").length,
      pending: migrations.filter((m) => m.status === "Pending").length,
      failed: migrations.filter(
        (m) => m.status === "Failed" || m.status === "RequiresManualIntervention"
      ).length,
      inProgress: migrations.filter((m) => m.status === "InProgress").length,
    };
  };

  const stats = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto pb-6">
          <MigrationsHeader
            onApplyToAll={handleApplyToAll}
            onRollbackAll={handleRollbackAll}
            hasPendingMigrations={hasPendingMigrations}
            hasAppliedMigrations={hasAppliedMigrations}
          />

          {/* Stats */}
          <MigrationsStats stats={stats} />

          {/* Filters */}
          <MigrationsFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            isLoading={isLoading}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onRefresh={loadMigrations}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && migrations.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {!isLoading && !error && filteredMigrations.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No branches found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "No branch migrations to display"}
            </p>
          </div>
        )}

        {!isLoading && !error && filteredMigrations.length > 0 && (
          <div className="grid gap-4">
            {filteredMigrations.map((migration) => (
              <BranchMigrationCard
                key={`${migration.branchId}-${migration.lastMigrationApplied}-${migration.lastAttemptAt}`}
                migration={migration}
                isExpanded={expandedBranches.has(migration.branchId)}
                onToggleExpand={handleToggleExpand}
                onApplyMigrations={handleApplyMigrations}
                onViewHistory={handleViewHistory}
                onViewPending={handleViewPending}
                onValidate={handleValidate}
                onRollback={handleRollback}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBranch && historyModalOpen && (
        <MigrationHistoryModal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
        />
      )}

      {selectedBranch && pendingModalOpen && (
        <PendingMigrationsModal
          isOpen={pendingModalOpen}
          onClose={() => setPendingModalOpen(false)}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
        />
      )}

      <ApplyMigrationsDialog
        isOpen={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        onSuccess={handleMigrationSuccess}
        branchId={selectedBranch?.id}
        branchName={selectedBranch?.name}
        isAllBranches={isApplyingToAll}
        branches={migrations.map((m) => ({ id: m.branchId, name: m.branchName }))}
      />

      {/* Rollback Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={rollbackConfirmation.isOpen}
        onClose={rollbackConfirmation.cancel}
        title={rollbackConfirmation.title}
        message={rollbackConfirmation.message}
        variant={rollbackConfirmation.variant}
        confirmLabel="Rollback"
        cancelLabel="Cancel"
        onConfirm={rollbackConfirmation.confirm}
        isProcessing={rollbackConfirmation.isProcessing}
      />

      {/* Rollback All Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={rollbackAllConfirmation.isOpen}
        onClose={rollbackAllConfirmation.cancel}
        title={rollbackAllConfirmation.title}
        message={rollbackAllConfirmation.message}
        variant={rollbackAllConfirmation.variant}
        confirmLabel="Rollback All"
        cancelLabel="Cancel"
        onConfirm={rollbackAllConfirmation.confirm}
        isProcessing={rollbackAllConfirmation.isProcessing}
      />
    </div>
  );
}
