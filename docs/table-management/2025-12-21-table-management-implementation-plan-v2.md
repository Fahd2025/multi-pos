# Table Management System - Implementation Plan v2

**Date:** 2025-12-21
**Version:** 2.0 (Corrected & Enhanced)
**Target:** Full-stack Implementation (React 19 + Next.js 16 + ASP.NET Core 8)
**Reference:** Old Project Analysis + Architecture Review

---

## 📋 Document Changelog

**v2.0 Changes:**
- ✅ Removed branch isolation (each branch has separate DB)
- ✅ Fixed type mismatches (number IDs instead of string)
- ✅ Added GuestCount to Sale entity
- ✅ Added TableId and TableNumber to Sale entity
- ✅ Included full Zone implementation in this phase
- ✅ Added hybrid drag-and-drop positioning
- ✅ Added cashier permissions with read-only option
- ✅ Implemented missing service methods
- ✅ Fixed precision validation issues
- ✅ Enhanced error handling
- ✅ Added AutoMapper recommendations
- ✅ Corrected implementation sequence

---

## 1. Overview

This plan outlines the implementation of a comprehensive table management system for the POS application, with improvements based on architectural review.

### Key Features

- **Visual floor plan** with hybrid drag-and-drop AND manual positioning
- **Real-time table status** (Available, Occupied, Reserved)
- **Zone management** (Main Hall, Patio, Bar, etc.)
- **Table management** (Add, Edit, Delete tables)
- **Order assignment** to tables with guest count tracking
- **Table operations**: Transfer orders, split bills, clear tables
- **Live status updates** with auto-refresh
- **Role-based permissions** with configurable cashier access
- **RTL support** for Arabic language

---

## 2. System Architecture Analysis

### Database Design - Multi-Tenancy Model

**Important:** Each branch has its own separate database, so NO branch filtering is needed in queries.

**Database per Branch:**
```
Branch_001.db (or Branch_001 schema)
├── Tables (local to this branch)
├── Sales (local to this branch)
├── Products (local to this branch)
└── Zones (local to this branch)

Branch_002.db (or Branch_002 schema)
├── Tables (separate set)
├── Sales (separate set)
└── ...
```

### Enhanced Entity Design

#### Zone Entity

**File:** `Backend/Models/Entities/Branch/Zone.cs`

```csharp
namespace Backend.Models.Entities.Branch;

public class Zone
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;

    // Navigation
    public ICollection<Table> Tables { get; set; } = new List<Table>();
}
```

#### Table Entity (Enhanced)

**File:** `Backend/Models/Entities/Branch/Table.cs`

```csharp
namespace Backend.Models.Entities.Branch;

public class Table
{
    public int Id { get; set; }

    [Required]
    public int Number { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100 guests")]
    public int Capacity { get; set; }

    // Positioning (percentage-based: 0-100)
    [Required]
    [Range(0, 100)]
    public decimal PositionX { get; set; }

    [Required]
    [Range(0, 100)]
    public decimal PositionY { get; set; }

    [Range(1, 100)]
    public decimal Width { get; set; } = 10; // Default width %

    [Range(1, 100)]
    public decimal Height { get; set; } = 10; // Default height %

    [Range(0, 360)]
    public int Rotation { get; set; } = 0;

    [MaxLength(20)]
    public string Shape { get; set; } = "Rectangle"; // Rectangle, Circle, Square

    public bool IsActive { get; set; } = true;

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;

    // Navigation
    public int? ZoneId { get; set; }
    public Zone? Zone { get; set; }
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
```

#### Sale Entity Updates

**File:** `Backend/Models/Entities/Branch/Sale.cs`

Add these properties to your existing Sale entity:

```csharp
// Table Management Properties
public int? TableId { get; set; }
public Table? Table { get; set; }

[Range(1, int.MaxValue, ErrorMessage = "Table number must be positive")]
public int? TableNumber { get; set; }

[Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
public int? GuestCount { get; set; }
```

---

## 3. Backend Implementation

### Phase 1: Database Configuration

#### 3.1 Update BranchDbContext

**File:** `Backend/Data/BranchDbContext.cs`

```csharp
public DbSet<Zone> Zones { get; set; } = null!;
public DbSet<Table> Tables { get; set; } = null!;

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // ... existing configurations

    // Zone configuration
    modelBuilder.Entity<Zone>(entity =>
    {
        entity.HasKey(z => z.Id);
        entity.HasIndex(z => z.DisplayOrder);
        entity.Property(z => z.Name).IsRequired().HasMaxLength(50);
    });

    // Table configuration
    modelBuilder.Entity<Table>(entity =>
    {
        entity.HasKey(t => t.Id);

        // Unique table number per branch (since each branch has separate DB)
        entity.HasIndex(t => t.Number).IsUnique();

        // Precision for positioning (0.00 to 100.00)
        entity.Property(t => t.PositionX).HasPrecision(5, 2);
        entity.Property(t => t.PositionY).HasPrecision(5, 2);
        entity.Property(t => t.Width).HasPrecision(5, 2);
        entity.Property(t => t.Height).HasPrecision(5, 2);

        // Zone relationship
        entity.HasOne(t => t.Zone)
              .WithMany(z => z.Tables)
              .HasForeignKey(t => t.ZoneId)
              .OnDelete(DeleteBehavior.SetNull);

        // Sales relationship
        entity.HasMany(t => t.Sales)
              .WithOne(s => s.Table)
              .HasForeignKey(s => s.TableId)
              .OnDelete(DeleteBehavior.SetNull);
    });

    // Update Sale entity configuration
    modelBuilder.Entity<Sale>(entity =>
    {
        // ... existing configurations

        // Table relationship
        entity.HasOne(s => s.Table)
              .WithMany(t => t.Sales)
              .HasForeignKey(s => s.TableId)
              .OnDelete(DeleteBehavior.SetNull);
    });
}
```

#### 3.2 Create Migration

```bash
cd Backend
dotnet ef migrations add AddTableManagementSystem --context BranchDbContext
dotnet ef database update --context BranchDbContext
```

---

### Phase 2: DTOs

#### 3.3 Zone DTOs

**File:** `Backend/Models/DTOs/Branch/Tables/ZoneDto.cs`

```csharp
namespace Backend.Models.DTOs.Branch.Tables;

public record ZoneDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; }
    public int TableCount { get; init; }
}

public record CreateZoneDto
{
    [Required(ErrorMessage = "Zone name is required")]
    [MaxLength(50, ErrorMessage = "Zone name must not exceed 50 characters")]
    public string Name { get; init; } = string.Empty;

    [MaxLength(200, ErrorMessage = "Description must not exceed 200 characters")]
    public string? Description { get; init; }

    [Range(0, int.MaxValue, ErrorMessage = "Display order must be non-negative")]
    public int DisplayOrder { get; init; }
}

public record UpdateZoneDto
{
    [Required(ErrorMessage = "Zone name is required")]
    [MaxLength(50, ErrorMessage = "Zone name must not exceed 50 characters")]
    public string Name { get; init; } = string.Empty;

    [MaxLength(200, ErrorMessage = "Description must not exceed 200 characters")]
    public string? Description { get; init; }

    [Range(0, int.MaxValue, ErrorMessage = "Display order must be non-negative")]
    public int DisplayOrder { get; init; }

    public bool IsActive { get; init; } = true;
}
```

