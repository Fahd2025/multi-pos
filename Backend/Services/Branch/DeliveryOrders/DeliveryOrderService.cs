using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.DeliveryOrders;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch.DeliveryOrders;

public class DeliveryOrderService : IDeliveryOrderService
{
    private readonly BranchDbContext _context;

    public DeliveryOrderService(BranchDbContext context)
    {
        _context = context;
    }

    public async Task<DeliveryOrderDto?> GetDeliveryOrderByIdAsync(Guid id, string branchCode)
    {
        var deliveryOrder = await _context.DeliveryOrders
            .Where(d => d.Id == id)
            .Include(d => d.Sale)
                .ThenInclude(s => s.Customer)
            .Include(d => d.Driver)
            .Select(d => new DeliveryOrderDto
            {
                Id = d.Id,
                OrderId = d.OrderId,
                OrderTransactionId = d.Sale != null ? d.Sale.TransactionId : string.Empty,
                CustomerId = d.CustomerId,
                CustomerName = d.Sale != null && d.Sale.Customer != null ? d.Sale.Customer.NameEn : string.Empty,
                DriverId = d.DriverId,
                DriverName = d.Driver != null ? d.Driver.NameEn : string.Empty,
                PickupAddress = d.PickupAddress,
                DeliveryAddress = d.DeliveryAddress,
                DeliveryLocation = d.DeliveryLocation,
                EstimatedDeliveryTime = d.EstimatedDeliveryTime,
                ActualDeliveryTime = d.ActualDeliveryTime,
                DeliveryStatus = d.DeliveryStatus,
                Priority = d.Priority,
                SpecialInstructions = d.SpecialInstructions,
                ItemsCount = d.Sale != null ? d.Sale.LineItems.Count : 0,
                OrderTotal = d.Sale != null ? d.Sale.Total : 0,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt
            })
            .FirstOrDefaultAsync();

        return deliveryOrder;
    }

    public async Task<IEnumerable<DeliveryOrderDto>> GetAllDeliveryOrdersAsync(string branchCode,
        DeliveryStatus? status = null, Guid? driverId = null, Guid? orderId = null, int page = 1, int pageSize = 20)
    {
        var query = _context.DeliveryOrders
            .Include(d => d.Sale)
                .ThenInclude(s => s.Customer)
            .Include(d => d.Driver)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(d => d.DeliveryStatus == status.Value);
        }

        if (driverId.HasValue)
        {
            query = query.Where(d => d.DriverId == driverId.Value);
        }

        if (orderId.HasValue)
        {
            query = query.Where(d => d.OrderId == orderId.Value);
        }

        var deliveryOrders = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(deliveryOrder => new DeliveryOrderDto
            {
                Id = deliveryOrder.Id,
                OrderId = deliveryOrder.OrderId,
                OrderTransactionId = deliveryOrder.Sale != null ? deliveryOrder.Sale.TransactionId : string.Empty,
                CustomerId = deliveryOrder.CustomerId,
                CustomerName = deliveryOrder.Sale != null && deliveryOrder.Sale.Customer != null ? deliveryOrder.Sale.Customer.NameEn : string.Empty,
                DriverId = deliveryOrder.DriverId,
                DriverName = deliveryOrder.Driver != null ? deliveryOrder.Driver.NameEn : string.Empty,
                PickupAddress = deliveryOrder.PickupAddress,
                DeliveryAddress = deliveryOrder.DeliveryAddress,
                DeliveryLocation = deliveryOrder.DeliveryLocation,
                EstimatedDeliveryTime = deliveryOrder.EstimatedDeliveryTime,
                ActualDeliveryTime = deliveryOrder.ActualDeliveryTime,
                DeliveryStatus = deliveryOrder.DeliveryStatus,
                Priority = deliveryOrder.Priority,
                SpecialInstructions = deliveryOrder.SpecialInstructions,
                ItemsCount = deliveryOrder.Sale != null ? deliveryOrder.Sale.LineItems.Count : 0,
                OrderTotal = deliveryOrder.Sale != null ? deliveryOrder.Sale.Total : 0,
                CreatedAt = deliveryOrder.CreatedAt,
                UpdatedAt = deliveryOrder.UpdatedAt
            })
            .ToListAsync();

