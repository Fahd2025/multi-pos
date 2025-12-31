'use client';

/**
 * FeatureFlagGuard Component
 * Conditionally renders children based on feature flag status
 *
 * Usage:
 * <FeatureFlagGuard feature="CUSTOMER_DELETE">
 *   <Button onClick={handleDelete}>Delete Customer</Button>
 * </FeatureFlagGuard>
 *
 * <FeatureFlagGuard feature="SALES_VOID" mode="disable">
 *   <Button onClick={handleVoid}>Void Sale</Button>
 * </FeatureFlagGuard>
 *
 * <FeatureFlagGuard
 *   feature="CUSTOMER_UPDATE"
 *   fallback={<Button disabled>Update (Offline Disabled)</Button>}
 * >
 *   <Button onClick={handleUpdate}>Update Customer</Button>
 * </FeatureFlagGuard>
 */

import { ReactNode, cloneElement, isValidElement } from 'react';
import { isOfflineFeatureEnabled, type OfflineFeatureKey } from '@/lib/feature-flags';

type GuardMode = 'hide' | 'disable' | 'show-disabled';

interface FeatureFlagGuardProps {
  feature: OfflineFeatureKey;
  children: ReactNode;
  mode?: GuardMode;
  fallback?: ReactNode;
  disabledMessage?: string;
  className?: string;
}

/**
 * Feature Flag Guard Component
 * Wraps children and conditionally renders based on feature flag
 */
export function FeatureFlagGuard({
  feature,
  children,
  mode = 'hide',
  fallback,
  disabledMessage,
  className = '',
}: FeatureFlagGuardProps) {
  const isEnabled = isOfflineFeatureEnabled(feature);

  // Feature is enabled - render children normally
  if (isEnabled) {
    return <>{children}</>;
  }

  // Feature is disabled - handle based on mode
  switch (mode) {
    case 'hide':
      // Don't render anything
      return null;

    case 'disable':
      // Try to clone children and add disabled prop
      if (isValidElement(children)) {
        return cloneElement(children as React.ReactElement<any>, {
          disabled: true,
          title: disabledMessage || `This feature is currently disabled`,
        });
      }
      // If can't clone, return fallback or null
      return fallback || null;

    case 'show-disabled':
      // Show with visual disabled state
      return (
        <div
          className={`opacity-50 cursor-not-allowed ${className}`}
          title={disabledMessage || `Feature '${feature}' is disabled`}
        >
          {children}
        </div>
      );

    default:
      return null;
  }
}

/**
 * Hook to check if a feature is enabled
 * Useful for conditional logic in components
 */
export function useFeatureFlag(feature: OfflineFeatureKey): boolean {
  return isOfflineFeatureEnabled(feature);
}

/**
 * Higher-order component to wrap a component with feature flag guard
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  feature: OfflineFeatureKey,
  options?: {
    mode?: GuardMode;
    fallback?: ReactNode;
  }
) {
  return function FeatureFlaggedComponent(props: P) {
    return (
      <FeatureFlagGuard
        feature={feature}
        mode={options?.mode}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </FeatureFlagGuard>
    );
  };
}

/**
 * Compact feature flag check for inline conditions
 */
export function FeatureEnabled({ feature, children }: { feature: OfflineFeatureKey; children: ReactNode }) {
  return isOfflineFeatureEnabled(feature) ? <>{children}</> : null;
}

/**
 * Inverse of FeatureEnabled - renders when feature is disabled
 */
export function FeatureDisabled({ feature, children }: { feature: OfflineFeatureKey; children: ReactNode }) {
  return !isOfflineFeatureEnabled(feature) ? <>{children}</> : null;
}

/**
 * Feature flag badge (visual indicator)
 */
export function FeatureFlagBadge({ feature, className = '' }: { feature: OfflineFeatureKey; className?: string }) {
  const isEnabled = isOfflineFeatureEnabled(feature);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isEnabled
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
      } ${className}`}
      title={isEnabled ? 'Feature enabled' : 'Feature disabled'}
    >
      {isEnabled ? '✓' : '✗'} {feature}
    </span>
  );
}