#### 3.4 Table DTOs (Fixed)

**File:** `Backend/Models/DTOs/Branch/Tables/TableDto.cs`

```csharp
namespace Backend.Models.DTOs.Branch.Tables;

public record PositionDto
{
    public decimal X { get; init; }
    public decimal Y { get; init; }
    public int Rotation { get; init; }
}

public record DimensionDto
{
    public decimal Width { get; init; }
    public decimal Height { get; init; }
    public string Shape { get; init; } = "Rectangle";
}

public record TableDto
{
    public int Id { get; init; }
    public int Number { get; init; }
    public string Name { get; init; } = string.Empty;
    public int Capacity { get; init; }
    public PositionDto Position { get; init; } = new();
    public DimensionDto Dimensions { get; init; } = new();
    public int? ZoneId { get; init; }
    public string? ZoneName { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record TableWithStatusDto : TableDto
{
    public string Status { get; init; } = "available"; // available, occupied, reserved
    public int? SaleId { get; init; }
    public string? InvoiceNumber { get; init; }
    public int? GuestCount { get; init; }
    public string? OrderTime { get; init; }
    public decimal? OrderTotal { get; init; }
}

public record CreateTableDto
{
    [Required(ErrorMessage = "Table number is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Table number must be positive")]
    public int Number { get; init; }

    [Required(ErrorMessage = "Table name is required")]
    [MaxLength(100, ErrorMessage = "Table name must not exceed 100 characters")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "Capacity is required")]
    [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100")]
    public int Capacity { get; init; }

    [Required(ErrorMessage = "Position is required")]
    public PositionDto Position { get; init; } = new();

    public DimensionDto Dimensions { get; init; } = new() { Width = 10, Height = 10, Shape = "Rectangle" };

    public int? ZoneId { get; init; }
}

public record UpdateTableDto
{
    [Required(ErrorMessage = "Table number is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Table number must be positive")]
    public int Number { get; init; }

    [Required(ErrorMessage = "Table name is required")]
    [MaxLength(100, ErrorMessage = "Table name must not exceed 100 characters")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "Capacity is required")]
    [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100")]
    public int Capacity { get; init; }

    [Required(ErrorMessage = "Position is required")]
    public PositionDto Position { get; init; } = new();

    public DimensionDto Dimensions { get; init; } = new();

    public int? ZoneId { get; init; }

    public bool IsActive { get; init; } = true;
}

public record TransferTableDto
{
    [Required(ErrorMessage = "Sale ID is required")]
    public int SaleId { get; init; }

    [Required(ErrorMessage = "Source table number is required")]
    public int FromTableNumber { get; init; }

    [Required(ErrorMessage = "Target table number is required")]
    public int ToTableNumber { get; init; }
}

public record AssignTableDto
{
    [Required(ErrorMessage = "Table number is required")]
    public int TableNumber { get; init; }

    [Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
    public int GuestCount { get; init; } = 1;
}
```

---

### Phase 3: Service Layer

#### 3.5 Zone Service

**File:** `Backend/Services/Branch/ZoneService.cs`

```csharp
namespace Backend.Services.Branch;

public interface IZoneService
{
    Task<IEnumerable<ZoneDto>> GetAllZonesAsync();
    Task<ZoneDto?> GetZoneByIdAsync(int id);
    Task<ZoneDto> CreateZoneAsync(CreateZoneDto dto, string userId);
    Task<ZoneDto> UpdateZoneAsync(int id, UpdateZoneDto dto, string userId);
    Task<bool> DeleteZoneAsync(int id);
}

public class ZoneService : IZoneService
{
    private readonly BranchDbContext _context;
    private readonly ILogger<ZoneService> _logger;

    public ZoneService(BranchDbContext context, ILogger<ZoneService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ZoneDto>> GetAllZonesAsync()
    {
        return await _context.Zones
            .Where(z => z.IsActive)
            .OrderBy(z => z.DisplayOrder)
            .Select(z => new ZoneDto
            {
                Id = z.Id,
                Name = z.Name,
                Description = z.Description,
                DisplayOrder = z.DisplayOrder,
                IsActive = z.IsActive,
                TableCount = z.Tables.Count(t => t.IsActive)
            })
            .ToListAsync();
    }

    public async Task<ZoneDto?> GetZoneByIdAsync(int id)
    {
        var zone = await _context.Zones
            .Where(z => z.Id == id && z.IsActive)
            .Select(z => new ZoneDto
            {
                Id = z.Id,
                Name = z.Name,
                Description = z.Description,
                DisplayOrder = z.DisplayOrder,
                IsActive = z.IsActive,
                TableCount = z.Tables.Count(t => t.IsActive)
            })
            .FirstOrDefaultAsync();

        return zone;
    }

    public async Task<ZoneDto> CreateZoneAsync(CreateZoneDto dto, string userId)
    {
        var zone = new Zone
        {
            Name = dto.Name,
            Description = dto.Description,
            DisplayOrder = dto.DisplayOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        _context.Zones.Add(zone);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Zone created: {ZoneName} (ID: {ZoneId}) by user {UserId}",
            zone.Name, zone.Id, userId);

        return new ZoneDto
        {
            Id = zone.Id,
            Name = zone.Name,
            Description = zone.Description,
            DisplayOrder = zone.DisplayOrder,
            IsActive = zone.IsActive,
            TableCount = 0
        };
    }

    public async Task<ZoneDto> UpdateZoneAsync(int id, UpdateZoneDto dto, string userId)
    {
        var zone = await _context.Zones.FindAsync(id);
        if (zone == null)
            throw new KeyNotFoundException($"Zone with ID {id} not found");

        zone.Name = dto.Name;
        zone.Description = dto.Description;
        zone.DisplayOrder = dto.DisplayOrder;
        zone.IsActive = dto.IsActive;
        zone.UpdatedAt = DateTime.UtcNow;
        zone.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Zone updated: {ZoneName} (ID: {ZoneId}) by user {UserId}",
            zone.Name, zone.Id, userId);

        return new ZoneDto
        {
            Id = zone.Id,
            Name = zone.Name,
            Description = zone.Description,
            DisplayOrder = zone.DisplayOrder,
            IsActive = zone.IsActive,
            TableCount = await _context.Tables.CountAsync(t => t.ZoneId == id && t.IsActive)
        };
    }

    public async Task<bool> DeleteZoneAsync(int id)
    {
        var zone = await _context.Zones.FindAsync(id);
        if (zone == null)
            return false;

        // Check for tables in this zone
        var hasActiveTables = await _context.Tables
            .AnyAsync(t => t.ZoneId == id && t.IsActive);

        if (hasActiveTables)
        {
            throw new InvalidOperationException("Cannot delete zone with active tables. Please reassign or delete tables first.");
        }

        // Soft delete
        zone.IsActive = false;
        zone.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Zone soft-deleted: {ZoneName} (ID: {ZoneId})", zone.Name, zone.Id);

        return true;
    }
}
```

