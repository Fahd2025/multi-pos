using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.Tables;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Services.Branch.Tables;

/// <summary>
/// Service implementation for table management operations
/// </summary>
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
            .Where(s => s.OrderType == OrderType.DineIn
                     && s.Status == "open"
                     && s.TableId != null)
            .Include(s => s.LineItems)
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
                    GuestCount = sale.GuestCount,
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

    public async Task<int> AssignTableToSaleAsync(Guid saleId, AssignTableDto dto)
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
