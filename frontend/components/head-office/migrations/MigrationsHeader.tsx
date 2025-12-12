"use client";

interface MigrationsHeaderProps {
  onApplyToAll: () => void;
  onRollbackAll: () => void;
  hasPendingMigrations: boolean;
  hasAppliedMigrations: boolean;
}

export function MigrationsHeader({
  onApplyToAll,
  onRollbackAll,
  hasPendingMigrations,
  hasAppliedMigrations
}: MigrationsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branch Migrations</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage database migrations across all branches
        </p>
      </div>
      <div className="flex gap-3">
        {hasPendingMigrations && (
          <button
            onClick={onApplyToAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Apply to All Branches
          </button>
        )}
        {hasAppliedMigrations && (
          <button
            onClick={onRollbackAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Undo All Branches
          </button>
        )}
      </div>
    </div>
  );
}
