# Migration Best Practices - Summary

**Date:** December 22, 2025
**Issue:** New migrations require extensive provider-specific SQL fixes, taking hours to debug
**Solution:** Use EF Core's built-in migration methods instead of raw SQL

## The Problem

When adding migrations using `dotnet ef migrations add`, the current approach causes:

❌ **Hours of debugging** for each new migration
❌ **Provider-specific SQL** must be written manually for each database
❌ **Complex rollback logic** required for each provider
❌ **FK constraint errors** during rollback
❌ **Idempotency checks** must be added manually

### Example of Current Problem

```csharp
// Current approach - PROBLEMATIC
protected override void Up(MigrationBuilder migrationBuilder)
{
    var provider = migrationBuilder.ActiveProvider;

    if (provider?.Contains("MySql") == true)
    {
        migrationBuilder.Sql("CREATE TABLE IF NOT EXISTS Zones (...) AUTO_INCREMENT");
    }
    else if (provider?.Contains("SqlServer") == true)
    {
        migrationBuilder.Sql("IF NOT EXISTS (...) CREATE TABLE Zones (...) IDENTITY(1,1)");
    }
    else if (provider?.Contains("PostgreSQL") == true)
    {
        migrationBuilder.Sql("CREATE TABLE IF NOT EXISTS \"Zones\" (...) SERIAL");
    }
    else // SQLite
    {
        migrationBuilder.Sql("CREATE TABLE IF NOT EXISTS Zones (...) AUTOINCREMENT");
    }
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // Must handle FK drops manually for each provider
    // Must handle column drops manually (SQLite requires table rebuild!)
    // Must handle index drops manually
    // 200+ lines of complex provider-specific code
}
```

**Problems:**
- Must know SQL syntax for all 4 database providers
- Must manually handle FK dependencies
- Must manually handle SQLite limitations
- Rollback requires complex provider-specific logic
- Takes hours to write and debug

## The Solution

✅ **Use EF Core's built-in migration methods**

### New Approach

```csharp
// New approach - SIMPLE
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateTable(
        name: "Zones",
        columns: table => new
        {
            Id = table.Column<int>(nullable: false)
                .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn)
                .Annotation("SqlServer:Identity", "1, 1")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
                .Annotation("Sqlite:Autoincrement", true),
            Name = table.Column<string>(maxLength: 50, nullable: false),
            // ... other columns
        },
        constraints: table =>
        {
            table.PrimaryKey("PK_Zones", x => x.Id);
        });

    migrationBuilder.CreateIndex(
        name: "IX_Zones_DisplayOrder",
        table: "Zones",
        column: "DisplayOrder");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // EF Core handles EVERYTHING automatically!
    migrationBuilder.DropTable(name: "Zones");
}
```

**Benefits:**
- ✅ EF Core generates provider-specific SQL automatically
- ✅ Down() method is 1 line instead of 200+
- ✅ FK constraints handled automatically in correct order
- ✅ SQLite table rebuild handled automatically
- ✅ Idempotency handled by EF Core
- ✅ Takes minutes instead of hours

## Workflow for New Migrations

### Old Workflow (DON'T DO THIS)

1. ❌ Manually write raw SQL for Up() method
2. ❌ Write 4 different versions for each provider
3. ❌ Manually handle FK constraints
4. ❌ Manually write Down() method with provider checks
5. ❌ Test on all 4 providers
6. ❌ Debug FK constraint errors
7. ❌ Fix SQLite table rebuild issues
8. ❌ Spend 2-4 hours debugging

**Total time:** 2-4 hours per migration

### New Workflow (DO THIS)

1. ✅ Update entity model with properties
2. ✅ Run `dotnet ef migrations add YourMigrationName --context BranchDbContext`
3. ✅ Review generated migration (1 minute)
4. ✅ Test: `dotnet ef database update`
5. ✅ Done!

**Total time:** 5-10 minutes per migration

## Real-World Example

### Adding a New Table

#### Step 1: Create Entity Model

```csharp
// Backend/Models/Entities/Branch/Zone.cs
public class Zone
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; }

    [MaxLength(200)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    [MaxLength(100)]
    public string CreatedBy { get; set; }

    [MaxLength(100)]
    public string UpdatedBy { get; set; }
}
```

#### Step 2: Configure in DbContext

```csharp
// Backend/Data/Branch/BranchDbContext.cs
public DbSet<Zone> Zones { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<Zone>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.DisplayOrder);
        entity.HasIndex(e => e.IsActive);
        entity.Property(e => e.IsActive).HasDefaultValue(true);
    });
}
```