#### 3.6 Table Service (Complete & Corrected)

**File:** `Backend/Services/Branch/TableService.cs`

```csharp
namespace Backend.Services.Branch;

public interface ITableService
{
    Task<IEnumerable<TableDto>> GetAllTablesAsync(int? zoneId = null);
    Task<IEnumerable<TableWithStatusDto>> GetTablesWithStatusAsync(int? zoneId = null);
    Task<TableDto?> GetTableByIdAsync(int id);
    Task<TableDto?> GetTableByNumberAsync(int number);
    Task<TableDto> CreateTableAsync(CreateTableDto dto, string userId);
    Task<TableDto> UpdateTableAsync(int id, UpdateTableDto dto, string userId);
    Task<bool> DeleteTableAsync(int id);
    Task<bool> TransferOrderAsync(TransferTableDto dto, string userId);
    Task<bool> ClearTableAsync(int tableNumber, string userId);
    Task<int> AssignTableToSaleAsync(int saleId, AssignTableDto dto);
}

public class TableService : ITableService
{
    private readonly BranchDbContext _context;
    private readonly ILogger<TableService> _logger;

    public TableService(BranchDbContext context, ILogger<TableService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<TableDto>> GetAllTablesAsync(int? zoneId = null)
    {
        var query = _context.Tables
            .Include(t => t.Zone)
            .Where(t => t.IsActive);

        if (zoneId.HasValue)
        {
            query = query.Where(t => t.ZoneId == zoneId.Value);
        }

        return await query
            .OrderBy(t => t.ZoneId ?? int.MaxValue)
            .ThenBy(t => t.Number)
            .Select(t => new TableDto
            {
                Id = t.Id,
                Number = t.Number,
                Name = t.Name,
                Capacity = t.Capacity,
                Position = new PositionDto
                {
                    X = t.PositionX,
                    Y = t.PositionY,
                    Rotation = t.Rotation
                },
                Dimensions = new DimensionDto
                {
                    Width = t.Width,
                    Height = t.Height,
                    Shape = t.Shape
                },
                ZoneId = t.ZoneId,
                ZoneName = t.Zone != null ? t.Zone.Name : null,
                IsActive = t.IsActive,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<TableWithStatusDto>> GetTablesWithStatusAsync(int? zoneId = null)
    {
        var query = _context.Tables
            .Include(t => t.Zone)
            .Where(t => t.IsActive);

        if (zoneId.HasValue)
        {
            query = query.Where(t => t.ZoneId == zoneId.Value);
        }

        var tables = await query
            .OrderBy(t => t.ZoneId ?? int.MaxValue)
            .ThenBy(t => t.Number)
            .ToListAsync();

        // Get active dine-in orders
        var activeOrders = await _context.Sales
            .Where(s => s.OrderType == "dine-in"
                     && s.Status == "open"
                     && s.TableId != null)
            .Include(s => s.SalesItems)
            .ToListAsync();

        return tables.Select(table =>
        {
            var sale = activeOrders.FirstOrDefault(o => o.TableId == table.Id);

            if (sale != null)
            {
                var orderTime = DateTime.UtcNow - sale.CreatedAt;
                var timeString = orderTime.Hours > 0
                    ? $"{orderTime.Hours}h {orderTime.Minutes}m"
                    : $"{orderTime.Minutes}m";

                return new TableWithStatusDto
                {
                    Id = table.Id,
                    Number = table.Number,
                    Name = table.Name,
                    Capacity = table.Capacity,
                    Position = new PositionDto
                    {
                        X = table.PositionX,
                        Y = table.PositionY,
                        Rotation = table.Rotation
                    },
                    Dimensions = new DimensionDto
                    {
                        Width = table.Width,
                        Height = table.Height,
                        Shape = table.Shape
                    },
                    ZoneId = table.ZoneId,
                    ZoneName = table.Zone?.Name,
                    IsActive = table.IsActive,
                    CreatedAt = table.CreatedAt,
                    UpdatedAt = table.UpdatedAt,
                    Status = "occupied",
                    SaleId = sale.Id,
                    InvoiceNumber = sale.InvoiceNumber,
                    GuestCount = sale.GuestCount, // ✅ Now uses Sale.GuestCount
                    OrderTime = timeString,
                    OrderTotal = sale.Total
                };
            }

            return new TableWithStatusDto
            {
                Id = table.Id,
                Number = table.Number,
                Name = table.Name,
                Capacity = table.Capacity,
                Position = new PositionDto
                {
                    X = table.PositionX,
                    Y = table.PositionY,
                    Rotation = table.Rotation
                },
                Dimensions = new DimensionDto
                {
                    Width = table.Width,
                    Height = table.Height,
                    Shape = table.Shape
                },
                ZoneId = table.ZoneId,
                ZoneName = table.Zone?.Name,
                IsActive = table.IsActive,
                CreatedAt = table.CreatedAt,
                UpdatedAt = table.UpdatedAt,
                Status = "available"
            };
        });
    }

    public async Task<TableDto?> GetTableByIdAsync(int id)
    {
        var table = await _context.Tables
            .Include(t => t.Zone)
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

        if (table == null)
            return null;

        return new TableDto
        {
            Id = table.Id,
            Number = table.Number,
            Name = table.Name,
            Capacity = table.Capacity,
            Position = new PositionDto
            {
                X = table.PositionX,
                Y = table.PositionY,
                Rotation = table.Rotation
            },
            Dimensions = new DimensionDto
            {
                Width = table.Width,
                Height = table.Height,
                Shape = table.Shape
            },
            ZoneId = table.ZoneId,
            ZoneName = table.Zone?.Name,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt,
            UpdatedAt = table.UpdatedAt
        };
    }

    public async Task<TableDto?> GetTableByNumberAsync(int number)
    {
        var table = await _context.Tables
            .Include(t => t.Zone)
            .FirstOrDefaultAsync(t => t.Number == number && t.IsActive);

        if (table == null)
            return null;

        return new TableDto
        {
            Id = table.Id,
            Number = table.Number,
            Name = table.Name,
            Capacity = table.Capacity,
            Position = new PositionDto
            {
                X = table.PositionX,
                Y = table.PositionY,
                Rotation = table.Rotation
            },
            Dimensions = new DimensionDto
            {
                Width = table.Width,
                Height = table.Height,
                Shape = table.Shape
            },
            ZoneId = table.ZoneId,
            ZoneName = table.Zone?.Name,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt,
            UpdatedAt = table.UpdatedAt
        };
    }

    public async Task<TableDto> CreateTableAsync(CreateTableDto dto, string userId)
    {
        // Check for duplicate table number
        if (await _context.Tables.AnyAsync(t => t.Number == dto.Number && t.IsActive))
        {
            throw new InvalidOperationException($"Table number {dto.Number} already exists");
        }

        // Validate zone if provided
        if (dto.ZoneId.HasValue)
        {
            var zoneExists = await _context.Zones.AnyAsync(z => z.Id == dto.ZoneId.Value && z.IsActive);
            if (!zoneExists)
            {
                throw new KeyNotFoundException($"Zone with ID {dto.ZoneId.Value} not found");
            }
        }

        var table = new Table
        {
            Number = dto.Number,
            Name = dto.Name,
            Capacity = dto.Capacity,
            PositionX = dto.Position.X,
            PositionY = dto.Position.Y,
            Rotation = dto.Position.Rotation,
            Width = dto.Dimensions.Width,
            Height = dto.Dimensions.Height,
            Shape = dto.Dimensions.Shape,
            ZoneId = dto.ZoneId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        _context.Tables.Add(table);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Table created: {TableName} (Number: {TableNumber}) by user {UserId}",
            table.Name, table.Number, userId);

        // Load zone for response
        await _context.Entry(table).Reference(t => t.Zone).LoadAsync();

        return new TableDto
        {
            Id = table.Id,
            Number = table.Number,
            Name = table.Name,
            Capacity = table.Capacity,
            Position = new PositionDto
            {
                X = table.PositionX,
                Y = table.PositionY,
                Rotation = table.Rotation
            },
            Dimensions = new DimensionDto
            {
                Width = table.Width,
                Height = table.Height,
                Shape = table.Shape
            },
            ZoneId = table.ZoneId,
            ZoneName = table.Zone?.Name,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt,
            UpdatedAt = table.UpdatedAt
        };
    }

    public async Task<TableDto> UpdateTableAsync(int id, UpdateTableDto dto, string userId)
    {
        var table = await _context.Tables.FindAsync(id);
        if (table == null)
            throw new KeyNotFoundException($"Table with ID {id} not found");

        // Check for duplicate table number (excluding current table)
        if (await _context.Tables.AnyAsync(t => t.Number == dto.Number && t.Id != id && t.IsActive))
        {
            throw new InvalidOperationException($"Table number {dto.Number} already exists");
        }

        // Validate zone if provided
        if (dto.ZoneId.HasValue)
        {
            var zoneExists = await _context.Zones.AnyAsync(z => z.Id == dto.ZoneId.Value && z.IsActive);
            if (!zoneExists)
            {
                throw new KeyNotFoundException($"Zone with ID {dto.ZoneId.Value} not found");
            }
        }

        table.Number = dto.Number;
        table.Name = dto.Name;
        table.Capacity = dto.Capacity;
        table.PositionX = dto.Position.X;
        table.PositionY = dto.Position.Y;
        table.Rotation = dto.Position.Rotation;
        table.Width = dto.Dimensions.Width;
        table.Height = dto.Dimensions.Height;
        table.Shape = dto.Dimensions.Shape;
        table.ZoneId = dto.ZoneId;
        table.IsActive = dto.IsActive;
        table.UpdatedAt = DateTime.UtcNow;
        table.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Table updated: {TableName} (Number: {TableNumber}) by user {UserId}",
            table.Name, table.Number, userId);

        // Load zone for response
        await _context.Entry(table).Reference(t => t.Zone).LoadAsync();

        return new TableDto
        {
            Id = table.Id,
            Number = table.Number,
            Name = table.Name,
            Capacity = table.Capacity,
            Position = new PositionDto
            {
                X = table.PositionX,
                Y = table.PositionY,
                Rotation = table.Rotation
            },
            Dimensions = new DimensionDto
            {
                Width = table.Width,
                Height = table.Height,
                Shape = table.Shape
            },
            ZoneId = table.ZoneId,
            ZoneName = table.Zone?.Name,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt,
            UpdatedAt = table.UpdatedAt
        };
    }

    public async Task<bool> DeleteTableAsync(int id)
    {
        var table = await _context.Tables.FindAsync(id);
        if (table == null)
            return false;

        // Check for active orders
        var hasActiveOrders = await _context.Sales
            .AnyAsync(s => s.TableId == id && s.Status == "open");

        if (hasActiveOrders)
        {
            throw new InvalidOperationException("Cannot delete table with active orders. Please clear or transfer orders first.");
        }

        // Soft delete
        table.IsActive = false;
        table.UpdatedAt = DateTime.UtcNow;
        table.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Table soft-deleted: {TableName} (Number: {TableNumber})",
            table.Name, table.Number);

        return true;
    }

    public async Task<bool> TransferOrderAsync(TransferTableDto dto, string userId)
    {
        var sale = await _context.Sales
            .Include(s => s.Table)
            .FirstOrDefaultAsync(s => s.Id == dto.SaleId);

        if (sale == null)
            throw new KeyNotFoundException($"Sale with ID {dto.SaleId} not found");

        var toTable = await _context.Tables
            .FirstOrDefaultAsync(t => t.Number == dto.ToTableNumber && t.IsActive);

        if (toTable == null)
            throw new KeyNotFoundException($"Target table {dto.ToTableNumber} not found");

        // Check if target table is available
        var targetHasOrder = await _context.Sales
            .AnyAsync(s => s.TableId == toTable.Id && s.Status == "open");

        if (targetHasOrder)
        {
            throw new InvalidOperationException("Target table is already occupied");
        }

        var fromTableNumber = sale.TableNumber;

        sale.TableId = toTable.Id;
        sale.TableNumber = toTable.Number;
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Order transferred: Sale {SaleId} from Table {FromTable} to Table {ToTable} by user {UserId}",
            sale.Id, fromTableNumber, toTable.Number, userId);

        return true;
    }

    public async Task<bool> ClearTableAsync(int tableNumber, string userId)
    {
        var table = await _context.Tables
            .FirstOrDefaultAsync(t => t.Number == tableNumber && t.IsActive);

        if (table == null)
            throw new KeyNotFoundException($"Table {tableNumber} not found");

        var sale = await _context.Sales
            .FirstOrDefaultAsync(s => s.TableId == table.Id && s.Status == "open");

        if (sale == null)
            return false; // Table already clear

        sale.Status = "completed";
        sale.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Table cleared: Table {TableNumber} (Sale {SaleId}) by user {UserId}",
            tableNumber, sale.Id, userId);

        return true;
    }

    public async Task<int> AssignTableToSaleAsync(int saleId, AssignTableDto dto)
    {
        var sale = await _context.Sales.FindAsync(saleId);
        if (sale == null)
            throw new KeyNotFoundException($"Sale with ID {saleId} not found");

        var table = await _context.Tables
            .FirstOrDefaultAsync(t => t.Number == dto.TableNumber && t.IsActive);

        if (table == null)
            throw new KeyNotFoundException($"Table {dto.TableNumber} not found");

        // Check if table is already occupied
        var tableOccupied = await _context.Sales
            .AnyAsync(s => s.TableId == table.Id && s.Status == "open" && s.Id != saleId);

        if (tableOccupied)
        {
            throw new InvalidOperationException($"Table {dto.TableNumber} is already occupied");
        }

        sale.TableId = table.Id;
        sale.TableNumber = table.Number;
        sale.GuestCount = dto.GuestCount;
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Table assigned: Table {TableNumber} assigned to Sale {SaleId} with {GuestCount} guests",
            table.Number, saleId, dto.GuestCount);

        return table.Id;
    }
}
```

