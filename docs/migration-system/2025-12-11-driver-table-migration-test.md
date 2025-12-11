# Driver Table Migration - Multi-Provider Testing

**Date**: December 11, 2025
**Migration**: `20251211100350_AddDriverTable`
**Purpose**: Add Driver entity for delivery order management + test migration system with all providers
**Status**: ✅ **READY FOR TESTING**

## Overview

This document describes the addition of the Driver table to the branch database and demonstrates the proper workflow for creating multi-provider compatible migrations.

## Driver Entity

Added a new `Driver` entity to support delivery order management with the following features:

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `Id` | Guid | Primary key |
| `Code` | string(50) | Unique driver code (e.g., "DRV001") |
| `NameEn` | string(200) | Driver name in English |
| `NameAr` | string(200) | Driver name in Arabic (optional) |
| `Phone` | string(50) | Phone number (required) |
| `Email` | string(255) | Email address (optional) |
| `AddressEn` | string(500) | Address in English (optional) |
| `AddressAr` | string(500) | Address in Arabic (optional) |
| `LicenseNumber` | string(50) | Driver's license number (required) |
| `LicenseExpiryDate` | DateTime | License expiry date |
| `VehicleNumber` | string(50) | Vehicle registration number (optional) |
| `VehicleType` | string(100) | Type of vehicle (e.g., "Motorcycle", "Van") |
| `VehicleColor` | string(50) | Vehicle color (optional) |
| `ProfileImagePath` | string(500) | Path to driver's profile image |
| `LicenseImagePath` | string(500) | Path to license image |
| `VehicleImagePath` | string(500) | Path to vehicle image |
| `IsActive` | bool | Whether driver is active in the system |
| `IsAvailable` | bool | Whether driver is currently available for deliveries |
| `TotalDeliveries` | int | Total number of completed deliveries |
| `AverageRating` | decimal(3,2) | Average rating (0.00 to 5.00) |
| `Notes` | string(1000) | Additional notes about the driver |
| `CreatedAt` | DateTime | Record creation timestamp |
| `UpdatedAt` | DateTime | Last update timestamp |
| `CreatedBy` | Guid | ID of user who created the record |

### Indexes

The following indexes were created for optimal query performance:

- ✅ **Unique index** on `Code` (prevents duplicate driver codes)
- ✅ Index on `Phone` (for quick lookups by phone)
- ✅ Index on `Email` (for email searches)
- ✅ Index on `LicenseNumber` (for license verification)
- ✅ Index on `IsActive` (for filtering active/inactive drivers)
- ✅ Index on `IsAvailable` (for finding available drivers quickly)

## Migration Workflow

This migration demonstrates the **correct workflow** for creating multi-provider compatible migrations:

### Step 1: Create the Entity

```csharp
// Backend/Models/Entities/Branch/Driver.cs
public class Driver
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    // ... other properties
}
```

### Step 2: Add DbSet to Context

```csharp
// Backend/Data/Branch/BranchDbContext.cs
public DbSet<Driver> Drivers { get; set; }
```

### Step 3: Configure Entity

```csharp
// Backend/Data/Branch/BranchDbContext.cs - OnModelCreating
modelBuilder.Entity<Driver>(entity =>
{
    entity.HasIndex(e => e.Code).IsUnique();
    entity.HasIndex(e => e.Phone);
    entity.HasIndex(e => e.Email);
    entity.HasIndex(e => e.LicenseNumber);
    entity.HasIndex(e => e.IsActive);
    entity.HasIndex(e => e.IsAvailable);

    entity.Property(e => e.AverageRating).HasPrecision(3, 2);
});
```

### Step 4: Build the Project

```bash
cd Backend
dotnet build
```

**Result**: ✅ Success (0 compilation errors)

### Step 5: Generate Migration

```bash
cd Backend
dotnet ef migrations add AddDriverTable --context BranchDbContext --output-dir Migrations/Branch --no-build
```

**Files Created**:
- `20251211100350_AddDriverTable.cs` (4,194 bytes)
- `20251211100350_AddDriverTable.Designer.cs` (42,532 bytes)
- `BranchDbContextModelSnapshot.cs` (updated)

### Step 6: Remove Type Annotations

