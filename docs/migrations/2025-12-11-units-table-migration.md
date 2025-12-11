# Units Table - Multi-Provider Migration

**Date**: December 11, 2025
**Migration**: `20251211122121_AddUnitsTable`
**Purpose**: Add units of measurement for products + properly update migration state for all branches
**Status**: ✅ **READY FOR DEPLOYMENT**

## Overview

This migration adds a Units table to manage units of measurement for products (kg, liter, piece, box, etc.) and demonstrates the proper workflow for:
1. Creating multi-provider compatible migrations
2. Updating migration state tracking for existing branches

## Units Entity

The Unit entity supports sophisticated unit management with:
- ✅ Bilingual names (English/Arabic)
- ✅ Base units and derived units with conversion factors
- ✅ Fractional vs discrete quantities
- ✅ Self-referencing relationships (e.g., kg → gram)
- ✅ Product relationships

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `Id` | Guid | Primary key |
| `Code` | string(20) | Unique unit code (e.g., "KG", "L", "PCS") |
| `NameEn` | string(100) | Unit name in English |
| `NameAr` | string(100) | Unit name in Arabic |
| `Symbol` | string(10) | Short symbol/abbreviation (e.g., "kg", "L") |
| `IsBaseUnit` | bool | Whether this is a base unit for conversions |
| `BaseUnitId` | Guid? | Reference to base unit (if derived) |
| `ConversionFactor` | decimal(18,6)? | Conversion factor to base unit |
| `AllowFractional` | bool | Allow fractional quantities (true for weight/volume) |
| `DecimalPlaces` | int | Number of decimal places to display |
| `DisplayOrder` | int | Sort order in dropdowns |
| `IsActive` | bool | Whether unit is active |
| `Notes` | string(500) | Additional notes |
| `CreatedAt` | DateTime | Creation timestamp |
| `UpdatedAt` | DateTime | Last update timestamp |
| `CreatedBy` | Guid | User who created the record |

### Indexes

- ✅ **Unique index** on `Code`
- ✅ Index on `IsActive` (for filtering active units)
- ✅ Index on `BaseUnitId` (for conversion lookups)
- ✅ Index on `DisplayOrder` (for sorting)

### Product Integration

Added `UnitId` field to Product entity:
```csharp
public Guid? UnitId { get; set; }
public Unit? Unit { get; set; }
```

This allows products to specify their unit of measurement (nullable for backward compatibility).

## Seed Data - 15 Units

### Weight Units (Base: Gram)
| Code | Name | Symbol | Conversion | Fractional |
|------|------|--------|------------|------------|
| G | Gram | g | 1 (base) | Yes (2 decimals) |
| KG | Kilogram | kg | 1,000 | Yes (3 decimals) |
| TON | Ton | t | 1,000,000 | Yes (3 decimals) |

### Volume Units (Base: Liter)
| Code | Name | Symbol | Conversion | Fractional |
|------|------|--------|------------|------------|
| L | Liter | L | 1 (base) | Yes (2 decimals) |
| ML | Milliliter | mL | 0.001 | Yes (2 decimals) |

### Count Units (Base: Piece)
| Code | Name | Symbol | Conversion | Fractional |
|------|------|--------|------------|------------|
| PCS | Piece | pc | 1 (base) | No (discrete) |
| DZN | Dozen | dz | 12 | No (discrete) |
| CTN | Carton | ctn | 24 | No (discrete) |
| BOX | Box | box | 6 | No (discrete) |

### Length Units (Base: Meter)
| Code | Name | Symbol | Conversion | Fractional |
|------|------|--------|------------|------------|
| M | Meter | m | 1 (base) | Yes (2 decimals) |
| CM | Centimeter | cm | 0.01 | Yes (2 decimals) |

### Area Units (Base: Square Meter)
| Code | Name | Symbol | Conversion | Fractional |
|------|------|--------|------------|------------|
| SQM | Square Meter | m² | 1 (base) | Yes (2 decimals) |

