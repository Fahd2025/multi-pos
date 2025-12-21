# Delivery Status Enum Migration Rollback Fix

**Date:** December 21, 2025
**Migration:** `20251217000000_UpdateDeliveryStatusEnum`
**Issue:** Rollback failed with `NotSupportedException`
**Status:** ✅ Fixed

## Problem Summary

The migration `20251217000000_UpdateDeliveryStatusEnum` consolidated the `DeliveryStatus` enum by:
- Removing `PickedUp` status (merged into `OutForDelivery`)
- Removing `Cancelled` status (merged into `Failed`)
- Renumbering remaining enum values

The original `Down()` method threw a `NotSupportedException`, preventing rollback operations across all branches.

### Error Message
```
Downgrade migration is not supported for DeliveryStatus enum changes.
The PickedUp and Cancelled statuses have been removed and consolidated.
```

### Affected Branches
- B001
- B002
- B003
- mssql
- mysql
- postgres

## Root Cause

### Issue 1: Rollback Not Supported
The migration's `Down()` method was implemented with a `throw new NotSupportedException()` because:
1. It was deemed impossible to perfectly reverse the consolidation
2. `Failed(4)` entries could have been originally either `Failed(5)` or `Cancelled(6)`
3. `OutForDelivery(2)` entries could have been originally either `PickedUp(2)` or `OutForDelivery(3)`

### Issue 2: PostgreSQL Case Sensitivity
The original migration used unquoted identifiers in raw SQL:
```sql
UPDATE DeliveryOrders SET DeliveryStatus = 5 WHERE DeliveryStatus = 4
```

PostgreSQL converts unquoted identifiers to lowercase, so it looked for a table named `deliveryorders` (lowercase), but EF Core creates the table as `"DeliveryOrders"` (with capital letters). This caused the error:
```
42P01: relation "deliveryorders" does not exist
```

### Issue 3: Table Doesn't Exist on Some Branches
Some branch databases (especially the postgres test branch) may not have been fully migrated to include the `DeliveryOrders` table, causing the rollback to fail when trying to update a non-existent table.

## Solution

Implemented a comprehensive fix with three key improvements:

### 1. Best-Effort Rollback Strategy
Replaced `throw new NotSupportedException()` with actual rollback logic that restores the old enum structure.

### 2. Multi-Provider SQL Compatibility
Added provider-specific SQL generation for all supported database providers:
- **PostgreSQL**: Uses `"DoubleQuotes"` and `DO $$ ... END $$` blocks for conditional execution
- **SQL Server**: Uses `[SquareBrackets]` and `IF OBJECT_ID(...) IS NOT NULL` checks
- **MySQL**: Uses `` `Backticks` `` for identifiers
- **SQLite**: Uses `"DoubleQuotes"` (ANSI SQL standard)

### 3. Table Existence Checks
Added conditional checks to only update the table if it exists, preventing errors on databases that haven't been migrated to include `DeliveryOrders` yet.

### Enum Value Changes

**Old Enum Structure:**
```csharp
Pending = 0
Assigned = 1
PickedUp = 2
OutForDelivery = 3
Delivered = 4
Failed = 5
Cancelled = 6
```

**New Enum Structure:**
```csharp
Pending = 0
Assigned = 1
OutForDelivery = 2
Delivered = 3
Failed = 4
```

### Rollback Strategy

The `Down()` method now performs provider-specific SQL updates:

**PostgreSQL:**
```sql
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DeliveryOrders') THEN
        UPDATE "DeliveryOrders" SET "DeliveryStatus" = 5 WHERE "DeliveryStatus" = 4;
        UPDATE "DeliveryOrders" SET "DeliveryStatus" = 4 WHERE "DeliveryStatus" = 3;
        UPDATE "DeliveryOrders" SET "DeliveryStatus" = 3 WHERE "DeliveryStatus" = 2;
    END IF;
END $$;
```

