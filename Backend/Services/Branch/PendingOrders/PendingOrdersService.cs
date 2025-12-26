using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.PendingOrders;
using Backend.Models.DTOs.Shared;
using Backend.Models.Entities.Branch;
using Backend.Models.Enums;
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Services.Branch.PendingOrders;

/// <summary>
/// Service for managing pending orders
/// </summary>
public class PendingOrdersService : IPendingOrdersService
{
    private readonly BranchDbContext _context;
    private readonly ILogger<PendingOrdersService> _logger;

    public PendingOrdersService(
        BranchDbContext context,
        ILogger<PendingOrdersService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ApiResponse<PendingOrderDto>> CreatePendingOrderAsync(
        CreatePendingOrderDto dto,
        string userId,
        string username)
    {
        try
        {
            // Validate items
            if (dto.Items == null || !dto.Items.Any())
            {
                return ApiResponse<PendingOrderDto>.ErrorResponse("At least one item is required");
            }

            // Generate order number
            var orderNumber = OrderNumberGenerator.GenerateOrderNumber();

            // Create pending order entity
            var pendingOrder = new PendingOrder
            {
                Id = Guid.NewGuid(),
                OrderNumber = orderNumber,
                CustomerName = dto.CustomerName,
                CustomerPhone = dto.CustomerPhone,
                CustomerId = dto.CustomerId,
                TableId = dto.TableId,
                TableNumber = dto.TableNumber,
                GuestCount = dto.GuestCount,
                Subtotal = dto.Subtotal,
                TaxAmount = dto.TaxAmount,
                DiscountAmount = dto.DiscountAmount,
                TotalAmount = dto.TotalAmount,
                Notes = dto.Notes,
                OrderType = dto.OrderType,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24), // Expire after 24 hours
                CreatedByUserId = userId,
                CreatedByUsername = username,
                Items = dto.Items.Select(item => new PendingOrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    ProductSku = item.ProductSku,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    Discount = item.Discount,
                    TotalPrice = item.TotalPrice,
                    Notes = item.Notes
                }).ToList()
            };

            _context.PendingOrders.Add(pendingOrder);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Pending order {OrderNumber} created by user {UserId}",
                orderNumber, userId);

