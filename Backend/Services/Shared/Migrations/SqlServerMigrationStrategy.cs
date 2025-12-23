using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Migrations;

public class SqlServerMigrationStrategy : BaseMigrationStrategy
{
    public SqlServerMigrationStrategy(ILogger<SqlServerMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.MSSQL;

    /// <summary>
    /// Override to create schema from model for SQL Server instead of using SQLite-based migrations
    /// </summary>
    public override async Task ApplyMigrationsAsync(BranchDbContext context, CancellationToken cancellationToken)
    {
        var appliedMigrations = await context.Database.GetAppliedMigrationsAsync(cancellationToken);

        // If fresh database, create schema from model
        if (!appliedMigrations.Any())
        {
            Logger.LogInformation("Fresh SQL Server database - creating schema from model");

            // Get all pending migrations that need to be applied
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync(cancellationToken);
            var migrationsList = pendingMigrations.ToList();

            if (migrationsList.Count == 0)
            {
                Logger.LogInformation("No migrations to apply");
                return;
            }

            // Get the script that creates all tables with proper SQL Server types
            var script = context.Database.GenerateCreateScript();

            // Split script by GO statements and execute each batch separately
            // GO is a batch separator used by SSMS, not a T-SQL command
            await ExecuteSqlScriptWithGoBatchesAsync(context, script, cancellationToken);

            // CRITICAL: Create __EFMigrationsHistory table and insert migration records
            await EnsureMigrationHistoryAsync(context, migrationsList, cancellationToken);

            Logger.LogInformation("Schema created successfully for SQL Server with {MigrationCount} migrations tracked", migrationsList.Count);
        }
        else
        {
            // For existing databases, use standard migrations
            await base.ApplyMigrationsAsync(context, cancellationToken);
        }
    }

    /// <summary>
    /// Executes a SQL script that may contain GO batch separators.
    /// Splits the script into batches and executes each one separately.
    /// </summary>
    private async Task ExecuteSqlScriptWithGoBatchesAsync(
        BranchDbContext context,
        string script,
        CancellationToken cancellationToken)
    {
        // Split script by GO statements (case-insensitive, must be on its own line)
        var batches = System.Text.RegularExpressions.Regex.Split(
            script,
            @"^\s*GO\s*$",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase |
            System.Text.RegularExpressions.RegexOptions.Multiline
        );

        var batchNumber = 0;
        foreach (var batch in batches)
        {
            var trimmedBatch = batch.Trim();

            // Skip empty batches
            if (string.IsNullOrWhiteSpace(trimmedBatch))
            {
                continue;
            }

            batchNumber++;
            Logger.LogDebug("Executing SQL batch {BatchNumber}/{TotalBatches}", batchNumber, batches.Length);

            try
            {
                await context.Database.ExecuteSqlRawAsync(trimmedBatch, cancellationToken);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to execute SQL batch {BatchNumber}: {Batch}",
                    batchNumber, trimmedBatch.Length > 200 ? trimmedBatch.Substring(0, 200) + "..." : trimmedBatch);
                throw;
            }
        }

        Logger.LogInformation("Successfully executed {BatchCount} SQL batches", batchNumber);
    }

    public override async Task<bool> CanConnectAsync(string connectionString)
    {
        try
        {
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            await connection.CloseAsync();
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Cannot connect to SQL Server database: {ConnectionString}", MaskConnectionString(connectionString));
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
        // Only validate core tables that exist from initial migration
        // Tables added by later migrations (DeliveryOrders, Zones, Tables) are optional
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
            "__EFMigrationsHistory"
        };

        return await ValidateRequiredTablesAsync(context, requiredTables, async ctx =>
        {
            var sql = @"
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
            ";
            var tables = await ctx.Database.SqlQueryRaw<string>(sql).ToListAsync();
            return tables;
        });
    }

    /// <summary>
    /// Ensures the __EFMigrationsHistory table exists and contains records for all applied migrations.
    /// This is critical for SQL Server databases created via GenerateCreateScript() to properly track migrations.
    /// </summary>
    private async Task EnsureMigrationHistoryAsync(
        BranchDbContext context,
        List<string> appliedMigrations,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Ensuring migration history table exists and is populated");

        // Create the __EFMigrationsHistory table if it doesn't exist
        var createHistoryTableSql = @"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__EFMigrationsHistory')
            BEGIN
                CREATE TABLE [__EFMigrationsHistory] (
                    [MigrationId] nvarchar(150) NOT NULL,
                    [ProductVersion] nvarchar(32) NOT NULL,
                    CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
                );
            END
        ";

        await context.Database.ExecuteSqlRawAsync(createHistoryTableSql, cancellationToken);
        Logger.LogInformation("__EFMigrationsHistory table created or already exists");

        // Get EF Core product version
        var productVersion = typeof(DbContext).Assembly.GetName().Version?.ToString() ?? "8.0.0";

        // Insert migration records for all migrations that were applied
        foreach (var migration in appliedMigrations)
        {
            var insertSql = @$"
                IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = '{migration}')
                BEGIN
                    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
                    VALUES ('{migration}', '{productVersion}');
                END
            ";

            await context.Database.ExecuteSqlRawAsync(insertSql, cancellationToken);
            Logger.LogDebug("Migration record inserted: {Migration}", migration);
        }

        Logger.LogInformation("Successfully inserted {Count} migration records into __EFMigrationsHistory", appliedMigrations.Count);
    }

    private string MaskConnectionString(string connectionString)
    {
        // Mask password in connection string for logging
        return System.Text.RegularExpressions.Regex.Replace(
            connectionString,
            @"(Password|Pwd)=([^;]+)",
            "$1=***",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase
        );
    }
}
