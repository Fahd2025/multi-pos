# Creating Multi-Provider Migrations with dotnet ef

**Date:** 2025-12-26
**Purpose:** Complete guide for creating EF Core migrations that work across all database providers
**Status:** ✅ Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Automated Cleanup Script](#automated-cleanup-script)
5. [Verification Checklist](#verification-checklist)
6. [Troubleshooting](#troubleshooting)
7. [Examples](#examples)

---

## Overview

This guide ensures that migrations created with `dotnet ef` work correctly on **all supported database providers** (SQLite, SQL Server, MySQL, PostgreSQL) for both **apply** and **rollback** operations.

### Supported Providers

| Provider | Branch Type | GUID Type | Primary Use |
|----------|-------------|-----------|-------------|
| **SQLite** | B001, B002, B003 | `TEXT` | Development branches |
| **SQL Server** | Production | `UNIQUEIDENTIFIER` | Production branches |
| **MySQL** | Production | `CHAR(36)` | Production branches |
| **PostgreSQL** | Production | `UUID` | Production branches |

---

## The Problem

### Root Cause

The `BranchDbContextFactory` (used by EF Core at design-time) is configured to use **SQLite**:

```csharp
// Backend/Data/Branch/BranchDbContextFactory.cs
public BranchDbContext CreateDbContext(string[] args)
{
    var optionsBuilder = new DbContextOptionsBuilder<BranchDbContext>();

    // Use SQLite for design-time migrations (universally available)
    optionsBuilder.UseSqlite("Data Source=design_time_branch.db");

    return new BranchDbContext(optionsBuilder.Options);
}
```

### What Goes Wrong

When you run `dotnet ef migrations add`, EF Core generates:

1. **Migration file** (`.cs`) - May contain SQLite-specific types like `type: "TEXT"`
2. **Designer file** (`.Designer.cs`) - Contains `.HasColumnType("TEXT")` for all properties

These SQLite-specific type annotations **prevent other providers from using their native types**:

**❌ With Explicit Types:**
```csharp
// Migration file
Id = table.Column<Guid>(type: "TEXT", nullable: false)

// Designer file
b.Property<Guid>("Id")
    .ValueGeneratedOnAdd()
    .HasColumnType("TEXT");  // ← Forces SQLite type on all providers!
```

**Result on SQL Server:**
```
Column 'Id' in table 'PendingOrders' is of a type that is invalid
for use as a key column in an index.
```

**✅ Without Explicit Types:**
```csharp
// Migration file
Id = table.Column<Guid>(nullable: false)

// Designer file
b.Property<Guid>("Id")
    .ValueGeneratedOnAdd();  // ← No .HasColumnType(), EF maps to native type!
```

**Result:** Works on all providers! 🎉

---

## Step-by-Step Guide

### Step 1: Create the Migration

```bash
cd Backend
dotnet ef migrations add YourMigrationName --context BranchDbContext
```

**Example:**
```bash
dotnet ef migrations add AddPendingOrdersTables --context BranchDbContext
```

**Output:**
```
Build started...
Build succeeded.
Done. To undo this action, use 'ef migrations remove'
```

### Step 2: Locate the Generated Files

```bash
ls Migrations/Branch/ | grep YourMigrationName
```

**You'll see two files:**
```
20251226045335_YourMigrationName.cs
20251226045335_YourMigrationName.Designer.cs
```

### Step 3: Remove SQLite-Specific Types

**⚠️ CRITICAL STEP** - Remove all `.HasColumnType()` calls from the Designer file:

```powershell
# PowerShell command
cd Backend
$content = Get-Content 'Migrations/Branch/YYYYMMDDHHMMSS_YourMigrationName.Designer.cs' -Raw
$content = $content -replace '\s*\.HasColumnType\([^)]+\)', ''
Set-Content 'Migrations/Branch/YYYYMMDDHHMMSS_YourMigrationName.Designer.cs' -Value $content -NoNewline
Write-Host "✅ Removed all HasColumnType calls from Designer file"
```

**Replace `YYYYMMDDHHMMSS` with your actual migration timestamp.**

### Step 4: Verify Migration File

Open `YYYYMMDDHHMMSS_YourMigrationName.cs` and verify:

**✅ Good - Provider-Neutral:**
```csharp
migrationBuilder.CreateTable(
    name: "YourTable",
    columns: table => new
    {
        Id = table.Column<Guid>(nullable: false),  // ✅ No type:
        Name = table.Column<string>(maxLength: 200, nullable: false),
        CreatedAt = table.Column<DateTime>(nullable: false),
        Price = table.Column<decimal>(precision: 18, scale: 2, nullable: false)
    },
    constraints: table =>
    {
        table.PrimaryKey("PK_YourTable", x => x.Id);
    });
```

**❌ Bad - SQLite-Specific:**
```csharp
migrationBuilder.CreateTable(
    name: "YourTable",
    columns: table => new
    {
        Id = table.Column<Guid>(type: "TEXT", nullable: false),  // ❌ SQLite type
        Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
        CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
        Price = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
    },
    // ...
```

**If you see `type: "TEXT"` or `type: "INTEGER"`**, manually remove them:

```csharp
// Before
Id = table.Column<Guid>(type: "TEXT", nullable: false),

// After
Id = table.Column<Guid>(nullable: false),
```

### Step 5: Build and Verify

```bash
dotnet build
```

**Expected output:**
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

### Step 6: Verify No Explicit Types

```bash
# Check migration file
grep -c "type:" Migrations/Branch/YYYYMMDDHHMMSS_YourMigrationName.cs

# Check Designer file
grep -c "HasColumnType" Migrations/Branch/YYYYMMDDHHMMSS_YourMigrationName.Designer.cs
```

**Expected output for both:**
```
0
```

### Step 7: Apply Migration via UI

1. **Start the backend server:**
   ```bash
   dotnet run
   ```

2. **Navigate to Migration UI:**
   ```
   http://localhost:3000/head-office/migrations
   ```

3. **Apply to one branch first (test):**
   - Expand **B001** (SQLite)
   - Click **"Apply Migrations"**
   - Verify: ✅ Success

4. **Apply to all branches:**
   - Click **"Apply All"** button
   - Verify all branches succeed

5. **Test rollback:**
   - Expand **B001**
   - Click **"Undo Last Migration"**
   - Verify: ✅ Success
   - Re-apply: Click **"Apply Migrations"**

---

## Automated Cleanup Script

Create a PowerShell script to automate the cleanup process:

**File:** `Backend/Migrations/Branch/cleanup-migration.ps1`

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$MigrationTimestamp,

    [Parameter(Mandatory=$false)]
    [string]$MigrationName = ""
)

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Multi-Provider Migration Cleanup Script" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Construct filenames
$migrationFile = "${MigrationTimestamp}_${MigrationName}.cs"
$designerFile = "${MigrationTimestamp}_${MigrationName}.Designer.cs"

# Check if files exist
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $designerFile)) {
    Write-Host "❌ Designer file not found: $designerFile" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Processing files:" -ForegroundColor Yellow
Write-Host "   Migration: $migrationFile" -ForegroundColor Gray
Write-Host "   Designer:  $designerFile" -ForegroundColor Gray
Write-Host ""

# Step 1: Remove HasColumnType from Designer file
Write-Host "🔧 Step 1: Removing .HasColumnType() from Designer file..." -ForegroundColor Yellow
$designerContent = Get-Content $designerFile -Raw
$originalDesignerLength = $designerContent.Length
$designerContent = $designerContent -replace '\s*\.HasColumnType\([^)]+\)', ''
Set-Content $designerFile -Value $designerContent -NoNewline

$removedDesigner = $originalDesignerLength - $designerContent.Length
Write-Host "   ✅ Removed $removedDesigner characters from Designer file" -ForegroundColor Green

# Step 2: Check for explicit types in Migration file
Write-Host "🔍 Step 2: Checking Migration file for explicit types..." -ForegroundColor Yellow
$migrationContent = Get-Content $migrationFile -Raw
$typeCount = ([regex]::Matches($migrationContent, 'type:\s*"')).Count

if ($typeCount -gt 0) {
    Write-Host "   ⚠️  Found $typeCount explicit type specifications in migration file" -ForegroundColor Yellow
    Write-Host "   ⚠️  Manual cleanup required - remove 'type: \"TEXT\"' from column definitions" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ No explicit type specifications found in migration file" -ForegroundColor Green
}

# Step 3: Verify
Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: dotnet build" -ForegroundColor Gray
Write-Host "  2. Verify: grep -c 'type:' $migrationFile" -ForegroundColor Gray
Write-Host "  3. Verify: grep -c 'HasColumnType' $designerFile" -ForegroundColor Gray
Write-Host "  4. Both should return 0" -ForegroundColor Gray
Write-Host ""
```

**Usage:**

```powershell
cd Backend/Migrations/Branch
.\cleanup-migration.ps1 -MigrationTimestamp "20251226045335" -MigrationName "AddPendingOrdersTables"
```

---

## Verification Checklist

Before applying the migration, verify these conditions:

### ✅ Pre-Application Checklist

- [ ] **Build succeeds:** `dotnet build` returns 0 errors
- [ ] **No explicit types in migration:** `grep -c "type:" MigrationFile.cs` returns `0`
- [ ] **No HasColumnType in Designer:** `grep -c "HasColumnType" DesignerFile.cs` returns `0`
- [ ] **Migration matches pattern:** Compare with `AddDriverTable.cs` (known working migration)
- [ ] **DbContext entities are configured:** No `.HasColumnType()` in `BranchDbContext.cs` for the new entities

### ✅ Post-Application Checklist

- [ ] **SQLite (B001) applies successfully**
- [ ] **SQL Server (mssql) applies successfully** (if configured)
- [ ] **MySQL applies successfully** (if configured)
- [ ] **PostgreSQL applies successfully** (if configured)
- [ ] **Rollback works on SQLite (B001)**
- [ ] **Re-apply works after rollback**
- [ ] **Tables created with correct schema** (verify in database)

---

## Troubleshooting

### Issue 1: "Column 'Id' is of a type that is invalid for use as a key column"

**Symptom:**
```
Error on SQL Server:
Column 'Id' in table 'TableName' is of a type that is invalid
for use as a key column in an index.
```

**Cause:**
Designer file still has `.HasColumnType("TEXT")` calls.

**Solution:**
```powershell
# Re-run the cleanup script
cd Backend/Migrations/Branch
$content = Get-Content 'YYYYMMDDHHMMSS_MigrationName.Designer.cs' -Raw
$content = $content -replace '\s*\.HasColumnType\([^)]+\)', ''
Set-Content 'YYYYMMDDHHMMSS_MigrationName.Designer.cs' -Value $content -NoNewline
dotnet build
```

---

### Issue 2: Migration File Has Explicit Types

**Symptom:**
```bash
grep -c "type:" MigrationFile.cs
# Returns: 15  (should be 0)
```

**Solution:**
Manually edit the migration file and remove all `type: "..."` specifications:

```csharp
// Before
Id = table.Column<Guid>(type: "TEXT", nullable: false),
Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),

// After
Id = table.Column<Guid>(nullable: false),
Name = table.Column<string>(maxLength: 200, nullable: false),
```

**Use Find & Replace in your editor:**
- Find: `,\s*type:\s*"[^"]*"`
- Replace: `` (empty string)

