# Offline Support for All POS Features - Implementation Plan

## Executive Summary

Extend the existing offline support infrastructure (currently only for pending orders) to cover **Phase 1 features (Sales & Customers)**, enabling full offline CREATE/UPDATE/DELETE operations with dependency tracking and feature flags for gradual rollout.

**IMPORTANT:** This is a COMPLEX implementation that goes beyond the simple CREATE-only approach. It includes:
- ✅ CREATE/UPDATE/DELETE operations offline
- ✅ Temporary ID management and mapping
- ✅ Transaction dependency tracking (DAG)
- ✅ Ordered sync with foreign key resolution
- ✅ Feature flags per transaction type
- ✅ Conflict detection and resolution

## Current State Analysis

### What Works Today ✅
- **Pending Orders** have full offline support with:
  - IndexedDB queue for persistent storage
  - Auto-sync when connection restored
  - Retry logic (3 attempts with exponential backoff)
  - UI indicators for offline status
  - Backend sync endpoint (`/api/v1/sync/transaction`)

### Infrastructure Already in Place ✅
1. **Frontend:**
   - `OfflineSyncQueue` class (frontend/lib/offline-sync.ts)
   - `useOfflineSync` hook (frontend/hooks/useOfflineSync.ts)
   - IndexedDB with transaction types: 'sale', 'purchase', 'expense', 'inventory_adjust', 'pending_order'

2. **Backend:**
   - `ISyncService` / `SyncService` (Backend/Services/Shared/Sync/)
   - Sync endpoints (single + batch processing)
   - Pattern-based transaction routing (switch statement)
   - All DTOs already exist

## Features Requiring Offline Support

### Tier 1 - CRITICAL 🔥🔥🔥
1. **Sales/Transactions** - Core POS functionality
   - Create sale, void sale, update payment
   - Service: `sales.service.ts`
   - DTOs: CreateSaleDto, VoidSaleDto, UpdateSalePaymentDto

2. **Customers** - Create customers during checkout
   - Create, update, delete customer
   - Service: `customer.service.ts`
   - DTOs: CreateCustomerDto, UpdateCustomerDto

### Tier 2 - HIGH 🔥🔥
3. **Stock Adjustments** - Inventory corrections
   - Service: `inventory.service.ts`
   - DTOs: StockAdjustmentDto

4. **Expenses** - Daily expense tracking
   - Service: `expense.service.ts`
   - DTOs: CreateExpenseDto

### Tier 3 - MEDIUM 🔥
5. **Purchases** - Stock receiving
6. **Table Operations** - Transfer, assign, clear
7. **Delivery Orders** - Create/update deliveries

### Tier 4 - LOW 🔵
8. **Suppliers**, **Categories**, **Drivers**, **Zones**, **Expense Categories**

## Implementation Approach

### Scope: Phase 1 Only (Sales & Customers)

**Features:**
- Sales (create sale, void sale, update payment)
- Customers (create, update, delete)

**Transaction Types (9 types):**
- `sale_create` - Create new sale
- `sale_void` - Void existing sale
- `sale_payment_update` - Update payment details
- `customer_create` - Create new customer
- `customer_update` - Update existing customer
- `customer_delete` - Soft delete customer

**Estimated Effort: 80-100 hours** (significantly higher due to UPDATE/DELETE and dependency tracking)

### User Requirements

Based on user selections:
1. ✅ **Full CRUD Support** - CREATE, UPDATE, DELETE operations offline
2. ✅ **Feature Flags** - Per transaction type for gradual rollout
3. ✅ **Dependency Tracking** - Handle customer creation → sale reference
4. ⚠️ **Increased Complexity** - Temporary ID management, DAG sync, conflict resolution

### Key Architectural Decisions

#### 1. Transaction Type Strategy
**SPECIFIC transaction types** for Phase 1:
- `sale_create`, `sale_void`, `sale_payment_update`
- `customer_create`, `customer_update`, `customer_delete`

#### 2. Operation Support (FULL CRUD)
- **CREATE operations**: ✅ Generate temporary IDs, queue transaction
- **UPDATE operations**: ✅ Track entity version, handle temp ID → real ID mapping
- **DELETE operations**: ✅ Mark for deletion, handle cascading deletes

#### 3. Temporary ID Management
**Problem:** Offline-created entities don't have server-generated IDs yet.

**Solution:**
```typescript
// Generate temporary IDs with 'temp-' prefix
const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Store mapping in IndexedDB
interface IdMapping {
  tempId: string;      // Client-generated temp ID
  realId: string;      // Server-generated real ID (after sync)
  entityType: string;  // 'customer', 'sale', etc.
  synced: boolean;     // Whether mapping is confirmed
}

// After sync, update all references to tempId with realId
```

#### 4. Dependency Tracking (Transaction DAG)
**Problem:** Customer created offline → Sale references that customer → Must sync customer first.

