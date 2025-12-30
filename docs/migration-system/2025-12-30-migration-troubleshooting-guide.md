# Migration Troubleshooting Guide

**Date:** 2025-12-30
**Purpose:** Comprehensive troubleshooting guide for EF Core migration creation and cleanup issues

---

## Table of Contents

1. [Common Issues and Solutions](#common-issues-and-solutions)
2. [Migration Cleanup Problems](#migration-cleanup-problems)
3. [Runtime Service Registration Issues](#runtime-service-registration-issues)
4. [Best Practices](#best-practices)
5. [Step-by-Step Recovery Procedures](#step-by-step-recovery-procedures)

---

## Common Issues and Solutions

### Issue 1: PowerShell Cleanup Script Corrupts Migration Files

**Symptom:**
```
Build FAILED.
error CS1002: ; expected
error CS1010: Newline in constant
error CS1026: ) expected
1000+ errors after running cleanup script
```

**Root Cause:**
The PowerShell regex `$content -replace '\s*\.HasColumnType\([^)]+\)', ''` can corrupt multi-line method chains in Designer files, leaving orphaned closing parentheses and quotes like:
```csharp
// Corrupted:
b.Property<decimal>("Amount")
    .HasPrecision(18, 2)");

// Should be:
b.Property<decimal>("Amount")
    .HasPrecision(18, 2);
```

**Solution:**

Use the **Clean-All-Migrations.ps1** script instead of cleanup-migration.ps1:

```bash
cd Backend/Migrations/Branch
powershell.exe -File Clean-All-Migrations.ps1
```

This script handles all edge cases properly and cleans Designer, Migration, and Snapshot files correctly.

**Manual Fix (if needed):**

If you encounter orphaned patterns after cleanup:

```bash
# Fix orphaned "); patterns in Designer file
cd Backend/Migrations/Branch
sed -i 's/");$/);/g' TIMESTAMP_MigrationName.Designer.cs

# Remove type: specifications from migration file
sed -i 's/type: "[^"]*", //g' TIMESTAMP_MigrationName.cs

# Verify cleanup
echo "HasColumnType: $(grep -c 'HasColumnType' TIMESTAMP_MigrationName.Designer.cs)"
echo "type: $(grep -c 'type:' TIMESTAMP_MigrationName.cs)"
# Both should return 0
```

---

### Issue 2: Sed Command Removes Valid Code

**Symptom:**
```
error CS1002: ; expected
b.Navigation("Tables);  // Missing closing quote
```

**Root Cause:**
Using overly aggressive sed patterns like `s/)";$/;/g` removes valid closing quotes from string literals.

**Solution:**

**DO NOT use these patterns:**
```bash
# WRONG - removes valid quotes:
sed -i 's/)";$/;/g' file.cs
sed -i 's/");$/;/g' file.cs
sed -i '/\.HasColumnType(/d' file.cs  # Deletes entire lines
```

**USE these safe patterns:**
```bash
# CORRECT - only fixes orphaned patterns from PowerShell cleanup:
sed -i 's/");$/);/g' file.Designer.cs    # Fixes: .HasPrecision(18, 2)"); → .HasPrecision(18, 2);
sed -i 's/type: "[^"]*", //g' file.cs   # Removes: type: "TEXT",
```

---

### Issue 3: Migration File Has No Content After Cleanup

**Symptom:**
```bash
$ cat Migration.cs
-NoNewline

$ cat Migration.Designer.cs
-NoNewline
```

**Root Cause:**
PowerShell `-NoNewline` parameter combined with sed operations can corrupt files completely.

**Solution:**

**Delete and regenerate:**
```bash
cd Backend
rm -f Migrations/Branch/TIMESTAMP_*
git checkout Migrations/Branch/BranchDbContextModelSnapshot.cs
dotnet ef migrations add YourMigrationName --context BranchDbContext
```

Then use **Clean-All-Migrations.ps1** to clean the new files.

---

## Migration Cleanup Problems

### Problem 1: Designer File Has Syntax Errors After Cleanup

**Common Patterns:**

1. **Orphaned closing parentheses:**
   ```csharp
   // Corrupted:
   b.Property<string>("DenominationBreakdown")");

   // Fixed:
   b.Property<string>("DenominationBreakdown");
   ```

2. **Missing semicolons on method chains:**
   ```csharp
   // Corrupted:
   b.Property<decimal>("Amount")
       .HasPrecision(18, 2)

   // Fixed:
   b.Property<decimal>("Amount")
       .HasPrecision(18, 2);
   ```

3. **Broken Navigation properties:**
   ```csharp
   // Corrupted:
   b.Navigation("Tables);

   // Fixed:
   b.Navigation("Tables");
   ```

**Recovery Steps:**

1. **Check for orphaned patterns:**
   ```bash
   cd Backend/Migrations/Branch
   grep -n ')");$' TIMESTAMP_*.Designer.cs
   grep -n '");$' TIMESTAMP_*.Designer.cs
   grep -n ')";$' TIMESTAMP_*.Designer.cs
   ```

2. **Fix all at once:**
   ```bash
   # Only fix the orphaned "); pattern from PowerShell cleanup
   sed -i 's/");$/);/g' TIMESTAMP_*.Designer.cs
   ```

3. **Build and verify:**
   ```bash
   cd ../..
   dotnet build --no-restore
   ```

---

### Problem 2: Migration File Still Has Type Specifications

**Symptom:**
```bash
$ grep -c 'type:' Migration.cs
100
```

**Solution:**
```bash
cd Backend/Migrations/Branch
sed -i 's/type: "[^"]*", //g' TIMESTAMP_MigrationName.cs

# Verify
grep -c 'type:' TIMESTAMP_MigrationName.cs
# Should return: 0
```

---

## Runtime Service Registration Issues

### Issue: IDbContextFactory<BranchDbContext> Not Registered

**Symptom:**
```
System.InvalidOperationException: Unable to resolve service for type
'Microsoft.EntityFrameworkCore.IDbContextFactory`1[Backend.Data.Branch.BranchDbContext]'
while attempting to activate 'Backend.Services.Shared.Printing.EscPosPrintService'.
```

**Root Cause:**
Services like `EscPosPrintService` require `IDbContextFactory<BranchDbContext>` but only the custom `DbContextFactory` class is registered, not the EF Core interface.

**Solution:**

**Step 1:** Create `BranchDbContextRuntimeFactory.cs`:

```csharp
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Branch;

public class BranchDbContextRuntimeFactory : IDbContextFactory<BranchDbContext>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly DbContextFactory _dbContextFactory;
    private readonly HeadOfficeDbContext _headOfficeContext;

    public BranchDbContextRuntimeFactory(
        IHttpContextAccessor httpContextAccessor,
        DbContextFactory dbContextFactory,
        HeadOfficeDbContext headOfficeContext)
    {
        _httpContextAccessor = httpContextAccessor;
        _dbContextFactory = dbContextFactory;
        _headOfficeContext = headOfficeContext;
    }

    public BranchDbContext CreateDbContext()
    {
        var httpContext = _httpContextAccessor.HttpContext;

        // Try to get branch from HttpContext items (set by middleware)
        if (httpContext?.Items["Branch"] is Models.Entities.HeadOffice.Branch branch)
        {
            return _dbContextFactory.CreateBranchContext(branch);
        }

        // Try to get branch ID from claims
        var branchIdClaim = httpContext?.User.FindFirst("branch_id")?.Value;
        if (!string.IsNullOrEmpty(branchIdClaim) && Guid.TryParse(branchIdClaim, out var branchId))
        {
            var branchEntity = _headOfficeContext.Branches.Find(branchId);
            if (branchEntity != null)
            {
                return _dbContextFactory.CreateBranchContext(branchEntity);
            }
        }

        throw new InvalidOperationException(
            "Branch context not found. Ensure the request is authenticated and associated with a branch."
        );
    }

    public async Task<BranchDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        if (httpContext?.Items["Branch"] is Models.Entities.HeadOffice.Branch branch)
        {
            return _dbContextFactory.CreateBranchContext(branch);
        }

        var branchIdClaim = httpContext?.User.FindFirst("branch_id")?.Value;
        if (!string.IsNullOrEmpty(branchIdClaim) && Guid.TryParse(branchIdClaim, out var branchId))
        {
            var branchEntity = await _headOfficeContext.Branches.FindAsync(
                new object[] { branchId }, cancellationToken);
            if (branchEntity != null)
            {
                return _dbContextFactory.CreateBranchContext(branchEntity);
            }
        }

        throw new InvalidOperationException(
            "Branch context not found. Ensure the request is authenticated and associated with a branch."
        );
    }
}
```

**Step 2:** Register in `Program.cs`:

```csharp
// Configure DbContextFactory
builder.Services.AddSingleton<DbContextFactory>();

// Register IDbContextFactory<BranchDbContext> for services that need it
builder.Services.AddScoped<Microsoft.EntityFrameworkCore.IDbContextFactory<BranchDbContext>,
    Backend.Data.Branch.BranchDbContextRuntimeFactory>();
```

**Step 3:** Verify:
```bash
cd Backend
dotnet build
dotnet run
# Application should start without errors
```

---

## Best Practices

### 1. Always Use Clean-All-Migrations.ps1

**DO:**
```bash
cd Backend
dotnet ef migrations add YourMigrationName --context BranchDbContext
cd Migrations/Branch
powershell.exe -File Clean-All-Migrations.ps1
```

**DON'T:**
```bash
# Avoid using cleanup-migration.ps1 if it causes issues
# Avoid manual sed commands unless you understand the exact patterns
```

### 2. Verify Before Committing

**Checklist:**
```bash
# 1. Check for orphaned patterns
cd Backend/Migrations/Branch
grep -c 'HasColumnType' TIMESTAMP_*.Designer.cs  # Should be 0
grep -c 'type:' TIMESTAMP_*.cs                   # Should be 0

# 2. Build verification
cd ../..
dotnet build --no-restore

# 3. Check for syntax errors
# Build should show: 0 Error(s)
```

### 3. Test Migration Locally First

Before committing, test the migration:

```bash
# 1. Start backend
cd Backend
dotnet run

# 2. Open Migration UI
# http://localhost:3000/head-office/migrations

# 3. Test on SQLite (B001)
#    - Apply migration
#    - Verify success
#    - Rollback
#    - Re-apply

# 4. Only commit if all tests pass
```

---

## Step-by-Step Recovery Procedures

### Recovery 1: Corrupted Migration Files

**When to use:** Migration files have syntax errors after cleanup

**Steps:**

1. **Delete corrupted files:**
   ```bash
   cd Backend/Migrations/Branch
   rm -f TIMESTAMP_MigrationName.cs
   rm -f TIMESTAMP_MigrationName.Designer.cs
   ```

2. **Restore snapshot:**
   ```bash
   git checkout BranchDbContextModelSnapshot.cs
   ```

3. **Regenerate migration:**
   ```bash
   cd ../..
   dotnet ef migrations add MigrationName --context BranchDbContext
   ```

4. **Use Clean-All-Migrations.ps1:**
   ```bash
   cd Migrations/Branch
   powershell.exe -File Clean-All-Migrations.ps1
   ```

5. **Verify:**
   ```bash
   cd ../..
   dotnet build --no-restore
   ```

---

### Recovery 2: Build Fails After Migration Cleanup

**When to use:** Build fails with 100+ CS1002/CS1010 errors

**Steps:**

1. **Check error count:**
   ```bash
   cd Backend
   dotnet build --no-restore 2>&1 | tail -5
   ```

2. **If 1-50 errors:**
   - Likely orphaned "); patterns
   - Fix manually:
     ```bash
     cd Migrations/Branch
     sed -i 's/");$/);/g' TIMESTAMP_*.Designer.cs
     ```

3. **If 50+ errors:**
   - Complete corruption, regenerate:
     ```bash
     rm -f TIMESTAMP_*
     git checkout BranchDbContextModelSnapshot.cs
     cd ../..
     dotnet ef migrations add MigrationName --context BranchDbContext
     cd Migrations/Branch
     powershell.exe -File Clean-All-Migrations.ps1
     ```

4. **Verify build:**
   ```bash
   cd ../..
   dotnet build --no-restore
   ```

---

### Recovery 3: Application Won't Start After Adding New Service

**When to use:** Service registration errors on startup

**Symptoms:**
```
System.InvalidOperationException: Unable to resolve service for type 'X'
while attempting to activate 'Y'.
```

**Steps:**

1. **Identify missing dependency:**
   - Read the error message carefully
   - Note the service type that can't be resolved

2. **For `IDbContextFactory<BranchDbContext>`:**
   - Implement `BranchDbContextRuntimeFactory` (see above)
   - Register in `Program.cs`

3. **For other dependencies:**
   - Register the missing service in `Program.cs`
   - Example:
     ```csharp
     builder.Services.AddScoped<IMissingService, MissingServiceImpl>();
     ```

4. **Verify registration:**
   ```bash
   cd Backend
   dotnet build
   dotnet run
   ```

---

## Quick Reference

### Safe Sed Patterns

```bash
# Fix orphaned "); after PowerShell cleanup
sed -i 's/");$/);/g' file.Designer.cs

# Remove type: specifications
sed -i 's/type: "[^"]*", //g' file.cs
```

### Verification Commands

```bash
# Check Designer file
grep -c 'HasColumnType' Migration.Designer.cs  # Should be 0

# Check Migration file
grep -c 'type:' Migration.cs                   # Should be 0

# Check for orphaned patterns
grep ')");$' Migration.Designer.cs             # Should be empty
```

### Emergency Reset

```bash
# Nuclear option - delete and regenerate
cd Backend/Migrations/Branch
rm -f TIMESTAMP_YourMigration*
git checkout BranchDbContextModelSnapshot.cs
cd ../..
dotnet ef migrations add YourMigration --context BranchDbContext
cd Migrations/Branch
powershell.exe -File Clean-All-Migrations.ps1
cd ../..
dotnet build --no-restore
```

---

## Lessons Learned

### 1. PowerShell Regex Limitations

The PowerShell regex in cleanup-migration.ps1 can fail on complex multi-line patterns. The Clean-All-Migrations.ps1 script handles these cases better.

### 2. Sed Pattern Precision

Sed patterns must be precise to avoid removing valid code:
- `s/)";$/;/g` - ❌ Too broad, removes valid quotes
- `s/");$/);/g` - ✅ Correct, only fixes orphaned pattern

### 3. Service Registration Order

When adding services that depend on `IDbContextFactory<BranchDbContext>`, ensure the factory is registered before the dependent services in `Program.cs`.

### 4. Always Verify Before Committing

Running `dotnet build` after cleanup is not enough - also verify:
- No HasColumnType calls in Designer
- No type: specifications in Migration
- Application starts without DI errors

---

## Contact & Support

For additional help:
- Check `docs/migration-system/QUICK-START-NEW-MIGRATION.md`
- Review `docs/migration-system/2025-12-26-creating-multi-provider-migrations.md`
- Search existing migration docs in `docs/migration-system/`

---

**Document Version:** 1.0
**Last Updated:** 2025-12-30
**Tested With:** .NET 8.0, EF Core 8.0.0