---

### Phase 4: API Endpoints

#### 3.7 Register Services and Add Endpoints

**File:** `Backend/Program.cs`

```csharp
// ============================================
// SERVICE REGISTRATION
// ============================================

// ... existing services

// Table Management Services
builder.Services.AddScoped<IZoneService, ZoneService>();
builder.Services.AddScoped<ITableService, TableService>();

// ============================================
// API ENDPOINTS
// ============================================

// ... existing endpoints

// ============================================
// ZONE MANAGEMENT ENDPOINTS
// ============================================

var zonesGroup = app.MapGroup("/api/v1/zones")
    .RequireAuthorization()
    .WithTags("Zones")
    .WithOpenApi();

// GET /api/v1/zones - Get all zones
zonesGroup.MapGet("/", async (IZoneService zoneService) =>
{
    var zones = await zoneService.GetAllZonesAsync();
    return Results.Ok(zones);
})
.WithName("GetAllZones")
.Produces<IEnumerable<ZoneDto>>();

// GET /api/v1/zones/{id} - Get zone by ID
zonesGroup.MapGet("/{id:int}", async (int id, IZoneService zoneService) =>
{
    var zone = await zoneService.GetZoneByIdAsync(id);
    return zone != null ? Results.Ok(zone) : Results.NotFound();
})
.WithName("GetZoneById")
.Produces<ZoneDto>()
.Produces(StatusCodes.Status404NotFound);

// POST /api/v1/zones - Create new zone
zonesGroup.MapPost("/", async (
    CreateZoneDto dto,
    IZoneService zoneService,
    HttpContext httpContext) =>
{
    try
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
        var zone = await zoneService.CreateZoneAsync(dto, userId);
        return Results.Created($"/api/v1/zones/{zone.Id}", zone);
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("CreateZone")
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
.Produces<ZoneDto>(StatusCodes.Status201Created)
.Produces(StatusCodes.Status400BadRequest);

// PUT /api/v1/zones/{id} - Update zone
zonesGroup.MapPut("/{id:int}", async (
    int id,
    UpdateZoneDto dto,
    IZoneService zoneService,
    HttpContext httpContext) =>
{
    try
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
        var zone = await zoneService.UpdateZoneAsync(id, dto, userId);
        return Results.Ok(zone);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("UpdateZone")
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
.Produces<ZoneDto>()
.Produces(StatusCodes.Status404NotFound)
.Produces(StatusCodes.Status400BadRequest);

// DELETE /api/v1/zones/{id} - Delete zone
zonesGroup.MapDelete("/{id:int}", async (int id, IZoneService zoneService) =>
{
    try
    {
        var deleted = await zoneService.DeleteZoneAsync(id);
        return deleted ? Results.NoContent() : Results.NotFound();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("DeleteZone")
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
.Produces(StatusCodes.Status204NoContent)
.Produces(StatusCodes.Status404NotFound)
.Produces(StatusCodes.Status400BadRequest);

// ============================================
// TABLE MANAGEMENT ENDPOINTS
// ============================================

var tablesGroup = app.MapGroup("/api/v1/tables")
    .RequireAuthorization()
    .WithTags("Tables")
    .WithOpenApi();

// GET /api/v1/tables - Get all tables (optionally filtered by zone)
tablesGroup.MapGet("/", async (
    [FromQuery] int? zoneId,
    ITableService tableService) =>
{
    var tables = await tableService.GetAllTablesAsync(zoneId);
    return Results.Ok(tables);
})
.WithName("GetAllTables")
.Produces<IEnumerable<TableDto>>();

// GET /api/v1/tables/status - Get tables with current order status
tablesGroup.MapGet("/status", async (
    [FromQuery] int? zoneId,
    ITableService tableService) =>
{
    var tables = await tableService.GetTablesWithStatusAsync(zoneId);
    return Results.Ok(tables);
})
.WithName("GetTablesWithStatus")
.Produces<IEnumerable<TableWithStatusDto>>();

// GET /api/v1/tables/{id} - Get table by ID
tablesGroup.MapGet("/{id:int}", async (int id, ITableService tableService) =>
{
    var table = await tableService.GetTableByIdAsync(id);
    return table != null ? Results.Ok(table) : Results.NotFound();
})
.WithName("GetTableById")
.Produces<TableDto>()
.Produces(StatusCodes.Status404NotFound);

// GET /api/v1/tables/number/{number} - Get table by number
tablesGroup.MapGet("/number/{number:int}", async (int number, ITableService tableService) =>
{
    var table = await tableService.GetTableByNumberAsync(number);
    return table != null ? Results.Ok(table) : Results.NotFound();
})
.WithName("GetTableByNumber")
.Produces<TableDto>()
.Produces(StatusCodes.Status404NotFound);

// POST /api/v1/tables - Create new table
tablesGroup.MapPost("/", async (
    CreateTableDto dto,
    ITableService tableService,
    HttpContext httpContext) =>
{
    try
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
        var table = await tableService.CreateTableAsync(dto, userId);
        return Results.Created($"/api/v1/tables/{table.Id}", table);
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (KeyNotFoundException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("CreateTable")
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
.Produces<TableDto>(StatusCodes.Status201Created)
.Produces(StatusCodes.Status400BadRequest);

// PUT /api/v1/tables/{id} - Update table
tablesGroup.MapPut("/{id:int}", async (
    int id,
    UpdateTableDto dto,
    ITableService tableService,
    HttpContext httpContext) =>
{
    try
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
        var table = await tableService.UpdateTableAsync(id, dto, userId);
        return Results.Ok(table);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("UpdateTable")
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
.Produces<TableDto>()
.Produces(StatusCodes.Status404NotFound)
.Produces(StatusCodes.Status400BadRequest);

// DELETE /api/v1/tables/{id} - Delete table
tablesGroup.MapDelete("/{id:int}", async (int id, ITableService tableService) =>
{
    try
    {
        var deleted = await tableService.DeleteTableAsync(id);
        return deleted ? Results.NoContent() : Results.NotFound();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("DeleteTable")
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
.Produces(StatusCodes.Status204NoContent)
.Produces(StatusCodes.Status404NotFound)
.Produces(StatusCodes.Status400BadRequest);

// POST /api/v1/tables/transfer - Transfer order between tables
tablesGroup.MapPost("/transfer", async (
    TransferTableDto dto,
    ITableService tableService,
    HttpContext httpContext) =>
{
    try
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
        var success = await tableService.TransferOrderAsync(dto, userId);
        return success ? Results.Ok(new { message = "Order transferred successfully" }) : Results.NotFound();
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("TransferOrder")
.Produces(StatusCodes.Status200OK)
.Produces(StatusCodes.Status404NotFound)
.Produces(StatusCodes.Status400BadRequest);

// POST /api/v1/tables/{tableNumber}/clear - Clear/complete table
tablesGroup.MapPost("/{tableNumber:int}/clear", async (
    int tableNumber,
    ITableService tableService,
    HttpContext httpContext) =>
{
    try
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
        var success = await tableService.ClearTableAsync(tableNumber, userId);
        return success
            ? Results.Ok(new { message = "Table cleared successfully" })
            : Results.NotFound(new { error = "Table not found or already clear" });
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
})
.WithName("ClearTable")
.Produces(StatusCodes.Status200OK)
.Produces(StatusCodes.Status404NotFound);

// POST /api/v1/tables/assign - Assign table to existing sale
tablesGroup.MapPost("/assign/{saleId:int}", async (
    int saleId,
    AssignTableDto dto,
    ITableService tableService) =>
{
    try
    {
        var tableId = await tableService.AssignTableToSaleAsync(saleId, dto);
        return Results.Ok(new { tableId, message = "Table assigned successfully" });
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("AssignTable")
.Produces(StatusCodes.Status200OK)
.Produces(StatusCodes.Status404NotFound)
.Produces(StatusCodes.Status400BadRequest);
```