**Solution: Build Directed Acyclic Graph (DAG)**
```typescript
interface TransactionNode {
  id: string;
  type: TransactionType;
  dependencies: string[];  // IDs of transactions this depends on
  dependents: string[];    // IDs of transactions that depend on this
  data: any;
}

// Example:
// txn1: customer_create (tempId: temp-123) → dependencies: []
// txn2: sale_create (customerId: temp-123) → dependencies: [txn1.id]

// Sync order (topological sort):
// 1. txn1 (customer) → Get real ID
// 2. Map temp-123 → real-456
// 3. txn2 (sale) with customerId: real-456
```

#### 5. UPDATE Operation Strategy
**For entities created ONLINE (have real IDs):**
```typescript
// Can update immediately
await offlineSyncQueue.add({
  type: 'customer_update',
  entityId: customer.id,  // Real ID
  data: updateData,
});
```

**For entities created OFFLINE (have temp IDs):**
```typescript
// Option A: Block updates until synced
if (customer.id.startsWith('temp-')) {
  throw new Error('Cannot update customer until synchronized with server');
}

// Option B: Queue update with dependency on CREATE
await offlineSyncQueue.add({
  type: 'customer_update',
  entityId: customer.id,  // Temp ID
  dependencies: [createTransactionId],  // Must sync CREATE first
  data: updateData,
});
```

**RECOMMENDATION: Use Option B with dependency tracking**

#### 6. DELETE Operation Strategy
**For entities created ONLINE:**
```typescript
// Queue delete transaction
await offlineSyncQueue.add({
  type: 'customer_delete',
  entityId: customer.id,  // Real ID
  data: { reason: 'User deleted offline' },
});
```

**For entities created OFFLINE:**
```typescript
// Cancel the CREATE transaction, remove from queue
await offlineSyncQueue.cancel(createTransactionId);
// Remove from UI optimistic state
```

**Cascading Deletes:**
- If customer deleted → Mark all related sales with warning
- Don't auto-delete related entities (data loss risk)
- Show UI warning: "Customer has pending sales. Delete anyway?"

#### 7. Feature Flags Implementation
```typescript
// frontend/lib/feature-flags.ts (NEW FILE)
export const OFFLINE_FEATURES = {
  SALES_CREATE: true,
  SALES_VOID: true,
  SALES_PAYMENT_UPDATE: false,  // Disabled by default
  CUSTOMER_CREATE: true,
  CUSTOMER_UPDATE: true,
  CUSTOMER_DELETE: false,  // Disabled by default
};

// Usage in service:
if (!isOnline && !OFFLINE_FEATURES.CUSTOMER_DELETE) {
  throw new Error('Delete operation requires internet connection');
}
```

#### 8. Conflict Detection
**Track entity versions** to detect conflicts:
```typescript
interface QueuedTransaction {
  // ... existing fields
  entityVersion?: number;     // Entity version when queued
  conflictResolution?: 'last-write-wins' | 'server-wins' | 'manual';
}

// On sync:
// 1. Check if entity was modified server-side (compare versions)
// 2. If conflict detected:
//    - Last-write-wins: Apply offline changes
//    - Server-wins: Discard offline changes, show warning
//    - Manual: Prompt user to resolve
```

#### 9. UI Pattern
- Create shared `<OfflineBadge />` component
- Create shared `<FeatureFlagGuard />` wrapper
- Update button text based on offline status and feature flag

### Frontend Implementation Pattern

#### New Infrastructure Files (5 new files)

1. **frontend/lib/feature-flags.ts** - Feature flag configuration
2. **frontend/lib/id-mapper.ts** - Temporary ID → Real ID mapping
3. **frontend/lib/transaction-dag.ts** - Dependency graph manager
4. **frontend/components/shared/OfflineBadge.tsx** - Offline indicator
5. **frontend/components/shared/FeatureFlagGuard.tsx** - Feature flag wrapper

#### Service Pattern: CREATE Operation

```typescript
// customer.service.ts
import { OFFLINE_FEATURES } from '@/lib/feature-flags';
import { offlineSyncQueue } from '@/lib/offline-sync';
import { generateTempId } from '@/lib/id-mapper';

async createCustomer(customerData: CreateCustomerDto): Promise<CustomerDto> {
  const isOnline = navigator.onLine;

  if (!isOnline && OFFLINE_FEATURES.CUSTOMER_CREATE) {
    const tempId = generateTempId('customer');
    const branchId = localStorage.getItem('branchId') || '';
    const userId = localStorage.getItem('userId') || '';

    // Queue transaction with dependency tracking
    const transactionId = await offlineSyncQueue.add({
      type: 'customer_create',
      timestamp: new Date(),
      branchId,
      userId,
      data: { ...customerData, tempId },  // Include temp ID in data
      dependencies: [],  // No dependencies for CREATE
      entityTempId: tempId,  // Track temp ID for later mapping
    });

    // Return optimistic response with temp ID
    return {
      id: tempId,
      ...customerData,
      createdAt: new Date().toISOString(),
      isActive: true,
      totalPurchases: 0,
      visitCount: 0,
    };
  }

  if (!isOnline) {
    throw new Error('Customer creation requires internet connection (feature disabled)');
  }

  // Online - normal API call
  const response = await api.post('/api/v1/customers', customerData);
  return response.data.data;
}
```

#### Service Pattern: UPDATE Operation

