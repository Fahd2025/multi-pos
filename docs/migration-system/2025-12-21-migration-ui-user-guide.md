# Migration UI User Guide - Apply & Rollback Migrations

**Date:** 2025-12-21
**Feature:** Complete migration management from Head Office UI
**Location:** `http://localhost:3000/head-office/migrations`

---

## Overview

Your Head Office includes a **complete migration management system** with full apply and rollback functionality. **No additional PowerShell scripts or SQL files are needed** - everything is controlled directly from the web interface.

---

## 🎯 Quick Access

**URL:** `http://localhost:3000/head-office/migrations`
**Required Role:** Admin (Head Office)

---

## 📊 Dashboard Features

### 1. Statistics Cards
At the top of the page, you'll see real-time statistics:
- **Total Branches** - Number of registered branches
- **Completed** - Branches with all migrations applied
- **Pending** - Branches with outstanding migrations
- **Failed** - Branches with migration errors
- **In Progress** - Branches currently being migrated

### 2. Search & Filters
- **Search Box** - Filter by branch name or code
- **Status Dropdown** - Filter by migration status
- **Refresh Button** - Manual refresh (auto-refreshes every 30 seconds)

---

## 🔧 Global Operations (Header Buttons)

### Apply to All Branches Button
**When it appears:** Only when at least one branch has pending migrations

**What it does:**
- Opens a dialog showing all pending migrations
- Allows selective migration application
- Applies migrations to all active branches simultaneously
- Shows progress for each branch

**How to use:**
1. Click **"Apply to All Branches"** in the top-right
2. Review the list of migrations to be applied
3. Select which migrations to apply (or select all)
4. Click **"Apply"**
5. Monitor progress in the dialog
6. View results when complete

---

### Undo All Branches Button
**When it appears:** Only when at least one branch has migrations applied

**What it does:**
- Rolls back the last applied migration on ALL branches
- Uses Entity Framework's built-in rollback (executes migration `Down()` method)
- Validates schema integrity after rollback
- Updates migration state for all branches

**How to use:**
1. Click **"Undo All Branches"** in the top-right
2. **Confirmation dialog appears** with warning message
3. Click **"Rollback All"** to confirm (red button)
4. Wait for operation to complete
5. Success/failure notification appears
6. Dashboard refreshes automatically

**⚠️ Warning:** This action **cannot be undone**. It affects all branches simultaneously.

---

## 🏢 Per-Branch Operations (Branch Cards)

Each branch has its own card with expandable details. Click the **expand arrow** to reveal action buttons.

### Branch Card Information
- **Branch Name & Code** - Displayed prominently
- **Status Badge** - Color-coded migration status
- **Lock Status** - Shows if branch is locked during operation
- **Last Migration Applied** - Name of the most recent migration
- **Last Attempt** - Timestamp of last migration operation
- **Retry Count** - Number of retry attempts (if any)
- **Error Details** - Displayed if migration failed

---

### Available Buttons (Per Branch)

#### 1. Apply Migrations Button
**When it appears:** Only when pending migrations exist for this branch

**Button text:** "Apply Migrations (X)" where X is the count

**What it does:**
- Opens a dialog showing pending migrations for this branch
- Allows selective migration application
- Applies migrations to this specific branch only

**How to use:**
1. Expand the branch card
2. Click **"Apply Migrations (X)"**
3. Review pending migrations in the dialog
4. Select which migrations to apply
5. Click **"Apply"**
6. Monitor progress
7. View result

---

#### 2. View History Button
**When it appears:** Always visible

**What it does:**
- Shows all migrations applied to this branch
- Displays pending migrations separately
- Provides migration timeline

**How to use:**
1. Expand the branch card
2. Click **"View History"**
3. Browse applied and pending migrations
4. Close dialog when done

---

#### 3. Pending Migrations Button
**When it appears:** Only when pending migrations exist

**Button text:** "Pending Migrations (X)" where X is the count

**What it does:**
- Shows detailed list of pending migrations
- Displays migration ID and version
- Helps you understand what will be applied

**How to use:**
1. Expand the branch card
2. Click **"Pending Migrations (X)"**
3. Review the pending list
4. Close dialog

---

#### 4. Validate Schema Button
**When it appears:** Always visible

**What it does:**
- Validates database schema integrity
- Checks if database matches expected schema
- Useful for troubleshooting

**How to use:**
1. Expand the branch card
2. Click **"Validate Schema"**
3. Wait for validation (usually instant)
4. Toast notification shows result
   - ✅ Green toast: Schema is valid
   - ❌ Red toast: Schema has integrity issues

---

#### 5. Undo Last Migration Button 🎯
**When it appears:** Only when the branch has at least one applied migration

**Button color:** Red background (indicates destructive action)

