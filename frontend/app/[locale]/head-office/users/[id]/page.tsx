/**
 * User Details Page
 *
 * Shows comprehensive user information including:
 * - Profile details
 * - Branch assignments
 * - Recent activity log (last 100 activities)
 * - Audit trail
 */

"use client";

import React, { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog, FeaturedDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useModal, useConfirmation } from "@/hooks/useModal";
import { DataTableColumn, FormField } from "@/types/data-table.types";
import {
  UserDto,
  getUserById,
  getUserActivity,
  UserActivityDto,
  assignBranch,
  removeBranchAssignment,
  AssignBranchDto,
} from "@/services/user.service";

export default function UserDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const [user, setUser] = useState<UserDto | null>(null);
  const [activities, setActivities] = useState<UserActivityDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details");

  const assignBranchModal = useModal();
  const confirmation = useConfirmation();

  // Initialize DataTable for activities
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(activities, {
    pageSize: 20,
    sortable: true,
    pagination: true,
    initialSort: { key: "timestamp", direction: "desc" },
  });

  useEffect(() => {
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [userData, activityData] = await Promise.all([
        getUserById(id),
        getUserActivity(id, 100),
      ]);

      setUser(userData);
      setActivities(activityData);
    } catch (err: any) {
      setError(err.message || "Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (config: {
    key: keyof UserActivityDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  const handleRemoveBranch = (branchId: string, branchName: string) => {
    confirmation.ask(
      "Remove Branch Assignment",
      `Are you sure you want to remove "${branchName}" assignment from this user?`,
      async () => {
        try {
          await removeBranchAssignment(id, branchId);
          await loadUserData();
        } catch (err: any) {
          alert(`Failed to remove branch assignment: ${err.message}`);
        }
      },
      "warning"
    );
  };

  // Activity log columns
  const activityColumns: DataTableColumn<UserActivityDto>[] = [
    {
      key: "timestamp",
      label: "Date & Time",
      sortable: true,
      width: "200px",
      render: (value) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="text-gray-500">{new Date(value).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: "entityType",
      label: "Entity Type",
      sortable: true,
      render: (value) => <span className="font-medium text-gray-700">{value}</span>,
    },
    {
      key: "entityId",
      label: "Entity ID",
      render: (value) => (
        <span className="font-mono text-xs text-gray-600">
          {value ? value.substring(0, 8) + "..." : "-"}
        </span>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (value) => <span className="text-sm text-gray-600">{value || "-"}</span>,
    },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (value) => <span className="font-mono text-xs text-gray-500">{value || "-"}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Error loading user</p>
            <p className="text-red-600 mt-2">{error || "User not found"}</p>
            <div className="mt-4 space-x-2">
              <button
                onClick={loadUserData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
              <Link
                href={`/${locale}/head-office/users`}
                className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Users
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/head-office/users`}
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Users
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {user.fullNameEn}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">@{user.username}</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.isHeadOfficeAdmin
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.isHeadOfficeAdmin ? "Head Office Admin" : "Branch User"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile & Branches
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "activity"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Activity Log
              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                {activities.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white dark:bg-gray-800  rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Username
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Email
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Full Name (English)
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{user.fullNameEn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Full Name (Arabic)
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{user.fullNameAr || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Phone
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{user.phone || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Preferred Language
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.preferredLanguage === "en" ? "English" : "Arabic"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Last Login
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Last Activity
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.lastActivityAt
                      ? new Date(user.lastActivityAt).toLocaleString()
                      : "No activity"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Account Created
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Last Updated
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {new Date(user.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Branch Assignments */}
            <div className="bg-white dark:bg-gray-800  rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Branch Assignments ({user.assignedBranches.length})
                </h2>
                {!user.isHeadOfficeAdmin && (
                  <button
                    onClick={() => assignBranchModal.open(undefined, "create")}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Assign Branch
                  </button>
                )}
              </div>

              {user.isHeadOfficeAdmin ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Head Office Administrator</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This user has full access to all branches and head office features
                  </p>
                </div>
              ) : user.assignedBranches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No branch assignments</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Assign Branch" to add this user to a branch
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.assignedBranches.map((branch) => (
                    <div
                      key={branch.branchId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {branch.branchNameEn}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Code: {branch.branchCode}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                            {branch.role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Assigned {new Date(branch.assignedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveBranch(branch.branchId, branch.branchNameEn)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-6">
            {/* Activity Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800  p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {activities.length}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Last 100 activities</p>
              </div>
              <div className="bg-white dark:bg-gray-800  p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Most Recent</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {activities.length > 0
                    ? new Date(activities[0].timestamp).toLocaleDateString()
                    : "No activity"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800  p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Unique Actions</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(activities.map((a) => a.action)).size}
                </p>
              </div>
            </div>

            {/* Activity Log Table */}
            <div className="bg-white dark:bg-gray-800  rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent Activity
              </h2>
              <DataTable
                data={displayData}
                columns={activityColumns}
                getRowKey={(row) => row.id}
                pagination
                paginationConfig={paginationConfig}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                sortable
                sortConfig={sortConfig ?? undefined}
                onSortChange={handleSortChange}
                emptyMessage="No activity records found for this user."
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={confirmation.confirm}
        isProcessing={confirmation.isProcessing}
      />
    </div>
  );
}