---

### Issue 3: Empty Migration Generated

**Symptom:**
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Empty!
}
```

**Cause:**
EF Core doesn't detect any changes in the DbContext.

**Solution:**
1. Verify entities are added to `BranchDbContext.cs`:
   ```csharp
   public DbSet<YourEntity> YourEntities { get; set; }
   ```

2. Verify entity configuration in `OnModelCreating`:
   ```csharp
   modelBuilder.Entity<YourEntity>(entity =>
   {
       // Configuration WITHOUT .HasColumnType()
       entity.HasIndex(e => e.SomeProperty);
       entity.Property(e => e.Price).HasPrecision(18, 2);
   });
   ```

3. Remove and regenerate:
   ```bash
   dotnet ef migrations remove --context BranchDbContext --force
   dotnet ef migrations add YourMigrationName --context BranchDbContext
   ```

---

### Issue 4: Build Errors After Cleanup

**Symptom:**
```
error CS1002: ; expected
```

**Cause:**
PowerShell regex accidentally removed semicolons.

**Solution:**
Delete the broken files and regenerate:

```bash
cd Backend
rm Migrations/Branch/YYYYMMDDHHMMSS_MigrationName.*
dotnet ef migrations add MigrationName --context BranchDbContext

# Re-run cleanup
cd Migrations/Branch
.\cleanup-migration.ps1 -MigrationTimestamp "YYYYMMDDHHMMSS" -MigrationName "MigrationName"
```

---

## Examples

### Example 1: Adding a New Table

**Scenario:** Add a new `Reservations` table.

**Step 1: Create entity**

```csharp
// Backend/Models/Entities/Branch/Reservation.cs
public class Reservation
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime ReservationDate { get; set; }
    public int GuestCount { get; set; }
    public decimal DepositAmount { get; set; }
}
```

**Step 2: Add to DbContext**

```csharp
// Backend/Data/Branch/BranchDbContext.cs
public DbSet<Reservation> Reservations { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // ... existing code ...

    modelBuilder.Entity<Reservation>(entity =>
    {
        entity.HasIndex(e => e.ReservationDate);
        entity.Property(e => e.DepositAmount).HasPrecision(18, 2);

        // ❌ DO NOT ADD: .HasColumnType("char(36)")
    });
}
```

**Step 3: Generate migration**

```bash
cd Backend
dotnet ef migrations add AddReservationsTable --context BranchDbContext
```

**Step 4: Cleanup**

```powershell
cd Migrations/Branch
.\cleanup-migration.ps1 -MigrationTimestamp "20251226123456" -MigrationName "AddReservationsTable"
```

**Step 5: Verify**

```bash
dotnet build
grep -c "type:" Migrations/Branch/20251226123456_AddReservationsTable.cs
grep -c "HasColumnType" Migrations/Branch/20251226123456_AddReservationsTable.Designer.cs
```

**Expected:** Both return `0`

**Step 6: Apply**

```bash
dotnet run
# Navigate to http://localhost:3000/head-office/migrations
# Click "Apply All"
```

---

### Example 2: Adding Columns to Existing Table

**Scenario:** Add `Notes` and `Status` columns to `Sales` table.

**Step 1: Update entity**

```csharp
// Backend/Models/Entities/Branch/Sale.cs
public class Sale
{
    // ... existing properties ...

