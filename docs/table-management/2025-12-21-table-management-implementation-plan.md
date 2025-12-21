# Table Management System - Implementation Plan

**Date:** 2025-12-21
**Target:** Frontend Implementation (React 19 + Next.js 16)
**Reference:** Old Project Analysis

---

## 1. Overview

This plan outlines the implementation of a comprehensive table management system for the POS application, mirroring the functionality from the old project with improvements for the new architecture.

### Key Features

- **Visual floor plan** with drag-and-drop table positioning
- **Real-time table status** (Available, Occupied, Reserved)
- **Table management** (Add, Edit, Delete tables)
- **Order assignment** to tables
- **Table operations**: Transfer orders, split bills, clear tables
- **Live status updates** with auto-refresh
- **RTL support** for Arabic language

---

## 2. System Architecture Analysis

### Old Project Architecture (Reference)

**Data Storage:**

- Tables stored as JSON in the `Setting` table (key: `table_layout`)
- Structure: `{ tables: TableData[] }`
- No separate database table for tables

**Components:**

```
old/src/components/pos/
├── TableLayout.tsx          # Main floor plan view with status
├── TableManagement.tsx      # CRUD operations dialog
└── TableSelector.tsx        # Table selection component for orders
```

**API Endpoints:**

```
/api/pos/tables              # GET: List tables with order status
/api/pos/tables/manage       # GET/POST/PUT/DELETE: CRUD operations
/api/pos/tables/transfer     # POST: Transfer order between tables
/api/pos/tables/assign       # POST: Assign order to table
/api/pos/tables/split-bill   # POST: Split bill functionality
/api/pos/tables/{id}/complete # POST: Clear/complete table
```

**Key Features:**

1. Real-time polling (5s interval for status updates)
2. Dialog-based management (matches design guidelines)
3. Visual positioning with percentage-based coordinates
4. Integration with sales/orders system

### New Project Architecture (Target)

**Frontend:**

- Next.js 16 with App Router
- React 19 with TypeScript
- Tailwind CSS v4
- Dialog component from shadcn/ui

**Backend:**

- ASP.NET Core 8.0 Web API
- Entity Framework Core with multi-provider support
- JWT authentication
- Branch-based multi-tenancy

---

## 3. Database Design

### Option A: JSON Storage (Like Old Project)

Store tables in the `Setting` entity as JSON.

**Pros:**

- Quick to implement (matches old project)
- Flexible structure
- No migration needed
- Good for dynamic layouts

**Cons:**

- No relational integrity
- Harder to query
- No indexing on table data

**Schema:**

```typescript
Setting {
  key: "table_layout"
  value: JSON.stringify({
    tables: [
      {
        id: number,
        number: number,
        name: string,
        capacity: number,
        position: { x: number, y: number }
      }
    ]
  })
}
```

### Option B: Dedicated Table Entity (Recommended for New Project)

Create a proper database entity for tables.

**Pros:**

- Better data integrity
- Easier to query and join with orders
- Can add indexes
- More scalable
- Follows EF Core patterns

**Cons:**

- Requires migration
- Slightly more complex queries

**Proposed Entity:**

```csharp
// Backend/Models/Entities/Branch/Zone.cs
public class Zone
{
    public int Id { get; set; }
    public string Name { get; set; }          // e.g., "Main Hall", "Patio", "Bar"
    public int DisplayOrder { get; set; }     // For sorting
    public bool IsActive { get; set; }
    public ICollection<Table> Tables { get; set; }
}

// Backend/Models/Entities/Branch/Table.cs
public class Table
{
    public int Id { get; set; }
    public int Number { get; set; }
    public string Name { get; set; }
    public int Capacity { get; set; }

    // Positioning & Appearance
    public decimal PositionX { get; set; }    // 0-100%
    public decimal PositionY { get; set; }    // 0-100%
    public decimal Width { get; set; }        // Relative width
    public decimal Height { get; set; }       // Relative height
    public int Rotation { get; set; }         // 0-360 degrees
    public string Shape { get; set; } = "Rectangle"; // Rectangle, Circle, Square

    public bool IsActive { get; set; }

    // Navigation
    public int? ZoneId { get; set; }
    public Zone? Zone { get; set; }
    public ICollection<Sale> Sales { get; set; }
}
```

**Recommendation:** Use Option B with the enhanced properties to support rich visual layouts and multiple zones.

---