```typescript
async updateCustomer(id: string, customerData: UpdateCustomerDto): Promise<CustomerDto> {
  const isOnline = navigator.onLine;
  const isTemporary = id.startsWith('temp-');

  if (!isOnline && OFFLINE_FEATURES.CUSTOMER_UPDATE) {
    const branchId = localStorage.getItem('branchId') || '';
    const userId = localStorage.getItem('userId') || '';

    let dependencies: string[] = [];

    // If temp ID, find the CREATE transaction and add as dependency
    if (isTemporary) {
      const createTxn = await offlineSyncQueue.findByEntityTempId(id);
      if (createTxn) {
        dependencies = [createTxn.id];
      }
    }

    // Queue UPDATE transaction
    const transactionId = await offlineSyncQueue.add({
      type: 'customer_update',
      timestamp: new Date(),
      branchId,
      userId,
      data: { id, ...customerData },
      dependencies,  // Depends on CREATE if temp ID
      entityId: id,  // Track entity ID for conflict detection
    });

    // Return optimistic response
    const existing = await this.getCustomerById(id);  // Get from local cache
    return { ...existing, ...customerData };
  }

  if (!isOnline) {
    throw new Error('Customer update requires internet connection (feature disabled)');
  }

  // Online - normal API call
  const response = await api.put(`/api/v1/customers/${id}`, customerData);
  return response.data.data;
}
```

#### Service Pattern: DELETE Operation

```typescript
async deleteCustomer(id: string): Promise<void> {
  const isOnline = navigator.onLine;
  const isTemporary = id.startsWith('temp-');

  if (!isOnline && OFFLINE_FEATURES.CUSTOMER_DELETE) {
    const branchId = localStorage.getItem('branchId') || '';
    const userId = localStorage.getItem('userId') || '';

    // If temp ID (created offline), cancel the CREATE transaction
    if (isTemporary) {
      const createTxn = await offlineSyncQueue.findByEntityTempId(id);
      if (createTxn) {
        await offlineSyncQueue.cancel(createTxn.id);
        // Remove from local optimistic state
        return;
      }
    }

    // Real ID - queue DELETE transaction
    await offlineSyncQueue.add({
      type: 'customer_delete',
      timestamp: new Date(),
      branchId,
      userId,
      data: { id },
      dependencies: [],
      entityId: id,
    });

    return;
  }

  if (!isOnline) {
    throw new Error('Customer deletion requires internet connection (feature disabled)');
  }

  // Online - normal API call
  await api.delete(`/api/v1/customers/${id}`);
}
```

#### Service Pattern: CREATE with Dependencies (Sale with Customer)

```typescript
async createSale(saleData: CreateSaleDto): Promise<SaleDto> {
  const isOnline = navigator.onLine;

  if (!isOnline && OFFLINE_FEATURES.SALES_CREATE) {
    const tempId = generateTempId('sale');
    const branchId = localStorage.getItem('branchId') || '';
    const userId = localStorage.getItem('userId') || '';

    let dependencies: string[] = [];

    // Check if customer is a temp ID (created offline)
    if (saleData.customerId && saleData.customerId.startsWith('temp-')) {
      const customerCreateTxn = await offlineSyncQueue.findByEntityTempId(saleData.customerId);
      if (customerCreateTxn) {
        dependencies.push(customerCreateTxn.id);  // Depend on customer creation
      }
    }

    // Queue sale creation with customer dependency
    const transactionId = await offlineSyncQueue.add({
      type: 'sale_create',
      timestamp: new Date(),
      branchId,
      userId,
      data: { ...saleData, tempId },
      dependencies,  // Will sync after customer
      entityTempId: tempId,
      foreignKeys: saleData.customerId ? [
        { field: 'customerId', tempId: saleData.customerId }
      ] : [],  // Track foreign keys for later resolution
    });

    // Return optimistic response
    return {
      id: tempId,
      ...saleData,
      createdAt: new Date().toISOString(),
      status: 'Completed',
    };
  }

  // Online - normal API call
  const response = await api.post('/api/v1/sales', saleData);
  return response.data.data;
}
```

**Services to Modify (Phase 1):**
1. `frontend/services/sales.service.ts` - createSale(), voidSale(), updatePayment()
2. `frontend/services/customer.service.ts` - createCustomer(), updateCustomer(), deleteCustomer()

### Backend Implementation

#### Update SyncService.cs Switch Statement (6 new cases for Phase 1)

```csharp
return transactionType.ToLower() switch
{
    // Sales operations
    "sale" or "sale_create" => await ProcessOfflineSaleCreateTransactionAsync(...),
    "sale_void" => await ProcessOfflineSaleVoidTransactionAsync(...),
    "sale_payment_update" => await ProcessOfflineSalePaymentUpdateTransactionAsync(...),

    // Customer operations (NEW)
    "customer_create" => await ProcessOfflineCustomerCreateTransactionAsync(...),
    "customer_update" => await ProcessOfflineCustomerUpdateTransactionAsync(...),
    "customer_delete" => await ProcessOfflineCustomerDeleteTransactionAsync(...),

    // Existing
    "pending_order" => await ProcessOfflinePendingOrderTransactionAsync(...),

    _ => throw new InvalidOperationException($"Unknown transaction type: {transactionType}"),
};
```

