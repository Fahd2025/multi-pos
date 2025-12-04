/**
 * Branch Details Page
 * View and manage individual branch information
 */

"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import branchService, { BranchDto } from "@/services/branch.service";
import { BranchFormModal } from "@/components/head-office/BranchFormModal";
import { BranchSettingsForm } from "@/components/head-office/BranchSettingsForm";
import { DatabaseConnectionTest } from "@/components/head-office/DatabaseConnectionTest";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorAlert } from "@/components/shared/ErrorAlert";

export default function BranchDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const [branch, setBranch] = useState<BranchDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "settings" | "users" | "database">("info");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadBranch();
  }, [id]);

  const loadBranch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await branchService.getBranchById(id);
      setBranch(data);
    } catch (err: any) {
      setError(err.message || "Failed to load branch details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading branch details..." />;
  }

  if (error || !branch) {
    return (
      <div>
        <ErrorAlert message={error || "Branch not found"} />
        <Link
          href={`/${locale}/head-office/branches`}
          className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Branches
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "info" as const, name: "Information", icon: "ℹ️" },
    { id: "settings" as const, name: "Settings", icon: "⚙️" },
    { id: "users" as const, name: "Users", icon: "👥" },
    { id: "database" as const, name: "Database", icon: "💾" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/${locale}/head-office/branches`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Back to Branches
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{branch.nameEn}</h1>
            <StatusBadge variant={branch.isActive ? "success" : "neutral"}>
              {branch.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Code: {branch.code} • Login: {branch.loginName}
          </p>
        </div>
        <Button onClick={() => setShowEditModal(true)}>Edit Branch</Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800  rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Basic Information
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Branch Code</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.code}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">English Name</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.nameEn}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Arabic Name</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.nameAr}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Login Name</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.loginName}
                  </dd>
                </div>
                {branch.email && (
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Email</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {branch.email}
                    </dd>
                  </div>
                )}
                {branch.phone && (
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Phone</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {branch.phone}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Database Information */}
            <div className="bg-white dark:bg-gray-800  rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Database Configuration
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Provider</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branchService.getDatabaseProviderName(branch.databaseProvider)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Server</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.dbServer}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Database Name</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.dbName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Port</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.dbPort}
                  </dd>
                </div>
                {branch.dbUsername && (
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Username</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {branch.dbUsername}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Regional Settings */}
            <div className="bg-white dark:bg-gray-800  rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Regional Settings
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Language</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.language === "en" ? "English" : "Arabic"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Currency</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Tax Rate</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.taxRate}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Time Zone</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.timeZone}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800  rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Statistics
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Total Users</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {branch.userCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Created At</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(branch.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Last Updated</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(branch.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === "settings" && <BranchSettingsForm branch={branch} onUpdate={loadBranch} />}

        {activeTab === "users" && (
          <div className="bg-white dark:bg-gray-800  rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Branch Users
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              User management for this branch will be available in User Story 6 (T216-T248).
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Total users assigned: {branch.userCount}
            </p>
          </div>
        )}

        {activeTab === "database" && <DatabaseConnectionTest branchId={branch.id} />}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <BranchFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadBranch}
          branch={branch}
        />
      )}
    </div>
  );
}
