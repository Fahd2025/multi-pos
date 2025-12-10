# Multi-Branch Database Migration System Design

**Date:** 2025-12-05
**Author:** Claude Code
**Status:** Design Document (Not Yet Implemented)

## Table of Contents

1. [Requirements Gathering](#1-requirements-gathering)
2. [Migration System Architecture](#2-migration-system-architecture)
3. [Implementation Steps](#3-implementation-steps)
4. [Testing and Validation](#4-testing-and-validation)
5. [Deployment and Maintenance](#5-deployment-and-maintenance)
6. [Best Practices](#6-best-practices)
7. [Troubleshooting Guide](#7-troubleshooting-guide)

---

## 1. Requirements Gathering

### Current State Analysis

#### HeadOffice Database

- **Provider:** SQLite
- **Location:** `Upload/HeadOffice/Database/headoffice.db`
- **Migration Status:** ✅ Proper EF Core migrations configured
- **Migration Files:** `Backend/Migrations/HeadOffice/*.cs`

#### Branch Databases

Multiple databases per branch, each potentially using different providers:

1. **SQLite**

   - File-based: `Upload/Branches/{Code}/Database/{Code}.db`
   - No username/password required
   - Directory auto-created by DbContextFactory

2. **SQL Server (MSSQL)**

   - Network-based with credentials
   - Supports integrated security or SQL auth
   - SSL/TLS certificate options

3. **PostgreSQL**

   - Network-based with credentials
   - SSL modes: Disable, Require, VerifyCA, VerifyFull
   - Port configurable (default: 5432)

4. **MySQL**
   - Network-based with credentials
   - SSL modes: None, Required, VerifyCA, VerifyFull
   - Port configurable (default: 3306)

#### Current Migration Approach (Needs Replacement)

**File:** `Backend/Data/Shared/BranchDatabaseMigrator.cs`

**Problems:**

- ❌ Uses `EnsureCreatedAsync()` - Creates initial schema but doesn't track migrations
- ❌ Manual SQL scripts for schema updates (SQLite-specific only)
- ❌ Not provider-agnostic (hardcoded SQLite DDL)
- ❌ Runs only at application startup (`Program.cs:236`)
- ❌ No retry mechanism for failed migrations
- ❌ No migration history tracking
- ❌ No rollback capability

**Current Code (to be replaced):**

```csharp
// Runs at startup in Program.cs
var branchMigrator = scope.ServiceProvider.GetRequiredService<BranchDatabaseMigrator>();
await branchMigrator.EnsureAllBranchDatabasesAsync();
```

### Key Requirements

1. ✅ **Multi-Provider Support:** Support all 4 database providers with provider-specific migration logic
2. ✅ **Migration Tracking:** Track migration versions per branch database in HeadOfficeDb
3. ✅ **Zero-Downtime:** Apply migrations without server restart via background service
4. ✅ **Data Loss Prevention:** Use transactions, validation, and rollback capability
5. ✅ **Concurrency Safety:** Handle concurrent migration requests with distributed locking
6. ✅ **Automatic Migration:** Apply migrations automatically when new branches are created
7. ✅ **Manual Control:** Allow manual migration trigger via API endpoints
8. ✅ **Monitoring:** Migration status monitoring and comprehensive logging
9. ✅ **Retry Logic:** Handle offline branches with retry mechanism
10. ✅ **Schema Validation:** Validate schema integrity after migrations

---

## 2. Migration System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Migration Control Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  • MigrationOrchestrator (IHostedService)                        │
│    - Background service for automatic migrations                 │
│    - Periodic health checks (every 5 minutes)                    │
│    - Queue-based migration processing                            │
│                                                                   │
│  • MigrationEndpoints (API Endpoints)                            │
│    - POST /api/v1/migrations/branches/{id}/apply                 │
│    - POST /api/v1/migrations/branches/apply-all                  │
│    - GET  /api/v1/migrations/branches/{id}/pending               │
│    - GET  /api/v1/migrations/branches/{id}/history               │
│    - GET  /api/v1/migrations/branches/{id}/validate              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Migration Manager Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  • IBranchMigrationManager                                       │
│    - GetPendingMigrationsAsync(branchId)                         │
│    - ApplyMigrationsAsync(branchId, targetMigration?)            │
│    - ApplyMigrationsToAllBranchesAsync()                         │
│    - GetMigrationHistoryAsync(branchId)                          │
│    - ValidateBranchDatabaseAsync(branchId)                       │
│                                                                   │
│  • BranchMigrationManager (Implementation)                       │
│    - Coordinates migration execution                             │
│    - Manages distributed locks                                   │
│    - Handles error recovery and retry logic                      │
│    - Updates migration state in HeadOfficeDb                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Provider Strategy Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  • IMigrationStrategy (Strategy Pattern)                         │
│    ├── SqliteMigrationStrategy                                   │
│    ├── SqlServerMigrationStrategy                                │
│    ├── PostgreSqlMigrationStrategy                               │
│    └── MySqlMigrationStrategy                                    │
│                                                                   │
│  • MigrationStrategyFactory                                      │
│    - Returns appropriate strategy based on DatabaseProvider      │
│                                                                   │
│  Each strategy handles:                                          │
│    - Provider-specific migration execution                       │
│    - Connection string validation                                │
│    - Database existence checks                                   │
│    - Transaction management                                      │
│    - Error handling for provider-specific issues                 │
│    - Schema integrity validation                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Migration Execution Layer                     │
├─────────────────────────────────────────────────────────────────┤
│  • Uses EF Core Database.MigrateAsync()                          │
│  • Leverages existing migration files in:                        │
│    - Backend/Migrations/Branch/*.cs                              │
│  • Tracks progress in __EFMigrationsHistory table                │
│  • Implements retry logic (max 3 attempts)                       │
│  • Uses distributed locks to prevent concurrent migrations       │
│  • Validates migration success after completion                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   State Management Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  • BranchMigrationState (Entity in HeadOfficeDb)                 │
│    - Id (Guid, PK)                                               │
│    - BranchId (Guid, FK to Branches)                             │
│    - LastMigrationApplied (string)                               │
│    - Status (enum: Pending/InProgress/Completed/Failed)          │
│    - LastAttemptAt (DateTime)                                    │
│    - RetryCount (int)                                            │
│    - ErrorDetails (string, nullable)                             │
│    - LockOwnerId (string, nullable - for distributed locking)    │
│    - LockExpiresAt (DateTime, nullable - 10 minute timeout)      │
│    - CreatedAt (DateTime)                                        │
│    - UpdatedAt (DateTime)                                        │
│                                                                   │
│  • MigrationHistory (DTO for API responses)                      │
│    - BranchId                                                    │
│    - AppliedMigrations (list)                                    │
│    - PendingMigrations (list)                                    │
│    - LastMigrationDate                                           │
│    - Status                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interactions

1. **Startup:** `MigrationOrchestrator` starts as `IHostedService`
2. **Periodic Check:** Every 5 minutes, orchestrator calls `ApplyMigrationsToAllBranchesAsync()`
3. **Per-Branch Processing:**
   - Load branch from HeadOfficeDb
   - Get migration strategy based on `branch.DatabaseProvider`
   - Acquire distributed lock via `BranchMigrationState.LockOwnerId`
   - Check for pending migrations using `Database.GetPendingMigrationsAsync()`
   - Apply migrations using `Database.MigrateAsync()`
   - Validate schema integrity
   - Update state to Completed/Failed
   - Release lock
4. **Manual Trigger:** Admin can call API endpoint to force migration for specific branch
5. **Monitoring:** Admin dashboard displays `BranchMigrationState` data

---

## 3. Implementation Steps

### Phase 1: Foundation (Core Infrastructure)

#### Step 1.1: Create Migration State Entity

**File:** `Backend/Models/Entities/HeadOffice/BranchMigrationState.cs`

```csharp
using System;

namespace Backend.Models.Entities.HeadOffice;

/// <summary>
/// Tracks migration state for each branch database
/// </summary>
public class BranchMigrationState
{
    /// <summary>
    /// Unique identifier for this migration state record
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Reference to the branch this migration state belongs to
    /// </summary>
    public Guid BranchId { get; set; }

    /// <summary>
    /// Name of the last migration that was successfully applied
    /// Example: "20251215091544_AddUsersTable"
    /// </summary>
    public string LastMigrationApplied { get; set; } = string.Empty;

    /// <summary>
    /// Current migration status
    /// </summary>
    public MigrationStatus Status { get; set; }

    /// <summary>
    /// Timestamp of the last migration attempt
    /// </summary>
    public DateTime LastAttemptAt { get; set; }

    /// <summary>
    /// Number of times migration has been retried (max 3)
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// Error details if migration failed
    /// </summary>
    public string? ErrorDetails { get; set; }

    /// <summary>
    /// Unique identifier of the process that currently holds the migration lock
    /// Used for distributed locking to prevent concurrent migrations
    /// </summary>
    public string? LockOwnerId { get; set; }

    /// <summary>
    /// Expiration timestamp for the migration lock (10 minutes from acquisition)
    /// After expiration, lock can be acquired by another process
    /// </summary>
    public DateTime? LockExpiresAt { get; set; }

    /// <summary>
    /// When this record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public Branch Branch { get; set; } = null!;
}

/// <summary>
/// Migration status enum
/// </summary>
public enum MigrationStatus
{
    /// <summary>
    /// Migrations are pending but not yet started
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Migration is currently in progress
    /// </summary>
    InProgress = 1,

    /// <summary>
    /// All migrations successfully applied
    /// </summary>
    Completed = 2,

    /// <summary>
    /// Migration failed (will be retried automatically)
    /// </summary>
    Failed = 3,

    /// <summary>
    /// Migration failed multiple times, requires manual intervention
    /// </summary>
    RequiresManualIntervention = 4
}
```

#### Step 1.2: Add to HeadOfficeDbContext

**File:** `Backend/Data/HeadOffice/HeadOfficeDbContext.cs`

Add this DbSet property:

```csharp
public DbSet<BranchMigrationState> BranchMigrationStates { get; set; }
```

Add this configuration in `OnModelCreating()`:

```csharp
// BranchMigrationState configuration
modelBuilder.Entity<BranchMigrationState>(entity =>
{
    entity.HasIndex(e => e.BranchId).IsUnique();
    entity.HasIndex(e => e.Status);
    entity.HasIndex(e => e.LastAttemptAt);
    entity.HasIndex(e => e.LockExpiresAt);

    entity
        .HasOne(e => e.Branch)
        .WithMany()
        .HasForeignKey(e => e.BranchId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

#### Step 1.3: Create EF Core Migration

```bash
cd Backend
dotnet ef migrations add AddBranchMigrationState --context HeadOfficeDbContext --output-dir Migrations/HeadOffice
```

#### Step 1.4: Create Migration Strategy Interface

**File:** `Backend/Services/Shared/Migrations/IMigrationStrategy.cs`

```csharp
using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;

namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Strategy interface for database provider-specific migration logic
/// </summary>
public interface IMigrationStrategy
{
    /// <summary>
    /// The database provider this strategy handles
    /// </summary>
    DatabaseProvider Provider { get; }

    /// <summary>
    /// Test if the database can be connected to
    /// </summary>
    Task<bool> CanConnectAsync(string connectionString);

    /// <summary>
    /// Check if the database exists
    /// </summary>
    Task<bool> DatabaseExistsAsync(BranchDbContext context);

    /// <summary>
    /// Get list of pending migrations that need to be applied
    /// </summary>
    Task<List<string>> GetPendingMigrationsAsync(BranchDbContext context);

    /// <summary>
    /// Get list of migrations that have already been applied
    /// </summary>
    Task<List<string>> GetAppliedMigrationsAsync(BranchDbContext context);

    /// <summary>
    /// Apply all pending migrations to the database
    /// </summary>
    Task ApplyMigrationsAsync(BranchDbContext context, CancellationToken cancellationToken);

    /// <summary>
    /// Validate that the database schema is correct and all required tables exist
    /// </summary>
    Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context);
}
```

---

### Phase 2: Migration Strategies (Provider-Specific Logic)

#### Step 2.1: Base Strategy Implementation

**File:** `Backend/Services/Shared/Migrations/BaseMigrationStrategy.cs`

```csharp
using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Base implementation for migration strategies with common functionality
/// </summary>
public abstract class BaseMigrationStrategy : IMigrationStrategy
{
    protected readonly ILogger Logger;

    protected BaseMigrationStrategy(ILogger logger)
    {
        Logger = logger;
    }

    public abstract DatabaseProvider Provider { get; }

    /// <summary>
    /// Default implementation using EF Core API
    /// </summary>
    public virtual async Task<List<string>> GetPendingMigrationsAsync(BranchDbContext context)
    {
        var pending = await context.Database.GetPendingMigrationsAsync();
        return pending.ToList();
    }

    /// <summary>
    /// Default implementation using EF Core API
    /// </summary>
    public virtual async Task<List<string>> GetAppliedMigrationsAsync(BranchDbContext context)
    {
        var applied = await context.Database.GetAppliedMigrationsAsync();
        return applied.ToList();
    }

    /// <summary>
    /// Default implementation using EF Core MigrateAsync
    /// </summary>
    public virtual async Task ApplyMigrationsAsync(BranchDbContext context, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Applying migrations using EF Core MigrateAsync for provider {Provider}", Provider);
        await context.Database.MigrateAsync(cancellationToken);
    }

    // Provider-specific methods to be implemented by derived classes
    public abstract Task<bool> CanConnectAsync(string connectionString);
    public abstract Task<bool> DatabaseExistsAsync(BranchDbContext context);
    public abstract Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context);

    /// <summary>
    /// Helper method to validate required tables exist
    /// </summary>
    protected async Task<bool> ValidateRequiredTablesAsync(
        BranchDbContext context,
        string[] requiredTables,
        Func<BranchDbContext, Task<List<string>>> getTablesFunc)
    {
        try
        {
            var tables = await getTablesFunc(context);
            var missingTables = requiredTables.Where(t => !tables.Contains(t, StringComparer.OrdinalIgnoreCase)).ToList();

            if (missingTables.Any())
            {
                Logger.LogWarning("Missing required tables: {Tables}", string.Join(", ", missingTables));
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error validating schema integrity");
            return false;
        }
    }
}
```

#### Step 2.2: SQLite Migration Strategy

**File:** `Backend/Services/Shared/Migrations/SqliteMigrationStrategy.cs`

```csharp
using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Migrations;

public class SqliteMigrationStrategy : BaseMigrationStrategy
{
    public SqliteMigrationStrategy(ILogger<SqliteMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.SQLite;

    public override async Task<bool> CanConnectAsync(string connectionString)
    {
        try
        {
            var filePath = ExtractFilePathFromConnectionString(connectionString);
            var directory = Path.GetDirectoryName(filePath);

            // Ensure directory exists and is writable
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);

                // Test write permissions
                var testFile = Path.Combine(directory, $".write_test_{Guid.NewGuid()}.tmp");
                await File.WriteAllTextAsync(testFile, "test");
                File.Delete(testFile);
            }

            return await Task.FromResult(true);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Cannot connect to SQLite database: {ConnectionString}", connectionString);
            return false;
        }
    }

    public override async Task<bool> DatabaseExistsAsync(BranchDbContext context)
    {
        try
        {
            return await context.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    public override async Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context)
    {
        var requiredTables = new[]
        {
            "Users",
            "Categories",
            "Products",
            "ProductImages",
            "Customers",
            "Suppliers",
            "Sales",
            "SaleLineItems",
            "Purchases",
            "PurchaseLineItems",
            "Expenses",
            "ExpenseCategories",
            "Settings",
            "SyncQueue",
            "__EFMigrationsHistory"
        };

        return await ValidateRequiredTablesAsync(context, requiredTables, async ctx =>
        {
            var sql = "SELECT name FROM sqlite_master WHERE type='table'";
            var tables = await ctx.Database.SqlQueryRaw<string>(sql).ToListAsync();
            return tables;
        });
    }

    private string ExtractFilePathFromConnectionString(string connectionString)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);
        return builder.DataSource;
    }
}
```

#### Step 2.3: SQL Server Migration Strategy

**File:** `Backend/Services/Shared/Migrations/SqlServerMigrationStrategy.cs`

```csharp
using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Migrations;

public class SqlServerMigrationStrategy : BaseMigrationStrategy
{
    public SqlServerMigrationStrategy(ILogger<SqlServerMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.MSSQL;

    public override async Task<bool> CanConnectAsync(string connectionString)
    {
        try
        {
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            await connection.CloseAsync();
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Cannot connect to SQL Server database: {ConnectionString}", MaskConnectionString(connectionString));
            return false;
        }
    }

    public override async Task<bool> DatabaseExistsAsync(BranchDbContext context)
    {
        try
        {
            return await context.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    public override async Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context)
    {
        var requiredTables = new[]
        {
            "Users",
            "Categories",
            "Products",
            "ProductImages",
            "Customers",
            "Suppliers",
            "Sales",
            "SaleLineItems",
            "Purchases",
            "PurchaseLineItems",
            "Expenses",
            "ExpenseCategories",
            "Settings",
            "SyncQueue",
            "__EFMigrationsHistory"
        };

        return await ValidateRequiredTablesAsync(context, requiredTables, async ctx =>
        {
            var sql = @"
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
            ";
            var tables = await ctx.Database.SqlQueryRaw<string>(sql).ToListAsync();
            return tables;
        });
    }

    private string MaskConnectionString(string connectionString)
    {
        // Mask password in connection string for logging
        return System.Text.RegularExpressions.Regex.Replace(
            connectionString,
            @"(Password|Pwd)=([^;]+)",
            "$1=***",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase
        );
    }
}
```

#### Step 2.4: PostgreSQL Migration Strategy

**File:** `Backend/Services/Shared/Migrations/PostgreSqlMigrationStrategy.cs`

```csharp
using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Services.Shared.Migrations;

public class PostgreSqlMigrationStrategy : BaseMigrationStrategy
{
    public PostgreSqlMigrationStrategy(ILogger<PostgreSqlMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.PostgreSQL;

    public override async Task<bool> CanConnectAsync(string connectionString)
    {
        try
        {
            using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();
            await connection.CloseAsync();
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Cannot connect to PostgreSQL database: {ConnectionString}", MaskConnectionString(connectionString));
            return false;
        }
    }

    public override async Task<bool> DatabaseExistsAsync(BranchDbContext context)
    {
        try
        {
            return await context.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    public override async Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context)
    {
        var requiredTables = new[]
        {
            "Users",
            "Categories",
            "Products",
            "ProductImages",
            "Customers",
            "Suppliers",
            "Sales",
            "SaleLineItems",
            "Purchases",
            "PurchaseLineItems",
            "Expenses",
            "ExpenseCategories",
            "Settings",
            "SyncQueue",
            "__EFMigrationsHistory"
        };

        return await ValidateRequiredTablesAsync(context, requiredTables, async ctx =>
        {
            var sql = @"
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ";
            var tables = await ctx.Database.SqlQueryRaw<string>(sql).ToListAsync();
            return tables;
        });
    }

    private string MaskConnectionString(string connectionString)
    {
        return System.Text.RegularExpressions.Regex.Replace(
            connectionString,
            @"(Password|Pwd)=([^;]+)",
            "$1=***",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase
        );
    }
}
```

#### Step 2.5: MySQL Migration Strategy

**File:** `Backend/Services/Shared/Migrations/MySqlMigrationStrategy.cs`

```csharp
using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace Backend.Services.Shared.Migrations;

public class MySqlMigrationStrategy : BaseMigrationStrategy
{
    public MySqlMigrationStrategy(ILogger<MySqlMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.MySQL;

    public override async Task<bool> CanConnectAsync(string connectionString)
    {
        try
        {
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();
            await connection.CloseAsync();
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Cannot connect to MySQL database: {ConnectionString}", MaskConnectionString(connectionString));
            return false;
        }
    }

    public override async Task<bool> DatabaseExistsAsync(BranchDbContext context)
    {
        try
        {
            return await context.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    public override async Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context)
    {
        var requiredTables = new[]
        {
            "Users",
            "Categories",
            "Products",
            "ProductImages",
            "Customers",
            "Suppliers",
            "Sales",
            "SaleLineItems",
            "Purchases",
            "PurchaseLineItems",
            "Expenses",
            "ExpenseCategories",
            "Settings",
            "SyncQueue",
            "__EFMigrationsHistory"
        };

        return await ValidateRequiredTablesAsync(context, requiredTables, async ctx =>
        {
            var sql = @"
                SELECT TABLE_NAME
                FROM information_schema.tables
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
            ";
            var tables = await ctx.Database.SqlQueryRaw<string>(sql).ToListAsync();
            return tables;
        });
    }

    private string MaskConnectionString(string connectionString)
    {
        return System.Text.RegularExpressions.Regex.Replace(
            connectionString,
            @"(Password|Pwd)=([^;]+)",
            "$1=***",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase
        );
    }
}
```

#### Step 2.6: Migration Strategy Factory

**File:** `Backend/Services/Shared/Migrations/MigrationStrategyFactory.cs`

```csharp
using Backend.Models.Entities.HeadOffice;

namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Factory for creating migration strategies based on database provider
/// </summary>
public class MigrationStrategyFactory
{
    private readonly IServiceProvider _serviceProvider;

    public MigrationStrategyFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    /// <summary>
    /// Get the appropriate migration strategy for the given database provider
    /// </summary>
    public IMigrationStrategy GetStrategy(DatabaseProvider provider)
    {
        return provider switch
        {
            DatabaseProvider.SQLite => _serviceProvider.GetRequiredService<SqliteMigrationStrategy>(),
            DatabaseProvider.MSSQL => _serviceProvider.GetRequiredService<SqlServerMigrationStrategy>(),
            DatabaseProvider.PostgreSQL => _serviceProvider.GetRequiredService<PostgreSqlMigrationStrategy>(),
            DatabaseProvider.MySQL => _serviceProvider.GetRequiredService<MySqlMigrationStrategy>(),
            _ => throw new NotSupportedException($"Database provider {provider} is not supported for migrations")
        };
    }
}
```

---

### Phase 3: Migration Manager (Orchestration)

#### Step 3.1: Create DTOs

**File:** `Backend/Models/DTOs/Shared/Migrations/MigrationDtos.cs`

```csharp
namespace Backend.Models.DTOs.Shared.Migrations;

/// <summary>
/// Result of a migration operation
/// </summary>
public class MigrationResult
{
    public bool Success { get; set; }
    public List<string> AppliedMigrations { get; set; } = new();
    public string? ErrorMessage { get; set; }
    public TimeSpan Duration { get; set; }
    public int BranchesProcessed { get; set; }
    public int BranchesSucceeded { get; set; }
    public int BranchesFailed { get; set; }
}

/// <summary>
/// Migration history for a branch
/// </summary>
public class MigrationHistory
{
    public Guid BranchId { get; set; }
    public string BranchCode { get; set; } = string.Empty;
    public List<string> AppliedMigrations { get; set; } = new();
    public List<string> PendingMigrations { get; set; } = new();
    public DateTime? LastMigrationDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RetryCount { get; set; }
    public string? ErrorDetails { get; set; }
}
```

#### Step 3.2: Create Migration Manager Interface

**File:** `Backend/Services/Shared/Migrations/IBranchMigrationManager.cs`

```csharp
using Backend.Models.DTOs.Shared.Migrations;

namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Service for managing branch database migrations
/// </summary>
public interface IBranchMigrationManager
{
    /// <summary>
    /// Apply pending migrations to a specific branch database
    /// </summary>
    Task<MigrationResult> ApplyMigrationsAsync(
        Guid branchId,
        string? targetMigration = null,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Apply pending migrations to all active branch databases
    /// </summary>
    Task<MigrationResult> ApplyMigrationsToAllBranchesAsync(
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Get list of pending migrations for a branch
    /// </summary>
    Task<List<string>> GetPendingMigrationsAsync(Guid branchId);

    /// <summary>
    /// Get migration history for a branch
    /// </summary>
    Task<MigrationHistory> GetMigrationHistoryAsync(Guid branchId);

    /// <summary>
    /// Validate that a branch database schema is correct
    /// </summary>
    Task<bool> ValidateBranchDatabaseAsync(Guid branchId);
}
```

#### Step 3.3: Implement Migration Manager (Part 1 - Core Logic)

**File:** `Backend/Services/Shared/Migrations/BranchMigrationManager.cs`

```csharp
using System.Diagnostics;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.Shared.Migrations;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Migrations;

public class BranchMigrationManager : IBranchMigrationManager
{
    private readonly HeadOfficeDbContext _headOfficeContext;
    private readonly DbContextFactory _dbContextFactory;
    private readonly MigrationStrategyFactory _strategyFactory;
    private readonly ILogger<BranchMigrationManager> _logger;
    private static readonly SemaphoreSlim _globalLock = new(1, 1);
    private const int MaxRetryAttempts = 3;
    private const int LockTimeoutMinutes = 10;

    public BranchMigrationManager(
        HeadOfficeDbContext headOfficeContext,
        DbContextFactory dbContextFactory,
        MigrationStrategyFactory strategyFactory,
        ILogger<BranchMigrationManager> logger
    )
    {
        _headOfficeContext = headOfficeContext;
        _dbContextFactory = dbContextFactory;
        _strategyFactory = strategyFactory;
        _logger = logger;
    }

    public async Task<MigrationResult> ApplyMigrationsAsync(
        Guid branchId,
        string? targetMigration = null,
        CancellationToken cancellationToken = default
    )
    {
        var stopwatch = Stopwatch.StartNew();
        var result = new MigrationResult();

        try
        {
            // 1. Load branch
            var branch = await _headOfficeContext.Branches
                .FirstOrDefaultAsync(b => b.Id == branchId, cancellationToken);

            if (branch == null)
            {
                result.ErrorMessage = "Branch not found";
                return result;
            }

            _logger.LogInformation("Starting migration process for branch {BranchCode} ({BranchId})", branch.Code, branchId);

            // 2. Acquire distributed lock
            if (!await AcquireMigrationLockAsync(branchId, cancellationToken))
            {
                result.ErrorMessage = "Migration already in progress for this branch";
                _logger.LogWarning("Cannot acquire lock for branch {BranchCode}", branch.Code);
                return result;
            }

            try
            {
                // 3. Get migration strategy for provider
                var strategy = _strategyFactory.GetStrategy(branch.DatabaseProvider);
                _logger.LogInformation("Using {StrategyType} for branch {BranchCode}", strategy.GetType().Name, branch.Code);

                // 4. Create branch context
                using var branchContext = _dbContextFactory.CreateBranchContext(branch);
                var connectionString = branchContext.Database.GetConnectionString();

                if (string.IsNullOrEmpty(connectionString))
                {
                    result.ErrorMessage = "Connection string is null or empty";
                    return result;
                }

                // 5. Validate connection
                if (!await strategy.CanConnectAsync(connectionString))
                {
                    result.ErrorMessage = "Cannot connect to branch database";
                    _logger.LogError("Cannot connect to database for branch {BranchCode}", branch.Code);
                    return result;
                }

                // 6. Ensure database exists
                if (!await strategy.DatabaseExistsAsync(branchContext))
                {
                    _logger.LogInformation("Database does not exist for branch {BranchCode}, creating...", branch.Code);
                    await branchContext.Database.EnsureCreatedAsync(cancellationToken);
                }

                // 7. Get pending migrations
                var pendingMigrations = await strategy.GetPendingMigrationsAsync(branchContext);

                if (!pendingMigrations.Any())
                {
                    _logger.LogInformation("No pending migrations for branch {BranchCode}", branch.Code);
                    result.Success = true;
                    result.ErrorMessage = "No pending migrations";
                    return result;
                }

                _logger.LogInformation(
                    "Applying {Count} migrations to branch {BranchCode}: {Migrations}",
                    pendingMigrations.Count,
                    branch.Code,
                    string.Join(", ", pendingMigrations)
                );

                // 8. Update state to InProgress
                await UpdateMigrationStateAsync(
                    branchId,
                    MigrationStatus.InProgress,
                    null,
                    cancellationToken
                );

                // 9. Apply migrations
                await strategy.ApplyMigrationsAsync(branchContext, cancellationToken);

                // 10. Validate schema integrity
                if (!await strategy.ValidateSchemaIntegrityAsync(branchContext))
                {
                    throw new InvalidOperationException("Schema integrity validation failed after applying migrations");
                }

                // 11. Get applied migrations
                var appliedMigrations = await strategy.GetAppliedMigrationsAsync(branchContext);
                var lastMigration = appliedMigrations.LastOrDefault() ?? string.Empty;

                // 12. Update state to Completed
                await UpdateMigrationStateAsync(
                    branchId,
                    MigrationStatus.Completed,
                    lastMigration,
                    cancellationToken
                );

                result.Success = true;
                result.AppliedMigrations = pendingMigrations;
                result.BranchesProcessed = 1;
                result.BranchesSucceeded = 1;

                _logger.LogInformation(
                    "Successfully applied {Count} migrations to branch {BranchCode}",
                    pendingMigrations.Count,
                    branch.Code
                );
            }
            finally
            {
                // 13. Release lock
                await ReleaseMigrationLockAsync(branchId, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying migrations to branch {BranchId}", branchId);

            // Increment retry count
            var state = await GetOrCreateMigrationStateAsync(branchId, cancellationToken);
            var newRetryCount = state.RetryCount + 1;

            var status = newRetryCount >= MaxRetryAttempts
                ? MigrationStatus.RequiresManualIntervention
                : MigrationStatus.Failed;

            await UpdateMigrationStateAsync(
                branchId,
                status,
                null,
                cancellationToken,
                ex.Message,
                newRetryCount
            );

            result.ErrorMessage = ex.Message;
            result.BranchesProcessed = 1;
            result.BranchesFailed = 1;
        }
        finally
        {
            stopwatch.Stop();
            result.Duration = stopwatch.Elapsed;
        }

        return result;
    }

    public async Task<MigrationResult> ApplyMigrationsToAllBranchesAsync(
        CancellationToken cancellationToken = default
    )
    {
        var stopwatch = Stopwatch.StartNew();
        var result = new MigrationResult { Success = true };

        _logger.LogInformation("Starting migration process for all active branches");

        var branches = await _headOfficeContext.Branches
            .Where(b => b.IsActive)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Found {Count} active branches to process", branches.Count);

        foreach (var branch in branches)
        {
            var branchResult = await ApplyMigrationsAsync(branch.Id, null, cancellationToken);

            result.BranchesProcessed++;

            if (branchResult.Success)
            {
                result.BranchesSucceeded++;
                result.AppliedMigrations.AddRange(
                    branchResult.AppliedMigrations.Select(m => $"[{branch.Code}] {m}")
                );
            }
            else
            {
                result.BranchesFailed++;
                result.Success = false;

                if (string.IsNullOrEmpty(result.ErrorMessage))
                {
                    result.ErrorMessage = $"Failed branches: {branch.Code}";
                }
                else
                {
                    result.ErrorMessage += $", {branch.Code}";
                }
            }
        }

        stopwatch.Stop();
        result.Duration = stopwatch.Elapsed;

        _logger.LogInformation(
            "Completed migration process for all branches: {Succeeded}/{Total} succeeded in {Duration}",
            result.BranchesSucceeded,
            result.BranchesProcessed,
            result.Duration
        );

        return result;
    }

    // Continued in Part 2...
}
```

#### Step 3.4: Implement Migration Manager (Part 2 - Helper Methods)

**File:** `Backend/Services/Shared/Migrations/BranchMigrationManager.cs` (continued)

```csharp
// Add these methods to BranchMigrationManager class

public async Task<List<string>> GetPendingMigrationsAsync(Guid branchId)
{
    var branch = await _headOfficeContext.Branches
        .FirstOrDefaultAsync(b => b.Id == branchId);

    if (branch == null)
    {
        throw new InvalidOperationException($"Branch {branchId} not found");
    }

    var strategy = _strategyFactory.GetStrategy(branch.DatabaseProvider);

    using var branchContext = _dbContextFactory.CreateBranchContext(branch);

    return await strategy.GetPendingMigrationsAsync(branchContext);
}

public async Task<MigrationHistory> GetMigrationHistoryAsync(Guid branchId)
{
    var branch = await _headOfficeContext.Branches
        .FirstOrDefaultAsync(b => b.Id == branchId);

    if (branch == null)
    {
        throw new InvalidOperationException($"Branch {branchId} not found");
    }

    var state = await GetOrCreateMigrationStateAsync(branchId, CancellationToken.None);
    var strategy = _strategyFactory.GetStrategy(branch.DatabaseProvider);

    using var branchContext = _dbContextFactory.CreateBranchContext(branch);

    var appliedMigrations = await strategy.GetAppliedMigrationsAsync(branchContext);
    var pendingMigrations = await strategy.GetPendingMigrationsAsync(branchContext);

    return new MigrationHistory
    {
        BranchId = branchId,
        BranchCode = branch.Code,
        AppliedMigrations = appliedMigrations,
        PendingMigrations = pendingMigrations,
        LastMigrationDate = state.LastAttemptAt,
        Status = state.Status.ToString(),
        RetryCount = state.RetryCount,
        ErrorDetails = state.ErrorDetails
    };
}

public async Task<bool> ValidateBranchDatabaseAsync(Guid branchId)
{
    try
    {
        var branch = await _headOfficeContext.Branches
            .FirstOrDefaultAsync(b => b.Id == branchId);

        if (branch == null)
        {
            return false;
        }

        var strategy = _strategyFactory.GetStrategy(branch.DatabaseProvider);

        using var branchContext = _dbContextFactory.CreateBranchContext(branch);

        return await strategy.ValidateSchemaIntegrityAsync(branchContext);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error validating branch database {BranchId}", branchId);
        return false;
    }
}

private async Task<BranchMigrationState> GetOrCreateMigrationStateAsync(
    Guid branchId,
    CancellationToken cancellationToken
)
{
    var state = await _headOfficeContext.BranchMigrationStates
        .FirstOrDefaultAsync(s => s.BranchId == branchId, cancellationToken);

    if (state == null)
    {
        state = new BranchMigrationState
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            Status = MigrationStatus.Pending,
            LastAttemptAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _headOfficeContext.BranchMigrationStates.Add(state);
        await _headOfficeContext.SaveChangesAsync(cancellationToken);
    }

    return state;
}

private async Task<bool> AcquireMigrationLockAsync(Guid branchId, CancellationToken cancellationToken)
{
    await _globalLock.WaitAsync(cancellationToken);
    try
    {
        var state = await GetOrCreateMigrationStateAsync(branchId, cancellationToken);

        // Check if lock is expired
        if (state.LockExpiresAt.HasValue && state.LockExpiresAt.Value < DateTime.UtcNow)
        {
            _logger.LogWarning("Lock expired for branch {BranchId}, clearing lock", branchId);
            state.LockOwnerId = null;
            state.LockExpiresAt = null;
        }

        // Check if already locked
        if (!string.IsNullOrEmpty(state.LockOwnerId))
        {
            _logger.LogWarning("Branch {BranchId} is already locked by {LockOwnerId}", branchId, state.LockOwnerId);
            return false;
        }

        // Acquire lock
        state.LockOwnerId = Guid.NewGuid().ToString();
        state.LockExpiresAt = DateTime.UtcNow.AddMinutes(LockTimeoutMinutes);
        state.UpdatedAt = DateTime.UtcNow;

        await _headOfficeContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Acquired lock for branch {BranchId} with owner {LockOwnerId}", branchId, state.LockOwnerId);
        return true;
    }
    finally
    {
        _globalLock.Release();
    }
}

private async Task ReleaseMigrationLockAsync(Guid branchId, CancellationToken cancellationToken)
{
    await _globalLock.WaitAsync(cancellationToken);
    try
    {
        var state = await _headOfficeContext.BranchMigrationStates
            .FirstOrDefaultAsync(s => s.BranchId == branchId, cancellationToken);

        if (state != null)
        {
            _logger.LogInformation("Releasing lock for branch {BranchId}", branchId);
            state.LockOwnerId = null;
            state.LockExpiresAt = null;
            state.UpdatedAt = DateTime.UtcNow;

            await _headOfficeContext.SaveChangesAsync(cancellationToken);
        }
    }
    finally
    {
        _globalLock.Release();
    }
}

private async Task UpdateMigrationStateAsync(
    Guid branchId,
    MigrationStatus status,
    string? lastMigration,
    CancellationToken cancellationToken,
    string? errorDetails = null,
    int? retryCount = null
)
{
    var state = await GetOrCreateMigrationStateAsync(branchId, cancellationToken);

    state.Status = status;
    state.LastAttemptAt = DateTime.UtcNow;
    state.UpdatedAt = DateTime.UtcNow;

    if (!string.IsNullOrEmpty(lastMigration))
    {
        state.LastMigrationApplied = lastMigration;
    }

    if (errorDetails != null)
    {
        state.ErrorDetails = errorDetails;
    }

    if (retryCount.HasValue)
    {
        state.RetryCount = retryCount.Value;
    }
    else if (status == MigrationStatus.Completed)
    {
        // Reset retry count on success
        state.RetryCount = 0;
        state.ErrorDetails = null;
    }

    await _headOfficeContext.SaveChangesAsync(cancellationToken);

    _logger.LogInformation(
        "Updated migration state for branch {BranchId}: Status={Status}, RetryCount={RetryCount}",
        branchId,
        status,
        state.RetryCount
    );
}
```

---

### Phase 4: Background Service (Automatic Migrations)

#### Step 4.1: Create Migration Orchestrator

**File:** `Backend/Services/Shared/Migrations/MigrationOrchestrator.cs`

```csharp
namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Background service that periodically checks for pending migrations across all branches
/// </summary>
public class MigrationOrchestrator : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MigrationOrchestrator> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);
    private readonly TimeSpan _initialDelay = TimeSpan.FromSeconds(30);

    public MigrationOrchestrator(
        IServiceProvider serviceProvider,
        ILogger<MigrationOrchestrator> logger
    )
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Migration Orchestrator started");

        // Initial delay to ensure app is fully started
        await Task.Delay(_initialDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("Migration Orchestrator: Starting periodic migration check");

                using var scope = _serviceProvider.CreateScope();
                var migrationManager = scope.ServiceProvider.GetRequiredService<IBranchMigrationManager>();

                var result = await migrationManager.ApplyMigrationsToAllBranchesAsync(stoppingToken);

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Migration Orchestrator: Check completed successfully. Processed {Total} branches, {Succeeded} succeeded",
                        result.BranchesProcessed,
                        result.BranchesSucceeded
                    );
                }
                else
                {
                    _logger.LogWarning(
                        "Migration Orchestrator: Check completed with errors. {Failed}/{Total} branches failed: {Error}",
                        result.BranchesFailed,
                        result.BranchesProcessed,
                        result.ErrorMessage
                    );
                }

                // Log applied migrations
                if (result.AppliedMigrations.Any())
                {
                    _logger.LogInformation(
                        "Migration Orchestrator: Applied {Count} migrations: {Migrations}",
                        result.AppliedMigrations.Count,
                        string.Join(", ", result.AppliedMigrations)
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Migration Orchestrator: Error during periodic migration check");
            }

            // Wait for next check interval
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Migration Orchestrator stopped");
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Migration Orchestrator is stopping");
        await base.StopAsync(cancellationToken);
    }
}
```

---

### Phase 5: API Endpoints (Manual Control)

#### Step 5.1: Create Migration Endpoints

**File:** `Backend/Endpoints/MigrationEndpoints.cs`

```csharp
using Backend.Services.Shared.Migrations;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Endpoints;

public static class MigrationEndpoints
{
    public static void MapMigrationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/migrations")
            .RequireAuthorization()
            .WithTags("Migrations")
            .WithOpenApi();

        // Apply migrations to a specific branch (HeadOfficeAdmin only)
        group.MapPost("/branches/{branchId:guid}/apply", async (
            Guid branchId,
            IBranchMigrationManager migrationManager,
            CancellationToken cancellationToken) =>
        {
            var result = await migrationManager.ApplyMigrationsAsync(branchId, null, cancellationToken);
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        })
        .RequireAuthorization(policy => policy.RequireRole("HeadOfficeAdmin"))
        .WithName("ApplyBranchMigrations")
        .WithSummary("Apply pending migrations to a specific branch")
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(200)
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(400);

        // Apply migrations to all branches (HeadOfficeAdmin only)
        group.MapPost("/branches/apply-all", async (
            IBranchMigrationManager migrationManager,
            CancellationToken cancellationToken) =>
        {
            var result = await migrationManager.ApplyMigrationsToAllBranchesAsync(cancellationToken);
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        })
        .RequireAuthorization(policy => policy.RequireRole("HeadOfficeAdmin"))
        .WithName("ApplyAllBranchMigrations")
        .WithSummary("Apply pending migrations to all active branches")
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(200)
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(400);

        // Get pending migrations for a branch
        group.MapGet("/branches/{branchId:guid}/pending", async (
            Guid branchId,
            IBranchMigrationManager migrationManager) =>
        {
            var pending = await migrationManager.GetPendingMigrationsAsync(branchId);
            return Results.Ok(new { branchId, pendingMigrations = pending, count = pending.Count });
        })
        .RequireAuthorization(policy => policy.RequireRole("HeadOfficeAdmin"))
        .WithName("GetPendingMigrations")
        .WithSummary("Get list of pending migrations for a branch")
        .Produces(200);

        // Get migration history for a branch
        group.MapGet("/branches/{branchId:guid}/history", async (
            Guid branchId,
            IBranchMigrationManager migrationManager) =>
        {
            var history = await migrationManager.GetMigrationHistoryAsync(branchId);
            return Results.Ok(history);
        })
        .RequireAuthorization(policy => policy.RequireRole("HeadOfficeAdmin"))
        .WithName("GetMigrationHistory")
        .WithSummary("Get migration history for a branch")
        .Produces<Models.DTOs.Shared.Migrations.MigrationHistory>(200);

        // Validate branch database
        group.MapGet("/branches/{branchId:guid}/validate", async (
            Guid branchId,
            IBranchMigrationManager migrationManager) =>
        {
            var isValid = await migrationManager.ValidateBranchDatabaseAsync(branchId);
            return Results.Ok(new { branchId, isValid, status = isValid ? "Valid" : "Invalid" });
        })
        .RequireAuthorization(policy => policy.RequireRole("HeadOfficeAdmin"))
        .WithName("ValidateBranchDatabase")
        .WithSummary("Validate branch database schema integrity")
        .Produces(200);

        // Get migration status for all branches
        group.MapGet("/branches/status", [Authorize(Roles = "HeadOfficeAdmin")] async (
            Backend.Data.HeadOffice.HeadOfficeDbContext context) =>
        {
            var states = await context.BranchMigrationStates
                .Include(s => s.Branch)
                .Select(s => new
                {
                    s.BranchId,
                    BranchCode = s.Branch.Code,
                    BranchName = s.Branch.NameEn,
                    s.LastMigrationApplied,
                    Status = s.Status.ToString(),
                    s.LastAttemptAt,
                    s.RetryCount,
                    s.ErrorDetails,
                    IsLocked = s.LockOwnerId != null,
                    s.LockExpiresAt
                })
                .ToListAsync();

            return Results.Ok(states);
        })
        .WithName("GetAllMigrationStatus")
        .WithSummary("Get migration status for all branches")
        .Produces(200);
    }
}
```

---

### Phase 6: Registration and Startup Configuration

#### Step 6.1: Update Program.cs

**File:** `Backend/Program.cs`

Add these service registrations after existing services (around line 130):

```csharp
// Migration Services (add after other service registrations)
builder.Services.AddScoped<SqliteMigrationStrategy>();
builder.Services.AddScoped<SqlServerMigrationStrategy>();
builder.Services.AddScoped<PostgreSqlMigrationStrategy>();
builder.Services.AddScoped<MySqlMigrationStrategy>();
builder.Services.AddSingleton<MigrationStrategyFactory>();
builder.Services.AddScoped<IBranchMigrationManager, BranchMigrationManager>();

// Background Service for automatic migrations
builder.Services.AddHostedService<MigrationOrchestrator>();
```

Replace the existing database seeding code (around line 230-238):

```csharp
// OLD CODE (remove this):
// using (var scope = app.Services.CreateScope())
// {
//     var context = scope.ServiceProvider.GetRequiredService<HeadOfficeDbContext>();
//     await DbSeeder.SeedAsync(context);
//
//     // Ensure all branch databases have the latest schema
//     var branchMigrator = scope.ServiceProvider.GetRequiredService<BranchDatabaseMigrator>();
//     await branchMigrator.EnsureAllBranchDatabasesAsync();
// }

// NEW CODE (replace with this):
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HeadOfficeDbContext>();

    // Ensure HeadOffice database is migrated
    await context.Database.MigrateAsync();

    // Seed default data
    await DbSeeder.SeedAsync(context);

    // Use new migration system for branch databases
    var migrationManager = scope.ServiceProvider.GetRequiredService<IBranchMigrationManager>();
    var result = await migrationManager.ApplyMigrationsToAllBranchesAsync();

    if (!result.Success)
    {
        app.Logger.LogWarning(
            "Some branch migrations failed: {Error}. Background service will retry automatically.",
            result.ErrorMessage
        );
    }
    else
    {
        app.Logger.LogInformation(
            "Successfully migrated {Count} branch databases",
            result.BranchesSucceeded
        );
    }
}
```

Add migration endpoint mapping (around line 300, before `app.Run()`):

```csharp
// Migration endpoints (HeadOfficeAdmin only)
app.MapMigrationEndpoints();
```

#### Step 6.2: Delete Old Migration Code

**Delete this file (no longer needed):**

- `Backend/Data/Shared/BranchDatabaseMigrator.cs`

**Remove this line from Program.cs:**

```csharp
// Remove this line (around line 55):
builder.Services.AddScoped<BranchDatabaseMigrator>();
```

---

## 4. Testing and Validation

### 4.1 Unit Tests

**File:** `Backend.Tests/Services/Migrations/MigrationManagerTests.cs`

```csharp
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.Entities.HeadOffice;
using Backend.Services.Shared.Migrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.Services.Migrations;

public class MigrationManagerTests
{
    private readonly Mock<ILogger<BranchMigrationManager>> _loggerMock;
    private readonly HeadOfficeDbContext _headOfficeContext;
    private readonly DbContextFactory _dbContextFactory;
    private readonly MigrationStrategyFactory _strategyFactory;

    public MigrationManagerTests()
    {
        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<HeadOfficeDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _headOfficeContext = new HeadOfficeDbContext(options);
        _loggerMock = new Mock<ILogger<BranchMigrationManager>>();
        _dbContextFactory = new DbContextFactory();

        // Setup strategy factory with mocks
        var serviceProviderMock = new Mock<IServiceProvider>();
        _strategyFactory = new MigrationStrategyFactory(serviceProviderMock.Object);
    }

    [Fact]
    public async Task ApplyMigrations_NewBranch_ShouldApplyAllMigrations()
    {
        // Arrange
        var branch = CreateTestBranch();
        _headOfficeContext.Branches.Add(branch);
        await _headOfficeContext.SaveChangesAsync();

        var manager = new BranchMigrationManager(
            _headOfficeContext,
            _dbContextFactory,
            _strategyFactory,
            _loggerMock.Object
        );

        // Act
        var result = await manager.ApplyMigrationsAsync(branch.Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotEmpty(result.AppliedMigrations);
    }

    [Fact]
    public async Task ApplyMigrations_ConcurrentRequests_ShouldAcquireLock()
    {
        // Arrange
        var branch = CreateTestBranch();
        _headOfficeContext.Branches.Add(branch);
        await _headOfficeContext.SaveChangesAsync();

        var manager = new BranchMigrationManager(
            _headOfficeContext,
            _dbContextFactory,
            _strategyFactory,
            _loggerMock.Object
        );

        // Act - Start two concurrent migrations
        var task1 = manager.ApplyMigrationsAsync(branch.Id);
        var task2 = manager.ApplyMigrationsAsync(branch.Id);

        var results = await Task.WhenAll(task1, task2);

        // Assert - Only one should succeed
        Assert.True(results.Count(r => r.Success) == 1);
        Assert.True(results.Count(r => !r.Success) == 1);
    }

    [Fact]
    public async Task ApplyMigrations_FailedMigration_ShouldUpdateStateToFailed()
    {
        // Arrange
        var branch = CreateTestBranch();
        _headOfficeContext.Branches.Add(branch);
        await _headOfficeContext.SaveChangesAsync();

        // Setup strategy to throw exception
        var strategyMock = new Mock<IMigrationStrategy>();
        strategyMock
            .Setup(s => s.ApplyMigrationsAsync(It.IsAny<BranchDbContext>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Test migration failure"));

        var manager = new BranchMigrationManager(
            _headOfficeContext,
            _dbContextFactory,
            _strategyFactory,
            _loggerMock.Object
        );

        // Act
        var result = await manager.ApplyMigrationsAsync(branch.Id);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.ErrorMessage);

        var state = await _headOfficeContext.BranchMigrationStates
            .FirstAsync(s => s.BranchId == branch.Id);

        Assert.Equal(MigrationStatus.Failed, state.Status);
        Assert.Equal(1, state.RetryCount);
    }

    [Fact]
    public async Task ApplyMigrations_MaxRetriesExceeded_ShouldRequireManualIntervention()
    {
        // Arrange
        var branch = CreateTestBranch();
        _headOfficeContext.Branches.Add(branch);

        var state = new BranchMigrationState
        {
            Id = Guid.NewGuid(),
            BranchId = branch.Id,
            Status = MigrationStatus.Failed,
            RetryCount = 2, // Already failed twice
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _headOfficeContext.BranchMigrationStates.Add(state);
        await _headOfficeContext.SaveChangesAsync();

        var manager = new BranchMigrationManager(
            _headOfficeContext,
            _dbContextFactory,
            _strategyFactory,
            _loggerMock.Object
        );

        // Act - Third failure should trigger manual intervention
        var result = await manager.ApplyMigrationsAsync(branch.Id);

        // Assert
        var updatedState = await _headOfficeContext.BranchMigrationStates
            .FirstAsync(s => s.BranchId == branch.Id);

        Assert.Equal(MigrationStatus.RequiresManualIntervention, updatedState.Status);
        Assert.Equal(3, updatedState.RetryCount);
    }

    private Branch CreateTestBranch()
    {
        return new Branch
        {
            Id = Guid.NewGuid(),
            Code = "TEST001",
            NameEn = "Test Branch",
            NameAr = "فرع الاختبار",
            DatabaseProvider = DatabaseProvider.SQLite,
            DbServer = "localhost",
            DbName = $"test_{Guid.NewGuid()}",
            DbPort = 0,
            Language = "en",
            Currency = "USD",
            TimeZone = "UTC",
            DateFormat = "yyyy-MM-dd",
            NumberFormat = "en-US",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid()
        };
    }
}
```

### 4.2 Integration Tests

**File:** `Backend.Tests/Integration/MigrationIntegrationTests.cs`

```csharp
using Backend.Models.Entities.HeadOffice;
using Backend.Services.Shared.Migrations;
using Xunit;

namespace Backend.Tests.Integration;

public class MigrationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public MigrationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Theory]
    [InlineData(DatabaseProvider.SQLite)]
    [InlineData(DatabaseProvider.MSSQL)] // Requires SQL Server instance
    [InlineData(DatabaseProvider.PostgreSQL)] // Requires PostgreSQL instance
    [InlineData(DatabaseProvider.MySQL)] // Requires MySQL instance
    public async Task ApplyMigrations_AllProviders_ShouldSucceed(DatabaseProvider provider)
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var migrationManager = scope.ServiceProvider.GetRequiredService<IBranchMigrationManager>();
        var branch = CreateTestBranch(provider);

        // Act
        var result = await migrationManager.ApplyMigrationsAsync(branch.Id);

        // Assert
        Assert.True(result.Success);
        Assert.Empty(result.ErrorMessage ?? string.Empty);

        // Validate schema
        var isValid = await migrationManager.ValidateBranchDatabaseAsync(branch.Id);
        Assert.True(isValid);
    }

    [Fact]
    public async Task MigrationOrchestrator_ShouldRunPeriodically()
    {
        // Test that background service starts and runs
        using var scope = _factory.Services.CreateScope();
        var hostedServices = scope.ServiceProvider.GetServices<IHostedService>();

        var orchestrator = hostedServices.OfType<MigrationOrchestrator>().FirstOrDefault();
        Assert.NotNull(orchestrator);

        // Wait for first execution
        await Task.Delay(TimeSpan.FromSeconds(35));

        // Verify no errors in logs
    }

    private Branch CreateTestBranch(DatabaseProvider provider)
    {
        // Create test branch with provider-specific configuration
        return new Branch
        {
            Id = Guid.NewGuid(),
            Code = $"TEST_{provider}",
            NameEn = $"Test {provider} Branch",
            NameAr = $"فرع {provider}",
            DatabaseProvider = provider,
            DbServer = GetDbServer(provider),
            DbName = $"test_{provider}_{Guid.NewGuid()}",
            DbPort = GetDbPort(provider),
            DbUsername = GetDbUsername(provider),
            DbPassword = GetDbPassword(provider),
            Language = "en",
            Currency = "USD",
            TimeZone = "UTC",
            DateFormat = "yyyy-MM-dd",
            NumberFormat = "en-US",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid()
        };
    }

    private string GetDbServer(DatabaseProvider provider) =>
        provider switch
        {
            DatabaseProvider.SQLite => "localhost",
            DatabaseProvider.MSSQL => "localhost",
            DatabaseProvider.PostgreSQL => "localhost",
            DatabaseProvider.MySQL => "localhost",
            _ => "localhost"
        };

    private int GetDbPort(DatabaseProvider provider) =>
        provider switch
        {
            DatabaseProvider.SQLite => 0,
            DatabaseProvider.MSSQL => 1433,
            DatabaseProvider.PostgreSQL => 5432,
            DatabaseProvider.MySQL => 3306,
            _ => 0
        };

    private string? GetDbUsername(DatabaseProvider provider) =>
        provider switch
        {
            DatabaseProvider.SQLite => null,
            _ => "test_user"
        };

    private string? GetDbPassword(DatabaseProvider provider) =>
        provider switch
        {
            DatabaseProvider.SQLite => null,
            _ => "test_password"
        };
}
```

### 4.3 Manual Validation Checklist

```markdown
## Pre-Testing Setup

- [ ] Backup all branch databases
- [ ] Create test branches for each provider (SQLite, MSSQL, PostgreSQL, MySQL)
- [ ] Ensure test database servers are accessible

## Test 1: New Branch Creation

- [ ] Create new SQLite branch
- [ ] Verify migrations applied automatically (check logs)
- [ ] Verify database file created at correct path
- [ ] Verify all tables exist in database
- [ ] Check BranchMigrationState table shows "Completed" status

## Test 2: Schema Update

- [ ] Create new EF Core migration for BranchDbContext
- [ ] Restart application
- [ ] Verify migrations applied to all branches automatically
- [ ] Check logs for migration execution
- [ ] Verify schema changes in all branch databases

## Test 3: Manual Migration Trigger

- [ ] Call POST /api/v1/migrations/branches/{id}/apply
- [ ] Verify 200 OK response
- [ ] Check migration result includes applied migrations
- [ ] Verify logs show migration execution

## Test 4: Connection Failure Handling

- [ ] Create branch with invalid connection details
- [ ] Trigger migration
- [ ] Verify migration fails gracefully
- [ ] Check BranchMigrationState shows "Failed" status
- [ ] Verify retry count incremented
- [ ] Verify error details captured

## Test 5: Lock Mechanism

- [ ] Start migration for branch A
- [ ] Immediately start another migration for same branch
- [ ] Verify second request returns "already in progress" error
- [ ] Wait for first migration to complete
- [ ] Retry second migration
- [ ] Verify it succeeds

## Test 6: Migration History

- [ ] Call GET /api/v1/migrations/branches/{id}/history
- [ ] Verify response includes applied and pending migrations
- [ ] Verify last migration date is correct
- [ ] Verify status matches BranchMigrationState

## Test 7: Schema Validation

- [ ] Call GET /api/v1/migrations/branches/{id}/validate
- [ ] Verify returns true for valid database
- [ ] Manually drop a required table
- [ ] Call validate endpoint again
- [ ] Verify returns false

## Test 8: Background Service

- [ ] Start application
- [ ] Wait 30 seconds (initial delay)
- [ ] Check logs for "Migration Orchestrator started"
- [ ] Wait 5 minutes
- [ ] Verify orchestrator ran periodic check
- [ ] Verify no errors in logs

## Test 9: Multi-Provider

- [ ] Create branches for each provider
- [ ] Run migrations on all branches
- [ ] Verify all succeed
- [ ] Check each database has correct schema
- [ ] Verify provider-specific features work

## Test 10: Rollback Scenario

- [ ] Create migration that will fail midway
- [ ] Run migration
- [ ] Verify database state is consistent
- [ ] Manually rollback changes
- [ ] Fix migration script
- [ ] Re-run migration
- [ ] Verify success
```

---

## 5. Deployment and Maintenance

### 5.1 Pre-Deployment Checklist

```markdown
## Phase 1: Backup

- [ ] Backup HeadOffice database
- [ ] Backup all branch databases
- [ ] Document current schema versions
- [ ] Create rollback plan
- [ ] Test backup restoration

## Phase 2: Staging Environment

- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Test each database provider
- [ ] Verify migrations work correctly
- [ ] Monitor logs for 24 hours
- [ ] Performance test with 100+ branches

## Phase 3: Production Preparation

- [ ] Schedule deployment during low-traffic window
- [ ] Notify team of deployment
- [ ] Prepare rollback scripts
- [ ] Setup monitoring alerts
- [ ] Ensure database servers are accessible

## Phase 4: Deployment

- [ ] Stop application
- [ ] Deploy new code
- [ ] Run HeadOffice migration: `dotnet ef database update`
- [ ] Start application
- [ ] Monitor logs for startup errors
- [ ] Verify MigrationOrchestrator started
- [ ] Check first branch migration completes successfully

## Phase 5: Verification

- [ ] Call GET /api/v1/migrations/branches/status
- [ ] Verify all branches show "Completed" or "Pending"
- [ ] Manually trigger migration for one branch
- [ ] Verify success
- [ ] Test creating new branch
- [ ] Verify automatic migration works

## Phase 6: Monitoring

- [ ] Monitor logs for next 48 hours
- [ ] Check for failed migrations
- [ ] Review retry counts
- [ ] Ensure background service runs every 5 minutes
- [ ] Verify no performance degradation
```

### 5.2 Monitoring Dashboard (Frontend)

**File:** `frontend/app/[locale]/head-office/migrations/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { migrationService } from "@/services/migration.service";

interface MigrationStatus {
  branchId: string;
  branchCode: string;
  branchName: string;
  lastMigrationApplied: string;
  status:
    | "Pending"
    | "InProgress"
    | "Completed"
    | "Failed"
    | "RequiresManualIntervention";
  lastAttemptAt: string;
  retryCount: number;
  errorDetails?: string;
  isLocked: boolean;
  lockExpiresAt?: string;
}

export default function MigrationsPage() {
  const [statuses, setStatuses] = useState<MigrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatuses();
    const interval = setInterval(loadStatuses, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatuses = async () => {
    try {
      const data = await migrationService.getAllStatus();
      setStatuses(data);
    } catch (error) {
      console.error("Failed to load migration statuses", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = async () => {
    try {
      await migrationService.applyToAllBranches();
      alert("Migration started for all branches");
      loadStatuses();
    } catch (error) {
      alert("Failed to start migrations");
    }
  };

  const handleApplyBranch = async (branchId: string) => {
    try {
      await migrationService.applyToBranch(branchId);
      alert("Migration started for branch");
      loadStatuses();
    } catch (error) {
      alert("Failed to start migration");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      Pending: "bg-yellow-500",
      InProgress: "bg-blue-500",
      Completed: "bg-green-500",
      Failed: "bg-red-500",
      RequiresManualIntervention: "bg-purple-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Branch Database Migrations</h1>
        <button
          onClick={handleApplyAll}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Apply Migrations to All Branches
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Migration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Attempt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Retries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statuses.map((status) => (
                <tr key={status.branchId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {status.branchCode}
                    </div>
                    <div className="text-sm text-gray-500">
                      {status.branchName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getStatusBadge(
                        status.status
                      )}`}
                    >
                      {status.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {status.lastMigrationApplied || "None"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(status.lastAttemptAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {status.retryCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleApplyBranch(status.branchId)}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={status.isLocked}
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**File:** `frontend/services/migration.service.ts`

```typescript
import { apiClient } from "./api-client";

export const migrationService = {
  async getAllStatus() {
    const response = await apiClient.get("/api/v1/migrations/branches/status");
    return response.data;
  },

  async applyToBranch(branchId: string) {
    const response = await apiClient.post(
      `/api/v1/migrations/branches/${branchId}/apply`
    );
    return response.data;
  },

  async applyToAllBranches() {
    const response = await apiClient.post(
      "/api/v1/migrations/branches/apply-all"
    );
    return response.data;
  },

  async getPendingMigrations(branchId: string) {
    const response = await apiClient.get(
      `/api/v1/migrations/branches/${branchId}/pending`
    );
    return response.data;
  },

  async getHistory(branchId: string) {
    const response = await apiClient.get(
      `/api/v1/migrations/branches/${branchId}/history`
    );
    return response.data;
  },

  async validate(branchId: string) {
    const response = await apiClient.get(
      `/api/v1/migrations/branches/${branchId}/validate`
    );
    return response.data;
  },
};
```

### 5.3 Alerting and Notifications

**File:** `Backend/Services/Shared/Migrations/MigrationAlertService.cs`

```csharp
namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Service for sending alerts about migration failures
/// </summary>
public interface IMigrationAlertService
{
    Task SendFailureAlertAsync(Guid branchId, string branchCode, string error);
    Task SendManualInterventionAlertAsync(Guid branchId, string branchCode, int retryCount);
}

public class MigrationAlertService : IMigrationAlertService
{
    private readonly ILogger<MigrationAlertService> _logger;
    // Add email service or notification service here

    public MigrationAlertService(ILogger<MigrationAlertService> logger)
    {
        _logger = logger;
    }

    public async Task SendFailureAlertAsync(Guid branchId, string branchCode, string error)
    {
        _logger.LogCritical(
            "MIGRATION ALERT: Branch {BranchCode} ({BranchId}) migration failed: {Error}",
            branchCode,
            branchId,
            error
        );

        // TODO: Send email/SMS/Slack notification
        // await _emailService.SendAsync(...);

        await Task.CompletedTask;
    }

    public async Task SendManualInterventionAlertAsync(Guid branchId, string branchCode, int retryCount)
    {
        _logger.LogCritical(
            "MIGRATION ALERT: Branch {BranchCode} ({BranchId}) requires manual intervention after {RetryCount} failed attempts",
            branchCode,
            branchId,
            retryCount
        );

        // TODO: Send urgent notification

        await Task.CompletedTask;
    }
}
```

---

## 6. Best Practices

### 6.1 Migration Development Guidelines

#### DO:

✅ **Always test migrations on sample data before production**

```bash
# Create test branch with sample data
# Run migration
# Verify data integrity
```

✅ **Use transactions for data migrations (when supported)**

```csharp
public override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        BEGIN TRANSACTION;
        -- Your data migration here
        COMMIT;
    ");
}
```

✅ **Add descriptive names with timestamps**

```bash
dotnet ef migrations add AddUserIdToSales --context BranchDbContext
# Results in: 20251205143022_AddUserIdToSales.cs
```

✅ **Include both Up() and Down() methods**

```csharp
public override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<string>(
        name: "UserId",
        table: "Sales",
        nullable: true);
}

public override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropColumn(
        name: "UserId",
        table: "Sales");
}
```

✅ **Test across all database providers**

- SQLite (file-based)
- SQL Server (network)
- PostgreSQL (network)
- MySQL (network)

✅ **Use EF Core abstractions (avoid raw SQL when possible)**

```csharp
// Good
migrationBuilder.AddColumn<string>("Email", "Users");

// Avoid (provider-specific)
migrationBuilder.Sql("ALTER TABLE Users ADD COLUMN Email TEXT");
```

✅ **Version your migration files in git**

```bash
git add Backend/Migrations/Branch/*.cs
git commit -m "Add migration: AddUserIdToSales"
```

#### DON'T:

❌ **Never modify applied migrations**

- Once a migration is applied to production, it's immutable
- Create a new migration instead

❌ **Don't use provider-specific features unless necessary**

```csharp
// Avoid
migrationBuilder.Sql("CREATE INDEX CONCURRENTLY idx_name ON table");

// Use
migrationBuilder.CreateIndex("idx_name", "table", "column");
```

❌ **Avoid long-running migrations**

- Break large migrations into smaller chunks
- Consider running heavy migrations during maintenance windows

❌ **Don't hardcode connection strings or secrets**

```csharp
// Bad
var connStr = "Server=localhost;Database=mydb;User=admin;Password=secret";

// Good
var connStr = branchContext.Database.GetConnectionString();
```

❌ **Never delete migration files that have been applied**

- EF Core tracks migrations in \_\_EFMigrationsHistory table
- Deleting applied migrations will break future migrations

### 6.2 Provider-Specific Considerations

#### SQLite

- **Limitations:**

  - Limited ALTER TABLE support (cannot drop columns directly)
  - No native support for changing column types
  - Requires table recreation for complex schema changes

- **Workaround for dropping columns:**

  ```csharp
  protected override void Up(MigrationBuilder migrationBuilder)
  {
      migrationBuilder.Sql(@"
          -- Create new table without the column
          CREATE TABLE Users_New AS SELECT Id, Username, Email FROM Users;

          -- Drop old table
          DROP TABLE Users;

          -- Rename new table
          ALTER TABLE Users_New RENAME TO Users;
      ");
  }
  ```

- **File locking issues:**
  - Avoid running SQLite databases on network drives
  - Use local storage for better performance

#### SQL Server

- **Best Practices:**

  - Use transactions for data migrations
  - Consider table locks during peak hours
  - Monitor transaction log growth

- **Online index creation (Enterprise Edition):**
  ```csharp
  migrationBuilder.Sql(@"
      CREATE INDEX IX_Users_Email ON Users(Email)
      WITH (ONLINE = ON, MAXDOP = 4);
  ");
  ```

#### PostgreSQL

- **Best Practices:**

  - Use `CONCURRENTLY` for index creation to avoid locking
  - Monitor long-running transactions via `pg_stat_activity`

- **Concurrent index creation:**
  ```csharp
  migrationBuilder.Sql("CREATE INDEX CONCURRENTLY IX_Users_Email ON Users(Email);");
  ```

#### MySQL

- **Considerations:**

  - Table-level locking during schema changes
  - Use `ALGORITHM=INPLACE` when possible
  - Monitor replication lag if using read replicas

- **In-place schema changes:**
  ```csharp
  migrationBuilder.Sql(@"
      ALTER TABLE Users
      ADD COLUMN Email VARCHAR(255),
      ALGORITHM=INPLACE, LOCK=NONE;
  ");
  ```

### 6.3 Data Loss Prevention

#### Pattern for Safe Column Removal

```csharp
// Migration 1: Mark column as deprecated (Release v1.0)
public class DeprecateObsoleteColumn : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add comment/log warning
        migrationBuilder.Sql("-- Column ObsoleteColumn is deprecated and will be removed in v1.2");
    }
}

// Migration 2: Archive data (Release v1.1)
public class ArchiveObsoleteColumnData : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            INSERT INTO ArchivedData (ColumnValue, ArchivedAt, SourceTable, SourceColumn)
            SELECT ObsoleteColumn, CURRENT_TIMESTAMP, 'MyTable', 'ObsoleteColumn'
            FROM MyTable
            WHERE ObsoleteColumn IS NOT NULL;
        ");
    }
}

// Migration 3: Remove column (Release v1.2, after grace period)
public class RemoveObsoleteColumn : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ObsoleteColumn",
            table: "MyTable");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ObsoleteColumn",
            table: "MyTable",
            nullable: true);

        // Restore from archive
        migrationBuilder.Sql(@"
            UPDATE MyTable
            SET ObsoleteColumn = ad.ColumnValue
            FROM ArchivedData ad
            WHERE ad.SourceTable = 'MyTable'
            AND ad.SourceColumn = 'ObsoleteColumn';
        ");
    }
}
```

### 6.4 Version Control Strategy

```
Backend/Migrations/Branch/
├── 20251202101429_InitialBranchSchema.cs          # Schema foundation
├── 20251205143022_AddUserIdToSales.cs             # Feature: User tracking
├── 20251210091544_AddUsersTable.cs          # Feature: Branch users
├── 20251215154033_AddInventoryDiscrepancyFlag.cs  # Feature: Inventory alerts
└── BranchDbContextModelSnapshot.cs                # Current schema snapshot

Guidelines:
- Descriptive migration names
- Include feature reference in comments
- Code review all migrations before merge
- Test on all providers before merge
- Document breaking changes in CHANGELOG.md
```

---

## 7. Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Migration Locked for Too Long

**Symptoms:**

- Error: "Migration already in progress for this branch"
- Lock has been held for more than 10 minutes

**Diagnosis:**

```sql
SELECT * FROM BranchMigrationStates
WHERE LockOwnerId IS NOT NULL
AND LockExpiresAt < datetime('now');
```

**Solution:**

```sql
-- Clear expired locks
UPDATE BranchMigrationStates
SET LockOwnerId = NULL, LockExpiresAt = NULL
WHERE LockExpiresAt < datetime('now');
```

**Prevention:**

- Increase lock timeout for large migrations
- Monitor migration duration
- Implement lock health check in orchestrator

---

#### Issue 2: Provider-Specific Migration Failure

**Symptoms:**

- SQLite error: "no such table: \_\_EFMigrationsHistory"
- SQL Server error: "Cannot connect to server"
- PostgreSQL error: "SSL connection required"

**Diagnosis:**

```bash
# Check connection string
# Check database provider configuration
# Verify network connectivity
```

**Solution for SQLite:**

```csharp
// Ensure database directory exists
var dbPath = connectionString.Replace("Data Source=", "");
Directory.CreateDirectory(Path.GetDirectoryName(dbPath));
```

**Solution for Network Providers:**

```csharp
// Test connection before migration
if (!await strategy.CanConnectAsync(connectionString))
{
    throw new InvalidOperationException("Cannot connect to database");
}
```

---

#### Issue 3: Partial Migration Applied

**Symptoms:**

- Migration failed midway
- Database in inconsistent state
- Some tables created, others missing

**Diagnosis:**

```sql
-- Check which migrations were applied
SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId;

-- Compare with expected migrations
```

**Solution:**

**Step 1: Identify last successful migration**

```sql
SELECT MAX(MigrationId) FROM __EFMigrationsHistory;
```

**Step 2: Manually rollback partial changes**

```sql
-- Drop tables/columns created by failed migration
-- Restore data from backup if necessary
```

**Step 3: Fix migration script**

- Review migration code
- Add error handling
- Test on staging environment

**Step 4: Re-run migration**

```bash
# Via API
POST /api/v1/migrations/branches/{branchId}/apply

# Or via background service (automatic retry)
```

---

#### Issue 4: Schema Validation Fails

**Symptoms:**

- Validation returns `false`
- Required tables missing
- Migration shows "Completed" but schema is incomplete

**Diagnosis:**

```csharp
var isValid = await migrationManager.ValidateBranchDatabaseAsync(branchId);
// Returns false
```

**Solution:**

**Step 1: Check which tables exist**

```sql
-- SQLite
SELECT name FROM sqlite_master WHERE type='table';

-- SQL Server
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;

-- PostgreSQL
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- MySQL
SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE();
```

**Step 2: Identify missing tables**

- Compare with required tables list in validation strategy
- Check migration history

**Step 3: Re-create database**

```bash
# Drop and recreate database
# Re-run all migrations
POST /api/v1/migrations/branches/{branchId}/apply
```

---

#### Issue 5: Background Service Not Running

**Symptoms:**

- No logs from MigrationOrchestrator
- Migrations not running automatically
- Manual migrations work fine

**Diagnosis:**

```bash
# Check application logs
grep "Migration Orchestrator" /path/to/logs/app.log

# Verify service is registered
GET /api/v1/health
```

**Solution:**

**Step 1: Verify service registration**

```csharp
// In Program.cs
builder.Services.AddHostedService<MigrationOrchestrator>();
```

**Step 2: Check for startup exceptions**

```bash
# Look for exceptions during service startup
grep "MigrationOrchestrator" /path/to/logs/app.log | grep -i error
```

**Step 3: Restart application**

```bash
dotnet run
# Or restart service/container
```

---

#### Issue 6: Retry Count Exceeds Maximum

**Symptoms:**

- Migration status: "RequiresManualIntervention"
- Retry count >= 3
- Error persists

**Diagnosis:**

```sql
SELECT * FROM BranchMigrationStates
WHERE Status = 4 -- RequiresManualIntervention
AND RetryCount >= 3;
```

**Solution:**

**Step 1: Review error details**

```sql
SELECT BranchId, ErrorDetails, RetryCount
FROM BranchMigrationStates
WHERE Status = 4;
```

**Step 2: Fix underlying issue**

- Connection problems: Verify credentials, network
- Schema problems: Review migration scripts
- Data problems: Check for constraint violations

**Step 3: Reset retry count**

```sql
UPDATE BranchMigrationStates
SET Status = 0, -- Pending
    RetryCount = 0,
    ErrorDetails = NULL
WHERE BranchId = '{branchId}';
```

**Step 4: Trigger manual migration**

```bash
POST /api/v1/migrations/branches/{branchId}/apply
```

---

#### Issue 7: Concurrent Migrations

**Symptoms:**

- Multiple migration processes running
- Database deadlocks
- Lock contention

**Diagnosis:**

```sql
-- Check for multiple locks
SELECT * FROM BranchMigrationStates
WHERE LockOwnerId IS NOT NULL;
```

**Solution:**

- System is designed to prevent this via distributed locking
- If it occurs, it indicates a bug in lock mechanism
- Clear all locks and restart:

```sql
UPDATE BranchMigrationStates
SET LockOwnerId = NULL, LockExpiresAt = NULL;
```

---

#### Issue 8: Migration Takes Too Long

**Symptoms:**

- Migration exceeds 10-minute lock timeout
- Lock expires before migration completes
- Migration fails with "Lock expired" error

**Diagnosis:**

```csharp
// Check migration duration in logs
// Identify slow migration script
```

**Solution:**

**Option 1: Increase lock timeout**

```csharp
// In BranchMigrationManager.cs
private const int LockTimeoutMinutes = 30; // Increased from 10
```

**Option 2: Break migration into smaller chunks**

```csharp
// Instead of one large migration
public class LargeMigration : Migration { }

// Create multiple smaller migrations
public class LargeMigration_Part1 : Migration { }
public class LargeMigration_Part2 : Migration { }
public class LargeMigration_Part3 : Migration { }
```

**Option 3: Run during maintenance window**

```bash
# Temporarily disable background service
# Run migration manually during off-peak hours
POST /api/v1/migrations/branches/{branchId}/apply
```

---

## Summary

This migration system provides:

✅ **Zero-downtime migrations** - Background service handles migrations automatically
✅ **Multi-provider support** - Strategy pattern for SQLite, SQL Server, PostgreSQL, MySQL
✅ **Safe concurrent access** - Distributed locking prevents conflicts
✅ **Automatic retry** - Failed migrations retried up to 3 times
✅ **Monitoring & control** - API endpoints and admin dashboard
✅ **Data loss prevention** - Validation, transactions, and rollback support
✅ **Production-ready** - Comprehensive logging, error handling, and testing

---

## Implementation Timeline

### Phase 1: Foundation (1-2 days)

- Create entities and database migration
- Setup base migration strategies
- Register services

### Phase 2: Core Logic (2-3 days)

- Implement provider-specific strategies
- Build migration manager
- Add lock mechanism

### Phase 3: Automation (1 day)

- Create background service
- Setup API endpoints

### Phase 4: Testing (2-3 days)

- Write unit tests
- Write integration tests
- Manual testing across providers

### Phase 5: Frontend & Monitoring (1-2 days)

- Build admin dashboard
- Add alerting
- Setup monitoring

### Phase 6: Deployment (1 day)

- Deploy to staging
- Test thoroughly
- Deploy to production

**Total Estimated Time:** 8-12 days

---

## Next Steps

1. ✅ Review this design document with the team
2. ✅ Prioritize implementation phases
3. ✅ Setup test database servers (SQL Server, PostgreSQL, MySQL)
4. ✅ Begin Phase 1 implementation
5. ✅ Create git branch: `feature/branch-database-migration-system`
6. ✅ Implement step-by-step following this document

---

## References

- EF Core Migrations: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/
- Database Providers: https://learn.microsoft.com/en-us/ef/core/providers/
- Background Services: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services
- Migration Best Practices: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying

---

**End of Document**
