/**
 * Tests for Offline Sync Queue
 * Testing IndexedDB-based persistent queue for offline transaction management
 */

import { OfflineSyncQueue, QueuedTransaction } from '@/lib/offline-sync';

// Mock IndexedDB for Node environment
const indexedDB = require('fake-indexeddb');
const IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

// Set up global IndexedDB mocks
global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

describe('OfflineSyncQueue', () => {
  let syncQueue: OfflineSyncQueue;

  beforeEach(async () => {
    // Create a fresh instance for each test
    syncQueue = new OfflineSyncQueue();
    await syncQueue.init();
  });

  afterEach(async () => {
    // Clear all data after each test
    await syncQueue.clearAll();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const queue = new OfflineSyncQueue();
      await expect(queue.init()).resolves.not.toThrow();
    });

    it('should return same promise if init called multiple times', async () => {
      const queue = new OfflineSyncQueue();
      const promise1 = queue.init();
      const promise2 = queue.init();
      expect(promise1).toBe(promise2);
      await promise1;
      await promise2;
    });

    it('should provide configuration', () => {
      const config = syncQueue.getConfig();
      expect(config).toBeDefined();
      expect(config.DB_NAME).toBe('OfflineQueue');
      expect(config.MAX_RETRIES).toBe(3);
    });
  });

  describe('Adding Transactions', () => {
    it('should add a sale transaction to the queue', async () => {
      const transaction = {
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: {
          items: [{ productId: 'prod-1', quantity: 2, unitPrice: 100 }],
          total: 200,
        },
      };

      const transactionId = await syncQueue.add(transaction);

      expect(transactionId).toBeDefined();
      expect(typeof transactionId).toBe('string');

      // Verify it was added
      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].type).toBe('sale');
      expect(pending[0].status).toBe('pending');
      expect(pending[0].retryCount).toBe(0);
    });

    it('should generate unique IDs for each transaction', async () => {
      const transaction1 = {
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      };

      const transaction2 = {
        type: 'purchase' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 200 },
      };

      const id1 = await syncQueue.add(transaction1);
      const id2 = await syncQueue.add(transaction2);

      expect(id1).not.toBe(id2);
    });

    it('should add multiple transaction types', async () => {
      const saleTransaction = {
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      };

      const purchaseTransaction = {
        type: 'purchase' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 200 },
      };

      const expenseTransaction = {
        type: 'expense' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { amount: 50 },
      };

      await syncQueue.add(saleTransaction);
      await syncQueue.add(purchaseTransaction);
      await syncQueue.add(expenseTransaction);

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(3);

      const types = pending.map((t) => t.type);
      expect(types).toContain('sale');
      expect(types).toContain('purchase');
      expect(types).toContain('expense');
    });
  });

  describe('Retrieving Transactions', () => {
    it('should get pending transactions in chronological order', async () => {
      const now = new Date();

      // Add transactions with different timestamps
      await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(now.getTime() + 2000), // 2 seconds later
        branchId: 'branch-123',
        userId: 'user-456',
        data: { order: 3 },
      });

      await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(now.getTime()), // earliest
        branchId: 'branch-123',
        userId: 'user-456',
        data: { order: 1 },
      });

      await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(now.getTime() + 1000), // 1 second later
        branchId: 'branch-123',
        userId: 'user-456',
        data: { order: 2 },
      });

      const pending = await syncQueue.getPending();

      expect(pending).toHaveLength(3);
      expect(pending[0].data.order).toBe(1);
      expect(pending[1].data.order).toBe(2);
      expect(pending[2].data.order).toBe(3);
    });

    it('should get transaction by ID', async () => {
      const transactionId = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      const transaction = await syncQueue.getById(transactionId);

      expect(transaction).not.toBeNull();
      expect(transaction!.id).toBe(transactionId);
      expect(transaction!.type).toBe('sale');
    });

    it('should return null for non-existent transaction ID', async () => {
      const transaction = await syncQueue.getById('non-existent-id');
      expect(transaction).toBeNull();
    });

    it('should get pending count', async () => {
      await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 200 },
      });

      const count = await syncQueue.getPendingCount();
      expect(count).toBe(2);
    });
  });

  describe('Updating Transaction Status', () => {
    it('should update transaction status to syncing', async () => {
      const transactionId = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      await syncQueue.updateStatus(transactionId, 'syncing');

      const transaction = await syncQueue.getById(transactionId);
      expect(transaction!.status).toBe('syncing');
      expect(transaction!.lastAttemptAt).toBeDefined();
    });

    it('should update transaction status to completed', async () => {
      const transactionId = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      await syncQueue.updateStatus(transactionId, 'completed');

      const transaction = await syncQueue.getById(transactionId);
      expect(transaction!.status).toBe('completed');

      // Completed transactions should not appear in pending
      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(0);
    });

    it('should update transaction status to failed with error', async () => {
      const transactionId = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      await syncQueue.updateStatus(transactionId, 'failed', 'Network error');

      const transaction = await syncQueue.getById(transactionId);
      expect(transaction!.status).toBe('failed');
      expect(transaction!.lastError).toBe('Network error');
      expect(transaction!.lastAttemptAt).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    it('should increment retry count', async () => {
      const transactionId = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      const retryCount1 = await syncQueue.incrementRetry(transactionId);
      expect(retryCount1).toBe(1);

      const retryCount2 = await syncQueue.incrementRetry(transactionId);
      expect(retryCount2).toBe(2);

      const transaction = await syncQueue.getById(transactionId);
      expect(transaction!.retryCount).toBe(2);
    });

    it('should handle multiple retry attempts up to max retries', async () => {
      const transactionId = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      const config = syncQueue.getConfig();

      // Retry up to max retries
      for (let i = 0; i < config.MAX_RETRIES; i++) {
        await syncQueue.incrementRetry(transactionId);
      }

      const transaction = await syncQueue.getById(transactionId);
      expect(transaction!.retryCount).toBe(config.MAX_RETRIES);
    });

    it('should support exponential backoff delays', () => {
      const config = syncQueue.getConfig();
      expect(config.RETRY_DELAYS).toEqual([1000, 5000, 15000]);
      expect(config.RETRY_DELAYS).toHaveLength(3);
      expect(config.RETRY_DELAYS[0]).toBeLessThan(config.RETRY_DELAYS[1]);
      expect(config.RETRY_DELAYS[1]).toBeLessThan(config.RETRY_DELAYS[2]);
    });
  });

  describe('Deleting Transactions', () => {
    it('should delete a transaction by ID', async () => {
      const transactionId = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      await syncQueue.delete(transactionId);

      const transaction = await syncQueue.getById(transactionId);
      expect(transaction).toBeNull();

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(0);
    });

    it('should clear all completed transactions', async () => {
      const id1 = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      const id2 = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 200 },
      });

      const id3 = await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 300 },
      });

      // Mark first two as completed
      await syncQueue.updateStatus(id1, 'completed');
      await syncQueue.updateStatus(id2, 'completed');

      await syncQueue.clearCompleted();

      // Only pending transaction should remain
      const transaction3 = await syncQueue.getById(id3);
      expect(transaction3).not.toBeNull();

      // Completed transactions should be deleted
      const transaction1 = await syncQueue.getById(id1);
      const transaction2 = await syncQueue.getById(id2);
      expect(transaction1).toBeNull();
      expect(transaction2).toBeNull();
    });

    it('should clear all transactions', async () => {
      await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 100 },
      });

      await syncQueue.add({
        type: 'sale' as const,
        timestamp: new Date(),
        branchId: 'branch-123',
        userId: 'user-456',
        data: { total: 200 },
      });

      await syncQueue.clearAll();

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(0);

      const count = await syncQueue.getPendingCount();
      expect(count).toBe(0);
    });
  });

  describe('Batch Processing', () => {
    it('should support batch size configuration', () => {
      const config = syncQueue.getConfig();
      expect(config.BATCH_SIZE).toBe(10);
    });

    it('should handle large number of pending transactions', async () => {
      const transactionCount = 25;

      // Add many transactions
      for (let i = 0; i < transactionCount; i++) {
        await syncQueue.add({
          type: 'sale' as const,
          timestamp: new Date(Date.now() + i * 1000),
          branchId: 'branch-123',
          userId: 'user-456',
          data: { order: i + 1 },
        });
      }

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(transactionCount);

      // Verify chronological ordering
      for (let i = 0; i < transactionCount; i++) {
        expect(pending[i].data.order).toBe(i + 1);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent adds', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          syncQueue.add({
            type: 'sale' as const,
            timestamp: new Date(),
            branchId: 'branch-123',
            userId: 'user-456',
            data: { order: i },
          })
        );
      }

      const ids = await Promise.all(promises);

      expect(ids).toHaveLength(10);
      expect(new Set(ids).size).toBe(10); // All IDs should be unique

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(10);
    });

    it('should handle concurrent status updates', async () => {
      const ids = [];

      for (let i = 0; i < 5; i++) {
        const id = await syncQueue.add({
          type: 'sale' as const,
          timestamp: new Date(),
          branchId: 'branch-123',
          userId: 'user-456',
          data: { order: i },
        });
        ids.push(id);
      }

      // Update all statuses concurrently
      await Promise.all(ids.map((id) => syncQueue.updateStatus(id, 'syncing')));

      // Verify all were updated
      for (const id of ids) {
        const transaction = await syncQueue.getById(id);
        expect(transaction!.status).toBe('syncing');
      }
    });
  });
});
