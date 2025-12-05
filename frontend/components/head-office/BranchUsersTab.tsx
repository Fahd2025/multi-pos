/**
 * Branch Users Tab Component
 * Displays and manages users assigned to a specific branch
 */

"use client";

import React, { useState, useEffect } from "react";
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
import {
  BranchUserDto,
  getBranchUsers,
  createBranchUser,
  updateBranchUser,
  deleteBranchUser,
  CreateBranchUserDto,
  UpdateBranchUserDto,
} from "@/services/branch-user.service";

interface BranchUsersTabProps {
  branchId: string;
  branchName: string;
  isHeadOfficeAdmin: boolean;
}

export const BranchUsersTab: React.FC<BranchUsersTabProps> = ({
  branchId,
  branchName,
  isHeadOfficeAdmin,
}) => {
  const [users, setUsers] = useState<BranchUserDto[]>([]);
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

  const createEditModal = useModal<BranchUserDto>();
  const viewModal = useModal<BranchUserDto>();
  const confirmation = useConfirmation();

  // Load users on mount
  useEffect(() => {
    loadBranchUsers();
  }, [branchId]);

  const loadBranchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get users for this branch from branch database
      const users = await getBranchUsers(true, branchId);
      setUsers(users);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  // Adapter for sort change
  const handleSortChange = (config: { key: keyof BranchUserDto | string; direction: "asc" | "desc" }) => {
    handleSort(config.key);
  };

  // Define table columns
  const columns: DataTableColumn<BranchUserDto>[] = [
    {
      key: "username",
      label: "Username",
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
      ),
    },
    {
      key: "fullNameEn",
      label: "Full Name",
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (value) => {
        const colorMap: Record<string, string> = {
          Manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
          Cashier: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[value] || "bg-gray-100 text-gray-800"}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value
              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
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
  const actions: DataTableAction<BranchUserDto>[] = [
    {
      label: "View",
      onClick: (row) => viewModal.open(row),
      variant: "secondary",
    },
    ...(isHeadOfficeAdmin
      ? [
          {
            label: "Edit",
            onClick: (row: BranchUserDto) => createEditModal.open(row, "edit"),
            variant: "primary" as const,
          },
          {
            label: "Delete",
            onClick: (row: BranchUserDto) => handleDeleteClick(row),
            variant: "danger" as const,
          },
        ]
      : []),
  ];

  // Define form fields for create/edit modal
  const formFields: FormField<CreateBranchUserDto | UpdateBranchUserDto>[] = [
    ...(createEditModal.mode === "create"
      ? [
          {
            name: "username" as keyof CreateBranchUserDto,
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
            name: "password" as keyof CreateBranchUserDto,
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
            name: "newPassword" as keyof UpdateBranchUserDto,
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
      name: "role",
      label: "Role",
      type: "select" as const,
      required: true,
      defaultValue: "Cashier",
      options: [
        { label: "Manager", value: "Manager" },
        { label: "Cashier", value: "Cashier" },
      ],
    },
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
      name: "isActive",
      label: "Active",
      type: "checkbox" as const,
      defaultValue: true,
    },
  ];

  // Define display fields for view dialog
  const displayFields: DisplayField<BranchUserDto>[] = [
    { key: "username", label: "Username" },
    { key: "fullNameEn", label: "Full Name (English)" },
    { key: "fullNameAr", label: "Full Name (Arabic)" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "Manager" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
          }`}
        >
          {value}
        </span>
      ),
    },
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
      key: "lastLoginAt",
      label: "Last Login",
      render: (value) => (value ? new Date(value).toLocaleString() : "Never"),
    },
  ];

  // Handlers
  const handleCreate = () => {
    createEditModal.open(undefined, "create");
  };

  const handleSubmit = async (data: CreateBranchUserDto | UpdateBranchUserDto) => {
    setIsSubmitting(true);

    try {
      if (createEditModal.mode === "create") {
        // Create new user
        await createBranchUser(data as CreateBranchUserDto, branchId);
      } else {
        // Update existing user
        const userId = createEditModal.data?.id;
        if (userId) {
          await updateBranchUser(userId, data as UpdateBranchUserDto, branchId);
        }
      }

      // Reload users and close modal
      await loadBranchUsers();
      createEditModal.close();
    } catch (err: any) {
      alert(`Failed to ${createEditModal.mode} user: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: BranchUserDto) => {
    confirmation.ask(
      "Delete User",
      `Are you sure you want to delete "${user.fullNameEn}" (${user.username})? This action cannot be undone.`,
      async () => {
        try {
          await deleteBranchUser(user.id, branchId);
          await loadBranchUsers();
        } catch (err: any) {
          alert(`Failed to delete user: ${err.message}`);
        }
      },
      "danger"
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-800 dark:text-red-400 font-medium">Error loading users</p>
          <p className="text-red-600 dark:text-red-300 mt-2">{error}</p>
          <button
            onClick={loadBranchUsers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Branch Users
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {users.length} user(s) assigned to this branch
          </p>
        </div>
        {isHeadOfficeAdmin && (
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
        )}
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">No users assigned</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isHeadOfficeAdmin
              ? "Get started by creating users for this branch."
              : "No users have been created for this branch yet."}
          </p>
          {isHeadOfficeAdmin && (
            <div className="mt-6">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add First User
              </button>
            </div>
          )}
        </div>
      ) : (
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
          emptyMessage="No users found."
        />
      )}

      {/* Modals */}
      {isHeadOfficeAdmin && (
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
      )}

      <FeaturedDialog
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        title="User Details"
        data={viewModal.data || ({} as BranchUserDto)}
        fields={displayFields}
        actions={[
          {
            label: "Close",
            onClick: () => viewModal.close(),
            variant: "secondary",
          },
        ]}
        size="md"
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
};
