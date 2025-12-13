# Branch User Synchronization System Implementation Plan

**Date Created:** 2025-12-13  
**Status:** Approved - Ready for Implementation  
**Estimated Duration:** 18-22 hours (2-3 days)

---

## Problem Statement

Currently, branch users are stored only in the branch database. When a new branch is created, no default user exists in the branch database for login. The head office admin user exists in the head office database but not in branch databases. We need a "Branch Users" table in the head office database that mirrors branch users to enable:

1. Authentication against the head office database
2. Monitoring and centralized user management
3. Default admin user creation when a branch is created

---

## Key Questions & Clarifications

### 1. Table Naming ✅ RESOLVED
- **Decision:** Delete the existing `UserAssignment` table and create a new `BranchUser` table
- **Rationale:** Clearer naming - BranchUser directly represents users that belong to branches
- **Migration Required:** Remove UserAssignment entity and all references

### 2. Data Synchronization Direction ✅ RESOLVED
- **Decision:** Bi-directional sync - changes in either location must sync to the other
- **Primary Source:** Head office BranchUser table (for authentication)
- **Sync Triggers:** Create, Update, Delete operations in BOTH head office and branch
- **Head Office Edits:** YES, head office can modify branch user data and changes sync to branch DB

### 3. Username Uniqueness
- **Current Requirement:** Username must be unique per branch (not globally)
- **Implementation:** Add unique constraint on (BranchId, Username) combination
- **Validation:** Check username availability within the same branch only

### 4. Default User Creation
- **Username:** "admin"
- **Password:** "123"
- **When:** During branch creation/provisioning
- **Where:** Both head office BranchUser table AND branch database Users table

### 5. Authentication Flow ✅ RESOLVED
- **Decision:** Head office BranchUser table is the SOLE source for authentication
- **Branch Login:** Query ONLY head office BranchUser table
- **No Fallback:** Do not check branch database for authentication
- **Critical:** Any changes to branch database users MUST immediately sync to head office
- **Password Updates:** Update head office first, then sync to branch

---

## Current State Analysis

### Existing Entities
1. **HeadOffice.User** - Central head office users (WILL BE DEPRECATED/REMOVED)
2. **HeadOffice.UserAssignment** - Links head office users to branches (WILL BE DELETED)
3. **Branch.User** - Branch-specific users (exists in each branch database)

### New Architecture
1. **HeadOffice.BranchUser** - Branch users stored in head office (PRIMARY for auth)
2. **Branch.User** - Branch users in branch database (SYNCHRONIZED from head office)

### Current Branch Creation Flow
1. Create branch record in head office database
2. Provision branch database (create/migrate schema)
3. Seed sample data
4. Create default admin in head office (UserAssignment) - NOT in branch database

### Current Issues
1. No user exists in branch database after creation
2. Cannot login to branch with default credentials
3. No centralized view of branch users
4. Branch user changes not reflected in head office

---

## Proposed Solution

### New Entity: BranchUser (Replaces UserAssignment)

Create a new BranchUser table in the head office database that is the primary source for branch users:

**Fields:**
- `Id` (Guid, PK)
- `BranchId` (Guid, FK to Branch)
- `Username` (string, unique with BranchId)
- `PasswordHash` (string)
- `Email` (string)
- `FullNameEn` (string)
- `FullNameAr` (string, nullable)
- `Phone` (string, nullable)
- `PreferredLanguage` (string)
- `Role` (string: Manager, Cashier)
- `IsActive` (bool)
- `LastLoginAt` (DateTime, nullable)
- `LastActivityAt` (DateTime, nullable)
- `CreatedAt` (DateTime)
- `UpdatedAt` (DateTime)
- `SyncedAt` (DateTime) - Last sync timestamp

**Indexes:**
- Unique index on (BranchId, Username)
- Index on BranchId for lookups
- Index on IsActive for filtering

---

## Synchronization Strategy

### 1. Initial Sync (Branch Creation)
- Create default "admin" user in both:
  - Head office BranchUser table
  - Branch database Users table
- Both records have same ID (Guid) for tracking

