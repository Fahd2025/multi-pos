/**
 * Head Office Layout
 * Main layout for head office administration with navigation
 * Features: Responsive collapsible sidebar with mobile drawer
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSwitcherCompact } from '@/components/shared/ThemeSwitcher';
import { use, useState, useEffect } from 'react';

// Navigation item type
type NavigationItem = {
  name: string;
  href: string;
  icon: string;
};

// User type (simplified for sidebar display)
type UserType = {
  fullNameEn?: string;
  username?: string;
  isHeadOfficeAdmin?: boolean;
} | null;

// Sidebar Content Component - Separated for reusability
type SidebarContentProps = {
  navigation: NavigationItem[];
  isActiveLink: (href: string) => boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  user: UserType;
  isMobile?: boolean;
};

function SidebarContent({
  navigation,
  isActiveLink,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  user,
  isMobile = false,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header - Head Office Badge */}
      <div className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${
        isSidebarCollapsed && !isMobile ? 'px-2' : 'px-4'
      }`}>
        <div className={`flex items-center gap-3 ${
          isSidebarCollapsed && !isMobile ? 'justify-center' : ''
        }`}>
          {/* Head Office Logo */}
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
            HQ
          </div>

          {/* Head Office Label - Hidden when collapsed on desktop */}
          {(!isSidebarCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                Head Office
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Administration
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active = isActiveLink(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                  } ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed && !isMobile ? item.name : ''}
                  aria-label={item.name}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {(!isSidebarCollapsed || isMobile) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info Badge */}
      {user && (
        <div className={`mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg ${
          isSidebarCollapsed && !isMobile ? 'text-center' : ''
        }`}>
          {(!isSidebarCollapsed || isMobile) ? (
            <p className="text-xs text-purple-800 dark:text-purple-300 font-medium">
              👤 {user.fullNameEn || user.username}
            </p>
          ) : (
            <p className="text-lg" title={user.fullNameEn || user.username}>👤</p>
          )}
        </div>
      )}

      {/* Desktop Collapse Toggle - Only show on desktop */}
      {!isMobile && (
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="mt-4 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-lg">
            {isSidebarCollapsed ? '→' : '←'}
          </span>
          {!isSidebarCollapsed && (
            <span className="text-xs font-medium">Collapse</span>
          )}
        </button>
      )}
    </div>
  );
}

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

  // Sidebar state management
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse state

  // Close mobile drawer when route changes
  useEffect(() => {
    // This effect is intentional - we want to close the mobile drawer on navigation
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const navigation = [
    { name: 'Dashboard', href: `/${locale}/head-office`, icon: '📊' },
    { name: 'Branches', href: `/${locale}/head-office/branches`, icon: '🏢' },
    { name: 'Users', href: `/${locale}/head-office/users`, icon: '👥' },
    { name: 'Audit Logs', href: `/${locale}/head-office/audit-logs`, icon: '📋' },
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation sidebar"
      >
        <div className="p-4 h-full">
          <SidebarContent
            navigation={navigation}
            isActiveLink={isActiveLink}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            user={user}
            isMobile={true}
          />
        </div>
      </aside>

      {/* Desktop Sidebar - Full Height */}
      <aside
        className={`hidden lg:block h-screen bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out overflow-y-auto ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
        aria-label="Desktop navigation sidebar"
      >
        <div className="p-4 h-full">
          <SidebarContent
            navigation={navigation}
            isActiveLink={isActiveLink}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            user={user}
            isMobile={false}
          />
        </div>
      </aside>

      {/* Right Section - Navbar + Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar - Next to Sidebar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left Section - Hamburger Menu and Logo */}
              <div className="flex items-center gap-4">
                {/* Mobile Hamburger Menu Button */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                  aria-label="Toggle navigation menu"
                  aria-expanded={isSidebarOpen}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isSidebarOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>

                {/* Desktop Hamburger Menu */}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden lg:block p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-expanded={!isSidebarCollapsed}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Logo and System Name */}
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:block">
                    Multi-POS System
                  </h1>
                  <span className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">
                    Head Office
                  </span>
                </div>
              </div>

              {/* Right Section - Theme and User Info */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Theme Switcher */}
                <ThemeSwitcherCompact />

                {/* User Menu */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:inline">
                    {user?.fullNameEn || user?.username}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
