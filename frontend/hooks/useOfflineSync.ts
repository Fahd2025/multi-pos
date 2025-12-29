/**
 * useOfflineSync Hook - Enhanced for Phase 1
 * Manages offline sync state, triggers background sync, and handles connectivity changes
 *
 * PHASE 1 ENHANCEMENTS:
 * - Dependency-aware synchronization using DAG (Directed Acyclic Graph)
 * - Foreign key resolution during sync
 * - ID mapping support (temp → real IDs)
 * - Progress tracking
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import offlineSyncQueue, { QueuedTransaction, TransactionType, SYNC_CONFIG } from '@/lib/offline-sync';
import { syncOrchestrator } from '@/lib/sync-orchestrator';
import type { SyncResult } from '@/types/offline';
import api from '@/services/api';

/**
 * Online status
 */
export type OnlineStatus = 'online' | 'offline' | 'syncing';

/**
 * Offline sync hook return type
 */
export interface UseOfflineSyncReturn {
  isOnline: boolean;
  status: OnlineStatus;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncProgress: { current: number; total: number } | null;
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
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

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
   * Sync all pending transactions (ENHANCED with dependency tracking)
   * Uses SyncOrchestrator for DAG-based synchronization
   */
  const syncAll = useCallback(async (): Promise<SyncResult[]> => {
    // Prevent concurrent sync operations
    if (syncInProgressRef.current || !isOnline || syncOrchestrator.isSyncing()) {
      console.log('Sync skipped: already in progress or offline');
      return [];
    }

    try {
      syncInProgressRef.current = true;
      setIsSyncing(true);
      setStatus('syncing');
      setSyncProgress(null);

      // Get all transactions (including dependencies)
      const allTransactions = await offlineSyncQueue.getAllWithDependencies();
      const pending = allTransactions.filter(t => t.status === 'pending');

      if (pending.length === 0) {
        console.log('No pending transactions to sync');
        return [];
      }

      console.log(`Syncing ${pending.length} transactions with dependency tracking...`);

      // Use sync orchestrator for dependency-aware synchronization
      const results = await syncOrchestrator.syncWithDependencies(
        pending,
        (current, total) => {
          // Update progress
          setSyncProgress({ current, total });
        }
      );

      // Update transaction statuses based on results
      for (const result of results) {
        if (result.success) {
          await offlineSyncQueue.updateStatus(result.id, 'completed');
        } else {
          // Increment retry count
          const txn = pending.find(t => t.id === result.id);
          if (txn) {
            const retryCount = await offlineSyncQueue.incrementRetry(result.id);

            if (retryCount >= SYNC_CONFIG.MAX_RETRIES) {
              await offlineSyncQueue.updateStatus(result.id, 'failed', result.error);
            } else {
              await offlineSyncQueue.updateStatus(result.id, 'pending', result.error);
            }
          }
        }
      }

      // Calculate stats
      const stats = syncOrchestrator.getStats(results);
      console.log(`Sync completed: ${stats.successful}/${stats.total} successful (${stats.successRate.toFixed(1)}%)`);

      // Update last sync time
      setLastSyncAt(new Date());

      // Refresh pending count
      await refreshPendingCount();

      // Show toast notifications
      if (stats.successful > 0) {
        console.log(`✅ ${stats.successful} transactions synced successfully`);
      }
      if (stats.failed > 0) {
        console.warn(`⚠️ ${stats.failed} transactions failed to sync`);
      }

      return results;
    } catch (error: any) {
      console.error('Sync orchestration failed:', error);

      // Check for circular dependency errors
      if (error.message?.includes('Circular dependency')) {
        console.error('Circular dependency detected in transaction graph!');
      }

      throw error;
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
      setStatus(isOnline ? 'online' : 'offline');
      setSyncProgress(null);
    }
  }, [isOnline, refreshPendingCount]);

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
    syncProgress,
    queueTransaction,
    syncAll,
    clearCompleted,
    refreshPendingCount,
  };
}
