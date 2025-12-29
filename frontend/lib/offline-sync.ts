/**
 * Offline Sync Queue - Enhanced for Phase 1
 * IndexedDB-based persistent queue for offline transaction management
 * Implements last-commit-wins conflict resolution with retry logic
 *
 * VERSION 2 ENHANCEMENTS:
 * - Dependency tracking for ordered synchronization
 * - Temporary ID management for offline-created entities
 * - Foreign key resolution support
 * - Entity versioning for conflict detection
 */

import type {
  TransactionType,
  SyncStatus,
  QueuedTransaction,
  ForeignKeyRef,
  ConflictResolution,
} from '@/types/offline';

// Re-export types for backward compatibility
export type { TransactionType, SyncStatus, QueuedTransaction };

/**
 * Sync configuration
 */
const SYNC_CONFIG = {
  DB_NAME: 'OfflineQueue',
  DB_VERSION: 2, // UPDATED for Phase 1 enhancements
  STORE_NAME: 'transactions',
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 5000, 15000], // Exponential backoff: 1s, 5s, 15s
  BATCH_SIZE: 10, // Process 10 transactions at a time
};

/**
 * Offline Sync Queue Manager
 * Handles persistent storage and synchronization of offline transactions
 */
class OfflineSyncQueue {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB database
   */
  async init(): Promise<void> {
    // Return existing initialization if in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Create new initialization promise
    this.initPromise = new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(SYNC_CONFIG.DB_NAME, SYNC_CONFIG.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const transaction = (event.target as IDBOpenDBRequest).transaction;

        let objectStore: IDBObjectStore;

        // Create object store if it doesn't exist (v1)
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(SYNC_CONFIG.STORE_NAME)) {
            objectStore = db.createObjectStore(SYNC_CONFIG.STORE_NAME, {
              keyPath: 'id',
            });

            // Create v1 indexes for efficient querying
            objectStore.createIndex('status', 'status', { unique: false });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            objectStore.createIndex('type', 'type', { unique: false });
            objectStore.createIndex('branchId', 'branchId', { unique: false });
          }
        }

        // Add Phase 1 enhancements (v2)
        if (oldVersion < 2 && transaction) {
          objectStore = transaction.objectStore(SYNC_CONFIG.STORE_NAME);

          // Add new indexes for dependency tracking and temp ID management
          if (!objectStore.indexNames.contains('entityTempId')) {
            objectStore.createIndex('entityTempId', 'entityTempId', { unique: false });
          }
          if (!objectStore.indexNames.contains('entityId')) {
            objectStore.createIndex('entityId', 'entityId', { unique: false });
          }
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInit(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
    return this.db;
  }

  /**
   * Add a transaction to the offline queue
   * @param transaction - Transaction data to queue
   * @returns Transaction ID
   */
  async add(transaction: Omit<QueuedTransaction, 'id' | 'status' | 'retryCount'>): Promise<string> {
    const db = await this.ensureInit();

    const queuedTransaction: QueuedTransaction = {
      ...transaction,
      id: this.generateId(),
      status: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const request = store.add(queuedTransaction);

      request.onsuccess = () => {
        resolve(queuedTransaction.id);
      };

      request.onerror = () => {
        reject(new Error('Failed to add transaction to queue'));
      };
    });
  }

