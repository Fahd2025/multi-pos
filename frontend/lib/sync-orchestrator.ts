/**
 * Sync Orchestrator - Dependency-Aware Transaction Synchronization
 *
 * Implements DAG (Directed Acyclic Graph) building and topological sort
 * to ensure transactions are synced in the correct order based on dependencies.
 */

import type {
  QueuedTransaction,
  TransactionNode,
  DependencyGraph,
  SyncResult,
  SyncTransactionRequest,
  SyncTransactionResponse,
} from '@/types/offline';
import { idMappingManager } from './id-mapper';
import api from '@/services/api';

export class SyncOrchestrator {
  private  syncInProgress = false;

  /**
   * Build dependency graph (DAG) from queued transactions
   */
  buildDependencyGraph(transactions: QueuedTransaction[]): DependencyGraph {
    const graph: DependencyGraph = new Map();

    // Initialize nodes
    for (const txn of transactions) {
      graph.set(txn.id, {
        transaction: txn,
        dependencies: txn.dependencies || [],
        dependents: [],
        visited: false,
        processing: false,
      });
    }

    // Build dependents (reverse edges)
    for (const [id, node] of graph.entries()) {
      for (const depId of node.dependencies) {
        const depNode = graph.get(depId);
        if (depNode) {
          depNode.dependents.push(id);
        }
      }
    }

    return graph;
  }

  /**
   * Topological sort to determine sync order
   * Uses depth-first search (DFS) with cycle detection
   */
  topologicalSort(graph: DependencyGraph): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();

    const visit = (id: string, path: Set<string> = new Set()) => {
      const node = graph.get(id);
      if (!node) return;

      // Already visited - skip
      if (visited.has(id)) return;

      // Detect cycles - if we're currently processing this node, we have a cycle
      if (node.processing || path.has(id)) {
        const cycle = Array.from(path).concat(id).join(' → ');
        throw new Error(`Circular dependency detected: ${cycle}`);
      }

      // Mark as processing (for cycle detection)
      node.processing = true;
      path.add(id);

      // Visit dependencies first (depth-first)
      for (const depId of node.dependencies) {
        visit(depId, new Set(path));
      }

      // Mark as visited and add to sorted list
      node.processing = false;
      path.delete(id);
      visited.add(id);
      sorted.push(id);
    };

    // Visit all nodes
    for (const id of graph.keys()) {
      if (!visited.has(id)) {
        visit(id);
      }
    }

    return sorted;
  }

  /**
   * Sync a single transaction
   */
  private async syncSingleTransaction(
    txn: QueuedTransaction,
    idMappings: Map<string, string>
  ): Promise<SyncResult> {
    try {
      // Resolve foreign keys before syncing
      const resolvedData = { ...txn.data };

      if (txn.foreignKeys) {
        for (const fk of txn.foreignKeys) {
          const realId = idMappings.get(fk.tempId);
          if (realId) {
            resolvedData[fk.field] = realId;
          }
        }
      }

      // Build sync request
      const request: SyncTransactionRequest = {
        id: txn.id,
        type: txn.type,
        timestamp: txn.timestamp,
        branchId: txn.branchId,
        userId: txn.userId,
        data: resolvedData,
        dependencies: txn.dependencies,
        entityId: txn.entityId,
        entityTempId: txn.entityTempId,
        foreignKeys: txn.foreignKeys,
      };

      // Send to server
      const response = await api.post<SyncTransactionResponse>(
        '/api/v1/sync/transaction',
        request
      );

      if (response.data.success && response.data.data) {
        return {
          id: txn.id,
          success: true,
          entityId: response.data.data.entityId,
          tempId: response.data.data.tempId,
        };
      }

      return {
        id: txn.id,
        success: false,
        error: response.data.error?.message || 'Unknown error',
      };
    } catch (error: any) {
      return {
        id: txn.id,
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Sync failed',
      };
    }
  }

  /**
   * Sync transactions in dependency order
   */
  async syncWithDependencies(
    transactions: QueuedTransaction[],
    onProgress?: (current: number, total: number) => void
  ): Promise<SyncResult[]> {
    // Prevent concurrent syncs
    if (this.syncInProgress) {
      console.warn('Sync already in progress, skipping');
      return [];
    }

    try {
      this.syncInProgress = true;

      const pending = transactions.filter(t => t.status === 'pending');
      if (pending.length === 0) {
        return [];
      }

      // Build graph and get sorted order
      const graph = this.buildDependencyGraph(pending);
      const sortedIds = this.topologicalSort(graph);

      const results: SyncResult[] = [];
      const idMappings = new Map<string, string>();  // tempId → realId

      // Sync in sorted order
      for (let i = 0; i < sortedIds.length; i++) {
        const txnId = sortedIds[i];
        const txn = pending.find(t => t.id === txnId);

        if (!txn) continue;

        // Report progress
        if (onProgress) {
          onProgress(i + 1, sortedIds.length);
        }

        // Sync transaction
        const result = await this.syncSingleTransaction(txn, idMappings);
        results.push(result);

        // Store ID mapping for future transactions
        if (result.success && result.entityId && txn.entityTempId) {
          idMappings.set(txn.entityTempId, result.entityId);

          // Store mapping in IndexedDB
          await idMappingManager.addMapping({
            tempId: txn.entityTempId,
            realId: result.entityId,
            entityType: this.getEntityTypeFromTransactionType(txn.type),
            synced: true,
          });
        }

        // Delay between syncs to avoid overwhelming server
        if (i < sortedIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Sync orchestration failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Validate dependency graph for cycles
   */
  validateGraph(graph: DependencyGraph): boolean {
    try {
      this.topologicalSort(graph);
      return true;
    } catch (error: any) {
      if (error.message.includes('Circular dependency')) {
        console.error('Dependency graph validation failed:', error.message);
        return false;
      }
      throw error;
    }
  }

  /**
   * Get entity type from transaction type
   */
  private getEntityTypeFromTransactionType(txnType: string): any {
    if (txnType.startsWith('customer')) return 'customer';
    if (txnType.startsWith('sale')) return 'sale';
    if (txnType.startsWith('expense')) return 'expense';
    if (txnType.startsWith('purchase')) return 'purchase';
    if (txnType.startsWith('pending_order')) return 'pending_order';
    if (txnType.startsWith('delivery')) return 'delivery';
    if (txnType.startsWith('table')) return 'table';
    return 'unknown';
  }

  /**
   * Get sync statistics
   */
  getStats(results: SyncResult[]): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  } {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return { total, successful, failed, successRate };
  }

  /**
   * Group results by transaction type
   */
  groupResultsByType(
    results: SyncResult[],
    transactions: QueuedTransaction[]
  ): Map<string, SyncResult[]> {
    const grouped = new Map<string, SyncResult[]>();

    for (const result of results) {
      const txn = transactions.find(t => t.id === result.id);
      if (!txn) continue;

      const type = txn.type;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(result);
    }

    return grouped;
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }
}

// Export singleton instance
export const syncOrchestrator = new SyncOrchestrator();
