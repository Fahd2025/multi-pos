/**
 * Users Management Page
 *
 * Allows head office administrators to manage user accounts,
 * assign roles, and view user activity.
 * Uses generic DataTable and modals for consistent UX.
 */

"use client";

import React, { useState, useEffect } from "react";
import { use } from "react";
import { DataTable } from "@/components/shared";
import { ModalBottomSheet, FeaturedDialog, ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useModal, useConfirmation } from "@/hooks/useModal";
import {
  DataTableColumn,
  DataTableAction,
  FormField,
  DisplayField,
} from "@/types/data-table.types";
import Link from "next/link";
import {
  UserDto,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  CreateUserDto,
  UpdateUserDto,
} from "@/services/user.service";

export default function UsersManagementPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize hooks
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

  const createEditModal = useModal<UserDto>();
  const viewModal = useModal<UserDto>();
  const confirmation = useConfirmation();

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getUsers(true); // Include inactive users
      setUsers(result.users);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  // Adapter for sort change to match DataTable's expected signature
  const handleSortChange = (config: { key: keyof UserDto | string; direction: "asc" | "desc" }) => {
    handleSort(config.key);
  };

  // Define table columns
  const columns: DataTableColumn<UserDto>[] = [
    {
      key: "username",
      label: "Username",
      sortable: true,
      render: (value, row) => (
        <Link
          href={`/${locale}/head-office/users/${row.id}`}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {value}
        </Link>
      ),
    },
    {
      key: "fullNameEn",
      label: "Full Name",
      sortable: true,
      render: (value, row) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "isHeadOfficeAdmin",
      label: "Role",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
          }`}
        >
          {value ? "Head Office Admin" : "Branch User"}
        </span>
      ),
    },
    {
      key: "assignedBranches",
      label: "Branches",
      render: (value: UserDto["assignedBranches"]) => (
        <div className="text-sm text-gray-600">
          {value.length === 0 ? (
            <span className="text-gray-400 italic">No branches</span>
          ) : (
            <span className="font-medium">{value.length} branch(es)</span>
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
        return new Date(value).toLocaleDateString();
      },
    },
  ];

  // Define row actions
  const actions: DataTableAction<UserDto>[] = [
    {
      label: "View",
      onClick: (row) => {
        // Navigate to user details page
        window.location.href = `/${locale}/head-office/users/${row.id}`;
      },
      variant: "secondary",
    },
    {
      label: "Edit",
      onClick: (row) => createEditModal.open(row, "edit"),
      variant: "primary",
    },
    {
      label: "Delete",
      onClick: (row) => handleDeleteClick(row),
      variant: "danger",
    },
  ];

  // Define form fields for create/edit modal
  const formFields: FormField<CreateUserDto | UpdateUserDto>[] = [
    ...(createEditModal.mode === "create"
      ? [
          {
            name: "username" as keyof CreateUserDto,
            label: "Username",
            type: "text" as const,
            placeholder: "Enter username",
            required: true,
            validation: {
              minLength: 3,
              maxLength: 50,
            },
          },
        ]
      : []),
    {
      name: "fullNameEn",
      label: "Full Name (English)",
      type: "text" as const,
      placeholder: "Enter full name in English",
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100,
      },
    },
    {
      name: "fullNameAr",
      label: "Full Name (Arabic)",
      type: "text" as const,
      placeholder: "أدخل الاسم الكامل بالعربية",
    },
    {
      name: "email",
      label: "Email",
      type: "email" as const,
      placeholder: "user@example.com",
      required: true,
    },
    {
      name: "phone",
      label: "Phone",
      type: "tel" as const,
      placeholder: "+966 50 123 4567",
    },
    ...(createEditModal.mode === "create"
      ? [
          {
            name: "password" as keyof CreateUserDto,
            label: "Password",
            type: "password" as const,
            placeholder: "Enter password",
            required: true,
            validation: {
              minLength: 6,
            },
          },
        ]
      : []),
    ...(createEditModal.mode === "edit"
      ? [
          {
            name: "newPassword" as keyof UpdateUserDto,
            label: "New Password (leave blank to keep current)",
            type: "password" as const,
            placeholder: "Enter new password",
            validation: {
              minLength: 6,
            },
          },
        ]
      : []),
    {
      name: "preferredLanguage",
      label: "Preferred Language",
      type: "select" as const,
      required: true,
      defaultValue: "en",
      options: [
        { label: "English", value: "en" },
        { label: "Arabic", value: "ar" },
      ],
    },
    {
      name: "isHeadOfficeAdmin",
      label: "Head Office Administrator",
      type: "checkbox" as const,
      defaultValue: false,
    },
    {
      name: "isActive",
      label: "Active",
      type: "checkbox" as const,
      defaultValue: true,
    },
  ];

  // Define display fields for view dialog
  const displayFields: DisplayField<UserDto>[] = [
    { key: "id", label: "User ID" },
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
      key: "isHeadOfficeAdmin",
      label: "Role",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
          }`}
        >
          {value ? "Head Office Admin" : "Branch User"}
        </span>
      ),
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
      label: "Assigned Branches",
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
    {
      key: "createdAt",
      label: "Created At",
      render: (value) => new Date(value).toLocaleString(),
    },
  ];

  // Handlers
  const handleCreate = () => {
    createEditModal.open(undefined, "create");
  };

  const handleSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    setIsSubmitting(true);

    try {
      if (createEditModal.mode === "create") {
        // Create new user
        await createUser(data as CreateUserDto);
      } else {
        // Update existing user
        const userId = createEditModal.data?.id;
        if (userId) {
          await updateUser(userId, data as UpdateUserDto);
        }
      }

      // Reload users and close modal
      await loadUsers();
      createEditModal.close();
    } catch (err: any) {
      alert(`Failed to ${createEditModal.mode} user: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: UserDto) => {
    confirmation.ask(
      "Delete User",
      `Are you sure you want to delete user "${user.username}" (${user.fullNameEn})? This action cannot be undone.`,
      async () => {
        try {
          await deleteUser(user.id);
          await loadUsers();
        } catch (err: any) {
          alert(`Failed to delete user: ${err.message}`);
        }
      },
      "danger"
    );
  };

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
    <div>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">Manage system users, roles, and permissions</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {users.length} total user(s) • {users.filter((u) => u.isActive).length} active
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add User
          </button>
        </div>

        {/* DataTable */}
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
          emptyMessage="No users found. Click 'Add User' to create one."
        />

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800  p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800  p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.isActive).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800  p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Head Office Admins</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u) => u.isHeadOfficeAdmin).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800  p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Branch Users</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u) => !u.isHeadOfficeAdmin).length}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModalBottomSheet
        isOpen={createEditModal.isOpen}
        onClose={createEditModal.close}
        title={createEditModal.mode === "create" ? "Create New User" : "Edit User"}
        mode={createEditModal.mode as "create" | "edit"}
        initialData={createEditModal.data || undefined}
        fields={formFields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        size="lg"
      />

      <FeaturedDialog
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        title="User Details"
        data={viewModal.data || ({} as UserDto)}
        fields={displayFields}
        actions={[
          {
            label: "Edit",
            onClick: (data) => {
              viewModal.close();
              createEditModal.open(data, "edit");
            },
            variant: "primary",
          },
          {
            label: "View Activity",
            onClick: (data) => {
              window.location.href = `/${locale}/head-office/users/${data.id}`;
            },
            variant: "secondary",
          },
        ]}
        size="lg"
      />

      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmation.confirm}
        isProcessing={confirmation.isProcessing}
      />
    </div>
  );
}
