namespace Backend.Models.DTOs.Branch.Sync;

/// <summary>
/// DTO for syncing offline transactions from client to server
/// </summary>
public class SyncTransactionDto
{
    /// <summary>
    /// Client-side transaction ID (for tracking and deduplication)
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Transaction type: sale, purchase, expense, inventory_adjust, pending_order
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when transaction was created on client
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Branch ID for the transaction
    /// </summary>
    public Guid BranchId { get; set; }

    /// <summary>
    /// User ID who created the transaction
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Transaction-specific payload (JSON object)
    /// For pending_order: CreatePendingOrderDto
    /// For sale: CreateSaleDto
    /// etc.
    /// </summary>
    public object Data { get; set; } = new object();
}

/// <summary>
/// Response from sync operation
/// </summary>
public class SyncResultDto
{
    /// <summary>
    /// Client transaction ID
    /// </summary>
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>
    /// Whether sync was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Server-generated entity ID (if applicable)
    /// </summary>
    public Guid? EntityId { get; set; }

    /// <summary>
    /// Error message (if sync failed)
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Additional metadata
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}
