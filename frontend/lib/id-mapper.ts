/**
 * ID Mapper - Temporary ID Management
 *
 * Handles generation of temporary IDs for offline-created entities
 * and mapping between temporary IDs and real server-generated IDs.
 */

export type EntityType = 'customer' | 'sale' | 'product' | 'expense' | 'purchase' | 'pending_order';

export interface IdMapping {
  tempId: string;      // Client-generated temporary ID
  realId: string;      // Server-generated real ID (after sync)
  entityType: EntityType;
  synced: boolean;     // Whether mapping is confirmed
  createdAt: Date;     // When the mapping was created
}

const ID_MAPPINGS_STORE = 'IdMappings';
const DB_NAME = 'OfflineQueue';  // Same DB as OfflineSyncQueue

/**
 * Generate a temporary ID with 'temp-' prefix
 * Format: temp-{timestamp}-{random}
 */
export function generateTempId(entityType: EntityType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `temp-${entityType}-${timestamp}-${random}`;
}

/**
 * Check if an ID is a temporary ID
 */
export function isTempId(id: string | undefined | null): boolean {
  if (!id) return false;
  return id.startsWith('temp-');
}

/**
 * Extract entity type from temporary ID
 */
export function getEntityTypeFromTempId(tempId: string): EntityType | null {
  if (!isTempId(tempId)) return null;

  const match = tempId.match(/^temp-([a-z_]+)-/);
  return match ? (match[1] as EntityType) : null;
}

/**
 * ID Mapping Manager
 * Stores and retrieves mappings between temporary and real IDs
 */
export class IdMappingManager {
  private dbName = DB_NAME;
  private storeName = ID_MAPPINGS_STORE;

  /**
   * Open IndexedDB
   */
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);  // Version 2 (matches OfflineSyncQueue)

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Create ID mappings store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'tempId' });
          store.createIndex('realId', 'realId', { unique: false });
          store.createIndex('entityType', 'entityType', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  /**
   * Store a mapping (tempId → realId)
   */
  async addMapping(mapping: Omit<IdMapping, 'createdAt'>): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);

    const fullMapping: IdMapping = {
      ...mapping,
      createdAt: new Date(),
    };

    store.put(fullMapping);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get mapping by temporary ID
   */
  async getMappingByTempId(tempId: string): Promise<IdMapping | null> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(tempId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get mapping by real ID
   */
  async getMappingByRealId(realId: string): Promise<IdMapping | null> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);
    const index = store.index('realId');

    return new Promise((resolve, reject) => {
      const request = index.get(realId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Resolve a temp ID to its real ID (if mapped)
   */
  async resolveTempId(tempId: string): Promise<string> {
    if (!isTempId(tempId)) {
      return tempId;  // Already a real ID
    }

    const mapping = await this.getMappingByTempId(tempId);
    return mapping?.synced ? mapping.realId : tempId;
  }

  /**
   * Get all mappings for a specific entity type
   */
  async getMappingsByEntityType(entityType: EntityType): Promise<IdMapping[]> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);
    const index = store.index('entityType');

    return new Promise((resolve, reject) => {
      const request = index.getAll(entityType);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark mapping as synced
   */
  async markAsSynced(tempId: string): Promise<void> {
    const mapping = await this.getMappingByTempId(tempId);
    if (!mapping) return;

    mapping.synced = true;
    await this.addMapping(mapping);
  }

  /**
   * Delete mapping by temp ID
   */
  async deleteMapping(tempId: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);

    store.delete(tempId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Clear all mappings
   */
  async clearAll(): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);

    store.clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get count of pending (unsynced) mappings
   */
  async getPendingCount(): Promise<number> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => {
        const allMappings = request.result as IdMapping[];
        const pendingCount = allMappings.filter(m => !m.synced).length;
        resolve(pendingCount);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const idMappingManager = new IdMappingManager();
