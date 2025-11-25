/**
 * Head Office Dashboard
 * Overview of all branches with key metrics
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import branchService, { BranchDto } from '@/services/branch.service';

interface DashboardStats {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  totalUsers: number;
  // These would come from a dedicated dashboard API in production
  totalSales?: number;
  totalRevenue?: number;
}

export default function HeadOfficeDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const [stats, setStats] = useState<DashboardStats>({
    totalBranches: 0,
    activeBranches: 0,
    inactiveBranches: 0,
    totalUsers: 0,
  });
  const [recentBranches, setRecentBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all branches
      const branchesData = await branchService.getBranches({ page: 1, pageSize: 100 });

      // Calculate stats
      const activeBranches = branchesData.data.filter((b) => b.isActive);
      const inactiveBranches = branchesData.data.filter((b) => !b.isActive);
      const totalUsers = branchesData.data.reduce((sum, b) => sum + b.userCount, 0);

      setStats({
        totalBranches: branchesData.pagination.totalItems,
        activeBranches: activeBranches.length,
        inactiveBranches: inactiveBranches.length,
        totalUsers,
      });

      // Get recent branches (last 5)
      setRecentBranches(branchesData.data.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-400">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Head Office Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Overview of all branches and key metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Branches */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Branches</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalBranches}
              </p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 dark:text-green-400 font-medium">
              {stats.activeBranches} Active
            </span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-gray-600 dark:text-gray-400">
              {stats.inactiveBranches} Inactive
            </span>
          </div>
        </div>

        {/* Active Branches */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Branches</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.activeBranches}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Currently operational
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalUsers}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Across all branches
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                Healthy
              </p>
            </div>
            <div className="text-4xl">💚</div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            All systems operational
          </div>
        </div>
      </div>

      {/* Recent Branches */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Branches
          </h2>
          <Link
            href={`/${locale}/head-office/branches`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="p-6">
          {recentBranches.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No branches found. Create your first branch to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {recentBranches.map((branch) => (
                <Link
                  key={branch.id}
                  href={`/${locale}/head-office/branches/${branch.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">🏢</div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {branch.nameEn}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Code: {branch.code} • {branch.userCount} users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        branch.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/${locale}/head-office/branches`}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <div className="text-3xl mb-3">🏢</div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Manage Branches
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Create, edit, and configure branches
          </p>
        </Link>

        <Link
          href={`/${locale}/head-office/users`}
          className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
        >
          <div className="text-3xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
            Manage Users
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Add users and assign roles
          </p>
        </Link>

        <Link
          href={`/${locale}/head-office/analytics`}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <div className="text-3xl mb-3">📈</div>
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            View Analytics
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Multi-branch performance reports
          </p>
        </Link>
      </div>
    </div>
  );
}
