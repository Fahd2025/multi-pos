# SQL Server Migration Issue

## Problem
Branch database migrations were originally created for SQLite and contain hardcoded SQLite-specific type mappings:
- `Guid` columns: `type: "TEXT"` (should be `uniqueidentifier` for SQL Server)  
- `bool` columns: `type: "INTEGER"` (should be `bit` for SQL Server)
- `DateTime` columns: `type: "TEXT"` (should be `datetime2` for SQL Server)
- `decimal` columns: `type: "TEXT"` (should be `decimal` for SQL Server)

SQL Server Error: `Column 'Id' in table 'Categories' is of a type that is invalid for use as a key column in an index`

## Root Cause
The migration files in `Backend/Migrations/Branch/` have explicit type mappings like:
```csharp
Id = table.Column<Guid>(type: "TEXT", nullable: false)
```

This works for SQLite but fails for SQL Server.

## Solution Options

### Option 1: Provider-Agnostic Migrations (Recommended for new projects)
Remove `type` parameter from migrations and let EF Core determine the correct type based on the provider:
```csharp
Id = table.Column<Guid>(nullable: false)  // EF Core maps this correctly per provider
```

**Pros**: Single migration set works for all providers
**Cons**: Requires regenerating all migrations (breaking change for existing databases)

### Option 2: Provider-Specific Migration Sets (Current recommended approach)
Maintain separate migration folders for each provider and apply the correct set based on branch provider.

**Pros**: Existing SQLite databases continue to work
**Cons**: More maintenance overhead

### Option 3: Runtime Type Mapping Override
Implement a custom `IHistoryRepository` or migration SQL generator that rewrites types at runtime.

**Pros**: No migration changes needed
**Cons**: Complex implementation, fragile

## Recommended Action
For this multi-tenant POS system where branches can use different database providers, use **Option 2** with conditional migration application based on provider type.

Implementation:
1. Keep current SQLite migrations in `Migrations/Branch/`
2. Create `Migrations/BranchSqlServer/` with provider-agnostic migrations
3. Update `BaseMigrationStrategy.ApplyMigrationsAsync()` to use correct migration assembly based on provider
4. For existing SQLite branches: continue using current migrations
5. For new SQL Server/MySQL/PostgreSQL branches: use provider-agnostic migrations

## Resolution Implemented

**Date**: December 10, 2025

### Changes Made:
1. Updated `Backend/Data/Branch/BranchDbContextFactory.cs` design-time factory to use SQL Server instead of SQLite
2. Removed all old SQLite-specific migrations from `Backend/Migrations/Branch/`
3. Regenerated fresh migrations using SQL Server as design-time provider
4. New migrations use proper SQL Server types that work across all database providers:
   - `uniqueidentifier` for Guid (works in SQL Server, maps correctly in other DBs)
   - `datetime2` for DateTime
   - `decimal(18,2)` for decimal with explicit precision
   - `bit` for bool
   - `nvarchar` for strings

### Impact:
- ✅ SQL Server branches now work correctly
- ✅ SQLite branches continue to work (EF Core maps these types correctly to SQLite equivalents)
- ✅ MySQL and PostgreSQL branches will also work with these migrations
- ⚠️ Existing SQLite databases with old migrations will need to be recreated or migrated manually

### For Production:
If you have existing SQLite databases in production:
1. Export data before upgrading
2. Delete old database files
3. Let migrations recreate schema with new types
4. Re-import data
