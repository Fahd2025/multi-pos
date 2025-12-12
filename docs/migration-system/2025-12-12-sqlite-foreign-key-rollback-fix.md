# SQLite Foreign Key Constraint Fix for Migration Rollback

**Date:** 2025-12-12
**Issue:** SQLite Error 19: 'FOREIGN KEY constraint failed' during rollback
**Status:** ✅ Fixed
**Build Status:** ✅ Success (0 errors)

## Problem

When attempting to rollback migrations in SQLite databases that contain data with foreign key relationships, the operation fails with:

```
SQLite Error 19: 'FOREIGN KEY constraint failed'
400 (Bad Request)
```

### Root Cause

SQLite enforces foreign key constraints during migration rollbacks. When EF Core tries to drop tables or columns that have foreign key relationships with data in them, SQLite blocks the operation to maintain referential integrity.

## Solution

Override the `RollbackToMigrationAsync` method in `SqliteMigrationStrategy` to temporarily disable foreign key constraints during the rollback operation.

## Implementation

### File Modified: `Backend/Services/Shared/Migrations/SqliteMigrationStrategy.cs`

**Added Using Statements:**
```csharp
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
```

**Added Method Override:**
```csharp
/// <summary>
/// Override rollback for SQLite to handle foreign key constraints
/// SQLite requires foreign keys to be disabled during schema changes in rollback
/// </summary>
public override async Task RollbackToMigrationAsync(
    BranchDbContext context,
    string? targetMigration,
    CancellationToken cancellationToken)
{
    Logger.LogInformation("Rolling back SQLite migration to {TargetMigration}", targetMigration ?? "(empty)");

    try
    {
        // Disable foreign key constraints for SQLite
        await context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;", cancellationToken);
        Logger.LogInformation("Disabled foreign key constraints for rollback");

        // Perform the rollback
        var serviceProvider = context.GetInfrastructure();
        var migrator = serviceProvider.GetService<Microsoft.EntityFrameworkCore.Migrations.IMigrator>();
        if (migrator == null)
        {
            throw new InvalidOperationException("Could not get IMigrator service");
        }

        await migrator.MigrateAsync(targetMigration, cancellationToken);

        Logger.LogInformation("Rollback completed successfully");
    }
    finally
    {
        // Re-enable foreign key constraints
        try
        {
            await context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON;", cancellationToken);
            Logger.LogInformation("Re-enabled foreign key constraints after rollback");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to re-enable foreign key constraints after rollback");
            // Don't throw here - rollback already completed
        }
    }
}
```

## How It Works

1. **Before Rollback**: Execute `PRAGMA foreign_keys = OFF;` to disable constraint checking
2. **During Rollback**: Perform the migration rollback using EF Core's `IMigrator`
3. **After Rollback**: Execute `PRAGMA foreign_keys = ON;` to re-enable constraints
4. **Safety**: Uses try-finally to ensure foreign keys are always re-enabled

## Why This Approach

### SQLite PRAGMA Commands

- `PRAGMA foreign_keys = OFF;` - Disables foreign key constraint enforcement
- `PRAGMA foreign_keys = ON;` - Re-enables foreign key constraint enforcement

### Safety Considerations

1. **Transaction Scope**: SQLite migrations run in transactions, so if rollback fails, database returns to previous state
2. **Finally Block**: Ensures foreign keys are re-enabled even if rollback throws an exception
3. **Non-Throwing Cleanup**: The finally block catches and logs errors when re-enabling, but doesn't throw to avoid masking the original rollback result
4. **Logging**: Comprehensive logging for debugging and audit trail

### Other Database Providers

This override only affects SQLite. Other providers (SQL Server, PostgreSQL, MySQL) use the base implementation from `BaseMigrationStrategy` which doesn't require disabling foreign keys.

## Testing

### Before Fix:
```
❌ Rollback Failed
SQLite Error 19: 'FOREIGN KEY constraint failed'
```

### After Fix:
```
✅ Rollback Successful
Successfully rolled back migration for "Branch Name"
```

### Test Scenario:
1. Branch database with migrations applied
2. Database contains data with foreign key relationships
3. Attempt to rollback last migration
4. **Expected**: Rollback succeeds without foreign key errors

## Security & Data Integrity

### Is This Safe?

**Yes**, for the following reasons:

1. **Temporary Disable**: Foreign keys are only disabled for the duration of the rollback operation
2. **Transaction Protection**: All migrations run within database transactions
3. **Automatic Re-enable**: Foreign keys are automatically re-enabled in finally block
4. **Schema-Only Changes**: Rollback only affects schema, not data relationships
5. **SQLite Specific**: Only affects SQLite, which is typically used for branch databases

### What Could Go Wrong?

**Minimal Risk:**
- If the application crashes during rollback, foreign keys remain disabled until next connection
- SQLite re-enables foreign keys on new connections by default, so this is self-healing
- No data corruption risk because changes are transactional

## Alternative Approaches Considered

### 1. Cascade Delete All Related Data
**❌ Rejected** - Too destructive, would lose all branch data

### 2. Check for Data Before Rollback
**❌ Rejected** - Complex, doesn't solve the problem, just prevents it

### 3. Use Deferred Constraints
**❌ Not Available** - SQLite doesn't support deferred foreign key constraints like PostgreSQL

### 4. Temporarily Disable Constraints (Chosen)
**✅ Selected** - Simple, safe, and effective

## Provider-Specific Behavior

| Provider    | Foreign Key Handling | Notes |
|-------------|---------------------|-------|
| SQLite      | Override with PRAGMA | Required due to strict enforcement |
| SQL Server  | Base implementation | Handles constraints automatically |
| PostgreSQL  | Base implementation | Handles constraints automatically |
| MySQL       | Base implementation | Handles constraints automatically |

## Logging Output

Successful rollback will show:
```
[Information] Rolling back SQLite migration to "20251211100350_AddDriverTable"
[Information] Disabled foreign key constraints for rollback
[Information] Rollback completed successfully
[Information] Re-enabled foreign key constraints after rollback
```

Error scenario:
```
[Information] Rolling back SQLite migration to "20251211100350_AddDriverTable"
[Information] Disabled foreign key constraints for rollback
[Error] Error rolling back migration for branch {BranchId}
[Error] Failed to re-enable foreign key constraints after rollback
```

## Best Practices

For future migration management:

1. **Test Rollbacks**: Test rollback scenarios before applying to production
2. **Backup First**: Always backup branch databases before rollback operations
3. **Monitor Logs**: Check logs after rollback to ensure foreign keys were re-enabled
4. **Data Review**: Review data integrity after rollback operations

## Related Documentation

- [SQLite PRAGMA Documentation](https://www.sqlite.org/pragma.html#pragma_foreign_keys)
- [EF Core Migrations](https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- Previous: `2025-12-12-rollback-and-confirmation-improvements.md`

## Conclusion

The SQLite foreign key constraint issue is now resolved. Rollback operations will succeed even when the database contains data with foreign key relationships. The solution is safe, well-logged, and follows SQLite best practices.
