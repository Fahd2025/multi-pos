/**
 * Offline Support Type Definitions
 *
 * Central location for all offline-related types and interfaces
 */

/**
 * Transaction types supported for offline operations
 */
export type TransactionType =
  | 'sale'  // Legacy - kept for backward compatibility
  | 'sale_create'
  | 'sale_void'
  | 'sale_payment_update'
  | 'purchase'  // Legacy
  | 'purchase_create'
  | 'purchase_receive'
  | 'expense'  // Legacy
  | 'expense_create'
  | 'inventory_adjust'  // Legacy
  | 'stock_adjust'
  | 'pending_order'
  | 'customer_create'
  | 'customer_update'
  | 'customer_delete'
  | 'table_transfer'
  | 'table_assign'
  | 'table_clear'
  | 'delivery_create'
  | 'delivery_status_update'
  | 'supplier_create'
  | 'category_create'
  | 'driver_create'
  | 'zone_create';

/**
 * Sync status for queued transactions
 */
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

/**
 * Conflict resolution strategies
 */
export type ConflictResolution = 'last-write-wins' | 'server-wins' | 'manual';

/**
 * Foreign key reference for dependency tracking
 */
export interface ForeignKeyRef {
  field: string;      // Field name (e.g., "customerId")
  tempId: string;     // Temporary ID to resolve
}

/**
 * Queued transaction in IndexedDB
 */
export interface QueuedTransaction {
  // Core fields
  id: string;                       // Client transaction ID
  type: TransactionType;            // Transaction type
  timestamp: Date;                  // Client timestamp
  branchId: string;                 // Branch context
  userId: string;                   // User who created transaction
  data: any;                        // Transaction payload (DTO)

  // Status tracking
  status: SyncStatus;               // Current sync status
  retryCount: number;               // Number of retry attempts
  lastError?: string;               // Last error message
  lastAttemptAt?: Date;             // Timestamp of last sync attempt

  // Dependency tracking (NEW for Phase 1)
  dependencies?: string[];          // Transaction IDs this depends on
  entityId?: string;                // Entity ID (for UPDATE/DELETE)
  entityTempId?: string;            // Temp ID (for CREATE)
  foreignKeys?: ForeignKeyRef[];    // Foreign keys to resolve
  entityVersion?: number;           // Entity version for conflict detection
  conflictResolution?: ConflictResolution;  // How to handle conflicts
}

/**
 * Transaction node in dependency graph
 */
export interface TransactionNode {
  transaction: QueuedTransaction;
  dependencies: string[];           // IDs of transactions this depends on
  dependents: string[];             // IDs of transactions that depend on this
  visited: boolean;                 // For topological sort
  processing: boolean;              // For cycle detection
}

/**
 * Sync result for a single transaction
 */
export interface SyncResult {
  id: string;                       // Transaction ID
  success: boolean;                 // Whether sync succeeded
  error?: string;                   // Error message if failed
  entityId?: string;                // Server-generated entity ID (for CREATE operations)
  tempId?: string;                  // Client temp ID (for mapping)
}

/**
 * Batch sync results
 */
export interface BatchSyncResult {
  total: number;                    // Total transactions attempted
  successful: number;               // Number of successful syncs
  failed: number;                   // Number of failed syncs
  results: SyncResult[];            // Individual results
}

/**
 * Sync status information
 */
export interface SyncStatusInfo {
  pendingCount: number;             // Number of pending transactions
  lastSyncAt?: Date;                // Last successful sync timestamp
  isOnline: boolean;                // Current online status
  recentErrors: string[];           // Recent error messages
}

/**
 * Sync transaction request (sent to backend)
 */
export interface SyncTransactionRequest {
  id: string;                       // Client transaction ID
  type: TransactionType;            // Transaction type
  timestamp: Date;                  // Client timestamp
  branchId: string;                 // Branch ID
  userId: string;                   // User ID
  data: any;                        // Transaction payload
  dependencies?: string[];          // Transaction dependencies
  entityId?: string;                // Entity ID (for UPDATE/DELETE)
  entityTempId?: string;            // Temp ID (for CREATE)
  foreignKeys?: ForeignKeyRef[];    // Foreign key references
}

/**
 * Sync transaction response (from backend)
 */
export interface SyncTransactionResponse {
  success: boolean;
  data?: {
    entityId: string;               // Server-generated ID
    transactionId: string;          // Client transaction ID
    tempId?: string;                // Client temp ID
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Offline queue configuration
 */
export interface OfflineQueueConfig {
  DB_NAME: string;
  DB_VERSION: number;
  STORE_NAME: string;
  MAX_RETRIES: number;
  RETRY_DELAYS: number[];           // Exponential backoff delays (ms)
  BATCH_SIZE: number;               // Number of transactions to sync at once
}

/**
 * Entity types that can be created offline
 */
export type OfflineEntityType = 'customer' | 'sale' | 'product' | 'expense' | 'purchase' | 'pending_order' | 'delivery' | 'table';

/**
 * Offline operation type
 */
export type OfflineOperationType = 'create' | 'update' | 'delete';

/**
 * Optimistic response for offline operations
 */
export interface OptimisticResponse<T> {
  data: T;                          // Optimistic data (with temp ID)
  tempId: string;                   // Temporary ID
  queued: boolean;                  // Whether transaction was queued
  timestamp: Date;                  // When operation occurred
}

/**
 * Dependency graph for transaction ordering
 */
export type DependencyGraph = Map<string, TransactionNode>;

/**
 * ID mapping entry
 */
export interface IdMapping {
  tempId: string;                   // Client-generated temp ID
  realId: string;                   // Server-generated real ID
  entityType: OfflineEntityType;
  synced: boolean;                  // Whether mapping is confirmed
  createdAt: Date;                  // When mapping was created
}

/**
 * Conflict information
 */
export interface ConflictInfo {
  transactionId: string;
  entityId: string;
  entityType: OfflineEntityType;
  clientVersion: number;
  serverVersion: number;
  clientTimestamp: Date;
  serverTimestamp: Date;
  resolution: ConflictResolution;
}