  /**
   * Get all pending transactions (sorted by timestamp)
   * @returns Array of pending transactions
   */
  async getPending(): Promise<QueuedTransaction[]> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readonly');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        const transactions = request.result as QueuedTransaction[];
        // Sort by timestamp (chronological order)
        transactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        resolve(transactions);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch pending transactions'));
      };
    });
  }

  /**
   * Get a transaction by ID
   * @param id - Transaction ID
   * @returns Transaction or null if not found
   */
  async getById(id: string): Promise<QueuedTransaction | null> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readonly');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch transaction'));
      };
    });
  }

  /**
   * Update transaction status
   * @param id - Transaction ID
   * @param status - New status
   * @param error - Optional error message
   */
  async updateStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const transaction = getRequest.result as QueuedTransaction;
        if (!transaction) {
          reject(new Error('Transaction not found'));
          return;
        }

        transaction.status = status;
        if (error) {
          transaction.lastError = error;
        }
        if (status === 'syncing' || status === 'failed') {
          transaction.lastAttemptAt = new Date();
        }

        const putRequest = store.put(transaction);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          reject(new Error('Failed to update transaction status'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to fetch transaction for update'));
      };
    });
  }

  /**
   * Increment retry count for a transaction
   * @param id - Transaction ID
   */
  async incrementRetry(id: string): Promise<number> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const transaction = getRequest.result as QueuedTransaction;
        if (!transaction) {
          reject(new Error('Transaction not found'));
          return;
        }

        transaction.retryCount += 1;
        const putRequest = store.put(transaction);

        putRequest.onsuccess = () => {
          resolve(transaction.retryCount);
        };

        putRequest.onerror = () => {
          reject(new Error('Failed to increment retry count'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to fetch transaction for retry'));
      };
    });
  }

  /**
   * Delete a transaction from the queue
   * @param id - Transaction ID
   */
  async delete(id: string): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete transaction'));
      };
    });
  }

  /**
   * Get count of pending transactions
   * @returns Number of pending transactions
   */
  async getPendingCount(): Promise<number> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readonly');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const index = store.index('status');
      const request = index.count('pending');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to count pending transactions'));
      };
    });
  }

  /**
   * Clear all completed transactions
   */
  async clearCompleted(): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const index = store.index('status');
      const request = index.openCursor('completed');

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to clear completed transactions'));
      };
    });
  }

  /**
   * Clear all transactions (use with caution)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear all transactions'));
      };
    });
  }

  /**
   * Generate a unique ID for transactions
   * Format: timestamp-random
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get sync configuration
   */
  getConfig() {
    return SYNC_CONFIG;
  }

  /**
   * NEW: Find transaction by entity temp ID
   * Used for dependency tracking when creating entities offline
   * @param tempId - Temporary entity ID (e.g., "temp-customer-123")
   * @returns Transaction or null if not found
   */
  async findByEntityTempId(tempId: string): Promise<QueuedTransaction | null> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readonly');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const index = store.index('entityTempId');
      const request = index.get(tempId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to find transaction by entity temp ID'));
      };
    });
  }

  /**
   * NEW: Cancel a transaction (remove from queue)
   * Used when deleting an offline-created entity before sync
   * @param id - Transaction ID to cancel
   */
  async cancel(id: string): Promise<void> {
    return this.delete(id);
  }

  /**
   * NEW: Get all transactions (including those with dependencies)
   * Used by sync orchestrator for dependency graph building
   * @returns All transactions in the queue
   */
  async getAllWithDependencies(): Promise<QueuedTransaction[]> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readonly');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch all transactions'));
      };
    });
  }

  /**
   * NEW: Resolve foreign keys after a transaction syncs
   * Updates all pending transactions that reference a temp ID with the real ID
   * @param tempId - Temporary ID to resolve
   * @param realId - Real server-generated ID
   */
  async resolveForeignKeys(tempId: string, realId: string): Promise<void> {
    const db = await this.ensureInit();

    return new Promise(async (resolve, reject) => {
      const tx = db.transaction(SYNC_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(SYNC_CONFIG.STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const allTransactions = getAllRequest.result as QueuedTransaction[];
        let updatedCount = 0;

        // Find and update all transactions with foreign keys referencing tempId
        for (const txn of allTransactions) {
          if (txn.foreignKeys && txn.foreignKeys.length > 0) {
            let needsUpdate = false;

            for (const fk of txn.foreignKeys) {
              if (fk.tempId === tempId) {
                // Update the data field with real ID
                if (txn.data && typeof txn.data === 'object') {
                  txn.data[fk.field] = realId;
                  needsUpdate = true;
                }
              }
            }

            if (needsUpdate) {
              store.put(txn);
              updatedCount++;
            }
          }
        }

        console.log(`Resolved ${updatedCount} foreign key references: ${tempId} → ${realId}`);
        resolve();
      };

      getAllRequest.onerror = () => {
        reject(new Error('Failed to resolve foreign keys'));
      };
    });
  }
}

// Export singleton instance
const offlineSyncQueue = new OfflineSyncQueue();
export default offlineSyncQueue;

// Export class for testing
export { OfflineSyncQueue, SYNC_CONFIG };
