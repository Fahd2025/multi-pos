/**
 * DashboardLayout Component
 * Main layout wrapper with Header, Sidebar, and Footer
 */

"use client";

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  showSidebar = true,
  showFooter = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={showSidebar}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};
