# Migration Writing Guide - Best Practices

**Date:** December 22, 2025
**Purpose:** Guide for writing Entity Framework Core migrations that work correctly across all database providers

## ❌ DON'T: Use Raw SQL

**Bad Example:**
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        CREATE TABLE IF NOT EXISTS Zones (
            Id INT AUTO_INCREMENT PRIMARY KEY,
            Name VARCHAR(50) NOT NULL,
            ...
        );");
}
```

**Problems:**
- Requires provider-specific syntax (AUTOINCREMENT vs AUTO_INCREMENT vs IDENTITY vs SERIAL)
- Requires manual idempotency checks (IF NOT EXISTS)
- Down() method requires complex provider-specific rollback logic
- Error-prone and time-consuming to maintain

## ✅ DO: Use EF Core's Built-in Methods

**Good Example:**
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateTable(
        name: "Zones",
        columns: table => new
        {
            Id = table.Column<int>(type: "int", nullable: false)
                .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn)
                .Annotation("SqlServer:Identity", "1, 1")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
                .Annotation("Sqlite:Autoincrement", true),
            Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
            Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
            DisplayOrder = table.Column<int>(type: "int", nullable: false),
            IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
            CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
            UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
            CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
            UpdatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
        },
        constraints: table =>
        {
            table.PrimaryKey("PK_Zones", x => x.Id);
        });

    migrationBuilder.CreateIndex(
        name: "IX_Zones_DisplayOrder",
        table: "Zones",
        column: "DisplayOrder");

    migrationBuilder.CreateIndex(
        name: "IX_Zones_IsActive",
        table: "Zones",
        column: "IsActive");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropTable(
        name: "Zones");
}
```

**Benefits:**
- ✅ EF Core automatically generates provider-specific SQL
- ✅ Down() method is automatically generated correctly
- ✅ Foreign keys are handled automatically
- ✅ No manual provider detection needed
- ✅ Works on SQLite, SQL Server, MySQL, PostgreSQL without changes

## Best Practices

### 1. Let Entity Models Drive Migrations

**Instead of writing migrations manually, update your entity models and let EF generate the migration:**

```bash
# Add a new property to your entity class first
# Then run:
dotnet ef migrations add AddNewColumn --project Backend --context BranchDbContext
```

### 2. Use Data Annotations or Fluent API

```csharp
public class Zone
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; }

    [MaxLength(200)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    [MaxLength(100)]
    public string CreatedBy { get; set; }

    [Required]
    [MaxLength(100)]
    public string UpdatedBy { get; set; }
}
```

### 3. Configure in DbContext

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Zone>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.DisplayOrder);
        entity.HasIndex(e => e.IsActive);

        entity.Property(e => e.IsActive).HasDefaultValue(true);
        entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
        entity.Property(e => e.Description).HasMaxLength(200);
    });

    modelBuilder.Entity<Table>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.Number).IsUnique();
        entity.HasIndex(e => e.ZoneId);

        entity.HasOne(e => e.Zone)
            .WithMany()
            .HasForeignKey(e => e.ZoneId)
            .OnDelete(DeleteBehavior.SetNull);
    });
}
```

### 4. Adding Columns to Existing Tables

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<int>(
        name: "TableId",
        table: "Sales",
        type: "int",
        nullable: true);

    migrationBuilder.AddColumn<string>(
        name: "Status",
        table: "Sales",
        type: "nvarchar(20)",
        maxLength: 20,
        nullable: false,
        defaultValue: "Completed");

    migrationBuilder.CreateIndex(
        name: "IX_Sales_TableId",
        table: "Sales",
        column: "TableId");

    migrationBuilder.AddForeignKey(
        name: "FK_Sales_Tables_TableId",
        table: "Sales",
        column: "TableId",
        principalTable: "Tables",
        principalColumn: "Id",
        onDelete: ReferentialAction.SetNull);
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // EF Core generates this automatically and handles FK drops correctly
    migrationBuilder.DropForeignKey(
        name: "FK_Sales_Tables_TableId",
        table: "Sales");

    migrationBuilder.DropIndex(
        name: "IX_Sales_TableId",
        table: "Sales");

    migrationBuilder.DropColumn(
        name: "TableId",
        table: "Sales");

    migrationBuilder.DropColumn(
        name: "Status",
        table: "Sales");
}
```

## Common Scenarios

### Creating a New Table

```csharp
migrationBuilder.CreateTable(
    name: "MyTable",
    columns: table => new
    {
        Id = table.Column<int>(nullable: false)
            .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn)
            .Annotation("SqlServer:Identity", "1, 1")
            .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
            .Annotation("Sqlite:Autoincrement", true),
        Name = table.Column<string>(maxLength: 100, nullable: false)
    },
    constraints: table =>
    {
        table.PrimaryKey("PK_MyTable", x => x.Id);
    });
```

### Adding a Foreign Key

```csharp
migrationBuilder.AddForeignKey(
    name: "FK_Sales_Customers_CustomerId",
    table: "Sales",
    column: "CustomerId",
    principalTable: "Customers",
    principalColumn: "Id",
    onDelete: ReferentialAction.Cascade);
```