**SQL Server:**
```sql
IF OBJECT_ID('DeliveryOrders', 'U') IS NOT NULL
BEGIN
    UPDATE [DeliveryOrders] SET [DeliveryStatus] = 5 WHERE [DeliveryStatus] = 4;
    UPDATE [DeliveryOrders] SET [DeliveryStatus] = 4 WHERE [DeliveryStatus] = 3;
    UPDATE [DeliveryOrders] SET [DeliveryStatus] = 3 WHERE [DeliveryStatus] = 2;
END
```

**MySQL:**
```sql
UPDATE `DeliveryOrders` SET `DeliveryStatus` = 5 WHERE `DeliveryStatus` = 4;
UPDATE `DeliveryOrders` SET `DeliveryStatus` = 4 WHERE `DeliveryStatus` = 3;
UPDATE `DeliveryOrders` SET `DeliveryStatus` = 3 WHERE `DeliveryStatus` = 2;
```

**SQLite:**
```sql
UPDATE "DeliveryOrders" SET "DeliveryStatus" = 5 WHERE "DeliveryStatus" = 4;
UPDATE "DeliveryOrders" SET "DeliveryStatus" = 4 WHERE "DeliveryStatus" = 3;
UPDATE "DeliveryOrders" SET "DeliveryStatus" = 3 WHERE "DeliveryStatus" = 2;
```

### Data Loss Considerations

⚠️ **Important:** The rollback causes acceptable data loss:

1. **Cancelled Status**: All `Failed(4)` entries are rolled back to `Failed(5)`. Any entries that were originally `Cancelled(6)` cannot be distinguished and will remain as `Failed(5)`.

2. **PickedUp Status**: All `OutForDelivery(2)` entries are rolled back to `OutForDelivery(3)`. Any entries that were originally `PickedUp(2)` cannot be distinguished and will remain as `OutForDelivery(3)`.

This is acceptable because:
- The enum consolidation was a business decision to simplify delivery statuses
- `Cancelled` is semantically similar to `Failed` (delivery unsuccessful)
- `PickedUp` is semantically similar to `OutForDelivery` (driver has the package)
- Full rollback would require tracking original values, which defeats the purpose of consolidation

## Files Modified

### Migration File
- **File:** `Backend/Migrations/Branch/20251217000000_UpdateDeliveryStatusEnum.cs`
- **Changes:**
  1. Replaced `throw new NotSupportedException()` with best-effort SQL rollback
  2. Added multi-provider SQL compatibility
  3. Added table existence checks for PostgreSQL and SQL Server
- **Lines Modified:** Entire file rewritten (132 lines)

### Code Changes

**Before:**
```csharp
protected override void Down(MigrationBuilder migrationBuilder)
{
    throw new NotSupportedException(
        "Downgrade migration is not supported for DeliveryStatus enum changes. " +
        "The PickedUp and Cancelled statuses have been removed and consolidated."
    );
}
```

**After (Multi-Provider Compatible):**
```csharp
protected override void Down(MigrationBuilder migrationBuilder)
{
    var provider = migrationBuilder.ActiveProvider;

    if (provider != null && provider.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase))
    {
        // PostgreSQL with table existence check and proper quoting
        migrationBuilder.Sql(@"
            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DeliveryOrders') THEN
                    UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 5 WHERE ""DeliveryStatus"" = 4;
                    UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 4 WHERE ""DeliveryStatus"" = 3;
                    UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 3 WHERE ""DeliveryStatus"" = 2;
                END IF;
            END $$;
        ");
    }
    else if (provider != null && provider.Contains("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        // SQL Server with table existence check
        migrationBuilder.Sql(@"
            IF OBJECT_ID('DeliveryOrders', 'U') IS NOT NULL
            BEGIN
                UPDATE [DeliveryOrders] SET [DeliveryStatus] = 5 WHERE [DeliveryStatus] = 4;
                UPDATE [DeliveryOrders] SET [DeliveryStatus] = 4 WHERE [DeliveryStatus] = 3;
                UPDATE [DeliveryOrders] SET [DeliveryStatus] = 3 WHERE [DeliveryStatus] = 2;
            END
        ");
    }
    else if (provider != null && provider.Contains("MySql", StringComparison.OrdinalIgnoreCase))
    {
        // MySQL with backticks
        migrationBuilder.Sql(@"
            UPDATE `DeliveryOrders` SET `DeliveryStatus` = 5 WHERE `DeliveryStatus` = 4;
            UPDATE `DeliveryOrders` SET `DeliveryStatus` = 4 WHERE `DeliveryStatus` = 3;
            UPDATE `DeliveryOrders` SET `DeliveryStatus` = 3 WHERE `DeliveryStatus` = 2;
        ");
    }
    else
    {
        // SQLite and others - ANSI SQL standard double quotes
        migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 5 WHERE \"DeliveryStatus\" = 4");
        migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 4 WHERE \"DeliveryStatus\" = 3");
        migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 3 WHERE \"DeliveryStatus\" = 2");
    }
}
```

