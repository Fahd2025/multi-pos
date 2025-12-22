# Migration Template - Quick Reference

## Quick Start

```bash
# 1. Update your entity model (e.g., Backend/Models/Entities/Branch/YourEntity.cs)
# 2. Update DbContext configuration if needed
# 3. Generate migration:
cd Backend
dotnet ef migrations add YourMigrationName --context BranchDbContext

# 4. Review generated migration file
# 5. Test:
dotnet ef database update --context BranchDbContext
```

## Common Patterns

### Creating a New Table

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateTable(
        name: "YourTable",
        columns: table => new
        {
            Id = table.Column<int>(nullable: false)
                .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn)
                .Annotation("SqlServer:Identity", "1, 1")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
                .Annotation("Sqlite:Autoincrement", true),
            Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
            Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
            IsActive = table.Column<bool>(nullable: false, defaultValue: true),
            CreatedAt = table.Column<DateTime>(nullable: false),
            UpdatedAt = table.Column<DateTime>(nullable: false),
            CreatedBy = table.Column<string>(maxLength: 100, nullable: false),
            UpdatedBy = table.Column<string>(maxLength: 100, nullable: false)
        },
        constraints: table =>
        {
            table.PrimaryKey("PK_YourTable", x => x.Id);
        });

    migrationBuilder.CreateIndex(
        name: "IX_YourTable_Name",
        table: "YourTable",
        column: "Name");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropTable(name: "YourTable");
}
```

### Adding Columns

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Nullable column
    migrationBuilder.AddColumn<int>(
        name: "NewColumn",
        table: "ExistingTable",
        type: "int",
        nullable: true);

    // Non-nullable with default
    migrationBuilder.AddColumn<string>(
        name: "Status",
        table: "ExistingTable",
        type: "nvarchar(20)",
        maxLength: 20,
        nullable: false,
        defaultValue: "Active");

    // Add index
    migrationBuilder.CreateIndex(
        name: "IX_ExistingTable_NewColumn",
        table: "ExistingTable",
        column: "NewColumn");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropIndex(
        name: "IX_ExistingTable_NewColumn",
        table: "ExistingTable");

    migrationBuilder.DropColumn(
        name: "NewColumn",
        table: "ExistingTable");

    migrationBuilder.DropColumn(
        name: "Status",
        table: "ExistingTable");
}
```

### Adding Foreign Keys

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Add FK column first
    migrationBuilder.AddColumn<int>(
        name: "ParentId",
        table: "ChildTable",
        type: "int",
        nullable: true);

    // Add index for FK
    migrationBuilder.CreateIndex(
        name: "IX_ChildTable_ParentId",
        table: "ChildTable",
        column: "ParentId");

    // Add FK constraint
    migrationBuilder.AddForeignKey(
        name: "FK_ChildTable_ParentTable_ParentId",
        table: "ChildTable",
        column: "ParentId",
        principalTable: "ParentTable",
        principalColumn: "Id",
        onDelete: ReferentialAction.SetNull);  // or Cascade, Restrict
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // Drop FK first
    migrationBuilder.DropForeignKey(
        name: "FK_ChildTable_ParentTable_ParentId",
        table: "ChildTable");

    // Drop index
    migrationBuilder.DropIndex(
        name: "IX_ChildTable_ParentId",
        table: "ChildTable");

    // Drop column
    migrationBuilder.DropColumn(
        name: "ParentId",
        table: "ChildTable");
}
```

### Renaming

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Rename column
    migrationBuilder.RenameColumn(
        name: "OldColumnName",
        table: "TableName",
        newName: "NewColumnName");

    // Rename table
    migrationBuilder.RenameTable(
        name: "OldTableName",
        newName: "NewTableName");

    // Rename index
    migrationBuilder.RenameIndex(
        name: "IX_OldName",
        table: "TableName",
        newName: "IX_NewName");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.RenameColumn(
        name: "NewColumnName",
        table: "TableName",
        newName: "OldColumnName");

    migrationBuilder.RenameTable(
        name: "NewTableName",
        newName: "OldTableName");

    migrationBuilder.RenameIndex(
        name: "IX_NewName",
        table: "TableName",
        newName: "IX_OldName");
}
```

