using Backend.Models.DTOs.Branch.Sales;
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
    /// <param name="transactionType">Type of transaction (sale, purchase, expense, inventory_adjust)</param>
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
