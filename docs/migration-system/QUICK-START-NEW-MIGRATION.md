# Quick Start: Creating a New Migration

**TL;DR** - Follow these 6 steps to create a multi-provider migration:

---

## The 6-Step Process

### 1️⃣ Generate Migration

```bash
cd Backend
dotnet ef migrations add YourMigrationName --context BranchDbContext
```

### 2️⃣ Run Cleanup Script

```powershell
cd Migrations/Branch
.\cleanup-migration.ps1 -MigrationTimestamp "YYYYMMDDHHMMSS" -MigrationName "YourMigrationName"
```

**Replace `YYYYMMDDHHMMSS` with the actual timestamp from the generated files.**

### 3️⃣ Verify Clean

```bash
cd ../..
dotnet build

# Both should return 0:
grep -c "type:" Migrations/Branch/YYYYMMDDHHMMSS_YourMigrationName.cs
grep -c "HasColumnType" Migrations/Branch/YYYYMMDDHHMMSS_YourMigrationName.Designer.cs
```

### 4️⃣ Test on SQLite First

```bash
dotnet run
```

Navigate to: `http://localhost:3000/head-office/migrations`

- Expand **B001** (SQLite branch)
- Click **"Apply Migrations"**
- Verify: ✅ Success

### 5️⃣ Test Rollback

- Still in **B001**, click **"Undo Last Migration"**
- Verify: ✅ Success
- Re-apply: Click **"Apply Migrations"**
- Verify: ✅ Success again

### 6️⃣ Apply to All Providers

- Click **"Apply All"** button
- Verify all branches succeed (SQLite, SQL Server, MySQL, PostgreSQL)

---

## ⚠️ Critical Rules

### ✅ DO

- Run cleanup script **EVERY TIME** after `dotnet ef migrations add`
- Verify **BOTH** files have 0 explicit types
- Test on **SQLite first**, then other providers
- Test **rollback** before considering complete
- Use **Migration UI**, not manual commands

### ❌ DON'T

- Skip the cleanup script - **never**!
- Add `.HasColumnType()` in `BranchDbContext.cs`
- Use explicit `type:` in migration files
- Test only on SQLite - SQL Server might still fail
- Commit without testing rollback

---

## 🚨 Common Issues

### Issue: SQL Server Error "Invalid key column type"

**Solution:**
```powershell
# Re-run cleanup
cd Backend/Migrations/Branch
.\cleanup-migration.ps1 -MigrationTimestamp "YYYYMMDDHHMMSS" -MigrationName "YourMigrationName"
```

### Issue: Migration file has `type: "TEXT"`

**Solution:**
```bash
# Manually remove all type: specifications
# Find & Replace in editor:
#   Find:    , type: "[^"]*"
#   Replace: (empty)
```

### Issue: Empty migration generated

**Solution:**
```csharp
// 1. Add DbSet to BranchDbContext.cs:
public DbSet<YourEntity> YourEntities { get; set; }

// 2. Add configuration (WITHOUT .HasColumnType()):
modelBuilder.Entity<YourEntity>(entity =>
{
    entity.HasIndex(e => e.SomeProperty);
    entity.Property(e => e.Price).HasPrecision(18, 2);
});

// 3. Regenerate:
dotnet ef migrations remove --context BranchDbContext --force
dotnet ef migrations add YourMigrationName --context BranchDbContext
```

---

## 📋 Quick Checklist

**Before applying migration:**

- [ ] Cleanup script ran successfully
- [ ] `dotnet build` succeeded (0 errors)
- [ ] Migration file has 0 `type:` specs
- [ ] Designer file has 0 `.HasColumnType()` calls
- [ ] Tested on SQLite (B001) - apply succeeds
- [ ] Tested rollback - succeeds
- [ ] Re-apply after rollback - succeeds

**After these checks pass:**

- [ ] Applied to all branches
- [ ] All providers succeeded
- [ ] Tables verified in database

---

## 📚 Full Documentation

For detailed instructions, troubleshooting, and examples:

**Read:** `2025-12-26-creating-multi-provider-migrations.md`

---

## 🛠️ Files You'll Edit

```
Backend/
├── Models/Entities/Branch/
│   └── YourEntity.cs                    # 1. Create entity
├── Data/Branch/
│   └── BranchDbContext.cs               # 2. Add DbSet & config
└── Migrations/Branch/
    ├── TIMESTAMP_Name.cs                # 3. Generated (cleanup)
    ├── TIMESTAMP_Name.Designer.cs       # 4. Generated (cleanup)
    └── cleanup-migration.ps1            # 5. Run this!
```

---

## 💡 Pro Tips

1. **Copy the timestamp** from generated file names for the cleanup script
2. **Always test rollback** - production failures happen during rollback, not apply
3. **Use Migration UI** - it handles all providers automatically
4. **Commit after testing** - not before
5. **Check git diff** - you should see ONLY your entity changes, no `.HasColumnType()`

---

## Example Session

```bash
# 1. Generate
cd Backend
dotnet ef migrations add AddReservationsTable --context BranchDbContext

# 2. Cleanup (using actual timestamp)
cd Migrations/Branch
.\cleanup-migration.ps1 -MigrationTimestamp "20251226145530" -MigrationName "AddReservationsTable"

# 3. Verify
cd ../..
dotnet build
grep -c "type:" Migrations/Branch/20251226145530_AddReservationsTable.cs
# Output: 0 ✅

grep -c "HasColumnType" Migrations/Branch/20251226145530_AddReservationsTable.Designer.cs
# Output: 0 ✅

# 4. Run & test
dotnet run
# Open: http://localhost:3000/head-office/migrations
# Test on B001 → Apply → Rollback → Re-apply → Apply All ✅
```

---

**Last Updated:** 2025-12-26
