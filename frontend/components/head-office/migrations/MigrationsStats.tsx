"use client";

interface StatsData {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  inProgress: number;
}

interface MigrationsStatsProps {
  stats: StatsData;
}

export function MigrationsStats({ stats }: MigrationsStatsProps) {
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Branches</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
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
        <p className="mt-1 text-2xl font-semibold text-red-900 dark:text-red-300">{stats.failed}</p>
      </div>
    </div>
  );
}
