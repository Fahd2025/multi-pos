"use client";

import { useEffect, useState } from "react";
import { BranchMigrationStatus } from "@/types/migrations";
import { getAllMigrationStatus, validateBranchDatabase } from "@/lib/migrations";
import { BranchMigrationCard } from "@/components/head-office/migrations/BranchMigrationCard";
import { MigrationHistoryModal } from "@/components/head-office/migrations/MigrationHistoryModal";
import { ApplyMigrationsDialog } from "@/components/head-office/migrations/ApplyMigrationsDialog";
import { PendingMigrationsModal } from "@/components/head-office/migrations/PendingMigrationsModal";

export default function MigrationsPage() {
  const [migrations, setMigrations] = useState<BranchMigrationStatus[]>([]);
  const [filteredMigrations, setFilteredMigrations] = useState<BranchMigrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isApplyingToAll, setIsApplyingToAll] = useState(false);

  useEffect(() => {
    loadMigrations();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMigrations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterMigrations();
  }, [migrations, searchQuery, statusFilter]);

  const loadMigrations = async () => {
    try {
      const data = await getAllMigrationStatus();
      setMigrations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load migration status");
    } finally {
      setIsLoading(false);
    }
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
      const message = result.isValid
        ? `✓ Database schema for "${branch.branchName}" is valid`
        : `✗ Database schema for "${branch.branchName}" has integrity issues`;

      alert(message);
    } catch (err) {
      alert(`Failed to validate: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleMigrationSuccess = () => {
    loadMigrations();
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Branch Migrations
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage database migrations across all branches
              </p>
            </div>
            <button
              onClick={handleApplyToAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply to All Branches
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Branches</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-300">
                {stats.completed}
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-yellow-900 dark:text-yellow-300">
                {stats.pending}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">In Progress</p>
              <p className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-300">
                {stats.inProgress}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
              <p className="mt-1 text-2xl font-semibold text-red-900 dark:text-red-300">
                {stats.failed}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="InProgress">In Progress</option>
              <option value="Failed">Failed</option>
              <option value="RequiresManualIntervention">Manual Action Required</option>
            </select>
            <button
              onClick={loadMigrations}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
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
                key={migration.branchId}
                migration={migration}
                onApplyMigrations={handleApplyMigrations}
                onViewHistory={handleViewHistory}
                onViewPending={handleViewPending}
                onValidate={handleValidate}
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
      />
    </div>
  );
}
