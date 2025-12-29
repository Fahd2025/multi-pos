# Offline Support - Files Reference

Quick reference for all files created/modified in Phase 1 implementation.

---

## New Infrastructure Files (Created)

### 1. `frontend/lib/feature-flags.ts` ✅
**Purpose:** Feature flag configuration for gradual rollout
**Size:** 60 lines
**Key Exports:**
- `OFFLINE_FEATURES` - Configuration object
- `isOfflineFeatureEnabled(feature)` - Check if feature is enabled
- `getEnabledOfflineFeatures()` - Get all enabled features

**Usage:**
```typescript
import { OFFLINE_FEATURES, isOfflineFeatureEnabled } from '@/lib/feature-flags';

if (!isOnline && OFFLINE_FEATURES.CUSTOMER_CREATE) {
  // Queue for offline sync
}
```

---

### 2. `frontend/lib/id-mapper.ts` ✅
**Purpose:** Temporary ID generation and mapping
**Size:** 240 lines
**Key Exports:**
- `generateTempId(entityType)` - Generate temp ID
- `isTempId(id)` - Check if ID is temporary
- `IdMappingManager` - Manages temp → real ID mappings
- `idMappingManager` - Singleton instance

**Usage:**
```typescript
import { generateTempId, isTempId, idMappingManager } from '@/lib/id-mapper';

const tempId = generateTempId('customer');
// => "temp-customer-1735123456789-x7k2m3p9"

if (isTempId(customerId)) {
  const realId = await idMappingManager.resolveTempId(customerId);
}
```

---

### 3. `frontend/types/offline.ts` ✅
**Purpose:** TypeScript type definitions for offline operations
**Size:** 215 lines
**Key Types:**
- `TransactionType` - 21 transaction types
- `QueuedTransaction` - Transaction in IndexedDB queue
- `TransactionNode` - DAG node structure
- `SyncResult` - Result of sync operation
- `IdMapping` - Temp → Real ID mapping
- `ForeignKeyRef` - Foreign key reference

**Usage:**
```typescript
import type { QueuedTransaction, SyncResult, TransactionType } from '@/types/offline';

const transaction: QueuedTransaction = {
  id: 'txn-123',
  type: 'customer_create',
  // ...
};
```

---

### 4. `frontend/lib/sync-orchestrator.ts` ✅
**Purpose:** Dependency-aware transaction synchronization
**Size:** 280 lines
**Key Exports:**
- `SyncOrchestrator` - Class implementing DAG sync
- `syncOrchestrator` - Singleton instance

**Methods:**
- `buildDependencyGraph(transactions)` - Build DAG
- `topologicalSort(graph)` - Sort transactions by dependencies
- `syncWithDependencies(transactions, onProgress?)` - Sync in order
- `validateGraph(graph)` - Check for circular dependencies
- `getStats(results)` - Get sync statistics

**Usage:**
```typescript
import { syncOrchestrator } from '@/lib/sync-orchestrator';

const results = await syncOrchestrator.syncWithDependencies(
  pendingTransactions,
  (current, total) => {
    console.log(`Syncing ${current}/${total}`);
  }
);

const stats = syncOrchestrator.getStats(results);
// => { total: 10, successful: 9, failed: 1, successRate: 90 }
```

---

### 5. `frontend/components/shared/OfflineBadge.tsx` ⏳
**Purpose:** Offline indicator badge component
**Status:** To be created

**Expected Usage:**
```tsx
import { OfflineBadge } from '@/components/shared/OfflineBadge';

<Dialog>
  <DialogHeader>
    <DialogTitle>Save Order</DialogTitle>
    <OfflineBadge showPendingCount={true} />
  </DialogHeader>
  {/* ... */}
</Dialog>
```

---

### 6. `frontend/components/shared/FeatureFlagGuard.tsx` ⏳
**Purpose:** Feature flag wrapper component
**Status:** To be created

**Expected Usage:**
```tsx
import { FeatureFlagGuard } from '@/components/shared/FeatureFlagGuard';

<FeatureFlagGuard feature="CUSTOMER_DELETE">
  <Button onClick={handleDelete}>Delete Customer</Button>
</FeatureFlagGuard>
```

---

### 7. `Backend/Models/DTOs/Shared/Sync/ForeignKeyReference.cs` ⏳
**Purpose:** Foreign key reference DTO
**Status:** To be created

**Expected Structure:**
```csharp
public record ForeignKeyReference(
    string Field,      // e.g., "customerId"
    string TempId      // e.g., "temp-customer-123"
);
```

---

## Modified Files