### 2. Ongoing Sync (Create/Update/Delete)

**When:** Branch user operations via API (from head office OR branch dashboard)

**How:** Transaction-based dual write with head office priority

```
1. Start transaction
2. Write to head office BranchUser (PRIMARY)
3. Write to branch database Users
4. Commit both
5. If either fails, rollback
```

**Priority:** Head office BranchUser is authoritative source

### 3. Sync Service (Background)

**Purpose:** Detect and fix any sync discrepancies

**Frequency:** Configurable (e.g., daily)

**Process:**
- Compare head office BranchUser with branch DB users
- Identify missing/outdated records
- Sync from head office to branch (head office is source of truth for auth)
- Log any discrepancies for investigation

---

## Authentication Flow Update

### Branch Login:

1. Receive login request with branchCode + username + password
2. Query BranchUser in head office DB ONLY
3. Verify password against stored hash
4. Update LastLoginAt in head office BranchUser
5. Async update LastLoginAt in branch Users (non-blocking)
6. Return JWT token with branch context

### Benefits:
- Single source of truth for authentication
- Centralized user management
- Can instantly block users from head office
- Real-time activity monitoring
- No dependency on branch DB for login

---

## Implementation Steps

### Phase 1: Database Schema (2 hours)

1. Delete UserAssignment entity and all references
2. Create BranchUser entity in HeadOffice models
3. Add DbSet to HeadOfficeContext
4. Create and apply migration to:
   - Drop UserAssignments table
   - Create BranchUsers table
   - Add unique constraint on (BranchId, Username)
5. Update all code referencing UserAssignment

**Files:**
- `Backend/Models/Entities/HeadOffice/BranchUser.cs` - NEW
- `Backend/Data/HeadOfficeDbContext.cs` - MODIFY
- `Backend/Migrations/YYYYMMDDHHMMSS_DeleteUserAssignmentAndCreateBranchUser.cs` - NEW

### Phase 2: Default User Creation (3 hours)

1. Update `BranchService.CreateDefaultBranchAdminAsync`
2. Create user in branch database Users table:
   - Username: "admin"
   - Password: "123" (hashed)
   - Role: "Manager"
   - IsActive: true
3. Create record in head office BranchUser table
4. Use same Guid for both records

**Files:**
- `Backend/Services/HeadOffice/Branches/BranchService.cs` - MODIFY

### Phase 3: Branch User Service Updates (4 hours)

1. Update CreateBranchUser to dual-write:
   - Write to head office BranchUser table (PRIMARY)
   - Write to branch DB Users table (SECONDARY)
2. Update UpdateBranchUser to dual-write (head office first)
3. Update DeleteBranchUser to dual-write (soft delete in both)
4. Wrap in transaction for consistency
5. Add sync validation after each operation

**Files:**
- `Backend/Services/Branch/Users/BranchUserService.cs` - MODIFY
- `Backend/Services/Branch/Users/IBranchUserService.cs` - MODIFY

### Phase 4: Authentication Updates (3 hours)

1. Update AuthService.BranchLogin:
   - Query BranchUser table in head office ONLY
   - Verify credentials
   - Update LastLoginAt in head office immediately
   - Async update LastLoginAt in branch DB (non-blocking)
2. NO fallback to branch DB - head office is sole auth source
3. Add error handling for sync failures

**Files:**
- `Backend/Services/HeadOffice/Auth/AuthService.cs` - MODIFY

### Phase 5: Username Validation (2 hours)

1. Update checkUsernameAvailability service:
   - Check uniqueness within branch only
   - Query: `WHERE BranchId = @branchId AND Username = @username`
2. Add validation in DTOs

**Files:**
- `Backend/Services/Branch/Users/BranchUserService.cs` - MODIFY

### Phase 6: Sync Service (4 hours - Optional)

1. Create BranchUserSyncService
2. Add background job to check sync status
3. Implement reconciliation logic
4. Add logging and monitoring

**Files:**
- `Backend/Services/HeadOffice/BranchUsers/BranchUserSyncService.cs` - NEW