### Creating an Index

```csharp
migrationBuilder.CreateIndex(
    name: "IX_Sales_Date",
    table: "Sales",
    column: "Date");

// Unique index
migrationBuilder.CreateIndex(
    name: "IX_Users_Username",
    table: "Users",
    column: "Username",
    unique: true);
```

### Renaming Columns/Tables

```csharp
// Rename column
migrationBuilder.RenameColumn(
    name: "OldName",
    table: "MyTable",
    newName: "NewName");

// Rename table
migrationBuilder.RenameTable(
    name: "OldTableName",
    newName: "NewTableName");
```

## When Raw SQL is Acceptable

Use `migrationBuilder.Sql()` ONLY for:
1. **Data migrations** (updating existing data)
2. **Stored procedures** (if needed)
3. **Database-specific features** not supported by EF Core

**Example of acceptable raw SQL:**
```csharp
// Data migration - update existing records
migrationBuilder.Sql(@"
    UPDATE Sales
    SET Status = 'Completed'
    WHERE Status IS NULL OR Status = '';
");
```

## Workflow for New Migrations

### Step 1: Update Entity Models

```csharp
// Add new property to your entity
public class Sale
{
    // existing properties...

    public int? TableId { get; set; }  // New property
    public virtual Table? Table { get; set; }  // Navigation property
}
```

### Step 2: Configure in DbContext (if needed)

```csharp
modelBuilder.Entity<Sale>()
    .HasOne(s => s.Table)
    .WithMany()
    .HasForeignKey(s => s.TableId)
    .OnDelete(DeleteBehavior.SetNull);
```

### Step 3: Generate Migration

```bash
cd Backend
dotnet ef migrations add AddTableToSales --context BranchDbContext
```

### Step 4: Review Generated Migration

Check the generated file in `Backend/Migrations/Branch/`

### Step 5: Test Locally

```bash
# Apply migration
dotnet ef database update --context BranchDbContext

# Test rollback
dotnet ef database update PreviousMigrationName --context BranchDbContext
```

### Step 6: Deploy

The migration will be automatically applied to all branches via the migration system.

## SQLite Limitations

SQLite doesn't support:
- `DROP COLUMN`
- `DROP FOREIGN KEY`
- `ALTER COLUMN` (data type changes)

**EF Core handles this automatically** by:
1. Creating a new table with the correct schema
2. Copying data from the old table
3. Dropping the old table
4. Renaming the new table

You don't need to write this logic manually!

## Testing Migrations

### Test on All Providers

Before committing a migration, test it on all database providers:

```bash
# SQLite (default branches)
dotnet ef database update --context BranchDbContext

# Test rollback
dotnet ef database update PreviousMigration --context BranchDbContext
dotnet ef database update --context BranchDbContext
```

Use the Migration UI to test on SQL Server, MySQL, and PostgreSQL branches.

## Migration Checklist

Before committing a new migration:

- [ ] Entity models updated with proper data annotations
- [ ] DbContext configuration added (if needed)
- [ ] Migration generated using `dotnet ef migrations add`
- [ ] Reviewed generated Up() and Down() methods
- [ ] No raw SQL unless absolutely necessary
- [ ] Tested applying migration on SQLite
- [ ] Tested rolling back migration on SQLite
- [ ] Tested on all providers via Migration UI (if available)
- [ ] Down() method properly reverses Up() method

## Common Mistakes to Avoid

### ❌ Don't: Use raw SQL for table creation
```csharp
migrationBuilder.Sql("CREATE TABLE ...");  // Bad
```

### ✅ Do: Use CreateTable method
```csharp
migrationBuilder.CreateTable(...);  // Good
```

### ❌ Don't: Try to drop FK and table in wrong order
```csharp
migrationBuilder.DropTable("ParentTable");  // Fails if FK exists
migrationBuilder.DropForeignKey("FK_Child_Parent");
```

### ✅ Do: Let EF Core handle the order
```csharp
// EF Core automatically drops FK before table
migrationBuilder.DropTable("ChildTable");
```

### ❌ Don't: Forget nullable vs non-nullable
```csharp
migrationBuilder.AddColumn<string>(
    name: "Name",
    table: "Users",
    nullable: false);  // Error if existing rows!
```

### ✅ Do: Add nullable first, then update, then make non-nullable
```csharp
// Migration 1: Add as nullable
migrationBuilder.AddColumn<string>(
    name: "Name",
    table: "Users",
    nullable: true);

// Migration 2: Update data
migrationBuilder.Sql("UPDATE Users SET Name = 'Default' WHERE Name IS NULL");

// Migration 3: Make non-nullable
migrationBuilder.AlterColumn<string>(
    name: "Name",
    table: "Users",
    nullable: false);
```

## Summary

**Key Principle:** Let EF Core do the heavy lifting. Use built-in migration methods instead of raw SQL. This ensures:
- ✅ Provider-specific SQL is generated automatically
- ✅ Rollbacks work correctly
- ✅ Less code to write and maintain
- ✅ Fewer bugs
- ✅ Faster development

**Remember:** Raw SQL should be the exception, not the rule!
