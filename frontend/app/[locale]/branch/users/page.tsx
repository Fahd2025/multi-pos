/**
 * Branch Users Management Page
 *
 * Comprehensive user management for branch managers.
 * Allows creating, editing, viewing, and managing branch users.
 */

"use client";

import React, { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { DataTable, FeaturedDialog, ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useModal } from "@/hooks/useModal";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useApiError } from "@/hooks/useApiError";
import {
  DataTableColumn,
  DataTableAction,
  DisplayField,
  FormField,
} from "@/types/data-table.types";
import {
  BranchUserDto,
  CreateBranchUserDto,
  UpdateBranchUserDto,
  getBranchUsers,
  createBranchUser,
  updateBranchUser,
  deleteBranchUser,
  checkUsernameAvailability,
} from "@/services/branch-user.service";
import Link from "next/link";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/shared/Button";

export default function BranchUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const { canManage } = usePermission();

  // State management
  const [users, setUsers] = useState<BranchUserDto[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<BranchUserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Error handling
  const { error, errorMessage, isError, setError, clearError } = useApiError();

  // Modals
  const createModal = useModal<BranchUserDto>();
  const editModal = useModal<BranchUserDto>();
  const viewModal = useModal<BranchUserDto>();
  const changePasswordModal = useModal<BranchUserDto>();
  const deleteConfirmation = useConfirmation<BranchUserDto>();

  // DataTable hook
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(filteredUsers, {
    pageSize: 10,
    sortable: true,
    pagination: true,
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - RoleGuard already handles permission check

  // Apply filters whenever users, filters, or search changes
  useEffect(() => {
    applyFilters();
  }, [users, roleFilter, statusFilter, searchQuery]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      clearError();

      const result = await getBranchUsers(true); // Include inactive
      setUsers(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((u) => u.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((u) => !u.isActive);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.fullNameEn?.toLowerCase().includes(query) ||
          u.fullNameAr?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreate = async (data: CreateBranchUserDto) => {
    try {
      setIsSaving(true);
      clearError();

      // Check username availability
      const isAvailable = await checkUsernameAvailability(data.username);
      if (!isAvailable) {
        throw new Error("Username is already taken");
      }

      await createBranchUser(data);
      await loadUsers();
      createModal.close();
    } catch (err: any) {
      setError(err);
      throw err; // Re-throw to prevent modal from closing
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: UpdateBranchUserDto) => {
    if (!editModal.data) return;

    try {
      setIsSaving(true);
      clearError();

      await updateBranchUser(editModal.data.id, data);
      await loadUsers();
      editModal.close();
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (data: { newPassword: string }) => {
    if (!changePasswordModal.data) return;

    try {
      setIsSaving(true);
      clearError();

      const updateData: UpdateBranchUserDto = {
        newPassword: data.newPassword,
      };

      await updateBranchUser(changePasswordModal.data.id, updateData);
      changePasswordModal.close();
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.data) return;

    try {
      setIsSaving(true);
      clearError();

      await deleteBranchUser(deleteConfirmation.data.id);
      await loadUsers();
      deleteConfirmation.close();
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSortChange = (config: {
    key: keyof BranchUserDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  // Form fields for creating a user
  const createFields: FormField<CreateBranchUserDto>[] = [
    {
      name: "username",
      label: "Username",
      type: "text",
      placeholder: "Enter username",
      required: true,
      helperText: "Unique username for login",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Enter password",
      required: true,
      helperText: "Minimum 6 characters",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "user@example.com",
      required: true,
    },
    {
      name: "fullNameEn",
      label: "Full Name (English)",
      type: "text",
      placeholder: "Enter full name in English",
      required: true,
    },
    {
      name: "fullNameAr",
      label: "Full Name (Arabic)",
      type: "text",
      placeholder: "أدخل الاسم الكامل بالعربية",
      required: false,
      dir: "rtl",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "+1234567890",
      required: false,
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      options: [
        { label: "Cashier", value: "Cashier" },
        { label: "Manager", value: "Manager" },
      ],
      helperText: "Manager can manage users and settings, Cashier can only process sales",
    },
    {
      name: "preferredLanguage",
      label: "Preferred Language",
      type: "select",
      required: false,
      options: [
        { label: "English", value: "en" },
        { label: "Arabic", value: "ar" },
      ],
    },
    {
      name: "isActive",
      label: "Active",
      type: "checkbox",
      helperText: "Inactive users cannot log in",
    },
  ];

  // Form fields for editing a user (password is optional)
  const editFields: FormField<UpdateBranchUserDto>[] = [
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "user@example.com",
      required: false,
    },
    {
      name: "fullNameEn",
      label: "Full Name (English)",
      type: "text",
      placeholder: "Enter full name in English",
      required: false,
    },
    {
      name: "fullNameAr",
      label: "Full Name (Arabic)",
      type: "text",
      placeholder: "أدخل الاسم الكامل بالعربية",
      required: false,
      dir: "rtl",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "+1234567890",
      required: false,
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: false,
      options: [
        { label: "Cashier", value: "Cashier" },
        { label: "Manager", value: "Manager" },
      ],
    },
    {
      name: "preferredLanguage",
      label: "Preferred Language",
      type: "select",
      required: false,
      options: [
        { label: "English", value: "en" },
        { label: "Arabic", value: "ar" },
      ],
    },
    {
      name: "isActive",
      label: "Active",
      type: "checkbox",
    },
  ];

  // Password change fields
  const passwordFields: FormField<{ newPassword: string }>[] = [
    {
      name: "newPassword",
      label: "New Password",
      type: "password",
      placeholder: "Enter new password",
      required: true,
      helperText: "Minimum 6 characters",
    },
  ];

  // Table columns
  const columns: DataTableColumn<BranchUserDto>[] = [
    {
      key: "username",
      label: "Username",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: "fullNameEn",
      label: "Full Name",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{value || "-"}</div>
          {row.fullNameAr && (
            <div className="text-xs text-gray-500" dir="rtl">
              {row.fullNameAr}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "Manager"
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (value) => <span className="text-sm text-gray-600">{value || "-"}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
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
        if (!value) return <span className="text-gray-400 text-sm">Never</span>;
        return (
          <div className="text-sm">
            <div className="text-gray-900 dark:text-gray-100">
              {new Date(value).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-500">{new Date(value).toLocaleTimeString()}</div>
          </div>
        );
      },
    },
  ];

  // Row actions
  const actions: DataTableAction<BranchUserDto>[] = [
    {
      label: "View",
      onClick: (row) => viewModal.open(row, "view"),
      variant: "secondary",
    },
    {
      label: "Edit",
      onClick: (row) => editModal.open(row, "edit"),
      variant: "primary",
    },
    {
      label: "Change Password",
      onClick: (row) => changePasswordModal.open(row, "edit"),
      variant: "secondary",
    },
    {
      label: "Delete",
      onClick: (row) => deleteConfirmation.open(row),
      variant: "danger",
    },
  ];

  // Display fields for view mode
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
      render: (value) => (value === "en" ? "English" : value === "ar" ? "Arabic" : "-"),
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
    {
      key: "createdAt",
      label: "Created",
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      render: (value) => new Date(value).toLocaleString(),
    },
  ];

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    managers: users.filter((u) => u.role === "Manager").length,
    cashiers: users.filter((u) => u.role === "Cashier").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard
      requireRole={UserRole.Manager}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Only Managers can access User Management.
          </p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>Go to Dashboard</Button>
        </div>
      }
    >
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {/* <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href={`/${locale}/branch`} className="hover:text-blue-600">
              Branch
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100">Users</span>
          </div> */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  User Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage branch users, roles, and permissions
                </p>
              </div>
              <button
                onClick={() => createModal.open(undefined, "create")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                + Add User
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {isError && errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-200">Error</p>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={clearError}
                className="ml-3 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.inactive}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Managers</p>
            <p className="text-2xl font-bold text-purple-600">{stats.managers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Cashiers</p>
            <p className="text-2xl font-bold text-blue-600">{stats.cashiers}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Filters & Search
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, email..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">All Roles</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Users List
          </h2>
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
            emptyMessage="No users found. Click 'Add User' to create your first user."
          />
        </div>
      </div>

      {/* Create User Modal */}
      <FeaturedDialog
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        title="Create New User"
        mode="create"
        fields={createFields}
        onSubmit={handleCreate}
        isSubmitting={isSaving}
        size="lg"
      />

      {/* Edit User Modal */}
      <FeaturedDialog
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        title="Edit User"
        mode="edit"
        fields={editFields}
        onSubmit={handleUpdate}
        initialData={editModal.data || undefined}
        isSubmitting={isSaving}
        size="lg"
      />

      {/* View User Modal */}
      <FeaturedDialog
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        title="User Details"
        mode="edit"
        fields={[]}
        onSubmit={() => viewModal.close()}
        showSubmitButton={false}
        cancelLabel="Close"
        size="lg"
        additionalContent={
          <div className="space-y-4">
            {viewModal.data &&
              displayFields.map((field) => (
                <div
                  key={field.key.toString()}
                  className="grid grid-cols-3 gap-4 border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0"
                >
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {field.label}
                  </div>
                  <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">
                    {field.render
                      ? field.render(
                          viewModal.data![field.key as keyof BranchUserDto],
                          viewModal.data!
                        )
                      : String(viewModal.data![field.key as keyof BranchUserDto] || "-")}
                  </div>
                </div>
              ))}
          </div>
        }
      />

      {/* Change Password Modal */}
      <FeaturedDialog
        isOpen={changePasswordModal.isOpen}
        onClose={changePasswordModal.close}
        title={`Change Password - ${changePasswordModal.data?.username}`}
        mode="edit"
        fields={passwordFields}
        onSubmit={handleChangePassword}
        isSubmitting={isSaving}
        size="md"
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={deleteConfirmation.close}
        onConfirm={handleDelete}
        variant="danger"
        title="Delete User"
        message={
          deleteConfirmation.data
            ? `Are you sure you want to delete user "${deleteConfirmation.data.username}"? This will deactivate the user account.`
            : ""
        }
        confirmLabel="Delete"
        isProcessing={isSaving}
      />
    </RoleGuard>
  );
}
