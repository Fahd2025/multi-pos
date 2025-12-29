# Offline Support Implementation - Progress Tracker

**Feature:** Phase 1 - Sales & Customers Offline Support
**Started:** 2025-12-27
**Status:** 🚧 In Progress (Phase 1A - Infrastructure Setup)
**Estimated Total:** 88 hours (~2.5 weeks)
**Completed:** ~6-8 hours (8%)

---

## Overview

Implementing full CRUD offline support for Sales and Customers with:
- ✅ CREATE/UPDATE/DELETE operations
- ✅ Temporary ID management and mapping
- ✅ Transaction dependency tracking (DAG)
- ✅ Ordered sync with foreign key resolution
- ✅ Feature flags per transaction type
- ✅ Conflict detection

---

## Phase 1A: Infrastructure Setup (Days 1-2)

**Status:** 🚧 In Progress (4/13 completed)
**Estimated:** 16 hours
**Actual:** ~6-8 hours so far

### ✅ Completed

1. **`frontend/lib/feature-flags.ts`** ✅ (60 lines)
   - Feature flag configuration
   - Enabled: SALES_CREATE, SALES_VOID, CUSTOMER_CREATE, CUSTOMER_UPDATE
   - Helper functions: `isOfflineFeatureEnabled()`, `getEnabledOfflineFeatures()`

2. **`frontend/lib/id-mapper.ts`** ✅ (240 lines)
   - `generateTempId()` - Format: `temp-{entityType}-{timestamp}-{random}`
   - `isTempId()` - Check if ID is temporary
   - `IdMappingManager` - IndexedDB storage for temp → real ID mappings
   - Singleton: `idMappingManager`

3. **`frontend/types/offline.ts`** ✅ (215 lines)
   - `TransactionType` - 21 transaction types
   - `QueuedTransaction` - Enhanced with dependencies, entityTempId, foreignKeys
   - `TransactionNode` - DAG node structure
   - `SyncResult`, `BatchSyncResult`, `SyncStatusInfo`
   - All type definitions for offline operations

4. **`frontend/lib/sync-orchestrator.ts`** ✅ (280 lines)
   - `buildDependencyGraph()` - Creates DAG from transactions
   - `topologicalSort()` - DFS with cycle detection
   - `syncWithDependencies()` - Orders and syncs transactions
   - Foreign key resolution during sync
   - Progress tracking and statistics
   - Singleton: `syncOrchestrator`

### ⏳ Remaining Tasks

5. **`frontend/lib/offline-sync.ts`** (Modify existing)
   - [ ] Add new fields to `QueuedTransaction` interface
   - [ ] Increment DB_VERSION to 2
   - [ ] Add `findByEntityTempId()` method
   - [ ] Add `cancel()` method
   - [ ] Add `getAllWithDependencies()` method
   - [ ] Add `resolveForeignKeys()` method
   - [ ] Add new IndexedDB indexes: `entityTempId`, `entityId`
   - [ ] Update schema migration logic

6. **`frontend/hooks/useOfflineSync.ts`** (Modify existing)
   - [ ] Import and integrate `SyncOrchestrator`
   - [ ] Replace `syncAll()` with orchestrator's `syncWithDependencies()`
   - [ ] Handle ID mappings after sync
   - [ ] Update state management for dependency tracking

7. **`frontend/components/shared/OfflineBadge.tsx`** (New file)
   - [ ] Offline indicator badge component
   - [ ] Shows "Offline" badge when offline
   - [ ] Displays pending transaction count
   - [ ] Amber color scheme

8. **`frontend/components/shared/FeatureFlagGuard.tsx`** (New file)
   - [ ] Feature flag wrapper component
   - [ ] Conditionally renders children based on feature flag
   - [ ] Shows disabled message when feature is off

9. **Testing**
   - [ ] Test IndexedDB schema migration (v1 → v2)
   - [ ] Test temporary ID generation (uniqueness)
   - [ ] Test DAG building with complex dependencies
   - [ ] Test topological sort with cycle detection
   - [ ] Test foreign key resolution

---

## Phase 1B: Backend Customer Support (Days 3-4)

**Status:** ⏳ Not Started
**Estimated:** 16 hours

### Backend DTOs

1. **`Backend/Models/DTOs/Shared/Sync/SyncTransactionRequest.cs`** (Modify)
   - [ ] Add `Dependencies` field (string[])
   - [ ] Add `EntityId` field (string?)
   - [ ] Add `EntityTempId` field (string?)
   - [ ] Add `ForeignKeys` field (ForeignKeyReference[]?)

2. **`Backend/Models/DTOs/Shared/Sync/ForeignKeyReference.cs`** (New)
   - [ ] Create record with `Field` and `TempId` properties

