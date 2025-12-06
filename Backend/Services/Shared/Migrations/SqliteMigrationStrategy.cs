using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

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
            "__EFMigrationsHistory"
        };

        return await ValidateRequiredTablesAsync(context, requiredTables, async ctx =>
        {
            var sql = "SELECT name FROM sqlite_master WHERE type='table'";
            var tables = await ctx.Database.SqlQueryRaw<string>(sql).ToListAsync();
            return tables;
        });
    }

    private string ExtractFilePathFromConnectionString(string connectionString)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);
        return builder.DataSource;
    }
}
