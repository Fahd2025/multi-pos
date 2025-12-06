namespace Backend.Models.DTOs.Shared.Migrations;

/// <summary>
/// Result of a migration operation
/// </summary>
public class MigrationResult
{
    public bool Success { get; set; }
    public List<string> AppliedMigrations { get; set; } = new();
    public string? ErrorMessage { get; set; }
    public TimeSpan Duration { get; set; }
    public int BranchesProcessed { get; set; }
    public int BranchesSucceeded { get; set; }
    public int BranchesFailed { get; set; }
}

/// <summary>
/// Migration history for a branch
/// </summary>
public class MigrationHistory
{
    public Guid BranchId { get; set; }
    public string BranchCode { get; set; } = string.Empty;
    public List<string> AppliedMigrations { get; set; } = new();
    public List<string> PendingMigrations { get; set; } = new();
    public DateTime? LastMigrationDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RetryCount { get; set; }
    public string? ErrorDetails { get; set; }
}
