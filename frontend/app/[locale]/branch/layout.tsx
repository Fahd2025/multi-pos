/**
 * Branch Dashboard Layout
 * Main layout for branch operations with navigation and sync status
 * Features: Responsive collapsible sidebar with mobile drawer
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { ThemeSwitcherCompact } from "@/components/shared/ThemeSwitcher";
import { usePermission } from "@/components/auth/RoleGuard";
import { use, useState, useEffect } from "react";

// Navigation item type
type NavigationItem = {
  name: string;
  href: string;
  icon: string;
  requiresRole?: boolean;
  requiresManager?: boolean;
};

// User type (simplified for sidebar display)
type UserType = {
  fullNameEn?: string;
  username?: string;
  branches?: Array<{
    branchNameEn?: string;
  }>;
} | null;

// Sidebar Content Component - Separated for reusability
type SidebarContentProps = {
  navigation: NavigationItem[];
  isActiveLink: (href: string) => boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  pendingCount: number;
  user: UserType;
  isMobile?: boolean;
};

function SidebarContent({
  navigation,
  isActiveLink,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  pendingCount,
  user,
  isMobile = false,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header - Branch Logo and Name */}
      <div
        className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${
          isSidebarCollapsed && !isMobile ? "px-2" : "px-4"
        }`}
      >
        <div
          className={`flex items-center gap-3 ${
            isSidebarCollapsed && !isMobile ? "justify-center" : ""
          }`}
        >
          {/* Branch Logo */}
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
            {user?.branches[0]?.branchNameEn?.charAt(0) || "M"}
          </div>

          {/* Branch Name - Hidden when collapsed on desktop */}
          {(!isSidebarCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {user?.branches[0]?.branchNameEn || "Multi-POS"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Branch System</p>
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
                      ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
                  } ${isSidebarCollapsed && !isMobile ? "justify-center" : ""}`}
                  title={isSidebarCollapsed && !isMobile ? item.name : ""}
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

      {/* Pending Sync Badge */}
      {pendingCount > 0 && (
        <div
          className={`mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg ${
            isSidebarCollapsed && !isMobile ? "text-center" : ""
          }`}
        >
          {!isSidebarCollapsed || isMobile ? (
            <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
              ⚠️ {pendingCount} pending sync{pendingCount > 1 ? "s" : ""}
            </p>
          ) : (
            <p className="text-lg" title={`${pendingCount} pending syncs`}>
              ⚠️
            </p>
          )}
        </div>
      )}

      {/* Desktop Collapse Toggle - Only show on desktop */}
      {!isMobile && (
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="mt-4 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-lg">{isSidebarCollapsed ? "→" : "←"}</span>
          {!isSidebarCollapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      )}
    </div>
  );
}

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
  const { canManage } = usePermission();

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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // Navigation items with role-based access
  const allNavigationItems = [
    { name: "Dashboard", href: `/${locale}/branch`, icon: "📊", requiresRole: false },
    { name: "Sales", href: `/${locale}/branch/sales`, icon: "💳", requiresRole: false },
    { name: "Inventory", href: `/${locale}/branch/inventory`, icon: "📦", requiresManager: true },
    { name: "Purchases", href: `/${locale}/branch/purchases`, icon: "🛒", requiresManager: true },
    { name: "Suppliers", href: `/${locale}/branch/suppliers`, icon: "🏢", requiresManager: true },
    { name: "Expenses", href: `/${locale}/branch/expenses`, icon: "💰", requiresManager: true },
    { name: "Customers", href: `/${locale}/branch/customers`, icon: "👥", requiresRole: false },
    { name: "Reports", href: `/${locale}/branch/reports`, icon: "📈", requiresManager: true },
    { name: "Settings", href: `/${locale}/branch/settings`, icon: "⚙️", requiresManager: true },
  ];

  // Filter navigation based on user role
  const navigation = allNavigationItems.filter((item) => {
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
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation sidebar"
      >
        <div className="p-4 h-full">
          <SidebarContent
            navigation={navigation}
            isActiveLink={isActiveLink}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            pendingCount={pendingCount}
            user={user}
            isMobile={true}
          />
        </div>
      </aside>

      {/* Desktop Sidebar - Full Height */}
      <aside
        className={`hidden lg:block h-screen bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out overflow-y-auto ${
          isSidebarCollapsed ? "w-20" : "w-72"
        }`}
        aria-label="Desktop navigation sidebar"
      >
        <div className="p-4 h-full">
          <SidebarContent
            navigation={navigation}
            isActiveLink={isActiveLink}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            pendingCount={pendingCount}
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-expanded={!isSidebarCollapsed}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Logo and System Name */}
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:block">
                  Multi-POS System
                </h1>
              </div>

              {/* Right Section - Sync Status and User Info */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Theme Switcher */}
                <ThemeSwitcherCompact />

                {/* Sync Status Indicator */}
                <SyncStatusIndicator
                  isOnline={isOnline}
                  status={status}
                  pendingCount={pendingCount}
                />

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