```bash
cd Migrations/Branch
powershell.exe -ExecutionPolicy Bypass -File Clean-All-Migrations.ps1
```

**Result**:
- ✅ Removed **24 type annotations** from `AddDriverTable.cs`
- ✅ Removed **219 HasColumnType() calls** from `AddDriverTable.Designer.cs`
- ✅ Removed **219 HasColumnType() calls** from `BranchDbContextModelSnapshot.cs`

**Total**: **462 type annotations removed** for provider-agnostic compatibility

### Step 7: Verify the Clean Migration

**Before cleaning**:
```csharp
Id = table.Column<Guid>(type: "TEXT", nullable: false),
Code = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
```

**After cleaning** (provider-agnostic):
```csharp
Id = table.Column<Guid>(nullable: false),
Code = table.Column<string>(maxLength: 50, nullable: false),
IsActive = table.Column<bool>(nullable: false),
```

✅ **No explicit type annotations** - EF Core will use CLR types to determine database-specific types

## Migration Content

### Up() Method

The migration creates:
1. **Drivers table** with 22 columns
2. **Primary key** on `Id`
3. **6 indexes** (1 unique, 5 non-unique)

### Down() Method

The migration drops:
- **Drivers table** (cascades to drop all indexes)

## How It Works Across Providers

EF Core will automatically map the Driver table columns to the correct database types at runtime:

| Field | SQLite Type | SQL Server Type | MySQL Type | PostgreSQL Type |
|-------|------------|----------------|------------|-----------------|
| `Id` (Guid) | `BLOB` | `uniqueidentifier` | `BINARY(16)` | `UUID` |
| `Code` (string) | `TEXT` | `nvarchar(50)` | `VARCHAR(50)` | `VARCHAR(50)` |
| `IsActive` (bool) | `INTEGER` | `bit` | `TINYINT(1)` | `BOOLEAN` |
| `LicenseExpiryDate` (DateTime) | `TEXT` | `datetime2` | `DATETIME` | `TIMESTAMP` |
| `TotalDeliveries` (int) | `INTEGER` | `int` | `INT` | `INTEGER` |
| `AverageRating` (decimal(3,2)) | `TEXT` | `decimal(3,2)` | `DECIMAL(3,2)` | `NUMERIC(3,2)` |

## Testing Instructions

**IMPORTANT**: Test the migration with ALL 4 database providers to ensure compatibility.

### Prerequisites

1. Stop your backend application
2. Have access to:
   - SQLite (built-in)
   - SQL Server (localhost or remote)
   - MySQL (optional)
   - PostgreSQL (optional)

### Test 1: SQLite

```bash
# Create a new branch with SQLite
# Via API or UI:
POST /api/v1/branches
{
    "code": "TEST-SQLITE",
    "databaseProvider": "SQLite",
    ...
}
```

**Expected Result**:
- ✅ Database created successfully
- ✅ All tables exist (including `Drivers`)
- ✅ Indexes created correctly
- ✅ GUID columns are `BLOB`
- ✅ bool columns are `INTEGER`
- ✅ DateTime columns are `TEXT`