**What it does:**
- Rolls back the most recently applied migration
- Executes the migration's `Down()` method
- Validates schema after rollback
- Updates branch migration state

**How to use:**
1. Expand the branch card
2. Click **"Undo Last Migration"**
3. **Confirmation dialog appears:**
   - Title: "Rollback Migration"
   - Message: "Are you sure you want to rollback the last migration for '[Branch Name]'? This action cannot be undone."
4. Click **"Rollback"** to confirm (red button)
5. Wait for operation to complete (may take a few seconds)
6. Toast notification shows result:
   - ✅ Success: "Successfully rolled back migration for '[Branch Name]'"
   - ❌ Failure: Error message displayed
7. Dashboard refreshes automatically

**⚠️ Warning:** This action **cannot be undone**. Make sure you have backups.

---

## 🔄 How Rollback Works

### Technical Process

1. **Lock Acquisition** - Distributed lock prevents concurrent operations (10-minute timeout)
2. **Migration History Check** - Gets list of applied migrations from `__EFMigrationsHistory` table
3. **Target Calculation** - Determines which migration to roll back to (second-to-last)
4. **State Update** - Sets migration state to "InProgress"
5. **Rollback Execution** - Uses Entity Framework Core's `IMigrator.MigrateAsync(targetMigration)`
6. **Schema Validation** - Ensures database integrity after rollback
7. **State Update** - Sets migration state to "Completed" with new last migration
8. **Lock Release** - Allows other operations

### Database Provider Support
- ✅ **SQLite** - Fully supported
- ✅ **SQL Server** - Fully supported
- ✅ **MySQL** - Fully supported
- ✅ **PostgreSQL** - Fully supported

### What Gets Rolled Back
When you roll back a migration, the following happens:
- The migration's `Down()` method is executed
- Schema changes are reversed (tables dropped, columns removed, etc.)
- Migration record is **removed** from `__EFMigrationsHistory`
- Branch migration state is updated to reflect the new last migration

**Example:**
- Before rollback: Last migration = `20251221180927_AddTableManagementColumns`
- After rollback: Last migration = `20251217000000_UpdateDeliveryStatusEnum`
- Result: The `AddTableManagementColumns` changes are undone

---

## 🎨 UI Conditional Visibility

### Button Visibility Rules

| Button | Condition |
|--------|-----------|
| **Apply to All Branches** | At least 1 branch has pending migrations |
| **Undo All Branches** | At least 1 branch has applied migrations |
| **Apply Migrations (per branch)** | Branch has pending migrations AND not locked AND not InProgress |
| **Undo Last Migration (per branch)** | Branch has applied migrations AND not locked AND not InProgress |
| **View History** | Always visible |
| **Pending Migrations** | Branch has pending migrations |
| **Validate Schema** | Always visible |

### Branch Lock Behavior
When a branch is locked (during migration operation):
- **Apply Migrations** button is disabled
- **Undo Last Migration** button is disabled
- Lock icon appears next to branch name
- Lock expiration time is displayed

---

## 🚨 Error Handling

### Failed Migrations
If a migration fails:
1. **Status changes to "Failed"** (or "RequiresManualIntervention" after 3 retries)
2. **Error details are displayed** in a red box on the branch card
3. **Retry count is shown** if applicable
4. **Toast notification** appears with error message

### Common Errors

#### "Duplicate column name"
- **Cause:** Migration already partially applied but not recorded in history
- **Solution:** Use the SQL fix scripts in the root directory, or manually mark migration as applied

#### "No such table"
- **Cause:** Migration references a table that doesn't exist yet
- **Solution:** Ensure migrations are applied in correct order, or check for missing migrations

#### "Branch is locked"
- **Cause:** Another operation is in progress or lock expired without cleanup
- **Solution:** Wait for lock to expire (10 minutes) or manually clear lock from database

---

## 📋 Best Practices

### Before Applying Migrations
1. ✅ **Backup your databases** - Especially important for production
2. ✅ **Review pending migrations** - Use "View History" to see what will be applied
3. ✅ **Test on a single branch first** - Don't use "Apply to All" without testing
4. ✅ **Check for errors in previous migrations** - Resolve any failed migrations first

### Before Rolling Back
1. ⚠️ **Understand what will be undone** - Review the migration's `Down()` method
2. ⚠️ **Backup your database** - Rollback is destructive and irreversible
3. ⚠️ **Check for data loss** - Some rollbacks may drop tables or columns with data
4. ⚠️ **Notify users** - Rollback may cause temporary downtime or errors
5. ⚠️ **Test on a non-critical branch first** - Verify rollback works as expected

