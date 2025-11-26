"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input, Select } from '@/components/shared/Form';
import { Button } from '@/components/shared/Button';
import { ThemeSwitcherCompact } from '@/components/shared/ThemeSwitcher';

type LoginMode = 'headoffice' | 'branch';

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>('branch');
  const [formData, setFormData] = useState({
    branchName: '',
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // For head office login, pass empty string as branchName
      const loginData = {
        ...formData,
        branchName: loginMode === 'headoffice' ? '' : formData.branchName,
      };
      await login(loginData, loginMode);
    } catch (err) {
      // Error is handled by useAuth hook
      console.error('Login failed:', err);
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
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Multi-Branch POS
          </h2>
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
              onClick={() => setLoginMode('branch')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === 'branch'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Branch Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('headoffice')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === 'headoffice'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Head Office
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branch Selection - Only show for branch login */}
            {loginMode === 'branch' && (
              <Select
                label="Branch"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                placeholder="Select your branch"
                required
                options={[
                  { value: 'B001', label: 'Main Branch' },
                  { value: 'B002', label: 'Downtown Branch' },
                  { value: 'B003', label: 'Mall Branch' },
                ]}
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
              leftIcon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
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
              leftIcon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-red-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isFullWidth
              isLoading={isLoading}
            >
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