## 4. Backend Implementation

### Phase 1: Database & Models

#### 4.1 Create Table Entity

**File:** `Backend/Models/Entities/Branch/Table.cs`

```csharp
namespace Backend.Models.Entities.Branch;

public class Zone
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Table> Tables { get; set; } = new List<Table>();
}

public class Table
{
    public int Id { get; set; }

    [Required]
    public int Number { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Range(1, 100)]
    public int Capacity { get; set; }

    // Positioning
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
    public string Shape { get; set; } = "Rectangle"; // Rectangle, Circle, Square, Custom

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public int? ZoneId { get; set; }
    public Zone? Zone { get; set; }
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
```

#### 4.2 Update BranchDbContext

**File:** `Backend/Data/BranchDbContext.cs`

```csharp
public DbSet<Table> Tables { get; set; } = null!;

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // ... existing configurations

    // Table configuration
    modelBuilder.Entity<Table>(entity =>
    {
        entity.HasKey(t => t.Id);
        entity.HasIndex(t => t.Number).IsUnique(); // Unique table numbers per branch
        entity.Property(t => t.PositionX).HasPrecision(5, 2);
        entity.Property(t => t.PositionY).HasPrecision(5, 2);
    });
}
```

#### 4.3 Update Sale Entity

Add table reference to the Sale entity if not already present.

```csharp
public int? TableId { get; set; }
public Table? Table { get; set; }

// Keep TableNumber for backward compatibility or remove if using TableId only
public int? TableNumber { get; set; }
```

#### 4.4 Create Migration

```bash
cd Backend
dotnet ef migrations add AddTableEntity --context BranchDbContext
dotnet ef database update --context BranchDbContext
```

### Phase 2: DTOs

#### 4.5 Create Table DTOs

**File:** `Backend/Models/DTOs/Branch/Tables/TableDto.cs`

```csharp
namespace Backend.Models.DTOs.Branch.Tables;

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
}

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

public record TableWithStatusDto : TableDto
{
    public string Status { get; init; } = "available"; // available, occupied, reserved
    public int? OrderId { get; init; }
    public string? OrderNumber { get; init; }
    public int? GuestCount { get; init; }
    public string? OrderTime { get; init; }
    public decimal? OrderTotal { get; init; }
}

public record CreateTableDto
{
    [Required]
    public int Number { get; init; }

    [Required]
    [MaxLength(100)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [Range(1, 100)]
    public int Capacity { get; init; }

    [Required]
    public PositionDto Position { get; init; } = new();
}

public record UpdateTableDto
{
    [Required]
    public int Number { get; init; }

    [Required]
    [MaxLength(100)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [Range(1, 100)]
    public int Capacity { get; init; }

    [Required]
    public PositionDto Position { get; init; } = new();

    public bool IsActive { get; init; }
}

public record TransferTableDto
{
    [Required]
    public int OrderId { get; init; }

    [Required]
    public int FromTableNumber { get; init; }

    [Required]
    public int ToTableNumber { get; init; }
}
```

### Phase 3: Service Layer

#### 4.6 Create TableService

**File:** `Backend/Services/Branch/TableService.cs`