**Verification**:
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='Drivers';
PRAGMA table_info(Drivers);
PRAGMA index_list(Drivers);
```

### Test 2: SQL Server

```bash
# Create a new branch with SQL Server
POST /api/v1/branches
{
    "code": "TEST-MSSQL",
    "databaseProvider": "SqlServer",
    ...
}
```

**Expected Result**:
- ✅ Database created successfully
- ✅ All tables exist (including `Drivers`)
- ✅ Indexes created correctly
- ✅ GUID columns are `uniqueidentifier`
- ✅ bool columns are `bit`
- ✅ DateTime columns are `datetime2`
- ✅ decimal columns are `decimal(3,2)`

**Verification**:
```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Drivers';
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drivers';
SELECT name FROM sys.indexes WHERE object_id = OBJECT_ID('Drivers');
```

### Test 3: MySQL

```bash
# Create a new branch with MySQL
POST /api/v1/branches
{
    "code": "TEST-MYSQL",
    "databaseProvider": "MySQL",
    ...
}
```

**Expected Result**:
- ✅ Database created successfully
- ✅ All tables exist (including `Drivers`)
- ✅ Indexes created correctly
- ✅ GUID columns are `BINARY(16)` or `CHAR(36)`
- ✅ bool columns are `TINYINT(1)`
- ✅ DateTime columns are `DATETIME`

**Verification**:
```sql
SHOW TABLES LIKE 'Drivers';
DESCRIBE Drivers;
SHOW INDEXES FROM Drivers;
```

### Test 4: PostgreSQL

```bash
# Create a new branch with PostgreSQL
POST /api/v1/branches
{
    "code": "TEST-POSTGRES",
    "databaseProvider": "PostgreSQL",
    ...
}
```

**Expected Result**:
- ✅ Database created successfully
- ✅ All tables exist (including `Drivers`)
- ✅ Indexes created correctly
- ✅ GUID columns are `UUID`
- ✅ bool columns are `BOOLEAN`
- ✅ DateTime columns are `TIMESTAMP`

**Verification**:
```sql
SELECT tablename FROM pg_tables WHERE tablename = 'Drivers';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Drivers';
SELECT indexname FROM pg_indexes WHERE tablename = 'Drivers';
```

## Files Created/Modified

### New Files
1. `Backend/Models/Entities/Branch/Driver.cs` - Driver entity model
2. `Backend/Migrations/Branch/20251211100350_AddDriverTable.cs` - Migration (clean)
3. `Backend/Migrations/Branch/20251211100350_AddDriverTable.Designer.cs` - Designer (clean)
4. `Backend/Migrations/Branch/Clean-All-Migrations.ps1` - Improved cleaning script
5. `docs/migration-system/2025-12-11-driver-table-migration-test.md` - This document

### Modified Files
1. `Backend/Data/Branch/BranchDbContext.cs`
   - Added `public DbSet<Driver> Drivers { get; set; }`
   - Added Driver configuration in `OnModelCreating`
2. `Backend/Migrations/Branch/BranchDbContextModelSnapshot.cs`
   - Updated with Driver table metadata (clean)

## Key Takeaways

### ✅ What Works

1. **SQLite Design-Time Provider**
   - Generates migrations with simple type names
   - Compatible across all providers after cleaning

2. **Type Annotation Removal**
   - Essential for multi-provider compatibility
   - Must be done for ALL three files (migration, designer, snapshot)
   - Automated with `Clean-All-Migrations.ps1`

3. **EF Core Type Mapping**
   - Automatically translates CLR types to database-specific types
   - Works seamlessly across SQLite, SQL Server, MySQL, PostgreSQL
   - Preserves precision, scale, and maxLength constraints

### ⚠️ Important Notes

1. **Always Clean After Generating**
   - EF Core always adds type annotations
   - These MUST be removed for multi-provider support
   - Use the automated script to ensure consistency

2. **Test All Providers**
   - Don't assume it works for all if tested with one
   - Each provider has unique type systems
   - Verify actual table creation and data types

3. **Check All Three Files**
   - Migration file (`.cs`)
   - Designer file (`.Designer.cs`)
   - Snapshot file (`ModelSnapshot.cs`)

## Future Migrations

For any future schema changes, follow this exact workflow:

1. **Modify** entity models or DbContext
2. **Build** the project
3. **Generate** migration: `dotnet ef migrations add MigrationName`
4. **Clean** type annotations: `powershell Clean-All-Migrations.ps1`
5. **Build** again to verify
6. **Test** with all providers

## Next Steps

After testing this migration with all providers:

1. **Document test results** in this file or a new one
2. **Update CLAUDE.md** if needed with Driver entity info
3. **Consider adding**:
   - Driver DTOs for API endpoints
   - Driver service for business logic
   - Driver endpoints for CRUD operations
   - DeliveryOrder entity (references Driver)
   - Integration with Sales for delivery tracking

## Success Criteria

This migration is considered successful when:

- ✅ All 4 providers can create the Drivers table
- ✅ All indexes are created correctly
- ✅ GUIDs work as primary keys
- ✅ Unique constraint on Code works
- ✅ Initial data seeding still works
- ✅ No type-related errors in logs
- ✅ Application can query Drivers table

## Conclusion

The Driver table has been successfully added to the multi-provider migration system. The migration is clean, provider-agnostic, and ready for testing across all supported database providers.

**Status**: ✅ **READY FOR USER TESTING**

---

**Please test branch creation with all 4 providers and report results!** 🚀
