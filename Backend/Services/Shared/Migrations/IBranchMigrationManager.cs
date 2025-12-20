using Backend.Models.DTOs.Shared.Migrations;

namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Service for managing branch database migrations
/// </summary>
public interface IBranchMigrationManager
{
    /// <summary>
    /// Apply pending migrations to a specific branch database
    /// </summary>
    Task<MigrationResult> ApplyMigrationsAsync(
        Guid branchId,
        string? targetMigration = null,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Apply pending migrations to all active branch databases
    /// </summary>
    Task<MigrationResult> ApplyMigrationsToAllBranchesAsync(
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Get list of pending migrations for a branch
    /// </summary>
    Task<List<string>> GetPendingMigrationsAsync(Guid branchId);

    /// <summary>
    /// Get migration history for a branch
    /// </summary>
    Task<MigrationHistory> GetMigrationHistoryAsync(Guid branchId);

    /// <summary>
    /// Validate that a branch database schema is correct
    /// </summary>
    Task<bool> ValidateBranchDatabaseAsync(Guid branchId);

    /// <summary>
    /// Rollback the last applied migration for a branch
    /// </summary>
    Task<MigrationResult> RollbackLastMigrationAsync(Guid branchId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Rollback the last applied migration for all active branches
    /// </summary>
    Task<MigrationResult> RollbackAllBranchesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Force remove a specific migration from history without running Down() method
    /// Use this for cleaning up deleted/broken migrations
    /// </summary>
    Task<MigrationResult> ForceRemoveMigrationAsync(
        Guid branchId,
        string migrationId,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Force remove a specific migration from all branch databases
    /// </summary>
    Task<MigrationResult> ForceRemoveMigrationFromAllBranchesAsync(
        string migrationId,
        CancellationToken cancellationToken = default
    );
}
