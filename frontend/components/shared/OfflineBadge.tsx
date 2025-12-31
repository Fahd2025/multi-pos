'use client';

/**
 * OfflineBadge Component
 * Displays offline status indicator with optional pending transaction count
 *
 * Usage:
 * <OfflineBadge />
 * <OfflineBadge showPendingCount={false} />
 */

import { useOfflineSync } from '@/hooks/useOfflineSync';

interface OfflineBadgeProps {
  showPendingCount?: boolean;
  className?: string;
}

export function OfflineBadge({ showPendingCount = true, className = '' }: OfflineBadgeProps) {
  const { isOnline, pendingCount, syncProgress } = useOfflineSync();

  // Don't show badge when online
  if (isOnline) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Offline indicator badge */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium">
        {/* Offline icon */}
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        Offline
      </span>

      {/* Pending count or sync progress */}
      {showPendingCount && (
        <>
          {syncProgress ? (
            // Show sync progress
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Syncing {syncProgress.current}/{syncProgress.total}
            </span>
          ) : pendingCount > 0 ? (
            // Show pending count
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {pendingCount} pending sync
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}

/**
 * Compact version of offline badge (icon only)
 */
export function OfflineBadgeCompact({ className = '' }: { className?: string }) {
  const { isOnline } = useOfflineSync();

  if (isOnline) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 ${className}`}
      title="Offline mode - changes will sync when connection is restored"
    >
      <svg
        className="w-4 h-4 text-amber-600 dark:text-amber-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
    </span>
  );
}

/**
 * Offline status bar (full-width notification)
 */
export function OfflineStatusBar({ className = '' }: { className?: string }) {
  const { isOnline, pendingCount, syncProgress, isSyncing } = useOfflineSync();

  if (isOnline && !isSyncing) {
    return null;
  }

  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {isSyncing ? 'Syncing...' : 'Working offline'}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {syncProgress ? (
                  `Syncing ${syncProgress.current} of ${syncProgress.total} transactions`
                ) : pendingCount > 0 ? (
                  `${pendingCount} transaction${pendingCount !== 1 ? 's' : ''} pending sync`
                ) : (
                  'Changes will sync automatically when connection is restored'
                )}
              </p>
            </div>
          </div>

          {isSyncing && syncProgress && (
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 dark:bg-amber-400 transition-all duration-300"
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium min-w-[3rem] text-right">
                  {Math.round((syncProgress.current / syncProgress.total) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