#### Implement Transaction Processors (6 new methods)

**Pattern for Customer CREATE:**
```csharp
private async Task<string> ProcessOfflineCustomerCreateTransactionAsync(
    string transactionData,
    string userId,
    string branchId,
    DateTime clientTimestamp
)
{
    var customerData = JsonSerializer.Deserialize<CreateCustomerDto>(
        transactionData,
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
    );

    if (customerData == null)
        throw new InvalidOperationException("Failed to deserialize customer data");

    var customer = await ProcessOfflineCustomerCreateAsync(
        customerData,
        userId,
        branchId,
        clientTimestamp
    );

    return customer.Id.ToString();  // Return REAL server-generated ID
}

public async Task<Customer> ProcessOfflineCustomerCreateAsync(
    CreateCustomerDto customerData,
    string userId,
    string branchId,
    DateTime clientTimestamp
)
{
    // Validate user and branch (same pattern as sales)
    // ...

    var customer = new Customer
    {
        Id = Guid.NewGuid(),  // Server-generated ID
        NameEn = customerData.NameEn,
        NameAr = customerData.NameAr,
        Phone = customerData.Phone,
        Email = customerData.Email,
        // ... other fields
        CreatedAt = clientTimestamp,  // PRESERVE client timestamp
        UpdatedAt = clientTimestamp,
        CreatedByUserId = Guid.Parse(userId),
        BranchId = Guid.Parse(branchId),
        IsActive = true,
    };

    context.Customers.Add(customer);
    await context.SaveChangesAsync();

    return customer;
}
```

**Pattern for Customer UPDATE:**
```csharp
public async Task<Customer> ProcessOfflineCustomerUpdateAsync(
    UpdateCustomerDto customerData,
    string customerId,
    string userId,
    string branchId,
    DateTime clientTimestamp
)
{
    var customer = await context.Customers.FindAsync(Guid.Parse(customerId));
    if (customer == null)
        throw new InvalidOperationException($"Customer not found: {customerId}");

    // Check for conflicts
    if (customer.UpdatedAt > clientTimestamp)
    {
        // Server version is newer - conflict detected
        // For now: Last-write-wins (apply offline changes)
        // Future: Return conflict for user resolution
    }

    // Apply updates
    customer.NameEn = customerData.NameEn ?? customer.NameEn;
    customer.NameAr = customerData.NameAr ?? customer.NameAr;
    customer.Phone = customerData.Phone ?? customer.Phone;
    // ... other fields

    customer.UpdatedAt = clientTimestamp;  // Use client timestamp
    customer.UpdatedByUserId = Guid.Parse(userId);

    await context.SaveChangesAsync();
    return customer;
}
```

**Pattern for Customer DELETE:**
```csharp
public async Task ProcessOfflineCustomerDeleteAsync(
    string customerId,
    string userId,
    string branchId,
    DateTime clientTimestamp
)
{
    var customer = await context.Customers.FindAsync(Guid.Parse(customerId));
    if (customer == null)
        throw new InvalidOperationException($"Customer not found: {customerId}");

    // Soft delete
    customer.IsActive = false;
    customer.DeletedAt = clientTimestamp;
    customer.DeletedByUserId = Guid.Parse(userId);

    await context.SaveChangesAsync();
}
```

#### Sync Endpoint Enhancement: Foreign Key Resolution

**Modified sync endpoint (Backend/Endpoints/SyncEndpoints.cs):**

```csharp
app.MapPost("/api/v1/sync/transaction", async (
    SyncTransactionRequest request,
    ISyncService syncService,
    HttpContext httpContext) =>
{
    var userId = httpContext.Items["UserId"]?.ToString();
    var branchId = httpContext.Items["Branch"]?.ToString();

    // Process transaction
    var entityId = await syncService.ProcessOfflineTransactionAsync(
        request.Type,
        JsonSerializer.Serialize(request.Data),
        branchId!,
        userId!,
        request.Timestamp
    );

    // RETURN MAPPING: tempId → realId
    return Results.Ok(new
    {
        success = true,
        data = new
        {
            entityId = entityId,  // Server-generated ID
            transactionId = request.Id,  // Client transaction ID
            tempId = request.EntityTempId,  // Client temp ID (if provided)
        }
    });
}).RequireAuthorization();
```

#### Update SyncTransactionRequest DTO

**File:** `Backend/Models/DTOs/Shared/Sync/SyncTransactionRequest.cs`

```csharp
public record SyncTransactionRequest(
    string Id,                      // Client transaction ID
    string Type,                    // Transaction type
    DateTime Timestamp,             // Client timestamp
    string BranchId,                // Branch ID
    string UserId,                  // User ID
    object Data,                    // Transaction payload
    string[] Dependencies,          // NEW: Transaction dependencies
    string? EntityId,               // NEW: Entity ID (for UPDATE/DELETE)
    string? EntityTempId,           // NEW: Temp ID (for CREATE)
    ForeignKeyReference[]? ForeignKeys  // NEW: Foreign key references
);

public record ForeignKeyReference(
    string Field,      // Field name (e.g., "customerId")
    string TempId      // Temp ID to resolve
);
```

