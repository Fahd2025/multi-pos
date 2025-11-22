using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class SyncQueue
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string SyncId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string TransactionType { get; set; } = string.Empty;

    [Required]
    public string TransactionData { get; set; } = string.Empty;

    [Required]
    public DateTime Timestamp { get; set; }

    [Required]
    public SyncStatus SyncStatus { get; set; } = SyncStatus.Pending;

    [Required]
    public int RetryCount { get; set; } = 0;

    public DateTime? LastSyncAttempt { get; set; }

    public string? ErrorMessage { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum SyncStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Failed = 3,
}
