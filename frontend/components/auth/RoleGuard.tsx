/**
 * RoleGuard Component
 *
 * Conditionally renders children based on user role and permissions.
 * This component enables role-based UI hiding to ensure users only see
 * features they're authorized to access.
 *
 * @example
 * ```tsx
 * // Only show to head office admins
 * <RoleGuard requireHeadOfficeAdmin>
 *   <button>Manage Branches</button>
 * </RoleGuard>
 *
 * // Only show to managers and above
 * <RoleGuard requireRole={UserRole.Manager}>
 *   <button>View Reports</button>
 * </RoleGuard>
 *
 * // Only show to cashiers and above (everyone)
 * <RoleGuard requireRole={UserRole.Cashier}>
 *   <button>Process Sale</button>
 * </RoleGuard>
 *
 * // Show fallback for unauthorized users
 * <RoleGuard requireRole={UserRole.Manager} fallback={<p>Access Denied</p>}>
 *   <SensitiveContent />
 * </RoleGuard>
 * ```
 */

'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/enums';

export interface RoleGuardProps {
  /** Require head office admin role */
  requireHeadOfficeAdmin?: boolean;

  /** Require specific role level (users with this role or higher can access) */
  requireRole?: UserRole;

  /** Custom permission check function */
  requirePermission?: (user: any, branch: any) => boolean;

  /** Content to render if user has permission */
  children: React.ReactNode;

  /** Optional content to render if user lacks permission */
  fallback?: React.ReactNode;

  /** If true, shows loading state while checking auth */
  showLoading?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  requireHeadOfficeAdmin = false,
  requireRole,
  requirePermission,
  children,
  fallback = null,
  showLoading = false,
}) => {
  const { user, branch, isAuthenticated, isLoading, isHeadOfficeAdmin, hasRole } = useAuth();

  // Show loading state if requested
  if (isLoading && showLoading) {
    return (
      <div className="inline-flex items-center">
        <div className="animate-pulse h-4 w-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Not authenticated - hide content
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Check head office admin requirement
  if (requireHeadOfficeAdmin && !isHeadOfficeAdmin()) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (requireRole !== undefined && !isHeadOfficeAdmin() && !hasRole(requireRole)) {
    return <>{fallback}</>;
  }

  // Check custom permission
  if (requirePermission && !requirePermission(user, branch)) {
    return <>{fallback}</>;
  }

  // All checks passed - render children
  return <>{children}</>;
};

/**
 * Higher-order component version of RoleGuard
 * Wraps a component and only renders it if role requirements are met
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<RoleGuardProps, 'children' | 'fallback'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard {...guardProps}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Hook to check if user has permission (for imperative checks)
 */
export function usePermission() {
  const { isHeadOfficeAdmin, hasRole } = useAuth();

  return {
    isHeadOfficeAdmin,
    hasRole,
    canAccessHeadOffice: () => isHeadOfficeAdmin(),
    canManage: () => isHeadOfficeAdmin() || hasRole(UserRole.Manager),
    canVoidSales: () => isHeadOfficeAdmin() || hasRole(UserRole.Manager),
    canApproveExpenses: () => isHeadOfficeAdmin() || hasRole(UserRole.Manager),
    canManageInventory: () => isHeadOfficeAdmin() || hasRole(UserRole.Manager),
    canManageUsers: () => isHeadOfficeAdmin(),
    canViewReports: () => isHeadOfficeAdmin() || hasRole(UserRole.Manager),
    canViewAuditLogs: () => isHeadOfficeAdmin(),
  };
}
