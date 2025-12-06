using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;

namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Strategy interface for database provider-specific migration logic
/// </summary>
public interface IMigrationStrategy
{
    /// <summary>
    /// The database provider this strategy handles
    /// </summary>
    DatabaseProvider Provider { get; }

    /// <summary>
    /// Test if the database can be connected to
    /// </summary>
    Task<bool> CanConnectAsync(string connectionString);

    /// <summary>
    /// Check if the database exists
    /// </summary>
    Task<bool> DatabaseExistsAsync(BranchDbContext context);

    /// <summary>
    /// Get list of pending migrations that need to be applied
    /// </summary>
    Task<List<string>> GetPendingMigrationsAsync(BranchDbContext context);

    /// <summary>
    /// Get list of migrations that have already been applied
    /// </summary>
    Task<List<string>> GetAppliedMigrationsAsync(BranchDbContext context);

    /// <summary>
    /// Apply all pending migrations to the database
    /// </summary>
    Task ApplyMigrationsAsync(BranchDbContext context, CancellationToken cancellationToken);

    /// <summary>
    /// Validate that the database schema is correct and all required tables exist
    /// </summary>
    Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context);
}