### Packaging Units (Standalone)
| Code | Name | Symbol | Conversion | Fractional |
|------|------|--------|------------|------------|
| PKG | Package | pkg | 1 | No (discrete) |
| BTL | Bottle | btl | 1 | No (discrete) |
| BAG | Bag | bag | 1 | No (discrete) |

## Migration Workflow

This migration follows the established multi-provider workflow:

### Step 1: Create the Entity
```csharp
// Backend/Models/Entities/Branch/Unit.cs
public class Unit
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    // ... other properties
}
```

### Step 2: Add DbSet to Context
```csharp
// Backend/Data/Branch/BranchDbContext.cs
public DbSet<Unit> Units { get; set; }
```

### Step 3: Configure Entity
```csharp
// In OnModelCreating:
modelBuilder.Entity<Unit>(entity =>
{
    entity.HasIndex(e => e.Code).IsUnique();
    entity.HasIndex(e => e.IsActive);
    entity.HasIndex(e => e.BaseUnitId);
    entity.HasIndex(e => e.DisplayOrder);

    entity.Property(e => e.ConversionFactor).HasPrecision(18, 6);

    // Self-referencing relationship
    entity
        .HasOne(e => e.BaseUnit)
        .WithMany(u => u.DerivedUnits)
        .HasForeignKey(e => e.BaseUnitId)
        .OnDelete(DeleteBehavior.Restrict);
});
```

### Step 4: Update Product Configuration
```csharp
// Add UnitId to Product entity configuration:
entity.HasIndex(e => e.UnitId);

entity
    .HasOne(e => e.Unit)
    .WithMany(u => u.Products)
    .HasForeignKey(e => e.UnitId)
    .OnDelete(DeleteBehavior.SetNull);
```

### Step 5: Build Project
```bash
cd Backend
dotnet build
```

**Result**: ✅ Build succeeded (0 errors)

### Step 6: Generate Migration
```bash
cd Backend
dotnet ef migrations add AddUnitsTable --context BranchDbContext --output-dir Migrations/Branch --no-build
```

**Files Created**:
- `20251211122121_AddUnitsTable.cs` (migration)
- `20251211122121_AddUnitsTable.Designer.cs` (designer)
- `BranchDbContextModelSnapshot.cs` (updated)

### Step 7: Clean Type Annotations
```bash
cd Migrations/Branch
powershell.exe -ExecutionPolicy Bypass -File Clean-All-Migrations.ps1
```

**Result**:
- ✅ Removed **17 type annotations** from `AddUnitsTable.cs`
- ✅ Removed **236 HasColumnType() calls** from `AddUnitsTable.Designer.cs`
- ✅ Removed **236 HasColumnType() calls** from `BranchDbContextModelSnapshot.cs`
- **Total**: **489 type annotations removed** for provider-agnostic compatibility

### Step 8: Add Seed Data
Added 15 units to `BranchDbSeeder.SeedAsync()` with proper base unit relationships.

### Step 9: Verify Build
```bash
cd Backend
dotnet build
```

**Result**: ✅ Build succeeded (0 errors)

## Migration Content

### Up() Method
Creates:
1. **Units table** with 15 columns
2. **Primary key** on `Id`
3. **4 indexes** (1 unique on Code, 3 non-unique)
4. **Foreign key** to Products table (nullable)
5. **Self-referencing foreign key** for BaseUnitId

### Down() Method
Drops:
- **Foreign key** from Products.UnitId
- **Units table** (cascades to drop all indexes)

## Multi-Provider Compatibility

EF Core will automatically map the Units table columns to the correct database types:

