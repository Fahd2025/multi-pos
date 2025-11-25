/**
 * Head Office Layout
 * Main layout for head office administration with navigation
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSwitcherCompact } from '@/components/shared/ThemeSwitcher';
import { use } from 'react';

export default function HeadOfficeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { locale } = use(params);

  const navigation = [
    { name: 'Dashboard', href: `/${locale}/head-office`, icon: '📊' },
    { name: 'Branches', href: `/${locale}/head-office/branches`, icon: '🏢' },
    { name: 'Users', href: `/${locale}/head-office/users`, icon: '👥' },
    { name: 'Analytics', href: `/${locale}/head-office/analytics`, icon: '📈' },
    { name: 'Settings', href: `/${locale}/head-office/settings`, icon: '⚙️' },
  ];

  const isActiveLink = (href: string) => {
    if (href === `/${locale}/head-office`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // Check if user is head office admin
  if (user && !user.isHeadOfficeAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            You do not have permission to access the Head Office dashboard.
          </p>
          <Link
            href={`/${locale}/branch`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Go to Branch Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Multi-POS System
              </h1>
              <span className="ml-4 px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
                Head Office
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              {/* Theme Switcher */}
              <ThemeSwitcherCompact />

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

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white dark:bg-gray-800 min-h-[calc(100vh-4rem)] border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const active = isActiveLink(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
