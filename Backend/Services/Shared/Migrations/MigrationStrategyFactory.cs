using Backend.Models.Entities.HeadOffice;

namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Factory for creating migration strategies based on database provider
/// </summary>
public class MigrationStrategyFactory
{
    private readonly IServiceProvider _serviceProvider;

    public MigrationStrategyFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    /// <summary>
    /// Get the appropriate migration strategy for the given database provider
    /// </summary>
    public IMigrationStrategy GetStrategy(DatabaseProvider provider)
    {
        return provider switch
        {
            DatabaseProvider.SQLite => _serviceProvider.GetRequiredService<SqliteMigrationStrategy>(),
            DatabaseProvider.MSSQL => _serviceProvider.GetRequiredService<SqlServerMigrationStrategy>(),
            DatabaseProvider.PostgreSQL => _serviceProvider.GetRequiredService<PostgreSqlMigrationStrategy>(),
            DatabaseProvider.MySQL => _serviceProvider.GetRequiredService<MySqlMigrationStrategy>(),
            _ => throw new NotSupportedException($"Database provider {provider} is not supported for migrations")
        };
    }
}