        return deliveryOrders;
    }

    public async Task<DeliveryOrderDto> CreateDeliveryOrderAsync(CreateDeliveryOrderDto createDeliveryOrderDto, Guid createdById, string branchCode)
    {
        // Verify the order exists
        var sale = await _context.Sales
            .Where(s => s.Id == createDeliveryOrderDto.OrderId)
            .Include(s => s.Customer)
            .Include(s => s.LineItems)
            .FirstOrDefaultAsync();

        if (sale == null)
        {
            throw new InvalidOperationException($"Sale with ID '{createDeliveryOrderDto.OrderId}' does not exist");
        }

        // Check if a delivery order already exists for this sale
        var existingDeliveryOrder = await _context.DeliveryOrders
            .AnyAsync(d => d.OrderId == createDeliveryOrderDto.OrderId);

        if (existingDeliveryOrder)
        {
            throw new InvalidOperationException($"A delivery order already exists for sale with ID '{createDeliveryOrderDto.OrderId}'");
        }

        // If no pickup address provided, use the business location (this can be configured differently based on business needs)
        var pickupAddress = createDeliveryOrderDto.PickupAddress ?? string.Empty;

        // Calculate estimated delivery time if not provided and estimated minutes is provided
        DateTime? calculatedEstimatedDeliveryTime = createDeliveryOrderDto.EstimatedDeliveryTime;
        if (!calculatedEstimatedDeliveryTime.HasValue && createDeliveryOrderDto.EstimatedDeliveryMinutes.HasValue)
        {
            calculatedEstimatedDeliveryTime = DateTime.UtcNow.AddMinutes(createDeliveryOrderDto.EstimatedDeliveryMinutes.Value);
        }

        var deliveryOrder = new DeliveryOrder
        {
            Id = Guid.NewGuid(),
            OrderId = createDeliveryOrderDto.OrderId,
            CustomerId = sale.CustomerId, // Copy from sale (may be null if no customer associated)
            DriverId = null, // No driver assigned initially
            PickupAddress = pickupAddress,
            DeliveryAddress = createDeliveryOrderDto.DeliveryAddress,
            DeliveryLocation = createDeliveryOrderDto.DeliveryLocation, // Add the delivery location
            EstimatedDeliveryTime = calculatedEstimatedDeliveryTime,
            ActualDeliveryTime = null,
            DeliveryStatus = DeliveryStatus.Pending, // Start with pending status
            Priority = createDeliveryOrderDto.Priority,
            SpecialInstructions = createDeliveryOrderDto.SpecialInstructions,
            EstimatedDeliveryMinutes = createDeliveryOrderDto.EstimatedDeliveryMinutes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdById
        };

        _context.DeliveryOrders.Add(deliveryOrder);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            throw new Exception($"Database error: {innerMessage}");
        }

        return new DeliveryOrderDto
        {
            Id = deliveryOrder.Id,
            OrderId = deliveryOrder.OrderId,
            OrderTransactionId = sale.TransactionId,
            CustomerId = deliveryOrder.CustomerId,
            CustomerName = sale.Customer?.NameEn ?? string.Empty,
            DriverId = deliveryOrder.DriverId,
            DriverName = null, // No driver assigned yet
            PickupAddress = deliveryOrder.PickupAddress,
            DeliveryAddress = deliveryOrder.DeliveryAddress,
            DeliveryLocation = deliveryOrder.DeliveryLocation,
            EstimatedDeliveryTime = deliveryOrder.EstimatedDeliveryTime,
            ActualDeliveryTime = deliveryOrder.ActualDeliveryTime,
            DeliveryStatus = deliveryOrder.DeliveryStatus,
            Priority = deliveryOrder.Priority,
            SpecialInstructions = deliveryOrder.SpecialInstructions,
            ItemsCount = sale.LineItems.Count,
            OrderTotal = sale.Total,
            CreatedAt = deliveryOrder.CreatedAt,
            UpdatedAt = deliveryOrder.UpdatedAt
        };
    }

    public async Task<DeliveryOrderDto?> UpdateDeliveryOrderAsync(Guid id, UpdateDeliveryOrderDto updateDeliveryOrderDto, string branchCode)
    {
        var deliveryOrder = await _context.DeliveryOrders
            .Include(d => d.Sale)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (deliveryOrder == null)
        {
            return null;
        }

        // Verify driver exists if being assigned
        if (updateDeliveryOrderDto.DriverId.HasValue)
        {
            var driver = await _context.Drivers
                .Where(d => d.Id == updateDeliveryOrderDto.DriverId.Value && d.IsActive)
                .FirstOrDefaultAsync();

            if (driver == null)
            {
                throw new InvalidOperationException($"Driver with ID '{updateDeliveryOrderDto.DriverId.Value}' does not exist or is inactive");
            }
        }

        // Update fields if provided
        if (updateDeliveryOrderDto.DriverId.HasValue)
            deliveryOrder.DriverId = updateDeliveryOrderDto.DriverId;

        if (updateDeliveryOrderDto.DeliveryStatus.HasValue)
            deliveryOrder.DeliveryStatus = updateDeliveryOrderDto.DeliveryStatus.Value;

        if (updateDeliveryOrderDto.EstimatedDeliveryTime.HasValue)
            deliveryOrder.EstimatedDeliveryTime = updateDeliveryOrderDto.EstimatedDeliveryTime;

        if (updateDeliveryOrderDto.ActualDeliveryTime.HasValue)
            deliveryOrder.ActualDeliveryTime = updateDeliveryOrderDto.ActualDeliveryTime;

        if (!string.IsNullOrEmpty(updateDeliveryOrderDto.DeliveryAddress))
            deliveryOrder.DeliveryAddress = updateDeliveryOrderDto.DeliveryAddress;

        if (!string.IsNullOrEmpty(updateDeliveryOrderDto.PickupAddress))
            deliveryOrder.PickupAddress = updateDeliveryOrderDto.PickupAddress;

        if (!string.IsNullOrEmpty(updateDeliveryOrderDto.SpecialInstructions))
            deliveryOrder.SpecialInstructions = updateDeliveryOrderDto.SpecialInstructions;

        if (updateDeliveryOrderDto.Priority.HasValue)
            deliveryOrder.Priority = updateDeliveryOrderDto.Priority.Value;

        if (!string.IsNullOrEmpty(updateDeliveryOrderDto.DeliveryLocation))
            deliveryOrder.DeliveryLocation = updateDeliveryOrderDto.DeliveryLocation;

        if (updateDeliveryOrderDto.EstimatedDeliveryMinutes.HasValue)
            deliveryOrder.EstimatedDeliveryMinutes = updateDeliveryOrderDto.EstimatedDeliveryMinutes;

        deliveryOrder.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new DeliveryOrderDto
        {
            Id = deliveryOrder.Id,
            OrderId = deliveryOrder.OrderId,
            OrderTransactionId = deliveryOrder.Sale?.TransactionId ?? string.Empty,
            CustomerId = deliveryOrder.CustomerId,
            CustomerName = deliveryOrder.Sale?.Customer?.NameEn ?? string.Empty,
            DriverId = deliveryOrder.DriverId,
            DriverName = deliveryOrder.Driver != null ? deliveryOrder.Driver.NameEn : null,
            PickupAddress = deliveryOrder.PickupAddress,
            DeliveryAddress = deliveryOrder.DeliveryAddress,
            DeliveryLocation = deliveryOrder.DeliveryLocation,
            EstimatedDeliveryTime = deliveryOrder.EstimatedDeliveryTime,
            ActualDeliveryTime = deliveryOrder.ActualDeliveryTime,
            DeliveryStatus = deliveryOrder.DeliveryStatus,
            Priority = deliveryOrder.Priority,
            SpecialInstructions = deliveryOrder.SpecialInstructions,
            ItemsCount = deliveryOrder.Sale?.LineItems.Count ?? 0,
            OrderTotal = deliveryOrder.Sale?.Total ?? 0,
            CreatedAt = deliveryOrder.CreatedAt,
            UpdatedAt = deliveryOrder.UpdatedAt
        };
    }

    public async Task<bool> DeleteDeliveryOrderAsync(Guid id, string branchCode)
    {
        var deliveryOrder = await _context.DeliveryOrders.FindAsync(id);
        if (deliveryOrder == null)
        {
            return false;
        }

        _context.DeliveryOrders.Remove(deliveryOrder);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DeliveryOrderDto?> AssignDriverToDeliveryOrderAsync(Guid deliveryOrderId, Guid driverId, string branchCode)
    {
        var deliveryOrder = await _context.DeliveryOrders
            .Include(d => d.Sale)
            .FirstOrDefaultAsync(d => d.Id == deliveryOrderId);

        if (deliveryOrder == null)
        {
            return null;
        }

        // Verify driver exists and is active
        var driver = await _context.Drivers
            .Where(d => d.Id == driverId && d.IsActive)
            .FirstOrDefaultAsync();

        if (driver == null)
        {
            throw new InvalidOperationException($"Driver with ID '{driverId}' does not exist or is inactive");
        }

        // Check if driver is available
        if (!driver.IsAvailable)
        {
            throw new InvalidOperationException($"Driver '{driver.NameEn}' is not available for delivery");
        }

        deliveryOrder.DriverId = driverId;
        deliveryOrder.DeliveryStatus = DeliveryStatus.Assigned; // Update status to assigned
        deliveryOrder.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new DeliveryOrderDto
        {
            Id = deliveryOrder.Id,
            OrderId = deliveryOrder.OrderId,
            OrderTransactionId = deliveryOrder.Sale?.TransactionId ?? string.Empty,
            CustomerId = deliveryOrder.CustomerId,
            CustomerName = deliveryOrder.Sale?.Customer?.NameEn ?? string.Empty,
            DriverId = deliveryOrder.DriverId,
            DriverName = driver.NameEn,
            PickupAddress = deliveryOrder.PickupAddress,
            DeliveryAddress = deliveryOrder.DeliveryAddress,
            DeliveryLocation = deliveryOrder.DeliveryLocation,
            EstimatedDeliveryTime = deliveryOrder.EstimatedDeliveryTime,
            ActualDeliveryTime = deliveryOrder.ActualDeliveryTime,
            DeliveryStatus = deliveryOrder.DeliveryStatus,
            Priority = deliveryOrder.Priority,
            SpecialInstructions = deliveryOrder.SpecialInstructions,
            ItemsCount = deliveryOrder.Sale?.LineItems.Count ?? 0,
            OrderTotal = deliveryOrder.Sale?.Total ?? 0,
            CreatedAt = deliveryOrder.CreatedAt,
            UpdatedAt = deliveryOrder.UpdatedAt
        };
    }

    public async Task<DeliveryOrderDto?> UpdateDeliveryStatusAsync(Guid deliveryOrderId, DeliveryStatus newStatus, string branchCode)
    {
        var deliveryOrder = await _context.DeliveryOrders
            .Include(d => d.Sale)
            .Include(d => d.Driver)
            .FirstOrDefaultAsync(d => d.Id == deliveryOrderId);

        if (deliveryOrder == null)
        {
            return null;
        }

        // Update status and potentially other fields based on the new status
        deliveryOrder.DeliveryStatus = newStatus;
        deliveryOrder.UpdatedAt = DateTime.UtcNow;

        // If status is Delivered, update actual delivery time
        if (newStatus == DeliveryStatus.Delivered && !deliveryOrder.ActualDeliveryTime.HasValue)
        {
            deliveryOrder.ActualDeliveryTime = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new DeliveryOrderDto
        {
            Id = deliveryOrder.Id,
            OrderId = deliveryOrder.OrderId,
            OrderTransactionId = deliveryOrder.Sale?.TransactionId ?? string.Empty,
            CustomerId = deliveryOrder.CustomerId,
            CustomerName = deliveryOrder.Sale?.Customer?.NameEn ?? string.Empty,
            DriverId = deliveryOrder.DriverId,
            DriverName = deliveryOrder.Driver?.NameEn,
            PickupAddress = deliveryOrder.PickupAddress,
            DeliveryAddress = deliveryOrder.DeliveryAddress,
            DeliveryLocation = deliveryOrder.DeliveryLocation,
            EstimatedDeliveryTime = deliveryOrder.EstimatedDeliveryTime,
            ActualDeliveryTime = deliveryOrder.ActualDeliveryTime,
            DeliveryStatus = deliveryOrder.DeliveryStatus,
            Priority = deliveryOrder.Priority,
            SpecialInstructions = deliveryOrder.SpecialInstructions,
            ItemsCount = deliveryOrder.Sale?.LineItems.Count ?? 0,
            OrderTotal = deliveryOrder.Sale?.Total ?? 0,
            CreatedAt = deliveryOrder.CreatedAt,
            UpdatedAt = deliveryOrder.UpdatedAt
        };
    }
}