#### Add ICustomerService Dependency

**File:** `Backend/Services/Shared/Sync/SyncService.cs`

```csharp
public class SyncService : ISyncService
{
    private readonly ISalesService _salesService;
    private readonly IPendingOrdersService _pendingOrdersService;
    private readonly ICustomerService _customerService;  // NEW

    public SyncService(
        DbContextFactory dbContextFactory,
        HeadOfficeDbContext headOfficeContext,
        ISalesService salesService,
        IPendingOrdersService pendingOrdersService,
        ICustomerService customerService  // NEW
    )
    {
        // ...
        _customerService = customerService;
    }
}
```

### UI Offline Indicators

**Create shared component:**
- `frontend/components/shared/OfflineBadge.tsx` (NEW)
- Shows amber badge when offline
- Displays pending transaction count

**Update ~20 dialogs/forms:**
- Add `<OfflineBadge />` to dialog headers
- Change button text: "Save" → "Save Offline" when offline
- Example locations:
  - TransactionDialogV3.tsx (Sales)
  - CustomerDialog.tsx (Customers)
  - StockAdjustmentDialog.tsx (Inventory)
  - ExpenseDialog.tsx (Expenses)
  - PurchaseDialog.tsx (Purchases)
  - TableTransferDialog.tsx (Tables)
  - And 14+ more

### Conflict Resolution Strategy

**Last-Commit-Wins** (already implemented):
- Server processes transactions in order received
- No complex merge logic
- Inventory conflicts flagged with `HasInventoryDiscrepancy` flag
- Edge cases: Product deleted → Sync fails with clear error message

### Enhanced OfflineSyncQueue (frontend/lib/offline-sync.ts)

**Updated QueuedTransaction Interface:**
```typescript
interface QueuedTransaction {
  // Existing fields
  id: string;
  type: TransactionType;
  timestamp: Date;
  branchId: string;
  userId: string;
  data: any;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  lastAttemptAt?: Date;

  // NEW fields for UPDATE/DELETE and dependency tracking
  dependencies?: string[];           // Transaction IDs this depends on
  entityId?: string;                 // Entity ID (for UPDATE/DELETE)
  entityTempId?: string;             // Temp ID (for CREATE)
  foreignKeys?: ForeignKeyRef[];     // Foreign keys to resolve
  entityVersion?: number;            // Entity version for conflict detection
}

interface ForeignKeyRef {
  field: string;      // Field name (e.g., "customerId")
  tempId: string;     // Temp ID to resolve
}
```

**New Methods to Add:**

```typescript
class OfflineSyncQueue {
  // Existing methods...

  // NEW: Find transaction by entity temp ID
  async findByEntityTempId(tempId: string): Promise<QueuedTransaction | null> {
    const db = await this.openDB();
    const tx = db.transaction([this.STORE_NAME], 'readonly');
    const store = tx.objectStore(this.STORE_NAME);
    const index = store.index('entityTempId');  // New index
    return await index.get(tempId);
  }

  // NEW: Cancel transaction (for offline DELETE of offline CREATE)
  async cancel(transactionId: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction([this.STORE_NAME], 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    await store.delete(transactionId);
    await tx.complete;
  }

  // NEW: Get transactions with dependencies (for DAG building)
  async getAllWithDependencies(): Promise<QueuedTransaction[]> {
    const db = await this.openDB();
    const tx = db.transaction([this.STORE_NAME], 'readonly');
    const store = tx.objectStore(this.STORE_NAME);
    return await store.getAll();
  }

  // NEW: Update foreign key references after sync
  async resolveForeignKeys(tempId: string, realId: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction([this.STORE_NAME], 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    const all = await store.getAll();

    // Find all transactions with foreignKeys referencing tempId
    for (const txn of all) {
      if (txn.foreignKeys) {
        let updated = false;
        for (const fk of txn.foreignKeys) {
          if (fk.tempId === tempId) {
            // Update the data field with real ID
            txn.data[fk.field] = realId;
            updated = true;
          }
        }
        if (updated) {
          await store.put(txn);
        }
      }
    }
    await tx.complete;
  }
}
```

**Update IndexedDB Schema (DB_VERSION = 2):**
```typescript
const SYNC_CONFIG = {
  DB_VERSION: 2,  // Increment version
  // ... existing config
};

request.onupgradeneeded = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 1) {
    // Original schema...
  }

  if (oldVersion < 2) {
    // Add new indexes
    const store = tx.objectStore('transactions');
    store.createIndex('entityTempId', 'entityTempId', { unique: false });
    store.createIndex('entityId', 'entityId', { unique: false });
  }
};
```

### Sync Order Algorithm (Topological Sort)

**New file:** `frontend/lib/sync-orchestrator.ts`