### After Operations
1. ✅ **Validate schema** - Use "Validate Schema" button to confirm integrity
2. ✅ **Check application functionality** - Test critical features
3. ✅ **Monitor error logs** - Look for issues in backend logs
4. ✅ **Document the operation** - Record why migration was rolled back

---

## 🔍 Troubleshooting

### "I don't see the Undo All Branches button"
**Reason:** No branches have applied migrations yet.
**Solution:** Apply at least one migration to one branch first.

### "I don't see the Undo Last Migration button for a specific branch"
**Reasons:**
1. Branch has no applied migrations (`lastMigrationApplied` is null or empty)
2. Branch card is not expanded (click the expand arrow)
3. Branch is locked (wait for lock to expire)

### "Rollback button is disabled (grayed out)"
**Reasons:**
1. Branch is currently locked during another operation
2. Branch migration status is "InProgress"

**Solution:** Wait for current operation to complete, then try again.

### "Rollback failed with schema validation error"
**Cause:** Database schema doesn't match expected state after rollback.
**Solution:**
1. Check backend logs for detailed error
2. Manually inspect database schema
3. May require manual intervention to fix schema
4. Consider restoring from backup

---

## 🎬 Step-by-Step Examples

### Example 1: Rollback a Single Branch

**Scenario:** Branch "B001" has the `AddTableManagementColumns` migration applied, but you need to undo it.

**Steps:**
1. Navigate to `http://localhost:3000/head-office/migrations`
2. Find the "B001" branch card
3. Click the **expand arrow** on the right side
4. Locate the **"Undo Last Migration"** button (red background)
5. Click **"Undo Last Migration"**
6. Confirmation dialog appears:
   ```
   Rollback Migration

   Are you sure you want to rollback the last migration for "B001"?
   This action cannot be undone.

   [Cancel]  [Rollback]
   ```
7. Click **"Rollback"** (red button)
8. Wait 2-5 seconds for operation to complete
9. Success toast appears: "Successfully rolled back migration for 'B001'"
10. Branch card updates showing previous migration as "Last Migration"

**Result:** The `AddTableManagementColumns` migration is undone for B001 only.

---

### Example 2: Rollback All Branches

**Scenario:** You applied a migration to all 6 branches, but discovered a bug. You need to undo it everywhere.

**Steps:**
1. Navigate to `http://localhost:3000/head-office/migrations`
2. Locate the **"Undo All Branches"** button in the top-right corner (red background)
3. Click **"Undo All Branches"**
4. Confirmation dialog appears:
   ```
   Rollback All Branches

   Are you sure you want to rollback the last migration for ALL active branches?
   This action cannot be undone and will affect all branches simultaneously.

   [Cancel]  [Rollback All]
   ```
5. Click **"Rollback All"** (red button)
6. Wait 10-30 seconds for operation to complete (depends on number of branches)
7. Success toast appears: "Successfully rolled back migrations for all branches"
8. Dashboard refreshes showing updated migration states for all branches

**Result:** The last migration is undone for all 6 branches (B001, B002, B003, mssql, mysql, postgres).

---

### Example 3: Apply Then Validate

**Scenario:** You want to apply pending migrations and verify schema integrity.

**Steps:**
1. Navigate to `http://localhost:3000/head-office/migrations`
2. Click **"Apply to All Branches"** (if multiple branches) or expand a single branch
3. Review pending migrations in the dialog
4. Click **"Apply"** and wait for completion
5. After success notification, expand each branch card
6. Click **"Validate Schema"** for each branch
7. Green success toasts confirm schema integrity

**Result:** Migrations applied and validated successfully.

---

## 📚 Related Documentation

- **Backend Implementation:** `Backend/Services/Shared/Migrations/BranchMigrationManager.cs`
- **API Endpoints:** `Backend/Endpoints/MigrationEndpoints.cs`
- **Frontend Page:** `frontend/app/[locale]/head-office/migrations/page.tsx`
- **Migration Strategies:** `Backend/Services/Shared/Migrations/` (SQLite, SQL Server, MySQL, PostgreSQL)

---

## 🎯 Summary

Your migration system provides **complete UI-based control** over database migrations:

✅ **Apply migrations** - Single branch or all branches
✅ **Rollback migrations** - Single branch or all branches
✅ **View migration history** - See what's applied and pending
✅ **Validate schema** - Ensure database integrity
✅ **Automatic state tracking** - Know the status of each branch
✅ **Error handling** - Detailed error messages and retry logic
✅ **Multi-database support** - Works with SQLite, SQL Server, MySQL, PostgreSQL

**No scripts needed!** Everything is built into the web interface with proper:
- ✅ Confirmation dialogs
- ✅ Toast notifications
- ✅ Error handling
- ✅ Progress tracking
- ✅ Automatic refresh

---

**Last Updated:** 2025-12-21
**Documentation Version:** 1.0