### Backend Services

3. **`Backend/Services/Shared/Sync/ISyncService.cs`** (Modify)
   - [ ] Add `ProcessOfflineCustomerCreateAsync()` signature
   - [ ] Add `ProcessOfflineCustomerUpdateAsync()` signature
   - [ ] Add `ProcessOfflineCustomerDeleteAsync()` signature

4. **`Backend/Services/Shared/Sync/SyncService.cs`** (Modify)
   - [ ] Add `ICustomerService` dependency injection
   - [ ] Implement `ProcessOfflineCustomerCreateTransactionAsync()`
   - [ ] Implement `ProcessOfflineCustomerUpdateTransactionAsync()`
   - [ ] Implement `ProcessOfflineCustomerDeleteTransactionAsync()`
   - [ ] Implement `ProcessOfflineCustomerCreateAsync()`
   - [ ] Implement `ProcessOfflineCustomerUpdateAsync()`
   - [ ] Implement `ProcessOfflineCustomerDeleteAsync()`
   - [ ] Update switch statement with 3 new cases

### Backend Endpoints

5. **`Backend/Endpoints/SyncEndpoints.cs`** (Modify)
   - [ ] Update `/api/v1/sync/transaction` response
   - [ ] Return `tempId` mapping in response data

6. **`Backend/Program.cs`** (Modify)
   - [ ] Register `ICustomerService` in SyncService DI constructor

### Testing

7. **Unit Tests**
   - [ ] `SyncService_CustomerCreate_Tests` (valid data, invalid data, timestamp preservation)
   - [ ] `SyncService_CustomerUpdate_Tests` (conflict detection, entity not found)
   - [ ] `SyncService_CustomerDelete_Tests` (soft delete, entity not found)

8. **Build Verification**
   - [ ] Run `dotnet build` - verify zero errors

---

## Phase 1C: Frontend Customer Service (Day 5)

**Status:** ⏳ Not Started
**Estimated:** 12 hours

### Service Modifications

1. **`frontend/services/customer.service.ts`** (Modify)
   - [ ] Implement `createCustomer()` offline support
   - [ ] Implement `updateCustomer()` offline support
   - [ ] Implement `deleteCustomer()` offline support
   - [ ] Add feature flag checks
   - [ ] Add dependency tracking for UPDATE operations
   - [ ] Add temp ID handling
   - [ ] Return optimistic responses

### UI Updates

2. **Customer UI Components**
   - [ ] Add `<OfflineBadge />` to customer dialogs
   - [ ] Update button text based on offline status
   - [ ] Show "Save Offline" when offline

### Testing

3. **Integration Tests**
   - [ ] Create customer offline → Sync → Verify in database
   - [ ] Create → Update customer offline → Sync both → Verify order
   - [ ] Create customer offline → Delete → Verify CREATE cancelled

4. **Manual Tests**
   - [ ] Create customer while offline
   - [ ] Update customer while offline
   - [ ] Delete offline-created customer

---

## Phase 1D: Backend Sales Support (Week 2, Days 1-2)

**Status:** ⏳ Not Started
**Estimated:** 12 hours

### Backend Services

1. **`Backend/Services/Shared/Sync/ISyncService.cs`** (Modify)
   - [ ] Add `ProcessOfflineSaleVoidAsync()` signature
   - [ ] Add `ProcessOfflineSalePaymentUpdateAsync()` signature

2. **`Backend/Services/Shared/Sync/SyncService.cs`** (Modify)
   - [ ] Implement `ProcessOfflineSaleVoidTransactionAsync()`
   - [ ] Implement `ProcessOfflineSalePaymentUpdateTransactionAsync()`
   - [ ] Implement `ProcessOfflineSaleVoidAsync()`
   - [ ] Implement `ProcessOfflineSalePaymentUpdateAsync()`
   - [ ] Update switch statement with 2 new cases

### Testing

3. **Unit Tests**
   - [ ] `SyncService_SaleVoid_Tests`
   - [ ] `SyncService_SalePaymentUpdate_Tests`

4. **Build Verification**
   - [ ] Run `dotnet build` - verify zero errors

---

## Phase 1E: Frontend Sales Service (Week 2, Days 3-4)

**Status:** ⏳ Not Started
**Estimated:** 16 hours

### Service Modifications

1. **`frontend/services/sales.service.ts`** (Modify)
   - [ ] Update `createSale()` to check for customer dependency
   - [ ] Implement `voidSale()` offline support
   - [ ] Implement `updatePayment()` offline support
   - [ ] Add feature flag checks
   - [ ] Track foreign keys for customer reference

### UI Updates

