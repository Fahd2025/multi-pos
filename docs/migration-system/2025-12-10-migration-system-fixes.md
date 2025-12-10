# Migration System Fixes

**Date:** 2025-12-10  
**Issue:** Branch database migrations failing with "table already exists" and "no such table: BranchInfo" errors  
**Status:** ✅ Resolved

## Problem Summary

The migration system was failing to create branch databases due to conflicts between manual database creation (`EnsureCreatedAsync()`) and the EF Core migration system. This resulted in:

1. **Error:** `SQLite Error 1: 'table "Categories" already exists'`
2. **Error:** `SQLite Error 1: 'no such table: BranchInfo'`
3. All branches (B001, B002, B003) stuck in "Failed" or "Manual Intervention Required" status

## Root Causes

### 1. HeadOfficeDbSeeder.cs (Line 243)
**Problem:** Called `EnsureCreatedAsync()` during startup, creating all tables directly without using migrations.

**Impact:** Tables were created before the migration system could run, causing "table already exists" errors.

### 2. BranchMigrationManager.cs (Line 92)
**Problem:** Also called `EnsureCreatedAsync()` when database didn't exist.

**Impact:** Same as above - bypassed the migration system entirely.

### 3. Migration 20251209161046_AddInvoiceTemplates.cs (Line 14)
**Problem:** Attempted to `DROP TABLE BranchInfo` which never existed in fresh databases.

**Impact:** Failed with "no such table" error because this table was only created by the old `EnsureCreatedAsync()` method, not by migrations.

## Solutions Applied

### Fix 1: HeadOfficeDbSeeder.cs
**File:** `Backend/Data/HeadOffice/HeadOfficeDbSeeder.cs`

**Changed:**
- **Removed:** Entire `CreateBranchDatabasesAsync()` method (lines 216-274)
- **Removed:** `EnsureCreatedAsync()` call that created tables without migrations
- **Removed:** All branch database seeding logic from the seeder

**Result:** HeadOffice seeder no longer touches branch databases.

### Fix 2: BranchMigrationManager.cs
**File:** `Backend/Services/Shared/Migrations/BranchMigrationManager.cs`

**Changed (Lines 88-98):**
```csharp
// BEFORE - WRONG
if (!databaseExists)
{
    await branchContext.Database.EnsureCreatedAsync(cancellationToken);
}

// AFTER - CORRECT
if (!databaseExists)
{
    _logger.LogInformation("Database does not exist for branch {BranchCode}, will be created by migrations...", branch.Code);
}
```

**Result:** Database creation now handled entirely by `MigrateAsync()` at line 123.

### Fix 3: AddInvoiceTemplates Migration
**File:** `Backend/Migrations/Branch/20251209161046_AddInvoiceTemplates.cs`

**Changed (Lines 12-17):**
```csharp
// BEFORE - WRONG
migrationBuilder.DropTable(name: "BranchInfo");

// AFTER - CORRECT
// Note: BranchInfo table drop removed - it was never created by migrations
// This table only existed in databases created with EnsureCreatedAsync
```

**Result:** Migration no longer tries to drop a table that doesn't exist.

### Fix 4: Program.cs
**File:** `Backend/Program.cs`

**Changed (Lines 260-296):** Moved branch data seeding to AFTER migrations complete successfully.

**Result:** Data seeding only happens when migrations have succeeded.

## Startup Flow (Fixed)

### Before (Broken)
1. Seed HeadOffice data
2. **❌ HeadOfficeDbSeeder calls `EnsureCreatedAsync()`** → Creates all tables
3. Seed branch data
4. **❌ Try to apply migrations** → FAIL: "table already exists"

### After (Fixed)
1. Seed HeadOffice data (branches registered, no databases created)
2. **✅ Apply migrations** → Creates databases with proper migration history
3. **✅ Seed branch data** → Only if migrations succeeded
4. Background service monitors for future migrations

## Files Modified

1. `Backend/Data/HeadOffice/HeadOfficeDbSeeder.cs`
2. `Backend/Services/Shared/Migrations/BranchMigrationManager.cs`
3. `Backend/Migrations/Branch/20251209161046_AddInvoiceTemplates.cs`
4. `Backend/Program.cs`

## Key Principle

**NEVER use `EnsureCreatedAsync()` in a project that uses EF Core Migrations.**

- `EnsureCreatedAsync()` creates tables directly from the model **without** recording migration history
- This makes it impossible to apply migrations later
- Always use `MigrateAsync()` which applies migrations in order and tracks history

## Verification

After fixes, all branches show:
- ✅ Status: Completed
- ✅ All 4 migrations applied:
  1. `20251202101429_InitialBranchSchema`
  2. `20251209161046_AddInvoiceTemplates`
  3. `20251210135422_AddInvoiceFieldsToSalesAndLineItems`
  4. `20251210162154_AddSaudiNationalAddressToCustomers`
- ✅ Migration history properly tracked in `__EFMigrationsHistory` table
- ✅ Sample data seeded successfully

## Future Guidelines

1. **Never** use `EnsureCreatedAsync()` - always use migrations
2. Database creation happens in `Program.cs` via `MigrateAsync()`
3. Data seeding happens AFTER migrations complete
4. Keep seeders (HeadOfficeDbSeeder, BranchDbSeeder) separate from database creation
5. Test migrations on fresh databases regularly