---

## 4. Frontend Implementation

### Phase 5: Types & Constants

#### 4.1 Update Entity Types (Fixed Type Mismatches)

**File:** `frontend/types/entities.types.ts`

```typescript
/**
 * Zone entity - represents a physical area in the restaurant
 */
export interface Zone {
  id: number; // ✅ Changed from string to number
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  tableCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableDimensions {
  width: number;
  height: number;
  shape: "Rectangle" | "Circle" | "Square";
}

export interface TablePosition {
  x: number;
  y: number;
  rotation: number;
}

/**
 * Table entity - represents a dining table
 */
export interface Table {
  id: number; // ✅ Changed from string to number
  number: number;
  name: string;
  capacity: number;
  position: TablePosition;
  dimensions: TableDimensions;
  zoneId?: number; // ✅ Changed from string to number
  zoneName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableWithStatus extends Table {
  status: "available" | "occupied" | "reserved";
  saleId?: number;
  invoiceNumber?: string;
  guestCount?: number;
  orderTime?: string;
  orderTotal?: number;
}

// Request DTOs
export interface CreateZoneRequest {
  name: string;
  description?: string;
  displayOrder: number;
}

export interface UpdateZoneRequest extends CreateZoneRequest {
  isActive: boolean;
}

export interface CreateTableRequest {
  number: number;
  name: string;
  capacity: number;
  position: TablePosition;
  dimensions?: TableDimensions;
  zoneId?: number;
}

export interface UpdateTableRequest extends CreateTableRequest {
  isActive: boolean;
}

export interface TransferTableRequest {
  saleId: number;
  fromTableNumber: number;
  toTableNumber: number;
}

export interface AssignTableRequest {
  tableNumber: number;
  guestCount: number;
}
```

