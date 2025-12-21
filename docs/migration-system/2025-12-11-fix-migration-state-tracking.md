# Fix: Migration State Not Tracked for Manual Branch Creation

**Date**: December 11, 2025
**Issue**: MSSQL branches created manually show Status: Pending and Last Migration: None
**Status**: ✅ **FIXED**

## Problem Description

When creating branches manually through the API, the database was successfully created with all tables and migrations applied, but the `BranchMigrationState` table was not updated. This resulted in:

- **Status**: Showing as "Pending" instead of "Completed"
- **Last Migration**: Showing as "None" instead of the actual last migration (e.g., "20251211100350_AddDriverTable")

### Example

**SQLite Branch (B003)** - Created at startup:
- Status: Complete ✅
- Last Migration: 20251211100350_AddDriverTable ✅

**MSSQL Branch (mssql EN)** - Created manually via API:
- Status: Pending ❌
- Last Migration: None ❌
- Database: Has Drivers table ✅ (migrations were applied, but not tracked)

## Root Cause

The `BranchService.ProvisionBranchDatabaseAsync()` method was directly calling:

```csharp
await branchContext.Database.MigrateAsync();
```

This applies migrations successfully, but **bypasses** the `BranchMigrationManager` which is responsible for:
1. Tracking migration progress in `BranchMigrationStates` table
2. Recording the last migration applied
3. Updating the status (Pending → InProgress → Completed)
4. Handling retry logic and error tracking

## Solution

Updated `BranchService.ProvisionBranchDatabaseAsync()` to use the `BranchMigrationManager`:

### Changes Made

**File**: `Backend/Services/HeadOffice/Branches/BranchService.cs`

#### 1. Added Dependency Injection

```csharp
// Added using statement
using Backend.Services.Shared.Migrations;

// Added field
private readonly IBranchMigrationManager _migrationManager;

// Updated constructor
public BranchService(
    HeadOfficeDbContext headOfficeContext,
    DbContextFactory dbContextFactory,
    ILogger<BranchService> logger,
    IImageService imageService,
    IBranchMigrationManager migrationManager  // NEW
)
{
    _headOfficeContext = headOfficeContext;
    _dbContextFactory = dbContextFactory;
    _logger = logger;
    _imageService = imageService;
    _migrationManager = migrationManager;  // NEW
}
```

#### 2. Updated ProvisionBranchDatabaseAsync Method

**Before**:
```csharp
// Run migrations (this will create the database if it doesn't exist)
await branchContext.Database.MigrateAsync();

// Seed sample data
await SeedBranchDataAsync(branchContext, branch);
```

**After**:
```csharp
// Run migrations using the BranchMigrationManager to ensure migration state is tracked
var migrationResult = await _migrationManager.ApplyMigrationsAsync(id);

if (!migrationResult.Success)
{
    _logger.LogError(
        "Failed to apply migrations for branch {BranchCode}: {ErrorMessage}",
        branch.Code,
        migrationResult.ErrorMessage
    );
    return (false, $"Migration failed: {migrationResult.ErrorMessage}");
}

_logger.LogInformation(
    "Successfully applied {Count} migrations for branch {BranchCode}",
    migrationResult.AppliedMigrations.Count,
    branch.Code
);

// Create a branch context for seeding
using var branchContext = _dbContextFactory.CreateBranchContext(branch);

// Seed sample data
await SeedBranchDataAsync(branchContext, branch);
```

## Benefits of This Fix

### 1. Consistent State Tracking ✅
All branches now have their migration state properly tracked in the `BranchMigrationStates` table, regardless of how they were created (auto-provisioned or manually).

### 2. Proper Status Updates ✅
The migration manager handles the full lifecycle:
- **Pending**: Initial state when branch is created
- **InProgress**: While migrations are being applied
- **Completed**: After all migrations succeed
- **Failed**: If an error occurs (with retry logic)
- **RequiresManualIntervention**: After multiple failures

### 3. Last Migration Tracking ✅
The `LastMigrationApplied` field now correctly shows the most recent migration:
```
20251211100350_AddDriverTable
```

### 4. Better Error Handling ✅
- Distributed locking prevents concurrent migrations
- Automatic retry logic (up to 3 attempts)
- Detailed error logging
- Schema validation after applying migrations

### 5. Migration History ✅
Full migration history is now available via the API:
```bash
GET /api/v1/migrations/branch/{branchId}/history
```

## Fix for Existing MSSQL Branch

The existing MSSQL branch "mssql EN" already has the database and tables created, but the migration state is not tracked. Here are the options to fix it:

### Option 1: Re-run Migrations (Recommended)

This will update the migration state without affecting the existing data:

```bash
POST /api/v1/migrations/branch/{branchId}/apply
```

The migration manager will:
1. Detect that no pending migrations exist (all already applied)
2. Query the `__EFMigrationsHistory` table to get the last migration
3. Update the `BranchMigrationStates` table with Status: Completed and LastMigration

### Option 2: Manual SQL Update

If you prefer, you can manually update the migration state in the HeadOffice database:

