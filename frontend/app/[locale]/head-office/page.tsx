/**
 * Head Office Dashboard
 * Overview of all branches with key metrics
 * Now using feature-based color variants from Phase 2 enhancements
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import branchService, { BranchDto } from "@/services/branch.service";
import {
  LoadingSpinner,
  ErrorAlert,
  StatCard,
  ActionCard,
  PageHeader,
  Button,
} from "@/components/shared";
import {
  Building2,
  CheckCircle2,
  Users,
  Heart,
  BarChart3,
} from "lucide-react";

interface DashboardStats {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  totalUsers: number;
  // These would come from a dedicated dashboard API in production
  totalSales?: number;
  totalRevenue?: number;
}

export default function HeadOfficeDashboard({ params }: { params: Promise<{ locale: string }> }) {
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
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error} />
        <Button onClick={loadDashboardData} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Head Office Dashboard"
        description="Overview of all branches and key metrics"
      />

      {/* Stats Cards - Now using feature variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Branches"
          value={stats.totalBranches}
          icon={Building2}
          variant="default"
          valueSize="lg"
          footer={
            <>
              <span className="text-success font-medium">
                {stats.activeBranches} Active
              </span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {stats.inactiveBranches} Inactive
              </span>
            </>
          }
        />

        <StatCard
          title="Active Branches"
          value={stats.activeBranches}
          description="Currently operational"
          icon={CheckCircle2}
          variant="sales"
          valueSize="lg"
        />

        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="Across all branches"
          icon={Users}
          variant="users"
          valueSize="lg"
        />

        <StatCard
          title="System Status"
          value="Healthy"
          description="All systems operational"
          icon={Heart}
          variant="sales"
          valueSize="lg"
        />
      </div>

      {/* Recent Branches */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Branches
          </h2>
          <Link
            href={`/${locale}/head-office/branches`}
            className="text-sm text-primary hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="p-6">
          {recentBranches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No branches found. Create your first branch to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {recentBranches.map((branch) => (
                <Link
                  key={branch.id}
                  href={`/${locale}/head-office/branches/${branch.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors touch-target"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {branch.nameEn}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Code: {branch.code} • {branch.userCount} users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        branch.isActive
                          ? "bg-sales/10 text-sales"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {branch.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-muted-foreground">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Now using feature variants */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title="Manage Branches"
            description="Create, edit, and configure branches"
            icon={Building2}
            variant="default"
            layout="vertical"
            href={`/${locale}/head-office/branches`}
          />

          <ActionCard
            title="Manage Users"
            description="Add users and assign roles"
            icon={Users}
            variant="users"
            layout="vertical"
            href={`/${locale}/head-office/users`}
          />

          <ActionCard
            title="View Analytics"
            description="Multi-branch performance reports"
            icon={BarChart3}
            variant="reports"
            layout="vertical"
            href={`/${locale}/head-office/analytics`}
          />
        </div>
      </div>
    </div>
  );
}