### Frontend

#### 1. `frontend/lib/offline-sync.ts` ⏳
**Modifications:**
- Add new fields to `QueuedTransaction` interface
- Increment `DB_VERSION` to 2
- Add methods: `findByEntityTempId()`, `cancel()`, `getAllWithDependencies()`, `resolveForeignKeys()`
- Add IndexedDB indexes: `entityTempId`, `entityId`

---

#### 2. `frontend/hooks/useOfflineSync.ts` ⏳
**Modifications:**
- Import `SyncOrchestrator`
- Replace `syncAll()` implementation with orchestrator's `syncWithDependencies()`
- Handle ID mappings after sync
- Update state management

---

#### 3. `frontend/services/customer.service.ts` ⏳
**Modifications:**
- `createCustomer()` - Add offline support with temp IDs
- `updateCustomer()` - Add offline support with dependency tracking
- `deleteCustomer()` - Add offline support with CREATE cancellation
- Feature flag checks

---

#### 4. `frontend/services/sales.service.ts` ⏳
**Modifications:**
- `createSale()` - Add customer dependency tracking
- `voidSale()` - Add offline support
- `updatePayment()` - Add offline support
- Feature flag checks

---

#### 5. `frontend/components/pos/TransactionDialogV3.tsx` ⏳
**Modifications:**
- Add `<OfflineBadge />` to dialog header
- Update button text: "Save Order" → "Save Offline" when offline

---

### Backend

#### 6. `Backend/Models/DTOs/Shared/Sync/SyncTransactionRequest.cs` ⏳
**Modifications:**
- Add `Dependencies` (string[])
- Add `EntityId` (string?)
- Add `EntityTempId` (string?)
- Add `ForeignKeys` (ForeignKeyReference[]?)

---

#### 7. `Backend/Services/Shared/Sync/ISyncService.cs` ⏳
**Modifications:**
- Add 6 new method signatures:
  - `ProcessOfflineCustomerCreateAsync()`
  - `ProcessOfflineCustomerUpdateAsync()`
  - `ProcessOfflineCustomerDeleteAsync()`
  - `ProcessOfflineSaleVoidAsync()`
  - `ProcessOfflineSalePaymentUpdateAsync()`

---

#### 8. `Backend/Services/Shared/Sync/SyncService.cs` ⏳
**Modifications:**
- Add `ICustomerService` dependency
- Implement 6 transaction processors (customer create/update/delete, sale void/payment)
- Update switch statement with 6 new cases

---

#### 9. `Backend/Endpoints/SyncEndpoints.cs` ⏳
**Modifications:**
- Update `/api/v1/sync/transaction` response
- Return `{ entityId, transactionId, tempId }` in response data

---

#### 10. `Backend/Program.cs` ⏳
**Modifications:**
- Register `ICustomerService` in `SyncService` DI container

---

#### 11. `Backend/Models/Entities/Branch/Customer.cs` ⏳
**Modifications (if needed):**
- Add `DeletedAt` (DateTime?)
- Add `DeletedByUserId` (Guid?) for soft delete support

---

## Documentation Files

### 1. `docs/offline/implementation-plan.md` ✅
Complete implementation plan (1,200+ lines) copied from planning session.

### 2. `docs/offline/progress-tracker.md` ✅
Progress tracking document with task breakdowns and statistics.

### 3. `docs/offline/files-reference.md` ✅
This file - quick reference for all files.

---

## File Count Summary

- **New Files Created:** 4 ✅ / 7 total
- **Files to Modify:** 0 ✅ / 11 total
- **Documentation Files:** 3 ✅
- **Total Files:** 21 files (7 new + 11 modified + 3 docs)

---

## Next Files to Create/Modify

**Phase 1A Remaining:**
1. Modify `frontend/lib/offline-sync.ts`
2. Modify `frontend/hooks/useOfflineSync.ts`
3. Create `frontend/components/shared/OfflineBadge.tsx`
4. Create `frontend/components/shared/FeatureFlagGuard.tsx`

**Phase 1B (Backend):**
5. Modify `Backend/Models/DTOs/Shared/Sync/SyncTransactionRequest.cs`
6. Create `Backend/Models/DTOs/Shared/Sync/ForeignKeyReference.cs`
7. Modify `Backend/Services/Shared/Sync/ISyncService.cs`
8. Modify `Backend/Services/Shared/Sync/SyncService.cs`
9. Modify `Backend/Endpoints/SyncEndpoints.cs`
10. Modify `Backend/Program.cs`

---

**Last Updated:** 2025-12-27
