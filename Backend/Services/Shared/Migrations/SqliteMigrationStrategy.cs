using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Services.Shared.Migrations;

public class SqliteMigrationStrategy : BaseMigrationStrategy
{
    public SqliteMigrationStrategy(ILogger<SqliteMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.SQLite;

    public override async Task<bool> CanConnectAsync(string connectionString)
    {
        try
        {
            var filePath = ExtractFilePathFromConnectionString(connectionString);
            var directory = Path.GetDirectoryName(filePath);

            // Ensure directory exists and is writable
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);

                // Test write permissions
                var testFile = Path.Combine(directory, $".write_test_{Guid.NewGuid()}.tmp");
                await File.WriteAllTextAsync(testFile, "test");
                File.Delete(testFile);
            }

            return await Task.FromResult(true);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Cannot connect to SQLite database: {ConnectionString}", connectionString);
            return false;
        }
    }

    public override async Task<bool> DatabaseExistsAsync(BranchDbContext context)
    {
        try
        {
            return await context.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    public override async Task<bool> ValidateSchemaIntegrityAsync(BranchDbContext context)
    {
        var requiredTables = new[]
        {
            "Users",
            "Categories",
            "Products",
            "ProductImages",
            "Customers",
            "Suppliers",
            "Sales",
            "SaleLineItems",
            "Purchases",
            "PurchaseLineItems",
            "Expenses",
            "ExpenseCategories",
            "Settings",
            "SyncQueue",
            "InvoiceTemplates",
            "Drivers",
            "Units",
            "DeliveryOrders",
            "__EFMigrationsHistory"
        };

        return await ValidateRequiredTablesAsync(context, requiredTables, async ctx =>
        {
            var sql = "SELECT name FROM sqlite_master WHERE type='table'";
            var tables = await ctx.Database.SqlQueryRaw<string>(sql).ToListAsync();
            return tables;
        });
    }

    /// <summary>
    /// Override rollback for SQLite to handle foreign key constraints
    /// SQLite requires foreign keys to be disabled during schema changes in rollback
    /// </summary>
    public override async Task RollbackToMigrationAsync(BranchDbContext context, string? targetMigration, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Rolling back SQLite migration to {TargetMigration}", targetMigration ?? "(empty)");

        try
        {
            // Disable foreign key constraints for SQLite
            await context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;", cancellationToken);
            Logger.LogInformation("Disabled foreign key constraints for rollback");

            // Perform the rollback
            var serviceProvider = context.GetInfrastructure();
            var migrator = serviceProvider.GetService<Microsoft.EntityFrameworkCore.Migrations.IMigrator>();
            if (migrator == null)
            {
                throw new InvalidOperationException("Could not get IMigrator service");
            }

            await migrator.MigrateAsync(targetMigration, cancellationToken);

            Logger.LogInformation("Rollback completed successfully");
        }
        finally
        {
            // Re-enable foreign key constraints
            try
            {
                await context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON;", cancellationToken);
                Logger.LogInformation("Re-enabled foreign key constraints after rollback");
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to re-enable foreign key constraints after rollback");
                // Don't throw here - rollback already completed
            }
        }
    }

    private string ExtractFilePathFromConnectionString(string connectionString)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);
        return builder.DataSource;
    }
}