```typescript
export class SyncOrchestrator {
  /**
   * Build dependency graph (DAG) from queued transactions
   */
  buildDependencyGraph(transactions: QueuedTransaction[]): Map<string, TransactionNode> {
    const graph = new Map<string, TransactionNode>();

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
   */
  topologicalSort(graph: Map<string, TransactionNode>): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();

    const visit = (id: string) => {
      const node = graph.get(id);
      if (!node || visited.has(id)) return;

      // Detect cycles
      if (node.processing) {
        throw new Error(`Circular dependency detected involving transaction ${id}`);
      }

      node.processing = true;

      // Visit dependencies first (depth-first)
      for (const depId of node.dependencies) {
        visit(depId);
      }

      node.processing = false;
      visited.add(id);
      sorted.push(id);
    };

    // Visit all nodes
    for (const id of graph.keys()) {
      visit(id);
    }

    return sorted;
  }

  /**
   * Sync transactions in dependency order
   */
  async syncWithDependencies(queue: OfflineSyncQueue): Promise<SyncResult[]> {
    const transactions = await queue.getAllWithDependencies();
    const pending = transactions.filter(t => t.status === 'pending');

    if (pending.length === 0) return [];

    // Build graph and get sorted order
    const graph = this.buildDependencyGraph(pending);
    const sortedIds = this.topologicalSort(graph);

    const results: SyncResult[] = [];
    const idMappings = new Map<string, string>();  // tempId → realId

    // Sync in sorted order
    for (const txnId of sortedIds) {
      const txn = pending.find(t => t.id === txnId);
      if (!txn) continue;

      // Resolve foreign keys before syncing
      if (txn.foreignKeys) {
        for (const fk of txn.foreignKeys) {
          const realId = idMappings.get(fk.tempId);
          if (realId) {
            txn.data[fk.field] = realId;  // Replace temp ID with real ID
          }
        }
      }

      // Sync transaction
      const result = await this.syncSingleTransaction(txn);
      results.push(result);

      // Store ID mapping for future transactions
      if (result.success && result.entityId && txn.entityTempId) {
        idMappings.set(txn.entityTempId, result.entityId);
        await queue.resolveForeignKeys(txn.entityTempId, result.entityId);
      }

      // Delay between syncs
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}
```

### Testing Strategy

**Backend Unit Tests (6 new test classes):**
1. `SyncService_CustomerCreate_Tests`
2. `SyncService_CustomerUpdate_Tests`
3. `SyncService_CustomerDelete_Tests`
4. `SyncService_SaleVoid_Tests`
5. `SyncService_SalePaymentUpdate_Tests`
6. `SyncService_DependencyResolution_Tests` (NEW - tests DAG sync)

**Test Cases Per Processor:**
- Valid data creates/updates/deletes entity correctly
- Client timestamp preserved
- Invalid data throws validation error
- Branch/user validation enforced
- Conflict detection works (UPDATE tests)
- Entity not found errors (UPDATE/DELETE tests)

**Frontend Integration Tests:**
- Create customer offline → Sync → Verify database
- Create customer offline → Update offline → Sync both → Verify order
- Create customer offline → Create sale with customer → Sync in order → Verify foreign key
- Delete offline-created customer → Verify CREATE cancelled
- Delete online-created customer → Sync → Verify soft delete
- Dependency cycle detection
- Feature flag enforcement

**Manual Testing (24 scenarios for Phase 1):**

| Feature | Online | Offline→Online | Dependency | Feature Flag |
|---------|--------|----------------|------------|--------------|
| Customer Create | ✓ | ✓ | N/A | ✓ |
| Customer Update | ✓ | ✓ | ✓ (after CREATE) | ✓ |
| Customer Delete | ✓ | ✓ | ✓ (cancel CREATE) | ✓ |
| Sale Create | ✓ | ✓ | ✓ (with customer) | ✓ |
| Sale Void | ✓ | ✓ | N/A | ✓ |
| Sale Payment Update | ✓ | ✓ | ✓ (after CREATE) | ✓ |

## Critical Files Summary

### New Infrastructure Files (7 files to create)

