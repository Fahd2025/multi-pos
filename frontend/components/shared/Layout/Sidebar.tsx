/**
 * Sidebar Component
 * Responsive navigation sidebar with collapsible desktop mode
 * Features: Mobile drawer, desktop collapse, customizable theme
 */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface MenuItem {
  name: string;
  href: string;
  icon: string; // Emoji icon
  requiresRole?: boolean;
  requiresManager?: boolean;
}

export interface SidebarHeaderProps {
  logo: React.ReactNode | string; // Logo element or initial letter
  title: string;
  subtitle?: string;
}

export interface SidebarProps {
  navigation: MenuItem[];
  isOpen?: boolean; // Mobile drawer state
  isCollapsed?: boolean; // Desktop collapse state
  onClose?: () => void; // Mobile drawer close
  onToggleCollapse?: () => void; // Desktop collapse toggle
  isMobile?: boolean;
  header?: SidebarHeaderProps;
  extraContent?: React.ReactNode; // Additional content like badges
  themeColor?: "blue" | "purple"; // Theme color scheme
}

export const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  isOpen = false,
  isCollapsed = false,
  onClose,
  onToggleCollapse,
  isMobile = false,
  header,
  extraContent,
  themeColor = "blue",
}) => {
  const pathname = usePathname();

  // Theme colors
  const themeClasses = {
    blue: {
      logo: "from-blue-500 to-blue-600",
      active: "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700",
      badge: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300",
    },
    purple: {
      logo: "from-purple-500 to-purple-600",
      active: "bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700",
      badge: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-300",
    },
  };

  const theme = themeClasses[themeColor];

  const isActiveLink = (href: string) => {
    // Extract locale from pathname
    const locale = pathname?.split('/')[1] || 'en';
    const dashboardPath = `/${locale}/branch`;
    const headOfficePath = `/${locale}/head-office`;

    if (href === dashboardPath || href === headOfficePath) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      {header && (
        <div
          className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${
            isCollapsed && !isMobile ? "px-2" : "px-4"
          }`}
        >
          <div
            className={`flex items-center gap-3 ${
              isCollapsed && !isMobile ? "justify-center" : ""
            }`}
          >
            {/* Logo */}
            <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${theme.logo} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md`}>
              {typeof header.logo === "string" ? header.logo : header.logo}
            </div>

            {/* Title and Subtitle - Hidden when collapsed on desktop */}
            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {header.title}
                </h2>
                {header.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {header.subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                      ? theme.active + " shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
                  } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                  title={isCollapsed && !isMobile ? item.name : ""}
                  aria-label={item.name}
                  onClick={isMobile ? onClose : undefined}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {(!isCollapsed || isMobile) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Extra Content (badges, user info, etc.) */}
      {extraContent && (
        <div className={`mt-4 ${isCollapsed && !isMobile ? "px-2" : "px-0"}`}>
          {extraContent}
        </div>
      )}

      {/* Desktop Collapse Toggle - Only show on desktop */}
      {!isMobile && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="mt-4 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-lg">{isCollapsed ? "→" : "←"}</span>
          {!isCollapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      )}
    </div>
  );
};