#### Step 3: Generate Migration

```bash
cd Backend
dotnet ef migrations add AddZoneTable --context BranchDbContext
```

**EF Core automatically generates:**
- ✅ Provider-specific CREATE TABLE statements
- ✅ Auto-increment configuration for all providers
- ✅ Indexes
- ✅ Default values
- ✅ Correct Down() method

#### Step 4: Apply Migration

```bash
dotnet ef database update --context BranchDbContext
```

**Done!** Works on SQLite, SQL Server, MySQL, and PostgreSQL without any changes.

## Key Principles

### 1. Never Use Raw SQL for Schema Changes

❌ **DON'T:**
```csharp
migrationBuilder.Sql("CREATE TABLE ...");
migrationBuilder.Sql("ALTER TABLE ...");
migrationBuilder.Sql("DROP TABLE ...");
```

✅ **DO:**
```csharp
migrationBuilder.CreateTable(...);
migrationBuilder.AddColumn(...);
migrationBuilder.DropTable(...);
```

### 2. Let Entity Models Drive Migrations

Update your entity model first, then generate the migration. Don't write migrations manually.

### 3. Use Data Annotations and Fluent API

Configure constraints in code, not in SQL:

```csharp
[Required]
[MaxLength(100)]
public string Name { get; set; }

// Or in OnModelCreating:
entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
```

### 4. Raw SQL Only for Data Changes

Use raw SQL ONLY for:
- Updating existing data
- Stored procedures (if needed)
- Database-specific features not supported by EF Core

### 5. Test Locally Before Committing

```bash
# Apply
dotnet ef database update

# Rollback
dotnet ef database update PreviousMigration

# Re-apply
dotnet ef database update
```

## Common Scenarios

### Creating Tables
```csharp
migrationBuilder.CreateTable(name: "...", columns: ..., constraints: ...);
```

### Adding Columns
```csharp
migrationBuilder.AddColumn<int>(name: "...", table: "...", nullable: true);
```

### Adding Foreign Keys
```csharp
migrationBuilder.AddForeignKey(name: "...", table: "...", column: "...",
    principalTable: "...", principalColumn: "...", onDelete: ReferentialAction.SetNull);
```

### Creating Indexes
```csharp
migrationBuilder.CreateIndex(name: "...", table: "...", column: "...");
```

### Renaming
```csharp
migrationBuilder.RenameColumn(name: "...", table: "...", newName: "...");
migrationBuilder.RenameTable(name: "...", newName: "...");
```

## Migration Comparison

| Aspect | Old Approach (Raw SQL) | New Approach (EF Core Methods) |
|--------|------------------------|--------------------------------|
| **Time Required** | 2-4 hours | 5-10 minutes |
| **Code Lines** | 200+ lines | 10-20 lines |
| **Provider Support** | Manual for each | Automatic |
| **Rollback** | Complex manual logic | Automatic |
| **FK Handling** | Manual, error-prone | Automatic |
| **SQLite Support** | Manual table rebuild | Automatic |
| **Maintainability** | Very difficult | Easy |
| **Error Prone** | High | Low |
| **Testing Required** | All 4 providers | Local SQLite only |

## Files Created

1. **MIGRATION-WRITING-GUIDE.md** - Comprehensive guide with examples
2. **MIGRATION-TEMPLATE.md** - Quick reference templates for copy/paste
3. **This file** - Summary and overview

## Next Steps

1. ✅ Read MIGRATION-WRITING-GUIDE.md
2. ✅ Keep MIGRATION-TEMPLATE.md open when creating migrations
3. ✅ For your next migration:
   - Update entity model first
   - Run `dotnet ef migrations add`
   - Review generated code
   - Test locally
   - Commit
4. ✅ Never use raw SQL for schema changes again!

## Benefits Summary

By following these best practices, you will:

✅ **Save hours** on each migration (from 2-4 hours to 5-10 minutes)
✅ **Eliminate provider-specific errors**
✅ **Eliminate rollback errors**
✅ **Eliminate FK constraint issues**
✅ **Reduce code from 200+ lines to 10-20 lines**
✅ **Make migrations maintainable**
✅ **Focus on business logic instead of SQL syntax**

## Conclusion

**Stop writing provider-specific SQL manually!** Let EF Core do the work for you.

The time spent learning EF Core's migration methods will be recovered after just 1-2 migrations. Every migration after that is quick and painless.

**Your future self will thank you!**