```csharp
namespace Backend.Services.Branch;

public interface ITableService
{
    Task<IEnumerable<TableDto>> GetAllTablesAsync();
    Task<IEnumerable<TableWithStatusDto>> GetTablesWithStatusAsync();
    Task<TableDto?> GetTableByIdAsync(int id);
    Task<TableDto?> GetTableByNumberAsync(int number);
    Task<TableDto> CreateTableAsync(CreateTableDto dto);
    Task<TableDto> UpdateTableAsync(int id, UpdateTableDto dto);
    Task<bool> DeleteTableAsync(int id);
    Task<bool> TransferOrderAsync(TransferTableDto dto);
    Task<bool> ClearTableAsync(int tableNumber);
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

    public async Task<IEnumerable<TableDto>> GetAllTablesAsync()
    {
        return await _context.Tables
            .Where(t => t.IsActive)
            .OrderBy(t => t.Number)
            .Select(t => new TableDto
            {
                Id = t.Id,
                Number = t.Number,
                Name = t.Name,
                Capacity = t.Capacity,
                Position = new PositionDto { X = t.PositionX, Y = t.PositionY },
                IsActive = t.IsActive
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<TableWithStatusDto>> GetTablesWithStatusAsync()
    {
        var tables = await _context.Tables
            .Where(t => t.IsActive)
            .OrderBy(t => t.Number)
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
            var order = activeOrders.FirstOrDefault(o => o.TableId == table.Id);

            if (order != null)
            {
                var orderTime = DateTime.UtcNow - order.CreatedAt;
                var timeString = orderTime.Hours > 0
                    ? $"{orderTime.Hours}h {orderTime.Minutes}m"
                    : $"{orderTime.Minutes}m";

                return new TableWithStatusDto
                {
                    Id = table.Id,
                    Number = table.Number,
                    Name = table.Name,
                    Capacity = table.Capacity,
                    Position = new PositionDto { X = table.PositionX, Y = table.PositionY },
                    IsActive = table.IsActive,
                    Status = "occupied",
                    OrderId = order.Id,
                    OrderNumber = order.InvoiceNumber,
                    GuestCount = order.SalesItems.Sum(i => i.Quantity),
                    OrderTime = timeString,
                    OrderTotal = order.Total
                };
            }

            return new TableWithStatusDto
            {
                Id = table.Id,
                Number = table.Number,
                Name = table.Name,
                Capacity = table.Capacity,
                Position = new PositionDto { X = table.PositionX, Y = table.PositionY },
                IsActive = table.IsActive,
                Status = "available"
            };
        });
    }

    public async Task<TableDto> CreateTableAsync(CreateTableDto dto)
    {
        // Check for duplicate table number
        if (await _context.Tables.AnyAsync(t => t.Number == dto.Number && t.IsActive))
        {
            throw new InvalidOperationException($"Table number {dto.Number} already exists");
        }

        var table = new Table
        {
            Number = dto.Number,
            Name = dto.Name,
            Capacity = dto.Capacity,
            PositionX = dto.Position.X,
            PositionY = dto.Position.Y,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tables.Add(table);
        await _context.SaveChangesAsync();

        return new TableDto
        {
            Id = table.Id,
            Number = table.Number,
            Name = table.Name,
            Capacity = table.Capacity,
            Position = new PositionDto { X = table.PositionX, Y = table.PositionY },
            IsActive = table.IsActive
        };
    }

    public async Task<TableDto> UpdateTableAsync(int id, UpdateTableDto dto)
    {
        var table = await _context.Tables.FindAsync(id);
        if (table == null)
            throw new KeyNotFoundException($"Table with ID {id} not found");

        // Check for duplicate table number (excluding current table)
        if (await _context.Tables.AnyAsync(t => t.Number == dto.Number && t.Id != id && t.IsActive))
        {
            throw new InvalidOperationException($"Table number {dto.Number} already exists");
        }

        table.Number = dto.Number;
        table.Name = dto.Name;
        table.Capacity = dto.Capacity;
        table.PositionX = dto.Position.X;
        table.PositionY = dto.Position.Y;
        table.IsActive = dto.IsActive;
        table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new TableDto
        {
            Id = table.Id,
            Number = table.Number,
            Name = table.Name,
            Capacity = table.Capacity,
            Position = new PositionDto { X = table.PositionX, Y = table.PositionY },
            IsActive = table.IsActive
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
            throw new InvalidOperationException("Cannot delete table with active orders");
        }

        // Soft delete
        table.IsActive = false;
        table.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> TransferOrderAsync(TransferTableDto dto)
    {
        var order = await _context.Sales.FindAsync(dto.OrderId);
        if (order == null)
            return false;

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

        order.TableId = toTable.Id;
        order.TableNumber = toTable.Number;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ClearTableAsync(int tableNumber)
    {
        var table = await _context.Tables
            .FirstOrDefaultAsync(t => t.Number == tableNumber && t.IsActive);

        if (table == null)
            return false;

        var order = await _context.Sales
            .FirstOrDefaultAsync(s => s.TableId == table.Id && s.Status == "open");

        if (order == null)
            return false;

        order.Status = "completed";
        order.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }
}
```

### Phase 4: API Endpoints

#### 4.7 Add Table Endpoints to Program.cs

**File:** `Backend/Program.cs`