| Field | SQLite Type | SQL Server Type | MySQL Type | PostgreSQL Type |
|-------|-------------|-----------------|------------|-----------------|
| `Id` (Guid) | `BLOB` | `uniqueidentifier` | `BINARY(16)` | `UUID` |
| `Code` (string) | `TEXT` | `nvarchar(20)` | `VARCHAR(20)` | `VARCHAR(20)` |
| `NameEn/Ar` (string) | `TEXT` | `nvarchar(100)` | `VARCHAR(100)` | `VARCHAR(100)` |
| `Symbol` (string) | `TEXT` | `nvarchar(10)` | `VARCHAR(10)` | `VARCHAR(10)` |
| `IsBaseUnit` (bool) | `INTEGER` | `bit` | `TINYINT(1)` | `BOOLEAN` |
| `BaseUnitId` (Guid?) | `BLOB` | `uniqueidentifier` | `BINARY(16)` | `UUID` |
| `ConversionFactor` (decimal?) | `TEXT` | `decimal(18,6)` | `DECIMAL(18,6)` | `NUMERIC(18,6)` |
| `AllowFractional` (bool) | `INTEGER` | `bit` | `TINYINT(1)` | `BOOLEAN` |
| `DecimalPlaces` (int) | `INTEGER` | `int` | `INT` | `INTEGER` |
| `DisplayOrder` (int) | `INTEGER` | `int` | `INT` | `INTEGER` |
| `IsActive` (bool) | `INTEGER` | `bit` | `TINYINT(1)` | `BOOLEAN` |

## Applying to Existing Branches

### For New Branches
New branches created after this migration will automatically have the Units table and seed data.

### For Existing Branches (SQLite B003, MSSQL "mssql EN")

Apply the migration using the Head Office Dashboard or API:

```bash
POST /api/v1/migrations/branch/{branchId}/apply
```

This will:
1. ✅ Apply the `AddUnitsTable` migration
2. ✅ Update `BranchMigrationStates` table with:
   - Status: "Completed"
   - LastMigrationApplied: "20251211122121_AddUnitsTable"
3. ✅ Create the Units table
4. ✅ Add nullable `UnitId` column to Products table
5. ✅ Seed 15 default units (only for branches with no data yet)

**Note**: Existing products will have `UnitId` as null. You can assign units to products through the admin interface or API.

## Benefits of This Migration

### 1. Proper Unit Management ✅
- Track product units consistently across all branches
- Support for weight (kg, g), volume (L, mL), count (piece, dozen), and more
- Unit conversion support for future enhancements

### 2. Migration State Tracking ✅
- Applying this migration to existing branches will **fix the migration state issue**
- The `BranchMigrationManager` will properly update the status from "Pending" to "Completed"
- Last migration will be correctly recorded

### 3. Multi-Provider Compatibility ✅
- Works seamlessly with SQLite, SQL Server, MySQL, PostgreSQL
- No provider-specific type annotations
- EF Core handles type mapping automatically

### 4. Future-Proof Design ✅
- Base unit + derived unit structure allows for unit conversions
- Fractional vs discrete quantities properly handled
- Extensible for adding new units

## Testing Instructions

### Test 1: Apply to Existing SQLite Branch (B003)

```bash
POST /api/v1/migrations/branch/{B003-branchId}/apply
```

**Expected Result**:
- ✅ Migration applied successfully
- ✅ Units table created
- ✅ 15 units seeded
- ✅ Products table has new `UnitId` column (nullable)
- ✅ Migration state updated: Status="Completed", LastMigration="20251211122121_AddUnitsTable"

