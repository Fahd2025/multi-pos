"use client";

interface MigrationsFiltersProps {
  searchQuery: string;
  statusFilter: string;
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
}

export function MigrationsFilters({
  searchQuery,
  statusFilter,
  isLoading,
  onSearchChange,
  onStatusFilterChange,
  onRefresh,
}: MigrationsFiltersProps) {
  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search branches..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
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
        onClick={onRefresh}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
}
