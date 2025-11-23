/**
 * useOfflineSync Hook
 * Manages offline sync state, triggers background sync, and handles connectivity changes
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import offlineSyncQueue, { QueuedTransaction, TransactionType, SYNC_CONFIG } from '@/lib/offline-sync';
import api from '@/services/api';

/**
 * Online status
 */
export type OnlineStatus = 'online' | 'offline' | 'syncing';

/**
 * Sync result for a single transaction
 */
export interface SyncResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Offline sync hook return type
 */
export interface UseOfflineSyncReturn {
  isOnline: boolean;
  status: OnlineStatus;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  queueTransaction: (transaction: Omit<QueuedTransaction, 'id' | 'status' | 'retryCount'>) => Promise<string>;
  syncAll: () => Promise<SyncResult[]>;
  clearCompleted: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

/**
 * Hook to manage offline sync functionality
 * Detects connectivity, queues transactions, and syncs when online
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<OnlineStatus>('online');
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const syncInProgressRef = useRef(false);
  const apiCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize offline sync queue
   */
  useEffect(() => {
    const initQueue = async () => {
      try {
        await offlineSyncQueue.init();
        await refreshPendingCount();
      } catch (error) {
        console.error('Failed to initialize offline sync queue:', error);
      }
    };

    initQueue();
  }, []);

  /**
   * Refresh pending transaction count
   */
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await offlineSyncQueue.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to refresh pending count:', error);
    }
  }, []);

  /**
   * Check API connectivity (more reliable than navigator.onLine)
   */
  const checkApiConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  /**
   * Handle online/offline status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('online');
      // Trigger sync when coming back online
      syncAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    setIsOnline(navigator.onLine);
    setStatus(navigator.onLine ? 'online' : 'offline');

    // Start periodic API connectivity check
    apiCheckIntervalRef.current = setInterval(async () => {
      const apiOnline = await checkApiConnectivity();

      if (apiOnline && !isOnline) {
        // API came back online
        setIsOnline(true);
        setStatus('online');
        syncAll();
      } else if (!apiOnline && isOnline) {
        // API went offline
        setIsOnline(false);
        setStatus('offline');
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (apiCheckIntervalRef.current) {
        clearInterval(apiCheckIntervalRef.current);
      }
    };
  }, [isOnline, checkApiConnectivity]);

  /**
   * Queue a transaction for offline sync
   */
  const queueTransaction = useCallback(
    async (transaction: Omit<QueuedTransaction, 'id' | 'status' | 'retryCount'>): Promise<string> => {
      try {
        const id = await offlineSyncQueue.add(transaction);
        await refreshPendingCount();

        // If online, try to sync immediately
        if (isOnline && !isSyncing) {
          syncAll();
        }

        return id;
      } catch (error) {
        console.error('Failed to queue transaction:', error);
        throw error;
      }
    },
    [isOnline, isSyncing, refreshPendingCount]
  );

  /**
   * Sync a single transaction
   */
  const syncTransaction = useCallback(async (transaction: QueuedTransaction): Promise<SyncResult> => {
    try {
      // Mark as syncing
      await offlineSyncQueue.updateStatus(transaction.id, 'syncing');

      // Send to server
      const response = await api.post('/api/v1/sync/transaction', {
        id: transaction.id,
        type: transaction.type,
        timestamp: transaction.timestamp,
        branchId: transaction.branchId,
        userId: transaction.userId,
        data: transaction.data,
      });

      // Mark as completed
      await offlineSyncQueue.updateStatus(transaction.id, 'completed');

      return {
        id: transaction.id,
        success: true,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Sync failed';

      // Increment retry count
      const retryCount = await offlineSyncQueue.incrementRetry(transaction.id);

      // Check if max retries reached
      if (retryCount >= SYNC_CONFIG.MAX_RETRIES) {
        await offlineSyncQueue.updateStatus(transaction.id, 'failed', errorMessage);
      } else {
        // Reset to pending for retry
        await offlineSyncQueue.updateStatus(transaction.id, 'pending', errorMessage);
      }

      return {
        id: transaction.id,
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  /**
   * Sync all pending transactions
   */
  const syncAll = useCallback(async (): Promise<SyncResult[]> => {
    // Prevent concurrent sync operations
    if (syncInProgressRef.current || !isOnline) {
      return [];
    }

    try {
      syncInProgressRef.current = true;
      setIsSyncing(true);
      setStatus('syncing');

      // Get pending transactions
      const pending = await offlineSyncQueue.getPending();

      if (pending.length === 0) {
        return [];
      }

      const results: SyncResult[] = [];

      // Process transactions in batches
      for (let i = 0; i < pending.length; i += SYNC_CONFIG.BATCH_SIZE) {
        const batch = pending.slice(i, i + SYNC_CONFIG.BATCH_SIZE);

        // Process batch sequentially (maintain chronological order)
        for (const transaction of batch) {
          const result = await syncTransaction(transaction);
          results.push(result);

          // Add delay between transactions to avoid overwhelming server
          if (batch.indexOf(transaction) < batch.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      // Update last sync time
      setLastSyncAt(new Date());

      // Refresh pending count
      await refreshPendingCount();

      return results;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
      setStatus(isOnline ? 'online' : 'offline');
    }
  }, [isOnline, syncTransaction, refreshPendingCount]);

  /**
   * Clear completed transactions
   */
  const clearCompleted = useCallback(async () => {
    try {
      await offlineSyncQueue.clearCompleted();
      await refreshPendingCount();
    } catch (error) {
      console.error('Failed to clear completed transactions:', error);
      throw error;
    }
  }, [refreshPendingCount]);

  return {
    isOnline,
    status,
    pendingCount,
    isSyncing,
    lastSyncAt,
    queueTransaction,
    syncAll,
    clearCompleted,
    refreshPendingCount,
  };
}