### Altering Columns

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Change data type or constraints
    migrationBuilder.AlterColumn<string>(
        name: "Name",
        table: "TableName",
        type: "nvarchar(200)",
        maxLength: 200,
        nullable: false,
        oldClrType: typeof(string),
        oldType: "nvarchar(100)",
        oldMaxLength: 100,
        oldNullable: true);
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AlterColumn<string>(
        name: "Name",
        table: "TableName",
        type: "nvarchar(100)",
        maxLength: 100,
        nullable: true,
        oldClrType: typeof(string),
        oldType: "nvarchar(200)",
        oldMaxLength: 200,
        oldNullable: false);
}
```

### Data Migration (When Raw SQL is OK)

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Use raw SQL for data updates
    migrationBuilder.Sql(@"
        UPDATE Sales
        SET Status = 'Completed'
        WHERE Status IS NULL OR Status = '';
    ");

    // Can check provider if needed
    var provider = migrationBuilder.ActiveProvider;
    if (provider?.Contains("SqlServer") == true)
    {
        migrationBuilder.Sql("UPDATE Sales SET Status = 'Active' WHERE Status = 'Open';");
    }
    else if (provider?.Contains("MySql") == true)
    {
        migrationBuilder.Sql("UPDATE Sales SET Status = 'Active' WHERE Status = 'Open';");
    }
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // Usually can't reverse data changes
    // Document that this is a one-way migration
}
```

## Entity Model Template

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models.Entities.Branch
{
    [Table("YourTableName")]
    public class YourEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string UpdatedBy { get; set; } = string.Empty;

        // Foreign Key
        public int? ParentId { get; set; }

        // Navigation Property
        [ForeignKey("ParentId")]
        public virtual Parent? Parent { get; set; }
    }
}
```

## DbContext Configuration Template

```csharp
// In Backend/Data/Branch/BranchDbContext.cs

public DbSet<YourEntity> YourEntities { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<YourEntity>(entity =>
    {
        // Primary Key
        entity.HasKey(e => e.Id);

        // Indexes
        entity.HasIndex(e => e.Name);
        entity.HasIndex(e => e.IsActive);

        // Properties
        entity.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);

        entity.Property(e => e.Description)
            .HasMaxLength(500);

        entity.Property(e => e.IsActive)
            .HasDefaultValue(true);

        // Relationships
        entity.HasOne(e => e.Parent)
            .WithMany()
            .HasForeignKey(e => e.ParentId)
            .OnDelete(DeleteBehavior.SetNull);
    });
}
```

## Testing Commands

```bash
# Apply migration
dotnet ef database update --context BranchDbContext

# Rollback to previous migration
dotnet ef database update PreviousMigrationName --context BranchDbContext

# Rollback all migrations
dotnet ef database update 0 --context BranchDbContext

# Re-apply latest
dotnet ef database update --context BranchDbContext

# List migrations
dotnet ef migrations list --context BranchDbContext

# Remove last migration (if not applied)
dotnet ef migrations remove --context BranchDbContext
```

## Checklist

Before committing:

- [ ] Entity model updated with data annotations
- [ ] DbContext.OnModelCreating() configured
- [ ] Migration generated with `dotnet ef migrations add`
- [ ] Reviewed Up() method - uses EF methods, not raw SQL
- [ ] Reviewed Down() method - properly reverses Up()
- [ ] Tested applying migration locally
- [ ] Tested rolling back migration locally
- [ ] No hardcoded provider-specific SQL (unless data migration)
- [ ] Foreign keys added AFTER columns
- [ ] Foreign keys dropped BEFORE columns in Down()

## Remember

✅ **DO**: Use `migrationBuilder.CreateTable()`, `AddColumn()`, `AddForeignKey()`, etc.

❌ **DON'T**: Use `migrationBuilder.Sql("CREATE TABLE ...")` for schema changes

**Why?** EF Core handles all provider differences automatically!