    public string? Notes { get; set; }  // New
    public SaleStatus Status { get; set; }  // New
}
```

**Step 2: Update DbContext configuration**

```csharp
// Backend/Data/Branch/BranchDbContext.cs
modelBuilder.Entity<Sale>(entity =>
{
    // ... existing configuration ...

    entity.Property(e => e.Notes).HasMaxLength(500);
    entity.HasIndex(e => e.Status);
});
```

**Step 3: Generate migration**

```bash
dotnet ef migrations add AddNotesAndStatusToSales --context BranchDbContext
```

**Step 4: Cleanup and verify**

```powershell
cd Migrations/Branch
.\cleanup-migration.ps1 -MigrationTimestamp "20251226134500" -MigrationName "AddNotesAndStatusToSales"
dotnet build
```

---

## Best Practices

### ✅ DO

1. **Always run cleanup script** after generating a migration
2. **Verify both files** (migration + Designer) have no explicit types
3. **Test on SQLite first** before applying to production providers
4. **Test rollback** before considering the migration complete
5. **Use Migration UI** instead of manual `dotnet ef database update`
6. **Follow naming conventions:** `AddTableName`, `UpdateColumnName`, etc.
7. **Group related changes** in one migration (don't create 5 migrations for 5 columns)

### ❌ DON'T

1. **Don't add `.HasColumnType()` in DbContext** for new entities
2. **Don't skip the cleanup step** - it's critical!
3. **Don't use explicit `type:` in migrations** - let EF Core handle it
4. **Don't test only on SQLite** - test on SQL Server too
5. **Don't commit without testing rollback** - it might break production
6. **Don't manually edit Designer files** (except for removing `.HasColumnType()`)
7. **Don't use `dotnet ef database update`** - use the Migration UI instead

---

## Quick Reference

### Commands

```bash
# Generate migration
dotnet ef migrations add MigrationName --context BranchDbContext

