using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Base implementation for migration strategies with common functionality
/// </summary>
public abstract class BaseMigrationStrategy : IMigrationStrategy
{
    protected readonly ILogger Logger;

    protected BaseMigrationStrategy(ILogger logger)
    {
        Logger = logger;
    }

    public abstract DatabaseProvider Provider { get; }

    /// <summary>
    /// Default implementation using EF Core API
    /// </summary>
    public virtual async Task<List<string>> GetPendingMigrationsAsync(BranchDbContext context)
    {
        var pending = await context.Database.GetPendingMigrationsAsync();
        return pending.ToList();
    }

    /// <summary>
    /// Default implementation using EF Core API
    /// </summary>
    public virtual async Task<List<string>> GetAppliedMigrationsAsync(BranchDbContext context)
    {
        var applied = await context.Database.GetAppliedMigrationsAsync();
        return applied.ToList();
    }

    /// <summary>
    /// Default implementation using EF Core MigrateAsync
    /// </summary>
    public virtual async Task ApplyMigrationsAsync(BranchDbContext context, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Applying migrations using EF Core MigrateAsync for provider {Provider}", Provider);
        await context.Database.MigrateAsync(cancellationToken);
    }

    /// <summary>
    /// Rollback to a specific migration using EF Core Migrator
    /// </summary>
    public virtual async Task RollbackToMigrationAsync(BranchDbContext context, string? targetMigration, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Rolling back to migration {TargetMigration} for provider {Provider}", targetMigration ?? "(empty)", Provider);

        var serviceProvider = context.GetInfrastructure();
        var migrator = serviceProvider.GetService<Microsoft.EntityFrameworkCore.Migrations.IMigrator>();
        if (migrator == null)
        {
            throw new InvalidOperationException("Could not get IMigrator service");
        }

        await migrator.MigrateAsync(targetMigration, cancellationToken);
    }

    // Provider-specific methods to be implemented by derived classes
    public abstract Task<bool> CanConnectAsync(string connectionString);
    public abstract Task<bool> DatabaseExistsAsync(BranchDbContext context);
    public abstract Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context);

    /// <summary>
    /// Helper method to validate required tables exist
    /// </summary>
    protected async Task<bool> ValidateRequiredTablesAsync(
        BranchDbContext context,
        string[] requiredTables,
        Func<BranchDbContext, Task<List<string>>> getTablesFunc)
    {
        try
        {
            var tables = await getTablesFunc(context);
            var missingTables = requiredTables.Where(t => !tables.Contains(t, StringComparer.OrdinalIgnoreCase)).ToList();

            if (missingTables.Any())
            {
                Logger.LogWarning("Missing required tables: {Tables}", string.Join(", ", missingTables));
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error validating schema integrity");
            return false;
        }
    }
}