1. **frontend/lib/feature-flags.ts** - Feature flag configuration
2. **frontend/lib/id-mapper.ts** - Temporary ID generation and mapping
3. **frontend/lib/sync-orchestrator.ts** - DAG building and topological sort
4. **frontend/components/shared/OfflineBadge.tsx** - Offline indicator component
5. **frontend/components/shared/FeatureFlagGuard.tsx** - Feature flag wrapper
6. **Backend/Models/DTOs/Shared/Sync/ForeignKeyReference.cs** (NEW)
7. **Backend/Services/Branch/ICustomerService.cs** (if doesn't exist)

### Files to Modify

#### Frontend (5 files)
1. **frontend/lib/offline-sync.ts**
   - Add new fields to `QueuedTransaction` interface
   - Add new methods: `findByEntityTempId`, `cancel`, `getAllWithDependencies`, `resolveForeignKeys`
   - Increment DB_VERSION to 2
   - Add new IndexedDB indexes

2. **frontend/hooks/useOfflineSync.ts**
   - Replace `syncAll()` with orchestrator's `syncWithDependencies()`
   - Handle ID mappings after sync

3. **frontend/services/customer.service.ts**
   - Implement: `createCustomer()`, `updateCustomer()`, `deleteCustomer()` offline support

4. **frontend/services/sales.service.ts**
   - Implement: `createSale()`, `voidSale()`, `updatePayment()` offline support
   - Handle customer dependency in `createSale()`

5. **frontend/types/offline.ts** (NEW file)
   - Export all offline-related types and interfaces

#### Backend (6 files)
1. **Backend/Services/Shared/Sync/SyncService.cs**
   - Add ICustomerService dependency
   - Implement 6 new processor methods
   - Update switch statement with 6 new cases

2. **Backend/Services/Shared/Sync/ISyncService.cs**
   - Add 6 new method signatures

3. **Backend/Models/DTOs/Shared/Sync/SyncTransactionRequest.cs**
   - Add fields: `Dependencies`, `EntityId`, `EntityTempId`, `ForeignKeys`

4. **Backend/Endpoints/SyncEndpoints.cs**
   - Update `/sync/transaction` endpoint to return tempId mapping

5. **Backend/Program.cs**
   - Register ICustomerService in SyncService DI

6. **Backend/Models/Entities/Branch/Customer.cs**
   - Add: `DeletedAt`, `DeletedByUserId` fields (if not exist) for soft delete

### UI Components to Update (Phase 1 - 4 dialogs)

1. **frontend/components/pos/TransactionDialogV3.tsx** - Add offline badge for sales
2. **frontend/components/branch/customers/CustomerDialog.tsx** - Add offline badge for customers (if exists)
3. **frontend/app/[locale]/branch/customers/page.tsx** - Customer management page
4. **frontend/app/[locale]/pos/page.tsx** - POS page (might need updates)

## Implementation Checklist

### Phase 1A: Infrastructure Setup (Week 1, Days 1-2)

- [ ] Create `frontend/lib/feature-flags.ts`
- [ ] Create `frontend/lib/id-mapper.ts`
- [ ] Create `frontend/lib/sync-orchestrator.ts`
- [ ] Create `frontend/types/offline.ts`
- [ ] Update `frontend/lib/offline-sync.ts`:
  - [ ] Add new fields to `QueuedTransaction`
  - [ ] Increment DB_VERSION to 2
  - [ ] Add `findByEntityTempId()` method
  - [ ] Add `cancel()` method
  - [ ] Add `getAllWithDependencies()` method
  - [ ] Add `resolveForeignKeys()` method
  - [ ] Add new IndexedDB indexes
- [ ] Update `frontend/hooks/useOfflineSync.ts`:
  - [ ] Integrate `SyncOrchestrator`
  - [ ] Replace sync logic with DAG-based sync
- [ ] Create `frontend/components/shared/OfflineBadge.tsx`
- [ ] Create `frontend/components/shared/FeatureFlagGuard.tsx`
- [ ] Test: IndexedDB schema migration works
- [ ] Test: Temporary ID generation works
- [ ] Test: DAG building and topological sort works

### Phase 1B: Backend Customer Support (Week 1, Days 3-4)

- [ ] Update `Backend/Models/DTOs/Shared/Sync/SyncTransactionRequest.cs`
- [ ] Create `Backend/Models/DTOs/Shared/Sync/ForeignKeyReference.cs`
- [ ] Update `Backend/Services/Shared/Sync/ISyncService.cs`:
  - [ ] Add `ProcessOfflineCustomerCreateAsync`
  - [ ] Add `ProcessOfflineCustomerUpdateAsync`
  - [ ] Add `ProcessOfflineCustomerDeleteAsync`
- [ ] Update `Backend/Services/Shared/Sync/SyncService.cs`:
  - [ ] Add ICustomerService dependency
  - [ ] Implement `ProcessOfflineCustomerCreateTransactionAsync`
  - [ ] Implement `ProcessOfflineCustomerUpdateTransactionAsync`
  - [ ] Implement `ProcessOfflineCustomerDeleteTransactionAsync`
  - [ ] Implement `ProcessOfflineCustomerCreateAsync`
  - [ ] Implement `ProcessOfflineCustomerUpdateAsync`
  - [ ] Implement `ProcessOfflineCustomerDeleteAsync`
  - [ ] Update switch statement
- [ ] Update `Backend/Endpoints/SyncEndpoints.cs`:
  - [ ] Modify response to include tempId mapping
- [ ] Update `Backend/Program.cs`:
  - [ ] Register ICustomerService in SyncService DI
- [ ] Unit tests: CustomerCreate, CustomerUpdate, CustomerDelete
- [ ] Test: Build succeeds

### Phase 1C: Frontend Customer Service (Week 1, Day 5)

- [ ] Update `frontend/services/customer.service.ts`:
  - [ ] Implement `createCustomer()` offline support
  - [ ] Implement `updateCustomer()` offline support
  - [ ] Implement `deleteCustomer()` offline support
  - [ ] Add feature flag checks
  - [ ] Add dependency tracking for UPDATE
  - [ ] Add temp ID handling
- [ ] Update customer UI components:
  - [ ] Add `<OfflineBadge />` to customer dialogs
  - [ ] Update button text based on offline status
- [ ] Integration test: Customer offline flow
- [ ] Manual test: Create customer offline → Sync
- [ ] Manual test: Create → Update customer offline → Sync
- [ ] Manual test: Create customer offline → Delete → Verify CREATE cancelled

### Phase 1D: Backend Sales Support (Week 2, Days 1-2)

- [ ] Update `Backend/Services/Shared/Sync/ISyncService.cs`:
  - [ ] Add `ProcessOfflineSaleVoidAsync`
  - [ ] Add `ProcessOfflineSalePaymentUpdateAsync`
- [ ] Update `Backend/Services/Shared/Sync/SyncService.cs`:
  - [ ] Implement `ProcessOfflineSaleVoidTransactionAsync`
  - [ ] Implement `ProcessOfflineSalePaymentUpdateTransactionAsync`
  - [ ] Implement `ProcessOfflineSaleVoidAsync`
  - [ ] Implement `ProcessOfflineSalePaymentUpdateAsync`
  - [ ] Update switch statement (add void, payment_update)
- [ ] Unit tests: SaleVoid, SalePaymentUpdate
- [ ] Test: Build succeeds

### Phase 1E: Frontend Sales Service (Week 2, Days 3-4)

- [ ] Update `frontend/services/sales.service.ts`:
  - [ ] Update `createSale()` to check for customer dependency
  - [ ] Implement `voidSale()` offline support
  - [ ] Implement `updatePayment()` offline support
  - [ ] Add feature flag checks
  - [ ] Track foreign keys for customer reference
- [ ] Update POS UI components:
  - [ ] Add `<OfflineBadge />` to TransactionDialogV3
  - [ ] Update button text based on offline status
- [ ] Integration test: Sales offline flow
- [ ] Integration test: Customer+Sale dependency
- [ ] Manual test: Create sale offline → Sync
- [ ] Manual test: Create customer + sale offline → Sync in order

### Phase 1F: Testing & Documentation (Week 2, Day 5)

- [ ] Run all unit tests (12+ tests)
- [ ] Run all integration tests (8+ tests)
- [ ] Manual testing (24 scenarios)
- [ ] Test feature flags (enable/disable per operation)
- [ ] Test dependency cycle detection
- [ ] Test conflict detection (UPDATE conflicts)
- [ ] Load testing: 50 queued transactions with dependencies
- [ ] Documentation: Create implementation summary in `docs/`
- [ ] Documentation: Update CLAUDE.md with new offline features
- [ ] Build verification: `dotnet build` (backend)
- [ ] Build verification: `npm run build` (frontend)

## Estimated Effort

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1A | Infrastructure Setup | 16 hours |
| 1B | Backend Customer Support | 16 hours |
| 1C | Frontend Customer Service | 12 hours |
| 1D | Backend Sales Support | 12 hours |
| 1E | Frontend Sales Service | 16 hours |
| 1F | Testing & Documentation | 16 hours |
| **TOTAL** | **Phase 1 Complete** | **88 hours (~2.5 weeks)** |

**Breakdown by Role:**
- **Frontend Development**: 44 hours
- **Backend Development**: 28 hours
- **Testing**: 16 hours

## Success Criteria

1. ✅ All 6 transaction types work offline (customer_create, customer_update, customer_delete, sale_create, sale_void, sale_payment_update)
2. ✅ Temporary ID management works (temp IDs → real IDs)
3. ✅ Dependency tracking works (customer → sale sync order)
4. ✅ Foreign key resolution works (sale.customerId resolved to real ID)
5. ✅ Feature flags work (can enable/disable per operation)
6. ✅ UPDATE/DELETE operations work for both temp and real IDs
7. ✅ Conflict detection works (server-side UPDATE checks UpdatedAt)
8. ✅ Offline DELETE of offline CREATE cancels transaction
9. ✅ All unit tests pass (12+ tests)
10. ✅ All integration tests pass (8+ tests)
11. ✅ All manual tests pass (24 scenarios)
12. ✅ Build succeeds with zero errors
13. ✅ IndexedDB schema migration works (v1 → v2)
14. ✅ DAG topological sort works (no dependency cycles)
15. ✅ Documentation complete

## Known Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| IndexedDB migration fails for existing users | HIGH | Test migration extensively, provide rollback script |
| Circular dependencies in transaction DAG | MEDIUM | Add cycle detection, throw clear error |
| Temp ID conflicts (same ID generated twice) | LOW | Use timestamp + random string (collision unlikely) |
| Foreign key resolution fails for complex graphs | MEDIUM | Thorough testing with 3+ level dependencies |
| Feature flags accidentally left disabled | LOW | Default to enabled for Phase 1 features |
| Sync performance degrades with 100+ queued txns | MEDIUM | Add pagination, warn user at 50+ pending |

## Next Steps After Phase 1

If Phase 1 succeeds, future phases can follow the same pattern:
- **Phase 2**: Inventory (stock_adjust, expense_create)
- **Phase 3**: Order Management (purchase_create, table_transfer, delivery_create)
- **Phase 4**: Master Data (suppliers, categories, drivers, zones)

Each phase builds on the infrastructure from Phase 1.

---

**END OF PLAN**
