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

export default function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOnline, status, pendingCount } = useOfflineSync();

  const navigation = [
    { name: 'Dashboard', href: `/${params.locale}/branch`, icon: '📊' },
    { name: 'Sales', href: `/${params.locale}/branch/sales`, icon: '💳' },
    { name: 'Inventory', href: `/${params.locale}/branch/inventory`, icon: '📦' },
    { name: 'Customers', href: `/${params.locale}/branch/customers`, icon: '👥' },
    { name: 'Reports', href: `/${params.locale}/branch/reports`, icon: '📈' },
  ];

  const isActiveLink = (href: string) => {
    if (href === `/${params.locale}/branch`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Branch Name */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Multi-POS System
              </h1>
              {user && (
                <span className="ml-4 text-sm text-gray-600">
                  Branch: {user.branches[0]?.branchNameEn || 'Unknown'}
                </span>
              )}
            </div>

            {/* Sync Status and User Info */}
            <div className="flex items-center gap-4">
              {/* Sync Status Indicator */}
              <SyncStatusIndicator
                isOnline={isOnline}
                status={status}
                pendingCount={pendingCount}
              />

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  {user?.fullNameEn || user?.username}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
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
          <nav className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-fit">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const active = isActiveLink(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
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
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800 font-medium">
                  ⚠️ {pendingCount} pending sync{pendingCount > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </nav>

          {/* Main Content */}
          <main className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
