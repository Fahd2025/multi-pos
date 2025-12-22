using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace Backend.Services.Shared.Migrations;

public class MySqlMigrationStrategy : BaseMigrationStrategy
{
    public MySqlMigrationStrategy(ILogger<MySqlMigrationStrategy> logger) : base(logger) { }

    public override DatabaseProvider Provider => DatabaseProvider.MySQL;

    public override async Task<bool> CanConnectAsync(string connectionString)
    {
        try
        {
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();
            await connection.CloseAsync();
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Cannot connect to MySQL database: {ConnectionString}", MaskConnectionString(connectionString));
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
                FROM information_schema.tables
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
            ";
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