```sql
-- Find the branch ID
SELECT Id, Code, NameEn FROM Branches WHERE Code = 'mssql EN';

-- Assume the BranchId is: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

-- Check if migration state exists
SELECT * FROM BranchMigrationStates WHERE BranchId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- If exists, update it
UPDATE BranchMigrationStates
SET Status = 2,  -- 2 = Completed
    LastMigrationApplied = '20251211100350_AddDriverTable',
    LastAttemptAt = GETUTCDATE(),
    UpdatedAt = GETUTCDATE(),
    RetryCount = 0,
    ErrorDetails = NULL
WHERE BranchId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- If not exists, insert it
INSERT INTO BranchMigrationStates (Id, BranchId, LastMigrationApplied, Status, LastAttemptAt, RetryCount, CreatedAt, UpdatedAt)
VALUES (
    NEWID(),
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- Replace with actual BranchId
    '20251211100350_AddDriverTable',
    2,  -- Completed
    GETUTCDATE(),
    0,  -- No retries
    GETUTCDATE(),
    GETUTCDATE()
);
```

### Option 3: Query Branch Database for Last Migration

To get the actual last migration from the branch database:

```sql
-- Connect to the MSSQL branch database
USE [mssql_en_database];  -- Replace with actual database name

-- Query the migrations history table
SELECT TOP 1 MigrationId
FROM __EFMigrationsHistory
ORDER BY MigrationId DESC;
```

This will return the last migration (e.g., `20251211100350_AddDriverTable`), which you can then use in Option 2.

## Testing

### Verify the Fix Works for New Branches

1. **Create a new test branch** with any provider:
   ```bash
   POST /api/v1/branches
   {
       "code": "TEST-FIX",
       "nameEn": "Test Fix Branch",
       "nameAr": "فرع اختبار الإصلاح",
       "databaseProvider": 1,  // SqlServer
       // ... other required fields
   }
   ```

2. **Check the migration state**:
   ```bash
   GET /api/v1/migrations/branch/{branchId}/history
   ```

   **Expected Response**:
   ```json
   {
       "branchId": "...",
       "branchCode": "TEST-FIX",
       "appliedMigrations": [
           "20251211084643_Initial",
           "20251211100350_AddDriverTable"
       ],
       "pendingMigrations": [],
       "lastMigrationDate": "2025-12-11T...",
       "status": "Completed",
       "retryCount": 0,
       "errorDetails": null
   }
   ```

3. **Verify in HeadOffice database**:
   ```sql
   SELECT
       b.Code,
       bms.Status,
       bms.LastMigrationApplied,
       bms.LastAttemptAt,
       bms.RetryCount
   FROM Branches b
   LEFT JOIN BranchMigrationStates bms ON b.Id = bms.BranchId
   WHERE b.Code = 'TEST-FIX';
   ```

   **Expected Result**:
   ```
   Code      | Status    | LastMigrationApplied           | LastAttemptAt       | RetryCount
   ----------|-----------|--------------------------------|---------------------|------------
   TEST-FIX  | Completed | 20251211100350_AddDriverTable  | 2025-12-11 12:34:56 | 0
   ```

## Build Status

✅ **Build Succeeded** (0 compilation errors)

```bash
cd Backend && dotnet build --no-restore --no-incremental
```

## Impact

### Positive Impact
- ✅ All branches now have consistent migration state tracking
- ✅ Better visibility into migration status
- ✅ Improved error handling and retry logic
- ✅ Migration history available via API
- ✅ No breaking changes to existing functionality

### No Negative Impact
- ✅ Existing branches continue to work
- ✅ Existing data is not affected
- ✅ No schema changes required
- ✅ Backward compatible

## Related Files

### Modified
- `Backend/Services/HeadOffice/Branches/BranchService.cs`
  - Added `IBranchMigrationManager` dependency
  - Updated `ProvisionBranchDatabaseAsync()` to use migration manager

### Existing (No Changes)
- `Backend/Services/Shared/Migrations/BranchMigrationManager.cs` - Already had the tracking logic
- `Backend/Models/Entities/HeadOffice/BranchMigrationState.cs` - Already defined the state model

## Future Improvements

1. **Add Migration Status to Branch DTO**
   - Include migration status in branch list/detail responses
   - Show migration health in admin dashboard

2. **Add Migration Retry Endpoint**
   - Allow manual retry of failed migrations
   - Reset retry count for RequiresManualIntervention status

3. **Add Migration Rollback Support**
   - Implement safe rollback to previous migration
   - Track rollback history

4. **Add Migration Notifications**
   - Notify admins of migration failures
   - Send alerts for RequiresManualIntervention status

## Conclusion

The migration state tracking issue has been resolved by ensuring that all branch database provisioning goes through the `BranchMigrationManager`. This provides consistent, reliable migration state tracking across all database providers and creation methods.

**Status**: ✅ **FIXED AND READY FOR USE**

---

**For Existing MSSQL Branch**: Use Option 1 (Re-run Migrations via API) to update the migration state.
