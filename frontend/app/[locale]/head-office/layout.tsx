/**
 * Head Office Layout
 * Main layout for head office administration with navigation
 * Features: Responsive collapsible sidebar with mobile drawer
 */

"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/shared/Layout";
import { getHeadOfficeNavigation } from "@/lib/routes";
import { use } from "react";

export default function HeadOfficeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { user } = useAuth();
  const { locale } = use(params);

  // Get navigation items from routes.ts
  const navigation = getHeadOfficeNavigation(locale);

  // Sidebar header configuration
  const sidebarHeader = {
    logo: "HQ",
    title: "Head Office",
    subtitle: "Administration",
  };

  // Sidebar extra content - User info badge
  const sidebarExtraContent = user ? (
    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
      <p className="text-xs text-purple-800 dark:text-purple-300 font-medium">
        👤 {user.fullNameEn || user.username}
      </p>
    </div>
  ) : undefined;

  // Header badge
  const headerBadge = (
    <span className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">
      Head Office
    </span>
  );

  // Check if user is head office admin
  if (user && !user.isHeadOfficeAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Access Denied</h2>
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
    <DashboardLayout
      navigation={navigation}
      sidebarHeader={sidebarHeader}
      sidebarExtraContent={sidebarExtraContent}
      headerBadge={headerBadge}
      systemName="Multi-POS System"
      themeColor="purple"
    >
      {children}
    </DashboardLayout>
  );
}
