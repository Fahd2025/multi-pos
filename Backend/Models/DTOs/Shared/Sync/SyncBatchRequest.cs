namespace Backend.Models.DTOs.Shared.Sync;

public record SyncBatchRequest(List<SyncTransactionRequest> Transactions);
