using Backend.Models.DTOs.Branch.Sales;
using Backend.Models.DTOs.Branch.PendingOrders;
using Backend.Models.DTOs.Branch.Customers;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Shared.Sync;

/// <summary>
/// Interface for sync service
/// Handles offline transaction synchronization with last-commit-wins conflict resolution
/// </summary>
public interface ISyncService
{
    /// <summary>
    /// Process an offline transaction from the sync queue
    /// Implements last-commit-wins conflict resolution
    /// </summary>
    /// <param name="transactionType">Type of transaction (sale, purchase, expense, inventory_adjust, pending_order)</param>
    /// <param name="transactionData">Transaction payload (as JSON)</param>
    /// <param name="branchId">Branch identifier</param>
    /// <param name="userId">User who created the transaction</param>
    /// <param name="clientTimestamp">Original client-side timestamp</param>
    /// <returns>Synchronized entity ID</returns>
    Task<string> ProcessOfflineTransactionAsync(
        string transactionType,
        string transactionData,
        string branchId,
        string userId,
        DateTime clientTimestamp
    );

    /// <summary>
    /// Process an offline sale transaction
    /// Handles inventory updates and customer stats with conflict resolution
    /// </summary>
    /// <param name="saleData">Sale creation DTO</param>
    /// <param name="userId">User who created the sale</param>
    /// <param name="clientTimestamp">Original client-side timestamp</param>
    /// <returns>Created sale entity</returns>
    Task<Sale> ProcessOfflineSaleAsync(
        CreateSaleDto saleData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    );

    /// <summary>
    /// Process an offline pending order transaction
    /// Creates pending order with client timestamp
    /// </summary>
    /// <param name="pendingOrderData">Pending order creation DTO</param>
    /// <param name="userId">User who created the order</param>
    /// <param name="branchId">Branch identifier</param>
    /// <param name="clientTimestamp">Original client-side timestamp</param>
    /// <returns>Created pending order entity ID</returns>
    Task<PendingOrder> ProcessOfflinePendingOrderAsync(
        CreatePendingOrderDto pendingOrderData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    );

    /// <summary>
    /// Process an offline customer creation transaction (Phase 1)
    /// Creates customer with client timestamp preserved
    /// </summary>
    /// <param name="customerData">Customer creation DTO</param>
    /// <param name="userId">User who created the customer</param>
    /// <param name="branchId">Branch identifier</param>
    /// <param name="clientTimestamp">Original client-side timestamp</param>
    /// <returns>Created customer entity</returns>
    Task<Customer> ProcessOfflineCustomerCreateAsync(
        CreateCustomerDto customerData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    );

    /// <summary>
    /// Process an offline customer update transaction (Phase 1)
    /// Updates customer with conflict detection (last-commit-wins)
    /// </summary>
    /// <param name="customerData">Customer update DTO</param>
    /// <param name="customerId">Customer ID to update</param>
    /// <param name="userId">User who updated the customer</param>
    /// <param name="branchId">Branch identifier</param>
    /// <param name="clientTimestamp">Original client-side timestamp</param>
    /// <returns>Updated customer entity</returns>
    Task<Customer> ProcessOfflineCustomerUpdateAsync(
        UpdateCustomerDto customerData,
        string customerId,
        string userId,
        string branchId,
        DateTime clientTimestamp
    );

    /// <summary>
    /// Process an offline customer deletion transaction (Phase 1)
    /// Soft deletes customer with client timestamp
    /// </summary>
    /// <param name="customerId">Customer ID to delete</param>
    /// <param name="userId">User who deleted the customer</param>
    /// <param name="branchId">Branch identifier</param>
    /// <param name="clientTimestamp">Original client-side timestamp</param>
    /// <returns>Task completion</returns>
    Task ProcessOfflineCustomerDeleteAsync(
        string customerId,
        string userId,
        string branchId,
        DateTime clientTimestamp
    );

    /// <summary>
    /// Get sync status for current branch
    /// </summary>
    /// <returns>Sync status information</returns>
    Task<SyncStatusDto> GetSyncStatusAsync();
}

/// <summary>
/// Sync status DTO
/// </summary>
public class SyncStatusDto
{
    public int PendingCount { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public bool IsOnline { get; set; }
    public List<string> RecentErrors { get; set; } = new();
}