#### 4.2 Update Constants

**File:** `frontend/lib/constants.ts`

```typescript
// Add to existing API_ROUTES
export const API_ROUTES = {
  // ... existing routes

  ZONES: {
    BASE: `/api/${API_VERSION}/zones`,
    BY_ID: (id: number) => `/api/${API_VERSION}/zones/${id}`,
  },

  TABLES: {
    BASE: `/api/${API_VERSION}/tables`,
    STATUS: `/api/${API_VERSION}/tables/status`,
    BY_ID: (id: number) => `/api/${API_VERSION}/tables/${id}`,
    BY_NUMBER: (number: number) => `/api/${API_VERSION}/tables/number/${number}`,
    TRANSFER: `/api/${API_VERSION}/tables/transfer`,
    CLEAR: (number: number) => `/api/${API_VERSION}/tables/${number}/clear`,
    ASSIGN: (saleId: number) => `/api/${API_VERSION}/tables/assign/${saleId}`,
  },
} as const;
```

**File:** `frontend/lib/routes.ts`

```typescript
// Add to BRANCH_ROUTES
export const BRANCH_ROUTES = {
  // ... existing routes

  TABLES: (locale: string) => `/${locale}/pos/tables`,
  TABLE_SPLIT: (locale: string, saleId: number) => `/${locale}/pos/tables/split-bill/${saleId}`,
} as const;
```

#### 4.3 Create API Services

**File:** `frontend/lib/api/zone-service.ts`

```typescript
import { API_ROUTES } from "@/lib/constants";
import { Zone, CreateZoneRequest, UpdateZoneRequest } from "@/types/entities.types";

class ZoneService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("accessToken");

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getAllZones(): Promise<Zone[]> {
    return this.fetchWithAuth(API_ROUTES.ZONES.BASE);
  }

  async getZoneById(id: number): Promise<Zone> {
    return this.fetchWithAuth(API_ROUTES.ZONES.BY_ID(id));
  }

  async createZone(data: CreateZoneRequest): Promise<Zone> {
    return this.fetchWithAuth(API_ROUTES.ZONES.BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateZone(id: number, data: UpdateZoneRequest): Promise<Zone> {
    return this.fetchWithAuth(API_ROUTES.ZONES.BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteZone(id: number): Promise<void> {
    await this.fetchWithAuth(API_ROUTES.ZONES.BY_ID(id), {
      method: "DELETE",
    });
  }
}

export const zoneApi = new ZoneService();
```

**File:** `frontend/lib/api/table-service.ts`

