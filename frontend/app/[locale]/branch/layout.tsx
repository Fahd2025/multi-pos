/**
 * Branch Dashboard Layout
 * Main layout for branch operations with navigation and sync status
 * Features: Responsive collapsible sidebar with mobile drawer
 */

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { usePermission } from "@/components/auth/RoleGuard";
import { DashboardLayout } from "@/components/shared/Layout";
import { getBranchNavigation, BRANCH_ROUTES } from "@/lib/routes";
import { use } from "react";

export default function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { user } = useAuth();
  const { isOnline, status, pendingCount } = useOfflineSync();
  const { locale } = use(params);
  const { canManage } = usePermission();

  // Get navigation items from routes.ts
  const allNavigationItems = getBranchNavigation(locale);

  // Define which routes require manager access
  const managerOnlyRoutes = [
    BRANCH_ROUTES.INVENTORY(locale),
    BRANCH_ROUTES.PURCHASES(locale),
    BRANCH_ROUTES.SUPPLIERS(locale),
    BRANCH_ROUTES.EXPENSES(locale),
    BRANCH_ROUTES.REPORTS(locale),
    BRANCH_ROUTES.USERS(locale),
    BRANCH_ROUTES.SETTINGS(locale),
  ];

  // Filter navigation based on user role
  const navigation = allNavigationItems.filter((item) => {
    // If route requires manager access and user is not a manager, hide it
    if (managerOnlyRoutes.includes(item.href) && !canManage()) {
      return false;
    }
    return true;
  });

  // Sidebar header configuration
  const sidebarHeader = {
    logo: user?.branches?.[0]?.branchNameEn?.charAt(0) || "M",
    title: user?.branches?.[0]?.branchNameEn || "Multi-POS",
    subtitle: "Branch System",
  };

  // Sidebar extra content - Pending sync badge
  const sidebarExtraContent = pendingCount > 0 ? (
    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
      <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
        ⚠️ {pendingCount} pending sync{pendingCount > 1 ? "s" : ""}
      </p>
    </div>
  ) : undefined;

  return (
    <DashboardLayout
      navigation={navigation}
      sidebarHeader={sidebarHeader}
      sidebarExtraContent={sidebarExtraContent}
      headerExtraControls={
        <SyncStatusIndicator
          isOnline={isOnline}
          status={status}
          pendingCount={pendingCount}
        />
      }
      systemName="Multi-POS System"
      themeColor="blue"
    >
      {children}
    </DashboardLayout>
  );
}
