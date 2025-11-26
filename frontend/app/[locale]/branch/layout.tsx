/**
 * Branch Dashboard Layout
 * Main layout for branch operations with navigation and sync status
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import SyncStatusIndicator from '@/components/shared/SyncStatusIndicator';
import { ThemeSwitcherCompact } from '@/components/shared/ThemeSwitcher';
import { usePermission } from '@/components/auth/RoleGuard';
import { use } from 'react';

export default function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOnline, status, pendingCount } = useOfflineSync();
  const { locale } = use(params);
  const { canManage, canViewReports } = usePermission();

  // Navigation items with role-based access
  const allNavigationItems = [
    { name: 'Dashboard', href: `/${locale}/branch`, icon: '📊', requiresRole: false },
    { name: 'Sales', href: `/${locale}/branch/sales`, icon: '💳', requiresRole: false },
    { name: 'Inventory', href: `/${locale}/branch/inventory`, icon: '📦', requiresManager: true },
    { name: 'Purchases', href: `/${locale}/branch/purchases`, icon: '🛒', requiresManager: true },
    { name: 'Expenses', href: `/${locale}/branch/expenses`, icon: '💰', requiresManager: true },
    { name: 'Customers', href: `/${locale}/branch/customers`, icon: '👥', requiresRole: false },
    { name: 'Reports', href: `/${locale}/branch/reports`, icon: '📈', requiresManager: true },
    { name: 'Settings', href: `/${locale}/branch/settings`, icon: '⚙️', requiresManager: true },
  ];

  // Filter navigation based on user role
  const navigation = allNavigationItems.filter(item => {
    if (item.requiresManager) {
      return canManage();
    }
    return true; // Show to everyone
  });

  const isActiveLink = (href: string) => {
    if (href === `/${locale}/branch`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Branch Name */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Multi-POS System
              </h1>
              {user && (
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                  Branch: {user.branches[0]?.branchNameEn || 'Unknown'}
                </span>
              )}
            </div>

            {/* Sync Status and User Info */}
            <div className="flex items-center gap-4">
              {/* Theme Switcher */}
              <ThemeSwitcherCompact />
              {/* Sync Status Indicator */}
              <SyncStatusIndicator
                isOnline={isOnline}
                status={status}
                pendingCount={pendingCount}
              />

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.fullNameEn || user?.username}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-fit">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const active = isActiveLink(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Pending Sync Badge */}
            {pendingCount > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                  ⚠️ {pendingCount} pending sync{pendingCount > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </nav>

          {/* Main Content */}
          <main className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
