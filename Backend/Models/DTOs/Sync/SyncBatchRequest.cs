namespace Backend.Models.DTOs.Sync;

public record SyncBatchRequest(List<SyncTransactionRequest> Transactions);
