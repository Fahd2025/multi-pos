using Backend.Models.DTOs.Branch.PendingOrders;
using Backend.Models.DTOs.Shared;
using Backend.Models.Enums;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch.PendingOrders;

/// <summary>
/// Service for managing pending (incomplete) orders in the POS system
/// </summary>
public interface IPendingOrdersService
{
    /// <summary>
    /// Create a new pending order
    /// </summary>
    /// <param name="dto">Order data</param>
    /// <param name="userId">User creating the order</param>
    /// <param name="username">Username of the creator</param>
    /// <returns>Created pending order with generated order number</returns>
    Task<ApiResponse<PendingOrderDto>> CreatePendingOrderAsync(
        CreatePendingOrderDto dto,
        string userId,
        string username);

    /// <summary>
    /// Get pending orders with filtering and pagination
    /// </summary>
    /// <param name="status">Filter by status</param>
    /// <param name="createdBy">Filter by creator (for managers to filter by specific cashier)</param>
    /// <param name="orderType">Filter by order type</param>
    /// <param name="search">Search by customer name, phone, or order number</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page</param>
    /// <param name="isManager">Whether the current user is a manager</param>
    /// <param name="currentUserId">Current user ID (cashiers can only see their own orders)</param>
    /// <returns>Paginated list of pending orders</returns>
    Task<ApiResponse<PaginationResponse<PendingOrderDto>>> GetPendingOrdersAsync(
        PendingOrderStatus? status = null,
        string? createdBy = null,
        OrderType? orderType = null,
        string? search = null,
        int page = 1,
        int pageSize = 10,
        bool isManager = false,
        string? currentUserId = null);

    /// <summary>
    /// Get a pending order by ID
    /// </summary>
    /// <param name="id">Pending order ID</param>
    /// <param name="userId">Current user ID</param>
    /// <param name="isManager">Whether the current user is a manager</param>
    /// <returns>Pending order details</returns>
    Task<ApiResponse<PendingOrderDto>> GetPendingOrderByIdAsync(
        Guid id,
        string userId,
        bool isManager);

    /// <summary>
    /// Update a pending order
    /// </summary>
    /// <param name="id">Pending order ID</param>
    /// <param name="dto">Update data</param>
    /// <param name="userId">Current user ID</param>
    /// <param name="isManager">Whether the current user is a manager</param>
    /// <returns>Updated pending order</returns>
    Task<ApiResponse<PendingOrderDto>> UpdatePendingOrderAsync(
        Guid id,
        UpdatePendingOrderDto dto,
        string userId,
        bool isManager);

    /// <summary>
    /// Delete a pending order
    /// </summary>
    /// <param name="id">Pending order ID</param>
    /// <param name="userId">Current user ID</param>
    /// <param name="isManager">Whether the current user is a manager</param>
    /// <returns>Success result</returns>
    Task<ApiResponse<bool>> DeletePendingOrderAsync(
        Guid id,
        string userId,
        bool isManager);

    /// <summary>
    /// Retrieve a pending order (marks as retrieved)
    /// </summary>
    /// <param name="id">Pending order ID</param>
    /// <param name="userId">Current user ID</param>
    /// <param name="isManager">Whether the current user is a manager</param>
    /// <returns>Retrieved pending order</returns>
    Task<ApiResponse<RetrievePendingOrderDto>> RetrievePendingOrderAsync(
        Guid id,
        string userId,
        bool isManager);

    /// <summary>
    /// Convert a pending order to a completed sale
    /// </summary>
    /// <param name="id">Pending order ID</param>
    /// <param name="userId">Current user ID</param>
    /// <returns>Created sale ID</returns>
    Task<ApiResponse<Guid>> ConvertToSaleAsync(
        Guid id,
        string userId);

    /// <summary>
    /// Get pending orders statistics (Manager only)
    /// </summary>
    /// <returns>Statistics about pending orders</returns>
    Task<ApiResponse<PendingOrderStatsDto>> GetPendingOrderStatsAsync();

    /// <summary>
    /// Delete expired pending orders (orders older than 24 hours)
    /// </summary>
    /// <returns>Number of orders deleted</returns>
    Task<int> DeleteExpiredOrdersAsync();
}