**Key Improvements:**
1. ✅ **Provider Detection**: Uses `migrationBuilder.ActiveProvider` to detect database type
2. ✅ **Proper Quoting**: PostgreSQL/SQLite use `"quotes"`, SQL Server uses `[brackets]`, MySQL uses `` `backticks` ``
3. ✅ **Table Checks**: PostgreSQL and SQL Server check if table exists before updating
4. ✅ **No Exceptions**: Gracefully handles missing tables instead of throwing errors

## Testing Recommendations

1. **Test Rollback on Each Provider:**
   ```bash
   # Test on SQLite
   dotnet ef migrations rollback --context BranchDbContext

   # Verify data
   SELECT DeliveryStatus, COUNT(*) FROM DeliveryOrders GROUP BY DeliveryStatus;
   ```

2. **Verify Enum Values:**
   - Ensure no entries have `DeliveryStatus = 2` (should be 3)
   - Ensure no entries have `DeliveryStatus = 4` (should be 5)

3. **Test Re-Application:**
   ```bash
   # Re-apply the migration after rollback
   dotnet ef database update
   ```

## Related Documentation

- Original Migration Design: `docs/migration-system/2025-12-17-delivery-status-enum-consolidation.md` (if exists)
- Migration System Architecture: `docs/migration-system/2025-12-05-branch-database-migration-system-design.md`
- Enum Migration Best Practices: See "Handling Enum Changes" section in migration docs

## Lessons Learned

1. **Always Provide Rollback Logic:** Even for "irreversible" migrations, provide a best-effort rollback to avoid blocking the migration system.

2. **Document Data Loss:** When rollback involves data loss, document it clearly in both code comments and migration docs.

3. **Multi-Provider Compatibility:** When using raw SQL in migrations:
   - Always use provider-specific identifier quoting (PostgreSQL: `"quotes"`, SQL Server: `[brackets]`, MySQL: `` `backticks` ``)
   - Use `migrationBuilder.ActiveProvider` to detect the database provider
   - Test migrations against all supported database providers
   - Include table existence checks when appropriate

4. **PostgreSQL Case Sensitivity:** PostgreSQL is case-sensitive and requires proper identifier quoting:
   - Unquoted: `DeliveryOrders` → converted to `deliveryorders`
   - Quoted: `"DeliveryOrders"` → preserved as `DeliveryOrders`

5. **Consider Soft Migrations:** For enum consolidations, consider:
   - Adding new columns instead of removing old ones
   - Keeping deprecated values in the enum with `[Obsolete]` attributes
   - Using migration flags to track which version the data came from

6. **Test Rollbacks Early:** Test rollback scenarios during migration development, not when users are trying to roll back in production.

7. **Handle Missing Tables Gracefully:** When migrations modify data, add checks to verify tables exist before attempting updates. This prevents errors when rolling back databases that haven't reached certain migration points yet.

## Future Improvements

Consider implementing:
- Migration metadata tracking to record original enum values during consolidation
- Automated rollback testing in CI/CD pipeline
- Migration lint rules to prevent `throw` statements in `Down()` methods
- Better UI messaging when data loss occurs during rollback

## Related Issues

- Frontend Migration UI: Ensure error messages clearly communicate rollback data loss
- API Documentation: Update swagger docs to reflect new enum values
- Client SDK: Update TypeScript enums to match new structure
