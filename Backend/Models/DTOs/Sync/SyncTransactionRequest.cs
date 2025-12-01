namespace Backend.Models.DTOs.Sync;

public record SyncTransactionRequest(
    string Id,
    string Type,
    DateTime Timestamp,
    string BranchId,
    string UserId,
    object Data
);
