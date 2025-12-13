/**
 * Header Component
 * Top navigation bar with responsive hamburger menu, user info, and controls
 * Features: Mobile/desktop toggles, theme switcher, sync status
 */

"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeSwitcherCompact } from "@/components/shared/ThemeSwitcher";
import { useConfirmation } from "@/hooks/useConfirmation";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

export interface HeaderProps {
  onMobileMenuClick?: () => void; // Mobile drawer toggle
  onDesktopMenuClick?: () => void; // Desktop sidebar collapse toggle
  isMobileMenuOpen?: boolean;
  isDesktopSidebarCollapsed?: boolean;
  showMobileButton?: boolean;
  showDesktopButton?: boolean;
  systemName?: string;
  badge?: React.ReactNode; // Optional badge (e.g., "Head Office")
  extraControls?: React.ReactNode; // Additional controls (e.g., sync status)
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuClick,
  onDesktopMenuClick,
  isMobileMenuOpen = false,
  isDesktopSidebarCollapsed = false,
  showMobileButton = true,
  showDesktopButton = true,
  systemName = "Multi-POS System",
  badge,
  extraControls,
}) => {
  const { user, logout, isLoading } = useAuth();

  const logoutConfirmation = useConfirmation();

  const handleLogout = async () => {
    await logout(true);
    logoutConfirmation.close();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Hamburger Menu and Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Menu Button */}
            {showMobileButton && onMobileMenuClick && (
              <button
                onClick={onMobileMenuClick}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
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
            )}

            {/* Desktop Hamburger Menu */}
            {showDesktopButton && onDesktopMenuClick && (
              <button
                onClick={onDesktopMenuClick}
                className="hidden lg:block p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isDesktopSidebarCollapsed}
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
            )}

            {/* Logo and System Name */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:block">
                {systemName}
              </h1>
              {badge}
            </div>
          </div>

          {/* Right Section - Extra Controls and User Info */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Switcher */}
            <ThemeSwitcherCompact />

            {/* Extra Controls (e.g., Sync Status) */}
            {extraControls}

            {/* User Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:inline">
                {user?.fullNameEn || user?.username}
              </span>
              <button
                onClick={() => logoutConfirmation.open()}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={logoutConfirmation.isOpen}
        onClose={logoutConfirmation.close}
        onConfirm={handleLogout}
        isProcessing={isLoading}
        title="Confirm Logout"
        message="Are you sure you want to logout from the system?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
      />
    </header>
  );
};
