using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Shared;

/// <summary>
/// Service to ensure all branch databases are properly migrated
/// </summary>
public class BranchDatabaseMigrator
{
    private readonly HeadOfficeDbContext _headOfficeContext;
    private readonly DbContextFactory _dbContextFactory;
    private readonly ILogger<BranchDatabaseMigrator> _logger;

    public BranchDatabaseMigrator(
        HeadOfficeDbContext headOfficeContext,
        DbContextFactory dbContextFactory,
        ILogger<BranchDatabaseMigrator> logger
    )
    {
        _headOfficeContext = headOfficeContext;
        _dbContextFactory = dbContextFactory;
        _logger = logger;
    }

    /// <summary>
    /// Ensure a specific branch database has the latest schema
    /// </summary>
    public async Task EnsureBranchDatabaseSchemaAsync(Backend.Models.Entities.HeadOffice.Branch branch)
    {
        try
        {
            _logger.LogInformation("Ensuring database schema for branch {BranchCode}", branch.Code);

            using var branchContext = _dbContextFactory.CreateBranchContext(branch);

            // Ensure database exists
            await branchContext.Database.EnsureCreatedAsync();

            // Check if Users table exists, if not create it
            var createUsersSql = @"
                CREATE TABLE IF NOT EXISTS Users (
                    Id TEXT PRIMARY KEY NOT NULL,
                    Username TEXT NOT NULL,
                    PasswordHash TEXT NOT NULL,
                    Email TEXT NOT NULL,
                    FullNameEn TEXT NOT NULL,
                    FullNameAr TEXT NULL,
                    Phone TEXT NULL,
                    PreferredLanguage TEXT NOT NULL,
                    Role TEXT NOT NULL,
                    IsActive INTEGER NOT NULL,
                    LastLoginAt TEXT NULL,
                    LastActivityAt TEXT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NOT NULL,
                    CreatedBy TEXT NOT NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Username ON Users (Username);
                CREATE INDEX IF NOT EXISTS IX_Users_Email ON Users (Email);
                CREATE INDEX IF NOT EXISTS IX_Users_Role ON Users (Role);
                CREATE INDEX IF NOT EXISTS IX_Users_IsActive ON Users (IsActive);
                CREATE INDEX IF NOT EXISTS IX_Users_LastLoginAt ON Users (LastLoginAt);
            ";

            await branchContext.Database.ExecuteSqlRawAsync(createUsersSql);

            // Check if Sales table has UserId column
            var checkColumnSql = "SELECT COUNT(*) FROM pragma_table_info('Sales') WHERE name='UserId'";
            var hasColumn = await branchContext.Database.SqlQueryRaw<int>(checkColumnSql).FirstOrDefaultAsync();

            if (hasColumn == 0)
            {
                _logger.LogInformation("Adding UserId column to Sales table for branch {BranchCode}", branch.Code);

                var alterTableSql = @"
                    ALTER TABLE Sales ADD COLUMN UserId TEXT NULL;
                    CREATE INDEX IF NOT EXISTS IX_Sales_UserId ON Sales (UserId);
                ";
                await branchContext.Database.ExecuteSqlRawAsync(alterTableSql);
            }

            _logger.LogInformation("Branch database schema updated successfully for {BranchCode}", branch.Code);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring database schema for branch {BranchCode}", branch.Code);
        }
    }

    /// <summary>
    /// Ensure all branch databases have the latest schema
    /// </summary>
    public async Task EnsureAllBranchDatabasesAsync()
    {
        _logger.LogInformation("Starting branch database schema migration check");

        var branches = await _headOfficeContext.Branches
            .Where(b => b.IsActive)
            .ToListAsync();

        _logger.LogInformation("Found {Count} active branches to check", branches.Count);

        foreach (var branch in branches)
        {
            await EnsureBranchDatabaseSchemaAsync(branch);
        }

        _logger.LogInformation("Completed branch database schema migration check");
    }
}
