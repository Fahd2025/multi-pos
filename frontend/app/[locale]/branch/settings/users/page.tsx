/**
 * Branch Users Page
 *
 * Allows branch managers to view and manage users assigned to their branch.
 * Shows user roles, activity, and allows managing branch-specific user settings.
 */

"use client";

import React, { useState, useEffect } from "react";
import { use } from "react";
import { DataTable } from "@/components/shared";
import { FeaturedDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useModal } from "@/hooks/useModal";
import { DataTableColumn, DataTableAction, DisplayField } from "@/types/data-table.types";
import Link from "next/link";
import { UserDto, getUsers, getUserActivity, UserActivityDto } from "@/services/user.service";

export default function BranchUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserActivity, setSelectedUserActivity] = useState<UserActivityDto[]>([]);

  const viewModal = useModal<UserDto>();
  const activityModal = useModal<UserDto>();

  // Initialize DataTable
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(users, {
    pageSize: 10,
    sortable: true,
    pagination: true,
  });

  // Activity table
  const activityTable = useDataTable(selectedUserActivity, {
    pageSize: 10,
    sortable: true,
    pagination: true,
    initialSort: { key: "timestamp", direction: "desc" },
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current branch from context (you might need to implement branch context)
      // For now, we'll get all users and filter branch users
      const result = await getUsers(true); // Include inactive

      // Filter to only show branch users (not head office admins)
      const branchUsers = result.users.filter((u) => !u.isHeadOfficeAdmin);
      setUsers(branchUsers);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewActivity = async (user: UserDto) => {
    try {
      const activity = await getUserActivity(user.id, 100);
      setSelectedUserActivity(activity);
      activityModal.open(user, "view");
    } catch (err: any) {
      alert(`Failed to load user activity: ${err.message}`);
    }
  };

  const handleSortChange = (config: { key: keyof UserDto | string; direction: "asc" | "desc" }) => {
    handleSort(config.key);
  };

  const handleActivitySortChange = (config: {
    key: keyof UserActivityDto | string;
    direction: "asc" | "desc";
  }) => {
    activityTable.handleSort(config.key);
  };

  // Define table columns
  const columns: DataTableColumn<UserDto>[] = [
    {
      key: "username",
      label: "Username",
      sortable: true,
      render: (value, row) => <div className="font-medium text-gray-900">{value}</div>,
    },
    {
      key: "fullNameEn",
      label: "Full Name",
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "assignedBranches",
      label: "Role in Branches",
      render: (value: UserDto["assignedBranches"]) => (
        <div className="space-y-1">
          {value.length === 0 ? (
            <span className="text-gray-400 italic text-sm">No branches</span>
          ) : (
            value.map((branch) => (
              <div key={branch.branchId} className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{branch.branchNameEn}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {branch.role}
                </span>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">Never</span>;
        return (
          <span className="text-sm text-gray-600">{new Date(value).toLocaleDateString()}</span>
        );
      },
    },
  ];

  // Define row actions
  const actions: DataTableAction<UserDto>[] = [
    {
      label: "View Details",
      onClick: (row) => viewModal.open(row, "view"),
      variant: "secondary",
    },
    {
      label: "View Activity",
      onClick: (row) => handleViewActivity(row),
      variant: "primary",
    },
  ];

  // Define display fields for view dialog
  const displayFields: DisplayField<UserDto>[] = [
    { key: "username", label: "Username" },
    { key: "fullNameEn", label: "Full Name (English)" },
    { key: "fullNameAr", label: "Full Name (Arabic)" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "preferredLanguage",
      label: "Preferred Language",
      render: (value) => (value === "en" ? "English" : "Arabic"),
    },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "assignedBranches",
      label: "Branch Assignments",
      render: (value: UserDto["assignedBranches"]) => (
        <div className="space-y-1">
          {value.length === 0 ? (
            <span className="text-gray-400 italic">No branches assigned</span>
          ) : (
            value.map((branch) => (
              <div
                key={branch.branchId}
                className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded"
              >
                <span className="font-medium">{branch.branchNameEn}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {branch.role}
                </span>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      render: (value) => (value ? new Date(value).toLocaleString() : "Never"),
    },
  ];

  // Activity log columns
  const activityColumns: DataTableColumn<UserActivityDto>[] = [
    {
      key: "timestamp",
      label: "Date & Time",
      sortable: true,
      width: "180px",
      render: (value) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{new Date(value).toLocaleDateString()}</div>
          <div className="text-gray-500 text-xs">{new Date(value).toLocaleTimeString()}</div>
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
      key: "details",
      label: "Details",
      render: (value) => <span className="text-sm text-gray-600">{value || "-"}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Error loading users</p>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={loadUsers}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
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
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href={`/${locale}/branch/settings`} className="hover:text-blue-600">
              Settings
            </Link>
            <span>/</span>
            <span className="text-gray-900">Users</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Branch Users</h1>
          <p className="text-gray-600">View and manage users assigned to this branch</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-3 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Branch Manager View</p>
              <p className="text-sm text-blue-800 mt-1">
                As a branch manager, you can view all users assigned to your branch. To add or
                remove users, please contact the head office administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.isActive).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Inactive Users</p>
            <p className="text-2xl font-bold text-gray-600">
              {users.filter((u) => !u.isActive).length}
            </p>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Users List</h2>
          <DataTable
            data={displayData}
            columns={columns}
            actions={actions}
            getRowKey={(row) => row.id}
            pagination
            paginationConfig={paginationConfig}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            sortable
            sortConfig={sortConfig ?? undefined}
            onSortChange={handleSortChange}
            emptyMessage="No users found in this branch."
          />
        </div>
      </div>

      {/* View Details Modal */}
      <FeaturedDialog
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        title="User Details"
        data={viewModal.data || ({} as UserDto)}
        fields={displayFields}
        size="lg"
      />

      {/* Activity Modal */}
      {activityModal.data && (
        <FeaturedDialog
          isOpen={activityModal.isOpen}
          onClose={activityModal.close}
          title={`Activity Log - ${activityModal.data.fullNameEn}`}
          data={activityModal.data}
          fields={[
            {
              key: "fullNameEn",
              label: "User",
              render: (value) => (
                <div>
                  <p className="font-medium text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500">@{activityModal.data?.username}</p>
                </div>
              ),
            },
          ]}
          size="xl"
          customContent={
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Recent Activity ({selectedUserActivity.length} records)
              </h3>
              <DataTable
                data={activityTable.data}
                columns={activityColumns}
                getRowKey={(row) => row.id}
                pagination
                paginationConfig={activityTable.paginationConfig}
                onPageChange={activityTable.handlePageChange}
                onPageSizeChange={activityTable.handlePageSizeChange}
                sortable
                sortConfig={activityTable.sortConfig ?? undefined}
                onSortChange={handleActivitySortChange}
                emptyMessage="No activity records found for this user."
              />
            </div>
          }
        />
      )}
    </div>
  );
}