### Phase 7: Migration & Testing (4 hours)

1. Create migration script for existing data:
   - Delete UserAssignment records (no longer needed)
   - Copy existing branch DB users to BranchUser table
   - Verify data integrity
   - Ensure all users can authenticate

2. Test scenarios:
   - New branch creation
   - User CRUD operations
   - Login with synced users
   - Username uniqueness per branch
   - Cross-branch same username

---

## Files to Create/Modify

### Backend (C#)

**New Files:**
- `Backend/Models/Entities/HeadOffice/BranchUser.cs` (replaces UserAssignment)
- `Backend/Models/DTOs/HeadOffice/BranchUsers/BranchUserDto.cs`
- `Backend/Services/HeadOffice/BranchUsers/BranchUserSyncService.cs` (optional)
- `Backend/Migrations/YYYYMMDDHHMMSS_DeleteUserAssignmentAndCreateBranchUser.cs`

**Modified Files:**
- `Backend/Data/HeadOfficeDbContext.cs` - Remove UserAssignments, add BranchUsers DbSet
- `Backend/Services/HeadOffice/Branches/BranchService.cs` - Update CreateDefaultBranchAdminAsync
- `Backend/Services/Branch/Users/BranchUserService.cs` - Add dual-write logic
- `Backend/Services/HeadOffice/Auth/AuthService.cs` - Update branch login (head office only)
- `Backend/Services/Branch/Users/IBranchUserService.cs` - Update interface
- All files referencing UserAssignment - Update to use BranchUser

### Frontend (TypeScript/React)

**Modified Files:**
- `frontend/services/branch-user.service.ts` - No changes needed (API remains same)
- `frontend/components/head-office/BranchUsersTab.tsx` - Already displays users correctly
- `frontend/app/[locale]/branch/users/page.tsx` - Already handles user management

---

## Success Criteria

1. ✅ New branch creation includes default "admin" user with password "123"
2. ✅ Default user exists in both head office BranchUser and branch Users table
3. ✅ Can login to branch immediately after creation with admin/123
4. ✅ Creating user in branch dashboard adds to both databases
5. ✅ Username uniqueness enforced per branch (same username in different branches allowed)
6. ✅ User updates reflect in both databases
7. ✅ User deletion removes from both databases (soft delete)
8. ✅ Head office can view all branch users via BranchUsersTab
9. ✅ Authentication queries ONLY head office database (no fallback)
10. ✅ No data inconsistencies between branch and head office
11. ✅ UserAssignment table removed and all references updated

---

## Risks & Mitigation

### Risk 1: Sync Failures
**Impact:** Data inconsistency between databases

**Mitigation:**
- Use transactions for dual writes
- Implement sync validation service
- Add logging and alerts
- NO fallback - head office is mandatory for authentication

### Risk 2: Performance
**Impact:** Dual writes might slow down operations

**Mitigation:**
- Use async writes where possible
- Optimize database indexes
- Monitor query performance

### Risk 3: Data Migration
**Impact:** Existing branches need user data copied

**Mitigation:**
- Create migration script
- Test thoroughly in staging
- Provide rollback plan
- Document manual recovery steps

### Risk 4: Password Hash Compatibility
**Impact:** Hash algorithm mismatch between systems

**Mitigation:**
- Use same PasswordHasher utility for both
- Verify hash format consistency
- Add unit tests for password verification

---

## Timeline Estimate

- **Phase 1 (Schema):** 2 hours
- **Phase 2 (Default User):** 3 hours
- **Phase 3 (CRUD Sync):** 4 hours
- **Phase 4 (Auth Update):** 3 hours
- **Phase 5 (Validation):** 2 hours
- **Phase 6 (Sync Service):** 4 hours (optional)
- **Phase 7 (Testing):** 4 hours

**Total:** 18-22 hours (2-3 days)

---

## Next Steps

1. ✅ Review and approve this plan
2. ✅ Clarify any questions or concerns
3. ⏳ Begin implementation starting with Phase 1
4. Test each phase incrementally
5. Deploy to staging for integration testing
6. Create migration plan for production