```csharp
// Register service
builder.Services.AddScoped<ITableService, TableService>();

// Table Management Endpoints
var tablesGroup = app.MapGroup("/api/v1/tables")
    .RequireAuthorization()
    .WithTags("Tables");

// GET /api/v1/tables - Get all tables (for management)
tablesGroup.MapGet("/", async (ITableService tableService) =>
{
    var tables = await tableService.GetAllTablesAsync();
    return Results.Ok(tables);
});

// GET /api/v1/tables/status - Get tables with current order status
tablesGroup.MapGet("/status", async (ITableService tableService) =>
{
    var tables = await tableService.GetTablesWithStatusAsync();
    return Results.Ok(tables);
});

// GET /api/v1/tables/{id} - Get table by ID
tablesGroup.MapGet("/{id:int}", async (int id, ITableService tableService) =>
{
    var table = await tableService.GetTableByIdAsync(id);
    return table != null ? Results.Ok(table) : Results.NotFound();
});

// POST /api/v1/tables - Create new table
tablesGroup.MapPost("/", async (CreateTableDto dto, ITableService tableService) =>
{
    try
    {
        var table = await tableService.CreateTableAsync(dto);
        return Results.Created($"/api/v1/tables/{table.Id}", table);
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"));

// PUT /api/v1/tables/{id} - Update table
tablesGroup.MapPut("/{id:int}", async (int id, UpdateTableDto dto, ITableService tableService) =>
{
    try
    {
        var table = await tableService.UpdateTableAsync(id, dto);
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
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"));

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
.RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"));

// POST /api/v1/tables/transfer - Transfer order between tables
tablesGroup.MapPost("/transfer", async (TransferTableDto dto, ITableService tableService) =>
{
    try
    {
        var success = await tableService.TransferOrderAsync(dto);
        return success ? Results.Ok() : Results.NotFound();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// POST /api/v1/tables/{tableNumber}/clear - Clear/complete table
tablesGroup.MapPost("/{tableNumber:int}/clear", async (int tableNumber, ITableService tableService) =>
{
    var success = await tableService.ClearTableAsync(tableNumber);
    return success ? Results.Ok() : Results.NotFound();
});
```

---

## 5. Frontend Implementation

### Phase 5: Types & Utilities

#### 5.1 Update Core Types

**File:** `frontend/types/entities.types.ts`

Approve the addition of Table and Zone entities to the core types file:

```typescript
/**
 * Zone entity - represents a physical area in the restaurant
 */
export interface Zone {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableDimensions {
  width: number;
  height: number;
  shape: "Rectangle" | "Circle" | "Square" | "Custom";
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
  id: string;
  number: number;
  name: string;
  capacity: number;
  position: TablePosition;
  dimensions: TableDimensions;
  zoneId?: string;
  zone?: Zone;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableWithStatus extends Table {
  status: "available" | "occupied" | "reserved";
  currentSale?: Sale; // using Sale from entities.types.ts
}
```

#### 5.2 Update Constants & Create Data Hooks

**File:** `frontend/lib/constants.ts` (Update)

```typescript
// Add to API_ROUTES
TABLES: {
  BASE: `/api/${API_VERSION}/tables`,
  STATUS: `/api/${API_VERSION}/tables/status`,
  BY_ID: (id: string | number) => `/api/${API_VERSION}/tables/${id}`,
  TRANSFER: `/api/${API_VERSION}/tables/transfer`,
  CLEAR: (number: number) => `/api/${API_VERSION}/tables/${number}/clear`,
},
ZONES: {
  BASE: `/api/${API_VERSION}/zones`,
},
```

**File:** `frontend/lib/routes.ts` (Update)

```typescript
// Add to BRANCH_ROUTES
TABLES: (locale: string) => `/${locale}/pos/tables`, // If separate management page needed
TABLE_SPLIT: (locale: string, orderId: number) => `/${locale}/pos/tables/split-bill/${orderId}`,
```

**File:** `frontend/hooks/useTables.ts` (New)

```typescript
import useSWR from "swr";
import { tableApi } from "@/lib/api/table-service";
import {
  Table,
  TableWithStatus,
  CreateTableRequest,
  UpdateTableRequest,
} from "@/types/entities.types";
import { API_ROUTES } from "@/lib/constants";

export function useTables() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ROUTES.TABLES.BASE,
    tableApi.getAllTables,
    {
      suspense: true,
      revalidateOnFocus: false,
    }
  );

  return {
    tables: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTablesWithStatus() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ROUTES.TABLES.STATUS,
    tableApi.getTablesWithStatus,
    {
      suspense: true,
      refreshInterval: 5000, // Poll every 5s
    }
  );

  return {
    tables: data,
    isLoading,
    isError: error,
    mutate,
  };
}
```

