using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Migrations;

public class SqlServerMigrationStrategy : BaseMigrationStrategy
{
    public SqlServerMigrationStrategy(ILogger<SqlServerMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.MSSQL;

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