```typescript
import { API_ROUTES } from "@/lib/constants";
import {
  Table,
  TableWithStatus,
  CreateTableRequest,
  UpdateTableRequest,
  TransferTableRequest,
  AssignTableRequest,
} from "@/types/entities.types";

class TableService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("accessToken");

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getAllTables(zoneId?: number): Promise<Table[]> {
    const url = zoneId
      ? `${API_ROUTES.TABLES.BASE}?zoneId=${zoneId}`
      : API_ROUTES.TABLES.BASE;
    return this.fetchWithAuth(url);
  }

  async getTablesWithStatus(zoneId?: number): Promise<TableWithStatus[]> {
    const url = zoneId
      ? `${API_ROUTES.TABLES.STATUS}?zoneId=${zoneId}`
      : API_ROUTES.TABLES.STATUS;
    return this.fetchWithAuth(url);
  }

  async getTableById(id: number): Promise<Table> {
    return this.fetchWithAuth(API_ROUTES.TABLES.BY_ID(id));
  }

  async getTableByNumber(number: number): Promise<Table> {
    return this.fetchWithAuth(API_ROUTES.TABLES.BY_NUMBER(number));
  }

  async createTable(data: CreateTableRequest): Promise<Table> {
    return this.fetchWithAuth(API_ROUTES.TABLES.BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTable(id: number, data: UpdateTableRequest): Promise<Table> {
    return this.fetchWithAuth(API_ROUTES.TABLES.BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTable(id: number): Promise<void> {
    await this.fetchWithAuth(API_ROUTES.TABLES.BY_ID(id), {
      method: "DELETE",
    });
  }

  async transferOrder(data: TransferTableRequest): Promise<void> {
    await this.fetchWithAuth(API_ROUTES.TABLES.TRANSFER, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async clearTable(tableNumber: number): Promise<void> {
    await this.fetchWithAuth(API_ROUTES.TABLES.CLEAR(tableNumber), {
      method: "POST",
    });
  }

  async assignTable(saleId: number, data: AssignTableRequest): Promise<{ tableId: number }> {
    return this.fetchWithAuth(API_ROUTES.TABLES.ASSIGN(saleId), {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const tableApi = new TableService();
```

#### 4.4 Create SWR Hooks

**File:** `frontend/hooks/useZones.ts`

```typescript
import useSWR from "swr";
import { zoneApi } from "@/lib/api/zone-service";
import { Zone } from "@/types/entities.types";
import { API_ROUTES } from "@/lib/constants";

export function useZones() {
  const { data, error, isLoading, mutate } = useSWR<Zone[]>(
    API_ROUTES.ZONES.BASE,
    zoneApi.getAllZones,
    {
      suspense: true,
      revalidateOnFocus: false,
    }
  );

  return {
    zones: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useZone(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Zone>(
    id ? API_ROUTES.ZONES.BY_ID(id) : null,
    id ? () => zoneApi.getZoneById(id) : null,
    {
      suspense: false,
      revalidateOnFocus: false,
    }
  );

  return {
    zone: data,
    isLoading,
    isError: error,
    mutate,
  };
}
```

**File:** `frontend/hooks/useTables.ts`

```typescript
import useSWR from "swr";
import { tableApi } from "@/lib/api/table-service";
import { Table, TableWithStatus } from "@/types/entities.types";
import { API_ROUTES } from "@/lib/constants";

export function useTables(zoneId?: number) {
  const key = zoneId
    ? `${API_ROUTES.TABLES.BASE}?zoneId=${zoneId}`
    : API_ROUTES.TABLES.BASE;

  const { data, error, isLoading, mutate } = useSWR<Table[]>(
    key,
    () => tableApi.getAllTables(zoneId),
    {
      suspense: true,
      revalidateOnFocus: false,
    }
  );

  return {
    tables: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTablesWithStatus(zoneId?: number) {
  const key = zoneId
    ? `${API_ROUTES.TABLES.STATUS}?zoneId=${zoneId}`
    : API_ROUTES.TABLES.STATUS;

  const { data, error, isLoading, mutate } = useSWR<TableWithStatus[]>(
    key,
    () => tableApi.getTablesWithStatus(zoneId),
    {
      suspense: true,
      refreshInterval: 5000, // Poll every 5s for real-time updates
      revalidateOnFocus: true,
    }
  );

  return {
    tables: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTable(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Table>(
    id ? API_ROUTES.TABLES.BY_ID(id) : null,
    id ? () => tableApi.getTableById(id) : null,
    {
      suspense: false,
      revalidateOnFocus: false,
    }
  );

  return {
    table: data,
    isLoading,
    isError: error,
    mutate,
  };
}
```

---

### Phase 6: UI Components

#### 4.5 Install Required Dependencies

```bash
cd frontend

# Install drag-and-drop libraries
npm install @dnd-kit/core @dnd-kit/modifiers @dnd-kit/utilities

# Ensure shadcn/ui components are installed
npx shadcn@latest add button dialog input label badge alert-dialog select
```

#### 4.6 Create TableLayout Component with Hybrid Drag-and-Drop

**File:** `frontend/components/pos/TableLayout.tsx`