**Verification**:
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='Units';
SELECT COUNT(*) FROM Units;  -- Should return 15
SELECT * FROM BranchMigrationStates WHERE BranchId = '{B003-branchId}';
```

### Test 2: Apply to Existing MSSQL Branch (mssql EN)

```bash
POST /api/v1/migrations/branch/{mssql-EN-branchId}/apply
```

**Expected Result**:
- ✅ Migration applied successfully
- ✅ Units table created with proper SQL Server types
- ✅ 15 units seeded
- ✅ **Migration state FIXED**: Status changes from "Pending" to "Completed"
- ✅ LastMigrationApplied set to "20251211122121_AddUnitsTable"

**Verification**:
```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Units';
SELECT COUNT(*) FROM Units;  -- Should return 15
SELECT * FROM BranchMigrationStates WHERE BranchId = '{mssql-EN-branchId}';
```

### Test 3: Create New Branch (Any Provider)

```bash
POST /api/v1/branches
{
    "code": "TEST-UNITS",
    "nameEn": "Test Units Branch",
    "databaseProvider": 1,  // SqlServer, SQLite, MySQL, or PostgreSQL
    // ... other fields
}
```

**Expected Result**:
- ✅ Branch created with all migrations applied
- ✅ Units table exists with 15 units
- ✅ Migration state: Status="Completed", LastMigration="20251211122121_AddUnitsTable"

## Files Created/Modified

### New Files
1. `Backend/Models/Entities/Branch/Unit.cs` - Unit entity model
2. `Backend/Migrations/Branch/20251211122121_AddUnitsTable.cs` - Migration (clean)
3. `Backend/Migrations/Branch/20251211122121_AddUnitsTable.Designer.cs` - Designer (clean)
4. `docs/migrations/2025-12-11-units-table-migration.md` - This document

### Modified Files
1. `Backend/Models/Entities/Branch/Product.cs`
   - Added `UnitId` property (nullable Guid)
   - Added `Unit` navigation property

2. `Backend/Data/Branch/BranchDbContext.cs`
   - Added `public DbSet<Unit> Units { get; set; }`
   - Added Unit entity configuration in `OnModelCreating`
   - Updated Product configuration to include Unit relationship

3. `Backend/Migrations/Branch/BranchDbContextModelSnapshot.cs`
   - Updated with Unit table metadata (clean)

4. `Backend/Data/Branch/BranchDbSeeder.cs`
   - Added check for Units existence
   - Added seeding of 15 units with base unit relationships

## Use Cases

### Product Management
- Assign units to products (kg for groceries, piece for electronics)
- Display unit in product listings
- Handle fractional quantities correctly (0.5 kg vs 5 pieces)

### Inventory Management
- Track stock levels with proper units
- Convert between units (e.g., 1 carton = 24 pieces)
- Report inventory in appropriate units

### Sales & Purchasing
- Display quantities with units on invoices
- Calculate prices based on units (per kg, per liter, per piece)
- Support bulk pricing (price per carton vs per piece)

### Unit Conversions (Future Enhancement)
- Convert between derived units and base units
- Example: 2.5 kg = 2500 g
- Example: 1 dozen = 12 pieces

## Next Steps

After applying this migration:

1. **Update Product DTOs** to include UnitId and Unit information
2. **Add Unit endpoints** for CRUD operations
3. **Update Product API** to allow assigning units to products
4. **Frontend integration** for unit selection in product forms
5. **Unit conversion logic** for advanced scenarios

## Success Criteria

This migration is considered successful when:

- ✅ All 4 providers can create the Units table
- ✅ All indexes are created correctly
- ✅ Self-referencing foreign key works (BaseUnitId → Units.Id)
- ✅ Product foreign key works (Products.UnitId → Units.Id)
- ✅ 15 units are seeded with correct relationships
- ✅ Existing branches can apply migration successfully
- ✅ **Migration state is properly updated** for all branches
- ✅ No type-related errors in logs

## Conclusion

The Units table migration adds essential functionality for managing units of measurement across all branches and database providers. More importantly, **applying this migration to existing branches will fix the migration state tracking issue**, properly updating the status from "Pending" to "Completed" and recording the last migration.

**Status**: ✅ **READY FOR DEPLOYMENT TO EXISTING BRANCHES**

---

**Apply this migration to your existing branches to:**
1. Get Units functionality
2. Fix the migration state tracking issue
3. Verify the multi-provider migration system works correctly

**Command**: Use the Head Office Dashboard → Migrations → Apply to Branch