            return ApiResponse<PendingOrderDto>.SuccessResponse(
                MapToDto(pendingOrder),
                "Pending order created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating pending order for user {UserId}", userId);
            return ApiResponse<PendingOrderDto>.ErrorResponse(
                "Failed to create pending order");
        }
    }

    public async Task<ApiResponse<PaginationResponse<PendingOrderDto>>> GetPendingOrdersAsync(
        PendingOrderStatus? status = null,
        string? createdBy = null,
        OrderType? orderType = null,
        string? search = null,
        int page = 1,
        int pageSize = 10,
        bool isManager = false,
        string? currentUserId = null)
    {
        try
        {
            var query = _context.PendingOrders
                .Include(po => po.Items)
                .AsQueryable();

            // Role-based filtering: Cashiers can only see their own orders
            if (!isManager && !string.IsNullOrEmpty(currentUserId))
            {
                query = query.Where(po => po.CreatedByUserId == currentUserId);
            }
            // Managers can filter by specific cashier if provided
            else if (isManager && !string.IsNullOrEmpty(createdBy))
            {
                query = query.Where(po => po.CreatedByUserId == createdBy);
            }

            // Filter by status
            if (status.HasValue)
            {
                query = query.Where(po => po.Status == status.Value);
            }

            // Filter by order type
            if (orderType.HasValue)
            {
                query = query.Where(po => po.OrderType == orderType.Value);
            }

            // Search by customer name, phone, or order number
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(po =>
                    (po.CustomerName != null && po.CustomerName.ToLower().Contains(searchLower)) ||
                    (po.CustomerPhone != null && po.CustomerPhone.Contains(search)) ||
                    po.OrderNumber.ToLower().Contains(searchLower));
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .OrderByDescending(po => po.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var paginationResponse = new PaginationResponse<PendingOrderDto>
            {
                Items = items.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            return ApiResponse<PaginationResponse<PendingOrderDto>>.SuccessResponse(
                paginationResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pending orders");
            return ApiResponse<PaginationResponse<PendingOrderDto>>.ErrorResponse(
                "Failed to retrieve pending orders");
        }
    }

    public async Task<ApiResponse<PendingOrderDto>> GetPendingOrderByIdAsync(
        Guid id,
        string userId,
        bool isManager)
    {
        try
        {
            var pendingOrder = await _context.PendingOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (pendingOrder == null)
            {
                return ApiResponse<PendingOrderDto>.ErrorResponse("Pending order not found");
            }

            // Check permission: Cashiers can only view their own orders
            if (!isManager && pendingOrder.CreatedByUserId != userId)
            {
                return ApiResponse<PendingOrderDto>.ErrorResponse(
                    "You don't have permission to view this order");
            }

            return ApiResponse<PendingOrderDto>.SuccessResponse(MapToDto(pendingOrder));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pending order {OrderId}", id);
            return ApiResponse<PendingOrderDto>.ErrorResponse(
                "Failed to retrieve pending order");
        }
    }

    public async Task<ApiResponse<PendingOrderDto>> UpdatePendingOrderAsync(
        Guid id,
        UpdatePendingOrderDto dto,
        string userId,
        bool isManager)
    {
        try
        {
            var pendingOrder = await _context.PendingOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (pendingOrder == null)
            {
                return ApiResponse<PendingOrderDto>.ErrorResponse("Pending order not found");
            }

            // Check permission
            if (!isManager && pendingOrder.CreatedByUserId != userId)
            {
                return ApiResponse<PendingOrderDto>.ErrorResponse(
                    "You don't have permission to update this order");
            }

            // Update fields (only if provided)
            if (dto.CustomerName != null)
                pendingOrder.CustomerName = dto.CustomerName;

            if (dto.CustomerPhone != null)
                pendingOrder.CustomerPhone = dto.CustomerPhone;

            if (dto.CustomerId.HasValue)
                pendingOrder.CustomerId = dto.CustomerId;

            if (dto.TableId.HasValue)
                pendingOrder.TableId = dto.TableId;

            if (dto.TableNumber != null)
                pendingOrder.TableNumber = dto.TableNumber;

            if (dto.GuestCount.HasValue)
                pendingOrder.GuestCount = dto.GuestCount;

            if (dto.Notes != null)
                pendingOrder.Notes = dto.Notes;

            if (dto.OrderType.HasValue)
                pendingOrder.OrderType = dto.OrderType.Value;

            if (dto.Status.HasValue)
                pendingOrder.Status = dto.Status.Value;

            // Update items if provided
            if (dto.Items != null && dto.Items.Any())
            {
                // Remove old items
                _context.PendingOrderItems.RemoveRange(pendingOrder.Items);

                // Add new items
                pendingOrder.Items = dto.Items.Select(item => new PendingOrderItem
                {
                    Id = Guid.NewGuid(),
                    PendingOrderId = pendingOrder.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    ProductSku = item.ProductSku,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    Discount = item.Discount,
                    TotalPrice = item.TotalPrice,
                    Notes = item.Notes
                }).ToList();
            }

            // Update totals if provided
            if (dto.Subtotal.HasValue)
                pendingOrder.Subtotal = dto.Subtotal.Value;

            if (dto.TaxAmount.HasValue)
                pendingOrder.TaxAmount = dto.TaxAmount.Value;

            if (dto.DiscountAmount.HasValue)
                pendingOrder.DiscountAmount = dto.DiscountAmount.Value;

            if (dto.TotalAmount.HasValue)
                pendingOrder.TotalAmount = dto.TotalAmount.Value;

            pendingOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Pending order {OrderNumber} updated by user {UserId}",
                pendingOrder.OrderNumber, userId);

            return ApiResponse<PendingOrderDto>.SuccessResponse(
                MapToDto(pendingOrder),
                "Pending order updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating pending order {OrderId}", id);
            return ApiResponse<PendingOrderDto>.ErrorResponse(
                "Failed to update pending order");
        }
    }

    public async Task<ApiResponse<bool>> DeletePendingOrderAsync(
        Guid id,
        string userId,
        bool isManager)
    {
        try
        {
            var pendingOrder = await _context.PendingOrders
                .FirstOrDefaultAsync(po => po.Id == id);

            if (pendingOrder == null)
            {
                return ApiResponse<bool>.ErrorResponse("Pending order not found");
            }

            // Check permission
            if (!isManager && pendingOrder.CreatedByUserId != userId)
            {
                return ApiResponse<bool>.ErrorResponse(
                    "You don't have permission to delete this order");
            }

            _context.PendingOrders.Remove(pendingOrder);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Pending order {OrderNumber} deleted by user {UserId}",
                pendingOrder.OrderNumber, userId);

            return ApiResponse<bool>.SuccessResponse(
                true,
                "Pending order deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting pending order {OrderId}", id);
            return ApiResponse<bool>.ErrorResponse("Failed to delete pending order");
        }
    }

    public async Task<ApiResponse<RetrievePendingOrderDto>> RetrievePendingOrderAsync(
        Guid id,
        string userId,
        bool isManager)
    {
        try
        {
            var pendingOrder = await _context.PendingOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (pendingOrder == null)
            {
                return ApiResponse<RetrievePendingOrderDto>.ErrorResponse(
                    "Pending order not found");
            }

            // Check permission
            if (!isManager && pendingOrder.CreatedByUserId != userId)
            {
                return ApiResponse<RetrievePendingOrderDto>.ErrorResponse(
                    "You don't have permission to retrieve this order");
            }

            // Mark as retrieved
            pendingOrder.Status = PendingOrderStatus.Retrieved;
            pendingOrder.RetrievedAt = DateTime.UtcNow;
            pendingOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Pending order {OrderNumber} retrieved by user {UserId}",
                pendingOrder.OrderNumber, userId);

            var dto = MapToRetrieveDto(pendingOrder);

            return ApiResponse<RetrievePendingOrderDto>.SuccessResponse(
                dto,
                "Pending order retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pending order {OrderId}", id);
            return ApiResponse<RetrievePendingOrderDto>.ErrorResponse(
                "Failed to retrieve pending order");
        }
    }

    public async Task<ApiResponse<Guid>> ConvertToSaleAsync(Guid id, string userId)
    {
        try
        {
            var pendingOrder = await _context.PendingOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (pendingOrder == null)
            {
                return ApiResponse<Guid>.ErrorResponse("Pending order not found");
            }

            // TODO: Implement conversion to Sale
            // This would create a new Sale entity from the pending order
            // For now, just delete the pending order after marking as retrieved

            _context.PendingOrders.Remove(pendingOrder);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Pending order {OrderNumber} converted to sale by user {UserId}",
                pendingOrder.OrderNumber, userId);

            return ApiResponse<Guid>.SuccessResponse(
                Guid.NewGuid(), // TODO: Return actual Sale ID
                "Pending order converted to sale successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting pending order {OrderId} to sale", id);
            return ApiResponse<Guid>.ErrorResponse("Failed to convert pending order to sale");
        }
    }

    public async Task<ApiResponse<PendingOrderStatsDto>> GetPendingOrderStatsAsync()
    {
        try
        {
            var pendingOrders = await _context.PendingOrders
                .Include(po => po.Items)
                .ToListAsync();

            var now = DateTime.UtcNow;

            var stats = new PendingOrderStatsDto
            {
                TotalPendingOrders = pendingOrders.Count,
                OrdersByStatus = pendingOrders
                    .GroupBy(po => po.Status)
                    .ToDictionary(g => g.Key, g => g.Count()),
                OrdersByUser = pendingOrders
                    .GroupBy(po => po.CreatedByUsername)
                    .ToDictionary(g => g.Key, g => g.Count()),
                OrdersByType = pendingOrders
                    .GroupBy(po => po.OrderType)
                    .ToDictionary(g => g.Key, g => g.Count()),
                TotalPendingValue = pendingOrders.Sum(po => po.TotalAmount),
                OrdersExpiringSoon = pendingOrders
                    .Count(po => po.ExpiresAt > now && po.ExpiresAt <= now.AddMinutes(30)),
                ExpiredOrders = pendingOrders.Count(po => po.ExpiresAt <= now),
                OldestPendingOrder = pendingOrders.Any()
                    ? pendingOrders.Min(po => po.CreatedAt)
                    : null,
                NewestPendingOrder = pendingOrders.Any()
                    ? pendingOrders.Max(po => po.CreatedAt)
                    : null,
                AveragePendingTimeMinutes = pendingOrders.Any()
                    ? pendingOrders.Average(po => (now - po.CreatedAt).TotalMinutes)
                    : 0
            };

            return ApiResponse<PendingOrderStatsDto>.SuccessResponse(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pending order stats");
            return ApiResponse<PendingOrderStatsDto>.ErrorResponse(
                "Failed to retrieve pending order statistics");
        }
    }

    public async Task<int> DeleteExpiredOrdersAsync()
    {
        try
        {
            var now = DateTime.UtcNow;
            var expiredOrders = await _context.PendingOrders
                .Where(po => po.ExpiresAt <= now)
                .ToListAsync();

            if (expiredOrders.Any())
            {
                _context.PendingOrders.RemoveRange(expiredOrders);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Deleted {Count} expired pending orders",
                    expiredOrders.Count);
            }

            return expiredOrders.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting expired pending orders");
            return 0;
        }
    }

    // Helper methods for mapping entities to DTOs
    private static PendingOrderDto MapToDto(PendingOrder entity)
    {
        return new PendingOrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            CustomerName = entity.CustomerName,
            CustomerPhone = entity.CustomerPhone,
            CustomerId = entity.CustomerId,
            TableId = entity.TableId,
            TableNumber = entity.TableNumber,
            GuestCount = entity.GuestCount,
            Items = entity.Items.Select(item => new PendingOrderItemDto
            {
                Id = item.Id,
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                ProductSku = item.ProductSku,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                Discount = item.Discount,
                TotalPrice = item.TotalPrice,
                Notes = item.Notes
            }).ToList(),
            Subtotal = entity.Subtotal,
            TaxAmount = entity.TaxAmount,
            DiscountAmount = entity.DiscountAmount,
            TotalAmount = entity.TotalAmount,
            Notes = entity.Notes,
            OrderType = entity.OrderType,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            CreatedByUserId = entity.CreatedByUserId,
            CreatedByUsername = entity.CreatedByUsername,
            RetrievedAt = entity.RetrievedAt,
            ExpiresAt = entity.ExpiresAt
        };
    }

    private static RetrievePendingOrderDto MapToRetrieveDto(PendingOrder entity)
    {
        var dto = new RetrievePendingOrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            CustomerName = entity.CustomerName,
            CustomerPhone = entity.CustomerPhone,
            CustomerId = entity.CustomerId,
            TableId = entity.TableId,
            TableNumber = entity.TableNumber,
            GuestCount = entity.GuestCount,
            Items = entity.Items.Select(item => new PendingOrderItemDto
            {
                Id = item.Id,
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                ProductSku = item.ProductSku,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                Discount = item.Discount,
                TotalPrice = item.TotalPrice,
                Notes = item.Notes
            }).ToList(),
            Subtotal = entity.Subtotal,
            TaxAmount = entity.TaxAmount,
            DiscountAmount = entity.DiscountAmount,
            TotalAmount = entity.TotalAmount,
            Notes = entity.Notes,
            OrderType = entity.OrderType,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            CreatedByUserId = entity.CreatedByUserId,
            CreatedByUsername = entity.CreatedByUsername,
            RetrievedAt = entity.RetrievedAt,
            ExpiresAt = entity.ExpiresAt,
            WasRetrieved = entity.RetrievedAt.HasValue,
            RetrievalTimestamp = entity.RetrievedAt
        };

        return dto;
    }
}
