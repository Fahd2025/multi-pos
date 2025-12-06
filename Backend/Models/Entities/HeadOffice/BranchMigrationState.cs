using System;

namespace Backend.Models.Entities.HeadOffice;

/// <summary>
/// Tracks migration state for each branch database
/// </summary>
public class BranchMigrationState
{
    /// <summary>
    /// Unique identifier for this migration state record
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Reference to the branch this migration state belongs to
    /// </summary>
    public Guid BranchId { get; set; }

    /// <summary>
    /// Name of the last migration that was successfully applied
    /// Example: "20251215091544_AddBranchUsersTable"
    /// </summary>
    public string LastMigrationApplied { get; set; } = string.Empty;

    /// <summary>
    /// Current migration status
    /// </summary>
    public MigrationStatus Status { get; set; }

    /// <summary>
    /// Timestamp of the last migration attempt
    /// </summary>
    public DateTime LastAttemptAt { get; set; }

    /// <summary>
    /// Number of times migration has been retried (max 3)
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// Error details if migration failed
    /// </summary>
    public string? ErrorDetails { get; set; }

    /// <summary>
    /// Unique identifier of the process that currently holds the migration lock
    /// Used for distributed locking to prevent concurrent migrations
    /// </summary>
    public string? LockOwnerId { get; set; }

    /// <summary>
    /// Expiration timestamp for the migration lock (10 minutes from acquisition)
    /// After expiration, lock can be acquired by another process
    /// </summary>
    public DateTime? LockExpiresAt { get; set; }

    /// <summary>
    /// When this record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public Branch Branch { get; set; } = null!;
}

/// <summary>
/// Migration status enum
/// </summary>
public enum MigrationStatus
{
    /// <summary>
    /// Migrations are pending but not yet started
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Migration is currently in progress
    /// </summary>
    InProgress = 1,

    /// <summary>
    /// All migrations successfully applied
    /// </summary>
    Completed = 2,

    /// <summary>
    /// Migration failed (will be retried automatically)
    /// </summary>
    Failed = 3,

    /// <summary>
    /// Migration failed multiple times, requires manual intervention
    /// </summary>
    RequiresManualIntervention = 4
}
