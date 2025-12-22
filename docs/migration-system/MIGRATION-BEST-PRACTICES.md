# Migration Best Practices - Multi-Provider Support

**Date:** 2025-12-22
**Purpose:** Guidelines for writing migrations that work across all database providers (SQLite, SQL Server, MySQL, PostgreSQL)
**Status:** ✅ Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Database Provider Limitations](#database-provider-limitations)
3. [Migration Template](#migration-template)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Schema Validation](#schema-validation)
6. [Testing Checklist](#testing-checklist)
7. [Code Examples](#code-examples)

---

## Overview

This document provides **proven patterns and solutions** for writing Entity Framework Core migrations that work correctly across all supported database providers.

### Supported Providers

| Provider | Use Case | Limitations |
|----------|----------|-------------|
| **SQLite** | Branch databases (B001, B002, B003) | ❌ No DROP COLUMN, limited ALTER TABLE |
| **SQL Server** | Production branch databases | ✅ Full DDL support |
| **MySQL/MariaDB** | Production branch databases | ✅ Full DDL support, case-sensitive tables |
| **PostgreSQL** | Production branch databases | ✅ Full DDL support, lowercase table names |

---

## Database Provider Limitations

### SQLite Limitations

**❌ NOT Supported:**
- `DROP COLUMN` (before SQLite 3.35.5)
- `ALTER COLUMN` (modify column type/constraints)
- `DROP CONSTRAINT` / `ADD CONSTRAINT`
- Multiple schema changes in one `ALTER TABLE`

**✅ Supported:**
- `ADD COLUMN`
- `RENAME COLUMN` (SQLite 3.25.0+)
- `RENAME TABLE`

**Workaround:** Use the **table rebuild pattern** (see [Code Examples](#code-examples))

### MySQL Limitations

**⚠️ Gotchas:**
- Table names are **case-sensitive** on Linux, **case-insensitive** on Windows
- Column operations may fail with "Duplicate column name" if migration was partially applied
- Requires explicit `IF EXISTS` / `IF NOT EXISTS` checks for idempotent migrations

### PostgreSQL Quirks

- Table names are stored in **lowercase** by default
- Requires double-quotes for case-sensitive identifiers: `"Sales"`
- Use `DO $$ ... END $$;` blocks for conditional DDL

### SQL Server

- **Most permissive** - supports all standard DDL operations
- Use `sys.columns` for metadata queries
- Supports `IF EXISTS` / `IF NOT EXISTS` natively

---

## Migration Template

Use this template for **all new migrations** that modify tables:

```csharp
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    public partial class YourMigrationName : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Detect database provider
            var provider = migrationBuilder.ActiveProvider;

            if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
            {
                // MySQL: Idempotent column additions
                ApplyMySqlUp(migrationBuilder);
            }
            else if (provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
            {
                // SQL Server: Idempotent column additions
                ApplySqlServerUp(migrationBuilder);
            }
            else if (provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                     provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                // PostgreSQL: Idempotent column additions
                ApplyPostgreSqlUp(migrationBuilder);
            }
            else
            {
                // SQLite and others: Standard approach
                ApplySqliteUp(migrationBuilder);
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            var provider = migrationBuilder.ActiveProvider;

            if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
            {
                ApplyMySqlDown(migrationBuilder);
            }
            else if (provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
            {
                ApplySqlServerDown(migrationBuilder);
            }
            else if (provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                     provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                ApplyPostgreSqlDown(migrationBuilder);
            }
            else
            {
                // SQLite: Use table rebuild pattern for DROP COLUMN
                ApplySqliteDown(migrationBuilder);
            }
        }

        // Provider-specific implementations below...
    }
}
```

---

## Common Issues & Solutions

### Issue 1: "SQLite does not support this migration operation ('DropColumnOperation')"

**Symptom:**
```
Rollback Failed
SQLite does not support this migration operation ('DropColumnOperation').
```

**Cause:** SQLite cannot drop columns natively.

**Solution:** Use the table rebuild pattern in the `Down()` method:

```csharp
private void ApplySqliteDown(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        PRAGMA foreign_keys = OFF;

        CREATE TABLE Sales_new (
            Id TEXT PRIMARY KEY NOT NULL,
            -- List ALL columns EXCEPT the ones you're removing
            TransactionId TEXT NOT NULL,
            InvoiceNumber TEXT NULL,
            -- ... other columns ...
            CreatedAt TEXT NOT NULL
        );

        INSERT INTO Sales_new SELECT Id, TransactionId, InvoiceNumber, ... FROM Sales;

        DROP TABLE Sales;

        ALTER TABLE Sales_new RENAME TO Sales;

        -- Recreate indexes
        CREATE UNIQUE INDEX IX_Sales_TransactionId ON Sales(TransactionId);

        PRAGMA foreign_keys = ON;
    ");
}
```

**✅ Best Practice:**
1. Get the **actual table schema** from the entity class (don't guess!)
2. List ALL columns in the new table EXCEPT the dropped ones
3. Preserve all indexes and foreign keys
4. Test on a copy of your database first

---

### Issue 2: "Duplicate column name 'ColumnName'" (MySQL/MariaDB)

**Symptom:**
```
Failed
Duplicate column name 'TableId'
```

**Cause:** Migration was partially applied but not recorded in `__EFMigrationsHistory`.

**Solution:** Make migrations **idempotent** - check if columns exist before adding:

#### MySQL Idempotent Pattern

```csharp
private void ApplyMySqlUp(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        SET @dbname = DATABASE();
        SET @tablename = 'Sales';

        -- Check if column exists
        SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'TableId');

        -- Add column only if it doesn't exist
        SET @sqlstmt = IF(@columnExists = 0,
            'ALTER TABLE Sales ADD COLUMN TableId INT NULL',
            'SELECT ''Column TableId already exists'' AS Info');

        PREPARE stmt FROM @sqlstmt;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        -- Repeat for each column...
    ");
}
```

#### SQL Server Idempotent Pattern

```csharp
private void ApplySqlServerUp(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        IF NOT EXISTS (SELECT * FROM sys.columns
            WHERE object_id = OBJECT_ID(N'Sales') AND name = 'TableId')
            ALTER TABLE Sales ADD TableId INT NULL;

        IF NOT EXISTS (SELECT * FROM sys.columns
            WHERE object_id = OBJECT_ID(N'Sales') AND name = 'TableNumber')
            ALTER TABLE Sales ADD TableNumber INT NULL;

        -- Repeat for each column...
    ");
}
```

#### PostgreSQL Idempotent Pattern

```csharp
private void ApplyPostgreSqlUp(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name='Sales' AND column_name='TableId') THEN
                ALTER TABLE ""Sales"" ADD COLUMN ""TableId"" INTEGER NULL;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name='Sales' AND column_name='TableNumber') THEN
                ALTER TABLE ""Sales"" ADD COLUMN ""TableNumber"" INTEGER NULL;
            END IF;

            -- Repeat for each column...
        END $$;
    ");
}
```

**✅ Best Practice:**
- **Always** make migrations idempotent for production databases
- Handle partial application scenarios gracefully
- Use provider-specific metadata queries

---

### Issue 3: "Schema integrity validation failed after rollback"

**Symptom:**
```
Error Details: Schema integrity validation failed after rollback
```

**Cause:** Schema validation checks for hardcoded list of tables including ones added by migrations you're rolling back.

**Solution:** Update `ValidateSchemaIntegrityAsync()` to only check **core tables**:

**All Migration Strategy Files:**
- `SqliteMigrationStrategy.cs`
- `SqlServerMigrationStrategy.cs`
- `MySqlMigrationStrategy.cs`
- `PostgreSqlMigrationStrategy.cs`

```csharp
public override async Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context)
{
    // Only validate core tables that exist from initial migration
    // Tables added by later migrations (DeliveryOrders, Zones, Tables) are optional
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
        // ❌ DO NOT include: DeliveryOrders, Zones, Tables, Drivers, Units, InvoiceTemplates
    };

    return await ValidateRequiredTablesAsync(context, requiredTables, async ctx =>
    {
        // Provider-specific table listing query...
    });
}
```

**✅ Best Practice:**
- Only validate tables from **initial migration**
- Don't validate tables added by later migrations
- Update this list ONLY when adding to initial schema

---

### Issue 4: "no such column: BranchId" (SQLite rollback)

**Symptom:**
```
SQLite Error 1: 'no such column: BranchId'
```

**Cause:** Migration's `Down()` method references columns that don't exist in the actual entity schema.

**Solution:** **Always** verify the actual entity schema before writing the rollback:

1. **Read the entity class** (`Backend/Models/Entities/Branch/Sale.cs`)
2. **Copy the exact column list** from the entity
3. **Use EF's column naming conventions** (PascalCase → PascalCase for SQLite TEXT columns)

**✅ Best Practice:**
```bash
# Before writing a migration rollback, check the entity:
cat Backend/Models/Entities/Branch/Sale.cs

# Copy the property names exactly
# Transform to SQL types based on provider
```

---

## Schema Validation

### When Validation Runs

Schema validation runs in two scenarios:
1. **After applying migrations** - ensures all required tables exist
2. **After rollback** - ensures database is in valid state

### What to Validate

**✅ DO validate:**
- Core tables from initial migration
- Essential indexes on core tables
- Migration history table (`__EFMigrationsHistory`)

**❌ DON'T validate:**
- Tables added by specific migrations (DeliveryOrders, Zones, Tables, etc.)
- Optional features
- Provider-specific optimizations

### Updating Validation

**ONLY update validation when:**
- Adding tables to the **initial migration**
- Changing the **minimum required schema**

**DON'T update validation when:**
- Adding feature-specific tables
- Adding optional columns
- Migrating existing systems

---

## Testing Checklist

Before committing a new migration, **test all scenarios**:

### 1. Fresh Database Apply

```bash
# Delete database
rm Backend/Upload/Branches/B001/Database/B001.db

# Restart backend - should apply all migrations
cd Backend && dotnet run

# Verify in UI
http://localhost:3000/head-office/migrations
```

**Expected:** ✅ All migrations applied successfully

---

### 2. Idempotent Apply (Re-run same migration)

**For MySQL, SQL Server, PostgreSQL only:**

```bash
# Apply migration manually
cd Backend
dotnet ef migrations add TestMigration --context BranchDbContext

# Apply it
dotnet ef database update --context BranchDbContext

# Try applying again (should be idempotent)
dotnet ef database update --context BranchDbContext
```

**Expected:** ✅ No errors, migration skipped or re-applied safely

---

### 3. Rollback on All Providers

**Test on each provider:**

1. **SQLite (B001, B002, B003):**
   ```
   Navigate to: http://localhost:3000/head-office/migrations
   Expand B001 → Click "Undo Last Migration"
   Expected: ✅ Success
   ```

2. **MySQL:**
   ```
   Expand MySQL branch → Click "Undo Last Migration"
   Expected: ✅ Success
   ```

3. **SQL Server (if configured):**
   ```
   Expand MSSQL branch → Click "Undo Last Migration"
   Expected: ✅ Success
   ```

4. **PostgreSQL (if configured):**
   ```
   Expand Postgres branch → Click "Undo Last Migration"
   Expected: ✅ Success
   ```

---

### 4. Schema Validation

After rollback, verify schema is valid:

```
Expand branch → Click "Validate Schema"
Expected: ✅ "Schema is valid" toast notification
```

---

### 5. Re-apply After Rollback

After rolling back, try re-applying:

```
Expand branch → Click "Apply Migrations"
Expected: ✅ Migration re-applies successfully
```

---

## Code Examples

### Example 1: Adding Columns (Idempotent, Multi-Provider)

**Migration:** `AddTableManagementColumns`

```csharp
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    public partial class AddTableManagementColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var provider = migrationBuilder.ActiveProvider;

            if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
            {
                // MySQL: Check if columns exist before adding
                migrationBuilder.Sql(@"
                    SET @dbname = DATABASE();
                    SET @tablename = 'Sales';

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'TableId');
                    SET @sqlstmt = IF(@columnExists = 0,
                        'ALTER TABLE Sales ADD COLUMN TableId INT NULL',
                        'SELECT ''Column TableId already exists'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    -- Repeat for other columns...
                ");
            }
            else if (provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
            {
                // SQL Server: Check if columns exist
                migrationBuilder.Sql(@"
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Sales') AND name = 'TableId')
                        ALTER TABLE Sales ADD TableId INT NULL;

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Sales') AND name = 'TableNumber')
                        ALTER TABLE Sales ADD TableNumber INT NULL;

                    -- Other columns...
                ");
            }
            else if (provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                     provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                // PostgreSQL: Check if columns exist
                migrationBuilder.Sql(@"
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Sales' AND column_name='TableId') THEN
                            ALTER TABLE ""Sales"" ADD COLUMN ""TableId"" INTEGER NULL;
                        END IF;

                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Sales' AND column_name='TableNumber') THEN
                            ALTER TABLE ""Sales"" ADD COLUMN ""TableNumber"" INTEGER NULL;
                        END IF;

                        -- Other columns...
                    END $$;
                ");
            }
            else
            {
                // SQLite: Standard approach (errors if column exists)
                migrationBuilder.AddColumn<int>(
                    name: "TableId",
                    table: "Sales",
                    type: "INTEGER",
                    nullable: true);

                migrationBuilder.AddColumn<int>(
                    name: "TableNumber",
                    table: "Sales",
                    type: "INTEGER",
                    nullable: true);

                // Other columns...
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            var provider = migrationBuilder.ActiveProvider;

            if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true ||
                provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true ||
                provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                // MySQL, SQL Server, PostgreSQL: Standard DROP COLUMN
                migrationBuilder.DropColumn(name: "TableId", table: "Sales");
                migrationBuilder.DropColumn(name: "TableNumber", table: "Sales");
                // Other columns...
            }
            else
            {
                // SQLite: Table rebuild pattern
                migrationBuilder.Sql(@"
                    PRAGMA foreign_keys = OFF;

                    CREATE TABLE Sales_new (
                        Id TEXT PRIMARY KEY NOT NULL,
                        TransactionId TEXT NOT NULL,
                        InvoiceNumber TEXT NULL,
                        OrderNumber TEXT NULL,
                        InvoiceType INTEGER NOT NULL,
                        OrderType INTEGER NULL,
                        CustomerId TEXT NULL,
                        CashierId TEXT NOT NULL,
                        UserId TEXT NULL,
                        SaleDate TEXT NOT NULL,
                        Subtotal TEXT NOT NULL,
                        TaxAmount TEXT NOT NULL,
                        TotalDiscount TEXT NOT NULL,
                        Total TEXT NOT NULL,
                        AmountPaid TEXT NULL,
                        ChangeReturned TEXT NULL,
                        PaymentMethod INTEGER NOT NULL,
                        PaymentReference TEXT NULL,
                        Notes TEXT NULL,
                        IsVoided INTEGER NOT NULL DEFAULT 0,
                        VoidedAt TEXT NULL,
                        VoidedBy TEXT NULL,
                        VoidReason TEXT NULL,
                        CreatedAt TEXT NOT NULL
                        -- NOTE: TableId, TableNumber, etc. are EXCLUDED
                    );

                    INSERT INTO Sales_new (
                        Id, TransactionId, InvoiceNumber, OrderNumber, InvoiceType, OrderType,
                        CustomerId, CashierId, UserId, SaleDate, Subtotal, TaxAmount,
                        TotalDiscount, Total, AmountPaid, ChangeReturned, PaymentMethod,
                        PaymentReference, Notes, IsVoided, VoidedAt, VoidedBy, VoidReason, CreatedAt
                    )
                    SELECT
                        Id, TransactionId, InvoiceNumber, OrderNumber, InvoiceType, OrderType,
                        CustomerId, CashierId, UserId, SaleDate, Subtotal, TaxAmount,
                        TotalDiscount, Total, AmountPaid, ChangeReturned, PaymentMethod,
                        PaymentReference, Notes, IsVoided, VoidedAt, VoidedBy, VoidReason, CreatedAt
                    FROM Sales;

                    DROP TABLE Sales;

                    ALTER TABLE Sales_new RENAME TO Sales;

                    CREATE UNIQUE INDEX IX_Sales_TransactionId ON Sales(TransactionId);
                    CREATE INDEX IX_Sales_InvoiceNumber ON Sales(InvoiceNumber);
                    CREATE INDEX IX_Sales_CustomerId ON Sales(CustomerId);

                    PRAGMA foreign_keys = ON;
                ");
            }
        }
    }
}
```

---

### Example 2: Adding a New Table (All Providers)

**For new tables, use standard `CreateTable()` - it works on all providers:**

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateTable(
        name: "Tables",
        columns: table => new
        {
            Id = table.Column<int>(type: "INTEGER", nullable: false)
                .Annotation("Sqlite:Autoincrement", true),
            ZoneId = table.Column<int>(type: "INTEGER", nullable: false),
            TableNumber = table.Column<int>(type: "INTEGER", nullable: false),
            // ... other columns
        },
        constraints: table =>
        {
            table.PrimaryKey("PK_Tables", x => x.Id);
            table.ForeignKey(
                name: "FK_Tables_Zones_ZoneId",
                column: x => x.ZoneId,
                principalTable: "Zones",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        });
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // DROP TABLE works on all providers
    migrationBuilder.DropTable(name: "Tables");
}
```

**✅ No provider-specific code needed for CREATE TABLE / DROP TABLE**

---

## Quick Reference

### Provider Detection

```csharp
var provider = migrationBuilder.ActiveProvider;

// MySQL
if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)

// SQL Server
if (provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)

// PostgreSQL
if (provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
    provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)

// SQLite (fallback)
else
```

---

### Column Type Mapping

| C# Type | SQLite | SQL Server | MySQL | PostgreSQL |
|---------|--------|------------|-------|------------|
| `int` / `int?` | `INTEGER` | `INT` | `INT` | `INTEGER` |
| `string` | `TEXT` | `NVARCHAR(MAX)` | `VARCHAR(...)` | `VARCHAR(...)` |
| `DateTime` | `TEXT` | `DATETIME2` | `DATETIME` | `TIMESTAMP` |
| `bool` | `INTEGER` (0/1) | `BIT` | `TINYINT(1)` | `BOOLEAN` |
| `decimal` | `TEXT` | `DECIMAL(18,2)` | `DECIMAL(18,2)` | `NUMERIC(18,2)` |
| `Guid` | `TEXT` | `UNIQUEIDENTIFIER` | `CHAR(36)` | `UUID` |

---

### Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Using `DropColumn()` in `Down()` for SQLite | Use table rebuild pattern |
| Not checking if columns exist before adding | Make migrations idempotent |
| Including optional tables in validation | Only validate core tables |
| Assuming table schema without checking entity | Always verify actual entity class |
| Using hardcoded column names without testing | Test on all providers |
| Not testing rollback | Test both apply AND rollback |

---

## Files to Update

When creating a new migration that might need special handling:

1. **Migration file itself:** `Backend/Migrations/Branch/YYYYMMDD_MigrationName.cs`
2. **Validation (if adding core tables):** All 4 strategy files in `Backend/Services/Shared/Migrations/`:
   - `SqliteMigrationStrategy.cs`
   - `SqlServerMigrationStrategy.cs`
   - `MySqlMigrationStrategy.cs`
   - `PostgreSqlMigrationStrategy.cs`

---

## Summary Checklist

Before merging a migration PR, ensure:

- [ ] ✅ Migration uses provider detection (`migrationBuilder.ActiveProvider`)
- [ ] ✅ MySQL version is idempotent (checks for existing columns)
- [ ] ✅ SQL Server version is idempotent (checks for existing columns)
- [ ] ✅ PostgreSQL version is idempotent (checks for existing columns)
- [ ] ✅ SQLite rollback uses table rebuild pattern (if dropping columns)
- [ ] ✅ Actual entity schema verified before writing rollback
- [ ] ✅ Schema validation NOT updated for optional tables
- [ ] ✅ Tested on SQLite (apply + rollback)
- [ ] ✅ Tested on at least one other provider
- [ ] ✅ Build succeeds (0 errors)
- [ ] ✅ Documentation updated if needed

---

## Related Documentation

- **Migration UI User Guide:** `2025-12-21-migration-ui-user-guide.md`
- **SQLite Foreign Key Fix:** `2025-12-12-sqlite-foreign-key-rollback-fix.md`
- **EF Core Migrations:** https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/
- **SQLite Limitations:** https://www.sqlite.org/lang_altertable.html

---

**Last Updated:** 2025-12-22
**Version:** 1.0
**Maintained By:** Development Team

---

## Appendix: Real-World Example

**Issue Encountered:** `20251221180927_AddTableManagementColumns` migration

**Problems Fixed:**
1. ❌ SQLite rollback failed (DropColumn not supported)
2. ❌ MySQL apply failed (duplicate column name)
3. ❌ Validation failed after rollback (checked for DeliveryOrders table)

**Solutions Applied:**
1. ✅ Added SQLite table rebuild pattern in `Down()`
2. ✅ Made `Up()` idempotent for all providers
3. ✅ Updated validation to exclude optional tables

**Result:** Migration now works perfectly on all 4 providers (SQLite, SQL Server, MySQL, PostgreSQL) for both apply and rollback operations.

---

## Recommendations

### 🎯 Top 5 Critical Recommendations

#### 1. **ALWAYS Test Rollback on All Providers**

**Why:** Rollback failures are the #1 cause of production incidents.

**How:**
```bash
# Test rollback on each provider before merging
- SQLite: http://localhost:3000/head-office/migrations → B001 → "Undo Last Migration"
- MySQL: http://localhost:3000/head-office/migrations → MySQL → "Undo Last Migration"
- SQL Server: (if configured) → "Undo Last Migration"
- PostgreSQL: (if configured) → "Undo Last Migration"
```

**Expected Result:** ✅ All should succeed without errors

---

#### 2. **Make All Migrations Idempotent**

**Why:** Partial migration failures happen in production (network issues, crashes, etc.)

**Pattern:**
```csharp
// ✅ GOOD: Idempotent
IF NOT EXISTS (SELECT ... WHERE column_name = 'TableId')
    ALTER TABLE Sales ADD COLUMN TableId INT NULL;

// ❌ BAD: Not idempotent
ALTER TABLE Sales ADD COLUMN TableId INT NULL; -- Fails if column exists
```

**Rule:** All `Up()` methods must be safe to run multiple times.

---

#### 3. **Use Table Rebuild Pattern for SQLite DROP COLUMN**

**Why:** SQLite doesn't support DROP COLUMN natively.

**Pattern:**
```csharp
if (isSQLite)
{
    // 1. Create new table without dropped columns
    // 2. Copy data
    // 3. Drop old table
    // 4. Rename new table
    // 5. Recreate indexes
}
```

**Critical:** Verify entity schema before writing the rebuild script!

---

#### 4. **Never Validate Optional Tables in Schema Validation**

**Why:** Causes rollback failures when migrations that add tables are rolled back.

**Rule:**
```csharp
// ✅ GOOD: Only core tables
var requiredTables = new[] {
    "Users", "Categories", "Products", "Sales", ...
    // Core tables from initial migration ONLY
};

// ❌ BAD: Includes tables from migrations
var requiredTables = new[] {
    "Users", "Categories", "Products", "Sales",
    "DeliveryOrders", "Zones", "Tables" // ← These are from later migrations!
};
```

---

#### 5. **Provider-Specific Code Must Cover All Cases**

**Why:** Forgetting one provider causes production issues.

**Checklist:**
```csharp
if (MySQL) { ... }
else if (SqlServer) { ... }
else if (PostgreSQL) { ... }
else // SQLite fallback
{
    // MUST have a fallback!
}
```

**Rule:** Every provider path must be tested.

---

### 📋 Development Workflow

#### Creating a New Migration

1. **Generate migration:**
   ```bash
   cd Backend
   dotnet ef migrations add YourMigrationName --context BranchDbContext
   ```

2. **Check the generated file:**
   ```bash
   # Review the migration
   cat Backend/Migrations/Branch/YYYYMMDD_YourMigrationName.cs
   ```

3. **Add provider detection if needed:**
   - If adding columns → Make idempotent
   - If dropping columns → Add SQLite table rebuild
   - If creating/dropping tables → Standard approach works

4. **Verify entity schema:**
   ```bash
   # Check the actual entity class
   cat Backend/Models/Entities/Branch/YourEntity.cs
   ```

5. **Test locally:**
   - Apply on fresh SQLite database
   - Apply on existing database (idempotency test)
   - Rollback
   - Re-apply after rollback

6. **Update documentation if needed:**
   - Add to this file if you discover new patterns
   - Update migration UI docs if behavior changes

---

### 🚨 Production Deployment Checklist

Before deploying migrations to production:

- [ ] ✅ Migration tested on all 4 providers locally
- [ ] ✅ Rollback tested on all 4 providers
- [ ] ✅ Schema validation passes after rollback
- [ ] ✅ Build has 0 errors
- [ ] ✅ Idempotent migrations can be re-run safely
- [ ] ✅ Backup plan documented
- [ ] ✅ Database backups created
- [ ] ✅ Rollback plan documented
- [ ] ✅ Monitoring configured
- [ ] ✅ Team notified of deployment

---

### 💡 Pro Tips

#### Tip 1: Use Migration UI for Testing

**Instead of:**
```bash
dotnet ef database update --context BranchDbContext
dotnet ef migrations remove --context BranchDbContext
```

**Use:**
```
http://localhost:3000/head-office/migrations
- Visual feedback
- Tests actual production code path
- Logs available in backend
- Handles all providers automatically
```

---

#### Tip 2: Name Migrations Descriptively

**✅ Good:**
```
20251221180927_AddTableManagementColumnsToSales
20251214100000_AddDeliveryOrderTable
20251217000000_UpdateDeliveryStatusEnum
```

**❌ Bad:**
```
20251221180927_Update
20251214100000_NewChanges
20251217000000_Fix
```

**Why:** Descriptive names help with debugging and rollback decisions.

---

#### Tip 3: Group Related Changes

**✅ Good:**
```
One migration: Add DeliveryOrders table + DeliveryStatus enum + foreign keys
```

**❌ Bad:**
```
Migration 1: Add DeliveryOrders table
Migration 2: Add DeliveryStatus enum
Migration 3: Add foreign keys
```

**Why:** Related changes should succeed/fail together.

---

#### Tip 4: Document Breaking Changes

If a migration changes existing behavior:

```csharp
/// <summary>
/// BREAKING CHANGE: Changes default value of Sale.Status from null to "open"
/// Impact: Existing sales will keep null, new sales will default to "open"
/// Migration: Manual data update required if you want existing sales to have status
/// </summary>
public partial class AddStatusToSales : Migration
```

---

#### Tip 5: Keep a Migration Log

Create a file: `docs/migration-system/MIGRATION-LOG.md`

```markdown
# Migration Log

## 2025-12-22
- **20251221180927_AddTableManagementColumns**
  - Added: TableId, TableNumber, GuestCount, Status, CompletedAt to Sales
  - Fixed: SQLite rollback with table rebuild pattern
  - Fixed: Idempotent apply for all providers
  - Status: ✅ Deployed to all branches

## 2025-12-14
- **20251214100000_AddDeliveryOrderTable**
  - Added: DeliveryOrders table
  - Status: ✅ Deployed
```

---

### 🔧 Debugging Common Issues

#### Issue: "Migration already applied but UI shows pending"

**Cause:** `__EFMigrationsHistory` table out of sync

**Fix:**
```sql
-- Check migration history
SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId;

-- Manually add missing migration record
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
VALUES ('20251221180927_AddTableManagementColumns', '8.0.0');
```

---

#### Issue: "Foreign key constraint failed during rollback"

**Cause:** Data exists with foreign key relationships

**Fix:** Already handled in `SqliteMigrationStrategy.cs`:
```csharp
PRAGMA foreign_keys = OFF;
// ... perform rollback ...
PRAGMA foreign_keys = ON;
```

If still failing, check:
- Are you using the migration UI? ✅
- Or running manual commands? ❌ (Use UI instead)

---

#### Issue: "Table already exists" on fresh database

**Cause:** Migration was partially applied

**Fix:**
```bash
# Delete database and start fresh
rm Backend/Upload/Branches/B001/Database/B001.db

# Restart backend
cd Backend && dotnet run
```

---

### 📊 Performance Considerations

#### Large Table Migrations

For tables with millions of rows:

**✅ Good:**
```csharp
// Add column with default value
ALTER TABLE Sales ADD COLUMN Status VARCHAR(20) DEFAULT 'open';

// Update in batches (optional, for specific values)
-- Update logic in application code, not migration
```

**❌ Bad:**
```csharp
// Update all rows in migration (locks table)
UPDATE Sales SET Status = 'open'; -- DON'T DO THIS in migration!
```

**Why:** Migrations should be fast. Data updates should be in application code or separate scripts.

---

#### Index Creation

**✅ Good:**
```csharp
// Create index after adding column
migrationBuilder.AddColumn<int>("TableId", "Sales");
migrationBuilder.CreateIndex("IX_Sales_TableId", "Sales", "TableId");
```

**❌ Bad:**
```csharp
// Create index on large table without consideration
CREATE INDEX ON Sales(LargeTextColumn); -- May take hours!
```

**Tip:** Test index creation time on production-sized data first.

---

### 🎓 Learning Resources

#### Entity Framework Core

- **Migrations Overview:** https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/
- **Custom SQL in Migrations:** https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/managing#arbitrary-changes-via-raw-sql
- **Provider-Specific Code:** https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/providers

#### Database-Specific

- **SQLite Limitations:** https://www.sqlite.org/lang_altertable.html
- **MySQL Migration Best Practices:** https://dev.mysql.com/doc/refman/8.0/en/alter-table.html
- **PostgreSQL DDL:** https://www.postgresql.org/docs/current/ddl-alter.html
- **SQL Server Migrations:** https://docs.microsoft.com/en-us/sql/relational-databases/tables/modify-columns-database-engine

---

### 📞 When to Ask for Help

**Seek code review if:**
- Migration modifies table with > 1M rows
- Migration includes data updates
- Migration changes core tables (Users, Sales, etc.)
- Migration requires downtime
- Rollback is complex (multiple table rebuild)
- You're unsure about provider compatibility

**Don't hesitate to:**
- Ask questions in team chat
- Request pair programming for complex migrations
- Test on staging environment first
- Document edge cases you discover

---

**Remember:** When in doubt, follow this document! It contains proven patterns from real production issues.

---

## Quick Start Guide (TL;DR)

**For a new migration:**

1. ✅ Generate: `dotnet ef migrations add YourName --context BranchDbContext`
2. ✅ Check entity: `cat Backend/Models/Entities/Branch/YourEntity.cs`
3. ✅ Add provider detection if modifying columns
4. ✅ Make idempotent for MySQL/SQL Server/PostgreSQL
5. ✅ Use table rebuild for SQLite DROP COLUMN
6. ✅ Test apply on all providers
7. ✅ Test rollback on all providers
8. ✅ Verify schema validation passes
9. ✅ Commit and deploy

**Files to check:**
- Migration file: `Backend/Migrations/Branch/YYYYMMDD_Name.cs`
- Entity: `Backend/Models/Entities/Branch/YourEntity.cs`
- Validation (if needed): All 4 strategy files

**Commands:**
- Apply: Use Migration UI at `http://localhost:3000/head-office/migrations`
- Rollback: Use Migration UI → "Undo Last Migration"
- Verify: Use Migration UI → "Validate Schema"

**Key Rules:**
1. Provider detection: `migrationBuilder.ActiveProvider`
2. Idempotent: Check if exists before adding
3. SQLite: Table rebuild for DROP COLUMN
4. Validation: Only core tables
5. Test: All providers + rollback

**Done!** 🎉
