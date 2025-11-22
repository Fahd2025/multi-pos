using Microsoft.EntityFrameworkCore;
using Backend.Models.Entities.HeadOffice;

namespace Backend.Data;

public class DbContextFactory
{
    private readonly Dictionary<Guid, DbContextOptions<BranchDbContext>> _branchContextCache;
    private readonly object _cacheLock = new object();

    public DbContextFactory()
    {
        _branchContextCache = new Dictionary<Guid, DbContextOptions<BranchDbContext>>();
    }

    public BranchDbContext CreateBranchContext(Branch branch)
    {
        DbContextOptions<BranchDbContext> options;

        lock (_cacheLock)
        {
            if (!_branchContextCache.TryGetValue(branch.Id, out options!))
            {
                options = BuildBranchContextOptions(branch);
                _branchContextCache[branch.Id] = options;
            }
        }

        return new BranchDbContext(options);
    }

    private DbContextOptions<BranchDbContext> BuildBranchContextOptions(Branch branch)
    {
        var builder = new DbContextOptionsBuilder<BranchDbContext>();

        var connectionString = BuildConnectionString(branch);

        switch (branch.DatabaseProvider)
        {
            case DatabaseProvider.SQLite:
                builder.UseSqlite(connectionString);
                break;

            case DatabaseProvider.MSSQL:
                builder.UseSqlServer(connectionString);
                break;

            case DatabaseProvider.PostgreSQL:
                builder.UseNpgsql(connectionString);
                break;

            case DatabaseProvider.MySQL:
                var serverVersion = ServerVersion.AutoDetect(connectionString);
                builder.UseMySql(connectionString, serverVersion);
                break;

            default:
                throw new NotSupportedException($"Database provider {branch.DatabaseProvider} is not supported");
        }

        return builder.Options;
    }

    private string BuildConnectionString(Branch branch)
    {
        return branch.DatabaseProvider switch
        {
            DatabaseProvider.SQLite =>
                $"Data Source={branch.DbServer}/{branch.DbName}.db",

            DatabaseProvider.MSSQL =>
                BuildMsSqlConnectionString(branch),

            DatabaseProvider.PostgreSQL =>
                BuildPostgreSqlConnectionString(branch),

            DatabaseProvider.MySQL =>
                BuildMySqlConnectionString(branch),

            _ => throw new NotSupportedException($"Database provider {branch.DatabaseProvider} is not supported")
        };
    }

    private string BuildMsSqlConnectionString(Branch branch)
    {
        var parts = new List<string>
        {
            $"Server={branch.DbServer},{branch.DbPort}",
            $"Database={branch.DbName}"
        };

        if (!string.IsNullOrEmpty(branch.DbUsername))
        {
            parts.Add($"User Id={branch.DbUsername}");
            parts.Add($"Password={branch.DbPassword}");
        }
        else
        {
            parts.Add("Integrated Security=true");
        }

        if (!string.IsNullOrEmpty(branch.DbAdditionalParams))
        {
            parts.Add(branch.DbAdditionalParams);
        }

        return string.Join(";", parts);
    }

    private string BuildPostgreSqlConnectionString(Branch branch)
    {
        var parts = new List<string>
        {
            $"Host={branch.DbServer}",
            $"Port={branch.DbPort}",
            $"Database={branch.DbName}",
            $"Username={branch.DbUsername}",
            $"Password={branch.DbPassword}"
        };

        if (!string.IsNullOrEmpty(branch.DbAdditionalParams))
        {
            parts.Add(branch.DbAdditionalParams);
        }

        return string.Join(";", parts);
    }

    private string BuildMySqlConnectionString(Branch branch)
    {
        var parts = new List<string>
        {
            $"Server={branch.DbServer}",
            $"Port={branch.DbPort}",
            $"Database={branch.DbName}",
            $"Uid={branch.DbUsername}",
            $"Pwd={branch.DbPassword}"
        };

        if (!string.IsNullOrEmpty(branch.DbAdditionalParams))
        {
            parts.Add(branch.DbAdditionalParams);
        }

        return string.Join(";", parts);
    }

    public void ClearCache(Guid? branchId = null)
    {
        lock (_cacheLock)
        {
            if (branchId.HasValue)
            {
                _branchContextCache.Remove(branchId.Value);
            }
            else
            {
                _branchContextCache.Clear();
            }
        }
    }
}
