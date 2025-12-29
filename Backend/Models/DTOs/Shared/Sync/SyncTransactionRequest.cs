namespace Backend.Models.DTOs.Shared.Sync;

/// <summary>
/// Request model for synchronizing offline transactions
/// Enhanced for Phase 1 with dependency tracking and temporary ID management
/// </summary>
public record SyncTransactionRequest(
    /// <summary>Client-generated transaction ID</summary>
    string Id,

    /// <summary>Transaction type (e.g., "sale_create", "customer_update")</summary>
    string Type,

    /// <summary>Client timestamp when transaction was created</summary>
    DateTime Timestamp,

    /// <summary>Branch ID where transaction originated</summary>
    string BranchId,

    /// <summary>User ID who initiated the transaction</summary>
    string UserId,

    /// <summary>Transaction payload data</summary>
    object Data,

    /// <summary>
    /// Transaction IDs this transaction depends on (for dependency ordering)
    /// Example: A sale depends on customer creation transaction
    /// </summary>
    string[]? Dependencies = null,

    /// <summary>
    /// Entity ID for UPDATE/DELETE operations
    /// Can be a real server ID or a temporary ID (starting with "temp-")
    /// </summary>
    string? EntityId = null,

    /// <summary>
    /// Temporary ID for CREATE operations (to be mapped to real ID after sync)
    /// Format: "temp-{entityType}-{timestamp}-{random}"
    /// </summary>
    string? EntityTempId = null,

    /// <summary>
    /// Foreign key references that need to be resolved during sync
    /// Used when transaction references temporary IDs from other transactions
    /// </summary>
    ForeignKeyReference[]? ForeignKeys = null
);
