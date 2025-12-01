"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input, Select, Button, Icon, ErrorAlert } from "@/components/shared";
import { ThemeSwitcherCompact } from "@/components/shared/ThemeSwitcher";
import branchService, { BranchLookupDto } from "@/services/branch.service";

type LoginMode = "headoffice" | "branch";

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>("branch");
  const [branches, setBranches] = useState<BranchLookupDto[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [formData, setFormData] = useState({
    branchName: "",
    username: "",
    password: "",
  });

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const branchData = await branchService.getBranchLookup();
        setBranches(branchData);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // For head office login, pass empty string as branchName
      const loginData = {
        ...formData,
        branchName: loginMode === "headoffice" ? "" : formData.branchName,
      };
      await login(loginData, loginMode);
    } catch (err) {
      // Error is handled by useAuth hook
      console.error("Login failed:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Switcher - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcherCompact />
      </div>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Icon name="cart" size="xl" className="text-white" strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Multi-Branch POS</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {/* Login Mode Tabs */}
          <div className="flex gap-2 p-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              type="button"
              onClick={() => setLoginMode("branch")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === "branch"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Branch Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("headoffice")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === "headoffice"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Head Office
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branch Selection - Only show for branch login */}
            {loginMode === "branch" && (
              <Select
                label="Branch"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                placeholder={loadingBranches ? "Loading branches..." : "Select your branch"}
                required
                disabled={loadingBranches}
                options={branches.map((branch) => ({
                  value: branch.loginName,
                  label: `${branch.nameEn} - ${branch.nameAr}`,
                }))}
                helperText="Select the branch you want to access"
              />
            )}

            {/* Username */}
            <Input
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoComplete="username"
              leftIcon={<Icon name="user" size="md" />}
            />

            {/* Password */}
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              leftIcon={<Icon name="lock" size="md" />}
            />

            {/* Error Message */}
            {error && <ErrorAlert message={error} />}

            {/* Submit Button */}
            <Button type="submit" variant="primary" size="lg" isFullWidth isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Multi-Branch Point of Sale System v1.0
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  );
}