# Remove last migration
dotnet ef migrations remove --context BranchDbContext --force

# List migrations
dotnet ef migrations list --context BranchDbContext

# Build project
dotnet build

# Verify no explicit types
grep -c "type:" Migrations/Branch/TIMESTAMP_MigrationName.cs
grep -c "HasColumnType" Migrations/Branch/TIMESTAMP_MigrationName.Designer.cs
```

### File Locations

```
Backend/
├── Data/Branch/
│   ├── BranchDbContext.cs              # Add DbSet and entity config here
│   └── BranchDbContextFactory.cs       # Design-time factory (uses SQLite)
├── Models/Entities/Branch/
│   └── YourEntity.cs                   # Entity class
└── Migrations/Branch/
    ├── TIMESTAMP_MigrationName.cs      # Migration file (remove type: specs)
    ├── TIMESTAMP_MigrationName.Designer.cs  # Designer (remove HasColumnType)
    └── cleanup-migration.ps1           # Cleanup script
```

---

## Related Documentation

- **Migration Best Practices:** `MIGRATION-BEST-PRACTICES.md`
- **Migration UI Guide:** `2025-12-21-migration-ui-user-guide.md`
- **Rollback Guide:** `2025-12-21-rollback-monitoring-guide.md`
- **EF Core Migrations:** https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/

---

## Summary

**Key Takeaway:**
The `dotnet ef migrations add` command generates SQLite-specific types by default. **Always remove** `.HasColumnType()` from the Designer file to ensure the migration works on all database providers.

**Success Criteria:**
```bash
grep -c "type:" MigrationFile.cs        # Should return: 0
grep -c "HasColumnType" DesignerFile.cs  # Should return: 0
dotnet build                             # Should succeed with 0 errors
```

**Migration UI:** `http://localhost:3000/head-office/migrations`

---

**Last Updated:** 2025-12-26
**Version:** 1.0
**Maintained By:** Development Team

---

**Tested On:**
- ✅ SQLite (B001, B002, B003)
- ✅ SQL Server (mssql branch)
- ✅ MySQL (if configured)
- ✅ PostgreSQL (if configured)