```typescript
"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  useDraggable,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter, useParams } from "next/navigation";
import { useTablesWithStatus } from "@/hooks/useTables";
import { useZones } from "@/hooks/useZones";
import { BRANCH_ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { TableWithStatus } from "@/types/entities.types";
import { tableApi } from "@/lib/api/table-service";
import { toast } from "sonner";

interface DraggableTableProps {
  table: TableWithStatus;
  isEditMode: boolean;
  onClick: () => void;
}

function DraggableTable({ table, isEditMode, onClick }: DraggableTableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: table.id.toString(),
    disabled: !isEditMode,
    data: table,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        cursor: isEditMode ? "grab" : "pointer",
      }
    : {
        cursor: isEditMode ? "grab" : "pointer",
      };

  const getStatusColor = (status: TableWithStatus["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500 hover:bg-green-600";
      case "occupied":
        return "bg-red-500 hover:bg-red-600";
      case "reserved":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <button
      ref={setNodeRef}
      style={{
        ...style,
        left: `${table.position.x}%`,
        top: `${table.position.y}%`,
        transform: `translate(-50%, -50%) rotate(${table.position.rotation}deg)`,
        width: `${table.dimensions.width}%`,
        height: `${table.dimensions.height}%`,
        minWidth: "80px",
        minHeight: "80px",
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`absolute flex flex-col items-center justify-center rounded-lg text-white shadow-lg transition-all ${getStatusColor(
        table.status
      )} ${isDragging ? "z-50" : "z-10"}`}
      onClick={isEditMode ? undefined : onClick}
      {...(isEditMode ? { ...listeners, ...attributes } : {})}
    >
      <span className="text-lg font-bold">{table.name}</span>
      <span className="flex items-center gap-1 text-xs">
        <Users className="h-3 w-3" />
        {table.capacity}
      </span>
      {table.status === "occupied" && table.guestCount && (
        <span className="mt-1 rounded bg-white/20 px-2 py-0.5 text-xs">
          {table.guestCount} guests
        </span>
      )}
    </button>
  );
}

interface TableLayoutProps {
  isEditMode?: boolean;
  onTablePositionChange?: (tableId: number, x: number, y: number) => void;
}

export function TableLayout({ isEditMode = false, onTablePositionChange }: TableLayoutProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;

  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>();
  const { zones = [] } = useZones();
  const { tables = [], isError, mutate: fetchTables } = useTablesWithStatus(selectedZoneId);

  const [selectedTable, setSelectedTable] = useState<TableWithStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clearTableDialogOpen, setClearTableDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleTableClick = (table: TableWithStatus) => {
    if (isEditMode) return; // Don't open dialog in edit mode
    setSelectedTable(table);
    setDialogOpen(true);
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);

      if (!isEditMode || !event.delta) return;

      const tableId = parseInt(event.active.id as string);
      const table = tables.find((t) => t.id === tableId);

      if (!table) return;

      // Calculate new position based on drag delta
      const container = document.getElementById("floor-plan-container");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const deltaXPercent = (event.delta.x / containerRect.width) * 100;
      const deltaYPercent = (event.delta.y / containerRect.height) * 100;

      const newX = Math.max(0, Math.min(100, table.position.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100, table.position.y + deltaYPercent));

      // Update position
      onTablePositionChange?.(tableId, newX, newY);

      // Auto-save
      try {
        await tableApi.updateTable(tableId, {
          number: table.number,
          name: table.name,
          capacity: table.capacity,
          position: { x: newX, y: newY, rotation: table.position.rotation },
          dimensions: table.dimensions,
          zoneId: table.zoneId,
          isActive: table.isActive,
        });
        fetchTables();
        toast.success("Table position updated");
      } catch (error) {
        console.error("Failed to update table position:", error);
        toast.error("Failed to save position");
        fetchTables(); // Revert on error
      }
    },
    [isEditMode, tables, onTablePositionChange, fetchTables]
  );

  const handleAssignOrder = () => {
    if (!selectedTable) return;
    setDialogOpen(false);
    router.push(`${BRANCH_ROUTES.POS(locale)}?table=${selectedTable.number}`);
  };

  const handleTransferTable = async (targetTableNumber: number) => {
    if (!selectedTable?.saleId) return;

    setIsLoading(true);
    try {
      await tableApi.transferOrder({
        saleId: selectedTable.saleId,
        fromTableNumber: selectedTable.number,
        toTableNumber: targetTableNumber,
      });

      toast.success("Table transferred successfully");
      fetchTables();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to transfer table:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to transfer table"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSplitBill = () => {
    if (!selectedTable?.saleId) return;
    setDialogOpen(false);
    router.push(BRANCH_ROUTES.TABLE_SPLIT(locale, selectedTable.saleId));
  };

  const handleClearTableConfirm = async () => {
    if (!selectedTable) return;

    setIsLoading(true);
    try {
      await tableApi.clearTable(selectedTable.number);
      toast.success("Table cleared successfully");
      fetchTables();
      setDialogOpen(false);
      setClearTableDialogOpen(false);
    } catch (error) {
      console.error("Failed to clear table:", error);
      toast.error("Failed to clear table");
    } finally {
      setIsLoading(false);
    }
  };

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-red-500">Failed to load tables</p>
        <Button onClick={() => fetchTables()}>Retry</Button>
      </div>
    );
  }

  if (tables.length === 0 && !isEditMode) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No tables configured. Please add tables in management mode.</p>
      </div>
    );
  }

  const activeDragTable = activeId ? tables.find((t) => t.id.toString() === activeId) : null;

  return (
    <>
      {/* Zone Filter */}
      {zones.length > 0 && (
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium">Filter by Zone:</label>
          <Select
            value={selectedZoneId?.toString() ?? "all"}
            onValueChange={(value) => setSelectedZoneId(value === "all" ? undefined : parseInt(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id.toString()}>
                  {zone.name} ({zone.tableCount ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Floor Plan Grid */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          id="floor-plan-container"
          className="relative h-full min-h-[600px] rounded-lg border bg-white p-8"
        >
          {tables.map((table) => (
            <DraggableTable
              key={table.id}
              table={table}
              isEditMode={isEditMode}
              onClick={() => handleTableClick(table)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDragTable ? (
            <div
              className="flex items-center justify-center rounded-lg bg-blue-500 text-white shadow-2xl"
              style={{
                width: "100px",
                height: "100px",
              }}
            >
              <span className="font-bold">{activeDragTable.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Table Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTable?.name} - {selectedTable?.status}
            </DialogTitle>
            <DialogDescription>
              {selectedTable?.status === "available"
                ? "This table is available for new orders"
                : "This table is currently occupied"}
            </DialogDescription>
          </DialogHeader>

          {selectedTable && (
            <div className="space-y-4">
              {/* Table Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-semibold">
                    {selectedTable.capacity} seats
                  </p>
                </div>
                {selectedTable.status === "occupied" && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Invoice Number</p>
                      <p className="font-semibold">
                        {selectedTable.invoiceNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order Time</p>
                      <p className="flex items-center gap-1 font-semibold">
                        <Clock className="h-4 w-4" />
                        {selectedTable.orderTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="flex items-center gap-1 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {selectedTable.orderTotal?.toFixed(2)}
                      </p>
                    </div>
                    {selectedTable.guestCount && (
                      <div>
                        <p className="text-sm text-gray-500">Guests</p>
                        <p className="flex items-center gap-1 font-semibold">
                          <Users className="h-4 w-4" />
                          {selectedTable.guestCount}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedTable.status === "available" && (
                  <Button
                    className="w-full"
                    onClick={handleAssignOrder}
                    disabled={isLoading}
                  >
                    Assign Order
                  </Button>
                )}

                {selectedTable.status === "occupied" && (
                  <>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        router.push(
                          `${BRANCH_ROUTES.POS(locale)}?saleId=${
                            selectedTable.saleId
                          }`
                        );
                      }}
                      disabled={isLoading}
                    >
                      View Order
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleSplitBill}
                      disabled={isLoading}
                    >
                      Split Bill
                    </Button>

                    {/* Transfer Options */}
                    <div className="pt-2">
                      <p className="mb-2 text-sm font-medium">Transfer to:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {tables
                          .filter(
                            (t) =>
                              t.status === "available" &&
                              t.id !== selectedTable.id
                          )
                          .slice(0, 4)
                          .map((targetTable) => (
                            <Button
                              key={targetTable.id}
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleTransferTable(targetTable.number)
                              }
                              disabled={isLoading}
                            >
                              {targetTable.name}
                            </Button>
                          ))}
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4"
                      variant="default"
                      onClick={() => setClearTableDialogOpen(true)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Clear Table"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clear Table Confirmation Dialog */}
      <AlertDialog
        open={clearTableDialogOpen}
        onOpenChange={setClearTableDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-md border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-red-800 text-center">
              Confirm Clear Table
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-700 text-center">
              Are you sure you want to clear {selectedTable?.name}? This will
              mark the order as completed and make the table available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3">
            <AlertDialogCancel className="border-red-500 text-red-700 hover:bg-red-50">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              onClick={handleClearTableConfirm}
              disabled={isLoading}
            >
              <Check className="mr-2 h-4 w-4" />
              {isLoading ? "Clearing..." : "Clear Table"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

---

**Due to length constraints, I'll continue in the next message with:**
- TableManagement Component (with hybrid mode)
- ZoneManagement Component
- Tables Page Implementation
- Testing & Validation
- Complete Implementation Checklist

**Would you like me to continue with the rest of the updated plan?**
