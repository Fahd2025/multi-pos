using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Services.Shared.Migrations;

public class PostgreSqlMigrationStrategy : BaseMigrationStrategy
{
    public PostgreSqlMigrationStrategy(ILogger<PostgreSqlMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.PostgreSQL;

    public override async Task<bool> CanConnectAsync(string connectionString)
    {
        try
        {
            using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();
            await connection.CloseAsync();
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Cannot connect to PostgreSQL database: {ConnectionString}", MaskConnectionString(connectionString));
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
            var sql = @"
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ";
            // PostgreSQL stores table names in lowercase by default
            // Convert to lowercase for case-insensitive comparison
            var tables = await ctx.Database.SqlQueryRaw<string>(sql).ToListAsync();
            return tables;
        });
    }

    private string MaskConnectionString(string connectionString)
    {
        return System.Text.RegularExpressions.Regex.Replace(
            connectionString,
            @"(Password|Pwd)=([^;]+)",
            "$1=***",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase
        );
    }
}
