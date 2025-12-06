/**
 * DashboardLayout Component
 * Main layout wrapper with responsive Sidebar, Header, and optional Footer
 * Features: Mobile drawer, desktop collapsible sidebar, customizable theme
 */

"use client";

import React, { useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar, MenuItem, SidebarHeaderProps } from "./Sidebar";
import { Footer } from "./Footer";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navigation: MenuItem[];
  sidebarHeader?: SidebarHeaderProps;
  sidebarExtraContent?: React.ReactNode;
  headerBadge?: React.ReactNode;
  headerExtraControls?: React.ReactNode;
  systemName?: string;
  themeColor?: "blue" | "purple";
  showFooter?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navigation,
  sidebarHeader,
  sidebarExtraContent,
  headerBadge,
  headerExtraControls,
  systemName = "Multi-POS System",
  themeColor = "blue",
  showFooter = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse state

  // Close mobile drawer when route changes (optional, could be implemented with pathname)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, []);

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
          <Sidebar
            navigation={navigation}
            isOpen={isSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            onClose={() => setIsSidebarOpen(false)}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isMobile={true}
            header={sidebarHeader}
            extraContent={sidebarExtraContent}
            themeColor={themeColor}
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
          <Sidebar
            navigation={navigation}
            isOpen={isSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            onClose={() => setIsSidebarOpen(false)}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isMobile={false}
            header={sidebarHeader}
            extraContent={sidebarExtraContent}
            themeColor={themeColor}
          />
        </div>
      </aside>

      {/* Right Section - Navbar + Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          onMobileMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onDesktopMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileMenuOpen={isSidebarOpen}
          isDesktopSidebarCollapsed={isSidebarCollapsed}
          systemName={systemName}
          badge={headerBadge}
          extraControls={headerExtraControls}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              {children}
            </div>
          </div>
        </main>

        {/* Footer (optional) */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
};