**File:** `frontend/lib/api/table-service.ts` (Update to use constants)

```typescript
import { API_ROUTES } from "@/lib/constants";
// ... imports

export const tableApi = {
  async getAllTables(): Promise<Table[]> {
    const response = await fetch(API_ROUTES.TABLES.BASE, {
      /* ... headers */
    });
    // ... error handling
    return response.json();
  },
  // ... implement other methods using API_ROUTES constants
};
```

### Phase 6: UI Components

#### 5.3 Install Required UI Components

First, ensure you have these shadcn/ui components:

```bash
cd frontend
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add badge
npx shadcn@latest add alert-dialog
npx shadcn@latest add table
npm install @dnd-kit/core @dnd-kit/modifiers @dnd-kit/utilities
npm install react-zoom-pan-pinch
```

#### 5.4 Create TableLayout Component

**File:** `frontend/components/pos/TableLayout.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useRouter, useParams } from "next/navigation";
import { useTablesWithStatus } from "@/hooks/useTables";
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
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { TableWithStatus } from "@/types/table";
import { tableApi } from "@/lib/api/table-service";
import { toast } from "sonner";

export function TableLayout() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const { tables = [], isError, mutate: fetchTables } = useTablesWithStatus();

  const [selectedTable, setSelectedTable] = useState<TableWithStatus | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clearTableDialogOpen, setClearTableDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const error = isError ? "Failed to load tables" : null;

  const handleTableClick = (table: TableWithStatus) => {
    setSelectedTable(table);
    setDialogOpen(true);
  };

  const handleAssignOrder = () => {
    if (!selectedTable) return;
    setDialogOpen(false);
    router.push(`${BRANCH_ROUTES.POS(locale)}?table=${selectedTable.number}`);
  };

  const handleTransferTable = async (targetTableNumber: number) => {
    if (!selectedTable?.orderId) return;

    setIsLoading(true);
    try {
      await tableApi.transferOrder({
        orderId: selectedTable.orderId,
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
    if (!selectedTable?.orderId) return;
    setDialogOpen(false);
    router.push(BRANCH_ROUTES.TABLE_SPLIT(locale, selectedTable.orderId));
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

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Loading tables...</p>
      </div>
    );
  }

  return (
    <>
      {/* Floor Plan Grid */}
      <div className="relative h-full min-h-[600px] rounded-lg border bg-white p-8">
        {tables.map((table) => (
          <button
            key={table.id}
            className={`absolute flex h-24 w-24 flex-col items-center justify-center rounded-lg text-white shadow-lg transition-all ${getStatusColor(
              table.status
            )}`}
            style={{
              left: `${table.position.x}%`,
              top: `${table.position.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => handleTableClick(table)}
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
        ))}
      </div>

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
                      <p className="text-sm text-gray-500">Order Number</p>
                      <p className="font-semibold">
                        {selectedTable.orderNumber}
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
                          `${BRANCH_ROUTES.POS(locale)}?orderId=${
                            selectedTable.orderId
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
                            Transfer to {targetTable.name}
                          </Button>
                        ))}
                    </div>
                    <Button
                      className="w-full"
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

#### 5.5 Create TableManagement Component

**File:** `frontend/components/pos/TableManagement.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { SidebarDialog } from "@/components/shared/SidebarDialog";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Save } from "lucide-react";
import { Table } from "@/types/entities.types";
import { tableApi } from "@/lib/api/table-service";
import { useTables } from "@/hooks/useTables";
import { toast } from "sonner";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";

interface TableManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTablesUpdate?: () => void;
}