2. **POS UI Components**
   - [ ] Add `<OfflineBadge />` to TransactionDialogV3
   - [ ] Update button text based on offline status

### Testing

3. **Integration Tests**
   - [ ] Create sale offline → Sync
   - [ ] Create customer + sale offline → Sync in dependency order
   - [ ] Verify foreign key resolution (customerId)

4. **Manual Tests**
   - [ ] Void sale offline
   - [ ] Update payment offline

---

## Phase 1F: Testing & Documentation (Week 2, Day 5)

**Status:** ⏳ Not Started
**Estimated:** 16 hours

### Comprehensive Testing

1. **Unit Tests** (12+ tests)
   - [ ] All backend processors pass
   - [ ] Coverage > 80%

2. **Integration Tests** (8+ tests)
   - [ ] End-to-end offline flows work
   - [ ] Dependency resolution works
   - [ ] Foreign key resolution works

3. **Manual Testing** (24 scenarios)
   - [ ] All 6 transaction types tested
   - [ ] Feature flags tested (enable/disable)
   - [ ] Dependency cycle detection tested
   - [ ] Conflict detection tested

4. **Load Testing**
   - [ ] 50 queued transactions with dependencies
   - [ ] Verify performance acceptable

### Documentation

5. **Implementation Summary**
   - [ ] Create `docs/offline/2025-12-27-phase1-implementation.md`
   - [ ] Document all changes made
   - [ ] Include code examples
   - [ ] Document testing results

6. **Update CLAUDE.md**
   - [ ] Add Phase 1 offline features to "Current Implementation Status"
   - [ ] Update "Key Features Implemented" section

### Build Verification

7. **Final Build**
   - [ ] `dotnet build` - zero errors ✅
   - [ ] `npm run build` - zero errors ✅

---

## Summary Statistics

### Files Created (7 files)
1. ✅ `frontend/lib/feature-flags.ts`
2. ✅ `frontend/lib/id-mapper.ts`
3. ✅ `frontend/lib/sync-orchestrator.ts`
4. ✅ `frontend/types/offline.ts`
5. ⏳ `frontend/components/shared/OfflineBadge.tsx`
6. ⏳ `frontend/components/shared/FeatureFlagGuard.tsx`
7. ⏳ `Backend/Models/DTOs/Shared/Sync/ForeignKeyReference.cs`

### Files Modified (11 files)
1. ⏳ `frontend/lib/offline-sync.ts`
2. ⏳ `frontend/hooks/useOfflineSync.ts`
3. ⏳ `frontend/services/customer.service.ts`
4. ⏳ `frontend/services/sales.service.ts`
5. ⏳ `Backend/Models/DTOs/Shared/Sync/SyncTransactionRequest.cs`
6. ⏳ `Backend/Services/Shared/Sync/ISyncService.cs`
7. ⏳ `Backend/Services/Shared/Sync/SyncService.cs`
8. ⏳ `Backend/Endpoints/SyncEndpoints.cs`
9. ⏳ `Backend/Program.cs`
10. ⏳ `frontend/components/pos/TransactionDialogV3.tsx`
11. ⏳ `Backend/Models/Entities/Branch/Customer.cs` (if needed)

### Code Statistics
- **Lines Written:** ~795 lines
- **Lines Remaining:** ~2,500+ lines
- **Total Estimated:** ~3,300+ lines

---

## Success Criteria Tracker

### Critical Success Criteria (Must Pass)
- [ ] All 6 transaction types work offline
- [ ] Temporary ID management works (temp → real)
- [ ] Dependency tracking works (customer → sale)
- [ ] Foreign key resolution works
- [ ] Feature flags work
- [ ] UPDATE/DELETE work for temp and real IDs
- [ ] Conflict detection works
- [ ] Offline DELETE of offline CREATE cancels transaction

### Testing Criteria
- [ ] All unit tests pass (12+)
- [ ] All integration tests pass (8+)
- [ ] All manual tests pass (24)
- [ ] Build succeeds (zero errors)
- [ ] IndexedDB migration works (v1 → v2)
- [ ] DAG topological sort works
- [ ] Documentation complete

---

## Next Session Tasks

**Current Focus:** Phase 1A - Infrastructure Setup (4 tasks remaining)

1. Update `frontend/lib/offline-sync.ts` (add methods, indexes)
2. Update `frontend/hooks/useOfflineSync.ts` (integrate orchestrator)
3. Create `frontend/components/shared/OfflineBadge.tsx`
4. Create `frontend/components/shared/FeatureFlagGuard.tsx`

**After Phase 1A:** Move to Phase 1B (Backend Customer Support)

---

**Last Updated:** 2025-12-27
**Next Review:** After Phase 1A completion
