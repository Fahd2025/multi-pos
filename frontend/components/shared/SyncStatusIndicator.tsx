/**
 * Sync Status Indicator Component
 * Shows online/offline/syncing status with visual indicators
 */

'use client';

import { OnlineStatus } from '@/hooks/useOfflineSync';

interface SyncStatusIndicatorProps {
  isOnline: boolean;
  status: OnlineStatus;
  pendingCount: number;
}

export default function SyncStatusIndicator({
  isOnline,
  status,
  pendingCount,
}: SyncStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500',
          label: 'Online',
          icon: '✓',
        };
      case 'syncing':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          dotColor: 'bg-yellow-500',
          label: 'Syncing',
          icon: '🔄',
        };
      case 'offline':
        return {
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500',
          label: 'Offline',
          icon: '⚠️',
        };
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          dotColor: 'bg-gray-500',
          label: 'Unknown',
          icon: '?',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border border-${config.color}-200`}
      >
        {/* Status Dot with Animation */}
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
          {status === 'syncing' && (
            <div
              className={`absolute inset-0 w-2 h-2 rounded-full ${config.dotColor} animate-ping opacity-75`}
            ></div>
          )}
        </div>

        {/* Status Label */}
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>

        {/* Pending Count Badge */}
        {pendingCount > 0 && (
          <span
            className={`ml-1 px-2 py-0.5 text-xs font-semibold rounded-full ${config.bgColor} ${config.textColor} border border-${config.color}-300`}
          >
            {pendingCount}
          </span>
        )}
      </div>
    </div>
  );
}