export function TableManagement({
  open,
  onOpenChange,
  onTablesUpdate,
}: TableManagementProps) {
  const { tables = [], isLoading: loading, mutate: fetchTables } = useTables();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Form state
  const [tableNumber, setTableNumber] = useState("");
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [positionX, setPositionX] = useState("");
  const [positionY, setPositionY] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleAddTable = () => {
    setIsEditing(false);
    setSelectedTable(null);
    setTableNumber("");
    setTableName("");
    setCapacity("");
    setPositionX("");
    setPositionY("");
    setEditDialogOpen(true);
  };

  const handleEditTable = (table: Table) => {
    setIsEditing(true);
    setSelectedTable(table);
    setTableNumber(table.number.toString());
    setTableName(table.name);
    setCapacity(table.capacity.toString());
    setPositionX(table.position?.x?.toString() || "0");
    setPositionY(table.position?.y?.toString() || "0");
    setEditDialogOpen(true);
  };

  const handleDeleteTable = (table: Table) => {
    setSelectedTable(table);
    setDeleteDialogOpen(true);
  };

  const handleSaveTable = async () => {
    // Validate inputs
    if (!tableNumber || !tableName || !capacity || !positionX || !positionY) {
      toast.error("All fields are required");
      return;
    }

    const tableData = {
      number: parseInt(tableNumber),
      name: tableName,
      capacity: parseInt(capacity),
      position: {
        x: parseFloat(positionX),
        y: parseFloat(positionY),
      },
      isActive: true,
    };

    try {
      if (isEditing && selectedTable) {
        await tableApi.updateTable(selectedTable.id, tableData);
        toast.success("Table updated successfully");
      } else {
        await tableApi.createTable(tableData);
        toast.success("Table added successfully");
      }

      setEditDialogOpen(false);
      fetchTables();
      onTablesUpdate?.();
    } catch (error) {
      console.error("Error saving table:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save table"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTable) return;

    try {
      await tableApi.deleteTable(selectedTable.id);
      toast.success("Table deleted successfully");
      setDeleteDialogOpen(false);
      fetchTables();
      onTablesUpdate?.();
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete table"
      );
    }
  };

  return (
    <>
      <SidebarDialog
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title="Table Management"
        subtitle="Manage your floor plan tables and zones"
        width="xl"
      >
        <div className="space-y-4 p-4">
          <div className="flex justify-end">
            <Button onClick={handleAddTable}>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading tables...</div>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Table #</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Capacity</th>
                    <th className="px-4 py-2 text-left">Position</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => (
                    <tr key={table.id} className="border-t">
                      <td className="px-4 py-2 font-semibold">
                        {table.number}
                      </td>
                      <td className="px-4 py-2">{table.name}</td>
                      <td className="px-4 py-2">{table.capacity} seats</td>
                      <td className="px-4 py-2">
                        {table.position.x}%, {table.position.y}%
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTable(table)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTable(table)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tables.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tables yet. Click 'Add Table' to create one.
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarDialog>

      {/* Add/Edit Table Dialog */}
      <SidebarDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title={isEditing ? "Edit Table" : "Add New Table"}
        width="md"
      >
        <div className="space-y-4 p-4 h-full flex flex-col">
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number *</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  placeholder="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tableName">Table Name *</Label>
                <Input
                  id="tableName"
                  placeholder="Table 1"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (seats) *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="4"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div>
                <h4 className="text-sm font-medium mb-1">
                  Position on Floor Plan
                </h4>
                <p className="text-xs text-gray-500">
                  Position values are percentages (0-100) of the floor plan area
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="positionX">X Position (%) *</Label>
                  <Input
                    id="positionX"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="50"
                    value={positionX}
                    onChange={(e) => setPositionX(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="positionY">Y Position (%) *</Label>
                  <Input
                    id="positionY"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="50"
                    value={positionY}
                    onChange={(e) => setPositionY(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTable}>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update" : "Add"} Table
            </Button>
          </div>
        </div>
      </SidebarDialog>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Table"
        message={`Are you sure you want to delete "${selectedTable?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
```

### Phase 7: Page Implementation

#### 5.6 Create Tables Page

**File:** `frontend/app/[locale]/(pos)/pos/tables/page.tsx`

```typescript
"use client";

import { useState, Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { TableLayout } from "@/components/pos/TableLayout";
import { Settings, Loader2 } from "lucide-react";

// Lazy load TableManagement
const TableManagement = lazy(() =>
  import("@/components/pos/TableManagement").then((mod) => ({
    default: mod.TableManagement,
  }))
);

function TableLayoutFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-2 text-gray-500">Loading floor plan...</span>
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-red-500">
      <p>Failed to load tables</p>
      <Button variant="outline" onClick={resetErrorBoundary} className="mt-2">
        Retry
      </Button>
    </div>
  );
}

export default function TablesPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Button
        variant="default"
        size="icon"
        onClick={() => setShowSettings(true)}
        className="fixed bottom-20 right-6 z-50 shadow-lg rounded-full h-14 w-14"
      >
        <Settings className="h-5 w-5" />
      </Button>

      {/* Floor Plan */}
      <div className="flex-1 overflow-auto p-6">
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => setRefreshKey((k) => k + 1)}
        >
          <Suspense fallback={<TableLayoutFallback />}>
            <TableLayout key={refreshKey} />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Table Management Dialog */}
      {showSettings && (
        <Suspense fallback={null}>
          <TableManagement
            open={showSettings}
            onOpenChange={setShowSettings}
            onTablesUpdate={() => setRefreshKey((prev) => prev + 1)}
          />
        </Suspense>
      )}

      {/* Legend */}
      <div className="border-t bg-white px-6 py-4">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-500" />
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-500" />
            <span className="text-sm">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-yellow-500" />
            <span className="text-sm">Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

#### 5.7 Mobile & Touch Optimizations

For touch devices and smaller screens, the system must adapt:

1.  **Touch Targets**: Ensure all interactive elements (tables, buttons) are at least 44x44px.
2.  **Gestures**:
    - Use `react-zoom-pan-pinch` for Pinch-to-Zoom on the floor plan.
    - Double-tap to view table details.
3.  **Responsive Layout**:
    - On screens < 768px, switch `TableLayout` to a "List View" or "Card Grid" if the floor plan is too dense.
    - Use a "Sticky Bottom Bar" for common actions (Assign, Pay) instead of modals on mobile.
4.  **Haptic Feedback**: Trigger haptic feedback (if available) on long-press for drag start.

#### 5.8 Accessibility & Standards

To meet standard requirements:

- **ARIA Labels**: All interactive elements must have `aria-label` or `aria-labelledby`.
- **Keyboard Navigation**: Floor plan tables must be focusable (`tabindex="0"`) and selectable via Enter/Space.
- **Contrast**: Ensure text colors meet WCAG AA standards (4.5:1 contrast ratio) against table background colors.
- **Screen Readers**: Provide a "List View" alternative for screen readers as the visual map is not accessible to blind users.
- **Validation**: Use `zod` for strict runtime validation of all form inputs.

---

## 6. Testing & Validation

### Backend Testing

1. **Test Table CRUD Operations**:

   ```bash
   # Create table
   curl -X POST https://localhost:5001/api/v1/tables \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "number": 1,
       "name": "Table 1",
       "capacity": 4,
       "position": { "x": 25, "y": 25 }
     }'

   # Get all tables
   curl https://localhost:5001/api/v1/tables \
     -H "Authorization: Bearer YOUR_TOKEN"

   # Get tables with status
   curl https://localhost:5001/api/v1/tables/status \
     -H "Authorization: Bearer YOUR_TOKEN"

   # Update table
   curl -X PUT https://localhost:5001/api/v1/tables/1 \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "number": 1,
       "name": "VIP Table 1",
       "capacity": 6,
       "position": { "x": 30, "y": 30 },
       "isActive": true
     }'

   # Delete table
   curl -X DELETE https://localhost:5001/api/v1/tables/1 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Test Table Operations**:

   ```bash
   # Transfer order
   curl -X POST https://localhost:5001/api/v1/tables/transfer \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": 1,
       "fromTableNumber": 1,
       "toTableNumber": 2
     }'

   # Clear table
   curl -X POST https://localhost:5001/api/v1/tables/1/clear \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Frontend Testing

1. **Component Testing**:

   - Test TableLayout rendering
   - Test TableManagement dialog operations
   - Test table status updates
   - Test error handling

2. **Integration Testing**:

   - Create tables via management dialog
   - Verify they appear on floor plan
   - Assign orders to tables
   - Transfer orders between tables
   - Clear tables
   - Delete tables

3. **Manual Testing Checklist**:
   - [ ] Can create new tables
   - [ ] Can edit existing tables
   - [ ] Can delete tables (only when not occupied)
   - [ ] Can delete tables (only when not occupied)
   - [ ] **Drag & Drop**: Can move tables visually in edit mode
   - [ ] **Mobile**: Floor plan zooms and pans correctly on touch devices
   - [ ] **Zones**: Can switch between different zones (Main Hall, Patio)
   - [ ] Tables appear correctly positioned with correct shapes/rotation
   - [ ] Table status updates in real-time
   - [ ] Can assign orders to available tables
   - [ ] Can view order details from occupied tables
   - [ ] Can transfer orders between tables
   - [ ] Can clear completed tables
   - [ ] Error messages display correctly
   - [ ] Loading states work properly
   - [ ] RTL layout works for Arabic

---

## 7. Implementation Checklist

### Backend Tasks

- [ ] **T1**: Create `Table` entity model
- [ ] **T2**: Update `BranchDbContext` with `Tables` DbSet
- [ ] **T3**: Add table reference to `Sale` entity
- [ ] **T4**: Create and run EF migration for `Table` entity
- [ ] **T5**: Create Table DTOs (TableDto, CreateTableDto, UpdateTableDto, etc.)
- [ ] **T6**: Implement `ITableService` interface
- [ ] **T7**: Implement `TableService` class with all methods
- [ ] **T8**: Register `ITableService` in DI container
- [ ] **T9**: Add table management endpoints to `Program.cs`
- [ ] **T10**: Add table operation endpoints (transfer, clear)
- [ ] **T11**: Test all endpoints with Swagger
- [ ] **T12**: Add authorization policies for table management

### Frontend Tasks

- [ ] **T13**: Update `frontend/types/entities.types.ts` with Table and Zone types
- [ ] **T13b**: Update `frontend/lib/constants.ts` and `frontend/lib/routes.ts`
- [ ] **T14**: Create `useTables` SWR hook and update `table-service.ts`
- [ ] **T15**: Install required shadcn/ui components
- [ ] **T16**: Update `TableLayout` component with Drag & Drop & Suspense
- [ ] **T17**: Update `TableManagement` component to use `SidebarDialog` & SWR
- [ ] **T18**: Create tables page at `/pos/tables/page.tsx` with Suspense Boundary
- [ ] **T19**: Add table selection to POS order flow
- [ ] **T20**: Test table creation and editing
- [ ] **T21**: Test table deletion
- [ ] **T22**: Test real-time status updates
- [ ] **T23**: Test order assignment
- [ ] **T24**: Test order transfer
- [ ] **T25**: Test table clearing
- [ ] **T26**: Add internationalization (i18n) support
- [ ] **T27**: Test RTL layout for Arabic

### Optional Enhancements

- [x] **T28**: Add drag-and-drop for table positioning (Integrated into Core)
- [ ] **T29**: Add table reservation functionality
- [ ] **T30**: Add split bill feature
- [ ] **T31**: Add table merge functionality
- [x] **T32**: Add floor plan zoom/pan controls (Integrated into Core)
- [x] **T33**: Add multiple floor plans/zones support (Integrated into Core)
- [ ] **T34**: Add table occupancy history/analytics

---

## 8. Key Differences from Old Project

1. **Database Storage**:

   - Old: JSON in Settings table
   - New: Dedicated Table entity with EF Core

2. **Backend**:

   - Old: Next.js API routes with Prisma
   - New: ASP.NET Core minimal APIs with EF Core

3. **Type Safety**:

   - Old: TypeScript interfaces
   - New: C# DTOs + TypeScript types

4. **Authentication**:

   - Old: NextAuth.js
   - New: JWT Bearer tokens

5. **Real-time Updates**:
   - Both: Client-side polling (5s interval)
   - Future: Consider SignalR for server-push updates

---

## 9. Future Enhancements

1. **Real-time Updates with SignalR**:

   - Replace polling with WebSocket-based real-time updates
   - Broadcast table status changes to all connected clients

2. **Advanced Floor Plan Features**:

   - Drag-and-drop table positioning
   - Visual floor plan designer
   - Multiple floor/area support
   - Table shapes and sizes

3. **Reservation System**:

   - Table booking/reservation
   - Time-based reservations
   - Customer notifications

4. **Analytics**:

   - Table turnover rate
   - Average occupancy time
   - Revenue per table
   - Peak hours analysis

5. **Split Bill Feature**:
   - Split by items
   - Split by amount
   - Split by percentage
   - Separate payment tracking

---

## 10. Summary

This plan provides a comprehensive implementation guide for the table management system, adapted from the old project to the new Next.js 16 + ASP.NET Core 8 architecture. The implementation follows best practices:

- **Separation of concerns** (Entity, DTO, Service, API)
- **Type safety** (C# types + TypeScript)
- **Dialog-based UI** (matches project design guidelines)
- **Real-time updates** (polling with future SignalR option)
- **Role-based security** (Manager/Admin only for table management)
- **Scalable architecture** (dedicated entity vs JSON storage)

The phased approach allows for incremental development and testing, ensuring each component works before moving to the next phase.
